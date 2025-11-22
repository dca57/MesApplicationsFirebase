import React, { useState, useEffect } from "react";
import { initialProducts } from "../data/initialProducts";
import {
  seedInitialProducts,
  getInitialProducts,
} from "../services/initialProductService";
import { Plus } from "lucide-react";

const User_Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-slate-700 dark:text-slate-400">
        Vos préférences
      </h2>
      <p className="mb-2 text-slate-600 dark:text-slate-500"></p>
    </div>
  );
};

export default User_Settings;
