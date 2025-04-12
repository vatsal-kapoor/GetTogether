import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from './config';
import './Suggestions.css';

// Map container style
const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

function Suggestions() {
  return (
    <div className="suggestions-container">
      {/* Left side - Suggestions */}
      <div className="suggestions-panel">
        <h1 className="suggestions-title">Suggestions</h1>
        
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search for places..." 
            className="search-input"
          />
          <button className="search-button">Search</button>
        </div>
        
        <div className="filters">
          <button className="filter-button active">All</button>
          <button className="filter-button">Restaurants</button>
          <button className="filter-button">Activities</button>
          <button className="filter-button">Entertainment</button>
        </div>
        
        <div className="suggestions-list">
          {/* Sample suggestion items */}
          <div className="suggestion-item">
            <div className="suggestion-image restaurant"></div>
            <div className="suggestion-details">
              <h3>Gourmet Bistro</h3>
              <p className="suggestion-type">Restaurant</p>
              <p className="suggestion-description">Upscale dining with a modern twist</p>
              <div className="suggestion-meta">
                <span className="rating">4.5 ★</span>
                <span className="distance">0.3 miles</span>
              </div>
            </div>
          </div>
          
          <div className="suggestion-item">
            <div className="suggestion-image activity"></div>
            <div className="suggestion-details">
              <h3>Escape Room Challenge</h3>
              <p className="suggestion-type">Activity</p>
              <p className="suggestion-description">Solve puzzles and escape in 60 minutes</p>
              <div className="suggestion-meta">
                <span className="rating">4.8 ★</span>
                <span className="distance">0.7 miles</span>
              </div>
            </div>
          </div>
          
          <div className="suggestion-item">
            <div className="suggestion-image entertainment"></div>
            <div className="suggestion-details">
              <h3>Comedy Club</h3>
              <p className="suggestion-type">Entertainment</p>
              <p className="suggestion-description">Live stand-up comedy every weekend</p>
              <div className="suggestion-meta">
                <span className="rating">4.2 ★</span>
                <span className="distance">0.5 miles</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Map */}
      <div className="map-container">
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={DEFAULT_MAP_CENTER}
            zoom={DEFAULT_MAP_ZOOM}
          >
            <Marker position={DEFAULT_MAP_CENTER} />
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  );
}

export default Suggestions; 