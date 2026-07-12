/* ═══════════════════════════════════════════════════════════
   TransitOps — Maintenance Operations Module
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let currentFilter = 'All'; // All, Active, Closed

  function currency(val) {
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  function getFilteredLogs() {
    const all = DataLayer.getMaintenanceLogs();
    if (currentFilter === 'All') return all;
    if (currentFilter === 'Active') return all.filter(l => !l.dateClosed);
    return all.filter(l => l.dateClosed);
  }

  function setFilter(filter) {
    currentFilter = filter;
    refreshContent();
  }

  function refreshContent() {
    const wrap = document.getElementById('maintenance-content-wrap');
    if (wrap) {
      wrap.innerHTML = `
        ${buildStatsBar()}
        ${buildFilterTabs()}
        ${buildMaintenanceTable()}
      `;
      bindEvents();
    }
  }

  // --- Layout Builders ---
  function buildStatsBar() {
    const all = DataLayer.getMaintenanceLogs();
    const stats = {
      total: all.length,
      active: all.filter(l => !l.dateClosed).length,
      closed: all.filter(l => l.dateClosed).length,
      totalCost: all.reduce((sum, l) => sum + l.cost, 0),
    };

    return `
      <div class="stats-grid" style="margin-bottom: 24px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
        <div class="stat-card" style="background: var(--bg-card); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-family: var(--font-mono); margin-bottom: 4px;">Total Tickets</div>
          <div style="font-size: 24px; font-weight: 600; color: var(--text-primary); font-family: var(--font-display);">${stats.total}</div>
        </div>
        <div class="stat-card" style="background: var(--bg-card); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-family: var(--font-mono); margin-bottom: 4px;">In Shop (Active)</div>
          <div style="font-size: 24px; font-weight: 600; color: #ff9f1c; font-family: var(--font-display);">${stats.active}</div>
        </div>
        <div class="stat-card" style="background: var(--bg-card); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-family: var(--font-mono); margin-bottom: 4px;">Completed Tickets</div>
          <div style="font-size: 24px; font-weight: 600; color: #2ec4b6; font-family: var(--font-display);">${stats.closed}</div>
        </div>
        <div class="stat-card" style="background: var(--bg-card); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-family: var(--font-mono); margin-bottom: 4px;">Total Spends</div>
          <div style="font-size: 24px; font-weight: 600; color: var(--text-primary); font-family: var(--font-display);">${currency(stats.totalCost)}</div>
        </div>
      </div>
    `;
  }

  function buildFilterTabs() {
    const filters = ['All', 'Active', 'Closed'];
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

  function buildMaintenanceTable() {
    const logs = getFilteredLogs();
    if (logs.length === 0) {
      return `
        <div style="text-align: center; padding: 40px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-color); color: var(--text-muted);">
          No maintenance tickets found.
        </div>
      `;
    }

    return `
      <div class="table-container" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-color); background: var(--bg-base); color: var(--text-secondary); font-family: var(--font-mono); font-size: 11px; text-transform: uppercase;">
              <th style="padding: 14px 16px;">Ticket ID</th>
              <th style="padding: 14px 16px;">Vehicle</th>
              <th style="padding: 14px 16px;">Service Type</th>
              <th style="padding: 14px 16px;">Date Opened</th>
              <th style="padding: 14px 16px;">Date Closed</th>
              <th style="padding: 14px 16px;">Cost</th>
              <th style="padding: 14px 16px;">Notes</th>
              <th style="padding: 14px 16px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(l => {
              const vehicle = DataLayer.getVehicleById(l.vehicleId);
              const statusPill = l.dateClosed 
                ? '<span class="status-pill status-pill--available">Closed</span>' 
                : '<span class="status-pill status-pill--shop">In Shop</span>';

              return `
                <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-primary);">
                  <td style="padding: 14px 16px; font-weight: 500; font-family: var(--font-mono);">M${String(l.id).padStart(3, '0')}</td>
                  <td style="padding: 14px 16px;" class="font-mono">${vehicle ? vehicle.regNumber : '<span style="color:var(--text-muted)">Unknown</span>'}</td>
                  <td style="padding: 14px 16px; font-weight: 500;">${l.serviceType}</td>
                  <td style="padding: 14px 16px;" class="font-mono">${l.dateOpened}</td>
                  <td style="padding: 14px 16px;" class="font-mono">${l.dateClosed || '<span style="color:#ff9f1c; font-weight:500;">Active</span>'}</td>
                  <td style="padding: 14px 16px;" class="font-mono">${currency(l.cost)}</td>
                  <td style="padding: 14px 16px; color: var(--text-secondary); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${l.notes || '—'}</td>
                  <td style="padding: 14px 16px; text-align: right;" class="maint-actions-cell">
                    ${!l.dateClosed ? `
                      <button class="btn btn--small btn--accent btn-close-ticket" data-id="${l.id}">Close Ticket</button>
                    ` : statusPill}
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
    // Only show active (non-Retired) vehicles
    const vehicles = DataLayer.getVehicles().filter(v => v.status !== 'Retired');

    const modalHTML = `
      <div class="modal-overlay" id="maint-modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Open Maintenance Ticket</h2>
            <button class="modal-close" id="modal-close-btn" aria-label="Close">&times;</button>
          </div>
          <form id="add-maint-form">
            <div class="modal-body">
              <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label" for="m-vehicle">Select Vehicle</label>
                <select class="form-input" id="m-vehicle" required>
                  <option value="">-- Choose Vehicle --</option>
                  ${vehicles.map(v => `<option value="${v.id}">${v.regNumber} (${v.name} - Status: ${v.status})</option>`).join('')}
                </select>
              </div>
              <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label" for="m-service">Service Type</label>
                <input type="text" class="form-input" id="m-service" placeholder="e.g. Engine Overhaul, Oil Change" required>
              </div>
              <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label" for="m-opened">Date Opened</label>
                <input type="date" class="form-input font-mono" id="m-opened" value="${new Date().toISOString().split('T')[0]}" required>
              </div>
              <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label" for="m-cost">Base Cost / Estimate (₹)</label>
                <input type="number" class="form-input font-mono" id="m-cost" min="0" placeholder="0">
              </div>
              <div class="form-group">
                <label class="form-label" for="m-notes">Service Description & Notes</label>
                <textarea class="form-input" id="m-notes" placeholder="Enter service details..." style="min-height: 80px;"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn--ghost" id="modal-cancel-btn">Cancel</button>
              <button type="submit" class="btn btn--accent">Open Ticket</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('maint-modal-overlay');
    void overlay.offsetWidth;
    overlay.classList.add('open');

    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    document.getElementById('add-maint-form').addEventListener('submit', handleAddMaint);
  }

  async function handleAddMaint(e) {
    e.preventDefault();

    try {
      await DataLayer.addMaintenanceLog({
        vehicleId: Number(document.getElementById('m-vehicle').value),
        serviceType: document.getElementById('m-service').value.trim(),
        dateOpened: document.getElementById('m-opened').value,
        cost: Number(document.getElementById('m-cost').value || 0),
        notes: document.getElementById('m-notes').value.trim()
      });

      closeModal();
      refreshContent();
    } catch (err) {
      alert(err.message || 'Failed to open maintenance ticket');
    }
  }

  function openCloseModal(logId) {
    const log = DataLayer.getMaintenanceLogById(logId);
    if (!log) return;

    const modalHTML = `
      <div class="modal-overlay" id="close-modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Close Maintenance Ticket</h2>
            <button class="modal-close" id="close-close-btn" aria-label="Close">&times;</button>
          </div>
          <form id="close-maint-form">
            <div class="modal-body">
              <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label" for="c-closed">Date Closed</label>
                <input type="date" class="form-input font-mono" id="c-closed" value="${new Date().toISOString().split('T')[0]}" required>
              </div>
              <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label" for="c-cost">Final Service Cost (₹)</label>
                <input type="number" class="form-input font-mono" id="c-cost" min="0" value="${log.cost}" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="c-notes">Completion Notes</label>
                <textarea class="form-input" id="c-notes" placeholder="Enter closure notes..." style="min-height: 80px;">${log.notes || ''}</textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn--ghost" id="close-cancel-btn">Cancel</button>
              <button type="submit" class="btn btn--accent">Close Ticket</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('close-modal-overlay');
    void overlay.offsetWidth;
    overlay.classList.add('open');

    document.getElementById('close-close-btn').addEventListener('click', closeCloseModal);
    document.getElementById('close-cancel-btn').addEventListener('click', closeCloseModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeCloseModal();
    });

    document.getElementById('close-maint-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const closed = document.getElementById('c-closed').value;
      const cost = Number(document.getElementById('c-cost').value);
      const notes = document.getElementById('c-notes').value.trim();

      try {
        await DataLayer.closeMaintenanceLog(logId, closed, cost, notes);
        closeCloseModal();
        refreshContent();
      } catch (err) {
        alert(err.message || 'Failed to close maintenance ticket');
      }
    });
  }

  function closeModal() {
    const overlay = document.getElementById('maint-modal-overlay');
    if (overlay) {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 200);
    }
  }

  function closeCloseModal() {
    const overlay = document.getElementById('close-modal-overlay');
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

    // Close Ticket Actions
    document.querySelectorAll('.btn-close-ticket').forEach(btn => {
      btn.addEventListener('click', () => {
        openCloseModal(btn.dataset.id);
      });
    });
  }

  // --- Page Renderer ---
  function renderMaintenancePage() {
    const role = DataLayer.getCurrentRole();
    const canCreate = (role === 'Fleet Manager');

    return `
      <div class="page-toolbar">
        <div class="page-toolbar-left"></div>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn--ghost" id="btn-report-maintenance">Generate Report</button>
          ${canCreate ? `
            <button class="btn btn--accent" id="btn-add-maint">
              <span class="btn-icon">+</span> Open Ticket
            </button>
          ` : ''}
        </div>
      </div>
      <div id="maintenance-content-wrap">
        ${buildStatsBar()}
        ${buildFilterTabs()}
        ${buildMaintenanceTable()}
      </div>
    `;
  }

  // --- Register Page ---
  TransitOps.registerPage('maintenance', () => {
    setTimeout(() => {
      bindEvents();

      const role = DataLayer.getCurrentRole();
      const canCreate = (role === 'Fleet Manager');
      if (canCreate) {
        const addBtn = document.getElementById('btn-add-maint');
        if (addBtn) addBtn.addEventListener('click', openAddModal);
      }

      const reportBtn = document.getElementById('btn-report-maintenance');
      if (reportBtn) {
        reportBtn.addEventListener('click', () => {
          if (window.TransitOps && typeof window.TransitOps.openReportModal === 'function') {
            window.TransitOps.openReportModal('Maintenance', () => getFilteredLogs());
          } else {
            console.error("window.TransitOps.openReportModal is undefined when Generate Report was clicked");
          }
        });
      }
    }, 200);

    return renderMaintenancePage();
  });

})();
