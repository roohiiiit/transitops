/* ═══════════════════════════════════════════════════════════
   TransitOps — Trip Management Module
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let currentFilter = 'All';
  let tripMap = null;
  let tripMapMarker = null;
  let tripRoutePolyline = null;
  let mapPollInterval = null;
  let activeMapTripId = null;

  const STATUS_CLASS = {
    'Draft': 'status-pill--shop', // gray/neutral
    'Dispatched': 'status-pill--ontrip', // orange/yellow
    'Completed': 'status-pill--available', // green
    'Cancelled': 'status-pill--retired', // red
  };

  function currency(val) {
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  function formatWeight(val) {
    return Number(val).toLocaleString('en-IN') + ' kg';
  }

  function formatDist(val) {
    return Number(val).toLocaleString('en-IN') + ' km';
  }

  // --- Filtering ---
  function getFilteredTrips() {
    const all = DataLayer.getTrips();
    if (currentFilter === 'All') return all;
    return all.filter(t => t.status === currentFilter);
  }

  function setFilter(filter) {
    currentFilter = filter;
    refreshContent();
  }

  function refreshContent() {
    const wrap = document.getElementById('trips-content-wrap');
    if (wrap) {
      wrap.innerHTML = `
        ${buildStatsBar()}
        ${buildFilterTabs()}
        ${buildTripsTable()}
      `;
      bindEvents();
    }
  }

  // --- Layout Builders ---
  function buildStatsBar() {
    const all = DataLayer.getTrips();
    const stats = {
      total: all.length,
      draft: all.filter(t => t.status === 'Draft').length,
      dispatched: all.filter(t => t.status === 'Dispatched').length,
      completed: all.filter(t => t.status === 'Completed').length,
    };

    return `
      <div class="stats-grid" style="margin-bottom: 24px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
        <div class="stat-card" style="background: var(--bg-card); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-family: var(--font-mono); margin-bottom: 4px;">Total Trips</div>
          <div style="font-size: 24px; font-weight: 600; color: var(--text-primary); font-family: var(--font-display);">${stats.total}</div>
        </div>
        <div class="stat-card" style="background: var(--bg-card); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-family: var(--font-mono); margin-bottom: 4px;">Draft / Pending</div>
          <div style="font-size: 24px; font-weight: 600; color: var(--accent); font-family: var(--font-display);">${stats.draft}</div>
        </div>
        <div class="stat-card" style="background: var(--bg-card); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-family: var(--font-mono); margin-bottom: 4px;">Dispatched</div>
          <div style="font-size: 24px; font-weight: 600; color: #ff9f1c; font-family: var(--font-display);">${stats.dispatched}</div>
        </div>
        <div class="stat-card" style="background: var(--bg-card); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-family: var(--font-mono); margin-bottom: 4px;">Completed</div>
          <div style="font-size: 24px; font-weight: 600; color: #2ec4b6; font-family: var(--font-display);">${stats.completed}</div>
        </div>
      </div>
    `;
  }

  function buildFilterTabs() {
    const filters = ['All', 'Draft', 'Dispatched', 'Completed', 'Cancelled'];
    return `
      <div class="filter-bar" style="margin-bottom: 16px; display: flex; gap: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
        ${filters.map(f => `
          <button class="btn btn--small ${currentFilter === f ? 'btn--accent' : 'btn--ghost'}" data-filter="${f}">
            ${f}
          </button>
        `).join('')}
      </div>
    `;
  }

  function buildTripsTable() {
    const trips = getFilteredTrips();
    if (trips.length === 0) {
      return `
        <div style="text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border-color); color: var(--text-muted);">
          <div style="font-size: 32px; margin-bottom: 12px;">📭</div>
          <div style="font-size: 16px; font-weight: 500;">No trips found</div>
          <div style="font-size: 13px; margin-top: 4px;">There are no trips in this category.</div>
        </div>
      `;
    }

    const cardsHtml = trips.map(t => {
      const vehicle = t.vehicleId ? DataLayer.getVehicleById(t.vehicleId) : null;
      const driver = t.driverId ? DataLayer.getDriverById(t.driverId) : null;
      const pillClass = STATUS_CLASS[t.status] || '';

      const actions = [];
      if (t.status === 'Draft') {
        actions.push(`<button class="btn btn--small btn--accent btn-dispatch" data-id="${t.id}">Dispatch</button>`);
        actions.push(`<button class="btn btn--small btn--danger btn-cancel" data-id="${t.id}">Cancel</button>`);
      } else if (t.status === 'Dispatched') {
        actions.push(`<button class="btn btn--small btn--accent btn-complete" data-id="${t.id}" style="background-color:#2ec4b6; border-color:#2ec4b6;">Complete</button>`);
        actions.push(`<button class="btn btn--small btn--danger btn-cancel" data-id="${t.id}">Cancel</button>`);
      }

      return `
        <div class="trip-card trip-row" data-id="${t.id}" 
             style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; cursor: pointer; transition: all 0.2s ease;"
             onmouseenter="this.style.transform='translateY(-2px)'; this.style.borderColor='var(--accent)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.2)';"
             onmouseleave="this.style.transform='translateY(0)'; this.style.borderColor='var(--border-color)'; this.style.boxShadow='none';">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 600; color: var(--text-muted);">
              TRIP #${String(t.id).padStart(3, '0')}
            </div>
            <span class="status-pill ${pillClass}">${t.status}</span>
          </div>

          <div style="margin-bottom: 24px;">
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Route</div>
            <div style="font-size: 16px; font-weight: 600; color: var(--text-primary); line-height: 1.4;">
              ${t.source} <span style="color: var(--accent); margin: 0 4px;">→</span> ${t.destination}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div>
              <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Driver</div>
              <div style="font-size: 13px; font-weight: 500;">${driver ? driver.name : '<span style="color:#ff4d4f">Unassigned</span>'}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Vehicle</div>
              <div style="font-size: 13px; font-weight: 500;" class="font-mono">${vehicle ? vehicle.regNumber : '<span style="color:#ff4d4f">Unassigned</span>'}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Weight</div>
              <div style="font-size: 13px; font-weight: 500;" class="font-mono">${formatWeight(t.cargoWeightKg)}</div>
            </div>
            <div>
              <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Distance</div>
              <div style="font-size: 13px; font-weight: 500;" class="font-mono">${formatDist(t.plannedDistanceKm)}</div>
            </div>
          </div>

          <div style="margin-top: auto; display: flex; gap: 8px; justify-content: flex-end;" class="trip-actions-cell">
            ${actions.join('')}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="trips-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; padding: 12px 0;">
        ${cardsHtml}
      </div>
    `;
  }

  // --- Event Binding ---
  

  // --- Map Modal Logic ---
  function initMapModal() {
    if (document.getElementById('trip-map-modal')) return;
    const modalHtml = `
      <div id="trip-map-modal" class="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); z-index: 1000; justify-content: center; align-items: center; backdrop-filter: blur(4px);">
        <div style="background: var(--bg-card); width: 90vw; max-width: 800px; height: 80vh; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--border-color); box-shadow: 0 24px 48px rgba(0,0,0,0.5);">
          <div style="padding: 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h2 id="trip-map-title" style="margin: 0; font-family: var(--font-display); font-size: 20px; color: var(--text-primary);">Trip Live Tracking</h2>
              <div id="trip-map-subtitle" style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Loading location...</div>
            </div>
            <button id="close-map-modal" class="btn btn--ghost" style="padding: 8px;">✕</button>
          </div>
          <div id="trip-map-container" style="flex: 1; background: #111;"></div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('close-map-modal').addEventListener('click', closeMapModal);
    document.getElementById('trip-map-modal').addEventListener('click', (e) => {
      if (e.target.id === 'trip-map-modal') closeMapModal();
    });
  }

  function closeMapModal() {
    document.getElementById('trip-map-modal').style.display = 'none';
    if (mapPollInterval) {
      clearInterval(mapPollInterval);
      mapPollInterval = null;
    }
    activeMapTripId = null;
  }

  function renderMapMarker(lat, lng) {
    if (!tripMapMarker) {
      // Create a custom icon for the vehicle
      const vehicleIcon = L.icon({
        iconUrl: 'truck.png',
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });
      tripMapMarker = L.marker([lat, lng], { icon: vehicleIcon }).addTo(tripMap);
    } else {
      tripMapMarker.setLatLng([lat, lng]);
    }
    tripMap.setView([lat, lng], 15, { animate: true });
  }

  async function pollTripLocation() {
    if (!activeMapTripId) return;
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('transitops_token')}` };
      const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:8000' : window.location.origin;
      const res = await fetch(`${API_URL}/trips/${activeMapTripId}`, { headers });
      if (res.ok) {
        const trip = await res.json();
        if (trip.current_lat && trip.current_lon) {
          renderMapMarker(trip.current_lat, trip.current_lon);
          const driver = DataLayer.getDriverById(trip.driverId);
          const subtitle = document.getElementById('trip-map-subtitle');
          subtitle.innerHTML = `${driver ? driver.name : 'Unknown Driver'} &bull; ${trip.status} &bull; Lat: ${trip.current_lat.toFixed(4)}, Lng: ${trip.current_lon.toFixed(4)}`;
        }
      }
    } catch (e) {
      console.error("Polling error", e);
    }
  }

  const CITY_COORDS = {
    'Bangalore': [12.9716, 77.5946],
    'Chennai': [13.0827, 80.2707],
    'Coimbatore': [11.0168, 76.9558],
    'Goa': [15.2993, 74.1240],
    'Hubli': [15.3647, 75.1240],
    'Hyderabad': [17.3850, 78.4867],
    'Mangalore': [12.9141, 74.8560],
    'Mysore': [12.2958, 76.6394],
    'Pune': [18.5204, 73.8567]
  };

  function showMapModal(tripId) {
    initMapModal();
    const trip = DataLayer.getTrips().find(t => t.id === Number(tripId));
    if (!trip) return;

    activeMapTripId = trip.id;
    document.getElementById('trip-map-modal').style.display = 'flex';
    document.getElementById('trip-map-title').innerText = `Trip #${String(trip.id).padStart(3, '0')} — Live Tracking`;
    document.getElementById('trip-map-subtitle').innerText = 'Locating vehicle...';

    // Initialize Leaflet if not already
    if (!tripMap) {
      tripMap = L.map('trip-map-container', { zoomControl: false });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(tripMap);
    }

    setTimeout(async () => {
      tripMap.invalidateSize();
      
      if (tripRoutePolyline) {
        tripRoutePolyline.remove();
        tripRoutePolyline = null;
      }
      if (tripMapMarker) {
        tripMapMarker.remove();
        tripMapMarker = null;
      }
      
      const src = CITY_COORDS[trip.source];
      const dst = CITY_COORDS[trip.destination];
      
      if (src && dst) {
        try {
          // OSRM routing request
          const url = `https://router.project-osrm.org/route/v1/driving/${src[1]},${src[0]};${dst[1]},${dst[0]}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (data.routes && data.routes.length > 0) {
              const coordinates = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]); // LonLat to LatLon
              
              // Draw solid route polyline
              tripRoutePolyline = L.polyline(coordinates, { 
                color: 'var(--accent)', 
                weight: 5, 
                opacity: 0.9 
              }).addTo(tripMap);
              
              tripMap.fitBounds(tripRoutePolyline.getBounds(), { padding: [40, 40], animate: true });
              document.getElementById('trip-map-subtitle').innerText = 'Vehicle Location Tracking Active';
            }
          }
        } catch (err) {
          console.error("OSRM Routing failed:", err);
        }
      }

      // If routing failed or didn't return routes, fallback to straight line
      if (!tripRoutePolyline && src && dst) {
        tripRoutePolyline = L.polyline([src, dst], { color: 'var(--accent)', weight: 5, opacity: 0.7, dashArray: '10, 10' }).addTo(tripMap);
        tripMap.fitBounds(tripRoutePolyline.getBounds(), { padding: [40, 40] });
      }

      if (trip.current_lat && trip.current_lon) {
        renderMapMarker(trip.current_lat, trip.current_lon);
      } else if (!src || !dst) {
        tripMap.setView([20.5937, 78.9629], 5);
        document.getElementById('trip-map-subtitle').innerText = 'No live GPS data available for this trip yet.';
      }

      if (trip.status === 'Dispatched') {
        pollTripLocation();
        mapPollInterval = setInterval(pollTripLocation, 5000);
      }
    }, 400);
  }

  function bindEvents() {
    // Filter Clicks
    document.querySelectorAll('.filter-bar button').forEach(btn => {
      btn.addEventListener('click', () => {
        setFilter(btn.dataset.filter);
      });
    });

    // Row Clicks (opens drawer)
    document.querySelectorAll('.trip-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.trip-actions-cell') || e.target.classList.contains('btn')) return;
        openDrawer(row.dataset.id);
      });
    });

    // Dispatch Actions
    
    document.querySelectorAll('.trip-row').forEach(row => {
      row.addEventListener('click', (e) => {
        // Prevent map from opening if a button was clicked
        if (e.target.closest('button')) return;
        const id = row.getAttribute('data-id');
        showTripDetailsModal(id);
      });
    });

    document.querySelectorAll('.btn-dispatch').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        try {
          await DataLayer.dispatchTrip(id);
          refreshContent();
        } catch (err) {
          alert(err.message || 'Failed to dispatch trip');
        }
      });
    });

    // Complete Actions
    document.querySelectorAll('.btn-complete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openCompleteModal(btn.dataset.id);
      });
    });

    // Cancel Actions
    document.querySelectorAll('.btn-cancel').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to cancel this trip?')) {
          const id = btn.dataset.id;
          try {
            await DataLayer.cancelTrip(id);
            refreshContent();
          } catch (err) {
            alert(err.message || 'Failed to cancel trip');
          }
        }
      });
    });
  }

  // --- Page Renderer ---
  function renderTripsPage() {
    const role = DataLayer.getCurrentRole();
    const canCreate = (role === 'Fleet Manager' || role === 'Safety Officer');

    return `
      <div class="page-toolbar">
        <div class="page-toolbar-left"></div>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn--ghost" id="btn-report-trips">Generate Report</button>
          ${canCreate ? `
            <button class="btn btn--accent" id="btn-add-trip">
              <span class="btn-icon">+</span> Schedule Trip
            </button>
          ` : ''}
        </div>

      </div>
      <div id="trips-content-wrap">

        ${buildStatsBar()}
        ${buildFilterTabs()}
        ${buildTripsTable()}
      </div>
    `;
  }


  // --- Register Page ---

  TransitOps.registerPage('trips', () => {
    setTimeout(() => {
      bindEvents();


            const role = DataLayer.getCurrentRole();
      const canCreate = (role === 'Fleet Manager' || role === 'Safety Officer');
      if (canCreate) {
        const addBtn = document.getElementById('btn-add-trip');
        if (addBtn) addBtn.addEventListener('click', openAddModal);
      }


      const reportBtn = document.getElementById('btn-report-trips');
      if (reportBtn) {
        reportBtn.addEventListener('click', () => {
          if (window.TransitOps && typeof window.TransitOps.openReportModal === 'function') {
            window.TransitOps.openReportModal('Trips', () => getFilteredTrips());
          } else {
            console.error("window.TransitOps.openReportModal is undefined when Generate Report was clicked");
          }
        });
      }
    }, 200);

    return renderTripsPage();
  });


  // ── Trip Details Modal ──
  function initTripDetailsModal() {
    if (document.getElementById('trip-details-modal')) return;
    
    const modalHTML = `
      <div id="trip-details-modal" class="modal-backdrop" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 1000; align-items: center; justify-content: center;">
        <div class="modal-content" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; width: 90%; max-width: 700px; max-height: 90vh; overflow-y: auto; padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <h2 id="td-title" style="margin: 0; font-size: 20px;">Trip Details</h2>
              <span id="td-badge" class="status-badge" style="font-size: 13px;"></span>
            </div>
            <button id="td-close" style="background: transparent; border: none; color: var(--text-muted); font-size: 24px; cursor: pointer;">&times;</button>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
            
            <!-- Route Section -->
            <div style="background: var(--bg-base); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color); grid-column: 1 / -1;">
              <h3 style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase;">Route Information</h3>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div style="font-size: 24px; font-weight: 600; color: var(--text-primary);" id="td-source"></div>
                <div style="color: var(--accent);">→</div>
                <div style="font-size: 24px; font-weight: 600; color: var(--text-primary);" id="td-destination"></div>
              </div>
              <div style="display: flex; gap: 24px; font-size: 14px; color: var(--text-secondary);">
                <div><strong>Planned Dist:</strong> <span id="td-planned-dist"></span> km</div>
                <div id="td-actual-dist-container" style="display: none;"><strong>Actual Odo:</strong> <span id="td-actual-dist"></span> km</div>
              </div>
            </div>

            <!-- Assignment Section -->
            <div style="background: var(--bg-base); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
              <h3 style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase;">Driver Assignment</h3>
              <div id="td-driver-info" style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;"></div>
            </div>

            <div style="background: var(--bg-base); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
              <h3 style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase;">Vehicle Assignment</h3>
              <div id="td-vehicle-info" style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;"></div>
            </div>

            <!-- Cargo & Info -->
            <div style="background: var(--bg-base); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
              <h3 style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase;">Cargo & Resources</h3>
              <div id="td-cargo-info" style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;"></div>
            </div>

            <!-- Costs -->
            <div style="background: var(--bg-base); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
              <h3 style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase;">Vehicle Total Costs</h3>
              <div id="td-cost-info" style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;"></div>
            </div>
          </div>
          
          <div id="td-actions" style="display: flex; gap: 12px; justify-content: flex-end; border-top: 1px solid var(--border-color); padding-top: 16px;">
             <!-- Buttons dynamically injected here -->
          </div>

        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('td-close').addEventListener('click', () => {
      document.getElementById('trip-details-modal').style.display = 'none';
    });
    
    // Close on backdrop click
    document.getElementById('trip-details-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        e.target.style.display = 'none';
      }
    });
  }

  function showTripDetailsModal(tripId) {
    initTripDetailsModal();
    const trip = DataLayer.getTrips().find(t => t.id === Number(tripId));
    if (!trip) return;

    // Header
    document.getElementById('td-title').innerText = `Trip #${String(trip.id).padStart(3, '0')}`;
    const badge = document.getElementById('td-badge');
    badge.innerText = trip.status;
    badge.className = 'status-badge';
    if (trip.status === 'Draft') badge.classList.add('status-draft');
    else if (trip.status === 'Dispatched') badge.classList.add('status-dispatched');
    else if (trip.status === 'Completed') badge.classList.add('status-completed');
    else if (trip.status === 'Cancelled') badge.classList.add('status-cancelled');

    // Route
    document.getElementById('td-source').innerText = trip.source;
    document.getElementById('td-destination').innerText = trip.destination;
    document.getElementById('td-planned-dist').innerText = trip.plannedDistanceKm;
    
    const odoContainer = document.getElementById('td-actual-dist-container');
    if (trip.status === 'Completed' && trip.actualOdometer) {
      document.getElementById('td-actual-dist').innerText = trip.actualOdometer;
      odoContainer.style.display = 'block';
    } else {
      odoContainer.style.display = 'none';
    }

    // Driver & Vehicle
    const driver = trip.driverId ? DataLayer.getDrivers().find(d => d.id === trip.driverId) : null;
    const vehicle = trip.vehicleId ? DataLayer.getVehicles().find(v => v.id === trip.vehicleId) : null;

    document.getElementById('td-driver-info').innerHTML = driver ? `
      <strong>Name:</strong> ${driver.name}<br>
      <strong>License:</strong> ${driver.licenseNumber} (${driver.licenseCategory})<br>
      <strong>Contact:</strong> ${driver.contactNumber || 'N/A'}<br>
      <strong>Safety Score:</strong> ${driver.safetyScore}
    ` : 'Unassigned';

    document.getElementById('td-vehicle-info').innerHTML = vehicle ? `
      <strong>Reg Number:</strong> ${vehicle.regNumber}<br>
      <strong>Type:</strong> ${vehicle.type}<br>
      <strong>Capacity:</strong> ${vehicle.maxLoadKg} kg
    ` : 'Unassigned';

    // Cargo & Info
    document.getElementById('td-cargo-info').innerHTML = `
      <strong>Weight:</strong> ${trip.cargoWeightKg} kg<br>
      ${trip.status === 'Completed' && trip.fuelConsumed ? `<strong>Fuel Consumed:</strong> ${trip.fuelConsumed} L` : ''}
    `;

    // Costs
    if (vehicle) {
      const fuelCost = typeof DataLayer.getTotalFuelCost === 'function' ? DataLayer.getTotalFuelCost(vehicle.id) : 0;
      const maintCost = typeof DataLayer.getTotalMaintenanceCost === 'function' ? DataLayer.getTotalMaintenanceCost(vehicle.id) : 0;
      const opCost = typeof DataLayer.getOperationalCost === 'function' ? DataLayer.getOperationalCost(vehicle.id) : (fuelCost + maintCost);
      
      document.getElementById('td-cost-info').innerHTML = `
        <strong>Fuel Cost:</strong> $${fuelCost.toFixed(2)}<br>
        <strong>Maintenance Cost:</strong> $${maintCost.toFixed(2)}<br>
        <strong>Total Operational Cost:</strong> <span style="color:var(--accent);font-weight:600;">$${opCost.toFixed(2)}</span>
      `;
    } else {
      document.getElementById('td-cost-info').innerHTML = 'N/A (No vehicle assigned)';
    }

    // Actions
    const actionsContainer = document.getElementById('td-actions');
    actionsContainer.innerHTML = ''; // Clear old buttons

    if (trip.status === 'Draft') {
      const btn = document.createElement('button');
      btn.className = 'btn btn--accent';
      btn.innerText = 'Dispatch';
      btn.onclick = async () => {
        btn.disabled = true;
        try {
          await DataLayer.dispatchTrip(trip.id);
          document.getElementById('trip-details-modal').style.display = 'none';
          renderTripsPage();
        } catch (err) {
          alert(err.message);
          btn.disabled = false;
        }
      };
      actionsContainer.appendChild(btn);
    } else if (trip.status === 'Dispatched') {
      const btnComplete = document.createElement('button');
      btnComplete.className = 'btn btn--success';
      btnComplete.innerText = 'Complete';
      btnComplete.onclick = () => {
        const odo = prompt("Enter actual odometer reading (km):");
        if (!odo) return;
        const fuel = prompt("Enter fuel consumed (L):");
        if (!fuel) return;
        
        btnComplete.disabled = true;
        DataLayer.completeTrip(trip.id, parseFloat(odo), parseFloat(fuel)).then(() => {
          document.getElementById('trip-details-modal').style.display = 'none';
          renderTripsPage();
        }).catch(err => {
          alert(err.message);
          btnComplete.disabled = false;
        });
      };
      actionsContainer.appendChild(btnComplete);

      const btnCancel = document.createElement('button');
      btnCancel.className = 'btn btn--outline';
      btnCancel.style.borderColor = 'var(--status-cancelled)';
      btnCancel.style.color = 'var(--status-cancelled)';
      btnCancel.innerText = 'Cancel';
      btnCancel.onclick = async () => {
        if (!confirm('Are you sure you want to cancel this trip?')) return;
        btnCancel.disabled = true;
        try {
          await DataLayer.cancelTrip(trip.id);
          document.getElementById('trip-details-modal').style.display = 'none';
          renderTripsPage();
        } catch (err) {
          alert(err.message);
          btnCancel.disabled = false;
        }
      };
      actionsContainer.appendChild(btnCancel);
    }

    document.getElementById('trip-details-modal').style.display = 'flex';
  }

})();
