import os
from datetime import datetime, date
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import jwt

from app.database import Base, engine, get_db, SessionLocal
from app.models import User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense
from app.schemas import (
    UserCreate, UserResponse, Token, TokenData,
    VehicleCreate, VehicleResponse,
    DriverCreate, DriverResponse,
    TripCreate, TripResponse, TripLocationUpdate,
    MaintenanceLogCreate, MaintenanceLogResponse,
    FuelLogCreate, FuelLogResponse,
    ExpenseCreate, ExpenseResponse
)
from app.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    SECRET_KEY,
    ALGORITHM
)

# Automatically create database tables (SQLite)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TransitOps Platform API",
    description="Secure, unified API with business rules validation for TransitOps",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Seeding ---
def seed_database(db: Session):
    if db.query(User).first() is not None:
        return

    # Create users with role
    roles = ["Fleet Manager", "Driver", "Safety Officer", "Financial Analyst"]
    emails = ["manager@transitops.com", "driver@transitops.com", "safety@transitops.com", "analyst@transitops.com"]
    for email, role in zip(emails, roles):
        db.add(User(
            email=email,
            hashed_password=get_password_hash("password123"),
            role=role
        ))
    
    # Create vehicles
    mock_vehicles = [
        {"regNumber": "KA-01-AB-1234", "name": "Tata Ace Gold", "type": "Mini Truck", "maxLoadKg": 850.0, "odometer": 42000.0, "acquisitionCost": 450000.0, "status": "Available"},
        {"regNumber": "KA-03-CD-5678", "name": "Ashok Leyland Dost", "type": "Pickup", "maxLoadKg": 1500.0, "odometer": 68500.0, "acquisitionCost": 720000.0, "status": "On Trip"},
        {"regNumber": "KA-05-EF-9012", "name": "Mahindra Bolero PikUp", "type": "Pickup", "maxLoadKg": 1700.0, "odometer": 112000.0, "acquisitionCost": 880000.0, "status": "Available"},
        {"regNumber": "KA-04-GH-3456", "name": "Eicher Pro 2049", "type": "HCV", "maxLoadKg": 3500.0, "odometer": 95000.0, "acquisitionCost": 1250000.0, "status": "In Shop"},
        {"regNumber": "KA-02-JK-7890", "name": "Tata T.16 Ultra", "type": "HCV", "maxLoadKg": 10000.0, "odometer": 182000.0, "acquisitionCost": 2800000.0, "status": "Available"},
        {"regNumber": "KA-01-LM-4321", "name": "BharatBenz 1917R", "type": "HCV", "maxLoadKg": 12000.0, "odometer": 54000.0, "acquisitionCost": 3200000.0, "status": "On Trip"},
        {"regNumber": "KA-03-NP-8765", "name": "Tata Winger Cargo", "type": "Van", "maxLoadKg": 1200.0, "odometer": 35000.0, "acquisitionCost": 980000.0, "status": "Available"},
        {"regNumber": "KA-05-PQ-2468", "name": "Maruti Suzuki Super Carry", "type": "Mini Truck", "maxLoadKg": 740.0, "odometer": 28000.0, "acquisitionCost": 410000.0, "status": "Available"},
        {"regNumber": "KA-04-RS-1357", "name": "Mahindra Supro Van", "type": "Van", "maxLoadKg": 600.0, "odometer": 49000.0, "acquisitionCost": 580000.0, "status": "Available"},
        {"regNumber": "KA-02-TV-9876", "name": "Force Traveller Cargo", "type": "Van", "maxLoadKg": 2000.0, "odometer": 124000.0, "acquisitionCost": 1450000.0, "status": "Available"},
        {"regNumber": "KA-06-UV-7788", "name": "Mahindra Furio 7", "type": "LCV", "maxLoadKg": 3500.0, "odometer": 72900.0, "acquisitionCost": 1340000.0, "status": "Available"},
        {"regNumber": "KA-02-WX-9900", "name": "Tata Ultra T.7", "type": "LCV", "maxLoadKg": 2900.0, "odometer": 201500.0, "acquisitionCost": 1280000.0, "status": "In Shop"}
    ]
    for v in mock_vehicles:
        db.add(Vehicle(**v))
    
    # Create drivers
    mock_drivers = [
        {"name": "Rajesh Kumar", "licenseNumber": "KA0120210045678", "licenseCategory": "HTV", "licenseExpiry": "2027-03-15", "contactNumber": "9876543210", "safetyScore": 92, "status": "Available"},
        {"name": "Suresh Patil", "licenseNumber": "KA0320200098765", "licenseCategory": "HTV", "licenseExpiry": "2026-08-22", "contactNumber": "9876543211", "safetyScore": 87, "status": "On Trip"},
        {"name": "Anil Sharma", "licenseNumber": "KA0120190034521", "licenseCategory": "LMV", "licenseExpiry": "2026-07-25", "contactNumber": "9876543212", "safetyScore": 78, "status": "Available"},
        {"name": "Vijay Reddy", "licenseNumber": "KA0220210067890", "licenseCategory": "HTV", "licenseExpiry": "2028-01-10", "contactNumber": "9876543213", "safetyScore": 95, "status": "On Trip"},
        {"name": "Manoj Singh", "licenseNumber": "KA0420200011223", "licenseCategory": "HTV", "licenseExpiry": "2026-06-30", "contactNumber": "9876543214", "safetyScore": 65, "status": "Suspended"},
        {"name": "Prakash Rao", "licenseNumber": "KA0120220055667", "licenseCategory": "HGMV", "licenseExpiry": "2029-05-18", "contactNumber": "9876543215", "safetyScore": 91, "status": "Available"},
        {"name": "Dinesh Gowda", "licenseNumber": "KA0520210078901", "licenseCategory": "LMV", "licenseExpiry": "2026-12-01", "contactNumber": "9876543216", "safetyScore": 83, "status": "Off Duty"},
        {"name": "Karthik Nair", "licenseNumber": "KA0620200023456", "licenseCategory": "HTV", "licenseExpiry": "2027-09-30", "contactNumber": "9876543217", "safetyScore": 89, "status": "On Trip"}
    ]
    for d in mock_drivers:
        db.add(Driver(**d))

    db.commit()

    v_map = {v.regNumber: v.id for v in db.query(Vehicle).all()}
    d_map = {d.licenseNumber: d.id for d in db.query(Driver).all()}

    # Create trips
    mock_trips = [
        {"source": "Bangalore", "destination": "Chennai", "vehicleId": v_map["KA-03-CD-5678"], "driverId": d_map["KA0320200098765"], "cargoWeightKg": 1200, "plannedDistanceKm": 350, "status": "Dispatched"},
        {"source": "Bangalore", "destination": "Hyderabad", "vehicleId": v_map["KA-01-LM-4321"], "driverId": d_map["KA0220210067890"], "cargoWeightKg": 2100, "plannedDistanceKm": 570, "status": "Dispatched"},
        {"source": "Mysore", "destination": "Hubli", "vehicleId": v_map["KA-02-JK-7890"], "driverId": d_map["KA0620200023456"], "cargoWeightKg": 4800, "plannedDistanceKm": 310, "status": "Dispatched"},
        {"source": "Mangalore", "destination": "Bangalore", "vehicleId": v_map["KA-05-EF-9012"], "driverId": d_map["KA0120210045678"], "cargoWeightKg": 4200, "plannedDistanceKm": 365, "status": "Completed", "actualOdometer": 112365.0, "fuelConsumed": 95.0},
        {"source": "Bangalore", "destination": "Pune", "vehicleId": v_map["KA-03-NP-8765"], "driverId": d_map["KA0120220055667"], "cargoWeightKg": 950, "plannedDistanceKm": 840, "status": "Completed", "actualOdometer": 35840.0, "fuelConsumed": 220.0},
        {"source": "Hubli", "destination": "Goa", "vehicleId": v_map["KA-05-PQ-2468"], "driverId": d_map["KA0120190034521"], "cargoWeightKg": 800, "plannedDistanceKm": 190, "status": "Draft"},
        {"source": "Chennai", "destination": "Coimbatore", "vehicleId": None, "driverId": None, "cargoWeightKg": 3200, "plannedDistanceKm": 510, "status": "Draft"},
        {"source": "Bangalore", "destination": "Mysore", "vehicleId": v_map["KA-04-RS-1357"], "driverId": d_map["KA0520210078901"], "cargoWeightKg": 600, "plannedDistanceKm": 150, "status": "Cancelled"}
    ]
    for t in mock_trips:
        db.add(Trip(**t))

    # Create maintenance logs
    mock_maintenance = [
        {"vehicleId": v_map["KA-04-GH-3456"], "serviceType": "Engine Overhaul", "dateOpened": "2026-06-20", "dateClosed": None, "cost": 45000.0, "notes": "Major engine work — cylinder head replacement"},
        {"vehicleId": v_map["KA-02-WX-9900"], "serviceType": "Brake Replacement", "dateOpened": "2026-07-01", "dateClosed": None, "cost": 12000.0, "notes": "All four disc pads + rotor resurfacing"},
        {"vehicleId": v_map["KA-03-CD-5678"], "serviceType": "Oil Change", "dateOpened": "2026-06-10", "dateClosed": "2026-06-10", "cost": 3500.0, "notes": "Routine 10,000 km service"},
        {"vehicleId": v_map["KA-03-NP-8765"], "serviceType": "Tyre Rotation", "dateOpened": "2026-05-28", "dateClosed": "2026-05-28", "cost": 2000.0, "notes": "Rotated all 6 tyres, alignment check"},
        {"vehicleId": v_map["KA-05-EF-9012"], "serviceType": "Clutch Replacement", "dateOpened": "2026-06-15", "dateClosed": "2026-06-18", "cost": 18000.0, "notes": "Clutch plate + pressure plate replaced"},
        {"vehicleId": v_map["KA-02-JK-7890"], "serviceType": "AC Repair", "dateOpened": "2026-07-05", "dateClosed": "2026-07-06", "cost": 8500.0, "notes": "Compressor replaced, gas recharged"}
    ]
    for m in mock_maintenance:
        db.add(MaintenanceLog(**m))

    # Create fuel logs
    mock_fuel = [
        {"vehicleId": v_map["KA-03-CD-5678"], "date": "2026-07-10", "liters": 45.0, "cost": 4725.0},
        {"vehicleId": v_map["KA-05-EF-9012"], "date": "2026-07-09", "liters": 80.0, "cost": 8400.0},
        {"vehicleId": v_map["KA-01-LM-4321"], "date": "2026-07-10", "liters": 55.0, "cost": 5775.0},
        {"vehicleId": v_map["KA-03-NP-8765"], "date": "2026-07-08", "liters": 120.0, "cost": 12600.0},
        {"vehicleId": v_map["KA-02-JK-7890"], "date": "2026-07-11", "liters": 70.0, "cost": 7350.0},
        {"vehicleId": v_map["KA-01-AB-1234"], "date": "2026-07-07", "liters": 40.0, "cost": 4200.0},
        {"vehicleId": v_map["KA-05-PQ-2468"], "date": "2026-07-06", "liters": 30.0, "cost": 3150.0},
        {"vehicleId": v_map["KA-04-RS-1357"], "date": "2026-07-10", "liters": 35.0, "cost": 3675.0},
        {"vehicleId": v_map["KA-03-CD-5678"], "date": "2026-07-05", "liters": 48.0, "cost": 5040.0},
        {"vehicleId": v_map["KA-06-UV-7788"], "date": "2026-07-09", "liters": 50.0, "cost": 5250.0}
    ]
    for f in mock_fuel:
        db.add(FuelLog(**f))

    # Create expenses
    mock_expenses = [
        {"vehicleId": v_map["KA-03-CD-5678"], "type": "Toll", "date": "2026-07-10", "cost": 1200.0},
        {"vehicleId": v_map["KA-01-LM-4321"], "type": "Toll", "date": "2026-07-10", "cost": 2400.0},
        {"vehicleId": v_map["KA-05-EF-9012"], "type": "Parking", "date": "2026-07-09", "cost": 500.0},
        {"vehicleId": v_map["KA-03-NP-8765"], "type": "Toll", "date": "2026-07-08", "cost": 3600.0},
        {"vehicleId": v_map["KA-02-JK-7890"], "type": "Toll", "date": "2026-07-11", "cost": 1800.0},
        {"vehicleId": v_map["KA-01-AB-1234"], "type": "Insurance", "date": "2026-07-01", "cost": 15000.0},
        {"vehicleId": v_map["KA-05-PQ-2468"], "type": "Permit", "date": "2026-07-03", "cost": 4500.0},
        {"vehicleId": v_map["KA-04-GH-3456"], "type": "Insurance", "date": "2026-06-25", "cost": 28000.0}
    ]
    for e in mock_expenses:
        db.add(Expense(**e))

    db.commit()

# Seed database
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return user

from fastapi.responses import FileResponse

@app.get("/", tags=["General"])
def read_root():
    return FileResponse("frontend/index.html")

# --- Authentication ---
@app.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, tags=["Authentication"])
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        role=user_in.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/auth/token", response_model=Token, tags=["Authentication"])
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserResponse, tags=["Users"])
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


# --- Vehicles ---
@app.get("/vehicles", response_model=List[VehicleResponse], tags=["Vehicles"])
def list_vehicles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Vehicle).all()

@app.post("/vehicles", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED, tags=["Vehicles"])
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Vehicle).filter(Vehicle.regNumber == vehicle.regNumber).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration number '{vehicle.regNumber}' already exists"
        )
    db_vehicle = Vehicle(**vehicle.model_dump())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@app.put("/vehicles/{id}", response_model=VehicleResponse, tags=["Vehicles"])
def update_vehicle(id: int, updates: VehicleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    if db_vehicle.regNumber != updates.regNumber:
        existing = db.query(Vehicle).filter(Vehicle.regNumber == updates.regNumber).first()
        if existing:
            raise HTTPException(status_code=400, detail="Registration number already exists")

    for key, value in updates.model_dump().items():
        setattr(db_vehicle, key, value)
    
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@app.delete("/vehicles/{id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Vehicles"])
def delete_vehicle(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(db_vehicle)
    db.commit()
    return


# --- Drivers ---
@app.get("/drivers", response_model=List[DriverResponse], tags=["Drivers"])
def list_drivers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Driver).all()

@app.post("/drivers", response_model=DriverResponse, status_code=status.HTTP_201_CREATED, tags=["Drivers"])
def create_driver(driver: DriverCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Driver).filter(Driver.licenseNumber == driver.licenseNumber).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"License number '{driver.licenseNumber}' already exists"
        )
    db_driver = Driver(**driver.model_dump())
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver

@app.put("/drivers/{id}", response_model=DriverResponse, tags=["Drivers"])
def update_driver(id: int, updates: DriverCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_driver = db.query(Driver).filter(Driver.id == id).first()
    if not db_driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    if db_driver.licenseNumber != updates.licenseNumber:
        existing = db.query(Driver).filter(Driver.licenseNumber == updates.licenseNumber).first()
        if existing:
            raise HTTPException(status_code=400, detail="License number already exists")

    for key, value in updates.model_dump().items():
        setattr(db_driver, key, value)

    db.commit()
    db.refresh(db_driver)
    return db_driver

@app.delete("/drivers/{id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Drivers"])
def delete_driver(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_driver = db.query(Driver).filter(Driver.id == id).first()
    if not db_driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    db.delete(db_driver)
    db.commit()
    return


# --- Trips ---
@app.get("/trips", response_model=List[TripResponse], tags=["Trips"])
def list_trips(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Trip).all()

@app.post("/trips", response_model=TripResponse, status_code=status.HTTP_201_CREATED, tags=["Trips"])
def create_trip(trip: TripCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Validate vehicle assignment if provided
    if trip.vehicleId:
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicleId).first()
        if not vehicle:
            raise HTTPException(status_code=400, detail="Assigned vehicle not found")
        if vehicle.status != "Available":
            raise HTTPException(status_code=400, detail=f"Vehicle '{vehicle.regNumber}' is currently {vehicle.status} and cannot be assigned")
        if trip.cargoWeightKg > vehicle.maxLoadKg:
            raise HTTPException(
                status_code=400,
                detail=f"Cargo weight ({trip.cargoWeightKg}kg) exceeds vehicle capacity ({vehicle.maxLoadKg}kg)"
            )

    # Validate driver assignment if provided
    if trip.driverId:
        driver = db.query(Driver).filter(Driver.id == trip.driverId).first()
        if not driver:
            raise HTTPException(status_code=400, detail="Assigned driver not found")
        if driver.status != "Available":
            raise HTTPException(status_code=400, detail=f"Driver '{driver.name}' is currently {driver.status} and cannot be assigned")
        current_date = date.today().isoformat()
        if driver.licenseExpiry < current_date:
            raise HTTPException(
                status_code=400,
                detail=f"Driver '{driver.name}' has an expired license (Expired on {driver.licenseExpiry})"
            )

    db_trip = Trip(**trip.model_dump())
    db_trip.status = "Draft"
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    return db_trip

@app.get("/trips/{id}", response_model=TripResponse, tags=["Trips"])
def get_trip(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_trip = db.query(Trip).filter(Trip.id == id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return db_trip

@app.put("/trips/{id}/location", response_model=TripResponse, tags=["Trips"])
def update_trip_location(id: int, location: TripLocationUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_trip = db.query(Trip).filter(Trip.id == id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if db_trip.status != "Dispatched":
        raise HTTPException(status_code=400, detail="Only dispatched trips can have live location updates")
    
    db_trip.current_lat = location.lat
    db_trip.current_lon = location.lon
    db.commit()
    db.refresh(db_trip)
    return db_trip

@app.post("/trips/{id}/dispatch", response_model=TripResponse, tags=["Trips"])
def dispatch_trip(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_trip = db.query(Trip).filter(Trip.id == id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if db_trip.status != "Draft":
        raise HTTPException(status_code=400, detail="Only draft trips can be dispatched")

    if not db_trip.vehicleId or not db_trip.driverId:
        raise HTTPException(status_code=400, detail="Trip must have an assigned Vehicle and Driver to dispatch")

    vehicle = db.query(Vehicle).filter(Vehicle.id == db_trip.vehicleId).first()
    driver = db.query(Driver).filter(Driver.id == db_trip.driverId).first()

    if not vehicle or not driver:
        raise HTTPException(status_code=400, detail="Assigned vehicle or driver not found")

    if vehicle.status in ["Retired", "In Shop"]:
        raise HTTPException(status_code=400, detail=f"Vehicle '{vehicle.regNumber}' is currently {vehicle.status} and cannot be dispatched")

    if driver.status == "Suspended":
        raise HTTPException(status_code=400, detail=f"Driver '{driver.name}' is currently Suspended")
    
    current_date = date.today().isoformat()
    if driver.licenseExpiry < current_date:
        raise HTTPException(status_code=400, detail=f"Driver '{driver.name}' has an expired license (Expired on {driver.licenseExpiry})")

    if vehicle.status == "On Trip":
        raise HTTPException(status_code=400, detail=f"Vehicle '{vehicle.regNumber}' is already On Trip")
    if driver.status == "On Trip":
        raise HTTPException(status_code=400, detail=f"Driver '{driver.name}' is already On Trip")

    if db_trip.cargoWeightKg > vehicle.maxLoadKg:
        raise HTTPException(
            status_code=400, 
            detail=f"Cargo weight ({db_trip.cargoWeightKg}kg) exceeds vehicle capacity ({vehicle.maxLoadKg}kg)"
        )

    vehicle.status = "On Trip"
    driver.status = "On Trip"
    db_trip.status = "Dispatched"

    db.commit()
    db.refresh(db_trip)
    return db_trip

@app.post("/trips/{id}/complete", response_model=TripResponse, tags=["Trips"])
def complete_trip(id: int, actualOdometer: float, fuelConsumed: float, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_trip = db.query(Trip).filter(Trip.id == id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if db_trip.status != "Dispatched":
        raise HTTPException(status_code=400, detail="Only dispatched trips can be completed")

    vehicle = db.query(Vehicle).filter(Vehicle.id == db_trip.vehicleId).first()
    driver = db.query(Driver).filter(Driver.id == db_trip.driverId).first()

    if vehicle and actualOdometer < vehicle.odometer:
        raise HTTPException(
            status_code=400,
            detail=f"End odometer ({actualOdometer} km) cannot be less than start odometer ({vehicle.odometer} km)"
        )

    if vehicle:
        vehicle.status = "Available"
        vehicle.odometer = actualOdometer
    if driver:
        driver.status = "Available"

    db_trip.status = "Completed"
    db_trip.actualOdometer = actualOdometer
    db_trip.fuelConsumed = fuelConsumed

    if fuelConsumed > 0 and vehicle:
        fuel_cost = fuelConsumed * 105.0
        db_fuel = FuelLog(
            vehicleId=vehicle.id,
            date=date.today().isoformat(),
            liters=fuelConsumed,
            cost=fuel_cost
        )
        db.add(db_fuel)

    db.commit()
    db.refresh(db_trip)
    return db_trip

@app.post("/trips/{id}/cancel", response_model=TripResponse, tags=["Trips"])
def cancel_trip(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_trip = db.query(Trip).filter(Trip.id == id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if db_trip.status in ["Completed", "Cancelled"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel a trip that is already {db_trip.status}")

    if db_trip.status == "Dispatched":
        vehicle = db.query(Vehicle).filter(Vehicle.id == db_trip.vehicleId).first()
        driver = db.query(Driver).filter(Driver.id == db_trip.driverId).first()
        if vehicle:
            vehicle.status = "Available"
        if driver:
            driver.status = "Available"

    db_trip.status = "Cancelled"
    db.commit()
    db.refresh(db_trip)
    return db_trip


# --- Maintenance Logs ---
@app.get("/maintenance", response_model=List[MaintenanceLogResponse], tags=["Maintenance"])
def list_maintenance(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(MaintenanceLog).all()

@app.post("/maintenance", response_model=MaintenanceLogResponse, status_code=status.HTTP_201_CREATED, tags=["Maintenance"])
def create_maintenance(log: MaintenanceLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == log.vehicleId).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    if log.dateClosed is None:
        vehicle.status = "In Shop"

    db_log = MaintenanceLog(**log.model_dump())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@app.put("/maintenance/{id}/close", response_model=MaintenanceLogResponse, tags=["Maintenance"])
def close_maintenance(id: int, dateClosed: str, cost: float, notes: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_log = db.query(MaintenanceLog).filter(MaintenanceLog.id == id).first()
    if not db_log:
        raise HTTPException(status_code=404, detail="Maintenance log not found")

    db_log.dateClosed = dateClosed
    db_log.cost = cost
    if notes:
        db_log.notes = notes

    vehicle = db.query(Vehicle).filter(Vehicle.id == db_log.vehicleId).first()
    if vehicle and vehicle.status != "Retired":
        vehicle.status = "Available"

    db.commit()
    db.refresh(db_log)
    return db_log


# --- Fuel Logs ---
@app.get("/fuel", response_model=List[FuelLogResponse], tags=["Fuel"])
def list_fuel(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(FuelLog).all()

@app.post("/fuel", response_model=FuelLogResponse, status_code=status.HTTP_201_CREATED, tags=["Fuel"])
def create_fuel(log: FuelLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_log = FuelLog(**log.model_dump())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


# --- Expenses ---
@app.get("/expenses", response_model=List[ExpenseResponse], tags=["Expenses"])
def list_expenses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Expense).all()

@app.post("/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED, tags=["Expenses"])
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_log = Expense(**expense.model_dump())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


from fastapi.staticfiles import StaticFiles
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
