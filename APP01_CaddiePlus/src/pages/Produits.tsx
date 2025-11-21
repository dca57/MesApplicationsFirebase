import React, { useState, useEffect } from "react";
import {
  addDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
} from "../firebase/firestore";
import { Plus, Save, X, Trash2, Edit2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

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
      <div className="bg-slate-200 dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md animate-fade-in-up">
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

interface Rayon {
  id: string;
  nom: string;
  userId: string;
  order: number; // Nouveau champ pour l'ordre
}

const PRODUITS_COLLECTION_NAME = "Produits";
const RAYONS_COLLECTION_NAME = "Rayons";

const Produits = () => {
  const { user } = useAuth();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [rayons, setRayons] = useState<Rayon[]>([]);
  const [editingProduitId, setEditingProduitId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [selectedRayonId, setSelectedRayonId] = useState("");
  const [rayonName, setRayonName] = useState("");
  const [editingRayonId, setEditingRayonId] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showRayonModal, setShowRayonModal] = useState(false);

  // Abonnement temps réel aux produits
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToCollection(
      PRODUITS_COLLECTION_NAME,
      (data) => {
        setProduits(
          (data as Produit[]).filter((prod) => prod.userId === user.uid)
        );
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Abonnement temps réel aux rayons
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToCollection(
      RAYONS_COLLECTION_NAME,
      (data) => {
        setRayons(
          (data as Rayon[]).filter((rayon) => rayon.userId === user.uid)
        );
      }
    );
    return () => unsubscribe();
  }, [user]);

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !user) return;

    setLoading(true);
    try {
      const productData = {
        nom: productName,
        description: productDescription,
        rayonId: selectedRayonId || undefined,
        userId: user.uid,
      };

      if (editingProduitId) {
        await updateDocument(
          PRODUITS_COLLECTION_NAME,
          editingProduitId,
          productData
        );
        setEditingProduitId(null);
      } else {
        await addDocument(PRODUITS_COLLECTION_NAME, productData);
      }
      setProductName("");
      setProductDescription("");
      setSelectedRayonId("");
      setShowProductModal(false);
    } catch (error) {
      alert("Erreur lors de la sauvegarde du produit");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce produit ?")) {
      await deleteDocument(PRODUITS_COLLECTION_NAME, id);
    }
  };

  const startEditProduct = (produit: Produit) => {
    setEditingProduitId(produit.id);
    setProductName(produit.nom);
    setProductDescription(produit.description || "");
    setSelectedRayonId(produit.rayonId || "");
    setShowProductModal(true);
  };

  const cancelEditProduct = () => {
    setEditingProduitId(null);
    setProductName("");
    setProductDescription("");
    setSelectedRayonId("");
    setShowProductModal(false);
  };

  const getRayonName = (rayonId?: string) => {
    const rayon = rayons.find((r) => r.id === rayonId);
    return rayon ? rayon.nom : "Aucun rayon";
  };

  return (
    <div className="max-w-full mx-2 sm:max-w-2xl sm:mx-auto lg:max-w-4xl">
      <div className="mb-4 sm:mb-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-slate-400">
          Produits
        </h2>
      </div>

      <div className="flex flex-row gap-2 mb-4 sm:mb-8">
        <button
          onClick={() => setShowProductModal(true)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-slate-300 font-bold py-2 px-1 rounded-md flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={20} /> Produits
        </button>

        <button
          onClick={() => setShowRayonModal(true)}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-slate-300 font-bold py-2 px-1 rounded-md flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={20} /> Rayons
        </button>
      </div>

      {/* Liste des produits */}
      <div className="grid gap-3 sm:gap-4">
        {produits.length === 0 && !loading && user && (
          <div className="text-center py-6 sm:py-10 text-slate-700 dark:text-slate-400 italic text-sm sm:text-base">
            Aucun produit trouvé. Ajoutez-en un !
          </div>
        )}
        {produits
          .sort((a, b) => {
            const rayonA = rayons.find((r) => r.id === a.rayonId);
            const rayonB = rayons.find((r) => r.id === b.rayonId);
            const orderA = rayonA ? rayonA.order : Infinity; // Mets les produits sans rayon à la fin
            const orderB = rayonB ? rayonB.order : Infinity;

            if (orderA !== orderB) {
              return orderA - orderB;
            }
            return a.nom.localeCompare(b.nom);
          })
          .map((produit) => (
            <div
              key={produit.id}
              className="bg-slate-300 dark:bg-slate-800 p-3 sm:p-4 rounded-lg shadow-sm border border-slate-700 dark:border-slate-400 flex justify-between items-center animate-fade-in"
            >
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-700 dark:text-slate-400">
                  {produit.nom}
                </h3>
                {produit.description && (
                  <span className="font-normal text-sm text-slate-600 dark:text-slate-400">
                    - {produit.description}
                  </span>
                )}
                {produit.rayonId && (
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    ({getRayonName(produit.rayonId)})
                  </span>
                )}
              </div>
              <div className="flex gap-1 sm:gap-2">
                <button
                  onClick={() => startEditProduct(produit)}
                  className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                >
                  <Edit2 size={16} sm:size={18} />
                </button>

                <button
                  onClick={() => handleDeleteProduct(produit.id)}
                  className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                  <Trash2 size={16} sm:size={18} />
                </button>
              </div>
            </div>
          ))}
      </div>

      <Modal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduitId(null);
          setProductName("");
          setProductDescription("");
          setSelectedRayonId("");
        }}
        title={editingProduitId ? "Modifier le produit" : "Ajouter un produit"}
      >
        <form
          onSubmit={handleSubmitProduct}
          className="flex flex-col gap-3 sm:gap-4 items-end"
        >
          <div className="flex flex-col sm:flex-row w-full gap-3 sm:gap-4">
            <div className="w-full sm:w-1/2">
              <label
                htmlFor="productName"
                className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-400 mb-1"
              >
                Nom du produit
              </label>
              <input
                type="text"
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3 py-1.5 sm:px-4 sm:py-2 rounded-md border border-slate-700 dark:border-slate-400 bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Ex: Lait"
                required
              />
            </div>
            <div className="w-full sm:w-1/2">
              <label
                htmlFor="productDescription"
                className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-400 mb-1"
              >
                Description (optionnel)
              </label>
              <input
                type="text"
                id="productDescription"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="w-full px-3 py-1.5 sm:px-4 sm:py-2 rounded-md border border-slate-700 dark:border-slate-400 bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Ex: Bio, 1L"
              />
            </div>
          </div>
          <div className="w-full">
            <label
              htmlFor="rayon"
              className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-400 mb-1"
            >
              Rayon (optionnel)
            </label>
            <select
              id="rayon"
              value={selectedRayonId}
              onChange={(e) => setSelectedRayonId(e.target.value)}
              className="w-full px-3 py-1.5 sm:px-4 sm:py-2 rounded-md border border-slate-700 dark:border-slate-400 bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Sélectionner un rayon</option>
              {rayons.map((rayon) => (
                <option key={rayon.id} value={rayon.id}>
                  {rayon.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            {editingProduitId && (
              <button
                type="button"
                onClick={() => {
                  setShowProductModal(false);
                  setEditingProduitId(null);
                  setProductName("");
                  setProductDescription("");
                  setSelectedRayonId("");
                }}
                className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-400 p-1.5 sm:p-2 rounded-md transition-colors"
              >
                <X size={16} sm:size={20} />
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-slate-300 dark:text-slate-300 py-1.5 px-3 sm:py-2 sm:px-4 rounded-md transition-colors flex items-center gap-1 sm:gap-2 disabled:opacity-50 text-sm"
            >
              {editingProduitId ? <Save size={16} /> : <Plus size={16} />}
              {editingProduitId ? "Mettre à jour" : "Ajouter"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showRayonModal}
        onClose={() => {
          setShowRayonModal(false);
          setEditingRayonId(null);
          setRayonName("");
        }}
        title={editingRayonId ? "Modifier le rayon" : "Ajouter un rayon"}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!rayonName.trim() || !user) return;
            setLoading(true);
            try {
              if (editingRayonId) {
                await updateDocument(RAYONS_COLLECTION_NAME, editingRayonId, {
                  nom: rayonName,
                });
                setEditingRayonId(null);
              } else {
                await addDocument(RAYONS_COLLECTION_NAME, {
                  nom: rayonName,
                  userId: user.uid,
                  order: rayons.length, // Assignation de l'ordre initial
                });
              }
              setRayonName("");
              // setShowRayonModal(false); // Suppression de la fermeture de la modale
            } catch (error) {
              alert("Erreur lors de la sauvegarde du rayon");
            } finally {
              setLoading(false);
            }
          }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-end mb-4"
        >
          <div className="flex-grow w-full">
            <label
              htmlFor="rayonName"
              className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-400 mb-1"
            >
              Nom du rayon
            </label>
            <input
              type="text"
              id="rayonName"
              value={rayonName}
              onChange={(e) => setRayonName(e.target.value)}
              className="w-full px-3 py-1.5 sm:px-4 sm:py-2 rounded-md border border-slate-700 dark:border-slate-400 bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Ex: Fruits et légumes"
              required
            />
          </div>
          <div className="flex gap-2">
            {editingRayonId && (
              <button
                type="button"
                onClick={() => {
                  setShowRayonModal(false);
                  setEditingRayonId(null);
                  setRayonName("");
                }}
                className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-400 p-1.5 sm:p-2 rounded-md transition-colors"
              >
                <X size={16} sm:size={20} />
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-slate-300 dark:text-slate-300 py-1.5 px-3 sm:py-2 sm:px-4 rounded-md transition-colors flex items-center gap-1 sm:gap-2 disabled:opacity-50 text-sm"
            >
              {editingRayonId ? <Save size={16} /> : <Plus size={16} />}
              {editingRayonId ? "Mettre à jour" : "Ajouter"}
            </button>
          </div>
        </form>

        {/* Liste des rayons */}
        <div className="grid gap-2 mt-4">
          {rayons.length === 0 && !loading && user && (
            <div className="text-center py-4 text-slate-700 dark:text-slate-400 italic text-sm">
              Aucun rayon trouvé. Ajoutez-en un !
            </div>
          )}
          {rayons
            .sort((a, b) => a.order - b.order)
            .map((rayon) => (
              <div
                key={rayon.id}
                className="bg-slate-300 dark:bg-slate-700 p-2 rounded-lg shadow-sm border border-slate-700 dark:border-slate-400 flex justify-between items-center"
              >
                <span className="text-sm text-slate-700 dark:text-slate-400">
                  {rayon.nom}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingRayonId(rayon.id);
                      setRayonName(rayon.nom);
                      // La modale est déjà ouverte, pas besoin de la rouvrir
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        window.confirm(
                          "Voulez-vous vraiment supprimer ce rayon ?"
                        )
                      ) {
                        await deleteDocument(RAYONS_COLLECTION_NAME, rayon.id);
                        // Pas besoin de setShowRayonModal(false) ici car la liste se rafraîchit
                      }
                    }}
                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </Modal>
    </div>
  );
};

export default Produits;
