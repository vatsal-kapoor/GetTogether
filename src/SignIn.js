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
    libraries,
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
      const endpoint = isSignUp
        ? 'http://localhost:3000/signup'
        : 'http://localhost:3000/signin';

      const body = isSignUp
        ? {
            username: formData.username,
            password: formData.password,
            address: formData.address,
            lat: formData.lat,
            lng: formData.lng,
          }
        : {
            username: formData.username,
            password: formData.password,
          };
      
      console.log(body);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (isSignUp ? 'Failed to sign up' : 'Failed to sign in'));
      }
      if (!res.ok) throw new Error('Something went wrong');

      const data = await response.json();
      login(data.user, data.token);
      const data = await res.json();
      login(data);
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
        )}
        
    <div className="signin-container">
      <h1>{isSignUp ? 'Sign Up' : 'Sign In'}</h1>
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="signin-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <label>Username</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Enter your email"
            placeholder="Enter username"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            required
            disabled={isLoading}
          />
        </div>

        {isSignUp && (
          <>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>Address</label>
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
                    name="address"
                    placeholder="Enter address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="address-input"
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

        <button 
          type="submit" 
          className="submit-button"
          disabled={isLoading}
          className="primary-button"
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
          onClick={() => setIsSignUp((prev) => !prev)}
          disabled={isLoading}
          style={{ marginTop: '10px', backgroundColor: '#f5f5f5', color: '#333' }}
          className="secondary-button"
        >
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </form>
    </div>
  );
};

export default SignIn;
