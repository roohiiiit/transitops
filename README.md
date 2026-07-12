# TransitOps

TransitOps is a modern, lightweight, full-stack web application designed for comprehensive transit and fleet management. It provides a centralized dashboard to track and manage vehicles, drivers, trips, fuel consumption, and operational expenses in real-time.

## Features

- **Dashboard**: High-level, real-time overview of fleet operations.
- **Drivers Management**: Track driver records, licenses, safety scores, and assignments.
- **Vehicles Management**: Track fleet vehicles, load capacities, odometers, and maintenance status.
- **Trips Management**: Log and monitor live trips with GPS status toggles.
- **Fuel & Expense Tracking**: Record fuel expenses and operational costs. Includes an **AI Bill Scanning** feature (powered by Google Gemini) to automatically extract receipts and classify expenses via OCR.
- **Maintenance Logs**: Log vehicle maintenance, repairs, and associated costs.
- **Role-Based Access Control**: Strict backend-enforced RBAC distinguishing capabilities between Fleet Managers, Safety Officers, Drivers, and Financial Analysts.
- **Security**: Hardened JWT authentication, bcrypt password hashing, and XSS-sanitized frontend rendering.

## Tech Stack

### Frontend
- Pure Vanilla JavaScript (Modular ES6 Structure)
- HTML5 & CSS3 with CSS variables for dynamic themes
- Zero heavy framework dependencies, ensuring maximum speed and lightweight client bundles.

### Backend
- **Python / FastAPI**: High-performance, asynchronous REST API.
- **SQLAlchemy & SQLite**: ORM for robust database interactions (designed to be easily portable to PostgreSQL).
- **Uvicorn**: Lightning-fast ASGI web server.
- **PyJWT & bcrypt**: Secure user authentication.
- **Google GenAI SDK**: Intelligent OCR and data extraction for receipts and bills using Gemini 3.5 Flash.

## Project Structure

```
├── app/                  # FastAPI backend logic (routes, models, schemas)
├── frontend/             # Static frontend assets (HTML, CSS, JS)
│   ├── app.js            # Frontend router and lifecycle manager
│   ├── dataLayer.js      # Global state sync with backend API
│   ├── layout.js         # Core UI layout and global sanitizer
│   └── index.html        # Entrypoint
├── run.py                # Backend server entrypoint
├── requirements.txt      # Python dependencies
└── .env.example          # Template for required environment variables
```

## Getting Started Locally

No deployment link is provided for this repository—you must run it locally or deploy it to your own infrastructure.

### Prerequisites

- Python 3.10+
- A valid Google Gemini API Key for the AI bill scanning feature.

### 1. Environment Setup

Copy the example environment file and configure it:
```bash
cp .env.example .env
```
Open `.env` and add your `GEMINI_API_KEY`. (If you leave it blank, the backend will still run, but the AI receipt scanner will be disabled).

### 2. Backend Setup

It is highly recommended to use a virtual environment:
```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server (this will auto-create and seed the SQLite database)
python run.py
```
The backend API will now be running on `http://127.0.0.1:8000`.

### 3. Frontend Setup

The frontend consists of entirely static files and runs directly in the browser. 

In a **new terminal tab**, start a simple HTTP server in the root of the project to serve the files:
```bash
# Start frontend server
python3 -m http.server 8080
```

### 4. Access the App

Open your browser and navigate to:
**http://localhost:8080/frontend/**

**Default Seeded Credentials:**
- **Email:** `admin@transitops.local`
- **Password:** `admin123`
*(This user is a Fleet Manager and has full access to all features).*
