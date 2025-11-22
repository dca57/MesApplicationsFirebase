import React, { useState, useEffect } from "react";
import { initialProducts } from "../data/initialProducts";
import {
  seedInitialProducts,
  getInitialProducts,
} from "../services/initialProductService";
import { Plus } from "lucide-react";

const Admin_Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [productCount, setProductCount] = useState<number>(0);

  const fetchProductCount = async () => {
    try {
      const products = await getInitialProducts();
      setProductCount(products.length);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du nombre de produits :",
        error
      );
      setProductCount(0);
    }
  };

  useEffect(() => {
    fetchProductCount();
  }, []); // Exécuter une seule fois au chargement du composant

  const handleSeedProducts = async () => {
    setLoading(true);
    setMessage(null);
    setIsSuccess(null);
    try {
      await seedInitialProducts(initialProducts);
      setMessage("Collection APP_PREFIX_Produits_Init peuplée avec succès !");
      setIsSuccess(true);
      fetchProductCount(); // Mettre à jour le compte après le peuplement
    } catch (error) {
      console.error("Erreur lors du peuplement de la collection :", error);
      setMessage("Erreur lors du peuplement de la collection.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-slate-700 dark:text-slate-400">
        Réglages Admin
      </h2>
      <p className="mb-2 text-slate-600 dark:text-slate-500">
        Il y a actuellement{" "}
        <span className="font-bold text-slate-800 dark:text-slate-200">
          {productCount}
        </span>{" "}
        produits en base dans la collection APP_PREFIX_Produits_Init.
      </p>
      <p className="mb-4 text-slate-600 dark:text-slate-500">
        Cliquez sur le bouton ci-dessous pour peupler la collection
        "APP01_Produits_Init" dans Firebase avec les produits prédéfinis.
      </p>
      <p className="mb-4 text-slate-600 dark:text-slate-500">
        Cette opération supprime et recrée la collection avec la liste actuelle.
      </p>
      <button
        onClick={handleSeedProducts}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-slate-300 font-bold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
      >
        {loading ? (
          "Peuplement en cours..."
        ) : (
          <>
            <Plus size={20} /> Peupler les produits initiaux
          </>
        )}
      </button>
      {message && (
        <div
          className={`mt-4 p-3 rounded-md ${
            isSuccess
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default Admin_Settings;
