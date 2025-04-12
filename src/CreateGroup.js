import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateGroup.css';

const CreateGroup = () => {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:3000/create-group/${groupName}/${creatorName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName,
          description,
          creatorName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      const data = await response.json();
      setInviteCode(data.inviteCode);
    } catch (err) {
      setError(err.message || 'An error occurred while creating the group');
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
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Describe your group"
              rows="4"
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="creatorName">Your Name</label>
            <input
              type="text"
              id="creatorName"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              required
              placeholder="Enter your name"
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