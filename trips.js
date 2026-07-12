/* ═══════════════════════════════════════════════════════════
   TransitOps — Trip Management Module
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let currentFilter = 'All';

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
        <div style="text-align: center; padding: 40px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-color); color: var(--text-muted);">
          No trips found in this category.
        </div>
      `;
    }

    return `
      <div class="table-container" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-color); background: var(--bg-base); color: var(--text-secondary); font-family: var(--font-mono); font-size: 11px; text-transform: uppercase;">
              <th style="padding: 14px 16px;">Trip ID</th>
              <th style="padding: 14px 16px;">Route</th>
              <th style="padding: 14px 16px;">Vehicle</th>
              <th style="padding: 14px 16px;">Driver</th>
              <th style="padding: 14px 16px;">Weight</th>
              <th style="padding: 14px 16px;">Distance</th>
              <th style="padding: 14px 16px;">Status</th>
              <th style="padding: 14px 16px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${trips.map(t => {
              const vehicle = t.vehicleId ? DataLayer.getVehicleById(t.vehicleId) : null;
              const driver = t.driverId ? DataLayer.getDriverById(t.driverId) : null;
              const pillClass = STATUS_CLASS[t.status] || '';

              return `
                <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-primary); cursor: pointer;" class="trip-row" data-id="${t.id}">
                  <td style="padding: 14px 16px; font-weight: 500; font-family: var(--font-mono);">T${String(t.id).padStart(3, '0')}</td>
                  <td style="padding: 14px 16px; font-weight: 500;">
                    ${t.source} <span style="color: var(--text-muted);">→</span> ${t.destination}
                  </td>
                  <td style="padding: 14px 16px;" class="font-mono">${vehicle ? vehicle.regNumber : '<span style="color:var(--text-muted)">Unassigned</span>'}</td>
                  <td style="padding: 14px 16px;">${driver ? driver.name : '<span style="color:var(--text-muted)">Unassigned</span>'}</td>
                  <td style="padding: 14px 16px;" class="font-mono">${formatWeight(t.cargoWeightKg)}</td>
                  <td style="padding: 14px 16px;" class="font-mono">${formatDist(t.plannedDistanceKm)}</td>
                  <td style="padding: 14px 16px;"><span class="status-pill ${pillClass}">${t.status}</span></td>
                  <td style="padding: 14px 16px; text-align: right;" class="trip-actions-cell">
                    ${t.status === 'Draft' ? `
                      <button class="btn btn--small btn--accent btn-dispatch" data-id="${t.id}" style="margin-right:4px;">Dispatch</button>
                      <button class="btn btn--small btn--danger btn-cancel" data-id="${t.id}">Cancel</button>
                    ` : ''}
                    ${t.status === 'Dispatched' ? `
                      <button class="btn btn--small btn--accent btn-complete" data-id="${t.id}" style="background-color:#2ec4b6; border-color:#2ec4b6; margin-right:4px;">Complete</button>
                      <button class="btn btn--small btn--danger btn-cancel" data-id="${t.id}">Cancel</button>
                    ` : ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // --- Modal Forms ---
  function openAddModal() {
    const vehicles = DataLayer.getVehicles().filter(v => v.status === 'Available');
    const drivers = DataLayer.getDrivers().filter(d => {
      // Exclude expired or Suspended
      const isExpired = DataLayer.isLicenseExpired(d);
      return d.status === 'Available' && !isExpired;
    });

    const modalHTML = `
      <div class="modal-overlay" id="trip-modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Schedule New Trip</h2>
            <button class="modal-close" id="modal-close-btn" aria-label="Close">&times;</button>
          </div>
          <form id="add-trip-form">
            <div class="modal-body">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="form-group">
                  <label class="form-label" for="t-source">Source Location</label>
                  <input type="text" class="form-input" id="t-source" placeholder="e.g. Bangalore" required>
                </div>
                <div class="form-group">
                  <label class="form-label" for="t-dest">Destination</label>
                  <input type="text" class="form-input" id="t-dest" placeholder="e.g. Mumbai" required>
                </div>
                <div class="form-group">
                  <label class="form-label" for="t-weight">Cargo Weight (kg)</label>
                  <input type="number" class="form-input font-mono" id="t-weight" min="1" placeholder="e.g. 500" required>
                  <div class="form-error" id="t-weight-error"></div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="t-dist">Planned Distance (km)</label>
                  <input type="number" class="form-input font-mono" id="t-dist" min="1" placeholder="e.g. 350" required>
                </div>
                <div class="form-group">
                  <label class="form-label" for="t-vehicle">Vehicle Assignment</label>
                  <select class="form-input" id="t-vehicle">
                    <option value="">-- Unassigned (Draft) --</option>
                    ${vehicles.map(v => `<option value="${v.id}">${v.regNumber} (${v.name} - Max ${v.maxLoadKg}kg)</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="t-driver">Driver Assignment</label>
                  <select class="form-input" id="t-driver">
                    <option value="">-- Unassigned (Draft) --</option>
                    ${drivers.map(d => `<option value="${d.id}">${d.name} (${d.licenseCategory})</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn--ghost" id="modal-cancel-btn">Cancel</button>
              <button type="submit" class="btn btn--accent">Create Trip</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('trip-modal-overlay');
    void overlay.offsetWidth;
    overlay.classList.add('open');

    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    document.getElementById('add-trip-form').addEventListener('submit', handleAddTrip);
  }

  async function handleAddTrip(e) {
    e.preventDefault();

    const vehicleId = document.getElementById('t-vehicle').value;
    const weight = Number(document.getElementById('t-weight').value);
    const weightError = document.getElementById('t-weight-error');

    if (vehicleId) {
      const v = DataLayer.getVehicleById(vehicleId);
      if (v && weight > v.maxLoadKg) {
        weightError.textContent = `Cargo weight exceeds vehicle's maximum load limit of ${v.maxLoadKg} kg.`;
        document.getElementById('t-weight').classList.add('input-error');
        return;
      }
    }

    weightError.textContent = '';
    document.getElementById('t-weight').classList.remove('input-error');

    try {
      await DataLayer.addTrip({
        source: document.getElementById('t-source').value.trim(),
        destination: document.getElementById('t-dest').value.trim(),
        cargoWeightKg: weight,
        plannedDistanceKm: Number(document.getElementById('t-dist').value),
        vehicleId: vehicleId ? Number(vehicleId) : null,
        driverId: document.getElementById('t-driver').value ? Number(document.getElementById('t-driver').value) : null,
      });

      closeModal();
      refreshContent();
    } catch (err) {
      alert(err.message || 'Failed to create trip');
    }
  }

  function openCompleteModal(tripId) {
    const trip = DataLayer.getTripById(tripId);
    if (!trip) return;
    const vehicle = DataLayer.getVehicleById(trip.vehicleId);

    const modalHTML = `
      <div class="modal-overlay" id="complete-modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Complete Trip</h2>
            <button class="modal-close" id="complete-close-btn" aria-label="Close">&times;</button>
          </div>
          <form id="complete-trip-form">
            <div class="modal-body">
              <p style="margin-bottom: 16px; color: var(--text-secondary);">
                Enter the final odometer reading and fuel consumed during the trip.
              </p>
              <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label" for="c-odo">Final Odometer (km)</label>
                <input type="number" class="form-input font-mono" id="c-odo" min="${vehicle ? vehicle.odometer : 0}" value="${vehicle ? vehicle.odometer + trip.plannedDistanceKm : ''}" required>
                <div style="font-size:11px; color: var(--text-muted); margin-top:4px;">Vehicle start odometer: ${vehicle ? vehicle.odometer : 0} km</div>
                <div class="form-error" id="c-odo-error"></div>
              </div>
              <div class="form-group">
                <label class="form-label" for="c-fuel">Fuel Consumed (Liters)</label>
                <input type="number" class="form-input font-mono" id="c-fuel" min="0" placeholder="e.g. 50" required>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn--ghost" id="complete-cancel-btn">Cancel</button>
              <button type="submit" class="btn btn--accent" style="background-color:#2ec4b6; border-color:#2ec4b6;">Complete Trip</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('complete-modal-overlay');
    void overlay.offsetWidth;
    overlay.classList.add('open');

    document.getElementById('complete-close-btn').addEventListener('click', closeCompleteModal);
    document.getElementById('complete-cancel-btn').addEventListener('click', closeCompleteModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeCompleteModal();
    });

    document.getElementById('complete-trip-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const odo = Number(document.getElementById('c-odo').value);
      const fuel = Number(document.getElementById('c-fuel').value);

      if (vehicle && odo < vehicle.odometer) {
        document.getElementById('c-odo-error').textContent = 'Odometer reading cannot be less than start odometer.';
        return;
      }

      try {
        await DataLayer.completeTrip(tripId, odo, fuel);
        closeCompleteModal();
        refreshContent();
      } catch (err) {
        alert(err.message || 'Failed to complete trip');
      }
    });
  }

  function closeModal() {
    const overlay = document.getElementById('trip-modal-overlay');
    if (overlay) {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 200);
    }
  }

  function closeCompleteModal() {
    const overlay = document.getElementById('complete-modal-overlay');
    if (overlay) {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 200);
    }
  }

  // --- Details Drawer ---
  function openDrawer(tripId) {
    const t = DataLayer.getTripById(tripId);
    if (!t) return;

    const vehicle = t.vehicleId ? DataLayer.getVehicleById(t.vehicleId) : null;
    const driver = t.driverId ? DataLayer.getDriverById(t.driverId) : null;
    const pillClass = STATUS_CLASS[t.status] || '';

    const drawerHTML = `
      <div class="drawer-overlay" id="drawer-overlay">
        <aside class="drawer" id="trip-drawer">
          <div class="drawer-header">
            <h2 class="drawer-title">Trip Details</h2>
            <button class="modal-close" id="drawer-close-btn" aria-label="Close">&times;</button>
          </div>
          <div class="drawer-body">
            <div class="detail-section">
              <div class="detail-label">Route</div>
              <div class="detail-value" style="font-size:16px; font-weight:600;">${t.source} → ${t.destination}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Status</div>
              <div class="detail-value"><span class="status-pill ${pillClass}">${t.status}</span></div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Cargo Weight</div>
              <div class="detail-value font-mono">${formatWeight(t.cargoWeightKg)}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Planned Distance</div>
              <div class="detail-value font-mono">${formatDist(t.plannedDistanceKm)}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Assigned Vehicle</div>
              <div class="detail-value font-mono">${vehicle ? `${vehicle.regNumber} (${vehicle.name})` : '—'}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Assigned Driver</div>
              <div class="detail-value">${driver ? driver.name : '—'}</div>
            </div>

            ${t.status === 'Completed' ? `
              <hr class="drawer-divider">
              <div class="detail-section">
                <div class="detail-label">Actual Odometer Reading</div>
                <div class="detail-value font-mono">${formatDist(t.actualOdometer)}</div>
              </div>
              <div class="detail-section">
                <div class="detail-label">Fuel Consumed</div>
                <div class="detail-value font-mono">${t.fuelConsumed} Liters</div>
              </div>
            ` : ''}
          </div>
        </aside>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', drawerHTML);

    const overlay = document.getElementById('drawer-overlay');
    void overlay.offsetWidth;
    overlay.classList.add('open');

    document.getElementById('drawer-close-btn').addEventListener('click', closeDrawer);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDrawer();
    });
  }

  function closeDrawer() {
    const overlay = document.getElementById('drawer-overlay');
    if (overlay) {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 200);
    }
  }

  // --- Event Binding ---
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

    const html = `
      <div class="page-toolbar">
        <div class="page-toolbar-left"></div>
        ${canCreate ? `
          <button class="btn btn--accent" id="btn-add-trip">
            <span class="btn-icon">+</span> Schedule Trip
          </button>
        ` : ''}
      </div>
      <div id="trips-content-wrap">
        ${buildStatsBar()}
        ${buildFilterTabs()}
        ${buildTripsTable()}
      </div>
    `;

    Layout.setPageContent(html);
    bindEvents();

    if (canCreate) {
      document.getElementById('btn-add-trip').addEventListener('click', openAddModal);
    }
  }

  // --- Register Page ---
  TransitOps.registerPage('trips', renderTripsPage);

})();
