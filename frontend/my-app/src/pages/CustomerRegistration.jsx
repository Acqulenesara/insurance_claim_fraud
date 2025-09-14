import { useState } from "react";
import { motion } from "framer-motion";

function CustomerRegistration() {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    vehicle: "",
    claimType: "",
    photo: null,
    signature: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    setTimeout(() => {
      setMessage("✅ Customer Registered Successfully!");
      setFormData({
        name: "",
        address: "",
        email: "",
        vehicle: "",
        claimType: "",
        photo: null,
        signature: null,
      });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <motion.div
      className="min-h-screen flex justify-center items-center"
      style={{ background: "linear-gradient(135deg, #141E30, #243B55)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        className="shadow-lg rounded-lg w-full max-w-md"
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
        <h2 className="text-center font-bold text-xl mb-8">
          Customer Registration
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label className="text-sm font-semibold mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 rounded border border-gray-300 text-black"
              required
            />
          </div>

          {/* Address */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label className="text-sm font-semibold mb-2">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-3 rounded border border-gray-300 text-black"
              required
            />
          </div>

          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label className="text-sm font-semibold mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 rounded border border-gray-300 text-black"
              required
            />
          </div>

          {/* Vehicle Details */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label className="text-sm font-semibold mb-2">
              Vehicle Details
            </label>
            <input
              type="text"
              name="vehicle"
              value={formData.vehicle}
              onChange={handleChange}
              className="w-full p-3 rounded border border-gray-300 text-black"
            />
          </div>

          

          {/* Upload Photo */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label className="text-sm font-semibold mb-2">
              Upload Photo
            </label>
            <input
              type="file"
              name="photo"
              onChange={handleChange}
              className="w-full p-2 rounded border border-gray-300 text-black bg-white"
            />
            {formData.photo && (
              <p className="mt-2 text-xs text-blue-400">
                Selected: {formData.photo.name}
              </p>
            )}
          </div>

          {/* Upload Signature */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label className="text-sm font-semibold mb-2">
              Upload Signature
            </label>
            <input
              type="file"
              name="signature"
              onChange={handleChange}
              className="w-full p-2 rounded border border-gray-300 text-black bg-white"
            />
            {formData.signature && (
              <p className="mt-2 text-xs text-blue-400">
                Selected: {formData.signature.name}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded font-bold"
            style={{
              background: "linear-gradient(90deg, #00c6ff, #0072ff)",
              border: "none",
              color: "#fff",
              fontSize: "15px",
              letterSpacing: "0.5px",
              marginTop: "1rem",
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 15px rgba(0, 114, 255, 0.6)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            {isSubmitting ? "Registering..." : "Register"}
          </motion.button>
        </form>

        {/* Status Message */}
        {message && (
          <p className="mt-6 text-center text-sm text-green-400">{message}</p>
        )}
      </motion.div>
    </motion.div>
  );
}

export default CustomerRegistration;