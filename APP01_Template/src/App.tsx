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
import SubHeaderBar from "./components/SubHeaderBar";

// Pages
// Pages Template (Login, Register, ResetPassword)
import Login from "./pages_template/Login";
import Register from "./pages_template/Register";
import ResetPassword from "./pages_template/ResetPassword";
// Pages Applications
import Dashboard from "./pages/Dashboard";
import MesApplications from "./pages/MesApplications";
import FirestoreExample from "./pages/FirestoreExample";
import StorageExample from "./pages/StorageExample";

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300">
            <HeaderBar />
            <SubHeaderBar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Private Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route
                    path="/mesappsfirebase"
                    element={<MesApplications />}
                  />
                  <Route path="/firestore" element={<FirestoreExample />} />
                  <Route path="/storage" element={<StorageExample />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;