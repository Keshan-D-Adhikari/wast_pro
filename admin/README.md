# SmartWaste Pro - Admin Dashboard

React + Vite web dashboard for administrators. See the [root README](../README.md) for the full project.

Pages: Overview, Bin Status, Users, Marketplace, Orders. Only accounts with `role: "admin"` in the Firestore `users` collection can sign in.

```bash
npm install
cp .env.example .env    # fill in the Firebase values
npm run dev             # start the dev server
npm run lint
npm test                # Vitest
npm run build
```
