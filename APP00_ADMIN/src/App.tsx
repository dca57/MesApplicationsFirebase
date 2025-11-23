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
import LeftBar from "./components/LeftBar";

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

import Admin_Settings from "./pages_template/Admin_Settings";
import User_Settings from "./pages_template/User_Settings";
import Admin_LightDarkMode from "./pages_template/Admin_LightDarkMode";

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300">
            <HeaderBar />
            <LeftBar />
            <div className="ml-64">
              <main className="px-2 py-2">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Private Routes OBLIGATOIRE d'avoir une route sur / (même une page bidon) */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Dashboard />} />
                  </Route>

                  {/* Private Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route
                      path="/mesappsfirebase"
                      element={<MesApplications />}
                    />
                  </Route>

                  {/* Private Routes for List Details */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/firestore" element={<FirestoreExample />} />
                  </Route>

                  {/* Private Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/storage" element={<StorageExample />} />
                  </Route>

                  {/* Private Routes for Admin Settings */}
                  <Route element={<ProtectedRoute />}>
                    <Route
                      path="/admin-settings"
                      element={<Admin_Settings />}
                    />
                  </Route>

                  <Route element={<ProtectedRoute />}>
                    <Route
                      path="/admin-lightdarkmode"
                      element={<Admin_LightDarkMode />}
                    />
                  </Route>

                  {/* Private Routes for User Settings */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/user-settings" element={<User_Settings />} />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
