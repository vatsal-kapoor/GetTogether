function getCentroid(locations){
    if (locations.length === 0) return null;

    // Start with arithmetic centroid as the initial guess
    let current = {
        lat: locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length,
        lng: locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length
    };
    const maxIterations = 100;
    const tolerance = 1e-6;

    for (let i = 0; i < maxIterations; i++) {
        let numLat = 0, numLng = 0, denom = 0;

        for (const loc of locations) {
            const dLat = loc.lat - current.lat;
            const dLng = loc.lng - current.lng;
            const dist = Math.sqrt(dLat * dLat + dLng * dLng) || 1e-10; // prevent division by 0

            const weight = 1 / dist;
            numLat += loc.lat * weight;
            numLng += loc.lng * weight;
            denom += weight;
        }

        const newLat = numLat / denom;
        const newLng = numLng / denom;

        const shift = Math.sqrt(Math.pow(newLat - current.lat, 2) + Math.pow(newLng - current.lng, 2));
        current = { lat: newLat, lng: newLng };

        if (shift < tolerance) break;
    }

    return current;
}





const googleMapsApiKey= 'AIzaSyBkP7i-whASB7_Db9q8E9zSsNqCl2wpdYI';
const axios = require('axios');

async function getNearbyPlaces(centroid, type = 'restaurant') {
    const { lat, lng } = centroid;
    const maxResults = 10;
    const url = `https://places.googleapis.com/v1/places:searchNearby?key=${googleMapsApiKey}`;
  
    const requestBody = {
        includedTypes: ['restaurant'],
        maxResultCount: 10,
        locationRestriction: {
          circle: {
            center: {
              latitude: centroid.lat,
              longitude: centroid.lng
            },
            radius: 8000
          }
        }
      };
  
    try {
      const response = await axios.post(url, requestBody, {
        headers: {
          'X-Goog-FieldMask': 'places.displayName,places.location,places.photos,places.rating,places.priceRange,places.websiteUri' // <-- field mask added
        }
      });
  
      return response.data.places || []; // updated key from .results to .places (per v1)
    } catch (error) {
      console.error('Error fetching places:', error);
      return [];
    }
  }
  


module.exports = { getNearbyPlaces, getCentroid };