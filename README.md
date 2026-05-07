# KJD ViSlides

A collaborative presentation and engagement platform built with React, Node.js, Express, and MongoDB.

## Features

- Interactive presentations with real-time engagement
- Live polling and Q&A functionality
- Student leaderboard and gamification
- Guest participant support
- Assignment management
- Real-time updates using Socket.io
- AI-powered features using Google's Gemini API

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community) or use MongoDB Atlas (cloud)
- **Git** - [Download](https://git-scm.com/)

## Environment Setup

### 1. Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```bash
PORT=5001
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_key_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**Getting Credentials:**

- **MONGO_URI**: 
  - Local: `mongodb://localhost:27017/vi-slides`
  - Cloud (MongoDB Atlas): Create a cluster and copy the connection string from your Atlas dashboard

- **JWT_SECRET**: Generate a random secret key (any strong random string)

- **GOOGLE_CLIENT_ID**: 
  1. Go to [Google Cloud Console](https://console.cloud.google.com/)
  2. Create a new project
  3. Enable the necessary APIs
  4. Create OAuth 2.0 credentials (Web application)
  5. Copy your Client ID

- **GEMINI_API_KEY**: 
  1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
  2. Create a new API key
  3. Copy and paste it here

### 2. Frontend Environment Variables

Create a `.env` file in the `frontend/` directory with the following variables:

```bash
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

## Installation

### Clone the Repository

```bash
git clone <repository-url>
cd KJD_vislides
```

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Ensure MongoDB is running (locally or via Atlas)
# Then start the development server
npm run dev
```

The backend server will run on `http://localhost:5001`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173` (or another available port shown in terminal)

## Running Both Frontend and Backend

### Option 1: Separate Terminals

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 2: Using npm-run-all (optional)

From the root directory, you can install a package manager:

```bash
npm install -g npm-run-all
```

Then create a `package.json` in the root with:

```json
{
  "scripts": {
    "dev": "npm-run-all --parallel dev:backend dev:frontend",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev"
  }
}
```

## Building for Production

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
```

This creates a `dist/` folder with optimized production-ready files.

## Project Structure

```
KJD_vislides/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── server.ts        # Express server entry point
│   │   ├── config/          # Database and Socket configuration
│   │   ├── controllers/     # Route handlers
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth and validation middleware
│   │   └── types/           # TypeScript type definitions
│   ├── uploads/             # File upload directory
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                # React/Vite application
│   ├── src/
│   │   ├── main.tsx         # React entry point
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API and Socket service
│   │   ├── contexts/        # React contexts (Auth, Theme)
│   │   └── assets/          # Images and static files
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
│
└── README.md
```

## API Documentation

The backend API provides the following main endpoints:

- **Auth**: `/api/auth/` - Login, Register, Google OAuth
- **Sessions**: `/api/session/` - Create and manage sessions
- **Questions**: `/api/question/` - Create and manage questions
- **Polls**: `/api/poll/` - Create and vote on polls
- **Submissions**: `/api/submission/` - Submit answers
- **Assignments**: `/api/assignment/` - Manage assignments
- **Guests**: `/api/guest/` - Guest participant management

## Technologies Used

### Backend
- Express.js - Web framework
- MongoDB - Database
- Mongoose - ODM
- Socket.io - Real-time communication
- JWT - Authentication
- Google Auth Library - OAuth authentication
- Google Generative AI - AI features
- Multer - File uploads
- Nodemailer - Email service

### Frontend
- React - UI framework
- Vite - Build tool
- TypeScript - Type safety
- Socket.io-client - Real-time communication
- Axios - HTTP client
- React Router - Navigation
- TailwindCSS or similar - Styling

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running locally (`mongod` command) or check your MongoDB Atlas connection string
- Verify the connection string in `.env` is correct

### Port Already in Use
- Backend: Change the `PORT` in `.env` to another available port
- Frontend: Vite will automatically try another port if 5173 is taken

### Google OAuth Issues
- Ensure `GOOGLE_CLIENT_ID` is correctly set in both `.env` files
- Check that your Google OAuth app is configured correctly in Google Cloud Console
- Verify redirect URIs are properly set up

### Module Not Found Errors
- Run `npm install` in the respective directory
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Commit: `git commit -m 'Add your feature'`
5. Push: `git push origin feature/your-feature`
6. Create a Pull Request

## License

This project is licensed under the ISC License - see the package.json file for details.

## Support

For issues or questions, please open an issue in the repository.
