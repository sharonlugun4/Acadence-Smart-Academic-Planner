# Acadence — Smart-Academic-Planner


A full-stack academic task planner built with React + Vite, Node.js + Express, and MySQL.

## Features
- Register and log in (bcrypt password hashing, JWT authentication)
- Add, edit, delete, complete, and filter academic tasks
- Smart Next Task sorting by priority and deadline
- Upcoming and overdue deadline indicators
- Dashboard statistics and weekly study hours
- Pomodoro timer with saved focus sessions
- Responsive pastel dashboard UI

## Requirements
- Node.js 20+ (18+ should also work)
- MySQL Server and MySQL Workbench (or another MySQL client)
- VS Code

## 1. Create the database
Open MySQL Workbench, connect to your local MySQL server, open `database/studysync.sql`, and run the entire script.

It creates the `studysync` database and tables.

## 2. Configure the backend
Open a terminal in the project folder:

```bash
cd server
npm install
```

Copy `.env.example` to `.env`, then edit the values to match your MySQL installation. On Windows Command Prompt:

```bat
copy .env.example .env
```

Example `.env`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=studysync
JWT_SECRET=replace_this_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

Start backend:
```bash
npm run dev
```
It should report that the API is running on port 5000.

## 3. Configure the frontend
Open a second terminal from the project root:

```bash
cd client
npm install
npm run dev
```

Open the URL Vite prints, normally `http://localhost:5173`.

## 4. First use
Register an account. Your tasks and study sessions are stored in MySQL. Each account can access only its own tasks.

## Troubleshooting
- `ER_ACCESS_DENIED_ERROR`: check `DB_USER` and `DB_PASSWORD` in `server/.env`.
- `ECONNREFUSED`: make sure MySQL Server is running and `DB_PORT` is correct.
- `Unknown database 'studysync'`: run `database/studysync.sql`.
- Port 5000 already in use: change `PORT` in `.env` and update `client/src/api.js` to match.
- `npm.ps1 cannot be loaded` in PowerShell: use `npm.cmd install` and `npm.cmd run dev`.
- If `npm run dev` says `package.json` is missing, first `cd` into the `server` or `client` folder as appropriate.

## Project structure
```text
studysync/
├── database/studysync.sql
├── server/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── db.js
│       ├── middleware/auth.js
│       ├── routes/auth.js
│       ├── routes/tasks.js
│       ├── routes/sessions.js
│       └── server.js
└── client/
    ├── package.json
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api.js
        └── styles.css
```

## Security notes
- Never publish your `.env` file or JWT secret.
- This is a student project starter. Before public deployment, add rate limiting, email verification, password reset, stronger validation, and HTTPS.
