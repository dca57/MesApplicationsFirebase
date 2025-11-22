import React, { useState, useEffect } from "react";
import {
  addDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
} from "../firebase/firestore";
import { Trash2, Edit2, Link2, Plus, Save, X } from "lucide-react";

interface Item {
  id: string;
  // ***
  champ1: string;
  champ2: string;
  champ3: string;
  champ4: string;
}

const COLLECTION_NAME = "MaCollection";

const FirestoreExample = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // ***
  const [champ1, setChamp1] = useState("");
  const [champ2, setChamp2] = useState("");
  const [champ3, setChamp3] = useState("");
  const [champ4, setChamp4] = useState("");

  // Abonnement temps réel
  useEffect(() => {
    const unsubscribe = subscribeToCollection(COLLECTION_NAME, (data) => {
      setItems(data as Item[]);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ***
    if (!champ1.trim()) return;

    setLoading(true);
    // ***
    try {
      if (editingId) {
        await updateDocument(COLLECTION_NAME, editingId, {
          champ1,
          champ2,
          champ3,
          champ4,
        });
        setEditingId(null);
      } else {
        // ***
        await addDocument(COLLECTION_NAME, { champ1, champ2, champ3, champ4 });
      }
      // ***
      setChamp1("");
      setChamp2("");
      setChamp3("");
      setChamp4("");
    } catch (error) {
      alert("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet élément ?")) {
      await deleteDocument(COLLECTION_NAME, id);
    }
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    // ***
    setChamp1(item.champ1);
    setChamp2(item.champ2);
    setChamp3(item.champ3);
    setChamp4(item.champ4);
  };

  const cancelEdit = () => {
    setEditingId(null);
    // ***
    setChamp1("");
    setChamp2("");
    setChamp3("");
    setChamp4("");
  };

  return (
    <div className="max-w-full mx-2 sm:max-w-2xl sm:mx-auto lg:max-w-4xl">
      <div className="mb-4 sm:mb-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Firestore CRUD
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Ajoutez, modifiez et supprimez des éléments en temps réel.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 mb-4 sm:mb-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4 items-end">
          <div className="flex flex-col sm:flex-row w-full gap-3 sm:gap-4">
            <div className="w-full sm:w-1/3">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Champ 1
              </label>
              <input
                type="text"
                value={champ1} // ***
                onChange={(e) => setChamp1(e.target.value)} // ***
                className="w-full px-3 py-1.5 sm:px-4 sm:py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Info Champ 1" // ***
                required
              />
            </div>
            <div className="w-full sm:w-2/3">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Champ 2
              </label>
              <input
                type="text"
                value={champ2} // ***
                onChange={(e) => setChamp2(e.target.value)} // ***
                className="w-full px-3 py-1.5 sm:px-4 sm:py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Info Champ 2" // ***
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row w-full gap-3 sm:gap-4 mt-1 sm:mt-2">
            <div className="w-full sm:w-1/3">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Champ 3
              </label>
              <input
                type="text"
                value={champ3} // ***
                onChange={(e) => setChamp3(e.target.value)} // ***
                className="w-full px-3 py-1.5 sm:px-4 sm:py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Info Champ 3" // ***
                required
              />
            </div>
            <div className="w-full sm:w-2/3">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Champ 4
              </label>
              <input
                type="text"
                value={champ4} // ***
                onChange={(e) => setChamp4(e.target.value)} // ***
                className="w-full px-3 py-1.5 sm:px-4 sm:py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Info Champ 4" // ***
                required
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3 sm:mt-4">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 p-1.5 sm:p-2 rounded-md transition-colors"
              >
                <X size={16} sm:size={20} />
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 sm:py-2 sm:px-4 rounded-md transition-colors flex items-center gap-1 sm:gap-2 disabled:opacity-50 text-sm"
            >
              {editingId ? <Save size={16} /> : <Plus size={16} />}
              {editingId ? "Mettre à jour" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center animate-fade-in"
          >
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-1 sm:mb-0">
                {item.champ1} : {item.champ2} : {item.champ3} : {item.champ4}
              </h3>
            </div>
            <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-0">
              <button
                onClick={() => startEdit(item)}
                className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
              >
                <Edit2 size={16} sm:size={18} />
              </button>

              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              >
                <Trash2 size={16} sm:size={18} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-6 sm:py-10 text-slate-500 dark:text-slate-400 italic text-sm sm:text-base">
            Aucun élément trouvé. Ajoutez-en un !
          </div>
        )}
      </div>
    </div>
  );
};

export default FirestoreExample;
