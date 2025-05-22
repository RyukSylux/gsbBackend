# GSB Backend API

## Description
API backend pour l'application GSB (Gestion de Suivi des Bordereaux).

## Installation

```bash
npm install
```

## Configuration

Créez un fichier `.env` à la racine du projet avec les variables d'environnement suivantes :

```env
MONGO_URI=votre_uri_mongodb
MONGO_USER=votre_utilisateur
MONGO_PASSWORD=votre_mot_de_passe
JWT_SALT=votre_salt_jwt
```

## Démarrage

```bash
npm start
```

## Documentation API

La documentation complète de l'API est disponible dans le dossier `docs/`. Pour la générer :

```bash
npm run docs
```

## Endpoints Principaux

- `/api/users` - Gestion des utilisateurs
- `/api/bills` - Gestion des bordereaux
- `/api/login` - Authentification

## Technologies

- Node.js
- Express
- MongoDB
- JWT pour l'authentification

## Structure du Projet

```
├── controller/    # Contrôleurs de l'application
├── models/       # Modèles de données
├── routes/       # Routes de l'API
├── middleware/   # Middlewares
├── utils/        # Utilitaires
└── docs/         # Documentation générée
```