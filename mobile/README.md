# SmartWaste Pro - Mobile App

React Native (Expo) app for sellers and buyers. See the [root README](../README.md) for the full project, architecture, Firebase/Stripe setup and known limitations.

```bash
npm install
cp .env.example .env    # fill in the Firebase values
npx expo start          # or: npm run web
npm run lint
npm test                # Jest
```

Other folders: `functions/` (Stripe Cloud Functions), `firestore.rules` (security rules), `components/ui/` (shared UI), `constants/` (design tokens).
