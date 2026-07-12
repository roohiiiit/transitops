/* ═══════════════════════════════════════════════════════════
   TransitOps — Create Trip Page
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let selectedVehicle = null;
  let cargoWeight = 0;

  // Render Page
  function renderCreateTripPage() {
    const role = DataLayer.getCurrentRole();
    const canCreate = (role === 'Fleet Manager' || role === 'Safety Officer');

    if (!canCreate) {
      Layout.setPageContent(`
        <div style="text-align: center; padding: 40px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-color); color: var(--text-muted); font-family: var(--font-mono); margin-top:20px;">
          Access Denied. Only Fleet Managers or Safety Officers are authorized to schedule trips.
        </div>
      `);
      return;
    }

    const html = `
      <div class="create-trip-layout" style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; margin-top: 16px; min-height: 500px;">
        <!-- Left: Map Panel -->
        <div class="map-panel" style="display: flex; flex-direction: column; gap: 16px;">
          <div id="trip-map-container" style="height: 400px; border-radius: 8px; border: 1px solid var(--border-color); overflow: hidden; background: var(--bg-card); position: relative;">
            <div style="position: absolute; top:50%; left:50%; transform: translate(-50%, -50%); color: var(--text-muted); font-size:12px; font-family: var(--font-mono); pointer-events: none;" id="map-loader-text">Loading Map Engine...</div>
          </div>
          <div style="font-size:11px; color: var(--text-muted); font-family: var(--font-mono); line-height: 1.4;">
            <span style="color: var(--accent); font-weight:600;">Routing Powered by OSRM API</span><br>
            Note: Routing features require active internet access. Straight-line calculations will be used as a fallback if OSRM is offline.
          </div>
        </div>

        <!-- Right: Form Panel -->
        <div class="form-panel" style="background: var(--bg-card); padding: 24px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 16px;" id="form-content-area">
          <h2 style="font-family: var(--font-display); font-size:18px; font-weight:600; color: var(--text-primary); margin-bottom: 8px;">Trip Schedule</h2>
          
          <form id="create-trip-main-form" style="display: flex; flex-direction: column; gap: 16px;">
            <!-- Source Field with Autocomplete -->
            <div class="form-group" style="position: relative;">
              <label class="form-label" for="c-source">Source Location</label>
              <input type="text" class="form-input" id="c-source" placeholder="Search address or city..." required autocomplete="off">
              <div id="source-suggestions" class="geo-suggestions-panel" style="display:none; position: absolute; top:100%; left:0; width:100%; background: var(--bg-card); border: 1px solid var(--border-color); border-top: none; border-radius: 0 0 6px 6px; z-index:1000; max-height:160px; overflow-y:auto; box-shadow: 0 4px 12px rgba(0,0,0,0.5);"></div>
            </div>

            <!-- Destination Field with Autocomplete -->
            <div class="form-group" style="position: relative;">
              <label class="form-label" for="c-dest">Destination Location</label>
              <input type="text" class="form-input" id="c-dest" placeholder="Search address or city..." required autocomplete="off">
              <div id="dest-suggestions" class="geo-suggestions-panel" style="display:none; position: absolute; top:100%; left:0; width:100%; background: var(--bg-card); border: 1px solid var(--border-color); border-top: none; border-radius: 0 0 6px 6px; z-index:1000; max-height:160px; overflow-y:auto; box-shadow: 0 4px 12px rgba(0,0,0,0.5);"></div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <!-- Cargo Weight -->
              <div class="form-group">
                <label class="form-label" for="c-weight">Cargo Weight (kg)</label>
                <input type="number" class="form-input font-mono" id="c-weight" min="1" placeholder="e.g. 500" required>
                <div class="form-error" id="c-weight-error" style="font-size:11px; margin-top:4px;"></div>
              </div>

              <!-- Distance (km) -->
              <div class="form-group">
                <label class="form-label" for="c-dist">Planned Distance (km)</label>
                <input type="number" class="form-input font-mono" id="c-dist" min="1" placeholder="e.g. 350" required>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <!-- Vehicle Dropdown -->
              <div class="form-group">
                <label class="form-label" for="c-vehicle">Assigned Vehicle</label>
                <select class="form-input" id="c-vehicle" required>
                  <option value="">-- Choose Vehicle --</option>
                </select>
              </div>

              <!-- Driver Dropdown -->
              <div class="form-group">
                <label class="form-label" for="c-driver">Assigned Driver</label>
                <select class="form-input" id="c-driver" required>
                  <option value="">-- Choose Driver --</option>
                </select>
              </div>
            </div>

            <button type="submit" class="btn btn--accent" id="btn-submit-trip" style="width: 100%; margin-top: 8px;">
              Schedule Trip <span class="btn-icon">→</span>
            </button>
          </form>
        </div>
      </div>
    `;

    Layout.setPageContent(html);

    // Initialize map in container
    MapComponent.init('trip-map-container');
    const loaderText = document.getElementById('map-loader-text');
    if (loaderText) loaderText.remove();

    // Populate selects
    populateDropdowns();

    // Bind event listeners
    bindFormEvents();
  }

  // Populate Dropdowns
  function populateDropdowns() {
    const selectVeh = document.getElementById('c-vehicle');
    const selectDrv = document.getElementById('c-driver');

    if (!selectVeh || !selectDrv) return;

    // Filter available vehicles
    const vehicles = DataLayer.getVehicles().filter(v => v.status === 'Available');
    selectVeh.innerHTML = `
      <option value="">-- Choose Vehicle --</option>
      ${vehicles.map(v => `<option value="${v.id}" data-max-load="${v.maxLoadKg}">${v.regNumber} (${v.name} - Max ${v.maxLoadKg}kg)</option>`).join('')}
    `;

    // Filter available drivers (and not expired)
    const drivers = DataLayer.getDrivers().filter(d => d.status === 'Available' && !DataLayer.isLicenseExpired(d));
    selectDrv.innerHTML = `
      <option value="">-- Choose Driver --</option>
      ${drivers.map(d => `<option value="${d.id}">${d.name} (${d.licenseCategory})</option>`).join('')}
    `;
  }

  // Calculate Route Callback
  function onRouteCalculated(distanceKm) {
    const distInput = document.getElementById('c-dist');
    if (distInput) {
      distInput.value = distanceKm;
    }
  }

  // Handle Autocomplete Suggestions
  function handleSuggestions(inputId, suggestPanelId, setPinFn) {
    const input = document.getElementById(inputId);
    const panel = document.getElementById(suggestPanelId);
    let debounceTimer = null;

    if (!input || !panel) return;

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const val = input.value.trim();

      if (val.length < 3) {
        panel.innerHTML = '';
        panel.style.display = 'none';
        return;
      }

      debounceTimer = setTimeout(async () => {
        const results = await MapComponent.searchPlaces(val);
        if (results.length === 0) {
          panel.innerHTML = `<div style="padding: 10px; color: var(--text-muted); font-size:11px; font-family:var(--font-mono);">No addresses found</div>`;
        } else {
          panel.innerHTML = results.map(item => `
            <div class="geo-suggest-item" style="padding: 8px 12px; cursor: pointer; font-size:12px; border-bottom: 1px solid var(--border-color); color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'" data-lat="${item.lat}" data-lon="${item.lon}" data-name="${item.display_name}">
              ${item.display_name}
            </div>
          `).join('');

          panel.style.display = 'block';

          // Bind clicks on suggestions
          panel.querySelectorAll('.geo-suggest-item').forEach(el => {
            el.addEventListener('click', () => {
              const name = el.dataset.name;
              const lat = el.dataset.lat;
              const lon = el.dataset.lon;

              input.value = name;
              panel.innerHTML = '';
              panel.style.display = 'none';

              setPinFn(lat, lon, name, onRouteCalculated);
            });
          });
        }
      }, 500);
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target !== input && e.target !== panel) {
        panel.innerHTML = '';
        panel.style.display = 'none';
      }
    });
  }

  // Bind Form Events & Validations
  function bindFormEvents() {
    // Autocompletes
    handleSuggestions('c-source', 'source-suggestions', MapComponent.setSource);
    handleSuggestions('c-dest', 'dest-suggestions', MapComponent.setDestination);

    const form = document.getElementById('create-trip-main-form');
    const inputWeight = document.getElementById('c-weight');
    const selectVeh = document.getElementById('c-vehicle');
    const errorWeight = document.getElementById('c-weight-error');
    const btnSubmit = document.getElementById('btn-submit-trip');

    function validateCapacity() {
      const weight = Number(inputWeight.value || 0);
      const opt = selectVeh.options[selectVeh.selectedIndex];
      
      if (opt && opt.value) {
        const maxLoad = Number(opt.dataset.maxLoad);
        if (weight > maxLoad) {
          errorWeight.textContent = `Cargo weight exceeds vehicle capacity limit of ${maxLoad} kg.`;
          errorWeight.style.color = '#ff4d4f';
          inputWeight.style.borderColor = '#ff4d4f';
          btnSubmit.disabled = true;
          return false;
        }
      }

      errorWeight.textContent = '';
      inputWeight.style.borderColor = '';
      btnSubmit.disabled = false;
      return true;
    }

    inputWeight.addEventListener('input', validateCapacity);
    selectVeh.addEventListener('change', validateCapacity);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validateCapacity()) return;

      const sourceVal = document.getElementById('c-source').value.trim();
      const destVal = document.getElementById('c-dest').value.trim();
      const distVal = Number(document.getElementById('c-dist').value || 0);
      const vehicleId = selectVeh.value;
      const driverId = document.getElementById('c-driver').value;
      const weightVal = Number(inputWeight.value || 0);

      btnSubmit.textContent = 'Scheduling...';
      btnSubmit.disabled = true;

      try {
        const trip = await DataLayer.addTrip({
          source: sourceVal,
          destination: destVal,
          cargoWeightKg: weightVal,
          plannedDistanceKm: distVal,
          vehicleId: Number(vehicleId),
          driverId: Number(driverId)
        });

        renderSuccessUI(trip);
      } catch (err) {
        alert(err.message || 'Failed to create trip');
        btnSubmit.innerHTML = 'Schedule Trip <span class="btn-icon">→</span>';
        btnSubmit.disabled = false;
      }
    });
  }

  // Draw Success layout
  function renderSuccessUI(trip) {
    const area = document.getElementById('form-content-area');
    if (!area) return;

    area.innerHTML = `
      <div style="text-align: center; display: flex; flex-direction: column; gap: 20px; align-items: center; padding: 24px 0;">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(212,255,63,0.1); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 28px; border: 2px solid var(--accent); box-shadow: 0 0 20px rgba(212,255,63,0.2);">
          ✓
        </div>
        <div>
          <h2 style="font-family: var(--font-display); font-size:18px; font-weight:600; color: var(--text-primary);">Trip Created!</h2>
          <p style="font-size:12px; color: var(--text-muted); margin-top: 6px; line-height: 1.4;">
            Trip ID: <span style="font-family: var(--font-mono); color: var(--text-primary); font-weight:500;">T${String(trip.id).padStart(3, '0')}</span><br>
            Route: ${trip.source} → ${trip.destination}
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
          <button class="btn btn--accent" id="btn-success-dispatch" style="width: 100%;">
            Dispatch Now
          </button>
          <button class="btn btn--ghost" id="btn-success-close" style="width: 100%;">
            Go to Trip List
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-success-dispatch').addEventListener('click', async () => {
      const btn = document.getElementById('btn-success-dispatch');
      btn.textContent = 'Dispatching...';
      btn.disabled = true;
      try {
        await DataLayer.dispatchTrip(trip.id);
        window.TransitOps.navigate('trips');
      } catch (err) {
        alert(err.message || 'Failed to dispatch trip');
        btn.textContent = 'Dispatch Now';
        btn.disabled = false;
      }
    });

    document.getElementById('btn-success-close').addEventListener('click', () => {
      window.TransitOps.navigate('trips');
    });
  }

  // --- Register Page ---
  TransitOps.registerPage('create-trip', renderCreateTripPage);

})();
