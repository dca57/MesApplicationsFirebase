import React, { useState, useEffect } from "react";
import {
  addDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
} from "../firebase/firestore";
import { Plus, Save, X, Trash2, Edit2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

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
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
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

const LISTES_COLLECTION_NAME = "Listes";

const Listes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listes, setListes] = useState<ListItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [listName, setListName] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Abonnement temps réel aux listes
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToCollection(
      LISTES_COLLECTION_NAME,
      (data) => {
        setListes(
          (data as ListItem[]).filter((list) => list.userId === user.uid)
        );
      }
    );
    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName.trim() || !user) return;

    setLoading(true);
    try {
      if (editingId) {
        await updateDocument(LISTES_COLLECTION_NAME, editingId, {
          nom: listName,
        });
        setEditingId(null);
      } else {
        await addDocument(LISTES_COLLECTION_NAME, {
          nom: listName,
          userId: user.uid,
          produits: [],
        });
      }
      setListName("");
      setShowModal(false);
    } catch (error) {
      alert("Erreur lors de la sauvegarde de la liste");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette liste ?")) {
      await deleteDocument(LISTES_COLLECTION_NAME, id);
    }
  };

  const startEdit = (liste: ListItem) => {
    setEditingId(liste.id);
    setListName(liste.nom);
    setShowModal(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setListName("");
    setShowModal(false);
  };

  const handleToggleProductBought = async (
    listId: string,
    produitId: string
  ) => {
    const listToUpdate = listes.find((list) => list.id === listId);
    if (!listToUpdate) return;

    const updatedProducts = listToUpdate.produits.map((p) =>
      p.produitId === produitId ? { ...p, achete: !p.achete } : p
    );

    try {
      await updateDocument(LISTES_COLLECTION_NAME, listId, {
        produits: updatedProducts,
      });
    } catch (error) {
      alert("Erreur lors de la mise à jour du statut du produit");
    }
  };

  const handleRemoveProductFromList = async (
    listId: string,
    produitId: string
  ) => {
    const listToUpdate = listes.find((list) => list.id === listId);
    if (!listToUpdate) return;

    const updatedProducts = listToUpdate.produits.filter(
      (p) => p.produitId !== produitId
    );

    try {
      await updateDocument(LISTES_COLLECTION_NAME, listId, {
        produits: updatedProducts,
      });
    } catch (error) {
      alert("Erreur lors de la suppression du produit de la liste");
    }
  };

  return (
    <div className="max-w-full mx-2 sm:max-w-2xl sm:mx-auto lg:max-w-4xl">
      <div className="mb-4 sm:mb-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-slate-400">
          Mes Listes de courses
        </h2>
      </div>

      <div className="mb-4 sm:mb-8">
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-slate-300 font-bold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={20} /> Ajouter une nouvelle liste
        </button>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {listes.length === 0 && !loading && user && (
          <div className="text-center py-6 sm:py-10 text-slate-700 dark:text-slate-400 italic text-sm sm:text-base">
            Aucune liste trouvée. Ajoutez-en une !
          </div>
        )}
        {listes.map((liste) => (
          <div
            key={liste.id}
            className="bg-slate-300 dark:bg-slate-800 p-3 sm:p-4 rounded-lg shadow-sm border border-slate-700 dark:border-slate-400 flex flex-col animate-fade-in mb-4 cursor-pointer"
            onClick={() => navigate(`/listes/${liste.id}`)}
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-700 dark:text-slate-400">
                  {liste.nom}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  ({liste.produits.length} produits)
                </p>
              </div>
              <div className="flex gap-1 sm:gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Empêche la navigation vers les détails de la liste
                    startEdit(liste);
                  }}
                  className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                >
                  <Edit2 size={16} sm:size={18} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Empêche la navigation vers les détails de la liste
                    handleDelete(liste.id);
                  }}
                  className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                  <Trash2 size={16} sm:size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingId(null);
          setListName("");
        }}
        title={editingId ? "Modifier la liste" : "Ajouter une liste"}
      >
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:gap-4 items-end"
        >
          <div className="flex-grow w-full">
            <label
              htmlFor="listName"
              className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-400 mb-1"
            >
              Nom de la liste
            </label>
            <input
              type="text"
              id="listName"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="w-full px-3 py-1.5 sm:px-4 sm:py-2 rounded-md border border-slate-700 dark:border-slate-600 bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Ex: Courses de la semaine"
              required
            />
          </div>
          <div className="flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  setListName("");
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
              {editingId ? <Save size={16} /> : <Plus size={16} />}
              {editingId ? "Mettre à jour" : "Ajouter"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Listes;
