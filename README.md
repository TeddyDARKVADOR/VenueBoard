# VenueBoard

## 1. Présentation du projet

VenueBoard est une application web de gestion d'événements et de conférences, conçue en mobile-first avec une adaptation desktop complète. Le backend est une API REST construite avec Fastify, TypeScript et PostgreSQL, exposant des routes pour les utilisateurs, activités, salles, files d'attente et favoris. Le frontend est en  React avec React Router, qui communique avec l'API via un proxy Vite et gère l'authentification par cookies JWT.

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

## 3. Fonctionnalités à venir

Les administrateurs auront accès à un tableau de bord pour créer, modifier et supprimer des événements, activités et salles, ainsi que gérer les rôles des utilisateurs. Le staff disposera d'outils pour valider les inscriptions, scanner les entrées des participants et gérer les files d'attente en temps réel. Ces fonctionnalités seront accessibles via des pages dédiées protégées par rôle, invisibles pour les participants classiques.
