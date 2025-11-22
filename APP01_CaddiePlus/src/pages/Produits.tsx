import React, { useState, useEffect, useRef } from "react";
import {
  addDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  removeFieldFromDocument,
} from "../firebase/firestore";
import { getInitialProducts } from "../services/initialProductService"; // Import du nouveau service
import { Plus, Save, X, Trash2, Edit2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { APP_PREFIX } from "../firebase/config"; // Import de APP_PREFIX

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
  rayon?: string; // Changed from category to rayon
  createdAt?: Date;
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

interface Rayon {
  id: string;
  nom: string;
  userId: string;
  order: number; // Nouveau champ pour l'ordre
}

const PRODUITS_COLLECTION_NAME = "Produits"; // Suppression de APP_PREFIX
const RAYONS_COLLECTION_NAME = "Rayons"; // Suppression de APP_PREFIX
const LISTES_COLLECTION_NAME = "Listes"; // Nouvelle constante pour le nom de collection des listes

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
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteRayonConfirmModal, setShowDeleteRayonConfirmModal] =
    useState(false);
  const [rayonToDelete, setRayonToDelete] = useState<Rayon | null>(null);
  const [showDeleteProductConfirmModal, setShowDeleteProductConfirmModal] =
    useState(false);
  const [productToDelete, setProductToDelete] = useState<Produit | null>(null);
  const [productLists, setProductLists] = useState<ListItem[]>([]);
  const [initialProducts, setInitialProducts] = useState<Produit[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<Produit[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Abonnement temps réel aux listes pour vérifier l'utilisation des produits
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToCollection(
      LISTES_COLLECTION_NAME,
      (data) => {
        setProductLists(data as ListItem[]);
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Charger les produits initiaux et filtrer ceux déjà présents
  useEffect(() => {
    const fetchAndFilterProducts = async () => {
      const allInitialProducts = await getInitialProducts();
      setInitialProducts(allInitialProducts as Produit[]);

      if (user && produits.length > 0) {
        const existingProductNames = new Set(
          produits.map((p) => p.nom.toLowerCase())
        );
        const filteredSuggestions = (allInitialProducts as Produit[]).filter(
          (p) => !existingProductNames.has(p.nom.toLowerCase())
        );
        setSuggestedProducts(filteredSuggestions);
      } else if (user) {
        setSuggestedProducts(allInitialProducts as Produit[]);
      }
    };

    fetchAndFilterProducts();
  }, [user, produits]); // Dépend de `user` et `produits` pour re-filtrer quand les produits de l'utilisateur changent

  const handleImportProduct = async (productToImport: Produit) => {
    if (!user) return;

    setLoading(true);
    try {
      let finalRayonId = productToImport.rayonId;

      // Vérifier si le rayon existe, sinon le créer
      const existingRayon = rayons.find(
        (r) => r.nom.toLowerCase() === productToImport.rayon?.toLowerCase()
      ); // Utilisation de productToImport.rayon
      if (!existingRayon) {
        console.log(`Création du rayon "${productToImport.rayon}"`); // Utilisation de productToImport.rayon
        const newRayonRef = await addDocument(RAYONS_COLLECTION_NAME, {
          nom: productToImport.rayon,
          userId: user.uid,
          order: rayons.length, // Ajouter à la fin
        });
        if (newRayonRef.success) {
          finalRayonId = newRayonRef.id;
          // Suppression de la mise à jour locale des rayons, la souscription en temps réel gérera l'ajout
        }
      } else {
        finalRayonId = existingRayon.id;
      }

      // Ajouter le produit à la collection de l'utilisateur
      await addDocument(PRODUITS_COLLECTION_NAME, {
        nom: productToImport.nom,
        description: productToImport.description || "",
        rayonId: finalRayonId,
        userId: user.uid,
      });

      // Mettre à jour les suggestions en retirant le produit importé
      setSuggestedProducts((prev) =>
        prev.filter((p) => p.id !== productToImport.id)
      );
    } catch (error) {
      console.error("Erreur lors de l'importation du produit :", error);
      alert("Erreur lors de l'importation du produit.");
    } finally {
      setLoading(false);
    }
  };

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
      // setShowProductModal(false); // Suppression de la fermeture de la modale
    } catch (error) {
      alert("Erreur lors de la sauvegarde du produit");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const product = produits.find((p) => p.id === id);
    if (!product) return;

    const listsContainingProduct = productLists.filter((list) =>
      list.produits.some((p) => p.produitId === id)
    );

    if (listsContainingProduct.length > 0) {
      setProductToDelete(product);
      setProductLists(listsContainingProduct);
      setShowDeleteProductConfirmModal(true);
    } else {
      // Suppression directe si le produit n'est dans aucune liste
      await deleteDocument(PRODUITS_COLLECTION_NAME, id);
    }
  };

  const handleDeleteProductConfirmed = async () => {
    if (!productToDelete) return;

    setLoading(true);
    try {
      // 1. Supprimer le produit de toutes les listes où il apparaît
      const updatePromises = productLists.map(async (list) => {
        const updatedProductsInList = list.produits.filter(
          (p) => p.produitId !== productToDelete.id
        );
        return updateDocument(LISTES_COLLECTION_NAME, list.id, {
          produits: updatedProductsInList,
        });
      });
      await Promise.all(updatePromises);

      // 2. Supprimer le produit lui-même
      await deleteDocument(PRODUITS_COLLECTION_NAME, productToDelete.id);

      setProductToDelete(null);
      setShowDeleteProductConfirmModal(false);
    } catch (error) {
      alert("Erreur lors de la suppression du produit.");
      console.error("Erreur lors de la suppression du produit :", error);
    } finally {
      setLoading(false);
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

  const confirmDeleteRayon = (rayon: Rayon) => {
    setRayonToDelete(rayon);
    setShowDeleteRayonConfirmModal(true);
  };

  const handleDeleteRayonConfirmed = async () => {
    if (!rayonToDelete) return;

    setLoading(true);
    try {
      await deleteDocument(RAYONS_COLLECTION_NAME, rayonToDelete.id);
      // Optionnel: Mettre les produits associés à ce rayon à 'undefined' pour rayonId
      const productsToUpdate = produits.filter(
        (p) => p.rayonId === rayonToDelete.id
      );
      const updatePromises = productsToUpdate.map((p) =>
        removeFieldFromDocument(PRODUITS_COLLECTION_NAME, p.id, "rayonId")
      ); // Utilisation de removeFieldFromDocument
      await Promise.all(updatePromises);

      setRayonToDelete(null);
      setShowDeleteRayonConfirmModal(false);
    } catch (error) {
      alert("Erreur lors de la suppression du rayon.");
      console.error("Erreur lors de la suppression du rayon :", error);
    } finally {
      setLoading(false);
    }
  };

  const getRayonName = (rayonId?: string) => {
    const rayon = rayons.find((r) => r.id === rayonId);
    return rayon ? rayon.nom : "Aucun rayon";
  };

  // Fonction de tri et de filtrage pour les produits suggérés
  const getSortedAndFilteredProducts = () => {
    let filtered = suggestedProducts.filter((product) => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      return (
        product.nom.toLowerCase().includes(lowerCaseSearchTerm) ||
        product.rayon?.toLowerCase().includes(lowerCaseSearchTerm)
      );
    });

    // Tri: Rayon ASC, puis Nom Produit ASC. Le rayon 'Autre' est toujours en dernier.
    return filtered.sort((a, b) => {
      const rayonA = a.rayon || "";
      const rayonB = b.rayon || "";
      const nomA = a.nom || "";
      const nomB = b.nom || "";

      // Gérer le rayon 'Autre' en dernier
      if (rayonA === "Autre" && rayonB !== "Autre") {
        return 1;
      }
      if (rayonA !== "Autre" && rayonB === "Autre") {
        return -1;
      }
      if (rayonA === "Autre" && rayonB === "Autre") {
        return nomA.localeCompare(nomB);
      }

      // Tri normal par rayon, puis par nom
      if (rayonA.localeCompare(rayonB) !== 0) {
        return rayonA.localeCompare(rayonB);
      }
      return nomA.localeCompare(nomB);
    });
  };

  const sortedAndFilteredProducts = getSortedAndFilteredProducts();

  // Effet pour remonter le scroll au début lors d'une recherche
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [searchTerm]); // Déclencher quand le terme de recherche change

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

        <button
          onClick={() => setShowImportModal(true)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-slate-300 font-bold py-2 px-1 rounded-md flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={20} /> Import
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
                    onClick={() => confirmDeleteRayon(rayon)}
                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </Modal>

      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Importer des produits"
      >
        <input
          type="text"
          placeholder="Rechercher un produit ou un rayon..."
          className="w-full px-3 py-1.5 sm:px-4 sm:py-2 rounded-md border border-slate-700 dark:border-slate-400 bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-4"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div
          ref={scrollContainerRef}
          className="flex flex-col gap-2 max-h-96 overflow-y-auto"
        >
          {sortedAndFilteredProducts.length === 0 && searchTerm === "" ? (
            <p className="text-slate-700 dark:text-slate-400">
              Tous les produits initiaux sont déjà dans votre liste !
            </p>
          ) : sortedAndFilteredProducts.length === 0 && searchTerm !== "" ? (
            <p className="text-slate-700 dark:text-slate-400">
              Aucun produit trouvé pour "{searchTerm}".
            </p>
          ) : (
            sortedAndFilteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => handleImportProduct(product)}
                className="flex justify-between items-center p-3 rounded-md bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 transition-colors"
              >
                <span className="text-slate-700 dark:text-slate-400 font-medium">
                  {product.nom}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({product.rayon})
                </span>
              </button>
            ))
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteRayonConfirmModal}
        onClose={() => setShowDeleteRayonConfirmModal(false)}
        title="Confirmer la suppression du rayon"
      >
        {rayonToDelete && (
          <div className="flex flex-col gap-4">
            <p className="text-slate-700 dark:text-slate-400">
              Voulez-vous vraiment supprimer le rayon "{rayonToDelete.nom}" ?
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-500">
              Ce rayon contient{" "}
              {produits.filter((p) => p.rayonId === rayonToDelete.id).length}{" "}
              produit(s). Ces produits ne seront plus associés à aucun rayon.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteRayonConfirmModal(false)}
                className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-400 py-1.5 px-3 rounded-md transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteRayonConfirmed}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-slate-300 dark:text-slate-300 py-1.5 px-3 rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? "Suppression..." : "Confirmer la suppression"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showDeleteProductConfirmModal}
        onClose={() => setShowDeleteProductConfirmModal(false)}
        title="Confirmer la suppression du produit"
      >
        {productToDelete && (
          <div className="flex flex-col gap-4">
            <p className="text-slate-700 dark:text-slate-400">
              Voulez-vous vraiment supprimer le produit "{productToDelete.nom}"
              ?
            </p>
            {productLists.length > 0 && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Ce produit est actuellement présent dans les listes suivantes.
                Il en sera retiré :
                <ul className="list-disc list-inside mt-2">
                  {productLists.map((list) => (
                    <li key={list.id}>{list.nom}</li>
                  ))}
                </ul>
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteProductConfirmModal(false)}
                className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-400 py-1.5 px-3 rounded-md transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteProductConfirmed}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-slate-300 dark:text-slate-300 py-1.5 px-3 rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? "Suppression..." : "Confirmer la suppression"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Produits;
