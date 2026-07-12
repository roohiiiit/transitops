/* ═══════════════════════════════════════════════════════════
   TransitOps — Driver Management Page
   Filter Cards + Driver Grid + Add Modal + Detail Drawer
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Constants ──
  const STATUS_CLASS = {
    'Available': 'status-pill--available',
    'On Trip':   'status-pill--ontrip',
    'Off Duty':  'status-pill--retired', // Using retired style (muted) for off duty
    'Suspended': 'status-pill--danger',
  };

  const FILTER_CATEGORIES = [
    { key: 'all',       label: 'All Drivers', color: 'var(--accent)' },
    { key: 'Available', label: 'Available',   color: 'var(--status-available)' },
    { key: 'On Trip',   label: 'On Trip',     color: 'var(--status-ontrip)' },
    { key: 'Off Duty',  label: 'Off Duty',    color: 'var(--text-muted)' },
    { key: 'Suspended', label: 'Suspended',   color: 'var(--status-danger)' },
    { key: 'expiring',  label: 'License Expiring Soon', color: 'var(--status-danger)' },
  ];

  const LICENSE_CATEGORIES = ['LMV', 'HMV', 'HTV', 'HGMV', 'Trailer'];
  const DRIVER_STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'];

  let activeFilter = 'all';

  const DRIVER_ICON = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
  </svg>`;

  const WARNING_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: text-bottom;">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>`;

  // ── Format helpers ──
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ── Get filtered drivers ──
  function getFilteredDrivers() {
    const all = DataLayer.getDrivers();
    if (activeFilter === 'all') return all;
    if (activeFilter === 'expiring') {
      return all.filter(d => DataLayer.isLicenseExpiringSoon(d, 30) || DataLayer.isLicenseExpired(d));
    }
    return all.filter(d => d.status === activeFilter);
  }

  // ── Compute counts per filter ──
  function getCounts() {
    const all = DataLayer.getDrivers();
    const counts = { all: all.length, expiring: 0 };
    DRIVER_STATUSES.forEach(s => {
      counts[s] = all.filter(d => d.status === s).length;
    });
    counts.expiring = all.filter(d => DataLayer.isLicenseExpiringSoon(d, 30) || DataLayer.isLicenseExpired(d)).length;
    return counts;
  }

  // ── Build filter cards row ──
  function buildFilterCards() {
    const counts = getCounts();

    return `
      <div class="dm-filter-row" id="dm-filter-row">
        ${FILTER_CATEGORIES.map(cat => {
          const count = counts[cat.key] || 0;
          const isActive = activeFilter === cat.key;
          return `
            <button class="dm-filter-card${isActive ? ' dm-filter-card--active' : ''} stagger-card"
                    data-filter="${cat.key}"
                    style="--card-accent: ${cat.color}">
              <div class="dm-filter-count font-display animate-number" data-metric-id="dr-cat-${cat.key}" data-value="${count}">${count}</div>
              <div class="dm-filter-label">${cat.label}</div>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  // ── Build safety score bar ──
  function buildSafetyScoreBar(score) {
    let colorClass = 'safety-score--danger';
    if (score >= 80) colorClass = 'safety-score--good';
    else if (score >= 50) colorClass = 'safety-score--warn';
    
    return `
      <div class="safety-score-wrap">
        <div class="safety-score-header">
          <span class="safety-score-label">SAFETY SCORE</span>
          <span class="safety-score-val font-mono ${colorClass}">${score}</span>
        </div>
        <div class="safety-score-bar-bg">
          <div class="safety-score-bar-fill ${colorClass}" style="width: ${score}%"></div>
        </div>
      </div>
    `;
  }

  // ── Build expiry display ──
  function buildExpiryDisplay(driver) {
    const isExpired = DataLayer.isLicenseExpired(driver);
    const isExpiringSoon = !isExpired && DataLayer.isLicenseExpiringSoon(driver, 30);
    
    let styleClass = '';
    let icon = '';
    
    if (isExpired) {
      styleClass = 'expiry--danger';
      icon = WARNING_ICON;
    } else if (isExpiringSoon) {
      styleClass = 'expiry--warn';
      icon = WARNING_ICON;
    }
    
    return `<span class="${styleClass}">${icon}${formatDate(driver.licenseExpiry)}</span>`;
  }

  // ── Build driver grid ──
  function buildDriverGrid() {
    const drivers = getFilteredDrivers();

    if (drivers.length === 0) {
      return `
        <div class="dm-empty-state empty-state">
          <div class="dm-empty-icon">${DRIVER_ICON}</div>
          <div class="dm-empty-text">No drivers in this category</div>
        </div>
      `;
    }

    return `
      <div class="dm-grid" id="dm-grid">
        ${drivers.map(d => {
      const dimmed = (d.status === 'Suspended') ? ' dm-card--dimmed' : '';
      const pillClass = STATUS_CLASS[d.status] || '';
      
      let flashClass = '';
      if (window.DataLayer && window.DataLayer.getPreviousMetric) {
        const lastStatus = window.DataLayer.getPreviousMetric(`dr-status-${d.id}`);
        if (lastStatus && lastStatus !== d.status) flashClass = ' flash-pill';
        window.DataLayer.setPreviousMetric(`dr-status-${d.id}`, d.status);
      }

      return `
            <div class="dm-card${dimmed} stagger-card" data-id="${d.id}">
              <div class="dm-card-top">
                <span class="dm-card-icon">${DRIVER_ICON}</span>
                <span class="status-pill ${pillClass}${flashClass}">${d.status}</span>
              </div>
              <div class="dm-card-name font-display">${escapeHtml(d.name)}</div>
              <div class="dm-card-license">
                <span class="font-mono">${escapeHtml(d.licenseNumber)}</span>
                <span class="dm-card-category">${escapeHtml(d.licenseCategory)}</span>
              </div>
              <div class="dm-card-expiry">
                <div class="dm-stat-label">LICENSE EXPIRY</div>
                <div class="dm-stat-value">${buildExpiryDisplay(d)}</div>
              </div>
              ${buildSafetyScoreBar(d.safetyScore)}
              <div class="dm-card-contact">
                <div class="dm-stat-label">CONTACT NUMBER</div>
                <div class="dm-stat-value font-mono">${escapeHtml(d.contactNumber || '—')}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ── Bind filter card clicks ──
  function bindFilterClicks() {
    document.querySelectorAll('.dm-filter-card').forEach(card => {
      card.addEventListener('click', () => {
        activeFilter = card.dataset.filter;
        refreshContent();
      });
    });
  }

  // ── Bind driver card clicks ──
  function bindCardClicks() {
    document.querySelectorAll('.dm-card').forEach(card => {
      card.addEventListener('click', () => {
        openDrawer(card.dataset.id);
      });
    });
  }

  // ── Refresh everything (filters + grid) ──
  function refreshContent() {
    const wrap = document.getElementById('dm-content-wrap');
    if (!wrap) return;

    wrap.innerHTML = buildFilterCards() + buildDriverGrid();
    bindFilterClicks();
    bindCardClicks();
  }

  // ── Modal: Add Driver ──
  function openAddModal() {
    closeModal();

    const modalHTML = `
      <div class="modal-overlay" id="driver-modal-overlay">
        <div class="modal" id="driver-modal">
          <div class="modal-header">
            <h2 class="modal-title">Add Driver</h2>
            <button class="modal-close" id="modal-close-btn" aria-label="Close">&times;</button>
          </div>
          <form id="add-driver-form" novalidate>
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label" for="d-name">Name <span class="required">*</span></label>
                  <input type="text" class="form-input" id="d-name" placeholder="e.g. Ramesh Kumar" required>
                  <div class="form-error" id="d-name-error"></div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="d-license">License Number <span class="required">*</span></label>
                  <input type="text" class="form-input font-mono" id="d-license" placeholder="KA0120210045678" required>
                  <div class="form-error" id="d-license-error"></div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="d-category">License Category</label>
                  <select class="form-input" id="d-category">
                    ${LICENSE_CATEGORIES.map(t => `<option value="${t}">${t}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="d-expiry">License Expiry Date</label>
                  <input type="date" class="form-input font-mono" id="d-expiry" required>
                  <div class="form-error" id="d-expiry-error"></div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="d-contact">Contact Number</label>
                  <input type="text" class="form-input font-mono" id="d-contact" placeholder="9876543210">
                </div>
                <div class="form-group">
                  <label class="form-label" for="d-score">Safety Score (0-100)</label>
                  <input type="number" class="form-input font-mono" id="d-score" min="0" max="100" placeholder="100" value="100">
                  <div class="form-error" id="d-score-error"></div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="d-status">Status</label>
                  <select class="form-input" id="d-status">
                    ${DRIVER_STATUSES.map(s => `<option value="${s}"${s === 'Available' ? ' selected' : ''}>${s}</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn--ghost" id="modal-cancel-btn">Cancel</button>
              <button type="submit" class="btn btn--accent" id="btn-submit-driver" style="width: 140px;">Add Driver</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('driver-modal-overlay');
    void overlay.offsetWidth;
    overlay.classList.add('open');

    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    document.getElementById('d-license').addEventListener('input', validateLicenseNumber);
    document.getElementById('add-driver-form').addEventListener('submit', handleAddDriver);
  }

  function validateLicenseNumber() {
    const input = document.getElementById('d-license');
    const error = document.getElementById('d-license-error');
    const val = input.value.trim();

    if (!val) {
      error.textContent = 'License number is required';
      input.classList.add('input-error');
      return false;
    }

    const exists = DataLayer.getDrivers().some(
      d => d.licenseNumber.toLowerCase() === val.toLowerCase()
    );

    if (exists) {
      error.textContent = 'License number already exists';
      input.classList.add('input-error');
      return false;
    }

    error.textContent = '';
    input.classList.remove('input-error');
    return true;
  }

  function validateRequiredStr(id, errorId) {
    const input = document.getElementById(id);
    const error = document.getElementById(errorId);
    if (!input.value.trim()) {
      error.textContent = 'Required';
      input.classList.add('input-error');
      return false;
    }
    error.textContent = '';
    input.classList.remove('input-error');
    return true;
  }

  function validateNumericRange(id, errorId, min, max) {
    const input = document.getElementById(id);
    const error = document.getElementById(errorId);
    const val = Number(input.value);

    if (isNaN(val) || val < min || val > max) {
      error.textContent = `Must be between ${min} and ${max}`;
      input.classList.add('input-error');
      return false;
    }

    error.textContent = '';
    input.classList.remove('input-error');
    return true;
  }

  function handleAddDriver(e) {
    e.preventDefault();

    const nameValid    = validateRequiredStr('d-name', 'd-name-error');
    const licenseValid = validateLicenseNumber();
    const expiryValid  = validateRequiredStr('d-expiry', 'd-expiry-error');
    const scoreValid   = validateNumericRange('d-score', 'd-score-error', 0, 100);

    if (!nameValid || !licenseValid || !expiryValid || !scoreValid) return;

    const btn = document.getElementById('btn-submit-driver');
    btn.innerHTML = '<span class="spinner"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v4"></path></svg></span>';
    btn.disabled = true;

    // Simulate short network delay for animation
    setTimeout(() => {
      DataLayer.addDriver({
        name:            document.getElementById('d-name').value.trim(),
        licenseNumber:   document.getElementById('d-license').value.trim(),
        licenseCategory: document.getElementById('d-category').value,
        licenseExpiry:   document.getElementById('d-expiry').value,
        contactNumber:   document.getElementById('d-contact').value.trim(),
        safetyScore:     Number(document.getElementById('d-score').value),
        status:          document.getElementById('d-status').value,
      });

      closeModal();
      refreshContent();
    }, 200);
  }

  function closeModal() {
    const overlay = document.getElementById('driver-modal-overlay');
    if (overlay) {
      overlay.classList.add('is-closing');
      const panel = overlay.querySelector('.modal');
      if (panel) panel.classList.add('is-closing');
      setTimeout(() => overlay.remove(), 180);
    }
  }

  // ── Detail Drawer ──
  function openDrawer(driverId) {
    closeDrawer();

    const d = DataLayer.getDriverById(driverId);
    if (!d) return;

    const pillClass = STATUS_CLASS[d.status] || '';

    const drawerHTML = `
      <div class="drawer-overlay" id="drawer-overlay">
        <aside class="drawer" id="driver-drawer">
          <div class="drawer-header">
            <h2 class="drawer-title">Driver Details</h2>
            <button class="modal-close" id="drawer-close-btn" aria-label="Close">&times;</button>
          </div>
          <div class="drawer-body">
            <div class="detail-section">
              <div class="detail-label">Name</div>
              <div class="detail-value font-display">${d.name}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">License Number</div>
              <div class="detail-value font-mono">${d.licenseNumber}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">License Category</div>
              <div class="detail-value">${d.licenseCategory}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">License Expiry</div>
              <div class="detail-value">${buildExpiryDisplay(d)}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Contact Number</div>
              <div class="detail-value font-mono">${d.contactNumber || '—'}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Safety Score</div>
              <div class="detail-value" style="max-width: 200px;">
                ${buildSafetyScoreBar(d.safetyScore)}
              </div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Status</div>
              <div class="detail-value"><span class="status-pill ${pillClass}">${d.status}</span></div>
            </div>

            <hr class="drawer-divider">

            <div class="detail-section">
              <div class="detail-label">Change Status</div>
              <div class="drawer-status-actions">
                ${DRIVER_STATUSES.map(s => `
                  <button class="btn btn--small ${s === d.status ? 'btn--active' : 'btn--ghost'}"
                          data-status="${s}" ${s === d.status ? 'disabled' : ''}>
                    ${s}
                  </button>
                `).join('')}
              </div>
            </div>
            <hr class="drawer-divider">
            <div class="detail-section">
              <button class="btn btn--ghost" id="btn-delete-driver" style="width: 100%; border-color: #ff4d4f; color: #ff4d4f;">Delete Driver</button>
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
          await DataLayer.updateDriverStatus(driverId, btn.dataset.status);
          closeDrawer();
          refreshContent();
        } catch (err) {
          alert(err.message || 'Failed to update driver status');
        }
      });
    });

    const deleteBtn = document.getElementById('btn-delete-driver');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this driver?')) {
          try {
            await DataLayer.deleteDriver(driverId);
            closeDrawer();
            refreshContent();
          } catch (err) {
            alert(err.message || 'Failed to delete driver');
          }
        }
      });
    }
  }

  function closeDrawer() {
    const overlay = document.getElementById('drawer-overlay');
    if (overlay) {
      overlay.classList.add('is-closing');
      const drawer = document.getElementById('driver-drawer');
      if (drawer) drawer.classList.add('is-closing');
      setTimeout(() => overlay.remove(), 220);
    }
  }

  // ── Page renderer ──
  function renderDriversPage() {
    const html = `
      <div class="page-toolbar">
        <div class="page-toolbar-left"></div>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn--ghost" id="btn-report-drivers">Generate Report</button>
          <button class="btn btn--accent" id="btn-add-driver">
            <span class="btn-icon">+</span> Add Driver
          </button>
        </div>
      </div>
      <div id="dm-content-wrap">
        ${buildFilterCards()}
        ${buildDriverGrid()}
      </div>
    `;

    return html;
  }

  // ── Register with app controller ──
  TransitOps.registerPage('drivers', () => {
    setTimeout(() => {
      bindFilterClicks();
      bindCardClicks();

      const addBtn = document.getElementById('btn-add-driver');
      if (addBtn) addBtn.addEventListener('click', openAddModal);

      const reportBtn = document.getElementById('btn-report-drivers');
      if (reportBtn) {
        reportBtn.addEventListener('click', () => {
          if (window.TransitOps && typeof window.TransitOps.openReportModal === 'function') {
            window.TransitOps.openReportModal('Drivers', () => {
              let data = DataLayer.getDrivers();
              if (activeFilter !== 'all') {
                data = data.filter(d => d.status === activeFilter);
              }
              return data;
            });
          } else {
            console.error("window.TransitOps.openReportModal is undefined when Generate Report was clicked");
          }
        });
      }
    }, 200);

    return renderDriversPage();
  });

  // ── Public API ──
  window.TransitOpsDrivers = {
    setFilter: (filterKey) => { activeFilter = filterKey; }
  };

})();
