import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import UserProfile from './UserProfile';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" />;
  }

  return (
    <div className="protected-route">
      <div className="header">
        <UserProfile />
      </div>
      <div className="content">
        {children}
      </div>
    </div>
  );
};

export default ProtectedRoute; 