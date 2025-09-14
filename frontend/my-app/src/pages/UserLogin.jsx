import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

function UserLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/upload-claim");
    } catch (error) {
      setError("Invalid email or password");
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
          width: "340px",
          minHeight: "260px",
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
        <h2 className="text-center fw-bold mb-4">Customer Login</h2>

        {error && (
          <div className="alert alert-danger" style={{ fontSize: "12px", padding: "8px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              style={{ background: "#fff", color: "#000" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              style={{ background: "#fff", color: "#000" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
            {loading ? "Logging in..." : "Login"}
          </motion.button>
        </form>

        <div className="text-center mt-3">
          <span
            style={{ cursor: "pointer", color: "#00c6ff" }}
            onClick={() => navigate("/customer-registration")}
          >
            Don't have an account? Register
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default UserLogin;