import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getDocument,
  subscribeToCollection,
  addDocument,
  updateDocument,
  deleteDocument,
} from "../firebase/firestore";
import {
  ArrowLeft,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Save,
  List,
  AlertTriangle,
  Download,
  Star,
  Copy,
  ChevronLeft,
  ChevronRight,
  FileJson,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
} from "lucide-react";
import * as XLSX from "xlsx";

const COLLECTION_NAME = "MesListes";

interface FieldConfig {
  label: string;
  visible: boolean;
}

interface ListMetadata {
  id: string;
  name: string;
  fieldLabels?: Record<string, string>; // Legacy support
  fieldsConfig?: Record<string, FieldConfig>; // New Structure
  color?: string; // Add color support
}

interface ListItem {
  id: string;
  isFavorite?: boolean;
  createdAt?: { seconds: number; nanoseconds: number };
  [key: string]: any;
}

const ITEMS_PER_PAGE = 100;

// Type pour le tri
type SortDirection = "asc" | "desc" | null;
interface SortConfig {
  key: string | null;
  direction: SortDirection;
}

// Map color IDs to valid CSS color classes (text only) used in Header
const getColorTextClass = (colorId?: string) => {
  switch (colorId) {
    case "slate":
      return "text-slate-700 dark:text-slate-300 bg-slate-500 dark:bg-slate-500 border-slate-500 dark:border-slate-500 rounded-lg p-2";
    case "red":
      return "text-slate-700 dark:text-slate-300 bg-red-500 dark:bg-red-500 border-red-500 dark:border-red-500 rounded-lg p-2";
    case "orange":
      return "text-slate-700 dark:text-slate-300 bg-orange-500 dark:bg-orange-500 border-orange-500 dark:border-orange-500 p-2";
    case "amber":
      return "text-slate-700 dark:text-slate-300 bg-amber-500 dark:bg-amber-500 border-amber-500 dark:border-amber-500 rounded-lg p-2";
    case "green":
      return "text-slate-700 dark:text-slate-300 bg-green-500 dark:bg-green-500 border-green-500 dark:border-green-500 rounded-lg p-2";
    case "teal":
      return "text-slate-700 dark:text-slate-300 bg-teal-500 dark:bg-teal-500 border-teal-500 dark:border-teal-500 rounded-lg p-2";
    case "blue":
      return "text-slate-700 dark:text-slate-300 bg-blue-500 dark:bg-blue-500 border-blue-500 dark:border-blue-500 rounded-lg p-2";
    case "indigo":
      return "text-slate-700 dark:text-slate-300 bg-indigo-500 dark:bg-indigo-500 border-indigo-500 dark:border-indigo-500 rounded-lg p-2";
    case "violet":
      return "text-slate-700 dark:text-slate-300 bg-violet-500 dark:bg-violet-500 border-violet-500 dark:border-violet-500 rounded-lg p-2";
    case "pink":
      return "text-slate-700 dark:text-slate-300 bg-pink-500 dark:bg-pink-500 border-pink-500 dark:border-pink-500 rounded-lg p-2";
    default:
      return "text-slate-700 dark:text-slate-300 bg-slate-500 dark:bg-slate-500 border-slate-500 dark:border-slate-500 rounded-lg p-2";
  }
};

const ListeDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [listMetadata, setListMetadata] = useState<ListMetadata | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: null,
  });

  // Modal State (Add/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Column Resizing State
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const resizingRef = useRef<{
    startX: number;
    startWidth: number;
    key: string;
  } | null>(null);

  // 1. Charger les métadonnées de la liste (Nom + Schéma)
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!id) return;
      try {
        const data = await getDocument(COLLECTION_NAME, id);
        if (data) {
          // Normalisation
          const rawData = data as ListMetadata;
          if (!rawData.fieldsConfig && rawData.fieldLabels) {
            rawData.fieldsConfig = {};
            Object.entries(rawData.fieldLabels).forEach(([key, label]) => {
              if (rawData.fieldsConfig) {
                rawData.fieldsConfig[key] = { label, visible: true };
              }
            });
          }
          setListMetadata(rawData);
        }
        setLoading(false);
      } catch (error) {
        console.error("Erreur chargement liste:", error);
        setLoading(false);
      }
    };
    fetchMetadata();
  }, [id]);

  // 2. S'abonner aux items
  useEffect(() => {
    if (!id) return;
    const itemsPath = `lists/${id}/items`;
    const unsubscribe = subscribeToCollection(itemsPath, (data) => {
      setItems(data as ListItem[]);
    });
    return () => unsubscribe();
  }, [id]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showFavoritesOnly]);

  // --- TRI ---
  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current.key === key) {
        if (current.direction === "asc") return { key, direction: "desc" };
        if (current.direction === "desc") return { key: null, direction: null }; // Reset to creation order
      }
      return { key, direction: "asc" };
    });
  };

  // --- ACTIONS ITEM ---

  const handleToggleFavorite = async (item: ListItem) => {
    if (!id) return;
    try {
      await updateDocument(`lists/${id}/items`, item.id, {
        isFavorite: !item.isFavorite,
      });
    } catch (error) {
      console.error("Error toggling favorite", error);
    }
  };

  const handleDuplicateItem = async (item: ListItem) => {
    if (!id) return;
    // Copie des données sans ID, sans statut favori, et sans createdAt (le serveur en générera un nouveau)
    const { id: itemId, isFavorite, createdAt, ...dataToCopy } = item;
    try {
      await addDocument(`lists/${id}/items`, {
        ...dataToCopy,
        isFavorite: false,
      });
    } catch (error) {
      console.error("Error duplicating item", error);
    }
  };

  const handleOpenModal = (item?: ListItem) => {
    if (item) {
      setEditingItem(item);
      const cleanData: Record<string, string> = {};

      if (listMetadata?.fieldsConfig) {
        Object.keys(listMetadata.fieldsConfig).forEach((key) => {
          cleanData[key] = item[key] || "";
        });
      }
      setFormData(cleanData);
    } else {
      setEditingItem(null);
      setFormData({});
    }
    setIsModalOpen(true);
  };

  const handleChange = (fieldKey: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const itemsPath = `lists/${id}/items`;

    try {
      if (editingItem) {
        await updateDocument(itemsPath, editingItem.id, formData);
      } else {
        await addDocument(itemsPath, formData);
      }
      setIsModalOpen(false);
    } catch (error) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!id) return;
    // Suppression immédiate sans confirmation
    const itemsPath = `lists/${id}/items`;
    await deleteDocument(itemsPath, itemId);
  };

  const handleExportXLS = () => {
    if (!listMetadata || items.length === 0 || !listMetadata.fieldsConfig)
      return;

    const sortedKeys = Object.keys(listMetadata.fieldsConfig).sort((a, b) => {
      const numA = parseInt(a.replace("field", "")) || 0;
      const numB = parseInt(b.replace("field", "")) || 0;
      return numA - numB;
    });

    const exportData = items.map((item) => {
      const row: Record<string, any> = {};
      sortedKeys.forEach((key) => {
        const config = listMetadata.fieldsConfig![key];
        row[config.label] = item[key] || "";
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Liste");
    XLSX.writeFile(workbook, `${listMetadata.name.replace(/ /g, "_")}.xlsx`);
  };

  const handleExportJSON = () => {
    if (!listMetadata || !items) return;

    const exportData = {
      metadata: listMetadata,
      items: items.map((item) => {
        const { id, ...rest } = item;
        return rest;
      }),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${listMetadata.name.replace(/ /g, "_")}_backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Resizing Logic ---
  const handleMouseDown = (e: React.MouseEvent, key: string) => {
    const startWidth = colWidths[key] || 200;
    resizingRef.current = { startX: e.pageX, startWidth, key };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingRef.current) return;
    const { startX, startWidth, key } = resizingRef.current;
    const diff = e.pageX - startX;
    const newWidth = Math.max(50, startWidth + diff);
    setColWidths((prev) => ({ ...prev, [key]: newWidth }));
  };

  const handleMouseUp = () => {
    resizingRef.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // --- Detection liens et emails ---
  const renderCellContent = (text: string) => {
    if (!text) return "-";

    // Regex simple pour email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Regex simple pour URL (commençant par http/https)
    const urlRegex = /^(http|https):\/\/[^ "]+$/;

    if (emailRegex.test(text)) {
      return (
        <a
          href={`mailto:${text}`}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
          onClick={(e) => e.stopPropagation()}
        >
          {text}
        </a>
      );
    }

    if (urlRegex.test(text)) {
      return (
        <a
          href={text}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
          onClick={(e) => e.stopPropagation()}
        >
          {text}
        </a>
      );
    }

    return text;
  };

  // --- FILTRAGE, TRI ET PAGINATION (Memoized) ---
  const processedItems = useMemo(() => {
    let result = [...items];

    // 1. Filtrage
    if (showFavoritesOnly) {
      result = result.filter((i) => i.isFavorite);
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchLower)
        )
      );
    }

    // 2. Tri
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        const valA = (a[sortConfig.key!] || "").toString().toLowerCase();
        const valB = (b[sortConfig.key!] || "").toString().toLowerCase();

        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      // Tri par défaut (Creation Order - en utilisant createdAt)
      // Les items sans createdAt (vieux) seront mis à la fin ou début selon logique
      result.sort((a, b) => {
        const timeA = a.createdAt ? a.createdAt.seconds : 0;
        const timeB = b.createdAt ? b.createdAt.seconds : 0;
        return timeA - timeB; // Ascendant (Plus vieux d'abord = ordre de création)
      });
    }

    return result;
  }, [items, searchTerm, showFavoritesOnly, sortConfig]);

  const totalPages = Math.ceil(processedItems.length / ITEMS_PER_PAGE);
  const paginatedItems = processedItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading)
    return (
      <div className="p-8 text-center flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  if (!listMetadata || !listMetadata.fieldsConfig) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold">
          Liste introuvable ou mal configurée
        </h2>
        <Link
          to="/lists"
          className="text-blue-500 hover:underline mt-2 inline-block"
        >
          Retour aux listes
        </Link>
      </div>
    );
  }

  // --- LOGIQUE DE TRI COLS ---
  const sortedFieldKeys = Object.keys(listMetadata.fieldsConfig).sort(
    (a, b) => {
      const numA = parseInt(a.replace("field", "")) || 0;
      const numB = parseInt(b.replace("field", "")) || 0;
      return numA - numB;
    }
  );

  const visibleFieldKeys = sortedFieldKeys.filter(
    (key) => listMetadata.fieldsConfig![key].visible
  );

  const allFieldKeys = sortedFieldKeys;

  const titleColorClass = getColorTextClass(listMetadata.color);

  return (
    <div className="animate-fade-in space-y-4 h-[calc(100vh-100px)] flex flex-col">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 shrink-0">
        {/* ROW 1: Navigation & Title */}
        <div className="m-2 flex items-center gap-3 overflow-hidden">
          <Link
            to="/lists"
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <ArrowLeft
              size={40}
              className="text-slate-700 dark:text-slate-200"
            />
          </Link>
          <div className="rounded-lg shrink-0">
            <List
              size={40}
              className={`p-2 border rounded-lg shrink-0 transition-colors ${titleColorClass}`}
            />
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-slate-100 truncate"
            title={listMetadata.name}
          >
            {listMetadata.name}
          </h1>
          <span className="shrink-0 text-sm px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 font-medium">
            {processedItems.length} éléments
          </span>
        </div>

        {/* ROW 2: Tools (Search left, Actions right) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Left Group: Search & Favorites */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
            <div className="relative flex-1 max-w-md min-w-[200px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-200"
                size={18}
              />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-slate-400 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-3 py-2 rounded-md flex items-center gap-2 shadow-sm transition-colors border shrink-0 ${
                showFavoritesOnly
                  ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-600 dark:border-yellow-800"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-400 dark:border-slate-600  hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
              title="Afficher uniquement les favoris"
            >
              {showFavoritesOnly ? (
                <Star size={20} fill="currentColor" />
              ) : (
                <Star size={20} />
              )}
              <span className="hidden sm:inline">Favoris</span>
            </button>
          </div>

          {/* Right Group: Actions */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
            <button
              onClick={handleExportJSON}
              disabled={items.length === 0}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-slate-50 px-4 py-2 rounded-md flex items-center gap-2 shadow-sm whitespace-nowrap transition-colors"
              title="Sauvegarder en JSON"
            >
              <FileJson size={20} />{" "}
              <span className="hidden lg:inline">JSON</span>
            </button>

            <button
              onClick={handleExportXLS}
              disabled={items.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-slate-50 px-4 py-2 rounded-md flex items-center gap-2 shadow-sm whitespace-nowrap"
              title="Exporter en Excel"
            >
              <Download size={20} />{" "}
              <span className="hidden lg:inline">Export</span>
            </button>

            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 text-slate-50 px-4 py-2 rounded-md flex items-center gap-2 shadow-sm whitespace-nowrap"
            >
              <Plus size={20} />{" "}
              <span className="hidden sm:inline">Ajouter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Container Tableau avec scroll vertical et Sticky Header */}
      <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm border border-slate-400 dark:border-slate-700 overflow-auto relative flex flex-col">
        <div className="flex-1 overflow-auto">
          <table
            className="min-w-full text-left border-collapse"
            style={{ tableLayout: "fixed" }}
          >
            <thead className="bg-slate-200 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 shadow-sm">
              <tr>
                {visibleFieldKeys.map((key) => (
                  <th
                    key={key}
                    className="relative px-6 py-4 font-semibold text-sm uppercase tracking-wider overflow-hidden text-ellipsis whitespace-nowrap select-none group bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    style={{ width: colWidths[key] || 200 }}
                    onClick={() => handleSort(key)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{listMetadata.fieldsConfig![key].label}</span>
                      {sortConfig.key === key ? (
                        sortConfig.direction === "asc" ? (
                          <ArrowUp size={14} className="text-blue-500" />
                        ) : (
                          <ArrowDown size={14} className="text-blue-500" />
                        )
                      ) : (
                        <ArrowUpDown
                          size={14}
                          className="opacity-0 group-hover:opacity-50"
                        />
                      )}
                    </div>

                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 active:bg-blue-600"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleMouseDown(e, key);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </th>
                ))}
                <th className="px-6 py-4 text-right w-44 sticky right-0 bg-slate-50 dark:bg-slate-900 z-30 shadow-[-5px_0_5px_-5px_rgba(0,0,0,0.1)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  {visibleFieldKeys.map((key) => (
                    <td
                      key={key}
                      className="px-6 py-4 text-slate-700 dark:text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                      {renderCellContent(item[key])}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right sticky right-0 bg-slate-50 dark:bg-slate-800 z-10 shadow-[-5px_0_5px_-5px_rgba(0,0,0,0.05)] border-l border-transparent">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleFavorite(item)}
                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title={
                          item.isFavorite
                            ? "Retirer des favoris"
                            : "Ajouter aux favoris"
                        }
                      >
                        <Star
                          size={16}
                          className={
                            item.isFavorite
                              ? "text-yellow-500"
                              : "text-slate-400 hover:text-yellow-500"
                          }
                          fill={item.isFavorite ? "currentColor" : "none"}
                        />
                      </button>
                      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                      <button
                        onClick={() => handleDuplicateItem(item)}
                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                        title="Dupliquer l'élément"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedItems.length === 0 && (
                <tr>
                  <td
                    colSpan={visibleFieldKeys.length + 1}
                    className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic"
                  >
                    {searchTerm
                      ? "Aucun résultat trouvé."
                      : showFavoritesOnly
                      ? "Aucun favori."
                      : "La liste est vide. Ajoutez votre premier élément !"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900 flex justify-between items-center text-sm">
            <div className="text-slate-600 dark:text-slate-400">
              Page <span className="font-bold">{currentPage}</span> sur{" "}
              <span className="font-bold">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-700 dark:text-slate-300"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-700 dark:text-slate-300"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modale Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50">
                {editingItem ? "Modifier élément" : "Nouvel élément"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="itemForm" onSubmit={handleSubmit} className="space-y-4">
                {allFieldKeys.map((key) => {
                  const fieldConfig = listMetadata.fieldsConfig![key];
                  return (
                    <div
                      key={key}
                      className={
                        !fieldConfig.visible
                          ? "opacity-90 border-l-4 border-slate-300 pl-3 py-1"
                          : ""
                      }
                    >
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex justify-between">
                        {fieldConfig.label}
                        {!fieldConfig.visible && (
                          <span className="text-xs text-slate-400 italic">
                            (Masqué dans la liste)
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={formData[key] || ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={fieldConfig.label}
                        className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  );
                })}
              </form>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="itemForm"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-slate-50 rounded-md transition-colors font-medium flex items-center gap-2"
              >
                <Save size={18} /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListeDetails;
