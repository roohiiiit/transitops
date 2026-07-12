/* ═══════════════════════════════════════════════════════════
   TransitOps — Database Table Previewer
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let selectedTable = 'Vehicles';

  const TABLES = {
    'Vehicles': {
      fetch: () => DataLayer.getVehicles(),
      columns: ['id', 'regNumber', 'name', 'type', 'maxLoadKg', 'odometer', 'acquisitionCost', 'status']
    },
    'Drivers': {
      fetch: () => DataLayer.getDrivers(),
      columns: ['id', 'name', 'licenseNumber', 'licenseCategory', 'licenseExpiry', 'contactNumber', 'safetyScore', 'status']
    },
    'Trips': {
      fetch: () => DataLayer.getTrips(),
      columns: ['id', 'source', 'destination', 'cargoWeightKg', 'plannedDistanceKm', 'status', 'actualOdometer', 'fuelConsumed']
    },
    'Maintenance': {
      fetch: () => DataLayer.getMaintenanceLogs(),
      columns: ['id', 'vehicleId', 'serviceType', 'dateOpened', 'dateClosed', 'cost', 'notes']
    },
    'Fuel Logs': {
      fetch: () => DataLayer.getFuelLogs(),
      columns: ['id', 'vehicleId', 'date', 'liters', 'cost']
    },
    'Expenses': {
      fetch: () => DataLayer.getExpenses(),
      columns: ['id', 'vehicleId', 'type', 'date', 'cost']
    }
  };

  function refreshContent() {
    const wrap = document.getElementById('preview-content-wrap');
    if (wrap) {
      wrap.innerHTML = `
        ${buildTableSelector()}
        ${buildTableData()}
      `;
      bindEvents();
    }
  }

  function buildTableSelector() {
    const options = Object.keys(TABLES);
    return `
      <div style="background: var(--bg-card); padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <label class="form-label" style="margin-bottom:0; font-family: var(--font-mono); font-size:11px; text-transform:uppercase; color: var(--text-secondary);">Select Table Preview:</label>
          <select class="form-input" id="preview-table-select" style="width: 200px; padding: 6px 12px; height: auto;">
            ${options.map(t => `<option value="${t}"${t === selectedTable ? ' selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">
          Total Rows: <span style="color: var(--accent); font-weight:600;">${TABLES[selectedTable].fetch().length}</span>
        </div>
      </div>
    `;
  }

  function buildTableData() {
    const config = TABLES[selectedTable];
    const rows = config.fetch();

    if (rows.length === 0) {
      return `
        <div style="text-align: center; padding: 40px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-color); color: var(--text-muted); font-family: var(--font-mono); font-size:12px;">
          Table '${selectedTable}' is currently empty.
        </div>
      `;
    }

    return `
      <div class="table-container" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-color); background: var(--bg-base); color: var(--text-secondary); font-family: var(--font-mono); font-size: 11px; text-transform: uppercase;">
              ${config.columns.map(col => `<th style="padding: 12px 16px;">${col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-primary); font-family: var(--font-mono);" onmouseover="this.style.background='rgba(255,255,255,0.01)'" onmouseout="this.style.background='transparent'">
                ${config.columns.map(col => {
                  let val = row[col];
                  if (val === null || val === undefined) {
                    return `<td style="padding: 12px 16px; color: var(--text-muted);">null</td>`;
                  }
                  if (typeof val === 'boolean') {
                    return `<td style="padding: 12px 16px; color: ${val ? '#2ec4b6' : '#ff4d4f'};">${val}</td>`;
                  }
                  if (col.toLowerCase().includes('cost') || col.toLowerCase().includes('price') || col === 'cost') {
                    return `<td style="padding: 12px 16px; color: var(--accent);">₹${Number(val).toLocaleString('en-IN')}</td>`;
                  }
                  return `<td style="padding: 12px 16px;">${val}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function bindEvents() {
    const selector = document.getElementById('preview-table-select');
    if (selector) {
      selector.addEventListener('change', (e) => {
        selectedTable = e.target.value;
        refreshContent();
      });
    }
  }

  function renderPreviewPage() {
    const html = `
      <div id="preview-content-wrap" style="margin-top: 16px;">
        ${buildTableSelector()}
        ${buildTableData()}
      </div>
    `;

    Layout.setPageContent(html);
    bindEvents();
  }

  // --- Register Page ---
  TransitOps.registerPage('preview', renderPreviewPage);

})();
