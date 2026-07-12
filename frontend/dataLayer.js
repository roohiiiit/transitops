/* ═══════════════════════════════════════════════════════════
   TransitOps — Unified Data Layer
   Manages client-side state synchronized with backend APIs
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:8000' : window.location.origin;

  // ── Client Cache (Synchronized on load & mutations) ──
  let mockVehicles = [];
  let mockDrivers = [];
  let mockTrips = [];
  let mockMaintenanceLogs = [];
  let mockFuelLogs = [];
  let mockExpenses = [];
  let mockReports = [
    { id: 'R001', name: 'Vehicle Registry — 10 Jul 2026', sourceSection: 'Vehicles', format: 'CSV', generatedAt: '2026-07-10T09:30:00Z', rowCount: 12 },
    { id: 'R002', name: 'Maintenance Logs — 11 Jul 2026', sourceSection: 'Maintenance', format: 'PDF', generatedAt: '2026-07-11T14:15:00Z', rowCount: 6 },
  ];
  let currentRole = localStorage.getItem('transitops_role') || 'Fleet Manager';

  // Helper to get authorization headers
  function getHeaders() {
    const token = localStorage.getItem('transitops_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Helper to handle API response and throw errors from backend validation
  async function handleResponse(res) {
    const data = await res.json();
    if (!res.ok) {
      const err = data.detail || 'An error occurred';
      throw new Error(err);
    }
    return data;
  }

  // ── Sync From Backend ──
  async function syncFromBackend() {
    if (!localStorage.getItem('transitops_token')) return;

    try {
      const headers = getHeaders();
      const [v, d, t, m, f, e] = await Promise.all([
        fetch(`${API_URL}/vehicles`, { headers }).then(handleResponse),
        fetch(`${API_URL}/drivers`, { headers }).then(handleResponse),
        fetch(`${API_URL}/trips`, { headers }).then(handleResponse),
        fetch(`${API_URL}/maintenance`, { headers }).then(handleResponse),
        fetch(`${API_URL}/fuel`, { headers }).then(handleResponse),
        fetch(`${API_URL}/expenses`, { headers }).then(handleResponse)
      ]);

      mockVehicles = v;
      mockDrivers = d;
      mockTrips = t;
      mockMaintenanceLogs = m;
      mockFuelLogs = f;
      mockExpenses = e;
    } catch (err) {
      console.error('Failed to sync backend state:', err);
    }
  }


  // ── Accessors — Vehicles ──
  function getVehicles() {
    return [...mockVehicles];
  }

  function getVehicleById(id) {
    id = Number(id);
    return mockVehicles.find(v => v.id === id) || null;
  }

  async function addVehicle(data) {
    const res = await fetch(`${API_URL}/vehicles`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const vehicle = await handleResponse(res);
    mockVehicles.push(vehicle);
    return vehicle;
  }

  async function updateVehicle(id, updates) {
    id = Number(id);
    const existing = getVehicleById(id);
    const merged = { ...existing, ...updates };
    const res = await fetch(`${API_URL}/vehicles/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(merged)
    });
    const vehicle = await handleResponse(res);
    const idx = mockVehicles.findIndex(v => v.id === id);
    if (idx !== -1) mockVehicles[idx] = vehicle;
    return vehicle;
  }

  async function updateVehicleStatus(id, newStatus) {
    return updateVehicle(id, { status: newStatus });
  }

  async function deleteVehicle(id) {
    id = Number(id);
    const res = await fetch(`${API_URL}/vehicles/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || 'Failed to delete vehicle');
    }
    mockVehicles = mockVehicles.filter(v => v.id !== id);
  }


  // ── Accessors — Drivers ──
  function getDrivers() {
    return [...mockDrivers];
  }

  function getDriverById(id) {
    id = Number(id);
    return mockDrivers.find(d => d.id === id) || null;
  }

  async function addDriver(data) {
    const res = await fetch(`${API_URL}/drivers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const driver = await handleResponse(res);
    mockDrivers.push(driver);
    return driver;
  }

  async function updateDriver(id, updates) {
    id = Number(id);
    const existing = getDriverById(id);
    const merged = { ...existing, ...updates };
    const res = await fetch(`${API_URL}/drivers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(merged)
    });
    const driver = await handleResponse(res);
    const idx = mockDrivers.findIndex(d => d.id === id);
    if (idx !== -1) mockDrivers[idx] = driver;
    return driver;
  }

  async function updateDriverStatus(id, newStatus) {
    return updateDriver(id, { status: newStatus });
  }

  async function deleteDriver(id) {
    id = Number(id);
    const res = await fetch(`${API_URL}/drivers/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || 'Failed to delete driver');
    }
    mockDrivers = mockDrivers.filter(d => d.id !== id);
  }

  function isLicenseExpiringSoon(driver, withinDays) {
    if (!driver.licenseExpiry) return false;
    const days = withinDays || 30;
    const expiry = new Date(driver.licenseExpiry);
    const now = new Date();
    const diff = (expiry - now) / (1000 * 60 * 60 * 24);
    return diff <= days;
  }

  function isLicenseExpired(driver) {
    if (!driver.licenseExpiry) return false;
    return new Date(driver.licenseExpiry) < new Date();
  }


  // ── Accessors — Trips ──
  function getTrips() {
    return [...mockTrips];
  }

  function getTripById(id) {
    id = Number(id);
    return mockTrips.find(t => t.id === id) || null;
  }

  function getTripsByStatus(status) {
    return mockTrips.filter(t => t.status === status);
  }

  async function addTrip(data) {
    const res = await fetch(`${API_URL}/trips`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const trip = await handleResponse(res);
    mockTrips.push(trip);
    return trip;
  }

  async function dispatchTrip(id) {
    id = Number(id);
    const res = await fetch(`${API_URL}/trips/${id}/dispatch`, {
      method: 'POST',
      headers: getHeaders()
    });
    const trip = await handleResponse(res);
    const idx = mockTrips.findIndex(t => t.id === id);
    if (idx !== -1) mockTrips[idx] = trip;
    await syncFromBackend(); // Sync vehicle and driver statuses
    return trip;
  }

  async function completeTrip(id, actualOdometer, fuelConsumed) {
    id = Number(id);
    const res = await fetch(`${API_URL}/trips/${id}/complete?actualOdometer=${actualOdometer}&fuelConsumed=${fuelConsumed}`, {
      method: 'POST',
      headers: getHeaders()
    });
    const trip = await handleResponse(res);
    const idx = mockTrips.findIndex(t => t.id === id);
    if (idx !== -1) mockTrips[idx] = trip;
    await syncFromBackend(); // Sync vehicle/driver statuses and fuel logs
    return trip;
  }

  async function cancelTrip(id) {
    id = Number(id);
    const res = await fetch(`${API_URL}/trips/${id}/cancel`, {
      method: 'POST',
      headers: getHeaders()
    });
    const trip = await handleResponse(res);
    const idx = mockTrips.findIndex(t => t.id === id);
    if (idx !== -1) mockTrips[idx] = trip;
    await syncFromBackend(); // Sync vehicle and driver statuses
    return trip;
  }


  // ── Accessors — Maintenance ──
  function getMaintenanceLogs() {
    return [...mockMaintenanceLogs];
  }

  function getMaintenanceLogById(id) {
    id = Number(id);
    return mockMaintenanceLogs.find(m => m.id === id) || null;
  }

  function getMaintenanceByVehicle(vehicleId) {
    vehicleId = Number(vehicleId);
    return mockMaintenanceLogs.filter(m => m.vehicleId === vehicleId);
  }

  async function addMaintenanceLog(data) {
    const res = await fetch(`${API_URL}/maintenance`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const log = await handleResponse(res);
    mockMaintenanceLogs.push(log);
    await syncFromBackend(); // Sync vehicle status
    return log;
  }

  async function closeMaintenanceLog(id, dateClosed, cost, notes) {
    id = Number(id);
    const url = `${API_URL}/maintenance/${id}/close?dateClosed=${dateClosed}&cost=${cost}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: getHeaders()
    });
    const log = await handleResponse(res);
    const idx = mockMaintenanceLogs.findIndex(m => m.id === id);
    if (idx !== -1) mockMaintenanceLogs[idx] = log;
    await syncFromBackend(); // Sync vehicle status
    return log;
  }


  // ── Accessors — Fuel Logs ──
  function getFuelLogs() {
    return [...mockFuelLogs];
  }

  function getFuelByVehicle(vehicleId) {
    vehicleId = Number(vehicleId);
    return mockFuelLogs.filter(f => f.vehicleId === vehicleId);
  }

  async function addFuelLog(data) {
    const res = await fetch(`${API_URL}/fuel`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const log = await handleResponse(res);
    mockFuelLogs.push(log);
    return log;
  }


  // ── Accessors — Other Expenses ──
  function getExpenses() {
    return [...mockExpenses];
  }

  function getExpensesByVehicle(vehicleId) {
    vehicleId = Number(vehicleId);
    return mockExpenses.filter(e => e.vehicleId === vehicleId);
  }

  async function addExpense(data) {
    const res = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const expense = await handleResponse(res);
    mockExpenses.push(expense);
    return expense;
  }


  // ── Computed / Aggregates ──
  function getTotalFuelCost(vehicleId) {
    return getFuelByVehicle(vehicleId).reduce((sum, f) => sum + f.cost, 0);
  }

  function getTotalMaintenanceCost(vehicleId) {
    return getMaintenanceByVehicle(vehicleId).reduce((sum, m) => sum + m.cost, 0);
  }

  function getTotalExpenses(vehicleId) {
    return getExpensesByVehicle(vehicleId).reduce((sum, e) => sum + e.cost, 0);
  }

  function getOperationalCost(vehicleId) {
    return getTotalFuelCost(vehicleId) + getTotalMaintenanceCost(vehicleId) + getTotalExpenses(vehicleId);
  }

  // ── Reports and Analytics Helpers ──
  function getReports() {
    return [...mockReports];
  }

  function getMockRevenuePerVehicle(vehicleId) {
    // Mocking revenue as 1500 per 10km of odometer reading for demonstration
    const v = getVehicleById(vehicleId);
    if (!v) return 0;
    return (v.odometer / 10) * 1500;
  }

  function generateReport(sourceSection, format, data, isRedownload = false) {
    if (!data || data.length === 0) return false;

    const todayDateString = new Date().toISOString().split('T')[0];

    if (format === 'CSV') {
      const headers = Object.keys(data[0]);
      const csvRows = [];
      csvRows.push(headers.join(','));
      for (const row of data) {
        const values = headers.map(header => {
          let val = '' + (row[header] || '');
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        });
        csvRows.push(values.join(','));
      }
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${sourceSection}-${todayDateString}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (format === 'PDF') {
      if (window.jspdf && window.jspdf.jsPDF) {
        const doc = new window.jspdf.jsPDF();
        if (typeof doc.autoTable !== 'function') {
          console.error('jsPDF-autotable plugin not attached to jsPDF prototype.');
          return false;
        }
        const headers = Object.keys(data[0]);
        const rows = data.map(obj => headers.map(h => '' + (obj[h] || '')));
        doc.setFontSize(18);
        doc.text(`TransitOps — ${sourceSection} Report`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.autoTable({
          head: [headers],
          body: rows,
          startY: 36,
          theme: 'grid',
          headStyles: { fillColor: [212, 255, 63], textColor: [10, 10, 12] }
        });
        doc.save(`${sourceSection}-${todayDateString}.pdf`);
      } else {
        console.error('jsPDF not loaded');
        return false;
      }
    }

    if (!isRedownload) {
      const reportId = 'R' + String(mockReports.length + 1).padStart(3, '0');
      const now = new Date().toISOString();
      const formattedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      mockReports.push({
        id: reportId,
        name: `${sourceSection} — ${formattedDate}`,
        sourceSection,
        format,
        generatedAt: now,
        rowCount: data.length,
        data: data
      });
    }
    return true;
  }

  const _metricsCache = {};

  // ── Public API ──
  window.DataLayer = {
    // Metric Caching
    getPreviousMetric: (id) => _metricsCache[id],
    setPreviousMetric: (id, val) => { _metricsCache[id] = val; },

    // Sync
    syncFromBackend,

    // Auth Role
    getCurrentRole: () => currentRole,
    setCurrentRole: (role) => {
      currentRole = role;
      localStorage.setItem('transitops_role', role);
    },

    // Vehicles
    getVehicles,
    getVehicleById,
    addVehicle,
    updateVehicle,
    updateVehicleStatus,
    deleteVehicle,

    // Drivers
    getDrivers,
    getDriverById,
    addDriver,
    updateDriver,
    updateDriverStatus,
    deleteDriver,
    isLicenseExpiringSoon,
    isLicenseExpired,

    // Trips
    getTrips,
    getTripById,
    getTripsByStatus,
    addTrip,
    dispatchTrip,
    completeTrip,
    cancelTrip,

    // Maintenance
    getMaintenanceLogs,
    getMaintenanceLogById,
    getMaintenanceByVehicle,
    addMaintenanceLog,
    closeMaintenanceLog,

    // Fuel
    getFuelLogs,
    getFuelByVehicle,
    addFuelLog,

    // Expenses
    getExpenses,
    getExpensesByVehicle,
    addExpense,

    // Aggregates
    getTotalFuelCost,
    getTotalMaintenanceCost,
    getTotalExpenses,
    getOperationalCost,

    // Reports
    getReports,
    getMockRevenuePerVehicle,
    generateReport,
  };

})();
