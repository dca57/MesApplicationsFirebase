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
// import { APP_PREFIX } from "../firebase/config"; // Suppression de l'import inutile

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

interface Rayon { // Nouvelle interface pour Rayon
  id: string;
  nom: string;
  userId: string;
  order: number;
}

const LISTES_COLLECTION_NAME = "Listes"; // Suppression de APP_PREFIX
const PRODUITS_COLLECTION_NAME = "Produits"; // Suppression de APP_PREFIX
const RAYONS_COLLECTION_NAME = "Rayons"; // Suppression de APP_PREFIX

const ListesDetails = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentList, setCurrentList] = useState<ListItem | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Produit[]>([]);
  const [rayons, setRayons] = useState<Rayon[]>([]); // Nouvel état pour les rayons
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Nouveau state pour le terme de recherche

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

    // Abonnement temps réel aux rayons
    const unsubscribeRayons = subscribeToCollection(
      RAYONS_COLLECTION_NAME,
      (data) => {
        setRayons(
          (data as Rayon[]).filter((rayon) => rayon.userId === user.uid)
        );
      }
    );

    return () => {
      unsubscribeList();
      unsubscribeProducts();
      unsubscribeRayons();
    };
  }, [user, id]);

  const handleAddProductToList = async (productId: string) => {
    if (!productId || !currentList) return;

    const listToUpdate = { ...currentList };
    const existingProductIndex = listToUpdate.produits.findIndex(
      (p) => p.produitId === productId
    );

    const updatedProducts = [...listToUpdate.produits];

    if (existingProductIndex === -1) {
      updatedProducts.push({
        produitId: productId,
        achete: false,
      });
    }

    try {
      await updateDocument(LISTES_COLLECTION_NAME, currentList.id, {
        produits: updatedProducts,
      });
      setSearchTerm(""); // Réinitialiser la recherche après l'ajout
      // setSelectedProductToAdd(""); // Suppression de setSelectedProductToAdd car non utilisé avec les cards
      // setShowProductModal(false); // Suppression de la fermeture de la modale
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

  const getProductNameWithRayon = (produitId: string) => {
    const produit = availableProducts.find((p) => p.id === produitId);
    if (!produit) return "Produit inconnu";
    const rayon = rayons.find((r) => r.id === produit.rayonId);
    return `${produit.nom} ${rayon ? `(${rayon.nom})` : ""}`;
  };

  const getSortedListProducts = () => {
    if (!currentList || !availableProducts || !rayons) return [];

    const productsInListWithDetails = currentList.produits.map((item) => {
      const productDetail = availableProducts.find((p) => p.id === item.produitId);
      const rayonDetail = rayons.find((r) => r.id === productDetail?.rayonId);
      return {
        ...item,
        nom: productDetail?.nom || "",
        rayonNom: rayonDetail?.nom || "",
      };
    });

    return productsInListWithDetails.sort((a, b) => {
      const rayonA = a.rayonNom || ""; // S'assure que c'est une chaîne vide si null/undefined
      const rayonB = b.rayonNom || ""; // S'assure que c'est une chaîne vide si null/undefined
      const nomA = a.nom || "";
      const nomB = b.nom || "";

      // Fonction d'aide pour déterminer la priorité de tri des rayons spéciaux
      const getRayonSortOrder = (rayonName: string) => {
        if (rayonName === "Autre") return 2; // 'Autre' vient après les rayons normaux et avant l'absence de rayon
        if (rayonName === "") return 3;    // Absence de rayon vient en dernier
        return 1;                        // Rayons normaux viennent en premier
      };

      const orderA = getRayonSortOrder(rayonA);
      const orderB = getRayonSortOrder(rayonB);

      // Comparaison des priorités de rayon
      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Si la priorité est la même (ou pour les rayons normaux), tri par nom de rayon
      if (rayonA.localeCompare(rayonB) !== 0) {
        return rayonA.localeCompare(rayonB);
      }
      // Enfin, tri par nom de produit
      return nomA.localeCompare(nomB);
    });
  };

  // Fonction de tri et de filtrage pour les produits disponibles
  const getSortedAndFilteredAvailableProducts = () => {
    if (!availableProducts || !currentList || !rayons) return [];

    let filteredProducts = availableProducts.filter(
      (product) =>
        product.userId === user?.uid && // S'assurer que ce sont les produits de l'utilisateur
        !currentList.produits.some((item) => item.produitId === product.id) && // Exclure les produits déjà dans la liste
        (product.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.rayonId &&
            rayons.find((r) => r.id === product.rayonId)?.nom.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    return filteredProducts.sort((a, b) => {
      const rayonA = rayons.find((r) => r.id === a.rayonId)?.nom || ""; // S'assure que c'est une chaîne vide si null/undefined
      const rayonB = rayons.find((r) => r.id === b.rayonId)?.nom || ""; // S'assure que c'est une chaîne vide si null/undefined
      const nomA = a.nom || "";
      const nomB = b.nom || "";

      // Fonction d'aide pour déterminer la priorité de tri des rayons spéciaux
      const getRayonSortOrder = (rayonName: string) => {
        if (rayonName === "Autre") return 2; // 'Autre' vient après les rayons normaux et avant l'absence de rayon
        if (rayonName === "") return 3;    // Absence de rayon vient en dernier
        return 1;                        // Rayons normaux viennent en premier
      };

      const orderA = getRayonSortOrder(rayonA);
      const orderB = getRayonSortOrder(rayonB);

      // Comparaison des priorités de rayon
      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Si la priorité est la même (ou pour les rayons normaux), tri par nom de rayon
      if (rayonA.localeCompare(rayonB) !== 0) {
        return rayonA.localeCompare(rayonB);
      }
      // Enfin, tri par nom de produit
      return nomA.localeCompare(nomB);
    });
  };

  const sortedAndFilteredAvailableProducts = getSortedAndFilteredAvailableProducts();

  const sortedListProducts = getSortedListProducts();

  // Calcul du progrès pour la barre
  const totalProductsInList = currentList?.produits.length || 0;
  const checkedProductsInList = currentList?.produits.filter(p => p.achete).length || 0;
  const progressPercentage = totalProductsInList > 0 ? (checkedProductsInList / totalProductsInList) * 100 : 0;

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

      {/* Barre de progression */}
      {totalProductsInList > 0 && (
        <div className="mb-4 sm:mb-8 flex items-center gap-2"> {/* New flex container */}
          <div className="flex-grow bg-slate-200 dark:bg-slate-700 rounded-full h-8 relative overflow-hidden shadow-inner"> {/* Progress bar container, increased height */}
            <div
              className="bg-green-500 h-full absolute left-0 top-0 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-400"> {/* Text outside the bar */}
            {checkedProductsInList} / {totalProductsInList}
          </span>
        </div>
      )}

      {/* Liste des produits dans la liste */}
      {currentList.produits.length > 0 && (
        <div className="bg-slate-200 dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md border border-slate-700 dark:border-slate-400">
          <h4 className="font-semibold text-sm sm:text-base text-slate-700 dark:text-slate-400 mb-2">
            Produits de la liste :
          </h4>
          <ul className="grid gap-2">
            {sortedListProducts.map((p) => (
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
                  {getProductNameWithRayon(p.produitId)}
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
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Rechercher un produit ou un rayon..."
            className="w-full px-3 py-1.5 sm:px-4 sm:py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="grid gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {sortedAndFilteredAvailableProducts.length > 0 ? (
              sortedAndFilteredAvailableProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleAddProductToList(product.id)}
                  className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 p-3 rounded-md shadow-sm cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-200">
                    {getProductNameWithRayon(product.id)}
                  </span>
                  <Plus size={16} className="text-blue-600" />
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 dark:text-slate-400 text-sm italic">
                Aucun produit disponible ou correspondant à votre recherche.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ListesDetails;
