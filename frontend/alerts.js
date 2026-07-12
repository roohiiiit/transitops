/* ═══════════════════════════════════════════════════════════
   TransitOps — Alerts Management
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

  async function updateAlertStatus(alertId, status) {
    try {
      const res = await fetch(`${API_URL}/alerts/${alertId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        if (window.TransitOpsAnimations) window.TransitOpsAnimations.showToast("Alert status updated", "success");
        await fetchAlerts();
        renderAlertsPage();
      } else {
        const err = await res.json();
        if (window.TransitOpsAnimations) window.TransitOpsAnimations.showToast(err.detail || "Error updating alert", "error");
      }
    } catch (e) {
      console.error("Error updating alert:", e);
    }
  }

  async function createTicket(alertId, vehicleId, message) {
    try {
      const res = await fetch(`${API_URL}/maintenance`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          vehicleId: vehicleId,
          serviceType: "Issue Reported",
          dateOpened: new Date().toISOString().split('T')[0],
          cost: 0,
          notes: message
        })
      });

      if (res.ok) {
        // Update alert status to "Ticket Created"
        await fetch(`${API_URL}/alerts/${alertId}/status`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ status: "Ticket Created" })
        });
        
        if (window.TransitOpsAnimations) window.TransitOpsAnimations.showToast("Ticket created successfully", "success");
        await fetchAlerts();
        renderAlertsPage();
      } else {
        const err = await res.json();
        if (window.TransitOpsAnimations) window.TransitOpsAnimations.showToast(err.detail || "Error creating ticket", "error");
      }
    } catch (e) {
      console.error("Error creating ticket:", e);
    }
  }

  function handleStatusChange(alertId, newStatus) {
    updateAlertStatus(alertId, newStatus);
  }

  function buildAlertsTable() {
    let html = `
      <div class="dash-panel stagger-card">
        <h3 class="panel-title">Vehicle Issue Alerts</h3>
        <p style="color: #9CA3AF; font-size: 14px; margin-bottom: 20px;">Manage issues reported by drivers and create maintenance tickets.</p>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Vehicle</th>
                <th>Reported By (Driver)</th>
                <th>Issue Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
    `;

    if (alerts.length === 0) {
      html += `<tr><td colspan="6" class="text-center text-muted" style="padding: 30px;">No alerts to display</td></tr>`;
    } else {
      const vehicles = window.DataLayer ? window.DataLayer.getVehicles() : [];
      const drivers = window.DataLayer ? window.DataLayer.getDrivers() : [];

      alerts.forEach(a => {
        const v = vehicles.find(v => v.id === a.vehicleId);
        const d = drivers.find(d => d.id === a.driverId);
        
        const vehicleName = v ? v.regNumber : 'Unknown Vehicle';
        const driverName = d ? d.name : 'Unknown Driver';

        let statusClass = 'badge--success';
        if (a.status === 'Open') statusClass = 'badge--warning';
        if (a.status === 'Ticket Created') statusClass = 'badge--primary';
        
        const safeMessage = window.escapeHtml(a.message).replace(/'/g, "\\'");

        html += `
          <tr>
            <td class="font-mono text-muted">#${String(a.id).padStart(4, '0')}</td>
            <td class="font-medium">${vehicleName}</td>
            <td>${driverName}</td>
            <td>${window.escapeHtml(a.message)}</td>
            <td><span class="badge ${statusClass}">${a.status}</span></td>
            <td>
              <div style="display: flex; gap: 8px; align-items: center;">
                <select class="form-input" style="padding: 4px 8px; font-size: 12px; height: auto;" onchange="window.TransitOpsAlerts.handleStatusChange(${a.id}, this.value)">
                  <option value="Open" ${a.status === 'Open' ? 'selected' : ''}>Open</option>
                  <option value="Resolved" ${a.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                  <option value="Ticket Created" ${a.status === 'Ticket Created' ? 'selected' : ''}>Ticket Created</option>
                </select>
                ${a.status !== 'Ticket Created' ? `<button class="btn btn--outline btn--sm" style="font-size: 12px; padding: 4px 8px; height: auto;" onclick="window.TransitOpsAlerts.createTicket(${a.id}, ${a.vehicleId}, '${safeMessage}')">Create Ticket</button>` : ''}
              </div>
            </td>
          </tr>
        `;
      });
    }

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;
    return html;
  }

  async function renderAlertsPage() {
    await fetchAlerts();

    const html = `
      <div class="dash-content-wrap">
        ${buildAlertsTable()}
      </div>
    `;

    if (window.Layout && window.Layout.setPageContent) {
      window.Layout.setPageContent(html);
    }
  }

  // Register public API for onclick handlers
  window.TransitOpsAlerts = {
    handleStatusChange,
    createTicket
  };

  // Register the module
  window.TransitOps = window.TransitOps || {};
  if (window.TransitOps.registerPage) {
    window.TransitOps.registerPage('alerts', renderAlertsPage);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      window.TransitOps.registerPage('alerts', renderAlertsPage);
    });
  }

})();
