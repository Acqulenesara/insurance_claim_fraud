import { useState } from "react";
import { motion } from "framer-motion";

function ClaimUpload() {
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
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === "file" ? files[0] : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simple validation
    if (!formData.claim_description && !formData.claim_image) {
      setMessage("⚠️ Please enter claim details or upload an image.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    setTimeout(() => {
      setMessage("✅ Claim submitted successfully!");
      setFormData({
        ...Object.fromEntries(Object.keys(formData).map((key) => [key, ""])),
        claim_image: null,
      });
      setIsSubmitting(false);
    }, 1500);
  };

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
          width: "420px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "2rem",
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(12px)",
          color: "#fff",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.5)",
        }}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <h2 className="text-center fw-bold" style={{ marginBottom: "20px" }}>
          Upload Claim
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Example fields */}
          {[
            "months_as_customer",
            "age",
            "policy_number",
            "policy_bind_date",
            "policy_state",
            "policy_csl",
            "policy_deductable",
            "policy_annual_premium",
            "umbrella_limit",
            "insured_zip",
            "insured_sex",
            "insured_education_level",
            "insured_occupation",
            "insured_hobbies",
            "insured_relationship",
            "capital_gains",
            "capital_loss",
            "incident_date",
            "incident_type",
            "collision_type",
            "incident_severity",
            "authorities_contacted",
            "incident_state",
            "incident_city",
            "incident_location",
            "incident_hour_of_the_day",
            "number_of_vehicles_involved",
            "property_damage",
            "bodily_injuries",
            "witnesses",
            "police_report_available",
            "total_claim_amount",
            "injury_claim",
            "property_claim",
            "vehicle_claim",
            "auto_make",
            "auto_model",
            "auto_year",
          ].map((field) => (
            <div key={field} style={{ marginBottom: "16px" }}>
              <label
                className="d-block fw-semibold"
                style={{ fontSize: "13px", marginBottom: "6px" }}
              >
                {field.replace(/_/g, " ")}
              </label>
              <input
                type="text"
                name={field}
                value={formData[field]}
                onChange={handleChange}
                style={{
                  width: "98%",
                  background: "#fff",
                  border: "1px solid #ccc",
                  color: "#000",
                  padding: "7px",
                  borderRadius: "3px",
                }}
              />
            </div>
          ))}

          {/* Claim Description */}
          <div style={{ marginBottom: "18px" }}>
            <label
              className="d-block fw-semibold"
              style={{ fontSize: "13px", marginBottom: "8px" }}
            >
              Claim Description
            </label>
            <textarea
              rows="4"
              name="claim_description"
              value={formData.claim_description}
              onChange={handleChange}
              style={{
                width: "98%",
                background: "#fff",
                border: "1px solid #ccc",
                color: "#000",
                padding: "7px",
                borderRadius: "3px",
              }}
              placeholder="Enter claim details"
            />
          </div>

          {/* Claim Image */}
          <div style={{ marginBottom: "18px" }}>
            <label
              className="d-block fw-semibold"
              style={{ fontSize: "13px", marginBottom: "8px" }}
            >
              Upload Image
            </label>
            <input
              type="file"
              name="claim_image"
              accept="image/*"
              onChange={handleChange}
              style={{
                width: "98%",
                background: "#fff",
                border: "1px solid #ccc",
                color: "#000",
                padding: "6px",
                borderRadius: "3px",
              }}
            />
            {formData.claim_image && (
              <p
                className="fw-semibold"
                style={{
                  fontSize: "12px",
                  marginTop: "6px",
                  color: "#00c6ff",
                }}
              >
                Selected file: {formData.claim_image.name}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="btn w-100 fw-bold rounded-pill py-2"
            style={{
              background: "linear-gradient(90deg, #00c6ff, #0072ff)",
              border: "none",
              color: "#fff",
              fontSize: "14px",
              letterSpacing: "1px",
              marginTop: "10px",
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 20px rgba(0, 114, 255, 0.6)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            {isSubmitting ? "Submitting..." : "Submit Claim"}
          </motion.button>
        </form>

        {/* Status Message */}
        {message && (
          <p
            style={{
              marginTop: "15px",
              textAlign: "center",
              fontSize: "13px",
              color: message.includes("success") ? "#4caf50" : "#ff4d4d",
            }}
          >
            {message}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

export default ClaimUpload;
