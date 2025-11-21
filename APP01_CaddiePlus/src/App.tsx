import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import HeaderBar from "./components/HeaderBar";
import ProtectedRoute from "./components/ProtectedRoute";
import FooterBar from "./components/FooterBar"; // Import de FooterBar

// Pages
// Pages Template (Login, Register, ResetPassword)
import Login from "./pages_template/Login";
import Register from "./pages_template/Register";
import ResetPassword from "./pages_template/ResetPassword";
// Pages Applications
import FirestoreExample from "./pages/FirestoreExample";
import Listes from "./pages/Listes";
import Produits from "./pages/Produits";
import ListesDetails from "./pages/Listes_Details";

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-slate-200 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300">
            <HeaderBar />
            <main className="max-w-full mx-2 px-2 sm:max-w-2xl sm:mx-auto sm:px-4 lg:max-w-4xl lg:px-6 py-4 sm:py-6 lg:py-8 pb-14 sm:pb-16">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Private Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/firestore" element={<FirestoreExample />} />
                </Route>

                {/* Private Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/listes" element={<Listes />} />
                </Route>

                {/* Private Routes for List Details */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/listes/:id" element={<ListesDetails />} />
                </Route>

                {/* Private Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/produits" element={<Produits />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <FooterBar /> {/* Appel de FooterBar en dehors de main */}
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
