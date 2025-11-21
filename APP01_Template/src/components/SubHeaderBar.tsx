import React from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  CloudUpload,
  SquareStack,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const SubHeaderBar = () => {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <nav className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 h-12 items-center">
          <Link
            to="/"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center gap-2"
          >
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link
            to="/mesappsfirebase"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center gap-2"
          >
            <SquareStack size={18} /> MesApplications
          </Link>
          <Link
            to="/firestore"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center gap-2"
          >
            <Database size={18} /> Firestore
          </Link>
          <Link
            to="/storage"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center gap-2"
          >
            <CloudUpload size={18} /> Storage
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default SubHeaderBar;
