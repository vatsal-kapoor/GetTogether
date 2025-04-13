import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from './config';
import './Suggestions.css';

// This component ensures the map instance is properly initialized
function MapController() {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      // Force the map to refresh its size calculations
      window.google.maps.event.trigger(map, 'resize');
      
      // Make sure the map is fully interactive
      map.setOptions({
        draggable: true,
        zoomControl: true,
        scrollwheel: true,
        disableDoubleClickZoom: false,
      });
    }
  }, [map]);
  
  return null;
}

function Suggestions() {
  const navigate = useNavigate();
  const { groupId } = useParams();

  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_MAP_ZOOM);
  const [places, setPlaces] = useState([]);
  const [groupLocations, setGroupLocations] = useState([]);
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFirstMember, setIsFirstMember] = useState(false);
  const mapContainerRef = useRef(null);

  // Make sure styles are explicitly defined and not overridden
  const mapContainerStyle = {
    width: '100%',
    height: '100%',
    position: 'relative',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1, // Ensure it's above other elements
  };

  // Comprehensive map options
  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: true,
    mapTypeControl: true,
    fullscreenControl: true,
    gestureHandling: 'auto',
    clickableIcons: true,
    draggable: true,
    scrollwheel: true,
    disableDoubleClickZoom: false,
    keyboardShortcuts: true,
  };

  useEffect(() => {
    const fetchGroupAndPlaces = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch group information using the new endpoint
        const groupResponse = await fetch(`http://localhost:3000/group-by-id/${groupId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!groupResponse.ok) {
          throw new Error('Failed to fetch group information');
        }
        
        const groupData = await groupResponse.json();
        setGroupInfo(groupData.group);
        
        // Check if current user is the first member
        const currentUserId = JSON.parse(localStorage.getItem('user'));
        if (groupData.group.members && groupData.group.members.length > 0) {
          const firstMember = groupData.group.admin;
          setIsFirstMember(firstMember === currentUserId._id);
        }
        
        // Fetch nearby places
        const placesResponse = await fetch('http://localhost:3000/suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ groupId }),
        });
        
        const placesData = await placesResponse.json();
        setPlaces(placesData.places);

        setMapCenter(placesData.centroid);
        console.log(placesData.places);
        
        // Fetch group locations
        const locationsResponse = await fetch('http://localhost:3000/grouplocations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ groupId }),
        });
        
        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json();
          setGroupLocations(locationsData);
          console.log('Group locations:', locationsData);
        } else {
          console.error('Failed to fetch group locations');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroupAndPlaces();
    } 
      // If no groupId is provided, just fetch places
    const fetchGroup = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/nearby-places');
        const data = await response.json();
        setPlaces(data.results);
      } catch (error) {
        console.error('Error fetching places:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroup();
    
  }, [groupId]);

  // Force map recalculation when component mounts and on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.google && window.google.maps) {
        window.google.maps.event.trigger(window.map, 'resize');
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleZoomChanged = (event) => {
    setMapZoom(event.detail.zoom);
  };

  const handleMapClick = (event) => {
    const { lat, lng } = event.detail.latLng;
    setMapCenter({ lat, lng });
  };

  return (
    <div className="suggestions-container">
      {/* Left Panel */}
      <div className="suggestions-panel">
        <div className="suggestions-header">
          <h1 className="suggestions-title">
            {groupInfo ? `Suggestions for ${groupInfo.groupName}` : 'Suggestions'}
          </h1>
          <button className="back-button" onClick={handleBackToHome}>
            Back to Home
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="search-container">
          <input type="text" placeholder="Search for places..." className="search-input" />
          <button className="search-button">Search</button>
        </div>

        <div className="filters-container">
          <div className="filters">
            <button className="filter-button active">All</button>
            <button className="filter-button">Restaurants</button>
            <button className="filter-button">Activities</button>
            <button className="filter-button">Entertainment</button>
          </div>
          {isFirstMember && (
            <button className="view-suggestions-button">
              View Suggestions
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-message">Loading suggestions...</div>
        ) : (
          <div className="suggestions-list">
  {places.map((place, index) => (
    <div key={index} className="suggestion-item">
      <div className="suggestion-image">
      {/* Try to use the actual photo URL from the place data */}
      <img 
        width="100%" 
        src={place.photos && place.photos.length > 0 
          ? place.photos[0].flagContentUri  // or whatever field has the actual photo URL
          : '/placeholder-image.jpg'}
        alt={place.displayName?.text || 'Location image'}
      />
    </div>
      <div className="suggestion-details">
        <h3>{place.displayName?.text || 'Unnamed Place'}</h3>
        
        {place.rating && (
          <p className="suggestion-rating">
            {/* Display stars based on rating */}
            {'★'.repeat(Math.floor(place.rating))}
            {place.rating % 1 >= 0.5 ? '½' : ''}
            {' '}{place.rating}
          </p>
        )}
        
        <p className="suggestion-description">
          {/* Display address or coordinates */}
          {place.formattedAddress || 
            `Lat: ${place.location?.latitude?.toFixed(4)}, Lng: ${place.location?.longitude?.toFixed(4)}`}
        </p>
        
        {/* Website if available */}
        {place.websiteUri && (
          <p className="suggestion-website">
            <a href={place.websiteUri} target="_blank" rel="noopener noreferrer">
              Visit Website
            </a>
          </p>
        )}
        
        {/* Price range if available */}
        {place.priceRange && (
          <p className="suggestion-price">
            Price Range: {place.priceRange.startPrice?.formattedAmount || ''} 
            {place.priceRange.startPrice && place.priceRange.endPrice && ' - '}
            {place.priceRange.endPrice?.formattedAmount || ''}
          </p>
        )}
        
        <div className="suggestion-meta">
          {/* Any other metadata you want to display */}
          <span className="distance">Nearby</span>
        </div>
      </div>
    </div>
  ))}
</div>
        )}
      </div>

      {/* Right Map Panel */}
      <div className="map-container" ref={mapContainerRef}>
        <APIProvider 
          apiKey={GOOGLE_MAPS_API_KEY}
          libraries={['places']}
        >
          <Map
            center={mapCenter}
            zoom={mapZoom}
            style={mapContainerStyle}
            mapId={'your-map-id'}
            onClick={handleMapClick}
            onZoomChanged={handleZoomChanged}
            gestureHandling="greedy"
            disableDefaultUI={false}
            zoomControl={true}
            mapTypeControl={true}
            scaleControl={true}
            streetViewControl={true}
            rotateControl={true}
            fullscreenControl={true}
          >
            <MapController />
            {places.map((place, index) => (
              place.location && (
                <Marker
                  key={place.place_id || index}
                  position={{
                    lat: place.location?.latitude,
                    lng: place.location?.longitude
                  }}
                  title={place.displayName?.text}
                />
              )
            ))}
            {groupLocations.map((location, index) => (
              <Marker
                key={`member-${index}`}
                position={{
                  lat: location.lat,
                  lng: location.lng
                }}
                title={`Group Member ${index + 1}`}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#4285F4', // Google Blue
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 2
                }}
              />
            ))}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}

export default Suggestions;