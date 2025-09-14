import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Shield, Clock, ArrowRight, Sparkles } from 'lucide-react';
import './ClaimSuccess.css'; // create this file for the CSS below

function ClaimSuccess({ result, onBackToHome }) {
  const navigate = useNavigate();
  
  const mockResult = result || {
    hybrid_result: { fraud_score: 95 },
    ai_check: { action: "Approved" }
  };

  // Function to handle navigation to home
  const handleBackToHome = () => {
    if (onBackToHome) {
      // If parent component provides a custom handler
      onBackToHome();
    } else {
      // Default navigation to home page
      navigate('/');
    }
  };

  return (
    <div className="claim-success-page">
      {/* Floating background gradients */}
      <div className="bg-blob blob1"></div>
      <div className="bg-blob blob2"></div>
      <div className="bg-blob blob3"></div>
      
      <div className="success-card-container">
        <div className="success-card">
          {/* Checkmark */}
          <div className="icon-wrapper">
            <CheckCircle className="check-icon" />
          </div>
          
          {/* Messages */}
          <h1 className="title">Claim Submitted!</h1>
          <p className="subtitle">
            Your insurance claim has been successfully submitted. Our team will review it and get back to you.
          </p>
          
          {/* Results */}
          <div className="results-card">
            <div className="result-row">
              <div className="label"><Clock /> Status</div>
              <div className="value">Under Review</div>
            </div>
          </div>
          
          {/* Action button - Now navigates to home */}
          <button className="btn-dashboard" onClick={handleBackToHome}>
            Back to Home <ArrowRight className="arrow-icon" />
          </button>
          
          <p className="info-text">You'll receive email updates about your claim status</p>
        </div>
      </div>
    </div>
  );
}

export default ClaimSuccess;
