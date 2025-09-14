import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase"; // Import Firebase
import { collection, addDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function ClaimUpload() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  const [formData, setFormData] = useState({
    months_as_customer: "",
    age: "",
    policy_number: "",
    policy_bind_date: "",
    policy_state: "",
    policy_csl: "",
    policy_deductable: "",
    policy_annual_premium: "",
    umbrella_limit: "",
    insured_zip: "",
    insured_sex: "",
    insured_education_level: "",
    insured_occupation: "",
    insured_hobbies: "",
    insured_relationship: "",
    capital_gains: "",
    capital_loss: "",
    incident_date: "",
    incident_type: "",
    collision_type: "",
    incident_severity: "",
    authorities_contacted: "",
    incident_state: "",
    incident_city: "",
    incident_location: "",
    incident_hour_of_the_day: "",
    number_of_vehicles_involved: "",
    property_damage: "",
    bodily_injuries: "",
    witnesses: "",
    police_report_available: "",
    total_claim_amount: "",
    injury_claim: "",
    property_claim: "",
    vehicle_claim: "",
    auto_make: "",
    auto_model: "",
    auto_year: "",
    claim_description: "",
    claim_image: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email
        });
      } else {
        // Redirect to login if not authenticated
        navigate("/user-login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert("Please log in to submit a claim.");
      navigate("/user-login");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Send data to ML backend
      const form = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== "") {
          form.append(key, formData[key]);
        }
      });
      
      // Add user information to the request
      form.append("user_id", currentUser.uid);
      form.append("user_email", currentUser.email);

      const res = await axios.post("http://127.0.0.1:5000/api/predict", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Step 2: Save to Firebase with ML results and user mapping
      const claimData = {
        // User Information
        user_id: currentUser.uid,
        user_email: currentUser.email,
        user_name: currentUser.displayName,
        
        // Form Data
        ...formData,
        claim_image: formData.claim_image ? formData.claim_image.name : null,
        
        // AI Analysis Results
        fraud_score: res.data.hybrid_result?.fraud_score || 0,
        risk_level: res.data.hybrid_result?.risk_level || "MINIMAL",
        fraud_reasons: res.data.hybrid_result?.reasons || [],
        
        // CatBoost Results
        catboost_fraud_probability: res.data.hybrid_result?.catboost_result?.fraud_probability || 0,
        catboost_prediction: res.data.hybrid_result?.catboost_result?.prediction || "Not Fraud",
        catboost_confidence: res.data.hybrid_result?.catboost_result?.confidence || 0,
        
        // AI Perplexity Analysis
        ai_action: res.data.ai_check?.action || "APPROVE",
        ai_reasoning: res.data.ai_check?.reasoning || "",
        ai_confidence_score: res.data.ai_check?.confidence_score || 0,
        ai_red_flags: res.data.ai_check?.red_flags || [],
        ai_recommendation: res.data.ai_check?.recommendation || "",
        
        // Metadata
        created_at: new Date(),
        updated_at: new Date(),
        status: "Under Review"
      };

      const docRef = await addDoc(collection(db, "claims"), claimData);
      console.log("Claim saved with ID: ", docRef.id);

      // Step 3: Navigate to success page with results
      navigate("/claim-success", { 
        state: { 
          result: res.data, 
          claimId: docRef.id,
          error: false 
        } 
      });

    } catch (err) {
      console.error("Error:", err);

      // Save basic claim data even if ML fails
      try {
        const basicClaimData = {
          // User Information
          user_id: currentUser.uid,
          user_email: currentUser.email,
          user_name: currentUser.displayName,
          
          // Form Data
          ...formData,
          claim_image: formData.claim_image ? formData.claim_image.name : null,
          
          // Default AI Results
          fraud_score: 0,
          risk_level: "PENDING",
          ai_action: "MANUAL_REVIEW",
          ai_reasoning: "Automated analysis failed - requires manual review",
          
          // Metadata
          created_at: new Date(),
          updated_at: new Date(),
          status: "Pending Manual Review",
          error: "ML analysis failed"
        };

        const docRef = await addDoc(collection(db, "claims"), basicClaimData);
        
        navigate("/claim-success", {
          state: {
            error: true,
            claimId: docRef.id,
            message: "⚠️ There was an issue with automated analysis. Our team will review manually.",
          },
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        navigate("/claim-success", {
          state: {
            error: true,
            message: "⚠️ There was an issue submitting your claim. Please try again.",
          },
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputFields = Object.keys(formData);

  if (!currentUser) {
    return (
      <motion.div
        className="vh-100 d-flex justify-content-center align-items-center"
        style={{ background: "linear-gradient(135deg, #141E30, #243B55)" }}
      >
        <div className="text-center text-white">
          <h3>Loading...</h3>
          <p>Please wait while we verify your authentication.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="vh-100 d-flex justify-content-center align-items-center"
      style={{ background: "linear-gradient(135deg, #141E30, #243B55)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        className="shadow-lg rounded-4"
        style={{
          width: "500px",
          padding: "2rem",
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(12px)",
          color: "#fff",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div className="text-center mb-4">
          <h2 className="fw-bold">Upload Claim</h2>
          <p className="small">Logged in as: {currentUser.email}</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {inputFields.map((field) => (
            <div key={field} style={{ marginBottom: "16px" }}>
              <label className="d-block fw-semibold">
                {field.replace(/_/g, " ")}
              </label>
              {field === "claim_image" ? (
                <input
                  type="file"
                  name={field}
                  onChange={handleChange}
                  accept="image/*"
                  style={{
                    width: "100%",
                    background: "#fff",
                    border: "1px solid #ccc",
                    color: "#000",
                    padding: "7px",
                    borderRadius: "3px",
                  }}
                />
              ) : (
                <input
                  type="text"
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    background: "#fff",
                    border: "1px solid #ccc",
                    color: "#000",
                    padding: "7px",
                    borderRadius: "3px",
                  }}
                />
              )}
            </div>
          ))}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="btn w-100 fw-bold rounded-pill py-2"
            style={{
              background: isSubmitting 
                ? "linear-gradient(90deg, #6c757d, #495057)" 
                : "linear-gradient(90deg, #00c6ff, #0072ff)",
              border: "none",
              color: "#fff",
            }}
            whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
          >
            {isSubmitting ? "Submitting..." : "Submit Claim"}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default ClaimUpload;