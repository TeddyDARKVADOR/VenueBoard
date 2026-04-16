# VenueBoard

## 1. Présentation du projet

VenueBoard est une application web de gestion d'événements et de conférences, conçue en mobile-first avec une adaptation desktop complète. Le backend est une API REST construite avec Fastify, TypeScript et PostgreSQL, exposant des routes pour les utilisateurs, activités, salles, files d'attente et favoris. Le frontend est une SPA React avec React Router, qui communique avec l'API via un proxy Vite et gère l'authentification par cookies JWT.

## 2. Démarrage rapide

Le backend utilise Docker pour PostgreSQL et un script de démarrage automatisé. Le frontend est servi par Vite en développement avec un proxy vers le backend.

```bash
# Backend (démarre Docker + seed + serveur sur :1234)
cd backend
pnpm install
pnpm dev

# Frontend (démarre Vite sur :5173)
cd frontend
npm install
npm run dev
```

Comptes de test après seed : `admin` / `admin123`, `thomas` / `guest123`, `sophie` / `guest456`.
