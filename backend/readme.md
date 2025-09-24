# Backend (Django + DRF + Celery + Redis + PostgreSQL)

This backend provides a CSV processing API with asynchronous task handling using **Celery** and **Redis**.  
It is containerized with **Docker Compose** for easy local development.



## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/GamboaDd27/takehome-badger
cd takehome-badger
````

### 2. Environment variables

Copy the example environment file:

```bash
cp backend/.env.example backend/.env
```

Default values (edit if needed):

```env
SECRET_KEY=dev-secret
DEBUG=1
DJANGO_ALLOWED_HOSTS=*

DB_ENGINE=django.db.backends.postgresql
DB_NAME=partsbadger
DB_USER=partsbadger
DB_PASSWORD=partsbadger
DB_HOST=db
DB_PORT=5432

CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/1
```

### 3. Build and start services

From the root directory (where `docker-compose.yml` lives):

```bash
docker compose up --build
```

Services started:

* **db** → PostgreSQL 15
* **redis** → Redis 7
* **backend** → Django + DRF ([http://localhost:8000](http://localhost:8000))
* **celery** → Celery worker



## API Endpoints

| Method | Endpoint            | Description                                         |
| ------ | ------------------- | --------------------------------------------------- |
| POST   | `/upload-csv/`      | Upload a CSV file with `stock_code`.                |
| GET    | `/tasks/<task_id>/` | Check Celery task status.                           |
| GET    | `/results/`         | List processed results. Supports `?search=` filter. |
| POST   | `/seed-demo/`       | Seed demo Parts/Quotes for testing.                 |



## Useful Commands

Run inside the backend container:

```bash
# Open Django shell
docker compose exec backend python manage.py shell

# Run migrations manually
docker compose exec backend python manage.py migrate

# Create a superuser
docker compose exec backend python manage.py createsuperuser
```


## Stopping containers

* Stop but keep data:

```bash
docker compose down
```

* Stop and **wipe Postgres volume** (fresh DB next start):

```bash
docker compose down -v
```
