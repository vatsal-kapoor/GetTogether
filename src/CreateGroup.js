import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './CreateGroup.css';

const CreateGroup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/create-group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ groupName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create group');
      }

      const data = await response.json();
      setInviteCode(data.group.inviteCode);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-group-container">
      <h1>Create a New Group</h1>
      {error && <div className="error-message">{error}</div>}
      
      {inviteCode ? (
        <div className="success-container">
          <h2>Group Created Successfully!</h2>
          <p>Share this invite code with your friends:</p>
          <div className="invite-code">{inviteCode}</div>
          <button 
            className="create-group-button"
            onClick={() => navigate('/suggestions')}
          >
            Go to Suggestions
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="create-group-form">
          <div className="form-group">
            <label htmlFor="groupName">Group Name</label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              placeholder="Enter group name"
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className="create-group-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      )}
    </div>
  );
};

export default CreateGroup; 