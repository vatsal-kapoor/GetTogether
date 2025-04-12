import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './JoinGroup.css';

const JoinGroup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/join-group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ inviteCode })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join group');
      }

      setSuccess(true);
      // Redirect to suggestions page after a short delay
      setTimeout(() => {
        navigate('/suggestions');
      }, 2000);
    } catch (err) {
      setError(err.message);
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
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              required
              placeholder="Enter invite code"
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