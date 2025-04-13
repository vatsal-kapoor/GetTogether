import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import UserProfile from './UserProfile';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" />;
  }

  return (
    <div className="protected-route">
      <div className="header">
        <img 
          src={process.env.PUBLIC_URL + "/getTogetherLogo.png"} 
          alt="GetTogether Logo" 
          className="logo"
          onClick={() => navigate('/')}
        />
        <UserProfile />
      </div>
      <div className="content">
        {children}
      </div>
    </div>
  );
};

export default ProtectedRoute; 