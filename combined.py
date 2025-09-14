import pandas as pd
from flask import Flask, request, jsonify
from logics import AutoInsuranceFraudDetector
from perpbot import get_catboost_prediction, analyze_claim_perplexity
import os
from datetime import datetime
import hashlib

# Firebase imports
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase (only if not already initialized)
if not firebase_admin._apps:
    try:
        # Try to load from environment or use default path
        cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH', 'insurance-fraud-detectio-a6526-firebase-adminsdk-fbsvc-9a0f74002a.json')
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase initialized successfully")
    except Exception as e:
        print(f"⚠️ Firebase initialization warning: {e}")

app = Flask(__name__)

# Initialize Firestore client
try:
    db = firestore.client()
except:
    db = None
    print("⚠️ Firestore client not available")

def generate_analysis_id(claim_data):
    """Generate unique analysis ID"""
    data_string = f"{claim_data.get('policy_number', '')}{claim_data.get('incident_date', '')}{datetime.now().isoformat()}"
    hash_object = hashlib.md5(data_string.encode())
    return f"ANALYSIS_{hash_object.hexdigest()[:12].upper()}"

def save_to_fraud_analyses(claim_data, hybrid_result, ai_check):
    """Save detailed analysis results to fraud_analyses collection"""
    if not db:
        print("⚠️ Database not available, skipping fraud_analyses save")
        return None
    
    try:
        analysis_id = generate_analysis_id(claim_data)
        
        # Create comprehensive analysis document
        analysis_doc = {
            # IDs and timestamps
            'analysis_id': analysis_id,
            'claim_reference': claim_data.get('policy_number', 'unknown'),
            'analysis_timestamp': datetime.now(),
            'processing_time_ms': 0,
            
            # User Information - THIS IS THE KEY UPDATE
            'user_id': claim_data.get('user_id', 'unknown'),
            'user_email': claim_data.get('user_email', 'unknown'),
            'user_name': claim_data.get('user_name', claim_data.get('user_email', 'unknown')),
            
            # Basic claim info for reference
            'policy_number': claim_data.get('policy_number', ''),
            'total_claim_amount': float(claim_data.get('total_claim_amount', 0)),
            'incident_type': claim_data.get('incident_type', ''),
            'incident_date': claim_data.get('incident_date', ''),
            'incident_city': claim_data.get('incident_city', ''),
            'incident_state': claim_data.get('incident_state', ''),
            'incident_severity': claim_data.get('incident_severity', ''),
            'auto_make': claim_data.get('auto_make', ''),
            'auto_model': claim_data.get('auto_model', ''),
            'auto_year': int(claim_data.get('auto_year', 0)) if claim_data.get('auto_year') else None,
            'insured_zip': claim_data.get('insured_zip', ''),
            'insured_occupation': claim_data.get('insured_occupation', ''),
            'collision_type': claim_data.get('collision_type', ''),
            'property_damage': claim_data.get('property_damage', ''),
            'bodily_injuries': int(claim_data.get('bodily_injuries', 0)) if claim_data.get('bodily_injuries') else 0,
            'witnesses': int(claim_data.get('witnesses', 0)) if claim_data.get('witnesses') else 0,
            'police_report_available': claim_data.get('police_report_available', ''),
            'claim_description': claim_data.get('claim_description', ''),
            
            # ML Analysis Results
            'rule_based_score': hybrid_result.get('fraud_score', 0),
            'catboost_probability': hybrid_result.get('catboost_result', {}).get('fraud_probability', 0),
            'catboost_prediction': hybrid_result.get('catboost_result', {}).get('fraud_prediction', 'n'),
            'catboost_confidence': hybrid_result.get('catboost_result', {}).get('confidence', 0),
            'combined_score': hybrid_result.get('fraud_score', 0),
            
            # AI Analysis Results
            'ai_fraud_score': ai_check.get('fraud_score', hybrid_result.get('fraud_score', 0)),
            'ai_explanation': ai_check.get('explanation', 'No explanation available'),
            'ai_action': ai_check.get('action', 'request_documents'),
            'ai_confidence': ai_check.get('confidence', 0.5),
            'ai_reasoning': ai_check.get('reasoning', ''),
            'ai_recommendation': ai_check.get('recommendation', ''),
            
            # Risk Assessment
            'risk_level': hybrid_result.get('risk_level', 'MEDIUM'),
            'risk_factors': hybrid_result.get('reasons', []),
            'key_risk_factors': ai_check.get('key_risk_factors', []),
            'red_flags': ai_check.get('red_flags', []),
            
            # Recommendations
            'follow_up_questions': ai_check.get('follow_up_questions', []),
            'recommendations': ai_check.get('recommendations', []),
            
            # Status and Review
            'status': 'Under Review',
            'requires_review': ai_check.get('action', 'request_documents') in ['escalate_investigation', 'reject'],
            'reviewed_at': None,
            'review_notes': '',
            'created_at': datetime.now(),
            'updated_at': datetime.now(),
            
            # Technical details
            'model_version': '1.0',
            'analysis_method': 'hybrid_ml_ai'
        }
        
        # Save to fraud_analyses collection
        doc_ref = db.collection('fraud_analyses').document(analysis_id)
        doc_ref.set(analysis_doc)
        
        print(f"✅ Analysis saved to fraud_analyses: {analysis_id}")
        return analysis_id
        
    except Exception as e:
        print(f"❌ Error saving to fraud_analyses: {e}")
        return None

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

        # ✅ STEP 4: AI reasoning
        phase1_check = analyze_claim_perplexity(
            df.iloc[0].to_dict(),
            result["catboost_result"]
        )

        # ✅ STEP 5: Save to fraud_analyses collection with user info
        analysis_id = save_to_fraud_analyses(data, result, phase1_check)

        # ✅ STEP 6: Prepare response with analysis ID
        response = {
            "hybrid_result": result,
            "ai_check": phase1_check,
            "analysis_id": analysis_id,
            "timestamp": datetime.now().isoformat()
        }

        print("✅ RESPONSE:", response)
        return jsonify(response)

    except Exception as e:
        print("🔥 SERVER ERROR 🔥")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ---------------- ADDITIONAL API ENDPOINTS ----------------
@app.route("/api/analysis/<analysis_id>", methods=["GET"])
def get_analysis(analysis_id):
    """Get specific analysis result"""
    try:
        if not db:
            return jsonify({"error": "Database not available"}), 503
            
        doc_ref = db.collection('fraud_analyses').document(analysis_id)
        doc = doc_ref.get()
        
        if doc.exists:
            analysis_data = doc.to_dict()
            # Convert timestamp to string if it exists
            for date_field in ['analysis_timestamp', 'created_at', 'updated_at', 'reviewed_at']:
                if date_field in analysis_data and analysis_data[date_field]:
                    analysis_data[date_field] = analysis_data[date_field].isoformat()
            return jsonify(analysis_data)
        else:
            return jsonify({"error": "Analysis not found"}), 404
            
    except Exception as e:
        print(f"❌ Error retrieving analysis: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/high-risk-claims", methods=["GET"])
def get_high_risk_claims():
    """Get all high-risk claims"""
    try:
        if not db:
            return jsonify({"error": "Database not available"}), 503
            
        threshold = float(request.args.get('threshold', 70.0))
        
        analyses_ref = db.collection('fraud_analyses')
        query = analyses_ref.where('combined_score', '>=', threshold).limit(50)
        docs = query.stream()
        
        high_risk_claims = []
        for doc in docs:
            data = doc.to_dict()
            for date_field in ['analysis_timestamp', 'created_at', 'updated_at', 'reviewed_at']:
                if date_field in data and data[date_field]:
                    data[date_field] = data[date_field].isoformat()
            high_risk_claims.append(data)
        
        return jsonify({
            "high_risk_claims": high_risk_claims,
            "count": len(high_risk_claims),
            "threshold": threshold
        })
        
    except Exception as e:
        print(f"❌ Error retrieving high-risk claims: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/fraud-analyses", methods=["GET"])
def get_all_fraud_analyses():
    """Get all fraud analyses for claims list"""
    try:
        if not db:
            return jsonify({"error": "Database not available"}), 503
            
        analyses_ref = db.collection('fraud_analyses')
        docs = analyses_ref.order_by('created_at', direction=firestore.Query.DESCENDING).limit(100).stream()
        
        analyses = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id  # Add document ID
            
            # Convert timestamps to strings
            for date_field in ['analysis_timestamp', 'created_at', 'updated_at', 'reviewed_at']:
                if date_field in data and data[date_field]:
                    data[date_field] = data[date_field].isoformat()
            
            analyses.append(data)
        
        return jsonify({
            "analyses": analyses,
            "count": len(analyses)
        })
        
    except Exception as e:
        print(f"❌ Error retrieving fraud analyses: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/fraud-analyses/<analysis_id>/status", methods=["PUT"])
def update_analysis_status(analysis_id):
    """Update analysis status and review notes"""
    try:
        if not db:
            return jsonify({"error": "Database not available"}), 503
            
        data = request.get_json()
        new_status = data.get('status')
        review_notes = data.get('review_notes', '')
        
        if not new_status:
            return jsonify({"error": "Status is required"}), 400
            
        doc_ref = db.collection('fraud_analyses').document(analysis_id)
        update_data = {
            'status': new_status,
            'updated_at': datetime.now(),
            'reviewed_at': datetime.now(),
            'review_notes': review_notes
        }
        
        doc_ref.update(update_data)
        
        return jsonify({
            "message": f"Analysis {analysis_id} status updated to {new_status}",
            "analysis_id": analysis_id,
            "status": new_status
        })
        
    except Exception as e:
        print(f"❌ Error updating analysis status: {e}")
        return jsonify({"error": str(e)}), 500

# ---------------- MAIN ----------------
if __name__ == "__main__":
    app.run(debug=True)