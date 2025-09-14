import pandas as pd
from flask import Flask, request, jsonify
from logics import AutoInsuranceFraudDetector
from perpbot import get_catboost_prediction, analyze_claim_perplexity
import os

app = Flask(__name__)

# ---------------- HYBRID ANALYSIS ----------------
def hybrid_fraud_analysis(user_df):
    """
    Runs rule-based + ML-based hybrid fraud detection on a single claim
    and returns combined score.
    """
    # --- Step 1: Rule-based analysis ---
    detector = AutoInsuranceFraudDetector()
    detector.load_data(user_df).run_full_analysis()
    rule_scores = detector.fraud_scores

    if len(rule_scores) > 0:
        first_claim_id = list(rule_scores.keys())[0]
        rule_result = rule_scores[first_claim_id]
        rule_score = rule_result['score']
        risk_level = rule_result['risk_level']
        reasons = rule_result['reasons']
    else:
        rule_score = 0
        risk_level = "MINIMAL"
        reasons = []

    # --- Step 2: CatBoost prediction ---
    catboost_result = get_catboost_prediction(user_df)
    catboost_prob = catboost_result.get("fraud_probability", 0.0)

    # --- Step 3: Combined weighted score ---
    combined_score = (0.6 * (rule_score / 100) + 0.4 * catboost_prob) * 100
    combined_score = round(combined_score, 2)

    return {
        "fraud_score": combined_score,
        "risk_level": risk_level,
        "reasons": reasons,
        "catboost_result": catboost_result
    }

# ---------------- API ROUTE ----------------
@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        print(f"📩 Incoming request: {request.method} {request.content_type}")

        data = None

        if request.content_type and request.content_type.startswith("multipart/form-data"):
            # ✅ Handle FormData
            form_data = request.form.to_dict()
            print("📩 FORM DATA RECEIVED:", form_data)

            # Optional: handle uploaded file
            claim_image = request.files.get("claim_image")
            if claim_image:
                upload_dir = "uploads"
                os.makedirs(upload_dir, exist_ok=True)
                file_path = os.path.join(upload_dir, claim_image.filename)
                claim_image.save(file_path)
                form_data["claim_image_path"] = file_path

            data = form_data

        else:
            # ✅ Handle JSON request
            data = request.get_json(force=True, silent=True)
            print("📩 JSON DATA RECEIVED:", data)

        if not data:
            print("⚠️ No valid input data provided.")
            return jsonify({"error": "No input data provided"}), 400

        # Convert to DataFrame
        df = pd.DataFrame([data])

        # ✅ STEP 1: Convert numeric fields safely
        numeric_fields = [
            "months_as_customer", "age", "policy_deductable", "policy_annual_premium",
            "umbrella_limit", "capital_gains", "capital_loss", "incident_hour_of_the_day",
            "number_of_vehicles_involved", "bodily_injuries", "witnesses",
            "total_claim_amount", "injury_claim", "property_claim", "vehicle_claim",
            "auto_year",
        ]
        for col in numeric_fields:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        # ✅ STEP 2: Ensure categorical columns are strings
        for col in df.columns:
            if col not in numeric_fields:
                df[col] = df[col].astype(str).replace({"nan": None})

        # ✅ STEP 3: Run hybrid analysis
        result = hybrid_fraud_analysis(df)

        # ✅ STEP 4: Optional AI reasoning
        phase1_check = analyze_claim_perplexity(
            df.iloc[0].to_dict(),
            result["catboost_result"]
        )

        response = {
            "hybrid_result": result,
            "ai_check": phase1_check
        }

        print("✅ RESPONSE:", response)
        return jsonify(response)

    except Exception as e:
        print("🔥 SERVER ERROR 🔥")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ---------------- MAIN ----------------
if __name__ == "__main__":
    app.run(debug=True)
