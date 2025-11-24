import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { Mail, Lock, Globe, Key, AlertTriangle } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Récupération robuste du domaine
  const currentDomain = window.location.host || window.location.hostname;
  const origin = window.location.origin;

  // Vérification de la config
  const apiKey = auth.app.options.apiKey || "";
  const isConfigured =
    apiKey && apiKey !== "dummy" && !apiKey.startsWith("REMPLACEZ_MOI");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isConfigured) {
      setError("Configuration manquante. Modifiez src/firebase/config.ts");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err: any) {
      console.error("Email Login Error:", err);
      setError(err.message || "Failed to login");
    }
  };

  const handleGoogleLogin = async () => {
    setError("");

    if (!isConfigured) {
      setError("Configuration manquante. Modifiez src/firebase/config.ts");
      return;
    }

    console.log("[Login] Start Google Auth...");
    console.log("[Login] Domain:", currentDomain);

    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Ajout dans Firestore si nouvel utilisateur Google
      const { db } = await import("../firebase/config");
      const { doc, setDoc, serverTimestamp, getDoc } = await import(
        "firebase/firestore"
      );
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: result.user.email,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          displayName: result.user.displayName || "",
        });
      } else {
        // Met à jour la date de dernière connexion
        await setDoc(
          userRef,
          {
            lastLoginAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      navigate("/");
    } catch (err: any) {
      console.error("---------- GOOGLE AUTH ERROR ----------");
      console.error(err);

      let msg = "Erreur inconnue.";
      if (err.code === "auth/configuration-not-found") {
        msg =
          "CLÉ API INVALIDE. La clé dans src/firebase/config.ts n'existe pas chez Google.";
      } else if (err.code === "auth/unauthorized-domain") {
        msg = `DOMAINE NON AUTORISÉ. Ajoutez ce domaine dans Firebase : ${currentDomain}`;
      } else if (err.code === "auth/popup-closed-by-user") {
        msg = "Connexion annulée.";
      } else {
        msg = err.message;
      }
      setError(msg);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-900 dark:text-white">
          Connexion
        </h2>

        {/* Alerte Configuration */}
        {!isConfigured && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex flex-col gap-2 animate-pulse">
            <div className="flex items-center gap-2 text-red-700 font-bold">
              <AlertTriangle size={20} />
              <span>CONFIGURATION REQUISE</span>
            </div>
            <p className="text-sm text-red-600">
              L'application n'a pas de clés Firebase valides.
            </p>
            <div className="text-xs font-mono bg-red-100 p-2 rounded mt-1">
              Ouvrez <strong>src/firebase/config.ts</strong> et collez vos clés.
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded relative text-sm break-words">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="votre@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!isConfigured}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Se connecter
          </button>
        </form>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">
              Ou
            </span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={!isConfigured}
          className="mt-6 w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium py-2 px-4 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Connexion avec Google
        </button>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            Pas de compte ?{" "}
          </span>
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            S'inscrire
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;