import pandas as pd
import joblib
import json
import requests
import os

# ---------------- CONFIG ----------------
LOW_THRESHOLD = 10    # Skip final check if fraud_score <= LOW_THRESHOLD
HIGH_THRESHOLD = 70   # If fraud_score >= HIGH_THRESHOLD, remove follow-up questions
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")

# ---------------- LOAD MODELS ----------------
catboost_model = joblib.load("models/catboost_model.pkl")
categorical_features = joblib.load("models/categorical_features.pkl")

# ---------------- HELPER FUNCTIONS ----------------
def preprocess_input(user_df):
    """Safe preprocessing for CatBoost input."""
    df = user_df.copy()

    # Ensure all model features exist
    for col in catboost_model.feature_names_:
        if col not in df.columns:
            df[col] = 'Unknown' if col in categorical_features else 0

    # Keep only features required by the model
    df = df[catboost_model.feature_names_]

    # Fill categorical columns with 'Unknown' and ensure string type
    for col in categorical_features:
        if col in df.columns:
            df[col] = df[col].fillna('Unknown').astype(str)

    # Fill numeric columns with median safely
    numeric_cols = [col for col in df.columns if col not in categorical_features]
    for col in numeric_cols:
        if df[col].dtype.kind in 'biufc':  # check if numeric
            df[col] = df[col].fillna(df[col].median())
        else:
            # If the column is accidentally non-numeric, fill with 0
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    return df

def get_catboost_prediction(user_df):
    """Return fraud prediction and probability from CatBoost."""
    X_processed = preprocess_input(user_df)
    prob = catboost_model.predict_proba(X_processed)[:, 1][0]  # probability of fraud
    pred = 'y' if prob >= 0.5 else 'n'
    return {"fraud_prediction": pred, "fraud_probability": float(prob)}

def analyze_claim_perplexity(claim_details, catboost_result, extra_docs=None):
    """Call Perplexity AI for fraud analysis (without CNN)."""
    system_prompt = """
You are an expert insurance fraud investigation assistant.

You receive:
- Claim details (reported by user)
- CatBoost fraud prediction
- Extra documents (photos, FIR, receipts, etc.)

Your tasks:
1. Decide if current information is enough to conclude fraud analysis.
   - If enough → give fraud_score (0-100), explanation, and action.
   - If not enough → set action = "request_documents" and ask for at most two specific, useful extra proofs.
2. Extra questions must directly help conclude the claim’s validity.
3. After extra documents are provided, always give the FINAL fraud score and action.
4. Fraud score scale: 0 = clearly genuine, 100 = very likely fraud.

Output strictly in JSON with this schema:
{
  "fraud_score": number or null,
  "explanation": string,
  "action": one of ["accept", "request_documents", "escalate_investigation", "reject"],
  "follow_up_questions": [ up to 2 short strings ]
}
"""
    evidence = {
        "CLAIM_DETAILS": claim_details,
        "CATBOOST_RESULT": catboost_result,
        "EXTRA_DOCUMENTS": extra_docs or {}
    }

    url = "https://api.perplexity.ai/chat/completions"
    headers = {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "sonar",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": json.dumps(evidence)}
        ],
        "temperature": 0.0,
        "max_tokens": 600
    }

    try:
        resp = requests.post(url, headers=headers, data=json.dumps(data), timeout=30)
        resp.raise_for_status()
        result = resp.json()
        content = result.get("choices", [])[0].get("message", {}).get("content")
        if not content:
            raise ValueError("No assistant content returned")
        return json.loads(content)
    except Exception as e:
        return {
            "fraud_score": None,
            "explanation": f"Failed to get response from AI: {str(e)}",
            "action": "escalate_investigation",
            "follow_up_questions": []
        }

# ---------------- MAIN ----------------
if __name__ == "__main__":
    print("Enter insurance claim details below:")
    claimant_name = input("Claimant Name: ").strip()
    vehicle_reg = input("Vehicle Registration: ").strip()
    reported_damage = input("Reported Damage: ").strip()
    claim_amount = float(input("Claim Amount: ").strip())

    user_data = pd.DataFrame([{
        "claimant_name": claimant_name,
        "vehicle_registration": vehicle_reg,
        "reported_damage": reported_damage,
        "claim_amount": claim_amount
    }])

    # --- CatBoost Prediction ---
    catboost_result = get_catboost_prediction(user_data)
    print("\nCatBoost prediction:", catboost_result)

    # --- Phase 1: Initial analysis ---
    phase1_check = analyze_claim_perplexity(user_data.iloc[0].to_dict(), catboost_result)
    print("\nPhase 1 check:")
    print(json.dumps(phase1_check, indent=2))

    fraud_score_initial = phase1_check.get("fraud_score")
    # Skip Phase 2 if extremely low fraud
    if isinstance(fraud_score_initial, (int, float)) and fraud_score_initial <= LOW_THRESHOLD:
        print("\nFinal decision (Phase 1 sufficient):")
        print(json.dumps(phase1_check, indent=2))
    else:
        # Simulate extra docs for Phase 2 if model requests documents
        if phase1_check.get("action") == "request_documents":
            extra_docs = {
                "photo_with_plate": "vehicle_front_plate.jpg",
                "service_bill": "service_invoice.pdf"
            }
            phase2_check = analyze_claim_perplexity(
                user_data.iloc[0].to_dict(),
                catboost_result,
                extra_docs=extra_docs
            )
            # Remove follow-up questions entirely in Phase 2
            phase2_check["follow_up_questions"] = []

            print("\nPhase 2 check (with extra documents):")
            print(json.dumps(phase2_check, indent=2))
