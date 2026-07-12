/* ═══════════════════════════════════════════════════════════
   TransitOps — Dashboard Page
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let filterType = 'All Types';
  let filterStatus = 'All Statuses';
  let filterRegion = 'All Regions';

  // ── Compute KPIs ──
  function getDashboardMetrics() {
    let vehicles = DataLayer.getVehicles();
    let drivers = DataLayer.getDrivers();
    let trips = DataLayer.getTrips();

    if (filterType !== 'All Types') vehicles = vehicles.filter(v => v.type === filterType);
    if (filterStatus !== 'All Statuses') vehicles = vehicles.filter(v => v.status === filterStatus);
    if (filterRegion !== 'All Regions') vehicles = vehicles.filter(v => v.region === filterRegion);

    const activeVehicles = vehicles.filter(v => v.status !== 'Retired').length;
    const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
    const inShopVehicles = vehicles.filter(v => v.status === 'In Shop').length;
    const onTripVehicles = vehicles.filter(v => v.status === 'On Trip').length;

    const driversOnDuty = drivers.filter(d => d.status === 'On Trip').length;
    const activeTrips = trips.filter(t => t.status === 'Dispatched').length;
    const pendingTrips = trips.filter(t => t.status === 'Draft').length;

    const utilization = activeVehicles > 0 
      ? Math.round((onTripVehicles / activeVehicles) * 100) 
      : 0;

    return {
      activeVehicles,
      availableVehicles,
      inShopVehicles,
      driversOnDuty,
      activeTrips,
      pendingTrips,
      utilization
    };
  }

  // ── Render Filter Bar ──
  function buildFilterBar() {
    return `
      <div class="dash-filters">
        <select class="form-input dash-filter-select" id="filter-type">
          <option ${filterType === 'All Types' ? 'selected' : ''}>All Types</option>
          <option ${filterType === 'Heavy Truck' ? 'selected' : ''}>Heavy Truck</option>
          <option ${filterType === 'Medium Truck' ? 'selected' : ''}>Medium Truck</option>
          <option ${filterType === 'LCV' ? 'selected' : ''}>LCV</option>
          <option ${filterType === 'Mini Truck' ? 'selected' : ''}>Mini Truck</option>
        </select>
        <select class="form-input dash-filter-select" id="filter-status">
          <option ${filterStatus === 'All Statuses' ? 'selected' : ''}>All Statuses</option>
          <option ${filterStatus === 'Available' ? 'selected' : ''}>Available</option>
          <option ${filterStatus === 'On Trip' ? 'selected' : ''}>On Trip</option>
          <option ${filterStatus === 'In Shop' ? 'selected' : ''}>In Shop</option>
        </select>
        <select class="form-input dash-filter-select" id="filter-region">
          <option ${filterRegion === 'All Regions' ? 'selected' : ''}>All Regions</option>
          <option ${filterRegion === 'South Zone' ? 'selected' : ''}>South Zone</option>
          <option ${filterRegion === 'North Zone' ? 'selected' : ''}>North Zone</option>
          <option ${filterRegion === 'East Zone' ? 'selected' : ''}>East Zone</option>
          <option ${filterRegion === 'West Zone' ? 'selected' : ''}>West Zone</option>
        </select>
      </div>
    `;
  }

  // ── Render KPI Cards ──
  function buildKPICards(metrics) {
    return `
      <div class="dash-kpi-grid">
        <div class="dash-kpi-card stagger-card" style="--card-accent: var(--accent);">
          <div class="dash-kpi-count animate-number" data-metric-id="dash-active-vehicles" data-value="${metrics.activeVehicles}">${metrics.activeVehicles}</div>
          <div class="dash-kpi-label">Active Vehicles</div>
        </div>
        <div class="dash-kpi-card click-card stagger-card" data-target="vehicles" data-filter="Available" style="--card-accent: var(--status-available);">
          <div class="dash-kpi-count animate-number" data-metric-id="dash-available-vehicles" data-value="${metrics.availableVehicles}">${metrics.availableVehicles}</div>
          <div class="dash-kpi-label">Available Vehicles</div>
        </div>
        <div class="dash-kpi-card click-card stagger-card" data-target="vehicles" data-filter="In Shop" style="--card-accent: var(--status-shop);">
          <div class="dash-kpi-count animate-number" data-metric-id="dash-shop-vehicles" data-value="${metrics.inShopVehicles}">${metrics.inShopVehicles}</div>
          <div class="dash-kpi-label">Vehicles in Maintenance</div>
        </div>
        <div class="dash-kpi-card click-card stagger-card" data-target="drivers" data-filter="On Trip" style="--card-accent: var(--status-ontrip);">
          <div class="dash-kpi-count animate-number" data-metric-id="dash-onduty-drivers" data-value="${metrics.driversOnDuty}">${metrics.driversOnDuty}</div>
          <div class="dash-kpi-label">Drivers On Duty</div>
        </div>
        <div class="dash-kpi-card click-card stagger-card" data-target="trips" data-filter="Dispatched" style="--card-accent: var(--status-ontrip);">
          <div class="dash-kpi-count animate-number" data-metric-id="dash-active-trips" data-value="${metrics.activeTrips}">${metrics.activeTrips}</div>
          <div class="dash-kpi-label">Active Trips</div>
        </div>
        <div class="dash-kpi-card click-card stagger-card" data-target="trips" data-filter="Draft" style="--card-accent: var(--text-secondary);">
          <div class="dash-kpi-count animate-number" data-metric-id="dash-pending-trips" data-value="${metrics.pendingTrips}">${metrics.pendingTrips}</div>
          <div class="dash-kpi-label">Pending Trips</div>
        </div>
        <div class="dash-kpi-card dash-kpi-card--headline stagger-card" style="--card-accent: var(--accent);">
          <div class="dash-kpi-count animate-number" data-metric-id="dash-utilization" data-value="${metrics.utilization}" data-suffix="%">${metrics.utilization}%</div>
          <div class="dash-kpi-label">Fleet Utilization</div>
        </div>
      </div>
    `;
  }

  // ── Render Utilization Gauge ──
  function buildGauge(utilization) {
    // Simple SVG radial gauge
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (utilization / 100) * circumference;

    return `
      <div class="dash-panel dash-gauge-panel stagger-card">
        <h3 class="panel-title">Fleet Utilization</h3>
        <div class="gauge-wrap">
          <svg width="140" height="140" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="${radius}" fill="none" stroke="var(--bg-surface-2)" stroke-width="12" />
            <circle cx="60" cy="60" r="${radius}" fill="none" stroke="var(--accent)" stroke-width="12" 
                    stroke-dasharray="${strokeDasharray}" stroke-dashoffset="${strokeDashoffset}" 
                    stroke-linecap="round" transform="rotate(-90 60 60)" />
          </svg>
          <div class="gauge-center">
            <span class="gauge-val animate-number" data-metric-id="dash-gauge" data-value="${utilization}" data-suffix="%">${utilization}%</span>
          </div>
        </div>
      </div>
    `;
  }

  // ── Render Activity Feed ──
  function buildActivityFeed() {
    const activities = [
      { id: 'T004', type: 'dispatch', text: 'Trip T004 dispatched (KA-01-CD-5678)', time: '10 mins ago', color: 'var(--status-ontrip)' },
      { id: 'V004', type: 'maintenance', text: 'Vehicle KA-03-GH-3456 reported for maintenance', time: '1 hr ago', color: 'var(--status-shop)' },
      { id: 'T002', type: 'complete', text: 'Trip T002 completed successfully', time: '2 hrs ago', color: 'var(--status-available)' },
      { id: 'D001', type: 'status', text: 'Rajesh Kumar marked as Available', time: '3 hrs ago', color: 'var(--status-available)' },
      { id: 'V012', type: 'maintenance', text: 'Vehicle KA-02-WX-9900 repair completed', time: '5 hrs ago', color: 'var(--status-available)' }
    ];

    const listHtml = activities.map(act => `
      <div class="activity-row">
        <div class="activity-dot" style="background-color: ${act.color}"></div>
        <div class="activity-content">
          <div class="activity-text">${act.text}</div>
          <div class="activity-time">${act.time}</div>
        </div>
      </div>
    `).join('');

    return `
      <div class="dash-panel dash-activity-panel stagger-card">
        <h3 class="panel-title">Recent Activity</h3>
        <div class="activity-list">
          ${listHtml}
        </div>
      </div>
    `;
  }

  // ── Main Render ──
  function renderDashboardPage() {
    const metrics = getDashboardMetrics();

    const html = `
      <div class="page-toolbar">
        <div class="page-toolbar-left">
          ${buildFilterBar()}
        </div>
      </div>
      <div class="dash-content-wrap">
        ${buildKPICards(metrics)}
        
        <div class="dash-lower-grid">
          ${buildGauge(metrics.utilization)}
          ${buildActivityFeed()}
        </div>
      </div>
    `;

    Layout.setPageContent(html);

    document.getElementById('filter-type').addEventListener('change', (e) => {
      filterType = e.target.value;
      renderDashboardPage();
    });
    document.getElementById('filter-status').addEventListener('change', (e) => {
      filterStatus = e.target.value;
      renderDashboardPage();
    });
    document.getElementById('filter-region').addEventListener('change', (e) => {
      filterRegion = e.target.value;
      renderDashboardPage();
    });

    // Bind click events for navigation
    const clickCards = document.querySelectorAll('.dash-kpi-card.click-card');
    clickCards.forEach(card => {
      card.addEventListener('click', () => {
        const target = card.dataset.target;
        const filter = card.dataset.filter;

        if (target === 'vehicles' && window.TransitOpsVehicles) {
          window.TransitOpsVehicles.setFilter(filter);
        } else if (target === 'drivers' && window.TransitOpsDrivers) {
          window.TransitOpsDrivers.setFilter(filter);
        } else if (target === 'trips' && window.TransitOpsTrips) {
          // If a trips specific filter exposes itself in the future
        }

        window.TransitOps.navigate(target);
      });
    });
  }

  // Register the dashboard module
  window.TransitOps = window.TransitOps || {};
  if (window.TransitOps.registerPage) {
    window.TransitOps.registerPage('dashboard', renderDashboardPage);
  } else {
    // If loaded before app.js, store it to be registered later or run on load
    document.addEventListener('DOMContentLoaded', () => {
      window.TransitOps.registerPage('dashboard', renderDashboardPage);
    });
  }

})();
