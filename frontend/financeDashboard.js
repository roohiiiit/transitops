/* ═══════════════════════════════════════════════════════════
   TransitOps — Financial Officer Dashboard
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  function getFinanceMetrics() {
    const vehicles = window.DataLayer ? window.DataLayer.getVehicles() : [];
    const expenses = window.DataLayer ? window.DataLayer.getExpenses() : [];
    const fuelLogs = window.DataLayer ? window.DataLayer.getFuelLogs() : [];
    const maintenance = window.DataLayer ? window.DataLayer.getMaintenanceLogs() : [];

    let totalAssetValue = 0;
    vehicles.forEach(v => {
      totalAssetValue += v.acquisitionCost || 0;
    });

    let totalFuelCost = 0;
    fuelLogs.forEach(f => {
      totalFuelCost += f.cost || 0;
    });

    let totalMaintenanceCost = 0;
    maintenance.forEach(m => {
      totalMaintenanceCost += m.cost || 0;
    });

    let totalOtherExpenses = 0;
    expenses.forEach(e => {
      totalOtherExpenses += e.cost || 0;
    });

    const totalOpEx = totalFuelCost + totalMaintenanceCost + totalOtherExpenses;

    return {
      totalAssetValue,
      totalFuelCost,
      totalMaintenanceCost,
      totalOtherExpenses,
      totalOpEx
    };
  }

  function formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  function buildKPICards(metrics) {
    return `
      <div class="dash-kpi-grid">
        <div class="dash-kpi-card stagger-card" style="--card-accent: var(--accent);">
          <div class="dash-kpi-count animate-number" data-value="${metrics.totalOpEx}" data-prefix="₹">₹${metrics.totalOpEx.toLocaleString('en-IN')}</div>
          <div class="dash-kpi-label">Total Operational Expenses (OpEx)</div>
        </div>
        <div class="dash-kpi-card stagger-card" style="--card-accent: #3B82F6;">
          <div class="dash-kpi-count animate-number" data-value="${metrics.totalFuelCost}" data-prefix="₹">₹${metrics.totalFuelCost.toLocaleString('en-IN')}</div>
          <div class="dash-kpi-label">Total Fuel Cost</div>
        </div>
        <div class="dash-kpi-card stagger-card" style="--card-accent: #F59E0B;">
          <div class="dash-kpi-count animate-number" data-value="${metrics.totalMaintenanceCost}" data-prefix="₹">₹${metrics.totalMaintenanceCost.toLocaleString('en-IN')}</div>
          <div class="dash-kpi-label">Total Maintenance Cost</div>
        </div>
        <div class="dash-kpi-card dash-kpi-card--headline stagger-card" style="--card-accent: #10B981;">
          <div class="dash-kpi-count animate-number" data-value="${metrics.totalAssetValue}" data-prefix="₹">₹${metrics.totalAssetValue.toLocaleString('en-IN')}</div>
          <div class="dash-kpi-label">Total Asset Value (Fleet)</div>
        </div>
      </div>
    `;
  }

  function buildExpensesChart() {
    return `
      <div class="dash-panel stagger-card" style="margin-top: 24px;">
        <h3 class="panel-title">Expense Breakdown</h3>
        <div style="height: 300px; display: flex; align-items: flex-end; gap: 20px; padding-top: 20px;">
          <!-- A simple CSS chart to represent the breakdown -->
          <div style="flex: 1; background: #3B82F6; height: 60%; border-radius: 8px 8px 0 0; position: relative; text-align: center; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 10px; font-weight: bold;">Fuel</div>
          <div style="flex: 1; background: #F59E0B; height: 45%; border-radius: 8px 8px 0 0; position: relative; text-align: center; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 10px; font-weight: bold;">Maintenance</div>
          <div style="flex: 1; background: #8B5CF6; height: 25%; border-radius: 8px 8px 0 0; position: relative; text-align: center; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 10px; font-weight: bold;">Tolls/Permits</div>
        </div>
      </div>
    `;
  }

  function renderFinanceDashboard() {
    const metrics = getFinanceMetrics();

    const html = `
      <div class="dash-content-wrap">
        ${buildKPICards(metrics)}
        ${buildExpensesChart()}
      </div>
    `;

    if (window.Layout && window.Layout.setPageContent) {
      window.Layout.setPageContent(html);
    }
  }

  // Register the module
  window.TransitOps = window.TransitOps || {};
  if (window.TransitOps.registerPage) {
    window.TransitOps.registerPage('finance-dashboard', renderFinanceDashboard);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      window.TransitOps.registerPage('finance-dashboard', renderFinanceDashboard);
    });
  }

})();
