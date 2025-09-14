# incorporated catboost model


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
    user_df = user_df.copy()
    # Ensure all features exist
    for col in catboost_model.feature_names_:
        if col not in user_df.columns:
            user_df[col] = 'Unknown' if col in categorical_features else 0
    # Keep only required features in order
    user_df = user_df[catboost_model.feature_names_]
    # Fill missing values
    for col in categorical_features:
        user_df.loc[:, col] = user_df[col].fillna('Unknown').astype(str)
    for col in user_df.columns:
        if col not in categorical_features:
            user_df.loc[:, col] = user_df[col].fillna(user_df[col].median())
    return user_df

def get_catboost_prediction(user_df):
    """Return fraud prediction and probability from CatBoost."""
    X_processed = preprocess_input(user_df)
    prob = catboost_model.predict_proba(X_processed)[:, 1][0]  # probability of fraud
    pred = 'y' if prob >= 0.5 else 'n'
    return {"fraud_prediction": pred, "fraud_probability": float(prob)}

import os
import json
import base64
import requests

def load_file_as_base64(path: str) -> str:
    """Utility: load file as Base64 string (for images or PDFs)."""
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def analyze_claim_perplexity(
    claim_details: dict,
    catboost_result: dict,
    extra_docs: dict = None,
    model_name: str = "sonar",   # change if using OpenAI / Anthropic
    api_url: str = "https://api.perplexity.ai/chat/completions",
    api_key: str = None,
) -> dict:
    """
    Universal claim analysis with AI (supports text + images).

    Parameters:
        claim_details (dict): Claim info from user
        catboost_result (dict): Output of CatBoost fraud prediction
        extra_docs (dict): Optional supporting documents, e.g.:
            {
              "photo_with_plate": "path/to/image.png",
              "police_report": "path/to/report.pdf"
            }
        model_name (str): AI model to call ("sonar", "gpt-4o", etc.)
        api_url (str): API endpoint
        api_key (str): API key for the model

    Returns:
        dict: Parsed JSON response from AI
    """

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
        "EXTRA_DOCUMENTS": {}
    }

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": []}
    ]

    # always include text claim evidence
    messages[1]["content"].append({
        "type": "text",
        "text": json.dumps(evidence)
    })

    # attach extra docs (convert if needed)
    if extra_docs:
        for name, doc in extra_docs.items():
            if isinstance(doc, str) and os.path.exists(doc):
                mime_type = (
                    "image/png" if doc.lower().endswith((".png", ".jpg", ".jpeg")) else
                    "application/pdf" if doc.lower().endswith(".pdf") else
                    "application/octet-stream"
                )
                b64 = load_file_as_base64(doc)
                if mime_type.startswith("image/"):
                    messages[1]["content"].append({
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{b64}"}
                    })
                else:
                    evidence["EXTRA_DOCUMENTS"][name] = {
                        "filename": os.path.basename(doc),
                        "content": b64,
                        "type": mime_type
                    }
            else:
                evidence["EXTRA_DOCUMENTS"][name] = {"filename": name, "content": str(doc), "type": "text/plain"}

    headers = {
        "Authorization": f"Bearer {api_key or os.getenv('AI_API_KEY')}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model_name,
        "messages": messages,
        "temperature": 0.0,
        "max_tokens": 600
    }

    try:
        resp = requests.post(api_url, headers=headers, data=json.dumps(payload), timeout=30)
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
    phase1_check = analyze_claim_perplexity(
        user_data.iloc[0].to_dict(),
        catboost_result,
        api_key=PERPLEXITY_API_KEY  # or os.getenv("PERPLEXITY_API_KEY")
    )

    print("\nPhase 1 check:")
    print(json.dumps(phase1_check, indent=2))

    fraud_score_initial = phase1_check.get("fraud_score")

    # --- Decision logic ---
    if isinstance(fraud_score_initial, (int, float)) and fraud_score_initial <= LOW_THRESHOLD:
        # ✅ Very low fraud risk → Phase 1 is final
        print("\nFinal decision (Phase 1 sufficient):")
        print(json.dumps(phase1_check, indent=2))

    elif phase1_check.get("action") == "request_documents":
        # 📂 Phase 2: Provide supporting docs if requested
        extra_docs = {
            "photo_with_plate": "C:/Users/acqul/OneDrive/Desktop/Fraud/fraud/vehicle_front_plate.png",
            "service_bill": "C:/Users/acqul/OneDrive/Desktop/Fraud/fraud/service_invoice.png"
        }
        phase2_check = analyze_claim_perplexity(
            user_data.iloc[0].to_dict(),
            catboost_result,
            extra_docs=extra_docs,
            api_key=PERPLEXITY_API_KEY
        )

        # Remove follow-up questions for final verdict
        phase2_check["follow_up_questions"] = []

        print("\nPhase 2 check (with extra documents):")
        print(json.dumps(phase2_check, indent=2))

    else:
        # ⚖️ If AI gave a clear verdict in Phase 1 (accept/reject/escalate)
        print("\nFinal decision (Phase 1 verdict used):")
        print(json.dumps(phase1_check, indent=2))