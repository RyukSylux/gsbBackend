# GSB Backend API (English)

## Project Overview
This project is the backend API for the GSB (Gestion de Suivi des Bordereaux) application, developed as part of the E5 exam for the BTS SIO SLAM track. It provides endpoints for user management, bill (expense report) management, and authentication, using modern web technologies and best practices.

---

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [Main Endpoints](#main-endpoints)
- [Environment Variables](#environment-variables)
- [License](#license)

---

## Features
- User registration, authentication, and management
- Bill (expense report) creation, retrieval, update, and deletion
- File upload for bill proofs (stored on AWS S3)
- Secure authentication with JWT
- RESTful API structure
- API documentation generation with JSDoc

---

## Technologies Used
- **Node.js**: JavaScript runtime for server-side development
- **Express**: Web framework for building REST APIs
- **MongoDB**: NoSQL database for storing users and bills
- **Mongoose**: ODM for MongoDB, providing schema and validation
- **JWT (jsonwebtoken)**: Secure authentication and authorization
- **Multer**: Middleware for handling file uploads
- **AWS SDK**: Used for uploading and deleting files on Amazon S3
- **dotenv**: Loads environment variables from a `.env` file
- **JSDoc**: Generates API documentation from code comments
- **CORS**: Enables secure cross-origin requests

---

## Project Structure
```
├── controller/    # Application controllers (business logic)
├── models/        # Data models (Mongoose schemas)
├── routes/        # API routes
├── middleware/    # Express middlewares
├── utils/         # Utility functions (e.g., S3 upload)
├── docs/          # Generated API documentation
├── index.js       # Main entry point
├── package.json   # Project dependencies and scripts
├── .env           # Environment variables (not committed)
```

---

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/RyukSylux/gsbBackend.git
   cd gsbBackend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

## Configuration
Before running the project, create a `.env` file at the root of the project with the following variables:

```env
MONGO_URI=your_mongodb_uri
MONGO_USER=your_mongodb_user
MONGO_PASSWORD=your_mongodb_password
JWT_SALT=your_jwt_salt
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_BUCKET_NAME=your_s3_bucket_name
```

**Each variable is required for the application to function properly:**
- `MONGO_URI`, `MONGO_USER`, `MONGO_PASSWORD`: MongoDB connection
- `JWT_SALT`, `JWT_SECRET`, `JWT_EXPIRATION`: Security for authentication
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`: File storage on AWS S3

---

## Running the Project
Start the server with:
```bash
npm start
```
The API will be available at `http://localhost:3000` by default (or the port specified in your code).

---

## API Documentation
- Online: [https://ryuksylux.github.io/gsbBackend/](https://ryuksylux.github.io/gsbBackend/)
- Local: After generating docs, open the `docs/` folder

To generate documentation locally:
```bash
npm run docs
```
To deploy documentation to GitHub Pages:
```bash
npm run docs:deploy
```

---

## Main Endpoints
- `/api/users` — User management (CRUD)
- `/api/bills` — Bill management (CRUD, file upload)
- `/api/login` — Authentication

---

## Environment Variables
**Example `.env` file:**
```env
MONGO_URI=your_mongodb_uri
MONGO_USER=your_mongodb_user
MONGO_PASSWORD=your_mongodb_password
JWT_SALT=your_jwt_salt
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_BUCKET_NAME=your_s3_bucket_name
```

**Do not commit your `.env` file to version control.**

---

## License
This project is licensed under the ISC License.
