import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function ClaimUpload() {
  const navigate = useNavigate();

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

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const form = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null) {
          form.append(key, formData[key]);
        }
      });

      const res = await axios.post("http://127.0.0.1:5000/api/predict", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // ✅ Navigate to success page with result
      navigate("/claim-success", { state: { result: res.data, error: false } });

    } catch (err) {
      console.error(err);

      // ✅ Navigate to success page even if there's an error
      navigate("/claim-success", {
        state: {
          error: true,
          message: "⚠ There was an issue submitting your claim. Our team will review manually.",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputFields = Object.keys(formData);

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
        <h2 className="text-center fw-bold">Upload Claim</h2>
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
              background: "linear-gradient(90deg, #00c6ff, #0072ff)",
              border: "none",
              color: "#fff",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSubmitting ? "Submitting..." : "Submit Claim"}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default ClaimUpload;
