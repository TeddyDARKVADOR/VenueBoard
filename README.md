# VenueBoard - Backend API

## Description

VenueBoard est une solution de gestion d'événements en temps réel (salons, JPO, conférences). Elle permet de centraliser les informations sur les activités, de gérer les retards, les salles, et d'offrir aux visiteurs des fonctionnalités interactives comme des files d'attente virtuelles et des inscriptions.

## Fonctionnalités Backend (Actuelles)

L'API est développée avec **Fastify**, **TypeScript**, et **PostgreSQL**. Elle inclut déjà :

### 🔐 Sécurité & Authentification

- **Authentification JWT** : Gestion des tokens via cookies sécurisés.
- **Gestion des Rôles** : `admin`, `staff`, `speaker`, `guest` avec des permissions spécifiques.
- **Validation Globale** : Utilisation de **Zod** pour la validation des schémas de données.

### 📅 Gestion des Événements & Activités

- **CRUD Événements** : Création, lecture, mise à jour et suppression d'événements.
- **CRUD Activités** : Gestion détaillée des sessions (horaires prévus vs réels, description, salle).
- **Lien Événement/Activités** : Récupération d'un événement avec toutes ses activités liées.

### 👥 Gestion des Utilisateurs

- **Profils Utilisateurs** : Gestion des informations publiques et des rôles.
- **Authentification** : Gestion des identifiants et mots de passe (avec hachage prévu).

### 🛠️ Fonctionnalités Interactives

- **Inscriptions (Registers)** : Permet aux visiteurs de s'inscrire à une activité.
- **Favoris (Favorites)** : Permet de marquer des activités pour les retrouver facilement.
- **Intervenants (Runs)** : Permet de lier un intervenant à une activité qu'il anime.
- **File d'Attente Virtuelle (Queues)** : Système de positionnement pour les activités à capacité limitée, avec transfert automatique vers les inscriptions.

### 🏢 Infrastructure (Rooms)

- **Gestion des Salles** : Localisation et capacité des salles.

---

## Plan d'Action pour l'implémentation Frontend (ReactJS)

Pour transformer ce backend en une application complète, voici les étapes recommandées :

### 1. 🏗️ Architecture & Setup

- Initialiser un projet **React** (avec Vite).
- Configurer les outils de style (Tailwind CSS recommandé pour la rapidité et le zoning).
- Mettre en place un client API (Axios ou SDK natif) avec gestion des cookies/credentials.
- Configurer les routes (React Router).

### 2. 👤 Authentification & Espace Utilisateur

- **Page Login** : Formulaire de connexion.
- **Contexte Auth** : Maintenir l'état de l'utilisateur (rôle, ID) à travers l'app.
- **Profil** : Consultation et modification des informations de base.

### 3. 🖥️ Affichages Publics (Contextuels)

- **Vue Hall** : Liste globale de toutes les activités de la journée (façon tableau de gare).
- **Vue Salle** : Affichage spécifique à une salle (Activité en cours + Suivante).

### 4. 📱 Application Visiteur (Mobile-first)

- **Programme Interactif** : Liste des activités avec filtres par événement/salle.
- **Détails Activité** : Description, intervenant, et boutons d'action (S'inscrire / Favori / Rejoindre la file).
- **Ma File d'Attente** : Voir sa position en temps réel et notification (simulée ou via signal).

### 5. 🛠️ Interface Administration / Staff / Intervenant

- **Dashboard Admin** : CRUD complet pour les événements, activités et utilisateurs.
- **Mode Intervenant** : Page dédiée pour valider le début/fin d'une session et déclarer un retard.

### 6. 🔄 Interaction Temps Réel (Bonus/Amélioration)

- Actuellement l'API est REST. Pour une réactivité optimale du Frontend (changements de salle, retards), il serait intéressant d'ajouter des **WebSockets** ou du **Polling** régulier sur les statuts d'activités.
