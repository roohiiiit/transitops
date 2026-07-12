(function () {
  'use strict';

  // ── Safe DataLayer accessors ──
  // Falls back gracefully instead of throwing if a function isn't wired up yet.
  function safeCall(fnName, fallback, ...args) {
    if (window.DataLayer && typeof window.DataLayer[fnName] === 'function') {
      try {
        return window.DataLayer[fnName](...args);
      } catch (e) {
        console.warn(`DataLayer.${fnName} threw an error:`, e);
        return fallback;
      }
    }
    console.warn(`DataLayer.${fnName} is not implemented yet — using fallback.`);
    return fallback;
  }

  // ── Global Report Modal ──
  let pendingReportSource = null;
  let pendingReportDataFn = null;

  window.TransitOps = window.TransitOps || {};

  window.TransitOps.openReportModal = function (sourceSection, getFilteredDataFn) {
    pendingReportSource = sourceSection;
    pendingReportDataFn = getFilteredDataFn;

    const modalHTML = `
      <div class="modal-overlay" id="report-modal-overlay">
        <div class="modal report-modal" style="max-width: 420px;">
          <div class="modal-header">
            <h2 class="modal-title">Generate Report — ${sourceSection}</h2>
            <button class="modal-close" id="report-modal-close" aria-label="Close">&times;</button>
          </div>
          <div class="modal-body">
            <p style="margin-bottom: 20px; font-size: 14px; color: var(--text-secondary);">
              Select a format to generate a report of the currently visible records.
            </p>
            <div class="report-formats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
              <div class="format-card" data-format="PDF" style="background: var(--bg-surface-2); border: 1px solid var(--border); border-radius: var(--radius, 2px); padding: 20px; text-align: center; cursor: pointer; transition: all 150ms var(--ease, cubic-bezier(0.4, 0, 0.2, 1));">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:8px; color: var(--status-shop);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <div style="font-weight: 500;">PDF Document</div>
                <div style="font-size: 12px; color: var(--text-muted);">Formatted table</div>
              </div>
              <div class="format-card" data-format="CSV" style="background: var(--bg-surface-2); border: 1px solid var(--border); border-radius: var(--radius, 2px); padding: 20px; text-align: center; cursor: pointer; transition: all 150ms var(--ease, cubic-bezier(0.4, 0, 0.2, 1));">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:8px; color: var(--accent);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><line x1="8" y1="9" x2="10" y2="9"></line></svg>
                <div style="font-weight: 500;">CSV Export</div>
                <div style="font-size: 12px; color: var(--text-muted);">Raw spreadsheet</div>
              </div>
            </div>
            <div style="text-align: right;">
              <button class="btn btn--ghost" id="report-cancel">Cancel</button>
              <button class="btn btn--accent" id="report-generate" disabled>Generate</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('report-modal-overlay');
    void overlay.offsetWidth;
    overlay.classList.add('open');

    if (!document.getElementById('format-card-styles')) {
      const style = document.createElement('style');
      style.id = 'format-card-styles';
      style.textContent = `
        .format-card:hover { border-color: var(--text-secondary) !important; background: var(--bg-surface) !important; }
        .format-card.selected { border: 2px solid var(--accent) !important; padding: 19px !important; background: var(--bg-surface) !important; }
      `;
      document.head.appendChild(style);
    }

    const closeBtn = document.getElementById('report-modal-close');
    const cancelBtn = document.getElementById('report-cancel');
    const generateBtn = document.getElementById('report-generate');
    const cards = overlay.querySelectorAll('.format-card');

    let selectedFormat = null;

    const closeModal = () => {
      overlay.classList.add('is-closing');
      overlay.querySelector('.modal').classList.add('is-closing');
      setTimeout(() => overlay.remove(), 180);
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedFormat = card.dataset.format;
        generateBtn.disabled = false;
      });
    });

    generateBtn.addEventListener('click', () => {
      if (!selectedFormat) return;
      
      const originalText = generateBtn.innerHTML;
      generateBtn.disabled = true;
      generateBtn.innerHTML = 'Generating...';

      // Use timeout to allow UI to update the button text before blocking main thread
      setTimeout(() => {
        const data = typeof pendingReportDataFn === 'function' ? pendingReportDataFn() : [];
        if (!data || data.length === 0) {
          generateBtn.disabled = false;
          generateBtn.innerHTML = originalText;
          if (window.TransitOpsAnimations && typeof window.TransitOpsAnimations.showToast === 'function') {
            window.TransitOpsAnimations.showToast("No data in current view to generate a report");
          } else {
            alert("No data in current view to generate a report");
          }
          return;
        }

        const success = safeCall('generateReport', false, pendingReportSource, selectedFormat, data);

        if (success !== false) {
          if (window.TransitOpsAnimations && typeof window.TransitOpsAnimations.showToast === 'function') {
            window.TransitOpsAnimations.showToast(`Report generated — view it in Reports`);
          }
          closeModal();

          // If we are currently on the reports page, refresh the history list
          if (window.TransitOps.currentPage && window.TransitOps.currentPage() === 'reports') {
            const container = document.getElementById('reports-history-content');
            if (container) container.innerHTML = buildReportHistory();
          }
        } else {
          generateBtn.disabled = false;
          generateBtn.innerHTML = originalText;
          if (window.TransitOpsAnimations && typeof window.TransitOpsAnimations.showToast === 'function') {
            window.TransitOpsAnimations.showToast(`Failed to generate report. Ensure data exists.`);
          }
        }
      }, 50);
    });
  };

  function getReportsData() {
    const vehicles = safeCall('getVehicles', []);
    const trips = safeCall('getTrips', []);

    return vehicles.map(v => {
      const vTrips = trips.filter(t => t.vehicleId === v.id && t.status === 'Completed');
      const distance = vTrips.reduce((sum, t) => sum + t.plannedDistanceKm, 0);
      const revenue = distance * 45.0;
      const fuelLiters = vTrips.reduce((sum, t) => sum + (t.fuelConsumed || 0), 0);
      const fuelEfficiency = fuelLiters > 0 ? (distance / fuelLiters) : 0;
      const maintenance = safeCall('getTotalMaintenanceCost', 0, v.id);
      const fuelCost = safeCall('getTotalFuelCost', 0, v.id);
      const otherExp = safeCall('getTotalExpenses', 0, v.id);
      const opCost = maintenance + fuelCost + otherExp;
      const netProfit = revenue - opCost;
      const roi = v.acquisitionCost > 0 ? (netProfit / v.acquisitionCost) * 100 : 0;

      return {
        id: v.id,
        regNumber: v.regNumber,
        name: v.name || '—',
        acquisitionCost: v.acquisitionCost,
        distance,
        revenue,
        maintenance,
        fuelCost,
        otherExp,
        opCost,
        netProfit,
        roi,
        fuelEfficiency
      };
    });
  }

  // ── Reports & Analytics Page ──
  function renderReportsPage() {
    return `
      <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h1 class="page-title">Reports & Analytics</h1>
        <button class="btn btn--accent" id="btn-report-fleet">Generate Report</button>
      </div>
      <div id="reports-content">
        <div class="reports-charts-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 40px;">
          <div class="mt-card stagger-card" style="padding: 24px;">
            <h3 style="font-size: 15px; margin-bottom: 16px;">Fuel Efficiency</h3>
            <div style="position: relative; height: 250px; width: 100%;">
              <canvas id="chart-fuel"></canvas>
            </div>
          </div>
          <div class="mt-card stagger-card" style="padding: 24px;">
            <h3 style="font-size: 15px; margin-bottom: 16px;">Fleet Utilization</h3>
            <div style="position: relative; height: 250px; width: 100%;">
              <canvas id="chart-util"></canvas>
            </div>
          </div>
          <div class="mt-card stagger-card" style="padding: 24px;">
            <h3 style="font-size: 15px; margin-bottom: 16px;">Operational Cost Breakdown</h3>
            <div style="position: relative; height: 250px; width: 100%;">
              <canvas id="chart-cost"></canvas>
            </div>
          </div>
          <div class="mt-card stagger-card" style="padding: 24px;">
            <h3 style="font-size: 15px; margin-bottom: 16px;">Vehicle ROI</h3>
            <div style="position: relative; height: 250px; width: 100%;">
              <canvas id="chart-roi"></canvas>
            </div>
          </div>
        </div>

        <div class="reports-history">
          <h2 style="font-size: 16px; margin-bottom: 16px;">Report History</h2>
          <div id="reports-history-content">
            ${buildReportHistory()}
          </div>
        </div>
      </div>
    `;
  }

  function buildReportHistory() {
    const reports = safeCall('getReports', []);
    if (!reports || reports.length === 0) {
      return `
        <div class="mt-empty-state empty-state">
          <div>No reports generated yet — use "Generate Report" on any section to create one.</div>
        </div>
      `;
    }

    reports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));

    let html = `<div class="history-grid" style="display: grid; gap: 8px;">`;

    reports.forEach((r, idx) => {
      const dateStr = new Date(r.generatedAt).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const formatColor = r.format === 'PDF' ? 'var(--status-shop)' : 'var(--accent)';
      html += `
        <div class="history-item stagger-card" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius, 2px); animation-delay: ${idx * 40}ms;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 40px; height: 40px; background: var(--bg-surface-2); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: ${formatColor}; font-weight: bold; font-size: 12px;">
              ${r.format}
            </div>
            <div>
              <div style="font-weight: 500; font-size: 15px;">${r.name}</div>
              <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Source: ${r.sourceSection} • Generated: ${dateStr} • ${r.rowCount} rows</div>
            </div>
          </div>
          <button class="btn btn--small btn--ghost" style="white-space: nowrap;" onclick="if(window.TransitOps && window.TransitOps.redownloadReport) window.TransitOps.redownloadReport('${r.id}')">Download Again</button>
        </div>
      `;
    });

    html += `</div>`;
    return html;
  }

  window.TransitOps.redownloadReport = function(reportId) {
    const reports = safeCall('getReports', []);
    const report = reports.find(r => r.id === reportId);
    if (!report || !report.data) {
       if (window.TransitOpsAnimations && typeof window.TransitOpsAnimations.showToast === 'function') {
         window.TransitOpsAnimations.showToast('Report data not found for re-download.');
       }
       return;
    }
    
    // Attempt re-download with isRedownload = true
    const success = safeCall('generateReport', false, report.sourceSection, report.format, report.data, true);
    
    if (success !== false) {
      if (window.TransitOpsAnimations && typeof window.TransitOpsAnimations.showToast === 'function') {
        window.TransitOpsAnimations.showToast(`Re-downloading ${report.format} report...`);
      }
    }
  };

  function initCharts() {
    if (!window.Chart) {
      console.warn('Chart.js not loaded.');
      return;
    }

    Chart.defaults.color = '#9A9AA2'; // matches --text-secondary
    Chart.defaults.font.family = 'Inter, sans-serif';

    const vehicles = safeCall('getVehicles', []);

    // 1. Fuel Efficiency
    const ctxFuel = document.getElementById('chart-fuel');
    if (ctxFuel) {
      new Chart(ctxFuel, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Avg km/L',
            data: [4.2, 4.3, 4.1, 4.5, 4.4, 4.2, 4.6],
            borderColor: '#D4FF3F',
            backgroundColor: 'rgba(212, 255, 63, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: '#2A2A2F' }, beginAtZero: false },
            x: { grid: { color: '#2A2A2F' } }
          }
        }
      });
    }

    // 2. Fleet Utilization
    const ctxUtil = document.getElementById('chart-util');
    if (ctxUtil) {
      new Chart(ctxUtil, {
        type: 'bar',
        data: {
          labels: ['W1', 'W2', 'W3', 'W4'],
          datasets: [{
            label: 'Utilization %',
            data: [72, 78, 75, 82],
            backgroundColor: '#D4FF3F',
            borderRadius: 4
          }]
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: '#2A2A2F' }, max: 100 },
            x: { grid: { color: '#2A2A2F' } }
          }
        }
      });
    }

    // 3. Operational Cost Breakdown
    const ctxCost = document.getElementById('chart-cost');
    if (ctxCost) {
      const topVehicles = vehicles.slice(0, 5);
      const labels = topVehicles.map(v => v.regNumber);
      const fuelCosts = topVehicles.map(v => safeCall('getTotalFuelCost', 0, v.id));
      const maintCosts = topVehicles.map(v => safeCall('getTotalMaintenanceCost', 0, v.id));

      new Chart(ctxCost, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            { label: 'Fuel', data: fuelCosts, backgroundColor: '#D4FF3F' },
            { label: 'Maintenance', data: maintCosts, backgroundColor: '#FF9F3F' }
          ]
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: { legend: { position: 'bottom' } },
          scales: {
            y: { stacked: true, grid: { color: '#2A2A2F' } },
            x: { stacked: true, grid: { color: '#2A2A2F' } }
          }
        }
      });
    }

    // 4. Vehicle ROI
    const ctxRoi = document.getElementById('chart-roi');
    if (ctxRoi) {
      const topVehicles = vehicles.slice(0, 5);
      const labels = topVehicles.map(v => v.regNumber);
      const rois = topVehicles.map(v => {
        const rev = safeCall('getMockRevenuePerVehicle', 0, v.id);
        const ops = safeCall('getOperationalCost', 0, v.id);
        const acquisitionCost = v.acquisitionCost || 1;
        return ((rev - ops) / acquisitionCost) * 100;
      });

      new Chart(ctxRoi, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'ROI %',
            data: rois,
            backgroundColor: rois.map(r => r >= 0 ? '#3FE07A' : '#FF4F5E'),
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          maintainAspectRatio: false,
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: '#2A2A2F' } },
            y: { grid: { color: '#2A2A2F' } }
          }
        }
      });
    }
  }

  // ── Register Page ──
  if (window.TransitOps && typeof window.TransitOps.registerPage === 'function') {
    window.TransitOps.registerPage('reports', () => {
      setTimeout(() => {
        if (window.TransitOpsAnimations && typeof window.TransitOpsAnimations.initStagger === 'function') {
          const container = document.getElementById('reports-content');
          if (container) window.TransitOpsAnimations.initStagger(container);
        }
        initCharts();

        // Bind Generate Report button on Reports page
        const fleetBtn = document.getElementById('btn-report-fleet');
        if (fleetBtn) {
          fleetBtn.addEventListener('click', () => {
            if (window.TransitOps && typeof window.TransitOps.openReportModal === 'function') {
              window.TransitOps.openReportModal('Fleet Summary', () => getReportsData());
            } else {
              console.error("window.TransitOps.openReportModal is undefined when Generate Report was clicked");
            }
          });
        }
      }, 200);
      return renderReportsPage();
    });
  } else {
    console.warn('window.TransitOps.registerPage is not available — Reports page was not registered.');
  }

})();