import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();

  const handleNavigateToSuggestions = () => {
    navigate('/suggestions');
  };

  return (
    <div className="App">
      <div className="landing-container">
        <h1 className="title">GetTogether</h1>
        <p className="subtitle">Connect with friends and make memories together</p>
        <div className="button-container">
          <button className="cta-button create-button">
            Create Group
          </button>
          <button className="cta-button join-button">
            Join Group
          </button>
        </div>
        
        {/* Temporary button to navigate to Suggestions page */}
        <div className="temp-navigation">
          <button 
            className="temp-button"
            onClick={handleNavigateToSuggestions}
          >
            Go to Suggestions Page
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage; 