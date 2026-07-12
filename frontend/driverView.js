/* ═══════════════════════════════════════════════════════════
   TransitOps — Mobile Driver View
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const API_URL = window.location.origin;
  let activeTrip = null;
  let watchId = null;
  let isBroadcasting = false;

  async function create() {
    document.body.className = 'driver-view-active';
    
    // Check if we have trips
    // In a real app, we'd fetch `/trips?driverId=X` but here we just get all Dispatched trips
    const allTrips = DataLayer.getTrips();
    const dispatchedTrips = allTrips.filter(t => t.status === 'Dispatched');

    renderSelectionScreen(dispatchedTrips);
  }

  function renderSelectionScreen(trips) {
    let listHtml = '';
    
    if (trips.length === 0) {
      listHtml = `
        <div style="text-align:center; padding: 40px 20px; color: var(--text-muted);">
          <div style="font-size: 48px; margin-bottom:16px;">💤</div>
          <h3>No Active Trips</h3>
          <p>You have no dispatched trips at the moment.</p>
        </div>
      `;
    } else {
      listHtml = trips.map(t => `
        <div class="driver-trip-card" onclick="window.TransitOps.DriverView.selectTrip(${t.id})">
          <div style="font-size: 12px; color: var(--accent); margin-bottom: 4px; font-weight: 600; text-transform:uppercase;">Trip #${t.id}</div>
          <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${t.source} → ${t.destination}</div>
          <div style="color: var(--text-muted); font-size: 14px;">Cargo: ${t.cargoWeightKg} kg</div>
          <button class="btn btn--accent" style="width: 100%; margin-top: 16px;">Select Trip</button>
        </div>
      `).join('');
    }

    const html = `
      <div class="driver-layout">
        <div class="driver-header">
          <div class="wordmark" style="font-size: 20px;">Transit<span class="text-accent">Ops</span> Driver</div>
          <button class="btn btn--ghost" style="padding: 6px 12px; font-size: 14px;" onclick="window.TransitOps.DriverView.signOut()">Sign Out</button>
        </div>
        <div class="driver-content">
          <h2 style="margin-bottom: 20px;">Your Dispatched Trips</h2>
          ${listHtml}
        </div>
      </div>
    `;

    document.body.innerHTML = html;
  }

  function selectTrip(tripId) {
    const allTrips = DataLayer.getTrips();
    activeTrip = allTrips.find(t => t.id === tripId);
    if (activeTrip) {
      renderActiveMissionScreen();
    }
  }

  function renderActiveMissionScreen() {
    const html = `
      <div class="driver-layout">
        <div class="driver-header">
          <button class="btn btn--ghost" style="padding: 6px 12px; font-size: 14px;" onclick="window.TransitOps.DriverView.goBack()">← Back</button>
          <div class="wordmark" style="font-size: 20px;">Mission <span class="text-accent">Control</span></div>
        </div>
        
        <div class="driver-content" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; height: 100%;">
          
          <div style="margin-bottom: 40px; width: 100%;">
            <div style="font-size: 14px; color: var(--accent); font-weight: 600; margin-bottom: 8px; text-transform: uppercase;">Active Route</div>
            <div style="font-size: 28px; font-weight: 700;">${activeTrip.source}</div>
            <div style="font-size: 24px; color: var(--text-muted); margin: 8px 0;">↓</div>
            <div style="font-size: 28px; font-weight: 700;">${activeTrip.destination}</div>
          </div>

          <div class="gps-status-container" id="gps-status-container" style="background: var(--bg-card); padding: 30px; border-radius: 16px; border: 1px solid var(--border-color); width: 100%; max-width: 400px; margin-bottom: 40px;">
            <div id="gps-icon" style="font-size: 48px; margin-bottom: 16px;">🛰️</div>
            <h3 id="gps-title" style="margin-bottom: 8px;">GPS Offline</h3>
            <p id="gps-desc" style="color: var(--text-muted); font-size: 14px; margin-bottom: 0;">Your location is not being broadcasted.</p>
          </div>

          <button id="broadcast-btn" class="btn btn--accent" style="width: 100%; max-width: 400px; padding: 20px; font-size: 18px; border-radius: 12px; font-weight: 600;" onclick="window.TransitOps.DriverView.toggleBroadcast()">
            Start Broadcasting GPS
          </button>
          
        </div>
      </div>
    `;

    document.body.innerHTML = html;
  }

  function toggleBroadcast() {
    isBroadcasting = !isBroadcasting;
    const btn = document.getElementById('broadcast-btn');
    const statusContainer = document.getElementById('gps-status-container');
    const title = document.getElementById('gps-title');
    const desc = document.getElementById('gps-desc');
    const icon = document.getElementById('gps-icon');

    if (isBroadcasting) {
      btn.textContent = 'Stop Broadcasting';
      btn.style.background = '#ff4d4f';
      btn.style.color = '#fff';
      
      statusContainer.style.borderColor = 'var(--accent)';
      statusContainer.style.boxShadow = '0 0 20px rgba(212, 255, 63, 0.2)';
      title.textContent = 'Transmitting Live';
      title.style.color = 'var(--accent)';
      desc.textContent = 'Connecting to GPS satellites...';
      icon.innerHTML = '<div style="animation: pulse 1.5s infinite;">📡</div>';

      startGPS();
    } else {
      btn.textContent = 'Start Broadcasting GPS';
      btn.style.background = 'var(--accent)';
      btn.style.color = 'var(--bg-base)';

      statusContainer.style.borderColor = 'var(--border-color)';
      statusContainer.style.boxShadow = 'none';
      title.textContent = 'GPS Offline';
      title.style.color = 'var(--text-primary)';
      desc.textContent = 'Your location is not being broadcasted.';
      icon.innerHTML = '🛰️';

      stopGPS();
    }
  }

  function startGPS() {
    if (!navigator.geolocation) {
      document.getElementById('gps-desc').textContent = 'Geolocation is not supported by your browser.';
      return;
    }

    const token = localStorage.getItem('transitops_token');

    watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        document.getElementById('gps-desc').textContent = `Tracking Active: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;

        try {
          await fetch(`${API_URL}/trips/${activeTrip.id}/location`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ lat, lon })
          });
        } catch (err) {
          console.error("Failed to broadcast location:", err);
        }
      },
      (error) => {
        console.error("GPS Error:", error);
        document.getElementById('gps-desc').textContent = `GPS Error: ${error.message}`;
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );
  }

  function stopGPS() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  function goBack() {
    stopGPS();
    isBroadcasting = false;
    activeTrip = null;
    create();
  }

  function signOut() {
    stopGPS();
    localStorage.removeItem('transitops_token');
    window.TransitOps.showLogin();
  }

  // Add styles dynamically for Driver View
  const style = document.createElement('style');
  style.textContent = `
    body.driver-view-active {
      background: var(--bg-base);
      color: var(--text-primary);
      margin: 0;
      padding: 0;
      height: 100vh;
      overflow: hidden;
    }
    .driver-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
    }
    .driver-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-card);
    }
    .driver-content {
      flex: 1;
      padding: 24px 20px;
      overflow-y: auto;
    }
    .driver-trip-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .driver-trip-card:hover {
      border-color: var(--accent);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
  `;
  document.head.appendChild(style);

  window.TransitOps = window.TransitOps || {};
  window.TransitOps.DriverView = {
    create,
    selectTrip,
    toggleBroadcast,
    goBack,
    signOut
  };

})();
