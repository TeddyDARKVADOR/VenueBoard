# VenueBoard

## 1. Présentation du projet

VenueBoard est une application web de gestion d'événements et de conférences, conçue en mobile-first avec une adaptation desktop complète. Le backend est une API REST construite avec Fastify, TypeScript et PostgreSQL, exposant des routes pour les utilisateurs, activités, salles, files d'attente et favoris. Le frontend est une SPA React avec React Router, qui communique avec l'API via un proxy Vite et gère l'authentification par cookies JWT.

## 2. Architecture

L'application est composée de 3 conteneurs Docker qui communiquent entre eux :

- Le **frontend** (Nginx) sert l'application React et redirige les appels `/api/` vers le backend.
- Le **backend** (Fastify) reçoit les requêtes API et interroge la base de données PostgreSQL.
- La **base de données** (PostgreSQL) stocke toutes les données de l'application.

## 3. Lancer l'application

Il suffit d'une seule commande à la racine du projet :

```bash
docker compose up --build
```

L'application est ensuite accessible sur **http://localhost:8080**.

Pour arrêter :

```bash
docker compose down
```

Comptes de test après seed : `admin` / `admin123`, `thomas` / `guest123`, `sophie` / `guest456`.
