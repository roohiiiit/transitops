from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="Fleet Manager") # Fleet Manager, Driver, Safety Officer, Financial Analyst
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    regNumber = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    type = Column(String, nullable=False) # LCV, HCV, Van, etc.
    maxLoadKg = Column(Float, nullable=False)
    odometer = Column(Float, nullable=False, default=0.0)
    acquisitionCost = Column(Float, nullable=False, default=0.0)
    status = Column(String, nullable=False, default="Available") # Available, On Trip, In Shop, Retired

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    licenseNumber = Column(String, unique=True, index=True, nullable=False)
    licenseCategory = Column(String, nullable=False)
    licenseExpiry = Column(String, nullable=False) # YYYY-MM-DD
    contactNumber = Column(String)
    safetyScore = Column(Float, default=100.0)
    status = Column(String, nullable=False, default="Available") # Available, On Trip, Off Duty, Suspended

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    vehicleId = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    driverId = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    cargoWeightKg = Column(Float, nullable=False)
    plannedDistanceKm = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="Draft") # Draft, Dispatched, Completed, Cancelled
    actualOdometer = Column(Float, nullable=True)
    fuelConsumed = Column(Float, nullable=True)

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicleId = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    serviceType = Column(String, nullable=False)
    dateOpened = Column(String, nullable=False) # YYYY-MM-DD
    dateClosed = Column(String, nullable=True) # YYYY-MM-DD
    cost = Column(Float, nullable=False, default=0.0)
    notes = Column(String)

class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicleId = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    date = Column(String, nullable=False) # YYYY-MM-DD
    liters = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    vehicleId = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    type = Column(String, nullable=False) # Toll, Insurance, Permit, Parking, Other
    date = Column(String, nullable=False) # YYYY-MM-DD
    cost = Column(Float, nullable=False)
