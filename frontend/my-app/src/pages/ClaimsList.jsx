import { useState } from "react";
import { FaUser, FaEnvelope, FaFileAlt, FaMapMarkerAlt, FaChevronDown, FaCar } from "react-icons/fa";
import "./ClaimsList.css"; // custom CSS

const dummyClaims = [
  {
    id: 1,
    name: "John McCormick",
    address: "1096 Wiseman Street, Calmar, IA",
    email: "john.mccormick@example.com",
    claimType: "Vehicle Insurance",
    description: "Car accident at intersection – rear bumper damage.",
    status: "Under Review",
    amount: "$2,450",
    date: "Dec 8, 2024",
    priority: "medium",
  },
  {
    id: 2,
    name: "Sandra Pugh",
    address: "1640 Thorn Street, Sale City, GA",
    email: "sandra.pugh@example.com",
    claimType: "Vehicle Insurance",
    description: "Minor collision resulting in front end damage.",
    status: "Approved",
    amount: "$8,750",
    date: "Dec 5, 2024",
    priority: "high",
  },
  {
    id: 3,
    name: "Vernie Hart",
    address: "3898 Oak Drive, Dover, DE",
    email: "vernie.hart@example.com",
    claimType: "Vehicle Insurance",
    description: "Hail damage to vehicle exterior and windows.",
    status: "Processing",
    amount: "$5,200",
    date: "Dec 12, 2024",
    priority: "low",
  },
];

function ClaimsList() {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getPriorityClass = (priority) => {
    if (priority === "high") return "priority-high";
    if (priority === "medium") return "priority-medium";
    if (priority === "low") return "priority-low";
    return "";
  };

  return (
    <div className="claims-page">
      <div className="header">
        <div className="icon-box">
          <FaCar size={28} color="#fff" />
        </div>
        <h1>Vehicle Insurance Claims</h1>
        <p>Manage and track all your vehicle insurance claims in one dashboard</p>
      </div>

      <div className="claims-grid">
        {dummyClaims.map((claim) => (
          <div
            key={claim.id}
            className={`claim-card ${expandedId === claim.id ? "expanded" : ""}`}
            onClick={() => toggleExpand(claim.id)}
          >
            <div className={`priority-bar ${getPriorityClass(claim.priority)}`}></div>

            <div className="claim-card-header">
              <div className="claim-info">
                <div className="avatar">
                  <FaCar size={20} />
                </div>
                <div>
                  <h3>{claim.name}</h3>
                  <span className="date">{claim.date}</span>
                </div>
              </div>
              <FaChevronDown
                className={`chevron ${expandedId === claim.id ? "rotated" : ""}`}
              />
            </div>

            <div className="amount-status">
              <div className="amount">{claim.amount}</div>
              <div className={`status ${claim.status.replace(" ", "-").toLowerCase()}`}>
                {claim.status}
              </div>
            </div>

            <div className="basic-info">
              <p><FaMapMarkerAlt className="icon" /> {claim.address}</p>
              <p><FaFileAlt className="icon" /> {claim.claimType}</p>
            </div>

            {expandedId === claim.id && (
              <div className="expanded-content">
                <p><FaEnvelope className="icon" /> {claim.email}</p>
                <p><FaFileAlt className="icon" /> {claim.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClaimsList;