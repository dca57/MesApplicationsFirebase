# MonAPP_Vite_Firebase

Template professionnel React + Vite + Firebase + TailwindCSS.
Ce projet inclut une authentification complète, un système de thème sombre persistant, et des exemples d'intégration Firestore et Storage.

## 🚀 Fonctionnalités

- **Authentification** : Email/Password + Google Auth (Login, Register, Reset Password).
- **Sécurité** : Routes protégées (`ProtectedRoute`) et redirection automatique.
- **Base de données** : Exemple CRUD temps réel avec Firestore.
- **Stockage** : Upload d'images avec prévisualisation via Firebase Storage.
- **UI/UX** :
  - Design moderne avec **TailwindCSS**.
  - **Dark Mode** (persistant via localStorage + détection système).
  - Dashboard avec graphiques (Recharts).
  - Responsive design mobile-first.
- **Architecture** :
  - Context API pour Auth et Theme.
  - Séparation claire (Services, Pages, Components, Hooks).
  - Configuration Dev/Prod automatique.

## 🛠 Installation

1. **Cloner le projet**

   ```bash
   git clone https://github.com/votre-user/monapp-vite-firebase.git
   cd monapp-vite-firebase
   ```

2. **Installer les dépendances**

   ```bash
   npm install
   ```

3. **Configuration Firebase**

   Le projet utilise une logique conditionnelle dans `src/firebase/config.ts`.

   - **En DEV** : Les valeurs par défaut (placeholders) ou vos clés de dev en dur sont utilisées.
   - **En PROD** : Les variables d'environnement `import.meta.env.VITE_FIREBASE_*` sont utilisées.

   Créez un fichier `.env` à la racine pour vos tests locaux (optionnel si vous modifiez le code en dur pour le dev) :

   ```env
   VITE_FIREBASE_API_KEY=votre_api_key
   VITE_FIREBASE_AUTH_DOMAIN=votre_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=votre_project_id
   VITE_FIREBASE_STORAGE_BUCKET=votre_bucket.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
   VITE_FIREBASE_APP_ID=votre_app_id
   ```

4. **Lancer en développement**
   ```bash
   npm run dev
   ```

## 📁 Structure du projet

```
src/
├── components/       # Composants réutilisables (Navbar, ProtectedRoute...)
├── context/          # Contextes React (Auth, Theme)
├── firebase/         # Configuration et services Firebase (auth, db, storage)
├── hooks/            # Hooks personnalisés (useTheme, useAuth...)
├── pages/            # Pages de l'application
├── App.tsx           # Configuration du Router
└── main.tsx          # Point d'entrée
```

## 🔐 Authentification & Sécurité

Le contexte d'authentification (`AuthContext`) surveille l'état de l'utilisateur via `onAuthStateChanged`.
Le composant `<ProtectedRoute />` enveloppe les routes privées dans `App.tsx`. Si l'utilisateur n'est pas connecté, il est redirigé vers `/login`.

## 🌓 Dark Mode

Géré par `ThemeContext`.

- Au premier chargement : vérifie `localStorage`. Si vide, vérifie la préférence système du navigateur.
- Le bouton toggle dans la Navbar bascule la classe `.dark` sur la balise `<html>` et sauvegarde le choix.

## 📦 Déploiement (Vercel / Netlify)

Pour passer en production, configurez les variables d'environnement dans votre interface d'hébergeur (Vercel/Netlify) avec les clés exactes définies dans le fichier `.env.example` ci-dessus.

```bash
npm run build
```

---

_Généré par votre Assistant Senior React Engineer_
