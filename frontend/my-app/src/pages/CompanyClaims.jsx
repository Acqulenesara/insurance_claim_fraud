import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Shield, Clock, ArrowRight, AlertTriangle, Activity } from 'lucide-react';
import './ClaimSuccess.css'; // create this file for the CSS below

function ClaimSuccess({ onBackToHome }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data passed from ClaimUpload
  const { result, claimId, error, message } = location.state || {};

  // Function to handle navigation to home
  const handleBackToHome = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      navigate('/');
    }
  };

  // Function to get risk level color
  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'minimal':
        return '#22c55e'; // green
      case 'low':
        return '#84cc16'; // lime
      case 'medium':
        return '#f59e0b'; // amber
      case 'high':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  // Function to get fraud score color
  const getScoreColor = (score) => {
    if (score < 30) return '#22c55e'; // green
    if (score < 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="claim-success-page">
      {/* Floating background gradients */}
      <div className="bg-blob blob1"></div>
      <div className="bg-blob blob2"></div>
      <div className="bg-blob blob3"></div>
      
      <div className="success-card-container">
        <div className="success-card">
          {/* Icon */}
          <div className="icon-wrapper">
            {error ? (
              <AlertTriangle className="check-icon" style={{ color: '#f59e0b' }} />
            ) : (
              <CheckCircle className="check-icon" />
            )}
          </div>
          
          {/* Messages */}
          <h1 className="title">
            {error ? 'Claim Received' : 'Claim Submitted Successfully!'}
          </h1>
          <p className="subtitle">
            {error ? message : 'Your insurance claim has been analyzed and submitted. Here are the results:'}
          </p>
          
          {/* Claim ID */}
          {claimId && (
            <div className="claim-id">
              <strong>Claim ID:</strong> {claimId}
            </div>
          )}
          
          {/* Results - Only show if no error and result exists */}
          {!error && result && (
            <div className="results-card">
              {/* Fraud Score */}
              <div className="result-row">
                <div className="label">
                  <Activity /> Fraud Risk Score
                </div>
                <div 
                  className="value score"
                  style={{ color: getScoreColor(result.hybrid_result.fraud_score) }}
                >
                  {result.hybrid_result.fraud_score}%
                </div>
              </div>

              {/* Risk Level */}
              <div className="result-row">
                <div className="label">
                  <Shield /> Risk Level
                </div>
                <div 
                  className="value"
                  style={{ color: getRiskColor(result.hybrid_result.risk_level) }}
                >
                  {result.hybrid_result.risk_level}
                </div>
              </div>

              {/* AI Action */}
              {result.ai_check?.action && (
                <div className="result-row">
                  <div className="label">
                    <Clock /> AI Decision
                  </div>
                  <div className="value">
                    {result.ai_check.action}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="result-row">
                <div className="label">
                  <Clock /> Status
                </div>
                <div className="value">Under Review</div>
              </div>

              {/* Reasons (if any) */}
              {result.hybrid_result.reasons && result.hybrid_result.reasons.length > 0 && (
                <div className="reasons-section">
                  <h4>Analysis Notes:</h4>
                  <ul>
                    {result.hybrid_result.reasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {/* Action button */}
          <button className="btn-dashboard" onClick={handleBackToHome}>
            Back to Home <ArrowRight className="arrow-icon" />
          </button>
          
          <p className="info-text">
            You'll receive email updates about your claim status. 
            {claimId && ` Reference your Claim ID: ${claimId.substring(0, 8)}...`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ClaimSuccess;