import { useState, useEffect } from "react";
import { 
  FaUser, FaEnvelope, FaFileAlt, FaMapMarkerAlt, FaChevronDown, 
  FaCar, FaExclamationTriangle, FaCheckCircle, FaTimes, 
  FaRobot, FaBrain, FaEye, FaClock, FaThumbsUp, FaThumbsDown,
  FaShieldAlt, FaSearch, FaFilter
} from "react-icons/fa";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import "./ClaimsList.css";

function ClaimsList() {
  const [analyses, setAnalyses] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingAnalysis, setUpdatingAnalysis] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Real-time listener for fraud_analyses collection
    const q = query(collection(db, "fraud_analyses"), orderBy("created_at", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const analysesData = [];
      snapshot.forEach((doc) => {
        analysesData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log("Loaded fraud analyses:", analysesData.length);
      setAnalyses(analysesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleStatusUpdate = async (analysisId, newStatus, reviewNotes = "") => {
    if (updatingAnalysis === analysisId) return;
    
    setUpdatingAnalysis(analysisId);
    try {
      const analysisRef = doc(db, "fraud_analyses", analysisId);
      const updateData = {
        status: newStatus,
        updated_at: new Date(),
        reviewed_at: new Date(),
      };
      
      if (reviewNotes) {
        updateData.review_notes = reviewNotes;
      }
      
      await updateDoc(analysisRef, updateData);
      console.log(`Analysis ${analysisId} status updated to ${newStatus}`);
      
      alert(`Analysis ${newStatus.toLowerCase()} successfully!`);
      
    } catch (error) {
      console.error("Error updating analysis status:", error);
      alert("Error updating analysis status. Please try again.");
    } finally {
      setUpdatingAnalysis(null);
    }
  };

  const getPriorityClass = (fraudScore) => {
    if (fraudScore >= 70) return "priority-high";
    if (fraudScore >= 40) return "priority-medium";
    return "priority-low";
  };

  const getRiskLevelIcon = (riskLevel) => {
    switch (riskLevel?.toUpperCase()) {
      case "HIGH":
        return <FaExclamationTriangle color="#dc3545" />;
      case "MEDIUM":
        return <FaExclamationTriangle color="#ffc107" />;
      case "MINIMAL":
      case "LOW":
        return <FaCheckCircle color="#28a745" />;
      default:
        return <FaClock color="#17a2b8" />;
    }
  };

  const getAIActionIcon = (aiAction) => {
    switch (aiAction?.toLowerCase()) {
      case "approve":
        return <FaThumbsUp color="#28a745" />;
      case "reject":
      case "escalate_investigation":
        return <FaThumbsDown color="#dc3545" />;
      case "request_documents":
      case "manual_review":
        return <FaEye color="#ffc107" />;
      default:
        return <FaRobot color="#6c757d" />;
    }
  };

  const formatDate = (dateField) => {
    if (dateField?.toDate) {
      return dateField.toDate().toLocaleDateString();
    }
    if (dateField instanceof Date) {
      return dateField.toLocaleDateString();
    }
    return dateField || "N/A";
  };

  const formatDateTime = (dateField) => {
    if (dateField?.toDate) {
      return dateField.toDate().toLocaleString();
    }
    if (dateField instanceof Date) {
      return dateField.toLocaleString();
    }
    return dateField || "N/A";
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "under review":
        return "#ffc107";
      case "approved":
        return "#28a745";
      case "rejected":
      case "denied":
        return "#dc3545";
      case "pending manual review":
        return "#17a2b8";
      default:
        return "#6c757d";
    }
  };

  // Filter analyses based on status and search term
  const filteredAnalyses = analyses.filter(analysis => {
    const matchesStatus = filterStatus === "All" || analysis.status === filterStatus;
    const matchesSearch = !searchTerm || 
      analysis.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.policy_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.analysis_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusCounts = () => {
    const counts = {
      total: analyses.length,
      "Under Review": 0,
      "Approved": 0,
      "Rejected": 0,
      "Pending Manual Review": 0
    };

    analyses.forEach(analysis => {
      if (counts.hasOwnProperty(analysis.status)) {
        counts[analysis.status]++;
      }
    });

    return counts;
  };

  if (loading) {
    return (
      <div className="claims-page">
        <div className="header">
          <div className="icon-box">
            <FaShieldAlt size={28} color="#fff" />
          </div>
          <h1>AI Fraud Analysis Dashboard</h1>
          <p>Loading fraud analyses...</p>
        </div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="claims-page">
      <div className="header">
        <div className="icon-box">
          <FaShieldAlt size={28} color="#fff" />
        </div>
        <h1>AI Fraud Analysis Dashboard</h1>
        <p>Advanced ML-powered insurance fraud detection results</p>
        
        <div className="stats-bar">
          <span>Total Analyses: {statusCounts.total}</span>
          <span>Under Review: {statusCounts["Under Review"]}</span>
          <span>Approved: {statusCounts["Approved"]}</span>
          <span>Rejected: {statusCounts["Rejected"]}</span>
        </div>

        {/* Search and Filter Controls */}
        <div className="controls-bar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by email, policy number, or analysis ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-box">
            <FaFilter className="filter-icon" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Status</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Pending Manual Review">Manual Review</option>
            </select>
          </div>
        </div>
      </div>

      <div className="claims-grid">
        {filteredAnalyses.map((analysis) => (
          <div
            key={analysis.id}
            className={`claim-card ${expandedId === analysis.id ? "expanded" : ""}`}
            onClick={() => toggleExpand(analysis.id)}
          >
            <div className={`priority-bar ${getPriorityClass(analysis.combined_score || 0)}`}></div>

            <div className="claim-card-header">
              <div className="claim-info">
                <div className="avatar">
                  <FaUser size={16} />
                </div>
                <div>
                  <h3>{analysis.user_name || analysis.user_email || "Unknown User"}</h3>
                  <span className="date">{formatDate(analysis.created_at)}</span>
                  <small className="email">{analysis.user_email}</small>
                  <small className="analysis-id">ID: {analysis.analysis_id}</small>
                </div>
              </div>
              <div className="header-icons">
                {getRiskLevelIcon(analysis.risk_level)}
                {getAIActionIcon(analysis.ai_action)}
                <FaChevronDown
                  className={`chevron ${expandedId === analysis.id ? "rotated" : ""}`}
                />
              </div>
            </div>

            <div className="amount-status">
              <div className="amount">${analysis.total_claim_amount || "0"}</div>
              <div 
                className="status"
                style={{ 
                  backgroundColor: getStatusColor(analysis.status),
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                {analysis.status || "Under Review"}
              </div>
            </div>

            <div className="fraud-analysis">
              <div className="fraud-score">
                <span className="label">Combined Score:</span>
                <span className={`score ${getPriorityClass(analysis.combined_score || 0).replace('priority-', '')}`}>
                  {analysis.combined_score?.toFixed(2) || 0}%
                </span>
              </div>
              <div className="risk-level">
                <span className="label">Risk Level:</span>
                <span className={`risk ${(analysis.risk_level || 'low').toLowerCase()}`}>
                  {analysis.risk_level || "LOW"}
                </span>
              </div>
            </div>

            <div className="basic-info">
              <p><FaMapMarkerAlt className="icon" /> {analysis.incident_city}, {analysis.incident_state}</p>
              <p><FaFileAlt className="icon" /> {analysis.incident_type || "Vehicle Claim"}</p>
              <p><FaBrain className="icon" /> AI: {analysis.ai_action || "Pending"}</p>
            </div>

            {expandedId === analysis.id && (
              <div className="expanded-content">
                <div className="details-section">
                  <h4><FaUser className="icon" /> User Information</h4>
                  <p><strong>User ID:</strong> {analysis.user_id}</p>
                  <p><strong>Email:</strong> {analysis.user_email}</p>
                  <p><strong>Name:</strong> {analysis.user_name || "N/A"}</p>
                  <p><strong>Occupation:</strong> {analysis.insured_occupation}</p>
                  <p><strong>Location:</strong> {analysis.insured_zip}</p>
                </div>

                <div className="details-section">
                  <h4><FaFileAlt className="icon" /> Claim Details</h4>
                  <p><strong>Analysis ID:</strong> {analysis.analysis_id}</p>
                  <p><strong>Policy Number:</strong> {analysis.policy_number}</p>
                  <p><strong>Claim Reference:</strong> {analysis.claim_reference}</p>
                  <p><strong>Incident Date:</strong> {analysis.incident_date}</p>
                  <p><strong>Location:</strong> {analysis.incident_city}, {analysis.incident_state}</p>
                  <p><strong>Incident Type:</strong> {analysis.incident_type}</p>
                  <p><strong>Severity:</strong> {analysis.incident_severity}</p>
                  <p><strong>Collision Type:</strong> {analysis.collision_type}</p>
                  <p><strong>Property Damage:</strong> {analysis.property_damage}</p>
                  <p><strong>Bodily Injuries:</strong> {analysis.bodily_injuries}</p>
                  <p><strong>Witnesses:</strong> {analysis.witnesses}</p>
                  <p><strong>Police Report:</strong> {analysis.police_report_available}</p>
                  {analysis.claim_description && (
                    <p><strong>Description:</strong> {analysis.claim_description}</p>
                  )}
                </div>

                <div className="details-section">
                  <h4><FaCar className="icon" /> Vehicle Information</h4>
                  <p><strong>Vehicle:</strong> {analysis.auto_year} {analysis.auto_make} {analysis.auto_model}</p>
                </div>

                <div className="details-section ai-analysis">
                  <h4><FaRobot className="icon" /> ML & AI Analysis Results</h4>
                  
                  <div className="ai-scores">
                    <div className="score-grid">
                      <div className="score-item">
                        <span className="label">Combined Score:</span>
                        <span className={`value ${getPriorityClass(analysis.combined_score || 0).replace('priority-', '')}`}>
                          {analysis.combined_score?.toFixed(2) || 0}%
                        </span>
                      </div>
                      <div className="score-item">
                        <span className="label">Rule-based Score:</span>
                        <span className="value">{analysis.rule_based_score?.toFixed(2) || 0}%</span>
                      </div>
                      <div className="score-item">
                        <span className="label">CatBoost Probability:</span>
                        <span className="value">{(analysis.catboost_probability * 100 || 0).toFixed(2)}%</span>
                      </div>
                      <div className="score-item">
                        <span className="label">CatBoost Confidence:</span>
                        <span className="value">{(analysis.catboost_confidence * 100 || 0).toFixed(2)}%</span>
                      </div>
                      <div className="score-item">
                        <span className="label">AI Fraud Score:</span>
                        <span className="value">{analysis.ai_fraud_score || 0}%</span>
                      </div>
                      <div className="score-item">
                        <span className="label">AI Confidence:</span>
                        <span className="value">{(analysis.ai_confidence * 100 || 0).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ai-details">
                    <p><strong>AI Action:</strong> 
                      <span className={`ai-action ${analysis.ai_action?.toLowerCase()}`}>
                        {getAIActionIcon(analysis.ai_action)} {analysis.ai_action || "Pending"}
                      </span>
                    </p>
                    
                    <p><strong>CatBoost Prediction:</strong> 
                      <span className={analysis.catboost_prediction === 'Y' ? 'fraud-prediction' : 'no-fraud-prediction'}>
                        {analysis.catboost_prediction === 'Y' ? 'Fraud Detected' : 'No Fraud Detected'}
                      </span>
                    </p>
                    
                    {analysis.ai_explanation && (
                      <div>
                        <strong>AI Explanation:</strong>
                        <p className="ai-explanation">{analysis.ai_explanation}</p>
                      </div>
                    )}
                    
                    {analysis.ai_reasoning && (
                      <div>
                        <strong>AI Reasoning:</strong>
                        <p className="ai-reasoning">{analysis.ai_reasoning}</p>
                      </div>
                    )}
                    
                    {analysis.ai_recommendation && (
                      <div>
                        <strong>AI Recommendation:</strong>
                        <p className="ai-recommendation">{analysis.ai_recommendation}</p>
                      </div>
                    )}
                    
                    {analysis.risk_factors && analysis.risk_factors.length > 0 && (
                      <div>
                        <strong>Risk Factors:</strong>
                        <ul className="risk-factors">
                          {analysis.risk_factors.map((factor, index) => (
                            <li key={index}><FaExclamationTriangle /> {factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {analysis.key_risk_factors && analysis.key_risk_factors.length > 0 && (
                      <div>
                        <strong>Key Risk Factors:</strong>
                        <ul className="key-risk-factors">
                          {analysis.key_risk_factors.map((factor, index) => (
                            <li key={index}><FaExclamationTriangle /> {factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {analysis.red_flags && analysis.red_flags.length > 0 && (
                      <div>
                        <strong>Red Flags:</strong>
                        <ul className="red-flags">
                          {analysis.red_flags.map((flag, index) => (
                            <li key={index}><FaExclamationTriangle color="#dc3545" /> {flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {analysis.recommendations && analysis.recommendations.length > 0 && (
                      <div>
                        <strong>Recommendations:</strong>
                        <ul className="recommendations">
                          {analysis.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {analysis.follow_up_questions && analysis.follow_up_questions.length > 0 && (
                      <div>
                        <strong>Follow-up Questions:</strong>
                        <ul className="follow-up-questions">
                          {analysis.follow_up_questions.map((question, index) => (
                            <li key={index}><FaEye /> {question}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="details-section">
                  <h4><FaClock className="icon" /> Processing Details</h4>
                  <p><strong>Analysis Method:</strong> {analysis.analysis_method}</p>
                  <p><strong>Model Version:</strong> {analysis.model_version}</p>
                  <p><strong>Processing Time:</strong> {analysis.processing_time_ms}ms</p>
                  <p><strong>Requires Review:</strong> {analysis.requires_review ? "Yes" : "No"}</p>
                  <p><strong>Created:</strong> {formatDateTime(analysis.created_at)}</p>
                  <p><strong>Analysis Time:</strong> {formatDateTime(analysis.analysis_timestamp)}</p>
                  <p><strong>Updated:</strong> {formatDateTime(analysis.updated_at)}</p>
                  {analysis.reviewed_at && (
                    <p><strong>Reviewed:</strong> {formatDateTime(analysis.reviewed_at)}</p>
                  )}
                  {analysis.review_notes && (
                    <div>
                      <strong>Review Notes:</strong>
                      <p className="review-notes">{analysis.review_notes}</p>
                    </div>
                  )}
                </div>

                {(analysis.status === "Under Review" || analysis.status === "Pending Manual Review") && (
                  <div className="action-buttons">
                    <button
                      className="btn-approve"
                      disabled={updatingAnalysis === analysis.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        const notes = prompt("Add approval notes (optional):");
                        handleStatusUpdate(analysis.id, "Approved", notes || "Claim approved after AI analysis review");
                      }}
                    >
                      {updatingAnalysis === analysis.id ? (
                        "Processing..."
                      ) : (
                        <>
                          <FaCheckCircle /> Approve Analysis
                        </>
                      )}
                    </button>
                    
                    <button
                      className="btn-reject"
                      disabled={updatingAnalysis === analysis.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        const notes = prompt("Add rejection reason (required):");
                        if (notes && notes.trim()) {
                          handleStatusUpdate(analysis.id, "Rejected", notes);
                        } else {
                          alert("Please provide a rejection reason.");
                        }
                      }}
                    >
                      {updatingAnalysis === analysis.id ? (
                        "Processing..."
                      ) : (
                        <>
                          <FaTimes /> Reject Analysis
                        </>
                      )}
                    </button>
                    
                    <button
                      className="btn-manual"
                      disabled={updatingAnalysis === analysis.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        const notes = prompt("Add manual review notes:");
                        handleStatusUpdate(analysis.id, "Pending Manual Review", notes || "Flagged for detailed manual investigation");
                      }}
                    >
                      {updatingAnalysis === analysis.id ? (
                        "Processing..."
                      ) : (
                        <>
                          <FaEye /> Flag for Review
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {filteredAnalyses.length === 0 && !loading && (
          <div className="no-claims">
            <FaShieldAlt size={48} color="#ccc" />
            <h3>No Fraud Analyses Found</h3>
            <p>
              {searchTerm || filterStatus !== "All" 
                ? "No analyses match your current filters." 
                : "No fraud analyses have been performed yet."}
            </p>
            {(searchTerm || filterStatus !== "All") && (
              <button 
                className="clear-filters-btn"
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("All");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {analyses.length > 0 && (
        <div className="summary-stats">
          <h3>Fraud Analysis Summary</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">High Risk (≥70%):</span>
              <span className="stat-value high">
                {analyses.filter(a => (a.combined_score || 0) >= 70).length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Medium Risk (40-70%):</span>
              <span className="stat-value medium">
                {analyses.filter(a => (a.combined_score || 0) >= 40 && (a.combined_score || 0) < 70).length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Low Risk (0-40%):</span>
              <span className="stat-value low">
                {analyses.filter(a => (a.combined_score || 0) < 40).length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average Fraud Score:</span>
              <span className="stat-value">
                {(analyses.reduce((sum, a) => sum + (a.combined_score || 0), 0) / analyses.length || 0).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClaimsList;