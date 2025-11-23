import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";

const Admin_Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  return (
    <div className="space-y-2 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
          Admin Settings
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Gestion des paramètres de l'application.
        </p>
      </div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-8"></div>
    </div>
  );
};

export default Admin_Settings;
