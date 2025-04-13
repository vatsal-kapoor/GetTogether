import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import LandingPage from './LandingPage';
import Suggestions from './Suggestions';
import CreateGroup from './CreateGroup';
import JoinGroup from './JoinGroup';
import SignIn from './SignIn';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from './AuthContext';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/" element={
            <ProtectedRoute>
              <LandingPage />
            </ProtectedRoute>
          } />
          <Route path="/suggestions" element={
            <ProtectedRoute>
              <Suggestions />
            </ProtectedRoute>
          } />
          <Route path="/create-group" element={
            <ProtectedRoute>
              <CreateGroup />
            </ProtectedRoute>
          } />
          <Route path="/join-group" element={
            <ProtectedRoute>
              <JoinGroup />
            </ProtectedRoute>
          } />
          <Route path="/suggestions/:groupId" element={
            <ProtectedRoute>
              <Suggestions />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
