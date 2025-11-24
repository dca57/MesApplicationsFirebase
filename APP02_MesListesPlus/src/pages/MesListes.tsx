import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  addDocument,
  subscribeToCollection,
  deleteDocument,
  addBatchItems,
  updateDocument,
  getCollectionData,
} from "../firebase/firestore";
import {
  Plus,
  List,
  Trash2,
  X,
  Upload,
  Settings,
  CheckSquare,
  Square,
  Pin,
  Copy,
  PinOff,
  Loader2,
  FileJson,
  Check,
  Filter,
  AlertTriangle,
} from "lucide-react";
import Papa from "papaparse";

const COLLECTION_NAME = "MesListes";

// --- CONFIGURATION COULEURS ---
const COLOR_PALETTE = [
  {
    id: "slate",
    bg: "bg-slate-500 dark:bg-slate-500",
    text: "text-slate-700 dark:text-slate-300",
    ring: "ring-slate-700 dark:ring-slate-300",
    border: "border-slate-900 dark:border-slate-100",
  },
  {
    id: "red",
    bg: "bg-red-500 dark:bg-red-500",
    text: "text-slate-700 dark:text-slate-300",
    ring: "ring-slate-700 dark:ring-slate-300",
    border: "border-red-900 dark:border-red-100",
  },
  {
    id: "orange",
    bg: "bg-orange-500 dark:bg-orange-500",
    text: "text-slate-700 dark:text-slate-300",
    ring: "ring-slate-700 dark:ring-slate-300",
    border: "border-orange-900 dark:border-orange-100",
  },
  {
    id: "amber",
    bg: "bg-amber-500 dark:bg-amber-500",
    text: "text-slate-700 dark:text-slate-300",
    ring: "ring-slate-700 dark:ring-slate-300",
    border: "border-amber-900 dark:border-amber-100",
  },
  {
    id: "green",
    bg: "bg-green-500 dark:bg-green-500",
    text: "text-slate-700 dark:text-slate-300",
    ring: "ring-slate-700 dark:ring-slate-300",
    border: "border-green-900 dark:border-green-100",
  },
  {
    id: "teal",
    bg: "bg-teal-500 dark:bg-teal-500",
    text: "text-slate-700 dark:text-slate-300",
    ring: "ring-slate-700 dark:ring-slate-300",
    border: "border-teal-900 dark:border-teal-100",
  },
  {
    id: "blue",
    bg: "bg-blue-500 dark:bg-blue-500",
    text: "text-slate-700 dark:text-slate-300",
    ring: "ring-slate-700 dark:ring-slate-300",
    border: "border-blue-900 dark:border-blue-100",
  },
  {
    id: "indigo",
    bg: "bg-indigo-500 dark:bg-indigo-500",
    text: "text-slate-700 dark:text-slate-300",
    ring: "ring-slate-700 dark:ring-slate-300",
    border: "border-indigo-900 dark:border-indigo-100",
  },
  {
    id: "violet",
    bg: "bg-violet-500 dark:bg-violet-500",
    text: "text-slate-700 dark:text-slate-300",
    ring: "ring-slate-700 dark:ring-slate-300",
    border: "border-violet-900 dark:border-violet-100",
  },
  {
    id: "pink",
    bg: "bg-pink-500 dark:bg-pink-500",
    text: "text-slate-700 dark:text-slate-300",
    ring: "ring-slate-700 dark:ring-slate-300",
    border: "border-pink-900 dark:border-pink-100",
  },
];

const getColorStyle = (colorId?: string) => {
  return COLOR_PALETTE.find((c) => c.id === colorId) || COLOR_PALETTE[6]; // Default blue
};

// Nouvelle structure de configuration
interface FieldConfig {
  label: string;
  visible: boolean;
}

interface CustomList {
  id: string;
  name: string;
  userId?: string;
  isPinned?: boolean;
  color?: string; // NOUVEAU
  fieldLabels?: Record<string, string>;
  fieldsConfig?: Record<string, FieldConfig>;
  createdAt?: any;
}

// État local pour le formulaire
interface FieldState {
  key: string;
  label: string;
  visible: boolean;
  isNew: boolean;
}

const MesListes = () => {
  const { user } = useAuth();
  const [lists, setLists] = useState<CustomList[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const navigate = useNavigate();

  // Form State
  const [isEditingList, setIsEditingList] = useState(false);
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState("");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [fields, setFields] = useState<FieldState[]>([]);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<CustomList | null>(null);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToCollection(COLLECTION_NAME, (data) => {
      // Conversion rétrocompatibilité + TRI (Épinglés en premier)
      const formattedLists = data
        .map((doc: any) => {
          if (!doc.fieldsConfig && doc.fieldLabels) {
            const config: Record<string, FieldConfig> = {};
            Object.entries(doc.fieldLabels).forEach(([key, label]) => {
              config[key] = { label: label as string, visible: true };
            });
            return { ...doc, fieldsConfig: config };
          }
          return doc;
        })
        .sort((a: CustomList, b: CustomList) => {
          // Tri : Épinglés d'abord, puis alphabétique
          if (a.isPinned === b.isPinned) {
            return a.name.localeCompare(b.name);
          }
          return a.isPinned ? -1 : 1;
        });

      setLists(formattedLists as CustomList[]);
    });
    return () => unsubscribe();
  }, []);

  // --- FILTERED LISTS ---
  const filteredLists = lists.filter((list) => {
    if (!filterColor) return true;
    return (list.color || "blue") === filterColor;
  });

  // --- ACTIONS LISTE (Pin, Duplicate, Delete) ---

  const handleTogglePin = async (e: React.MouseEvent, list: CustomList) => {
    e.preventDefault(); // Prevent default Link navigation
    e.stopPropagation();
    try {
      await updateDocument(COLLECTION_NAME, list.id, {
        isPinned: !list.isPinned,
      });
    } catch (error) {
      console.error("Error pinning list:", error);
    }
  };

  const handleDuplicateList = async (e: React.MouseEvent, list: CustomList) => {
    e.preventDefault(); // Prevent default Link navigation
    e.stopPropagation();
    if (isDuplicating) return;

    setIsDuplicating(list.id);
    try {
      // 1. Copier la structure
      const newListPayload = {
        name: `${list.name} (Copie)`,
        userId: user.uid,
        fieldsConfig: list.fieldsConfig,
        fieldLabels: list.fieldLabels,
        isPinned: false,
        color: list.color || "blue",
      };
      const newListDoc = await addDocument(COLLECTION_NAME, newListPayload);

      // 2. Récupérer les items de la liste source
      const sourceItems = await getCollectionData(`lists/${list.id}/items`);

      // 3. Nettoyer les IDs et préparer pour l'ajout
      const itemsToCopy = sourceItems.map(({ id, ...rest }) => rest);

      // 4. Ajouter les items à la nouvelle liste (Batch)
      if (itemsToCopy.length > 0) {
        await addBatchItems(`lists/${newListDoc.id}/items`, itemsToCopy);
      }

      alert(`Liste "${list.name}" dupliquée avec succès !`);
    } catch (error) {
      console.error("Error duplicating list:", error);
      alert("Erreur lors de la duplication.");
    } finally {
      setIsDuplicating(null);
    }
  };

  const openDeleteModal = (e: React.MouseEvent, list: CustomList) => {
    e.preventDefault(); // Prevent default Link navigation
    e.stopPropagation();
    setListToDelete(list);
    setDeleteConfirmationName("");
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteList = async () => {
    if (!listToDelete) return;
    if (deleteConfirmationName !== listToDelete.name) return;

    try {
      await deleteDocument(COLLECTION_NAME, listToDelete.id);
      setIsDeleteModalOpen(false);
      setListToDelete(null);
    } catch (error) {
      console.error("Erreur suppression", error);
      alert("Erreur lors de la suppression de la liste");
    }
  };

  // --- MODAL HANDLERS ---

  const openCreateModal = () => {
    setIsEditingList(false);
    setCurrentListId(null);
    setNewListName("");
    setSelectedColor("blue");
    setFields([{ key: "field1", label: "", visible: true, isNew: true }]);
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, list: CustomList) => {
    e.preventDefault(); // Prevent default Link navigation
    e.stopPropagation();

    setIsEditingList(true);
    setCurrentListId(list.id);
    setNewListName(list.name);
    setSelectedColor(list.color || "blue");

    const loadedFields: FieldState[] = [];
    if (list.fieldsConfig) {
      const sortedEntries = Object.entries(list.fieldsConfig).sort((a, b) => {
        const numA = parseInt(a[0].replace("field", "")) || 0;
        const numB = parseInt(b[0].replace("field", "")) || 0;
        return numA - numB;
      });

      sortedEntries.forEach(([key, config]) => {
        loadedFields.push({
          key: key,
          label: config.label,
          visible: config.visible,
          isNew: false,
        });
      });
    }
    setFields(loadedFields);
    setIsModalOpen(true);
  };

  // --- FIELD MANAGEMENT ---

  const handleAddField = () => {
    let nextIndex = 1;
    const existingKeys = fields.map(
      (f) => parseInt(f.key.replace("field", "")) || 0
    );
    if (existingKeys.length > 0) {
      nextIndex = Math.max(...existingKeys) + 1;
    }

    setFields([
      ...fields,
      {
        key: `field${nextIndex}`,
        label: "",
        visible: true,
        isNew: true,
      },
    ]);
  };

  const handleRemoveField = (index: number) => {
    const field = fields[index];
    if (!field.isNew) return;

    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const handleFieldLabelChange = (index: number, value: string) => {
    if (!fields[index].isNew) return;
    const newFields = [...fields];
    newFields[index].label = value;
    setFields(newFields);
  };

  const handleVisibilityToggle = (index: number) => {
    const newFields = [...fields];
    newFields[index].visible = !newFields[index].visible;
    setFields(newFields);
  };

  // --- SUBMIT ---

  const handleSaveList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim() || fields.length === 0) return;

    const fieldsConfig: Record<string, FieldConfig> = {};
    const fieldLabels: Record<string, string> = {};

    let hasValidField = false;
    fields.forEach((f) => {
      if (f.label.trim()) {
        hasValidField = true;
        fieldsConfig[f.key] = { label: f.label.trim(), visible: f.visible };
        fieldLabels[f.key] = f.label.trim();
      }
    });

    if (!hasValidField) {
      alert("Ajoutez au moins un champ valide.");
      return;
    }

    try {
      const payload = {
        name: newListName,
        userId: user.uid, // Propriétaire
        color: selectedColor,
        fieldsConfig,
        fieldLabels,
      };

      if (isEditingList && currentListId) {
        await updateDocument(COLLECTION_NAME, currentListId, payload);
      } else {
        await addDocument(COLLECTION_NAME, payload);
      }

      setIsModalOpen(false);
      setNewListName("");
      setFields([]);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la sauvegarde.");
    }
  };

  // --- CSV IMPORT LOGIC ---
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as Record<string, any>[];
          const headers = results.meta.fields;

          if (!headers || headers.length === 0 || data.length === 0) {
            alert("Le fichier CSV semble vide ou invalide.");
            setIsImporting(false);
            return;
          }

          const fieldsConfig: Record<string, FieldConfig> = {};
          const fieldLabels: Record<string, string> = {};
          const headerToFieldKey: Record<string, string> = {};

          headers.forEach((header, index) => {
            const fieldKey = `field${index + 1}`;
            fieldsConfig[fieldKey] = { label: header, visible: true };
            fieldLabels[fieldKey] = header;
            headerToFieldKey[header] = fieldKey;
          });

          const listName = file.name.replace(".csv", "");

          const listDoc = await addDocument(COLLECTION_NAME, {
            name: listName,
            userId: user.uid,
            color: "blue",
            fieldsConfig,
            fieldLabels,
          });

          const formattedItems = data.map((row) => {
            const newItem: Record<string, any> = {};
            Object.keys(row).forEach((header) => {
              const key = headerToFieldKey[header];
              if (key) {
                newItem[key] = row[header];
              }
            });
            return newItem;
          });

          await addBatchItems(`lists/${listDoc.id}/items`, formattedItems);

          alert(
            `Liste "${listName}" importée avec succès (${formattedItems.length} éléments) !`
          );
        } catch (error) {
          console.error("Import error:", error);
          alert("Erreur lors de l'import CSV.");
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      error: (error) => {
        setIsImporting(false);
      },
    });
  };

  // --- JSON IMPORT LOGIC ---
  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const parsedData = JSON.parse(jsonContent);

        // Validation basique
        if (
          !parsedData.metadata ||
          !parsedData.metadata.name ||
          !parsedData.items
        ) {
          throw new Error(
            "Format JSON invalide. Le fichier doit contenir 'metadata' et 'items'."
          );
        }

        const { metadata, items } = parsedData;

        // 1. Créer la liste
        // On nettoie l'ID s'il est présent dans les métadonnées pour en créer un nouveau
        const listPayload = {
          name: metadata.name + " (Import)",
          userId: user.uid,
          fieldsConfig: metadata.fieldsConfig || {},
          fieldLabels: metadata.fieldLabels || {},
          isPinned: false,
          color: metadata.color || "blue",
        };

        const listDoc = await addDocument(COLLECTION_NAME, listPayload);

        // 2. Ajouter les items
        // On s'assure de ne pas importer les anciens IDs
        const itemsToImport = items.map((item: any) => {
          const { id, ...rest } = item;
          return rest;
        });

        if (itemsToImport.length > 0) {
          await addBatchItems(`lists/${listDoc.id}/items`, itemsToImport);
        }

        alert(
          `Liste "${listPayload.name}" importée avec succès (${itemsToImport.length} éléments) !`
        );
      } catch (error: any) {
        console.error("Import JSON error:", error);
        alert(`Erreur lors de l'import JSON: ${error.message}`);
      } finally {
        setIsImporting(false);
        if (jsonInputRef.current) jsonInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
        <div className="text-center xl:text-left">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
            Mes Listes
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gérez, épinglez et organisez vos collections.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {/* Inputs Cachés */}
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            className="hidden"
            onChange={handleCsvUpload}
          />
          <input
            type="file"
            accept=".json"
            ref={jsonInputRef}
            className="hidden"
            onChange={handleJsonUpload}
          />

          {/* Bouton JSON */}
          <button
            onClick={() => jsonInputRef.current?.click()}
            disabled={isImporting}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-slate-100 px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm"
          >
            {isImporting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <FileJson size={20} />
            )}
            Importer JSON
          </button>

          {/* Bouton CSV */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-slate-100 px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm"
          >
            {isImporting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Upload size={20} />
            )}
            Importer CSV
          </button>

          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-slate-100 px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} /> Créer manuellement
          </button>
        </div>
      </div>

      {/* --- STICKY COLOR FILTER --- */}
      <div className="sticky top-[64px] z-40 py-3 bg-slate-200/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-400 dark:border-slate-600 px-4 sm:px-6 lg:px-8 flex items-center gap-4 overflow-x-auto no-scrollbar shadow-sm transition-all">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 shrink-0">
          <Filter size={16} /> Filtres :
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterColor(null)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors border ${
              filterColor === null
                ? "bg-slate-800 dark:bg-slate-200 text-slate-200 dark:text-slate-900 border-transparent"
                : "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            Toutes
          </button>
          {COLOR_PALETTE.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterColor(c.id)}
              className={`w-6 h-6 rounded-full border ${c.bg} ${
                c.border
              } transition-transform ${
                filterColor === c.id
                  ? "scale-125 ring-2 ring-slate-400 dark:ring-slate-500"
                  : "hover:scale-110 opacity-70 hover:opacity-100"
              }`}
              title={c.id}
            />
          ))}
        </div>
      </div>

      {/* LISTE DES LISTES (Single Column / Full Width) */}
      <div className="flex flex-col gap-3">
        {filteredLists.map((list) => {
          const colorStyle = getColorStyle(list.color);
          return (
            <Link // Changed from div to Link
              to={`/listedetails/${list.id}`} // Added to prop for navigation
              key={list.id}
              className={`group flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-300 dark:bg-slate-700 rounded-lg p-4 shadow-sm border border-slate-500 dark:border-slate-500 transition-all cursor-pointer relative overflow-hidden
                  ${
                    list.isPinned
                      ? `border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10`
                      : `border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md`
                  }
              `}
            >
              {/* Left: Icon + Title + Tags */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div
                  className={`p-3 rounded-lg shrink-0 transition-colors ${colorStyle.bg} ${colorStyle.text}`}
                >
                  <List size={24} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 truncate">
                      {list.name}
                    </h3>
                    {list.isPinned && (
                      <Pin
                        size={14}
                        className="text-blue-500 rotate-45"
                        fill="currentColor"
                      />
                    )}
                  </div>

                  {/* Tags compacts */}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {list.fieldsConfig ? (
                      Object.entries(list.fieldsConfig)
                        .sort((a, b) => {
                          const numA = parseInt(a[0].replace("field", "")) || 0;
                          const numB = parseInt(b[0].replace("field", "")) || 0;
                          return numA - numB;
                        })
                        .slice(0, 5) // Max 5 tags
                        .map(
                          (
                            [_key, conf],
                            idx // Directly destructure [key, conf] here
                          ) => (
                            <span
                              key={idx}
                              className={`text-xs px-1.5 py-0.5 rounded border ${
                                conf.visible
                                  ? "bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200 border-green-700 dark:border-green-200"
                                  : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-700 dark:border-slate-200 opacity-75"
                              }`}
                            >
                              {conf.label}
                            </span>
                          )
                        )
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Vielle config
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1 md:ml-4 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700 pt-3 md:pt-0 md:pl-4">
                <button
                  onClick={(e) => handleTogglePin(e, list)}
                  className={`p-2 rounded-full transition-colors ${
                    list.isPinned
                      ? "text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                  title={list.isPinned ? "Détacher" : "Épingler en haut"}
                >
                  {list.isPinned ? <PinOff size={18} /> : <Pin size={18} />}
                </button>

                <button
                  onClick={(e) => handleDuplicateList(e, list)}
                  className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                  title="Dupliquer la liste"
                  disabled={isDuplicating === list.id}
                >
                  {isDuplicating === list.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>

                <button
                  onClick={(e) => openEditModal(e, list)}
                  className={`p-2 rounded-full transition-colors ${colorStyle.text} hover:bg-slate-100 dark:hover:bg-slate-700`}
                  title="Configurer la structure"
                >
                  <Settings size={18} />
                </button>

                <button
                  onClick={(e) => openDeleteModal(e, list)}
                  className="p-2 text-red-500 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 rounded-full transition-colors"
                  title="Supprimer la liste"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </Link> // Changed from div to Link
          );
        })}

        {filteredLists.length === 0 && (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">
              {filterColor
                ? "Aucune liste avec cette couleur."
                : "Vous n'avez aucune liste pour le moment."}
            </p>
            {!filterColor && (
              <button
                onClick={openCreateModal}
                className="mt-4 text-blue-600 hover:underline"
              >
                Créer ma première liste
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODALE DE SUPPRESSION DE LISTE */}
      {isDeleteModalOpen && listToDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="bg-slate-50 dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-500 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold">Supprimer la liste ?</h3>
              </div>

              <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
                Cette action est <strong>irréversible</strong>. La liste{" "}
                <strong>"{listToDelete.name}"</strong> et tous ses éléments
                seront supprimés.
              </p>

              <p className="text-slate-700 dark:text-slate-200 mb-2 text-sm font-medium">
                Veuillez saisir le nom de la liste pour confirmer :
              </p>

              <input
                type="text"
                value={deleteConfirmationName}
                onChange={(e) => setDeleteConfirmationName(e.target.value)}
                placeholder={listToDelete.name}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-50 outline-none focus:ring-2 focus:ring-red-500 mb-6"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeleteList}
                  disabled={deleteConfirmationName !== listToDelete.name}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-50 rounded-md font-medium transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} /> Supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale de création / édition */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                {isEditingList ? "Configurer la liste" : "Nouvelle Liste"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {isEditingList && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm rounded-md flex gap-2">
                  <div className="shrink-0">
                    <Settings size={16} className="mt-0.5" />
                  </div>
                  <div>
                    Mode édition : Vous pouvez afficher/masquer les champs et en
                    ajouter de nouveaux. Les étiquettes existantes ne sont pas
                    modifiables pour préserver l'intégrité des données.
                  </div>
                </div>
              )}

              <form
                id="createListForm"
                onSubmit={handleSaveList}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nom de la liste
                  </label>
                  <input
                    type="text"
                    required
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Ex: Films à voir, Annuaire..."
                    className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* --- COLOR PICKER --- */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Couleur de la liste
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setSelectedColor(color.id)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          color.bg
                        } flex items-center justify-center
                          ${
                            selectedColor === color.id
                              ? `ring-2 ${color.ring} ring-offset-2 dark:ring-offset-slate-800 scale-110`
                              : "hover:scale-110"
                          }
                        `}
                      >
                        {selectedColor === color.id && (
                          <Check size={14} className={color.text} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Colonnes (Cochez pour afficher dans la vue liste)
                  </label>
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <button
                          type="button"
                          onClick={() => handleVisibilityToggle(index)}
                          className={`p-2 rounded-md transition-colors ${
                            field.visible
                              ? "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                              : "text-slate-400 hover:bg-slate-100 dark:text-slate-600 dark:hover:bg-slate-700"
                          }`}
                          title={
                            field.visible
                              ? "Visible dans la liste"
                              : "Masqué (Visible uniquement en modification)"
                          }
                        >
                          {field.visible ? (
                            <CheckSquare size={20} />
                          ) : (
                            <Square size={20} />
                          )}
                        </button>

                        <input
                          type="text"
                          required
                          disabled={!field.isNew}
                          value={field.label}
                          onChange={(e) =>
                            handleFieldLabelChange(index, e.target.value)
                          }
                          placeholder={`Nom du champ (ex: Titre, Année...)`}
                          className={`flex-1 px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 outline-none ${
                            field.isNew
                              ? "bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-blue-500"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed"
                          }`}
                        />

                        {field.isNew && (
                          <button
                            type="button"
                            onClick={() => handleRemoveField(index)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                        {!field.isNew && <div className="w-[34px]"></div>}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Plus size={16} /> Ajouter un champ
                  </button>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="createListForm"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-slate-50 rounded-md transition-colors font-medium"
              >
                {isEditingList ? "Mettre à jour" : "Créer la liste"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MesListes;
