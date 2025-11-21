import React, { useState, useEffect } from "react";
import {
  addDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
} from "../firebase/firestore";
import { Plus, Save, X, Trash2, ChevronLeft, CircleOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-600 bg-opacity-90 dark:bg-slate-900 dark:bg-opacity-90 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md animate-fade-in-up">
        <div className="flex justify-between items-center p-4 border-b border-slate-700 dark:border-slate-400">
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-400">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

interface Produit {
  id: string;
  nom: string;
  description?: string;
  rayonId?: string;
  userId: string;
}

interface ListItem {
  id: string;
  nom: string;
  userId: string;
  produits: {
    produitId: string;
    achete: boolean;
  }[];
}

const LISTES_COLLECTION_NAME = "Listes";
const PRODUITS_COLLECTION_NAME = "Produits";

const ListesDetails = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentList, setCurrentList] = useState<ListItem | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Produit[]>([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    if (!user || !id) return;

    const unsubscribeList = subscribeToCollection(
      LISTES_COLLECTION_NAME,
      (data) => {
        const list = (data as ListItem[]).find(
          (list) => list.id === id && list.userId === user.uid
        );
        setCurrentList(list || null);
      }
    );

    const unsubscribeProducts = subscribeToCollection(
      PRODUITS_COLLECTION_NAME,
      (data) => {
        setAvailableProducts(
          (data as Produit[]).filter((prod) => prod.userId === user.uid)
        );
      }
    );

    return () => {
      unsubscribeList();
      unsubscribeProducts();
    };
  }, [user, id]);

  const handleAddProductToList = async () => {
    if (!selectedProductToAdd || !currentList) return;

    const listToUpdate = { ...currentList };
    const existingProductIndex = listToUpdate.produits.findIndex(
      (p) => p.produitId === selectedProductToAdd
    );

    const updatedProducts = [...listToUpdate.produits];

    if (existingProductIndex === -1) {
      updatedProducts.push({
        produitId: selectedProductToAdd,
        achete: false,
      });
    }

    try {
      await updateDocument(LISTES_COLLECTION_NAME, currentList.id, {
        produits: updatedProducts,
      });
      setSelectedProductToAdd("");
      setShowProductModal(false);
    } catch (error) {
      alert("Erreur lors de l'ajout du produit à la liste");
    }
  };

  const handleToggleProductBought = async (produitId: string) => {
    if (!currentList) return;

    const listToUpdate = { ...currentList };
    const updatedProducts = listToUpdate.produits.map((p) =>
      p.produitId === produitId ? { ...p, achete: !p.achete } : p
    );

    try {
      await updateDocument(LISTES_COLLECTION_NAME, currentList.id, {
        produits: updatedProducts,
      });
    } catch (error) {
      alert("Erreur lors de la mise à jour du statut du produit");
    }
  };

  const handleUncheckAllProducts = async () => {
    if (!currentList) return;

    const listToUpdate = { ...currentList };
    const updatedProducts = listToUpdate.produits.map((p) => ({
      ...p,
      achete: false,
    }));

    try {
      await updateDocument(LISTES_COLLECTION_NAME, currentList.id, {
        produits: updatedProducts,
      });
    } catch (error) {
      alert("Erreur lors de la décochage de tous les produits");
    }
  };

  const handleRemoveProductFromList = async (produitId: string) => {
    if (!currentList) return;

    const listToUpdate = { ...currentList };
    const updatedProducts = listToUpdate.produits.filter(
      (p) => p.produitId !== produitId
    );

    try {
      await updateDocument(LISTES_COLLECTION_NAME, currentList.id, {
        produits: updatedProducts,
      });
    } catch (error) {
      alert("Erreur lors de la suppression du produit de la liste");
    }
  };

  const getProductName = (produitId: string) => {
    const produit = availableProducts.find((p) => p.id === produitId);
    return produit ? produit.nom : "Produit inconnu";
  };

  if (!currentList) {
    return (
      <div className="max-w-full mx-2 sm:max-w-2xl sm:mx-auto lg:max-w-4xl text-center py-6 sm:py-10 text-slate-700 dark:text-slate-400 italic text-sm sm:text-base">
        Chargement de la liste ou liste introuvable...
      </div>
    );
  }

  return (
    <div className="max-w-full mx-2 sm:max-w-2xl sm:mx-auto lg:max-w-4xl">
      <div className="flex items-center justify-between mb-4 sm:mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-700 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors rounded-md"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-slate-400 text-center flex-grow">
          {currentList.nom}
        </h2>
        <div className="w-10"></div> {/* Placeholder for alignment */}
      </div>

      <div className="mb-4 sm:mb-8 flex gap-2">
        <button
          onClick={() => setShowProductModal(true)}
          className="w-4/5 bg-blue-600 hover:bg-blue-700 text-slate-300 font-bold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={20} /> Ajouter un produit
        </button>
        <button
          onClick={handleUncheckAllProducts}
          className="w-1/5 bg-yellow-500 dark:bg-yellow-700 hover:bg-yellow-600 text-slate-900 font-bold py-2 px-1 rounded-md flex items-center justify-center gap-2 transition-colors"
          title="Décocher tous les produits"
        >
          <CircleOff size={20} />
        </button>
      </div>

      {/* Liste des produits dans la liste */}
      {currentList.produits.length > 0 && (
        <div className="bg-slate-200 dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md border border-slate-700 dark:border-slate-400">
          <h4 className="font-semibold text-sm sm:text-base text-slate-700 dark:text-slate-400 mb-2">
            Produits de la liste :
          </h4>
          <ul className="grid gap-2">
            {currentList.produits.map((p) => (
              <li
                key={p.produitId}
                className="flex items-center justify-between bg-slate-300 dark:bg-slate-700 p-2 rounded-md cursor-pointer"
                onClick={() => handleToggleProductBought(p.produitId)}
              >
                <span
                  className={`text-sm text-slate-700 dark:text-slate-400 flex items-center gap-2 ${
                    p.achete
                      ? "line-through text-slate-700 dark:text-slate-400"
                      : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={p.achete}
                    readOnly // Rendu en lecture seule car le clic est sur le li parent
                    className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-slate-600 dark:border-slate-500"
                  />
                  {getProductName(p.produitId)}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Empêche l'événement de clic sur le parent
                      handleRemoveProductFromList(p.produitId);
                    }}
                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title="Ajouter un produit à la liste"
      >
        <div className="flex flex-col sm:flex-row gap-2 items-end">
          <div className="flex-grow w-full">
            <label
              htmlFor="productToAdd"
              className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-400 mb-1"
            >
              Sélectionner un produit
            </label>
            <select
              id="productToAdd"
              value={selectedProductToAdd}
              onChange={(e) => setSelectedProductToAdd(e.target.value)}
              className="w-full px-3 py-1.5 sm:px-4 sm:py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Sélectionner un produit</option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.nom}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddProductToList}
            className="bg-green-600 hover:bg-green-700 text-slate-300 dark:text-slate-300 py-1.5 px-3 sm:py-2 sm:px-4 rounded-md transition-colors flex items-center gap-1 disabled:opacity-50 text-sm"
            disabled={!selectedProductToAdd}
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ListesDetails;
