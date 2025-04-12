import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './JoinGroup.css';

const JoinGroup = () => {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/join-group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteCode,
          userName
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to join group');
      }

      setSuccess(true);
      // Redirect to suggestions page after a short delay
      setTimeout(() => {
        navigate('/suggestions');
      }, 2000);
    } catch (err) {
      setError(err.message || 'An error occurred while joining the group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="join-group-container">
      <h1>Join a Group</h1>
      {error && <div className="error-message">{error}</div>}
      
      {success ? (
        <div className="success-container">
          <h2>Successfully Joined the Group!</h2>
          <p>Redirecting to suggestions page...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="join-group-form">
          <div className="form-group">
            <label htmlFor="inviteCode">Invite Code</label>
            <input
              type="text"
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
              placeholder="Enter invite code"
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="userName">Your Name</label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              placeholder="Enter your name"
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className="join-group-button"
            disabled={isLoading}
          >
            {isLoading ? 'Joining...' : 'Join Group'}
          </button>
        </form>
      )}
    </div>
  );
};

export default JoinGroup; 