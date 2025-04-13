import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './UserProfile.css';

const UserProfile = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    if (isOpen) {
      fetchUserGroups();
    }
  }, [isOpen]);

  const fetchUserGroups = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/user-groups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }

      const data = await response.json();
      setUserGroups(data.groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <div className="user-profile">
      <button 
        className="profile-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        {getInitials(user?.name)}
      </button>
      
      {isOpen && (
        <div className="profile-dropdown">
          <div className="profile-header">
            <h3>{user?.name}</h3>
            <p>{user?.email}</p>
          </div>
          
          <div className="profile-section">
            <h4>Your Groups</h4>
            {isLoading ? (
              <p>Loading groups...</p>
            ) : userGroups.length === 0 ? (
              <p>You haven't joined any groups yet.</p>
            ) : (
              <ul className="groups-list">
                {userGroups.map(group => (
                  <li key={group.inviteCode} className="group-item">
                    <span className="group-name">{group.groupName}</span>
                    <span className="group-code">{group.inviteCode}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <button 
            className="logout-button"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile; 