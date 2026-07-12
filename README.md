# 🚛 TransitOps - Fleet & Transit Management System

TransitOps is a modern, comprehensive dashboard and fleet management solution designed to streamline the operations of logistics and transit organizations. Built with a robust Python/FastAPI backend and an interactive JavaScript frontend, TransitOps ensures complete control over vehicles, drivers, trips, maintenance, and fuel tracking.

## ✨ Features

- 🌓 **Dynamic Light/Dark Mode:** Seamlessly switch between light and dark modes with a sleek UI toggle for optimal viewing in any environment.
- 📊 **Real-time KPI Dashboard:** A comprehensive dashboard tracking Active Vehicles, Fleet Utilization, Drivers on Duty, Active/Pending Trips, and Vehicles in Maintenance.
- 🚚 **Vehicle & Fleet Tracking:** Complete CRUD for fleet vehicles including types, zones/regions, statuses, odometer readings, and payload capacities.
- 👤 **Driver Management:** Track driver licenses, statuses, assignments, and safety scores. Includes mock automated license expiration email reminders.
- 🗺️ **Trip Scheduling:** Dispatch and monitor trips with integrated driver and vehicle assignments. Follows strict dispatch rules (e.g., vehicles in maintenance cannot be dispatched).
- 🛠️ **Maintenance & Fuel Logs:** Keep detailed records of preventative maintenance, repairs, and fuel consumption to optimize running costs.
- 💵 **Expense Tracking:** Granular logging of fleet expenses to maintain financial visibility.

## 🔐 Role-Based Access Control (RBAC)

TransitOps enforces strict role-based access to ensure data integrity and organizational security. The system supports distinct user roles:

- 🏢 **Fleet Manager:** Has full administrative access. Can create/dispatch trips, manage the vehicle inventory, and oversee all operations.
- 🚚 **Driver / Driver Manager:** Restricted view focusing on their own assigned trips, shift statuses, and safety metrics.
- 🛡️ **Safety Officer:** Focuses on compliance, driver safety scores, license expirations, and managing/resolving critical alerts.
- 💰 **Financial Officer:** Focused purely on cost analysis, fuel logs, acquisition costs, and maintenance expenses without the clutter of operational dispatch tools.

## 🚀 Running Locally

This project requires **Python 3.10+**. Follow the steps below to spin up the local server and start testing TransitOps.

### 1. Clone the repository
```bash
git clone https://github.com/roohiiiit/transitops.git
cd transitops
```

### 2. Set up a virtual environment
```bash
python3 -m venv venv
source venv/bin/activate
# On Windows use: venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory and add the following keys:
```env
SECRET_KEY="supersecrettransitopskey"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### 5. Start the Application
Run the FastAPI backend (which simultaneously serves the frontend via static files):
```bash
python run.py
```

### 6. Access the App
Open your browser and navigate to:
**http://localhost:8080**

*Note: Since it uses a local SQLite DB (`auth.db`), you will be greeted by the login screen. You can register a new account instantly via the "Sign Up" toggle on the login page to gain full Fleet Manager access.*

---

*Built with ❤️ for the Hackathon!*
