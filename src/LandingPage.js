import './LandingPage.css';

function LandingPage() {
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
      </div>
    </div>
  );
}

export default LandingPage; 