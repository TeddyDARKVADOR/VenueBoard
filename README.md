# VenueBoard

## Avec Docker

```bash
docker compose up --build -d
```

Accès : http://localhost

---

## Sans Docker

**Prérequis :** Node.js, pnpm, Docker (pour la base de données)

```bash
# Base de données
cd backend
docker compose -f docker/docker-compose.yaml up -d

# Backend (port 1234)
pnpm install
pnpm dev

# Frontend (port 5173) — dans un autre terminal
cd frontend
pnpm install
pnpm dev
```

Accès : http://localhost:5173

Comptes de test : `admin` / `admin123` — `thomas` / `guest123` — `sophie` / `guest456`
