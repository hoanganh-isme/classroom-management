# Classroom Management

A full-stack classroom management application for instructors and students.

The system supports role-based authentication, student management, lesson assignment, student task tracking, profile management, and real-time messaging between instructors and students.

## Tech Stack

**Frontend**
- React
- Vite
- Axios
- Socket.io Client

**Backend**
- Node.js
- Express
- Socket.io
- Firebase Admin SDK
- JWT
- bcrypt

**Services**
- Firebase Firestore
- Twilio
- Nodemailer / SMTP

---

## Architecture

The project is separated into a React client and an Express API server.

```text
classroom-management/
├── client/
│   └── src/
│       ├── api/            # HTTP API clients
│       ├── components/     # Reusable UI and feature components
│       ├── pages/          # Application pages
│       ├── socket/         # Socket.io client
│       ├── utils/          # Shared utilities
│       └── App.jsx
│
└── server/
    └── src/
        ├── config/         # Firebase and application configuration
        ├── middleware/     # Authentication and authorization
        ├── modules/
        │   ├── auth/
        │   ├── instructor/
        │   ├── student/
        │   └── chat/
        ├── services/       # Shared infrastructure services
        ├── socket/         # Socket.io initialization
        └── server.js
```

The backend follows a layered module structure:

```text
Route
  ↓
Authentication / Authorization
  ↓
Controller
  ↓
Service
  ↓
Firestore
```

Authentication is JWT-based. Instructor and student endpoints are protected by role-based authorization.

Real-time chat uses a separate Socket.io layer:

```text
React
  ↓
Socket.io Client
  ↓
JWT Socket Authentication
  ↓
Chat Handlers
  ↓
Chat Service
  ↓
Firestore
```

The current backend is organized into `auth`, `instructor`, `student`, and `chat` modules, with Socket.io initialization separated under `server/src/socket`. 

---

## Getting Started

### Prerequisites

Make sure the following are installed/configured:

- Node.js
- npm
- Firebase project with Firestore
- Firebase Admin service account
- Twilio account if real SMS delivery is required
- SMTP account if real email delivery is required

Clone the repository:

```bash
git clone https://github.com/hoanganh-isme/classroom-management.git
cd classroom-management
```

---

### Backend

Install dependencies:

```bash
cd server
npm install
```

Place the Firebase service account file at:

```text
server/serviceAccountKey.json
```

Create:

```text
server/.env
```

Example:

```env
PORT=3000
CLIENT_URL=http://localhost:5173

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h

SMS_MODE=console
EMAIL_MODE=console

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

For local development, `SMS_MODE=console` and `EMAIL_MODE=console` can be used to print verification codes and setup links in the backend terminal.

Start the API server:

```bash
npm run dev
```

Backend:

```text
http://localhost:3000
```

---

### Frontend

Open another terminal:

```bash
cd client
npm install
```

Create `.env` from `.env.example`.

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SHOW_DEMO_NAV=false
```

Start the frontend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## Running the Project

The application requires two processes:

```text
Terminal 1
└── server/
    └── npm run dev

Terminal 2
└── client/
    └── npm run dev
```

Then open:

```text
http://localhost:5173
```

Instructor accounts are identified by users stored in Firestore with:

```text
role: instructor
status: active
```

Students are created by an instructor and complete their account setup through the verification link sent to their registered email.

---

## Production Build

Build the frontend with:

```bash
cd client
npm run build
```