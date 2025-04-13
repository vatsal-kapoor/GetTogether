import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from './config';
import './Suggestions.css';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

function Suggestions() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/nearby-places');
        const data = await response.json();
        setPlaces(data.results);
      } catch (error) {
        console.error('Error fetching places:', error);
      }
    };

    fetchPlaces();
  }, []);

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="suggestions-container">
      {/* Left Panel */}
      <div className="suggestions-panel">
        <div className="suggestions-header">
          <h1 className="suggestions-title">Suggestions</h1>
          <button className="back-button" onClick={handleBackToHome}>
            Back to Home
          </button>
        </div>

        <div className="search-container">
          <input type="text" placeholder="Search for places..." className="search-input" />
          <button className="search-button">Search</button>
        </div>

        <div className="filters">
          <button className="filter-button active">All</button>
          <button className="filter-button">Restaurants</button>
          <button className="filter-button">Activities</button>
          <button className="filter-button">Entertainment</button>
        </div>

        <div className="suggestions-list">
          {places.map((place, index) => (
            <div key={place.place_id || index} className="suggestion-item">
              <div className={`suggestion-image ${place.types?.[0] || 'default'}`}></div>
              <div className="suggestion-details">
                <h3>{place.name}</h3>
                <p className="suggestion-type">{place.types?.[0] || 'Establishment'}</p>
                <p className="suggestion-description">{place.address}</p>
                <div className="suggestion-meta">
                  {place.rating && <span className="rating">{place.rating} ★</span>}
                  <span className="distance">Nearby</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Map Panel */}
      <div className="map-container">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            center={DEFAULT_MAP_CENTER}
            zoom={DEFAULT_MAP_ZOOM}
            style={mapContainerStyle}
            mapId={'your-map-id'} // Optional
          >
            {places.map((place, index) => (
              place.location && (
                <Marker
                  key={place.place_id || index}
                  position={place.location}
                  title={place.name}
                />
              )
            ))}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}

export default Suggestions;
