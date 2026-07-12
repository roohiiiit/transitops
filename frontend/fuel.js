/* ═══════════════════════════════════════════════════════════
   TransitOps — Fuel & Expense Tracking Module
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let currentTab = 'All'; // All, Fuel, Expense
  let activeModalTab = 'fuel'; // fuel, expense

  function currency(val) {
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  function getCombinedLogs() {
    const fuel = DataLayer.getFuelLogs().map(f => ({ ...f, logType: 'Fuel', description: `${f.liters} Liters Refuel` }));
    const exp = DataLayer.getExpenses().map(e => ({ ...e, logType: 'Expense', description: e.type }));
    
    // Combine and sort by date descending
    const combined = [...fuel, ...exp];
    combined.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (currentTab === 'All') return combined;
    return combined.filter(l => l.logType === currentTab);
  }

  function setTab(tab) {
    currentTab = tab;
    refreshContent();
  }

  function refreshContent() {
    const wrap = document.getElementById('fuel-content-wrap');
    if (wrap) {
      wrap.innerHTML = `
        ${buildStatsBar()}
        ${buildFilterTabs()}
        ${buildLogsTable()}
      `;
      bindEvents();
    }
  }

  // --- Layout Builders ---
  function buildStatsBar() {
    const fuelLogs = DataLayer.getFuelLogs();
    const expenses = DataLayer.getExpenses();
    
    const stats = {
      totalFuel: fuelLogs.reduce((sum, f) => sum + f.cost, 0),
      totalExpenses: expenses.reduce((sum, e) => sum + e.cost, 0),
    };
    stats.cumulative = stats.totalFuel + stats.totalExpenses;

    return `
      <div class="stats-grid" style="margin-bottom: 24px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
        <div class="stat-card" style="background: var(--bg-card); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-family: var(--font-mono); margin-bottom: 4px;">Fuel Spends</div>
          <div style="font-size: 24px; font-weight: 600; color: #ff9f1c; font-family: var(--font-display);">${currency(stats.totalFuel)}</div>
        </div>
        <div class="stat-card" style="background: var(--bg-card); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-family: var(--font-mono); margin-bottom: 4px;">Other Expenses (Tolls/Etc)</div>
          <div style="font-size: 24px; font-weight: 600; color: #2ec4b6; font-family: var(--font-display);">${currency(stats.totalExpenses)}</div>
        </div>
        <div class="stat-card" style="background: var(--bg-card); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-family: var(--font-mono); margin-bottom: 4px;">Total Operational Spend</div>
          <div style="font-size: 24px; font-weight: 600; color: var(--text-primary); font-family: var(--font-display);">${currency(stats.cumulative)}</div>
        </div>
      </div>
    `;
  }

  function buildFilterTabs() {
    const tabs = ['All', 'Fuel', 'Expense'];
    return `
      <div class="filter-bar" style="margin-bottom: 16px; display: flex; gap: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
        ${tabs.map(t => `
          <button class="btn btn--small ${currentTab === t ? 'btn--accent' : 'btn--ghost'}" data-tab="${t}">
            ${t === 'All' ? 'All Transactions' : t === 'Fuel' ? 'Fuel Refills' : 'Other Spends'}
          </button>
        `).join('')}
      </div>
    `;
  }

  function buildLogsTable() {
    const logs = getCombinedLogs();
    if (logs.length === 0) {
      return `
        <div style="text-align: center; padding: 40px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-color); color: var(--text-muted);">
          No logging transactions found.
        </div>
      `;
    }

    return `
      <div class="table-container" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-color); background: var(--bg-base); color: var(--text-secondary); font-family: var(--font-mono); font-size: 11px; text-transform: uppercase;">
              <th style="padding: 14px 16px;">Transaction ID</th>
              <th style="padding: 14px 16px;">Vehicle</th>
              <th style="padding: 14px 16px;">Date</th>
              <th style="padding: 14px 16px;">Type</th>
              <th style="padding: 14px 16px;">Description</th>
              <th style="padding: 14px 16px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(l => {
              const vehicle = DataLayer.getVehicleById(l.vehicleId);
              const isFuel = l.logType === 'Fuel';
              const typePill = isFuel
                ? '<span class="status-pill" style="background-color:rgba(255, 159, 28, 0.1); color:#ff9f1c; border-color:#ff9f1c;">Fuel</span>'
                : '<span class="status-pill" style="background-color:rgba(46, 196, 182, 0.1); color:#2ec4b6; border-color:#2ec4b6;">Expense</span>';

              return `
                <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-primary);">
                  <td style="padding: 14px 16px; font-family: var(--font-mono);">${isFuel ? 'F' : 'E'}${String(l.id).padStart(3, '0')}</td>
                  <td style="padding: 14px 16px;" class="font-mono">${vehicle ? vehicle.regNumber : '<span style="color:var(--text-muted)">Unknown</span>'}</td>
                  <td style="padding: 14px 16px;" class="font-mono">${l.date}</td>
                  <td style="padding: 14px 16px;">${typePill}</td>
                  <td style="padding: 14px 16px;">${l.description}</td>
                  <td style="padding: 14px 16px; text-align: right; font-weight: 500;" class="font-mono">${currency(l.cost)}</td>
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
    const vehicles = DataLayer.getVehicles().filter(v => v.status !== 'Retired');

    const modalHTML = `
      <div class="modal-overlay" id="expense-modal-overlay">
        <div class="modal" style="max-width: 480px;">
          <div class="modal-header">
            <h2 class="modal-title">Log Operations Cost</h2>
            <button class="modal-close" id="modal-close-btn" aria-label="Close">&times;</button>
          </div>
          
          <!-- Modal Tab selector -->
          <div style="display:flex; border-bottom: 1px solid var(--border-color); padding: 0 24px;">
            <button type="button" class="modal-tab-btn active" id="tab-log-fuel" style="padding: 12px 16px; border:none; background:none; font-weight:500; cursor:pointer; color:var(--text-primary); border-bottom: 2px solid var(--accent);">Fuel Purchase</button>
            <button type="button" class="modal-tab-btn" id="tab-log-expense" style="padding: 12px 16px; border:none; background:none; font-weight:500; cursor:pointer; color:var(--text-secondary); border-bottom: 2px solid transparent;">Other Expense</button>
          </div>

          <div class="modal-body" style="padding-top:16px;">
            <!-- COMMON FIELD: Vehicle -->
            <div class="form-group" style="margin-bottom:16px;">
              <label class="form-label" for="fe-vehicle">Select Vehicle</label>
              <select class="form-input" id="fe-vehicle" required>
                <option value="">-- Choose Vehicle --</option>
                ${vehicles.map(v => `<option value="${v.id}">${v.regNumber} (${v.name})</option>`).join('')}
              </select>
            </div>

            <!-- COMMON FIELD: Date -->
            <div class="form-group" style="margin-bottom:16px;">
              <label class="form-label" for="fe-date">Date</label>
              <input type="date" class="form-input font-mono" id="fe-date" value="${new Date().toISOString().split('T')[0]}" required>
            </div>

            <!-- TAB 1 CONTENT: Fuel Refill -->
            <div id="m-tab-fuel">
              <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label" for="fe-liters">Liters Refuelled</label>
                <input type="number" class="form-input font-mono" id="fe-liters" min="1" step="0.1" placeholder="e.g. 50">
              </div>
              <div class="form-group">
                <label class="form-label" for="fe-fuel-cost">Total Refuel Cost (₹)</label>
                <input type="number" class="form-input font-mono" id="fe-fuel-cost" min="0" placeholder="0">
              </div>
            </div>

            <!-- TAB 2 CONTENT: Other Expenses -->
            <div id="m-tab-expense" style="display:none;">
              <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label" for="fe-type">Expense Type</label>
                <select class="form-input" id="fe-type">
                  <option value="Toll">Toll Fee</option>
                  <option value="Insurance">Insurance Payment</option>
                  <option value="Permit">State Permit</option>
                  <option value="Parking">Parking Fee</option>
                  <option value="Other">Other Operational Cost</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="fe-expense-cost">Expense Cost (₹)</label>
                <input type="number" class="form-input font-mono" id="fe-expense-cost" min="0" placeholder="0">
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn--ghost" id="modal-cancel-btn">Cancel</button>
            <button type="button" class="btn btn--accent" id="btn-submit-entry">Save Entry</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('expense-modal-overlay');
    void overlay.offsetWidth;
    overlay.classList.add('open');

    // Bind tab clicks
    const tabFuel = document.getElementById('tab-log-fuel');
    const tabExpense = document.getElementById('tab-log-expense');
    const divFuel = document.getElementById('m-tab-fuel');
    const divExpense = document.getElementById('m-tab-expense');

    activeModalTab = 'fuel';

    tabFuel.addEventListener('click', () => {
      activeModalTab = 'fuel';
      tabFuel.classList.add('active');
      tabFuel.style.color = 'var(--text-primary)';
      tabFuel.style.borderBottomColor = 'var(--accent)';
      
      tabExpense.classList.remove('active');
      tabExpense.style.color = 'var(--text-secondary)';
      tabExpense.style.borderBottomColor = 'transparent';

      divFuel.style.display = 'block';
      divExpense.style.display = 'none';
    });

    tabExpense.addEventListener('click', () => {
      activeModalTab = 'expense';
      tabExpense.classList.add('active');
      tabExpense.style.color = 'var(--text-primary)';
      tabExpense.style.borderBottomColor = 'var(--accent)';

      tabFuel.classList.remove('active');
      tabFuel.style.color = 'var(--text-secondary)';
      tabFuel.style.borderBottomColor = 'transparent';

      divFuel.style.display = 'none';
      divExpense.style.display = 'block';
    });

    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    document.getElementById('btn-submit-entry').addEventListener('click', handleSaveEntry);
  }

  async function handleSaveEntry() {
    const vehicleId = document.getElementById('fe-vehicle').value;
    const date = document.getElementById('fe-date').value;

    if (!vehicleId || !date) {
      alert('Please fill out vehicle and date fields.');
      return;
    }

    try {
      if (activeModalTab === 'fuel') {
        const liters = Number(document.getElementById('fe-liters').value);
        const cost = Number(document.getElementById('fe-fuel-cost').value);

        if (!liters || !cost) {
          alert('Please enter valid fuel liters and cost.');
          return;
        }

        await DataLayer.addFuelLog({
          vehicleId: Number(vehicleId),
          date,
          liters,
          cost
        });
      } else {
        const type = document.getElementById('fe-type').value;
        const cost = Number(document.getElementById('fe-expense-cost').value);

        if (!cost) {
          alert('Please enter a valid expense cost.');
          return;
        }

        await DataLayer.addExpense({
          vehicleId: Number(vehicleId),
          type,
          date,
          cost
        });
      }

      closeModal();
      refreshContent();
    } catch (err) {
      alert(err.message || 'Failed to save transaction');
    }
  }

  function closeModal() {
    const overlay = document.getElementById('expense-modal-overlay');
    if (overlay) {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 200);
    }
  }

  // --- Event Binding ---
  function bindEvents() {
    // Tab Clicks
    document.querySelectorAll('.filter-bar button').forEach(btn => {
      btn.addEventListener('click', () => {
        setTab(btn.dataset.tab);
      });
    });
  }

  function getFilteredSpendData() {
    if (currentTab === 'Fuel') {
      return DataLayer.getFuelLogs();
    } else if (currentTab === 'Expense') {
      return DataLayer.getExpenses();
    } else {
      return getCombinedLogs();
    }
  }

  // --- Page Renderer ---
  function renderFuelPage() {
    const role = DataLayer.getCurrentRole();
    const canCreate = (role === 'Fleet Manager' || role === 'Financial Analyst');

    const html = `
      <div class="page-toolbar">
        <div class="page-toolbar-left"></div>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn--ghost" id="btn-report-fuel">Generate Report</button>
          ${canCreate ? `
            <button class="btn btn--accent" id="btn-add-expense">
              <span class="btn-icon">+</span> Log Spend
            </button>
          ` : ''}
        </div>
      </div>
      <div id="fuel-content-wrap">
        ${buildStatsBar()}
        ${buildFilterTabs()}
        ${buildLogsTable()}
      </div>
    `;

    return html;
  }

  // --- Register Page ---
  TransitOps.registerPage('fuel', () => {
    setTimeout(() => {
      bindEvents();

      const role = DataLayer.getCurrentRole();
      const canCreate = (role === 'Fleet Manager' || role === 'Financial Analyst');
      if (canCreate) {
        const addBtn = document.getElementById('btn-add-expense');
        if (addBtn) addBtn.addEventListener('click', openAddModal);
      }

      const reportBtn = document.getElementById('btn-report-fuel');
      if (reportBtn) {
        reportBtn.addEventListener('click', () => {
          if (window.TransitOps && typeof window.TransitOps.openReportModal === 'function') {
            window.TransitOps.openReportModal('Fuel & Expense', () => getFilteredSpendData());
          } else {
            console.error("window.TransitOps.openReportModal is undefined when Generate Report was clicked");
          }
        });
      }
    }, 200);

    return renderFuelPage();
  });

})();
