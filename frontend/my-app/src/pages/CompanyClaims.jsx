import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Activity, 
  Clock, 
  User, 
  Car, 
  MapPin, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  Brain,
  TrendingUp,
  Target
} from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import './CompanyClaims.css';

function CompanyClaims() {
  const { id: companyId } = useParams();
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [fraudAnalyses, setFraudAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Fetch claims and fraud analyses from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching claims and fraud analyses...");
        
        // Fetch claims
        const claimsRef = collection(db, 'claims');
        const claimsQuery = query(claimsRef, orderBy('created_at', 'desc'));
        const claimsSnapshot = await getDocs(claimsQuery);
        
        const claimsData = claimsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.() || new Date(doc.data().created_at)
        }));
        
        // Fetch fraud analyses
        const analysesRef = collection(db, 'fraud_analyses');
        const analysesQuery = query(analysesRef, orderBy('analysis_timestamp', 'desc'));
        const analysesSnapshot = await getDocs(analysesQuery);
        
        const analysesData = analysesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          analysis_timestamp: doc.data().analysis_timestamp?.toDate?.() || new Date(doc.data().analysis_timestamp)
        }));
        
        setClaims(claimsData);
        setFraudAnalyses(analysesData);
        
        console.log("Fetched claims:", claimsData.length);
        console.log("Fetched fraud analyses:", analysesData.length);
        console.log("Sample fraud analysis:", analysesData[0]);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  // Match fraud analysis to claim by policy number
  const findAnalysisForClaim = (claim) => {
    // Try multiple matching strategies
    const analysis = fraudAnalyses.find(analysis => 
      analysis.policy_number === claim.policy_number ||
      analysis.claim_reference === claim.policy_number ||
      // Also try partial matching for analysis_id
      (analysis.analysis_id && claim.id && analysis.analysis_id.includes(claim.id.substring(0, 6)))
    );
    
    if (analysis) {
      console.log(`Found analysis for claim ${claim.policy_number}:`, analysis);
    }
    
    return analysis;
  };

  // Get risk color
  const getRiskColor = (riskLevel) => {
    const level = String(riskLevel || '').toLowerCase().replace('_', ' ');
    switch (level) {
      case 'minimal': return '#22c55e';
      case 'low': return '#84cc16';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'very high': 
      case 'very_high': return '#dc2626';
      default: return '#6b7280';
    }
  };

  // Get score color
  const getScoreColor = (score) => {
    const numScore = parseFloat(score) || 0;
    if (numScore < 30) return '#22c55e';
    if (numScore < 60) return '#f59e0b';
    return '#ef4444';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (String(status || '').toLowerCase()) {
      case 'approved': return '#22c55e';
      case 'rejected': return '#ef4444';
      case 'under review': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  // Update claim status
  const updateClaimStatus = async (claimId, newStatus, adminNotes = '') => {
    setUpdating(true);
    try {
      const claimRef = doc(db, 'claims', claimId);
      await updateDoc(claimRef, {
        status: newStatus,
        admin_notes: adminNotes,
        reviewed_at: new Date(),
        reviewed_by: companyId || 'admin'
      });

      setClaims(claims.map(claim => 
        claim.id === claimId 
          ? { ...claim, status: newStatus, admin_notes: adminNotes, reviewed_at: new Date() }
          : claim
      ));

      alert(`Claim ${newStatus.toLowerCase()} successfully!`);
      setSelectedClaim(null);
      setSelectedAnalysis(null);
    } catch (error) {
      console.error('Error updating claim:', error);
      alert('Error updating claim. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewDetails = (claim) => {
    const analysis = findAnalysisForClaim(claim);
    setSelectedClaim(claim);
    setSelectedAnalysis(analysis);
    console.log("Selected claim:", claim);
    console.log("Selected analysis:", analysis);
  };

  if (loading) {
    return (
      <div className="company-claims-page">
        <div className="loading">Loading claims and fraud analysis data...</div>
      </div>
    );
  }

  return (
    <div className="company-claims-page">
      <div className="header">
        <h1>Claims & Fraud Analysis Dashboard</h1>
        <p>Review claims with comprehensive fraud detection analysis from ML models</p>
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-number">{claims.length}</span>
            <span className="stat-label">Total Claims</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{fraudAnalyses.length}</span>
            <span className="stat-label">Fraud Analyses</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {fraudAnalyses.filter(a => parseFloat(a.ai_fraud_score) >= 70).length}
            </span>
            <span className="stat-label">High Risk</span>
          </div>
        </div>
      </div>

      <div className="claims-grid">
        {claims.map((claim) => {
          const analysis = findAnalysisForClaim(claim);
          
          return (
            <div key={claim.id} className="claim-card">
              <div className="claim-header">
                <div className="claim-id">
                  <FileText size={16} />
                  <span>#{claim.id.substring(0, 8)}</span>
                </div>
                <div 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(claim.status) }}
                >
                  {claim.status || 'Under Review'}
                </div>
              </div>

              {/* Basic Claim Info */}
              <div className="claim-info">
                <div className="info-row">
                  <User size={16} />
                  <span>{claim.insured_sex}, Age {claim.age}</span>
                </div>
                <div className="info-row">
                  <Car size={16} />
                  <span>{claim.auto_year} {claim.auto_make} {claim.auto_model}</span>
                </div>
                <div className="info-row">
                  <MapPin size={16} />
                  <span>{claim.incident_city}, {claim.incident_state}</span>
                </div>
                <div className="info-row">
                  <DollarSign size={16} />
                  <span>${parseFloat(claim.total_claim_amount || 0).toLocaleString()}</span>
                </div>
                <div className="info-row">
                  <Calendar size={16} />
                  <span>{claim.created_at.toLocaleDateString()}</span>
                </div>
              </div>

              {/* Fraud Analysis Results from fraud_analyses collection */}
              {analysis ? (
                <div className="fraud-analysis-results">
                  <div className="analysis-header">
                    <Brain size={16} />
                    <span>Fraud Analysis Results</span>
                  </div>
                  
                  <div className="analysis-scores">
                    <div className="score-item">
                      <Target size={14} />
                      <span>AI Score:</span>
                      <strong style={{ color: getScoreColor(analysis.ai_fraud_score) }}>
                        {parseFloat(analysis.ai_fraud_score || 0).toFixed(1)}%
                      </strong>
                    </div>
                    
                    <div className="score-item">
                      <TrendingUp size={14} />
                      <span>Combined:</span>
                      <strong style={{ color: getScoreColor(analysis.combined_score) }}>
                        {parseFloat(analysis.combined_score || 0).toFixed(1)}%
                      </strong>
                    </div>
                    
                    <div className="score-item">
                      <Activity size={14} />
                      <span>Rule-based:</span>
                      <strong style={{ color: getScoreColor(analysis.rule_based_score) }}>
                        {parseFloat(analysis.rule_based_score || 0).toFixed(1)}%
                      </strong>
                    </div>
                    
                    <div className="score-item">
                      <Shield size={14} />
                      <span>CatBoost:</span>
                      <strong style={{ color: getScoreColor(analysis.catboost_probability * 100) }}>
                        {(parseFloat(analysis.catboost_probability || 0) * 100).toFixed(1)}%
                      </strong>
                    </div>
                  </div>
                  
                  <div className="analysis-details">
                    <div className="detail-row">
                      <span className="detail-label">Risk Level:</span>
                      <span 
                        className="risk-level"
                        style={{ color: getRiskColor(analysis.risk_level) }}
                      >
                        {analysis.risk_level?.replace('_', ' ') || 'Unknown'}
                      </span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">AI Action:</span>
                      <span className="ai-action">
                        {analysis.ai_action?.replace('_', ' ') || 'N/A'}
                      </span>
                    </div>
                    
                    {analysis.requires_review && (
                      <div className="attention-flag">
                        <AlertTriangle size={12} />
                        <span>Requires Manual Review</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="analysis-timestamp">
                    <Clock size={12} />
                    <span>Analyzed: {analysis.analysis_timestamp.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="no-analysis">
                  <AlertTriangle size={16} />
                  <span>No fraud analysis available for this claim</span>
                </div>
              )}

              <div className="claim-actions">
                <button 
                  className="btn-view"
                  onClick={() => handleViewDetails(claim)}
                >
                  View Full Analysis
                </button>
                {claim.status === 'Under Review' && (
                  <div className="action-buttons">
                    <button 
                      className="btn-approve"
                      onClick={() => updateClaimStatus(claim.id, 'Approved')}
                      disabled={updating}
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button 
                      className="btn-reject"
                      onClick={() => updateClaimStatus(claim.id, 'Rejected')}
                      disabled={updating}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Modal with Full Analysis */}
      {selectedClaim && (
        <div className="modal-overlay" onClick={() => {setSelectedClaim(null); setSelectedAnalysis(null);}}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Complete Fraud Analysis - Claim #{selectedClaim.id.substring(0, 8)}</h2>
              <button 
                className="close-btn"
                onClick={() => {setSelectedClaim(null); setSelectedAnalysis(null);}}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Comprehensive Fraud Analysis Section */}
              {selectedAnalysis ? (
                <>
                  <div className="section analysis-overview">
                    <h3>Fraud Detection Analysis Overview</h3>
                    <div className="analysis-dashboard">
                      <div className="score-displays">
                        <div className="score-display">
                          <span>AI Fraud Score</span>
                          <div 
                            className="score-circle large"
                            style={{ borderColor: getScoreColor(selectedAnalysis.ai_fraud_score) }}
                          >
                            {parseFloat(selectedAnalysis.ai_fraud_score || 0).toFixed(0)}%
                          </div>
                        </div>
                        <div className="score-display">
                          <span>Combined Score</span>
                          <div 
                            className="score-circle"
                            style={{ borderColor: getScoreColor(selectedAnalysis.combined_score) }}
                          >
                            {parseFloat(selectedAnalysis.combined_score || 0).toFixed(0)}%
                          </div>
                        </div>
                        <div className="risk-display">
                          <span>Risk Assessment</span>
                          <div 
                            className="risk-badge large"
                            style={{ backgroundColor: getRiskColor(selectedAnalysis.risk_level) }}
                          >
                            {selectedAnalysis.risk_level?.replace('_', ' ') || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="section">
                    <h3>Detailed Analysis Breakdown</h3>
                    <div className="analysis-breakdown-grid">
                      <div className="breakdown-card">
                        <h4>Rule-Based Analysis</h4>
                        <div className="breakdown-score">
                          {parseFloat(selectedAnalysis.rule_based_score || 0).toFixed(1)}%
                        </div>
                        <p>Traditional fraud detection rules</p>
                      </div>
                      
                      <div className="breakdown-card">
                        <h4>CatBoost ML Model</h4>
                        <div className="breakdown-score">
                          {(parseFloat(selectedAnalysis.catboost_probability || 0) * 100).toFixed(1)}%
                        </div>
                        <p>Machine learning probability: {selectedAnalysis.catboost_prediction === 'y' ? 'Fraudulent' : 'Legitimate'}</p>
                      </div>
                      
                      <div className="breakdown-card">
                        <h4>AI Confidence</h4>
                        <div className="breakdown-score">
                          {(parseFloat(selectedAnalysis.ai_confidence || 0.5) * 100).toFixed(0)}%
                        </div>
                        <p>AI model confidence level</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Explanation */}
                  {selectedAnalysis.ai_explanation && (
                    <div className="section">
                      <h3>AI Analysis Explanation</h3>
                      <div className="ai-explanation">
                        <Brain size={20} />
                        <p>{selectedAnalysis.ai_explanation}</p>
                      </div>
                    </div>
                  )}

                  {/* Risk Factors */}
                  {selectedAnalysis.key_risk_factors && selectedAnalysis.key_risk_factors.length > 0 && (
                    <div className="section">
                      <h3>Key Risk Factors Identified</h3>
                      <div className="risk-factors">
                        {selectedAnalysis.key_risk_factors.map((factor, index) => (
                          <div key={index} className="risk-factor-item">
                            <AlertTriangle size={16} />
                            <span>{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {selectedAnalysis.follow_up_questions && selectedAnalysis.follow_up_questions.length > 0 && (
                    <div className="section">
                      <h3>Recommended Actions</h3>
                      <div className="recommendations">
                        <ul>
                          {selectedAnalysis.follow_up_questions.map((question, index) => (
                            <li key={index}>{question}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Technical Details */}
                  <div className="section">
                    <h3>Technical Analysis Details</h3>
                    <div className="technical-details">
                      <div className="tech-item">
                        <strong>Analysis ID:</strong> {selectedAnalysis.analysis_id}
                      </div>
                      <div className="tech-item">
                        <strong>Model Version:</strong> {selectedAnalysis.model_version || '1.0'}
                      </div>
                      <div className="tech-item">
                        <strong>Analysis Method:</strong> {selectedAnalysis.analysis_method || 'Hybrid ML+AI'}
                      </div>
                      <div className="tech-item">
                        <strong>Processing Time:</strong> {selectedAnalysis.processing_time_ms || 'N/A'}ms
                      </div>
                      <div className="tech-item">
                        <strong>Status:</strong> {selectedAnalysis.status || 'Completed'}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="section">
                  <h3>Analysis Not Available</h3>
                  <p>No fraud analysis data found for this claim in the fraud_analyses collection.</p>
                </div>
              )}

              {/* Basic Claim Information */}
              <div className="section">
                <h3>Claim Information</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <strong>Policy Number:</strong> {selectedClaim.policy_number}
                  </div>
                  <div className="detail-item">
                    <strong>Total Amount:</strong> ${parseFloat(selectedClaim.total_claim_amount || 0).toLocaleString()}
                  </div>
                  <div className="detail-item">
                    <strong>Incident Type:</strong> {selectedClaim.incident_type}
                  </div>
                  <div className="detail-item">
                    <strong>Vehicle:</strong> {selectedClaim.auto_year} {selectedClaim.auto_make} {selectedClaim.auto_model}
                  </div>
                </div>
              </div>

              {/* Decision Buttons */}
              {selectedClaim.status === 'Under Review' && (
                <div className="modal-actions">
                  <button 
                    className="btn-approve large"
                    onClick={() => updateClaimStatus(selectedClaim.id, 'Approved')}
                    disabled={updating}
                  >
                    <CheckCircle size={20} /> 
                    {updating ? 'Updating...' : 'Approve Claim'}
                  </button>
                  <button 
                    className="btn-reject large"
                    onClick={() => updateClaimStatus(selectedClaim.id, 'Rejected')}
                    disabled={updating}
                  >
                    <XCircle size={20} /> 
                    {updating ? 'Updating...' : 'Reject Claim'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyClaims;