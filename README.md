# TransitOps

TransitOps is a full-stack web application designed for comprehensive transit and fleet management. It provides a centralized dashboard to track and manage vehicles, drivers, trips, fuel consumption, and maintenance records.

## Features

- **Dashboard**: High-level overview of operations.
- **Drivers Management**: Maintain driver records and assignments.
- **Vehicles Management**: Track fleet vehicles, their status, and specifications.
- **Trips Management**: Log and monitor trips.
- **Fuel & Expense Tracking**: Record fuel expenses with built-in OCR capabilities (using Tesseract) to extract data from fuel receipts.
- **Maintenance Logs**: Keep track of vehicle maintenance and repairs.
- **Authentication**: Secure JWT-based authentication for user access.

## Tech Stack

### Frontend
- Vanilla JavaScript (Modular structure)
- HTML5 & CSS3
- No heavy frontend frameworks, ensuring a lightweight and fast user experience.

### Backend
- **Python / FastAPI**: High-performance backend API.
- **SQLAlchemy**: ORM for database interactions.
- **Uvicorn**: ASGI web server implementation for FastAPI.
- **PyJWT & bcrypt**: For secure user authentication and password hashing.
- **pytesseract & Pillow**: For OCR (Optical Character Recognition) tasks.

## Project Structure

- `index.html`: Main entry point for the frontend application.
- `app.js`: Frontend application controller handling routing and page registry.
- `styles.css`: Global styles for the application.
- `layout.js`, `dataLayer.js`, `login.js`, etc.: Frontend logic modules.
- `requirements.txt`: Python backend dependencies.
- `run.py`: Entry point for running the FastAPI backend.
- `backend/` / `app/`: Backend API and application logic (models, routes, etc.).

## Getting Started

### Prerequisites

- Python 3.8+
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) installed on your system (required for the fuel receipt OCR feature).

### Backend Setup

1. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

2. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the backend server:
   ```bash
   python run.py
   ```
   The API will be available at `http://127.0.0.1:8000`.

### Frontend Setup

The frontend consists of static files. You can serve them using any simple HTTP server. For example, using Python's built-in `http.server`:

1. Open a new terminal in the root directory of the project.
2. Start the server:
   ```bash
   python -m http.server 8080
   ```
3. Open your browser and navigate to `http://localhost:8080`.

## Deployment

This project includes a `railway.json` configuration file, making it ready for deployment on [Railway](https://railway.app/).
