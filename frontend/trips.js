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
