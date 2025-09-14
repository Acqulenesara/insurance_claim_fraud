import React from "react";
import { useNavigate } from "react-router-dom"; // <-- import useNavigate
import { User, FileText, Sparkles, ArrowRight } from "lucide-react";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate(); // <-- use the hook

  const options = [
    { 
      id: 1, 
      name: "Customer Registration", 
      path: "/customer-registration", 
      icon: <User size={28} />, 
      color: "green",
      description: "Manage customer accounts and registration processes",
    },
    { 
      id: 2, 
      name: "Claims List", 
      path: "/claims-list", 
      icon: <FileText size={28} />, 
      color: "blue",
      description: "Review and process insurance claims efficiently",
    },
  ];

  return (
    <div className="dashboard-page">
      {/* Background blobs */}
      <div className="bg-blob blob1"></div>
      <div className="bg-blob blob2"></div>
      <div className="bg-blob blob3"></div>

      <div className="dashboard-content">
        <div className="header">
          
          <h1>Admin Dashboard</h1>
          <p>Streamline your administrative tasks with our comprehensive management tools</p>
        </div>

        <div className="cards-grid">
          {options.map((opt) => (
            <div 
              key={opt.id} 
              className={card card-${opt.color}} 
              onClick={() => navigate(opt.path)} // <-- this now works
            >
              <div className="card-top-bar"></div>
              <div className="card-icon">{opt.icon}</div>
              <h3 className="card-title">{opt.name}</h3>
              <p className="card-description">{opt.description}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
