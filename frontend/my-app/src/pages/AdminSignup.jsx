import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function AdminSignup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate("/user-login"); 
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
        <h2 className="text-center fw-bold" style={{ marginBottom: "20px", textAlign: "center"  }}>
          SignUp
        </h2>

        <form onSubmit={handleLogin}>
          {/* Username */}
          <div style={{ marginBottom: "18px" }}>
            <label
              className="d-block fw-semibold"
              style={{ fontSize: "13px", marginBottom: "12px" }} // ⬅️ More gap
            >
              Username
            </label>
            <input
              type="text"
              className="px-3 py-3 rounded-3"
              style={{
                width: "98%",
                background: "#fff",
                border: "1px solid #ccc",
                color: "#000",
                display: "block",
                padding: "7px",
                borderRadius: "3px",
              }}
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "25px" }}>
            <label
              className="d-block fw-semibold"
              style={{ fontSize: "13px", marginBottom: "8px" }} // ⬅️ More gap
            >
              Password
            </label>
            <input
              type="password"
              className="px-3 py-3 rounded-3"
              style={{
                width: "98%",
                background: "#fff",
                border: "1px solid #ccc",
                color: "#000",
                display: "block",
                padding: "7px",
                borderRadius: "3px",
              }}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* SignUp Button */}
          <motion.button
            type="submit"
            className="btn w-100 fw-bold rounded-pill py-3"
            style={{
              background: "linear-gradient(90deg, #00c6ff, #0072ff)",
              border: "none",
              color: "#fff",
              fontSize: "14px", // ⬅️ Smaller text
              letterSpacing: "1px",
              marginTop: "5px",
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 20px rgba(0, 114, 255, 0.6)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            Sign up
          </motion.button>
        </form>

        {/* Signup Link */}
        <div className="text-center" style={{ marginTop: "20px" }}>
          <p>
            Already have an account?{" "}
            <span
              className="fw-bold"
              style={{ cursor: "pointer", color: "#00c6ff" }}
              onClick={() => navigate("/user-login")}
            >
              Login
            </span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AdminSignup;
