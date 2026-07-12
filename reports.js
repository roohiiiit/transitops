/* ═══════════════════════════════════════════════════════════
   TransitOps — Reports & Analytics Module
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  function currency(val) {
    return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  function percent(val) {
    return Number(val).toFixed(1) + '%';
  }

  function formatEff(val) {
    if (isNaN(val) || !isFinite(val) || val === 0) return '—';
    return Number(val).toFixed(2) + ' km/L';
  }

  // --- Calculations for Reports ---
  function getReportsData() {
    const vehicles = DataLayer.getVehicles();
    const trips = DataLayer.getTrips();

    return vehicles.map(v => {
      // Completed trips for this vehicle
      const vTrips = trips.filter(t => t.vehicleId === v.id && t.status === 'Completed');
      
      // Calculate Revenue: Assume ₹45 per km for completed distance
      const distance = vTrips.reduce((sum, t) => sum + t.plannedDistanceKm, 0);
      const revenue = distance * 45.0;

      // Fuel consumed
      const fuelLiters = vTrips.reduce((sum, t) => sum + (t.fuelConsumed || 0), 0);
      const fuelEfficiency = fuelLiters > 0 ? (distance / fuelLiters) : 0;

      // Operational costs
      const maintenance = DataLayer.getTotalMaintenanceCost(v.id);
      const fuelCost = DataLayer.getTotalFuelCost(v.id);
      const otherExp = DataLayer.getTotalExpenses(v.id);
      const opCost = maintenance + fuelCost + otherExp;

      // ROI = (Revenue - opCost) / Acquisition Cost
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

  // --- CSV Export ---
  function exportCSV() {
    const data = getReportsData();
    const headers = [
      'Vehicle ID',
      'Registration Number',
      'Name/Model',
      'Acquisition Cost (INR)',
      'Total Distance (km)',
      'Est. Revenue (INR)',
      'Maintenance Cost (INR)',
      'Fuel Cost (INR)',
      'Other Expenses (INR)',
      'Total Op Cost (INR)',
      'Net Profit (INR)',
      'ROI (%)',
      'Fuel Efficiency (km/L)'
    ];

    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = [
        `V${String(row.id).padStart(3, '0')}`,
        `"${row.regNumber}"`,
        `"${row.name}"`,
        row.acquisitionCost,
        row.distance,
        row.revenue,
        row.maintenance,
        row.fuelCost,
        row.otherExp,
        row.opCost,
        row.netProfit,
        row.roi.toFixed(2),
        row.fuelEfficiency.toFixed(2)
      ];
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TransitOps_Fleet_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- Layout Builders ---
  function buildReportsTable() {
    const data = getReportsData();
    
    return `
      <div class="table-container" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-color); background: var(--bg-base); color: var(--text-secondary); font-family: var(--font-mono); font-size: 11px; text-transform: uppercase;">
              <th style="padding: 14px 16px;">Vehicle</th>
              <th style="padding: 14px 16px; text-align: right;">Acquisition Cost</th>
              <th style="padding: 14px 16px; text-align: right;">Total Distance</th>
              <th style="padding: 14px 16px; text-align: right;">Revenue</th>
              <th style="padding: 14px 16px; text-align: right;">Op Cost</th>
              <th style="padding: 14px 16px; text-align: right;">Net Profit</th>
              <th style="padding: 14px 16px; text-align: right;">Fuel Efficiency</th>
              <th style="padding: 14px 16px; text-align: right;">ROI %</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(row => {
              const profitColor = row.netProfit >= 0 ? '#2ec4b6' : '#ff4d4f';
              const roiColor = row.roi >= 0 ? 'var(--accent)' : '#ff4d4f';

              return `
                <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-primary);">
                  <td style="padding: 14px 16px;">
                    <div style="font-weight:600;" class="font-mono">${row.regNumber}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${row.name}</div>
                  </td>
                  <td style="padding: 14px 16px; text-align: right;" class="font-mono">${currency(row.acquisitionCost)}</td>
                  <td style="padding: 14px 16px; text-align: right;" class="font-mono">${row.distance.toLocaleString()} km</td>
                  <td style="padding: 14px 16px; text-align: right;" class="font-mono">${currency(row.revenue)}</td>
                  <td style="padding: 14px 16px; text-align: right;" class="font-mono">${currency(row.opCost)}</td>
                  <td style="padding: 14px 16px; text-align: right; font-weight: 500; color: ${profitColor};" class="font-mono">${currency(row.netProfit)}</td>
                  <td style="padding: 14px 16px; text-align: right;" class="font-mono">${formatEff(row.fuelEfficiency)}</td>
                  <td style="padding: 14px 16px; text-align: right; font-weight: 600; color: ${roiColor};" class="font-mono">${percent(row.roi)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // --- Page Renderer ---
  function renderReportsPage() {
    const html = `
      <div class="page-toolbar">
        <div class="page-toolbar-left"></div>
        <button class="btn btn--accent" id="btn-export-csv">
          Export Fleet CSV
        </button>
      </div>
      <div id="reports-content-wrap" style="margin-top: 16px;">
        ${buildReportsTable()}
      </div>
    `;

    Layout.setPageContent(html);
    document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
  }

  // --- Register Page ---
  TransitOps.registerPage('reports', renderReportsPage);

})();
