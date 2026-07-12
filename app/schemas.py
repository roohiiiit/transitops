from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

# --- User ---
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "Fleet Manager"

class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Token ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Vehicle ---
class VehicleBase(BaseModel):
    regNumber: str
    name: Optional[str] = None
    type: str
    maxLoadKg: float
    odometer: float
    acquisitionCost: float
    status: str

class VehicleCreate(VehicleBase):
    pass

class VehicleResponse(VehicleBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# --- Driver ---
class DriverBase(BaseModel):
    name: str
    licenseNumber: str
    licenseCategory: str
    licenseExpiry: str # YYYY-MM-DD
    contactNumber: Optional[str] = None
    safetyScore: Optional[float] = 100.0
    status: str

class DriverCreate(DriverBase):
    pass

class DriverResponse(DriverBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# --- Trip ---
class TripBase(BaseModel):
    source: str
    destination: str
    vehicleId: Optional[int] = None
    driverId: Optional[int] = None
    cargoWeightKg: float
    plannedDistanceKm: float
    status: Optional[str] = "Draft"
    actualOdometer: Optional[float] = None
    fuelConsumed: Optional[float] = None
    current_lat: Optional[float] = None
    current_lon: Optional[float] = None

class TripLocationUpdate(BaseModel):
    lat: float
    lon: float

class TripCreate(TripBase):
    pass

class TripResponse(TripBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# --- Maintenance Log ---
class MaintenanceLogBase(BaseModel):
    vehicleId: int
    serviceType: str
    dateOpened: str
    dateClosed: Optional[str] = None
    cost: float
    notes: Optional[str] = None

class MaintenanceLogCreate(MaintenanceLogBase):
    pass

class MaintenanceLogResponse(MaintenanceLogBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# --- Fuel Log ---
class FuelLogBase(BaseModel):
    vehicleId: int
    date: str
    liters: float
    cost: float

class FuelLogCreate(FuelLogBase):
    pass

class FuelLogResponse(FuelLogBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# --- Expense ---
class ExpenseBase(BaseModel):
    vehicleId: int
    type: str
    date: str
    cost: float

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
