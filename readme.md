# CSV Analyzer

A full-stack web app to upload, process, and analyze CSV files of parts inventory data.  
Built with **Django + Celery + Redis** on the backend and **React + TypeScript + Tailwind** on the frontend.  
Uses **WebSockets (Django Channels)** for real-time task updates.


## Features
- Upload CSV files for analysis.
- Background processing with Celery workers.
- Results stored in Postgres and displayed in a React table.
- Real-time notifications via WebSockets.
- Simple seed button to generate demo data.


## Tech Stack
**Backend**
- Django + Django REST Framework
- Celery + Redis (task queue + broker)
- PostgreSQL (database)
- Django Channels (WebSockets)
- Uvicorn (ASGI server)

**Frontend**
- React (Vite + TypeScript)
- Tailwind CSS
- Lucide Icons

**Dev / Ops**
- Docker + Docker Compose

## Getting Started

### Requirements
- Docker & Docker Compose installed

### Run the app
```bash
docker compose up --build
```
