# Project Setup Guide

This guide will help you set up and run the **Leet** project from scratch.

## Project Overview

**Leet** is a coding problem platform with:
- User authentication (signup/login with email or username)
- Problem solving with code editor
- Admin panel to monitor user activities and suspicious logs
- Proctoring system to detect cheating/suspicious behavior
- Dashboard to track user progress

## Prerequisites

Before starting, ensure you have installed:
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **SQLite** (optional, for DB inspection)
- A code editor (VS Code recommended)

## Installation Steps

### Step 1: Clone/Extract the Project

```bash
# Navigate to the project directory
cd /path/to/Leet
```

### Step 2: Install Dependencies

```bash
# Install all npm packages for the project
npm install
```

This will download and install all required packages from `package.json`.

### Step 3: Seed Admin User (Required Before Running Server)

Before starting the server for the first time, seed the admin user. This creates admin credentials in your local database.

```bash
# Seed admin user (creates admin/admin123 in logs/proctor.db)
npm run seed

# Optionally include sample logs for testing
SEED_SAMPLE_DATA=true npm run seed

# Or use custom admin credentials
ADMIN_USER=alice ADMIN_PASS=MySecretPass123 npm run seed
```

You should see output like:
```
🌱 Seeding database...
✅ Created admin user: admin (password: admin123)
✨ Database seeding complete!
```

**Important:** This step creates your local `logs/proctor.db` file with admin credentials. This database is **never shared** via Git — each clone gets its own fresh database.

### Step 4: Configure Environment Variables (Optional)

Create a `.env` file in the project root with custom credentials:

```bash
# Create .env file
cat > .env << 'EOF'
ADMIN_USER=admin
ADMIN_PASS=admin123
JWT_SECRET=your-secret-key-here
PORT=4000
EOF
```

**Default values** (if `.env` is not created):
- Admin Username: `admin`
- Admin Password: `admin123`
- Server Port: `4000`

### Step 5: Start the Backend Server

```bash
# Terminal 1: Start backend server
npm run server
```

You should see:
```
Server listening on http://localhost:4000
```

### Step 6: Start the Frontend Dev Server

```bash
# Terminal 2: Start frontend (keep terminal 1 running)
npm run dev
```

You should see:
```
VITE v5.4.2 ready in XXX ms
➜ Local: http://localhost:5177/
```

Open the URL in your browser (e.g., `http://localhost:5177/`).

## Using the Application

### User Signup/Login

1. **Sign Up (New User)**
   - Click "Sign In" in the top-right
   - Click "Don't have an account? Sign Up"
   - Enter: Full Name, Username, Email, Password
   - Click "Sign Up"
   - You'll be automatically logged in and redirected to Problems page

2. **Sign In (Existing User)**
   - Click "Sign In"
   - Enter: Email or Username, Password
   - Click "Sign In"

### Admin Access

1. **Default Admin Credentials**
   - Username: `admin`
   - Password: `admin123`

2. **Login as Admin**
   - Click "Admin" in the navbar (if not logged in, you'll see Admin Login page)
   - Enter admin credentials
   - You'll be taken to Admin Panel (no navbar shown)

3. **Admin Panel Features**
   - **Users List**: See all registered users
   - **View Logs**: Click "View Logs" next to a user to see their suspicious activity logs
   - **Live Updates**: Enable "Live" checkbox to see real-time log updates
   - **Export Logs**: Download logs as JSON
   - **Logout**: Red button to log out

### User Dashboard

1. Navigate to **Dashboard** (after login)
2. See your:
   - Full Name and Email
   - Problems solved count
   - Current streak
   - Global ranking
   - Total attempts

### Profile

1. Click **Profile** in top-right (user icon)
2. View or edit your profile information

## Testing the Full Flow

### Test 1: User Signup → Dashboard → Admin View

```bash
# Terminal 3: Test signup (if servers are running)
curl -X POST http://localhost:4000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","username":"john","email":"john@example.com","password":"pass123"}'
```

Expected response:
```json
{
  "ok": true,
  "token": "eyJ...",
  "user": {"id":X, "username":"john", "email":"john@example.com", "name":"John Doe", "is_admin":0}
}
```

### Test 2: User Login

```bash
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"pass123"}'
```

### Test 3: Admin Login and View Users

```bash
# Login as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# View all users
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/admin/users

# View specific user's logs (replace :id with user ID)
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/admin/users/2/logs
```

## Database

The project uses **SQLite** for data storage. Database file location:

```bash
logs/proctor.db
```

### Inspect Database (Optional)

```bash
# Open SQLite console
sqlite3 logs/proctor.db

# List all users
sqlite> SELECT id, name, username, email, is_admin, created_at FROM users;

# View admin credentials
sqlite> SELECT username, email FROM users WHERE is_admin=1;

# Exit
sqlite> .quit
```

## Project Structure

```
Leet/
├── server/
│   ├── index.js          # Backend API endpoints (signup, login, admin routes)
│   └── db.js             # Database schema and initialization
├── src/
│   ├── App.tsx           # Main app component
│   ├── components/
│   │   ├── AuthModal.tsx      # Signup/Login form
│   │   ├── AdminLogin.tsx     # Admin-only login page
│   │   ├── AdminPanel.tsx     # Admin dashboard (users & logs)
│   │   ├── Dashboard.tsx      # User dashboard
│   │   ├── Navbar.tsx         # Navigation bar
│   │   └── ...                # Other components
│   ├── contexts/
│   │   └── AuthContext.tsx    # Authentication state management
│   └── lib/
│       └── localdb.ts         # Local storage helper
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
└── tsconfig.json         # TypeScript configuration
```

## Available Scripts

```bash
# Seed admin user in local database (required on first setup)
npm run seed

# Start backend server
npm run server

# Start frontend dev server
npm run dev

# Build for production
npm run build

# Run TypeScript type checking
npm run typecheck

# Run ESLint
npm run lint

# Preview production build
npm run preview
```

## Troubleshooting

### Port Already in Use

If port 4000 (backend) or 5173 (frontend) is in use:

```bash
# Find process using port 4000
lsof -i :4000

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Frontend will automatically use next available port (5174, 5175, etc.)
```

### Database Lock Issues

If you get database lock errors:

```bash
# Delete existing database and restart (it will reseed)
rm logs/proctor.db
npm run server
```

### Module Not Found

If you get "module not found" errors after setup:

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### Server Won't Start

Check if Node.js is properly installed:

```bash
node --version
npm --version
```

Both should return version numbers (e.g., v18.0.0, 9.0.0).

## Sending the Project

### Option 1: Git Repository (Recommended)

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Leet project"

# Push to GitHub/GitLab
# Then share the repo URL with others
```

### Option 2: ZIP File

```bash
# Create ZIP file
zip -r Leet.zip Leet/

# Share Leet.zip file
```

Recipient instructions:
1. Extract the ZIP file
2. Run `npm install`
3. Follow "Installation Steps" above

### Option 3: Sync Folder

Use cloud storage (Google Drive, Dropbox, OneDrive):
1. Upload the entire `Leet/` folder
2. Share the link with recipient
3. Recipient downloads and follows setup steps

## Important Notes

- **Admin credentials** are created locally via `npm run seed` and stored in your clone's `logs/proctor.db` only.
- **Database** (`logs/proctor.db`) is created on first server run after seeding. It is **never shared** via Git.
- **Logs folder** (`logs/`) is tracked (empty placeholder `.gitkeep` present) so it exists after clone, but database files remain local to each clone.
- **Port 4000 and 5173** must be available on the machine.
- **Fresh clones**: When someone clones this repo, they get no credentials. They must run `npm run seed` first to create admin locally.
- **Data isolation**: Each clone has its own separate `logs/proctor.db` file. Sign-ups in one clone do not appear in another clone's database.

## Next Steps

After setup is complete:
- Create test accounts and explore features
- Check the admin panel to view user activities
- Modify `.env` to customize admin credentials
- Deploy to production when ready

## Support

If you encounter issues:
1. Check error messages in terminal
2. Verify Node.js is installed (`node --version`)
3. Ensure all dependencies are installed (`npm install`)
4. Check that servers are running on correct ports
5. Clear browser cache and reload page

---

**Happy coding!** 🚀
