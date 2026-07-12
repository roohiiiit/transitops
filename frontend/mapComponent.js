/* ═══════════════════════════════════════════════════════════
   TransitOps — Leaflet & OSRM Map Component
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let mapInstance = null;
  let sourceMarker = null;
  let destMarker = null;
  let routeLine = null;
  let driverMarker = null;
  let simulationInterval = null;

  let sourceCoords = null;
  let destCoords = null;

  // Initialize Map
  function init(containerId) {
    if (mapInstance) {
      mapInstance.remove();
    }

    // Default center on India
    mapInstance = L.map(containerId).setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    sourceMarker = null;
    destMarker = null;
    routeLine = null;
    sourceCoords = null;
    destCoords = null;

    // Fix leaflet grey-tile load issues by forcing a resize trigger
    setTimeout(() => {
      if (mapInstance) mapInstance.invalidateSize();
    }, 250);

    return mapInstance;
  }

  // Geocoding Search via Nominatim (Max 1 req/sec policy)
  async function searchPlaces(query) {
    if (!query || query.trim().length < 3) return [];
    
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en'
        }
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error('Nominatim search failed:', err);
      return [];
    }
  }

  // Set Source Pin
  function setSource(lat, lon, label, onRouteDone, tripStatus, tripId) {
    sourceCoords = { lat: Number(lat), lon: Number(lon) };

    if (sourceMarker) {
      mapInstance.removeLayer(sourceMarker);
    }

    sourceMarker = L.marker([lat, lon], {
      icon: L.divIcon({
        className: 'map-pin map-pin--source',
        html: '<div style="background-color: var(--accent); width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--bg-base); box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      })
    }).addTo(mapInstance);
    
    sourceMarker.bindPopup(`<b>Source:</b><br>${label}`).openPopup();

    checkAndDrawRoute(onRouteDone, tripStatus, tripId);
  }

  // Set Destination Pin
  function setDestination(lat, lon, label, onRouteDone, tripStatus, tripId) {
    destCoords = { lat: Number(lat), lon: Number(lon) };

    if (destMarker) {
      mapInstance.removeLayer(destMarker);
    }

    destMarker = L.marker([lat, lon], {
      icon: L.divIcon({
        className: 'map-pin map-pin--dest',
        html: '<div style="background-color: #ff4d4f; width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--bg-base); box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      })
    }).addTo(mapInstance);
    
    destMarker.bindPopup(`<b>Destination:</b><br>${label}`).openPopup();

    checkAndDrawRoute(onRouteDone, tripStatus, tripId);
  }

  // Draw OSRM Polyline Path & Calculate Distance
  async function checkAndDrawRoute(onRouteDone, tripStatus, tripId) {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
    if (driverMarker) {
      mapInstance.removeLayer(driverMarker);
      driverMarker = null;
    }

    if (!sourceCoords || !destCoords) {
      // Just center on the single active marker
      const active = sourceCoords || destCoords;
      mapInstance.setView([active.lat, active.lon], 12);
      return;
    }

    // Clear existing route line
    if (routeLine) {
      mapInstance.removeLayer(routeLine);
    }

    // Fit map bounds to show both pins
    const bounds = L.latLngBounds(
      [sourceCoords.lat, sourceCoords.lon],
      [destCoords.lat, destCoords.lon]
    );
    mapInstance.fitBounds(bounds, { padding: [50, 50] });

    try {
      // Public OSRM API (Note: Public routing instance is rate-limited and for demo use only)
      const url = `https://router.project-osrm.org/route/v1/driving/${sourceCoords.lon},${sourceCoords.lat};${destCoords.lon},${destCoords.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('OSRM routing request failed');
      
      const data = await res.json();
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found between coordinates');
      }

      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]); // LonLat to LatLon for Leaflet

      // Draw polyline route
      routeLine = L.polyline(coordinates, {
        color: 'var(--accent)',
        weight: 4,
        opacity: 0.8,
        dashArray: '2, 8'
      }).addTo(mapInstance);

      // Distance from OSRM is in meters -> convert to km
      const distanceKm = Math.round((route.distance / 1000) * 10) / 10;

      if (onRouteDone) {
        onRouteDone(distanceKm);
      }

      // Live Driver Location Polling for Dispatched trips
      if (tripStatus === 'Dispatched' && coordinates.length > 0) {
        driverMarker = L.marker(coordinates[0], {
          icon: L.divIcon({
            className: 'map-pin map-pin--driver',
            html: '<div style="font-size: 24px; text-shadow: 0 0 6px rgba(0,0,0,0.6); text-align:center;">🚚</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(mapInstance);

        driverMarker.bindPopup('<b>Driver Transit:</b><br>Live GPS Tracking Active').openPopup();

        // Initial fetch immediately
        if (tripId && window.API) {
          window.API.get(`/trips/${tripId}`).then(tripData => {
            if (tripData.current_lat && tripData.current_lon) {
              driverMarker.setLatLng([tripData.current_lat, tripData.current_lon]);
            }
          }).catch(console.error);
        }

        simulationInterval = setInterval(async () => {
          if (!mapInstance || !driverMarker || !tripId || !window.API) {
            clearInterval(simulationInterval);
            return;
          }
          try {
            const tripData = await window.API.get(`/trips/${tripId}`);
            if (tripData.current_lat && tripData.current_lon) {
              driverMarker.setLatLng([tripData.current_lat, tripData.current_lon]);
            }
          } catch (err) {
            console.error('Failed to poll driver GPS:', err);
          }
        }, 5000); // 5-second polling interval
      }
    } catch (err) {
      console.error('OSRM Routing error:', err);
      // Fallback straight line polyline in case routing server is down
      routeLine = L.polyline([
        [sourceCoords.lat, sourceCoords.lon],
        [destCoords.lat, destCoords.lon]
      ], {
        color: 'var(--text-muted)',
        weight: 3,
        opacity: 0.5,
        dashArray: '5, 10'
      }).addTo(mapInstance);

      // Haversine fallback distance calculation
      const dist = calcHaversineDistance(sourceCoords, destCoords);
      if (onRouteDone) {
        onRouteDone(dist);
      }
    }
  }

  // Helper: Haversine straight-line distance calculation
  function calcHaversineDistance(pt1, pt2) {
    const R = 6371; // Earth radius in km
    const dLat = (pt2.lat - pt1.lat) * Math.PI / 180;
    const dLon = (pt2.lon - pt1.lon) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pt1.lat * Math.PI / 180) * Math.cos(pt2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
  }

  // Reset Component State
  function reset() {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
    if (driverMarker) {
      mapInstance.removeLayer(driverMarker);
      driverMarker = null;
    }
    if (routeLine) mapInstance.removeLayer(routeLine);
    if (sourceMarker) mapInstance.removeLayer(sourceMarker);
    if (destMarker) mapInstance.removeLayer(destMarker);
    
    sourceMarker = null;
    destMarker = null;
    routeLine = null;
    sourceCoords = null;
    destCoords = null;

    mapInstance.setView([20.5937, 78.9629], 5);
  }

  // Public API Namespace
  window.MapComponent = {
    init,
    searchPlaces,
    setSource,
    setDestination,
    reset
  };

})();
