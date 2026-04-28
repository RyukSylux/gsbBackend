# 🛡️ API Backend GSB (Galaxy Swiss Bourdin)

## 📝 Présentation du Projet
Ce projet constitue l'API backend de l'application **GSB**, développée dans le cadre de l'épreuve **E6 du BTS SIO (option SLAM)**. Il fournit une architecture robuste pour la gestion des utilisateurs, des notes de frais, et l'authentification sécurisée.

🔗 **Dépôt Frontend** : Cette API fonctionne en binôme avec l'interface utilisateur pour offrir une expérience complète. Vous pouvez retrouver le code du front ici : [https://github.com/RyukSylux/gsbFront](https://github.com/RyukSylux/gsbFront)

---

## 📋 Table des Matières
- [Architecture Globale](#architecture-globale)
- [Sécurité & Authentification](#sécurité--authentification)
- [Technologies Utilisées](#technologies-utilisées)
- [Structure du Projet](#structure-du-projet)
- [Installation & Configuration](#installation--configuration)
- [Comptes de Test](#comptes-de-test)
- [Documentation JSDoc](#documentation-jsdoc)
- [Endpoints de l'API](#endpoints-de-lapi)
- [Auteur](#auteur)

---

## 🏗️ Architecture Globale

```text
       +-------------------+
       |   Client React    |
       |  (Vite + Axios)   |
       +---------+---------+
                 |
                 | HTTP/JSON (CORS)
                 v
       +---------+---------+          +-----------------+
       |   API Express.js  +---------->   MongoDB Atlas |
       | (Node.js Backend) |          |  (Données/User) |
       +---------+---------+          +-----------------+
                 |
                 | AWS SDK v3
                 v
       +---------+---------+
       |   Amazon S3       |
       | (Justificatifs)   |
       +-------------------+
```

---

## 🔒 Sécurité & Authentification

### Stratégie d'Authentification Hybride
Pour garantir une compatibilité maximale (notamment avec Safari/macOS) tout en maintenant un haut niveau de sécurité, nous utilisons une double vérification :

```text
[ Login ] --> [ Backend ]
                 |
                 +--> 1. Génère un JWT
                 +--> 2. Pose un Cookie httpOnly (Sécurité XSS)
                 +--> 3. Renvoie le JWT en JSON (Fallback Mac/Safari)

[ Request ] --> [ Middleware verifyToken ]
                 |
                 +--> Vérifie Cookie ? OK -> Autorisé
                 +--> Sinon, vérifie Header Auth ? OK -> Autorisé
                 +--> Sinon -> 401 Unauthorized
```

### Autres mesures :
- **Hachage Bcryptjs** : Les mots de passe sont salés et hachés avant stockage.
- **Middleware `isAdmin`** : Protection granulaire des routes de statistiques et de gestion.
- **Validation** : Nettoyage des données via les schémas Mongoose (ODM).

---

## 🛠️ Technologies Utilisées
- **Node.js & Express** : Environnement d'exécution et framework web.
- **MongoDB Atlas & Mongoose** : Base de données NoSQL et gestion des schémas.
- **JWT (jsonwebtoken)** : Sécurisation des échanges via jetons.
- **Bcryptjs** : Hachage sécurisé des mots de passe.
- **Cookie-parser** : Lecture des cookies sécurisés `httpOnly`.
- **CORS** : Gestion des accès cross-origin.
- **AWS SDK v3** : Interaction avec le stockage Amazon S3.
- **Multer** : Gestion des téléchargements de fichiers (images/PDF).
- **UUID** : Génération d'identifiants uniques.
- **Dotenv** : Gestion des variables d'environnement.
- **JSDoc** : Documentation technique automatisée.

---

## 📂 Structure du Projet

```text
├── controller/
│   ├── authentification_controller.js  # Logique de session (Login/Logout/Me)
│   ├── bill_controller.js             # CRUD des factures & Agrégation Stats
│   └── user_controller.js             # Gestion CRUD des utilisateurs
├── models/
│   ├── bill_model.js                  # Schéma Mongoose des factures
│   └── user_model.js                  # Schéma Mongoose des utilisateurs
├── routes/
│   ├── authentication_route.js        # Points d'entrée Auth
│   ├── bill_route.js                  # Points d'entrée Factures
│   └── user_route.js                  # Points d'entrée Utilisateurs
├── middleware/
│   └── upload.js                      # Configuration Multer pour AWS S3
├── utils/
│   └── s3.js                          # Helpers de configuration AWS S3
├── docs/                              # JSDoc générée (GitHub Pages)
├── .env                               # Variables d'environnement
└── index.js                           # Point d'entrée de l'application (Express/CORS)
```

---

## ⚙️ Installation & Configuration
1. **Installation** : `npm install`
2. **Configuration** : Créer un fichier `.env` (voir `.env.example`) :
```env
PORT=3000
MONGO_URI=votre_uri_mongodb
JWT_SECRET=votre_cle_secrete
JWT_EXPIRATION=2h
FRONT_URL=http://localhost:5173
AWS_ACCESS_KEY_ID=votre_cle_aws
AWS_SECRET_ACCESS_KEY=votre_secret_aws
AWS_BUCKET_NAME=votre_bucket
AWS_REGION=eu-north-1
```
3. **Lancement** : `npm start`

---

## 👥 Comptes de Test

### Administrateur
- **Email** : `test@gmail.com`
- **Mot de passe** : `test`

### Utilisateur Standard
- **Email** : `hugo@gmail.com`
- **Mot de passe** : `hugo`

### Commercial
- **Email** : `pablito@gmail.com`
- **Mot de passe** : `pablito1`

---

## 📖 Documentation JSDoc
La documentation technique complète de l'API est générée automatiquement à partir des commentaires du code.

- **En ligne (GitHub Pages)** : [https://ryuksylux.github.io/gsbBackend/](https://ryuksylux.github.io/gsbBackend/)
- **Génération locale** : `npm run docs`

### ⚙️ Automatisation (CI/CD)
Un pipeline **GitHub Actions** régénère et déploie la documentation sur GitHub Pages à chaque `push` sur la branche `main`.

---

## 📊 Endpoints de l'API

### 🔑 Authentification
| Méthode | Route | Description | Protection |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/login` | Connexion utilisateur | Publique |
| `POST` | `/api/login/logout` | Déconnexion | Publique |
| `GET` | `/api/login/me` | Profil actuel | Connecté |

### 📄 Gestion des Factures
| Méthode | Route | Description | Protection |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/bills` | Liste des factures | Connecté |
| `POST` | `/api/bills` | Créer une facture | Connecté |
| `PUT` | `/api/bills/:id` | Modifier une facture | Connecté |
| `DELETE` | `/api/bills/:id` | Supprimer une facture | Connecté |
| `GET` | `/api/bills/stats` | Statistiques globales par catégorie | **Admin** |

### 👥 Gestion des Utilisateurs
| Méthode | Route | Description | Protection |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Liste des utilisateurs | Connecté |
| `POST` | `/api/users` | Inscription | Publique |
| `DELETE` | `/api/users/:email` | Supprimer un utilisateur | Connecté |

---

## 👨‍💻 Auteur
**Morgan Bourré** - BTS SIO SLAM 2025
- **Entreprise** : Galaxy Swiss Bourdin (GSB)
