/* ═══════════════════════════════════════════════════════════
   TransitOps — Safety Officer Dashboard
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://localhost:8000' : window.location.origin;

  let alerts = [];

  function getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('transitops_token')}`
    };
  }

  async function fetchAlerts() {
    try {
      const res = await fetch(`${API_URL}/alerts`, { headers: getHeaders() });
      if (res.ok) {
        alerts = await res.json();
      }
    } catch (e) {
      console.error("Failed to fetch alerts:", e);
    }
  }

  async function resolveAlert(alertId) {
    try {
      const res = await fetch(`${API_URL}/alerts/${alertId}/resolve`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        if (window.TransitOpsAnimations) window.TransitOpsAnimations.showToast("Alert resolved successfully", "success");
        await fetchAlerts();
        renderSafetyDashboard();
      } else {
        const err = await res.json();
        if (window.TransitOpsAnimations) window.TransitOpsAnimations.showToast(err.detail || "Error resolving alert", "error");
      }
    } catch (e) {
      console.error("Error resolving alert:", e);
    }
  }

  async function reopenAlert(alertId) {
    try {
      const res = await fetch(`${API_URL}/alerts/${alertId}/reopen`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        if (window.TransitOpsAnimations) window.TransitOpsAnimations.showToast("Alert reopened successfully", "success");
        await fetchAlerts();
        renderSafetyDashboard();
      } else {
        const err = await res.json();
        if (window.TransitOpsAnimations) window.TransitOpsAnimations.showToast(err.detail || "Error reopening alert", "error");
      }
    } catch (e) {
      console.error("Error reopening alert:", e);
    }
  }

  function handleStatusChange(alertId, newStatus) {
    if (newStatus === 'Resolved') {
      resolveAlert(alertId);
    } else {
      reopenAlert(alertId);
    }
  }

  function getSafetyMetrics() {
    const drivers = window.DataLayer ? window.DataLayer.getDrivers() : [];
    
    let totalScore = 0;
    let count = 0;
    let criticalDrivers = 0;

    drivers.forEach(d => {
      if (d.safetyScore !== undefined) {
        totalScore += d.safetyScore;
        count++;
        if (d.safetyScore < 70) criticalDrivers++;
      }
    });

    const avgScore = count > 0 ? Math.round(totalScore / count) : 0;
    const openAlerts = alerts.filter(a => a.status === 'Open').length;

    return {
      avgScore,
      criticalDrivers,
      openAlerts,
      totalDrivers: drivers.length
    };
  }

  function buildKPICards(metrics) {
    return `
      <div class="dash-kpi-grid">
        <div class="dash-kpi-card stagger-card" style="--card-accent: #EF4444;">
          <div class="dash-kpi-count animate-number" data-value="${metrics.openAlerts}">${metrics.openAlerts}</div>
          <div class="dash-kpi-label">Open Vehicle Alerts</div>
        </div>
        <div class="dash-kpi-card stagger-card" style="--card-accent: var(--accent);">
          <div class="dash-kpi-count animate-number" data-value="${metrics.avgScore}" data-suffix="%">${metrics.avgScore}%</div>
          <div class="dash-kpi-label">Avg Fleet Safety Score</div>
        </div>
        <div class="dash-kpi-card stagger-card" style="--card-accent: #F59E0B;">
          <div class="dash-kpi-count animate-number" data-value="${metrics.criticalDrivers}">${metrics.criticalDrivers}</div>
          <div class="dash-kpi-label">Drivers at Risk (< 70)</div>
        </div>
        <div class="dash-kpi-card stagger-card" style="--card-accent: var(--text-primary);">
          <div class="dash-kpi-count animate-number" data-value="${metrics.totalDrivers}">${metrics.totalDrivers}</div>
          <div class="dash-kpi-label">Total Drivers Monitored</div>
        </div>
      </div>
    `;
  }

  // alerts table moved to alerts.js

  async function renderSafetyDashboard() {
    await fetchAlerts();
    const metrics = getSafetyMetrics();

    const html = `
      <div class="dash-content-wrap">
        ${buildKPICards(metrics)}
      </div>
    `;

    if (window.Layout && window.Layout.setPageContent) {
      window.Layout.setPageContent(html);
    }
  }

  // Register public API for onclick handlers
  window.TransitOpsSafety = {
    resolveAlert,
    reopenAlert,
    handleStatusChange
  };

  // Register the module
  window.TransitOps = window.TransitOps || {};
  if (window.TransitOps.registerPage) {
    window.TransitOps.registerPage('safety-dashboard', renderSafetyDashboard);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      window.TransitOps.registerPage('safety-dashboard', renderSafetyDashboard);
    });
  }

})();
