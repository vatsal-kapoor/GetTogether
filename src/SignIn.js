import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { useAuth } from './AuthContext';
import './CommonStyles.css';

const SignIn = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    lat: null,
    lng: null,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyBkP7i-whASB7_Db9q8E9zSsNqCl2wpdYI',
    libraries: ['places'],
    version: 'weekly',
  });

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (!place.geometry || !place.geometry.location) {
        setError('No details available for that address.');
        return;
      }

      const address = place.formatted_address;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      setFormData((prev) => ({
        ...prev,
        address,
        lat,
        lng,
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isSignUp) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      if (!formData.name) {
        setError('Name is required');
        setIsLoading(false);
        return;
      }
    }

    try {
      const endpoint = isSignUp ? 'http://localhost:3000/signup' : 'http://localhost:3000/signin';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          address: formData.address,
          lat: formData.lat,
          lng: formData.lng
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (isSignUp ? 'Failed to sign up' : 'Failed to sign in'));
      }

      const data = await response.json();
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h1 className="form-title">{isSignUp ? 'Sign Up' : 'Sign In'}</h1>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your name"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              {isLoaded ? (
                <Autocomplete
                  onLoad={(ref) => (autocompleteRef.current = ref)}
                  onPlaceChanged={onPlaceChanged}
                  options={{
                    componentRestrictions: { country: 'us' },
                    fields: ['address_components', 'geometry', 'formatted_address'],
                  }}
                >
                  <input
                    id="address"
                    name="address"
                    placeholder="Enter address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={isLoading}
                    style={{ width: '100%' }}
                  />
                </Autocomplete>
              ) : (
                <input
                  placeholder="Loading..."
                  disabled
                />
              )}
            </div>
          </>
        )}
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Enter password"
            disabled={isLoading}
          />
        </div>

        {isSignUp && (
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter password"
              disabled={isLoading}
            />
          </div>
        )}

        <button 
          type="submit" 
          className="submit-button"
          disabled={isLoading}
        >
          {isLoading
            ? isSignUp
              ? 'Creating Account...'
              : 'Signing In...'
            : isSignUp
            ? 'Sign Up'
            : 'Sign In'}
        </button>

        <button
          type="button"
          className="submit-button"
          onClick={() => setIsSignUp(!isSignUp)}
          disabled={isLoading}
          style={{ marginTop: '10px', backgroundColor: '#f5f5f5', color: '#333' }}
        >
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </form>
    </div>
  );
};

export default SignIn;
