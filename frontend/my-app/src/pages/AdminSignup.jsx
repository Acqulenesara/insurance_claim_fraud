import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

function AdminSignup() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Store admin data in Firestore
      await setDoc(doc(db, 'admins', userCredential.user.uid), {
        username: formData.username,
        email: formData.email,
        role: 'admin',
        createdAt: new Date()
      });
      
      alert("Admin account created successfully!");
      navigate("/admin-login");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
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
          width: "380px",
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
        <h2 className="text-center fw-bold mb-4">Admin Signup</h2>

        {error && (
          <div className="alert alert-danger" style={{ fontSize: "12px", padding: "8px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              className="form-control"
              style={{ background: "#fff", color: "#000" }}
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>
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
            <label className="form-label">Password</label>
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
            {loading ? "Creating Account..." : "Sign Up"}
          </motion.button>
        </form>

        <div className="text-center mt-3">
          <span
            style={{ cursor: "pointer", color: "#00c6ff" }}
            onClick={() => navigate("/admin-login")}
          >
            Already have an account? Login
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AdminSignup;