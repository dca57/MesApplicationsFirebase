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
  nom: string;
  description: string;
  prefix: string;
  url: string;
}

const COLLECTION_NAME = "MesAppsFirebase";
const MesApplications = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prefix, setPrefix] = useState("");
  const [url, setUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Abonnement temps réel
  useEffect(() => {
    const unsubscribe = subscribeToCollection(COLLECTION_NAME, (data) => {
      setItems(data as Item[]);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;

    setLoading(true);
    try {
      if (editingId) {
        await updateDocument(COLLECTION_NAME, editingId, {
          nom,
          description,
          prefix,
          url,
        });
        setEditingId(null);
      } else {
        await addDocument(COLLECTION_NAME, { nom, description, prefix, url });
      }
      setNom("");
      setDescription("");
      setPrefix("");
      setUrl("");
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
    setNom(item.nom);
    setDescription(item.description);
    setPrefix(item.prefix);
    setUrl(item.url);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNom("");
    setDescription("");
    setPrefix("");
    setUrl("");
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Mes Applications Firebase - CRUD
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Ajoutez, modifiez et supprimez des applications.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 mb-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-end">
          <div className="flex w-full gap-4">
            <div className="w-1/3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nom Application
              </label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nom de l'élément..."
                required
              />
            </div>
            <div className="w-2/3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Petite description..."
              />
            </div>
          </div>
          <div className="flex w-full gap-4 mt-2">
            <div className="w-1/3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Prefix
              </label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nom de l'élément..."
                required
              />
            </div>
            <div className="w-2/3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nom de l'élément..."
                required
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 p-2 rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {editingId ? <Save size={18} /> : <Plus size={18} />}
              {editingId ? "Mettre à jour" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center animate-fade-in"
          >
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {item.prefix} : {item.nom}
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  window.open(
                    /^https?:\/\//.test(item.url)
                      ? item.url
                      : `https://${item.url}`,
                    "_blank"
                  )
                }
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
              >
                <Link2 size={18} />
              </button>
              <button
                onClick={() => startEdit(item)}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
              >
                <Edit2 size={18} />
              </button>

              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400 italic">
            Aucun élément trouvé. Ajoutez-en un !
          </div>
        )}
      </div>
    </div>
  );
};

export default MesApplications;
