# API Backend GSB

## Présentation du Projet
Ce projet constitue l'API backend de l'application GSB (Galaxy Swiss Bourdin), développée dans le cadre de l'épreuve E6 du BTS SIO, option SLAM. Il fournit les points d'accès (endpoints) pour la gestion des utilisateurs, la gestion des notes de frais, et l'authentification, en utilisant des technologies web modernes et les bonnes pratiques.

## Dépôt Frontend
Le code source de l'interface frontend de ce projet est disponible ici : [RyukSylux/gsbFront](https://github.com/RyukSylux/gsbFront).

---

## Table des Matières
- [Fonctionnalités](#fonctionnalités)
- [Technologies Utilisées](#technologies-utilisées)
- [Structure du Projet](#structure-du-projet)
- [Installation](#installation)
- [Configuration](#configuration)
- [Lancement du Projet](#lancement-du-projet)
- [Documentation de l'API](#documentation-de-lapi)
- [Endpoints Principaux](#endpoints-principaux)
- [Variables d'Environnement](#variables-denvironnement)

---

## Fonctionnalités
- Inscription, authentification et gestion des utilisateurs
- Création, consultation, modification et suppression des notes de frais
- Téléchargement de justificatifs (stockés sur AWS S3)
- Authentification sécurisée avec JWT
- Structure d'API RESTful
- Génération de la documentation de l'API avec JSDoc

---

## Technologies Utilisées
- **Node.js** : Environnement d'exécution JavaScript côté serveur
- **Express** : Framework web pour la création d'API REST
- **MongoDB** : Base de données NoSQL pour stocker utilisateurs et notes de frais
- **Mongoose** : ODM pour MongoDB, gérant les schémas et la validation
- **JWT (jsonwebtoken)** : Sécurisation de l'authentification et des autorisations
- **Bcryptjs** : Bibliothèque de hachage sécurisé des mots de passe (avec salage automatique)
- **Multer** : Middleware pour la gestion des téléchargements de fichiers
- **AWS SDK** : Utilisé pour le transfert et la suppression de fichiers sur Amazon S3
- **dotenv** : Chargement des variables d'environnement depuis un fichier `.env`
- **JSDoc** : Génération de documentation à partir des commentaires du code
- **CORS** : Autorisation sécurisée des requêtes cross-origin

---

## Structure du Projet
```text
├── controller/    # Contrôleurs de l'application (logique métier)
├── models/        # Modèles de données (schémas Mongoose)
├── routes/        # Routes de l'API
├── middleware/    # Middlewares Express
├── utils/         # Fonctions utilitaires (ex: upload S3)
├── docs/          # Documentation de l'API générée
├── index.js       # Point d'entrée principal
├── package.json   # Dépendances et scripts du projet
├── .env           # Variables d'environnement (non versionné)
```

---

## Installation
1. Cloner le dépôt :
   ```bash
   git clone https://github.com/RyukSylux/gsbBackend.git
   cd gsbBackend
   ```
2. Installer les dépendances :
   ```bash
   npm install
   ```

---

## Configuration
Avant de lancer le projet, créez un fichier `.env` à la racine du projet en vous basant sur le fichier `.env.example` :

```env
PORT=3000
MONGO_URI=votre_uri_mongodb
MONGO_USER=votre_utilisateur_mongodb
MONGO_PASSWORD=votre_mot_de_passe_mongodb
JWT_SALT=votre_sel_jwt
JWT_SECRET=votre_cle_secrete_jwt
JWT_EXPIRATION=24h
AWS_ACCESS_KEY_ID=votre_cle_acces_aws
AWS_SECRET_ACCESS_KEY=votre_cle_secrete_aws
AWS_BUCKET_NAME=votre_nom_de_bucket_s3
```

**Chaque variable est requise pour le bon fonctionnement de l'application.**

---

## Lancement du Projet
Démarrez le serveur avec :
```bash
npm start
```
L'API sera disponible sur le port `3000` par défaut (configurée via la variable `PORT` dans votre fichier `.env`).

---

## Comptes de Test

> **⚠️ AVERTISSEMENT DE SÉCURITÉ** : Les mots de passe ci-dessous sont volontairement triviaux car ils sont exclusivement réservés à un **environnement de démonstration** (comme notre déploiement Vercel). Ils ne doivent en aucun cas être utilisés sur un environnement de production réel.

Les comptes suivants peuvent être utilisés pour tester l'application :

### Administrateur
- **Email** : test@gmail.com
- **Mot de passe** : test

### Utilisateur Standard
- **Email** : hugo@gmail.com
- **Mot de passe** : hugo

### Commercial
- **Email** : pablito@gmail.com
- **Mot de passe** : pablito1

---

## Documentation de l'API
- En ligne : [https://ryuksylux.github.io/gsbBackend/](https://ryuksylux.github.io/gsbBackend/)
- Locale : Après avoir généré la documentation, ouvrez le dossier `docs/`

Pour générer la documentation localement :
```bash
npm run docs
```
Pour déployer la documentation sur GitHub Pages (nécessite PowerShell et Git) :
```bash
npm run docs:deploy
```

---

## Endpoints Principaux
- `/api/users` — Gestion des utilisateurs (CRUD)
- `/api/bills` — Gestion des notes de frais (CRUD, upload de fichiers)
- `/api/login` — Authentification

---

## Variables d'Environnement
**Exemple de fichier `.env` :**
Reportez-vous au fichier `.env.example` présent à la racine du projet.
**Ne commitez jamais votre fichier `.env` sur le contrôle de version.**
