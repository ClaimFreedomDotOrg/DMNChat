# DMN Chat - Frontend

AI-powered conversational interface for exploring the Neuro-Gnostic framework.

## Running Locally

### Prerequisites

- Node.js 20+ (or 18+ with warnings)
- Firebase project (for full features)

### Quick Start

```bash
# Install dependencies
cd frontend
npm install

# Start dev server
npm run dev
```

The app will run at `http://localhost:5173`

### Guest Mode

The app works immediately in **guest mode** without Firebase configuration:

- Chat interface fully functional
- Messages are client-side only (not saved)
- No authentication required
- Repository manager UI is available but non-functional

### Firebase Setup (Optional)

To enable full features (auth, persistence, AI responses):

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)

2. Enable services:
   - Firebase Authentication (Email/Password)
   - Cloud Firestore
   - Cloud Storage
   - Cloud Functions

3. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

4. Fill in your Firebase config in `.env.local`:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. Deploy Firebase Cloud Functions (from project root):

   ```bash
   cd ../firebase-functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

6. Restart the dev server

## Project Structure

```markdown
frontend/
├── src/
│   ├── components/
│   │   ├── auth/          # Authentication components
│   │   ├── chat/          # Chat interface components
│   │   └── admin/         # Admin components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API and Firebase services
│   ├── types/             # TypeScript definitions
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── index.html             # HTML entry
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
└── package.json           # Dependencies
```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

## Environment Variables

Required for full functionality:

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Optional
VITE_FIREBASE_MEASUREMENT_ID=  # For Analytics
VITE_SENTRY_DSN=                # For error tracking
```

## Troubleshooting

**Tailwind styles not working:**

- Ensure `tailwind.config.js` and `postcss.config.js` exist
- Restart dev server after config changes

**Firebase errors:**

- Check `.env.local` configuration
- Verify Firebase project has required services enabled
- Check browser console for specific error messages

**TypeScript errors:**

- Run `npm run type-check` to see all errors
- Ensure all dependencies are installed

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [Project Architecture](../ARCHITECTURE.md)
