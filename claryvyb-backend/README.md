
📖 ClaryVyb Backend (MVP)

A lightweight backend for the ClaryVyb Chrome Extension MVP built with Node.js (Express) and MongoDB.
It provides:

User authentication (JWT)

Secure storage of user Groq API keys (AES encryption)

Prompt endpoints (clarify / concise) powered by Groq llama-3.1-8b-instant

Minimalist MVP flow (no history, freemium-ready)

🏗️ Architecture
Tech Stack

Node.js (Express) – REST API framework

MongoDB (Mongoose) – user persistence

JWT – auth tokens

Crypto (AES-256-CBC) – encrypt user API keys before saving

Axios – API calls to Groq

dotenv – environment management

Folder Structure
claryvyb-backend/
│
├── server.js               # Entry point (Express app)
├── package.json
├── .env                    # Secrets (DB URI, JWT, Encryption key)
│
├── config/
│   └── db.js               # MongoDB connection
│
├── models/
│   └── User.js             # User schema
│
├── middleware/
│   └── auth.js             # JWT middleware
│
├── utils/
│   └── crypto.js           # Encrypt/decrypt API keys
│
├── services/
│   └── groqService.js      # Groq API wrapper
│
├── controllers/
│   ├── authController.js   # Register/Login
│   ├── userController.js   # Save API key
│   └── promptController.js # Clarify/Concise endpoints
│
└── routes/
    ├── authRoutes.js
    ├── userRoutes.js
    └── promptRoutes.js


    🔐 Authentication Flow

Register

Endpoint: POST /api/auth/register

Body: { "email": "user@example.com", "password": "password123" }

Response: { success: true, user }

Login

Endpoint: POST /api/auth/login

Body: { "email": "user@example.com", "password": "password123" }

Response: { "token": "<JWT_TOKEN>" }

Authenticated Requests

Must send:

Authorization: Bearer <JWT_TOKEN>

🔑 User API Key Flow

Users bring their own Groq API key.
We encrypt it before storing in MongoDB.

Save API Key

Endpoint: POST /api/user/apikey

Headers: Authorization: Bearer <JWT_TOKEN>

Body: { "apiKey": "gsk-1234abcd..." }

Response: { success: true, message: "API key saved securely" }

🔒 Stored as AES-encrypted string.

Use in Prompts

Backend decrypts key only at runtime.

Then forwards requests to Groq API.

✍️ Prompt Endpoints
Clarify Prompt

Endpoint: POST /api/prompt/clarify

Headers: Authorization: Bearer <JWT_TOKEN>

Body:

{ "input": "I want to build a mobile app for note taking" }


Response:

{
  "output": "Here’s a structured breakdown of your request..."
}

Concise Prompt

Endpoint: POST /api/prompt/concise

Headers: Authorization: Bearer <JWT_TOKEN>

Body:

{ "input": "Make me a list of ways to write better code using AI tools" }


Response:

{
  "output": "How to use AI for cleaner code: ..."
}

🗄️ Database Schema
User
{
  _id: ObjectId,
  email: String,   // unique
  password: String, // hashed with bcrypt
  apiKey: String,   // AES encrypted Groq key
  createdAt: Date,
  updatedAt: Date
}

🔒 Security Notes

Passwords stored with bcrypt (salted, hashed).

API Keys encrypted with AES-256-CBC before saving.

JWT expires after 7 days.

No raw API key is ever logged or returned.

🌍 Deployment

Options for free-tier MVP:

Render / Railway / Fly.io → free Node.js hosting

MongoDB Atlas → free tier cluster

Railway / Render can handle .env secrets

📈 Next Steps (Post-MVP)

Add prompt history with pagination

Add team/workspace support

Subscription billing (Stripe, LemonSqueezy)

Optional: shared demo Groq key for onboarding

🛠️ Example Client Workflow (Extension)

Register or login → receive JWT.

Save API key via /api/user/apikey.

Send prompt → backend fetches Groq → returns response.

User never pastes API key again.

📚 References

Express Docs

Mongoose Docs

Groq API Reference

JWT Guide

Node.js Crypto AES

✅ With this documentation, another dev could spin up the backend, understand its flow, and connect the Chrome extension in one go.


================================
Core Packages
Server & Framework

express → Web server & routing.

cors → Allow requests from your extension/frontend.

dotenv → Load environment variables from .env.

Database

mongoose → ODM for MongoDB (models, schemas, queries).

Authentication & Security

bcrypt → Hash passwords before saving to DB.

jsonwebtoken → Generate and verify JWTs for auth.

crypto → Node’s built-in module for encrypting/decrypting API keys (no need to install separately, comes with Node).

Validation

joi or express-validator → For validating incoming requests (e.g., emails, passwords, API key format).

📦 Developer Experience

nodemon (dev only) → Auto-restarts server during development.

📦 Optional (but recommended)

helmet → Secure HTTP headers.

morgan → Request logger (useful during dev/debugging).

compression → Gzip responses (saves bandwidth).

rate-limit (express-rate-limit) → Protect your auth routes from brute-force attacks.
