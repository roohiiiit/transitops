// ═══════════════════════════════════════════════════════════════════════════
// DATA LAYER — currently returns mock arrays. When backend is ready, replace
// each function body with a fetch() call to the matching API endpoint. UI
// code should not need to change since it only calls these functions, never
// the arrays directly.
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  let currentRole = null;

  // ────────────────────────────────────────────
  //  MOCK DATA — Vehicles
  // ────────────────────────────────────────────
  const mockVehicles = [
    { id: 'V001', regNumber: 'KA-01-AB-1234', name: 'Tata Ace Gold',       type: 'Mini Truck',   maxLoadKg: 750,   odometer: 48200,  acquisitionCost: 650000,  status: 'Available' },
    { id: 'V002', regNumber: 'KA-01-CD-5678', name: 'Ashok Leyland Dost',  type: 'LCV',          maxLoadKg: 1500,  odometer: 112400, acquisitionCost: 870000,  status: 'On Trip' },
    { id: 'V003', regNumber: 'KA-02-EF-9012', name: 'Eicher Pro 2049',     type: 'Medium Truck', maxLoadKg: 4900,  odometer: 234000, acquisitionCost: 1450000, status: 'Available' },
    { id: 'V004', regNumber: 'KA-03-GH-3456', name: 'BharatBenz 1217C',    type: 'Heavy Truck',  maxLoadKg: 9500,  odometer: 189600, acquisitionCost: 2350000, status: 'In Shop' },
    { id: 'V005', regNumber: 'KA-01-IJ-7890',  name: 'Mahindra Bolero Pickup', type: 'Pickup',   maxLoadKg: 1200,  odometer: 67800,  acquisitionCost: 920000,  status: 'Available' },
    { id: 'V006', regNumber: 'KA-04-KL-2345', name: 'Tata 407 Gold SFC',   type: 'LCV',          maxLoadKg: 2500,  odometer: 156300, acquisitionCost: 1120000, status: 'On Trip' },
    { id: 'V007', regNumber: 'KA-02-MN-6789', name: 'Eicher Pro 3015',     type: 'Heavy Truck',  maxLoadKg: 11000, odometer: 302100, acquisitionCost: 2800000, status: 'Available' },
    { id: 'V008', regNumber: 'KA-05-OP-1122', name: 'Ashok Leyland Ecomet',type: 'Medium Truck', maxLoadKg: 6200,  odometer: 98400,  acquisitionCost: 1780000, status: 'Retired' },
    { id: 'V009', regNumber: 'KA-01-QR-3344', name: 'Tata Intra V30',      type: 'Mini Truck',   maxLoadKg: 1100,  odometer: 31200,  acquisitionCost: 750000,  status: 'Available' },
    { id: 'V010', regNumber: 'KA-03-ST-5566', name: 'BharatBenz 1015R',    type: 'Medium Truck', maxLoadKg: 5500,  odometer: 145600, acquisitionCost: 1950000, status: 'On Trip' },
    { id: 'V011', regNumber: 'KA-06-UV-7788', name: 'Mahindra Furio 7',    type: 'LCV',          maxLoadKg: 3500,  odometer: 72900,  acquisitionCost: 1340000, status: 'Available' },
    { id: 'V012', regNumber: 'KA-02-WX-9900', name: 'Tata Ultra T.7',      type: 'LCV',          maxLoadKg: 2900,  odometer: 201500, acquisitionCost: 1280000, status: 'In Shop' },
  ];

  // ────────────────────────────────────────────
  //  MOCK DATA — Drivers
  // ────────────────────────────────────────────
  const mockDrivers = [
    { id: 'D001', name: 'Rajesh Kumar',      licenseNumber: 'KA0120210045678', licenseCategory: 'HTV',  licenseExpiry: '2027-03-15', contactNumber: '9876543210', safetyScore: 92, status: 'Available' },
    { id: 'D002', name: 'Suresh Patil',      licenseNumber: 'KA0320200098765', licenseCategory: 'HTV',  licenseExpiry: '2026-08-22', contactNumber: '9876543211', safetyScore: 87, status: 'On Trip' },
    { id: 'D003', name: 'Anil Sharma',       licenseNumber: 'KA0120190034521', licenseCategory: 'LMV',  licenseExpiry: '2026-07-25', contactNumber: '9876543212', safetyScore: 78, status: 'Available' },
    { id: 'D004', name: 'Vijay Reddy',       licenseNumber: 'KA0220210067890', licenseCategory: 'HTV',  licenseExpiry: '2028-01-10', contactNumber: '9876543213', safetyScore: 95, status: 'On Trip' },
    { id: 'D005', name: 'Manoj Singh',       licenseNumber: 'KA0420200011223', licenseCategory: 'HTV',  licenseExpiry: '2026-06-30', contactNumber: '9876543214', safetyScore: 65, status: 'Suspended' },
    { id: 'D006', name: 'Prakash Rao',       licenseNumber: 'KA0120220055667', licenseCategory: 'HGMV', licenseExpiry: '2029-05-18', contactNumber: '9876543215', safetyScore: 91, status: 'Available' },
    { id: 'D007', name: 'Dinesh Gowda',      licenseNumber: 'KA0520210078901', licenseCategory: 'LMV',  licenseExpiry: '2026-12-01', contactNumber: '9876543216', safetyScore: 83, status: 'Off Duty' },
    { id: 'D008', name: 'Karthik Nair',      licenseNumber: 'KA0620200023456', licenseCategory: 'HTV',  licenseExpiry: '2027-09-30', contactNumber: '9876543217', safetyScore: 89, status: 'On Trip' },
  ];

  // ────────────────────────────────────────────
  //  MOCK DATA — Trips
  // ────────────────────────────────────────────
  const mockTrips = [
    { id: 'T001', source: 'Bangalore',   destination: 'Chennai',    vehicleId: 'V002', driverId: 'D002', cargoWeightKg: 1200,  plannedDistanceKm: 350,  status: 'Dispatched', actualOdometer: null, fuelConsumed: null },
    { id: 'T002', source: 'Bangalore',   destination: 'Hyderabad',  vehicleId: 'V006', driverId: 'D004', cargoWeightKg: 2100,  plannedDistanceKm: 570,  status: 'Dispatched', actualOdometer: null, fuelConsumed: null },
    { id: 'T003', source: 'Mysore',      destination: 'Hubli',      vehicleId: 'V010', driverId: 'D008', cargoWeightKg: 4800,  plannedDistanceKm: 310,  status: 'Dispatched', actualOdometer: null, fuelConsumed: null },
    { id: 'T004', source: 'Mangalore',   destination: 'Bangalore',  vehicleId: 'V003', driverId: 'D001', cargoWeightKg: 4200,  plannedDistanceKm: 365,  status: 'Completed',  actualOdometer: 234365, fuelConsumed: 95 },
    { id: 'T005', source: 'Bangalore',   destination: 'Pune',       vehicleId: 'V007', driverId: 'D006', cargoWeightKg: 9500,  plannedDistanceKm: 840,  status: 'Completed',  actualOdometer: 302940, fuelConsumed: 220 },
    { id: 'T006', source: 'Hubli',       destination: 'Goa',        vehicleId: 'V005', driverId: 'D003', cargoWeightKg: 800,   plannedDistanceKm: 190,  status: 'Draft',      actualOdometer: null, fuelConsumed: null },
    { id: 'T007', source: 'Chennai',     destination: 'Coimbatore',  vehicleId: null,   driverId: null,   cargoWeightKg: 3200,  plannedDistanceKm: 510,  status: 'Draft',      actualOdometer: null, fuelConsumed: null },
    { id: 'T008', source: 'Bangalore',   destination: 'Mysore',     vehicleId: 'V009', driverId: 'D007', cargoWeightKg: 600,   plannedDistanceKm: 150,  status: 'Cancelled',  actualOdometer: null, fuelConsumed: null },
  ];

  // ────────────────────────────────────────────
  //  MOCK DATA — Maintenance Logs
  // ────────────────────────────────────────────
  const mockMaintenanceLogs = [
    { id: 'M001', vehicleId: 'V004', serviceType: 'Engine Overhaul',     dateOpened: '2026-06-20', dateClosed: null,          cost: 45000, notes: 'Major engine work — cylinder head replacement' },
    { id: 'M002', vehicleId: 'V012', serviceType: 'Brake Replacement',   dateOpened: '2026-07-01', dateClosed: null,          cost: 12000, notes: 'All four disc pads + rotor resurfacing' },
    { id: 'M003', vehicleId: 'V002', serviceType: 'Oil Change',          dateOpened: '2026-06-10', dateClosed: '2026-06-10',  cost: 3500,  notes: 'Routine 10,000 km service' },
    { id: 'M004', vehicleId: 'V007', serviceType: 'Tyre Rotation',       dateOpened: '2026-05-28', dateClosed: '2026-05-28',  cost: 2000,  notes: 'Rotated all 6 tyres, alignment check' },
    { id: 'M005', vehicleId: 'V003', serviceType: 'Clutch Replacement',  dateOpened: '2026-06-15', dateClosed: '2026-06-18',  cost: 18000, notes: 'Clutch plate + pressure plate replaced' },
    { id: 'M006', vehicleId: 'V010', serviceType: 'AC Repair',           dateOpened: '2026-07-05', dateClosed: '2026-07-06',  cost: 8500,  notes: 'Compressor replaced, gas recharged' },
  ];

  // ────────────────────────────────────────────
  //  MOCK DATA — Fuel Logs
  // ────────────────────────────────────────────
  const mockFuelLogs = [
    { id: 'F001', vehicleId: 'V002', date: '2026-07-10', liters: 45,  cost: 4725 },
    { id: 'F002', vehicleId: 'V003', date: '2026-07-09', liters: 80,  cost: 8400 },
    { id: 'F003', vehicleId: 'V006', date: '2026-07-10', liters: 55,  cost: 5775 },
    { id: 'F004', vehicleId: 'V007', date: '2026-07-08', liters: 120, cost: 12600 },
    { id: 'F005', vehicleId: 'V010', date: '2026-07-11', liters: 70,  cost: 7350 },
    { id: 'F006', vehicleId: 'V005', date: '2026-07-07', liters: 40,  cost: 4200 },
    { id: 'F007', vehicleId: 'V001', date: '2026-07-06', liters: 30,  cost: 3150 },
    { id: 'F008', vehicleId: 'V009', date: '2026-07-10', liters: 35,  cost: 3675 },
    { id: 'F009', vehicleId: 'V002', date: '2026-07-05', liters: 48,  cost: 5040 },
    { id: 'F010', vehicleId: 'V011', date: '2026-07-09', liters: 50,  cost: 5250 },
  ];

  // ────────────────────────────────────────────
  //  MOCK DATA — Other Expenses
  // ────────────────────────────────────────────
  const mockExpenses = [
    { id: 'E001', vehicleId: 'V002', type: 'Toll',       date: '2026-07-10', cost: 1200 },
    { id: 'E002', vehicleId: 'V006', type: 'Toll',       date: '2026-07-10', cost: 2400 },
    { id: 'E003', vehicleId: 'V003', type: 'Parking',    date: '2026-07-09', cost: 500 },
    { id: 'E004', vehicleId: 'V007', type: 'Toll',       date: '2026-07-08', cost: 3600 },
    { id: 'E005', vehicleId: 'V010', type: 'Toll',       date: '2026-07-11', cost: 1800 },
    { id: 'E006', vehicleId: 'V005', type: 'Insurance',  date: '2026-07-01', cost: 15000 },
    { id: 'E007', vehicleId: 'V001', type: 'Permit',     date: '2026-07-03', cost: 4500 },
    { id: 'E008', vehicleId: 'V004', type: 'Insurance',  date: '2026-06-25', cost: 28000 },
  ];


  // ════════════════════════════════════════════
  //  ACCESSOR FUNCTIONS — Vehicles
  // ════════════════════════════════════════════

  function getVehicles() {
    return [...mockVehicles];
  }

  function getVehicleById(id) {
    return mockVehicles.find(v => v.id === id) || null;
  }

  function addVehicle(data) {
    const id = 'V' + String(mockVehicles.length + 1).padStart(3, '0');
    const vehicle = { id, ...data };
    mockVehicles.push(vehicle);
    return vehicle;
  }

  function updateVehicle(id, updates) {
    const vehicle = mockVehicles.find(v => v.id === id);
    if (!vehicle) return null;
    Object.assign(vehicle, updates);
    return vehicle;
  }

  function updateVehicleStatus(id, newStatus) {
    return updateVehicle(id, { status: newStatus });
  }


  // ════════════════════════════════════════════
  //  ACCESSOR FUNCTIONS — Drivers
  // ════════════════════════════════════════════

  function getDrivers() {
    return [...mockDrivers];
  }

  function getDriverById(id) {
    return mockDrivers.find(d => d.id === id) || null;
  }

  function addDriver(data) {
    const id = 'D' + String(mockDrivers.length + 1).padStart(3, '0');
    const driver = { id, ...data };
    mockDrivers.push(driver);
    return driver;
  }

  function updateDriver(id, updates) {
    const driver = mockDrivers.find(d => d.id === id);
    if (!driver) return null;
    Object.assign(driver, updates);
    return driver;
  }

  function updateDriverStatus(id, newStatus) {
    return updateDriver(id, { status: newStatus });
  }

  /** Check if a driver's license is expiring within N days */
  function isLicenseExpiringSoon(driver, withinDays) {
    if (!driver.licenseExpiry) return false;
    const days = withinDays || 30;
    const expiry = new Date(driver.licenseExpiry);
    const now = new Date();
    const diff = (expiry - now) / (1000 * 60 * 60 * 24);
    return diff <= days;
  }

  /** Check if a driver's license has already expired */
  function isLicenseExpired(driver) {
    if (!driver.licenseExpiry) return false;
    return new Date(driver.licenseExpiry) < new Date();
  }


  // ════════════════════════════════════════════
  //  ACCESSOR FUNCTIONS — Trips
  // ════════════════════════════════════════════

  function getTrips() {
    return [...mockTrips];
  }

  function getTripById(id) {
    return mockTrips.find(t => t.id === id) || null;
  }

  function getTripsByStatus(status) {
    return mockTrips.filter(t => t.status === status);
  }

  function addTrip(data) {
    const id = 'T' + String(mockTrips.length + 1).padStart(3, '0');
    const trip = { id, actualOdometer: null, fuelConsumed: null, ...data };
    mockTrips.push(trip);
    return trip;
  }

  function updateTrip(id, updates) {
    const trip = mockTrips.find(t => t.id === id);
    if (!trip) return null;
    Object.assign(trip, updates);
    return trip;
  }

  function updateTripStatus(id, newStatus) {
    return updateTrip(id, { status: newStatus });
  }


  // ════════════════════════════════════════════
  //  ACCESSOR FUNCTIONS — Maintenance Logs
  // ════════════════════════════════════════════

  function getMaintenanceLogs() {
    return [...mockMaintenanceLogs];
  }

  function getMaintenanceLogById(id) {
    return mockMaintenanceLogs.find(m => m.id === id) || null;
  }

  function getMaintenanceByVehicle(vehicleId) {
    return mockMaintenanceLogs.filter(m => m.vehicleId === vehicleId);
  }

  function addMaintenanceLog(data) {
    const id = 'M' + String(mockMaintenanceLogs.length + 1).padStart(3, '0');
    const log = { id, dateClosed: null, ...data };
    mockMaintenanceLogs.push(log);
    return log;
  }

  function updateMaintenanceLog(id, updates) {
    const log = mockMaintenanceLogs.find(m => m.id === id);
    if (!log) return null;
    Object.assign(log, updates);
    return log;
  }


  // ════════════════════════════════════════════
  //  ACCESSOR FUNCTIONS — Fuel Logs
  // ════════════════════════════════════════════

  function getFuelLogs() {
    return [...mockFuelLogs];
  }

  function getFuelByVehicle(vehicleId) {
    return mockFuelLogs.filter(f => f.vehicleId === vehicleId);
  }

  function addFuelLog(data) {
    const id = 'F' + String(mockFuelLogs.length + 1).padStart(3, '0');
    const log = { id, ...data };
    mockFuelLogs.push(log);
    return log;
  }


  // ════════════════════════════════════════════
  //  ACCESSOR FUNCTIONS — Other Expenses
  // ════════════════════════════════════════════

  function getExpenses() {
    return [...mockExpenses];
  }

  function getExpensesByVehicle(vehicleId) {
    return mockExpenses.filter(e => e.vehicleId === vehicleId);
  }

  function addExpense(data) {
    const id = 'E' + String(mockExpenses.length + 1).padStart(3, '0');
    const expense = { id, ...data };
    mockExpenses.push(expense);
    return expense;
  }


  // ════════════════════════════════════════════
  //  COMPUTED / AGGREGATE HELPERS
  // ════════════════════════════════════════════

  /** Total fuel cost for a vehicle */
  function getTotalFuelCost(vehicleId) {
    return getFuelByVehicle(vehicleId).reduce((sum, f) => sum + f.cost, 0);
  }

  /** Total maintenance cost for a vehicle */
  function getTotalMaintenanceCost(vehicleId) {
    return getMaintenanceByVehicle(vehicleId).reduce((sum, m) => sum + m.cost, 0);
  }

  /** Total other expenses for a vehicle */
  function getTotalExpenses(vehicleId) {
    return getExpensesByVehicle(vehicleId).reduce((sum, e) => sum + e.cost, 0);
  }

  /** Operational cost = fuel + maintenance + expenses */
  function getOperationalCost(vehicleId) {
    return getTotalFuelCost(vehicleId) + getTotalMaintenanceCost(vehicleId) + getTotalExpenses(vehicleId);
  }

  /** Next available IDs (useful for forms) */
  function getNextId(prefix, arr) {
    return prefix + String(arr.length + 1).padStart(3, '0');
  }


  // ════════════════════════════════════════════
  //  PUBLIC API
  // ════════════════════════════════════════════

  window.DataLayer = {
    // Auth Role
    getCurrentRole: () => currentRole,
    setCurrentRole: (role) => { currentRole = role; },

    // Vehicles
    getVehicles,
    getVehicleById,
    addVehicle,
    updateVehicle,
    updateVehicleStatus,

    // Drivers
    getDrivers,
    getDriverById,
    addDriver,
    updateDriver,
    updateDriverStatus,
    isLicenseExpiringSoon,
    isLicenseExpired,

    // Trips
    getTrips,
    getTripById,
    getTripsByStatus,
    addTrip,
    updateTrip,
    updateTripStatus,

    // Maintenance
    getMaintenanceLogs,
    getMaintenanceLogById,
    getMaintenanceByVehicle,
    addMaintenanceLog,
    updateMaintenanceLog,

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
  };

})();
