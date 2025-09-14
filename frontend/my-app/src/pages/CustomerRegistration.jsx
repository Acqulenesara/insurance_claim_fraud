import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

function CustomerRegistration() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Store customer data in Firestore
      await setDoc(doc(db, 'customers', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        role: 'customer',
        createdAt: new Date()
      });
      
      setMessage("✅ Customer Registered Successfully! You can now login.");
      setTimeout(() => {
        navigate("/user-login");
      }, 2000);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex justify-center items-center py-4"
      style={{ background: "linear-gradient(135deg, #141E30, #243B55)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        className="shadow-lg rounded-lg w-full max-w-md mx-4"
        style={{
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
        <h2 className="text-center font-bold text-xl mb-6">Customer Registration</h2>

        {error && (
          <div style={{
            background: "rgba(255, 0, 0, 0.1)",
            border: "1px solid rgba(255, 0, 0, 0.3)",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "15px",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            background: "rgba(0, 255, 0, 0.1)",
            border: "1px solid rgba(0, 255, 0, 0.3)",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "15px",
            fontSize: "14px"
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Full Name</label><br />
            <input
              type="text"
              name="name"
              className="form-control"
              style={{ background: "#fff", color: "#000" }}
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label><br />
            <input
              type="email"
              name="email"
              className="form-control"
              style={{ background: "#fff", color: "#000" }}
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label><br />
            <input
              type="password"
              name="password"
              className="form-control"
              style={{ background: "#fff", color: "#000" }}
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Phone</label><br />
            <input
              type="tel"
              name="phone"
              className="form-control"
              style={{ background: "#fff", color: "#000" }}
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Address</label><br />
            <input
              type="text"
              name="address"
              className="form-control"
              style={{ background: "#fff", color: "#000" }}
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          
          <br />
          <motion.button
            type="submit"
            disabled={loading}
            className="btn w-100 fw-bold rounded-pill py-3"
            style={{
              background: loading ? "#666" : "linear-gradient(90deg, #00c6ff, #0072ff)",
              border: "none",
              color: "#fff",
            }}
            whileHover={!loading ? { scale: 1.05 } : {}}
          >
            {loading ? "Registering..." : "Register"}
            
          </motion.button>
        </form>
        
        <br />
        <div className="text-center mt-3">
          <span
            style={{ cursor: "pointer", color: "#00c6ff" }}
            onClick={() => navigate("/user-login")}
          >
            Already have an account? Login
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default CustomerRegistration;