

/* ═══════════════════════════════════════════════════════════
   TransitOps — Vehicle Registry Page
   Filter Cards + Vehicle Grid + Add Modal + Detail Drawer
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Constants ──
  const STATUS_CLASS = {
    'Available': 'status-pill--available',
    'On Trip': 'status-pill--ontrip',
    'In Shop': 'status-pill--shop',
    'Retired': 'status-pill--retired',
  };

  const FILTER_CATEGORIES = [
    { key: 'all', label: 'All Vehicles', color: 'var(--accent)' },
    { key: 'Available', label: 'Available', color: 'var(--status-available)' },
    { key: 'On Trip', label: 'On Trip', color: 'var(--status-ontrip)' },
    { key: 'In Shop', label: 'In Shop', color: 'var(--status-shop)' },
    { key: 'Retired', label: 'Retired', color: 'var(--status-retired)' },
  ];

  const VEHICLE_TYPES = ['Mini Truck', 'LCV', 'Medium Truck', 'Heavy Truck', 'Pickup', 'Van', 'Trailer'];
  const VEHICLE_STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];

  let activeFilter = 'all';

  // ── Type icons (simple SVG line icons) ──
  const TYPE_ICONS = {
    'Mini Truck': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="8" width="10" height="8" rx="1"/><path d="M13 11h3l3 3v2h-6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    </svg>`,
    'LCV': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="7" width="12" height="9" rx="1"/><path d="M14 10h3.5l2.5 3v3h-6"/><circle cx="6.5" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>
    </svg>`,
    'Medium Truck': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
      <rect x="1" y="6" width="14" height="10" rx="1"/><path d="M15 9h4l3 4v3h-7"/><circle cx="6" cy="17.5" r="2.5"/><circle cx="18" cy="17.5" r="2.5"/>
    </svg>`,
    'Heavy Truck': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
      <rect x="1" y="5" width="14" height="11" rx="1"/><path d="M15 8h4l3 4v4h-7"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="10" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/>
    </svg>`,
    'Pickup': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 10V7a1 1 0 011-1h6l2 3h6a2 2 0 012 2v5h-2"/><path d="M3 14h4"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/>
    </svg>`,
    'Van': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 8h13l3 4v4H3V8z"/><rect x="3" y="8" width="10" height="8" rx="1"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    </svg>`,
    'Trailer': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
      <rect x="1" y="6" width="17" height="10" rx="1"/><circle cx="6" cy="18" r="2"/><circle cx="14" cy="18" r="2"/><path d="M18 12h4"/>
    </svg>`,
  };

  function getTypeIcon(type) {
    return TYPE_ICONS[type] || TYPE_ICONS['LCV'];
  }

  // ── Format helpers ──
  function currency(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
  }

  function formatOdometer(n) {
    return Number(n).toLocaleString('en-IN');
  }

  function formatLoad(n) {
    return Number(n).toLocaleString('en-IN');
  }

  // ── Get filtered vehicles ──
  function getFilteredVehicles() {
    const all = DataLayer.getVehicles();
    if (activeFilter === 'all') return all;
    return all.filter(v => v.status === activeFilter);
  }

  // ── Compute counts per status ──
  function getCounts() {
    const all = DataLayer.getVehicles();
    const counts = { all: all.length };
    VEHICLE_STATUSES.forEach(s => {
      counts[s] = all.filter(v => v.status === s).length;
    });
    return counts;
  }

  // ── Build filter cards row ──
  function buildFilterCards() {
    const counts = getCounts();

    return `
      <div class="vr-filter-row" id="vr-filter-row">
        ${FILTER_CATEGORIES.map(cat => {
      const count = counts[cat.key] || 0;
      const isActive = activeFilter === cat.key;
      return `
            <button class="vr-filter-card${isActive ? ' vr-filter-card--active' : ''} stagger-card"
                    data-filter="${cat.key}"
                    style="--card-accent: ${cat.color}">
              <div class="vr-filter-count font-display animate-number" data-metric-id="vr-cat-${cat.key}" data-value="${count}">${count}</div>
              <div class="vr-filter-label">${cat.label}</div>
            </button>
          `;
    }).join('')}
      </div>
    `;
  }

  // ── Build vehicle grid ──
  function buildVehicleGrid() {
    const vehicles = getFilteredVehicles();

    if (vehicles.length === 0) {
      return `
        <div class="vr-empty-state empty-state">
          <div class="vr-empty-icon">${getTypeIcon('LCV')}</div>
          <div class="vr-empty-text">No vehicles in this category</div>
        </div>
      `;
    }

    return `
      <div class="vr-grid" id="vr-grid">
        ${vehicles.map(v => {
      const dimmed = (v.status === 'Retired' || v.status === 'In Shop') ? ' vr-card--dimmed' : '';
      const pillClass = STATUS_CLASS[v.status] || '';
      
      let flashClass = '';
      if (window.DataLayer && window.DataLayer.getPreviousMetric) {
        const lastStatus = window.DataLayer.getPreviousMetric(`vr-status-${v.id}`);
        if (lastStatus && lastStatus !== v.status) flashClass = ' flash-pill';
        window.DataLayer.setPreviousMetric(`vr-status-${v.id}`, v.status);
      }

      return `
            <div class="vr-card${dimmed} stagger-card" data-id="${v.id}">
              <div class="vr-card-top">
                <span class="vr-card-icon">${getTypeIcon(v.type)}</span>
                <span class="status-pill ${pillClass}${flashClass}">${v.status}</span>
              </div>
              <div class="vr-card-name" style="font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">${escapeHtml(v.name || 'Unnamed Vehicle')}</div>
              <div class="vr-card-reg font-mono" style="font-size: 13px; color: var(--text-secondary);">${escapeHtml(v.regNumber)}</div>
              <div class="vr-card-type">${escapeHtml(v.type)}</div>
              <div class="vr-card-stats">
                <div class="vr-stat">
                  <div class="vr-stat-label">MAX LOAD</div>
                  <div class="vr-stat-value font-mono">${formatLoad(v.maxLoadKg)} kg</div>
                </div>
                <div class="vr-stat">
                  <div class="vr-stat-label">ODOMETER</div>
                  <div class="vr-stat-value font-mono">${formatOdometer(v.odometer)} km</div>
                </div>
                <div class="vr-stat">
                  <div class="vr-stat-label">ACQ. COST</div>
                  <div class="vr-stat-value font-mono">${currency(v.acquisitionCost)}</div>
                </div>
              </div>
            </div>
          `;
    }).join('')}
      </div>
    `;
  }

  // ── Bind filter card clicks ──
  function bindFilterClicks() {
    document.querySelectorAll('.vr-filter-card').forEach(card => {
      card.addEventListener('click', () => {
        activeFilter = card.dataset.filter;
        refreshContent();
      });
    });
  }

  // ── Bind vehicle card clicks ──
  function bindCardClicks() {
    document.querySelectorAll('.vr-card').forEach(card => {
      card.addEventListener('click', () => {
        openDrawer(card.dataset.id);
      });
    });
  }

  // ── Refresh everything (filters + grid) ──
  function refreshContent() {
    const wrap = document.getElementById('vr-content-wrap');
    if (!wrap) return;

    wrap.innerHTML = buildFilterCards() + buildVehicleGrid();
    bindFilterClicks();
    bindCardClicks();
  }

  // ── Modal: Add Vehicle ──
  function openAddModal() {
    closeModal();

    const modalHTML = `
      <div class="modal-overlay" id="vehicle-modal-overlay">
        <div class="modal" id="vehicle-modal">
          <div class="modal-header">
            <h2 class="modal-title">Register Vehicle</h2>
            <button class="modal-close" id="modal-close-btn" aria-label="Close">&times;</button>
          </div>
          <form id="add-vehicle-form" novalidate>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label" for="v-reg">Registration Number <span class="required">*</span></label>
                  <input type="text" class="form-input font-mono" id="v-reg" placeholder="KA-01-AB-1234" required>
                  <div class="form-error" id="v-reg-error"></div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="v-name">Name / Model</label>
                  <input type="text" class="form-input" id="v-name" placeholder="e.g. Tata Ace Gold">
                </div>
                <div class="form-group">
                  <label class="form-label" for="v-type">Type</label>
                  <select class="form-input" id="v-type">
                    ${VEHICLE_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="v-region">Region</label>
                  <select class="form-input" id="v-region">
                    <option value="South Zone">South Zone</option>
                    <option value="North Zone">North Zone</option>
                    <option value="East Zone">East Zone</option>
                    <option value="West Zone">West Zone</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="v-load">Max Load (kg)</label>
                  <input type="number" class="form-input font-mono" id="v-load" min="0" placeholder="0" value="0">
                  <div class="form-error" id="v-load-error"></div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="v-odo">Odometer (km)</label>
                  <input type="number" class="form-input font-mono" id="v-odo" min="0" placeholder="0" value="0">
                  <div class="form-error" id="v-odo-error"></div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="v-cost">Acquisition Cost (₹)</label>
                  <input type="number" class="form-input font-mono" id="v-cost" min="0" placeholder="0" value="0">
                  <div class="form-error" id="v-cost-error"></div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="v-status">Status</label>
                  <select class="form-input" id="v-status">
                    ${VEHICLE_STATUSES.map(s => `<option value="${s}"${s === 'Available' ? ' selected' : ''}>${s}</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn--ghost" id="modal-cancel-btn">Cancel</button>
              <button type="submit" class="btn btn--accent" id="btn-submit-vehicle" style="width: 140px;">Register Vehicle</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('vehicle-modal-overlay');
    void overlay.offsetWidth;
    overlay.classList.add('open');

    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    document.getElementById('v-reg').addEventListener('input', validateRegNumber);
    document.getElementById('add-vehicle-form').addEventListener('submit', handleAddVehicle);
  }

  function validateRegNumber() {
    const input = document.getElementById('v-reg');
    const error = document.getElementById('v-reg-error');
    const val = input.value.trim();

    if (!val) {
      error.textContent = 'Registration number is required';
      input.classList.add('input-error');
      return false;
    }

    const exists = DataLayer.getVehicles().some(
      v => v.regNumber.toLowerCase() === val.toLowerCase()
    );

    if (exists) {
      error.textContent = 'Registration number already exists';
      input.classList.add('input-error');
      return false;
    }

    error.textContent = '';
    input.classList.remove('input-error');
    return true;
  }

  function validateNumeric(id, errorId) {
    const input = document.getElementById(id);
    const error = document.getElementById(errorId);
    const val = Number(input.value);

    if (val < 0 || isNaN(val)) {
      error.textContent = 'Must be zero or positive';
      input.classList.add('input-error');
      return false;
    }

    error.textContent = '';
    input.classList.remove('input-error');
    return true;
  }

  async function handleAddVehicle(e) {
    e.preventDefault();

    const regValid = validateRegNumber();
    const loadValid = validateNumeric('v-load', 'v-load-error');
    const odoValid = validateNumeric('v-odo', 'v-odo-error');
    const costValid = validateNumeric('v-cost', 'v-cost-error');

    if (!regValid || !loadValid || !odoValid || !costValid) return;

    const btn = document.getElementById('btn-submit-vehicle');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v4"></path></svg></span>';
    btn.disabled = true;

    try {
      await DataLayer.addVehicle({
        regNumber: document.getElementById('v-reg').value.trim(),
        name: document.getElementById('v-name').value.trim(),
        type: document.getElementById('v-type').value,
        region: document.getElementById('v-region').value,
        maxLoadKg: Number(document.getElementById('v-load').value),
        odometer: Number(document.getElementById('v-odo').value),
        acquisitionCost: Number(document.getElementById('v-cost').value),
        status: document.getElementById('v-status').value,
      });
      closeModal();
      refreshContent();
    } catch (err) {
      alert(err.message || 'Failed to add vehicle');
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  function closeModal() {
    const overlay = document.getElementById('vehicle-modal-overlay');
    if (overlay) {
      overlay.classList.add('is-closing');
      const panel = overlay.querySelector('.modal');
      if (panel) panel.classList.add('is-closing');
      setTimeout(() => overlay.remove(), 180);
    }
  }

  // ── Detail Drawer ──
  function openDrawer(vehicleId) {
    closeDrawer();

    const v = DataLayer.getVehicleById(vehicleId);
    if (!v) return;

    const pillClass = STATUS_CLASS[v.status] || '';

    const drawerHTML = `
      <div class="drawer-overlay" id="drawer-overlay">
        <aside class="drawer" id="vehicle-drawer">
          <div class="drawer-header">
            <h2 class="drawer-title">Vehicle Details</h2>
            <button class="modal-close" id="drawer-close-btn" aria-label="Close">&times;</button>
          </div>
          <div class="drawer-body">
            <div class="detail-section">
              <div class="detail-label">Name / Model</div>
              <div class="detail-value" style="font-size: 16px; font-weight: 600;">${v.name || 'Unnamed Vehicle'}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Registration Number</div>
              <div class="detail-value font-mono" style="color: var(--text-secondary);">${v.regNumber}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Type</div>
              <div class="detail-value">${v.type}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Region</div>
              <div class="detail-value">${v.region || '—'}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Max Load Capacity</div>
              <div class="detail-value font-mono">${formatLoad(v.maxLoadKg)} kg</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Odometer</div>
              <div class="detail-value font-mono">${formatOdometer(v.odometer)} km</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Acquisition Cost</div>
              <div class="detail-value font-mono">${currency(v.acquisitionCost)}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Status</div>
              <div class="detail-value"><span class="status-pill ${pillClass}">${v.status}</span></div>
            </div>

            <hr class="drawer-divider">

            <div class="detail-section">
              <div class="detail-label">Change Status</div>
              <div class="drawer-status-actions">
                ${VEHICLE_STATUSES.map(s => `
                  <button class="btn btn--small ${s === v.status ? 'btn--active' : 'btn--ghost'}"
                          data-status="${s}" ${s === v.status ? 'disabled' : ''}>
                    ${s}
                  </button>
                `).join('')}
              </div>
            </div>
            <hr class="drawer-divider">
            <div class="detail-section">
              <button class="btn btn--ghost" id="btn-delete-vehicle" style="width: 100%; border-color: #ff4d4f; color: #ff4d4f;">Delete Vehicle</button>
            </div>
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

    overlay.querySelectorAll('[data-status]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await DataLayer.updateVehicleStatus(vehicleId, btn.dataset.status);
          closeDrawer();
          refreshContent();
        } catch (err) {
          alert(err.message || 'Failed to update vehicle status');
        }
      });
    });

    const deleteBtn = document.getElementById('btn-delete-vehicle');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this vehicle?')) {
          try {
            await DataLayer.deleteVehicle(vehicleId);
            closeDrawer();
            refreshContent();
          } catch (err) {
            alert(err.message || 'Failed to delete vehicle');
          }
        }
      });
    }
  }

  function closeDrawer() {
    const overlay = document.getElementById('drawer-overlay');
    if (overlay) {
      overlay.classList.add('is-closing');
      const drawer = document.getElementById('vehicle-drawer');
      if (drawer) drawer.classList.add('is-closing');
      setTimeout(() => overlay.remove(), 220);
    }
  }

  // ── Page renderer ──
  function renderVehiclesPage() {
    const html = `
      <div class="page-toolbar">
        <div class="page-toolbar-left"></div>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn--ghost" id="btn-report-vehicles">Generate Report</button>
          <button class="btn btn--accent" id="btn-add-vehicle">
            <span class="btn-icon">+</span> Register Vehicle
          </button>
        </div>
      </div>
      <div id="vr-content-wrap">
        ${buildFilterCards()}
        ${buildVehicleGrid()}
      </div>
    `;

    return html;
  }

  // ── Register with app controller ──
  TransitOps.registerPage('vehicles', () => {
    setTimeout(() => {
      bindFilterClicks();
      bindCardClicks();

      const addBtn = document.getElementById('btn-add-vehicle');
      if (addBtn) addBtn.addEventListener('click', openAddModal);
      
      const reportBtn = document.getElementById('btn-report-vehicles');
      if (reportBtn) {
        reportBtn.addEventListener('click', () => {
          if (window.TransitOps && typeof window.TransitOps.openReportModal === 'function') {
            window.TransitOps.openReportModal('Vehicles', () => {
              let data = DataLayer.getVehicles();
              if (activeFilter !== 'all') {
                data = data.filter(v => v.status === activeFilter);
              }
              return data;
            });
          } else {
            console.error("window.TransitOps.openReportModal is undefined when Generate Report was clicked");
          }
        });
      }
    }, 200);

    return renderVehiclesPage();
  });

})();
