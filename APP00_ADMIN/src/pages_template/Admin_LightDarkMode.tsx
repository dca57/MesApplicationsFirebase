import React, { useState } from "react";
import { Check, X, Info } from "lucide-react";

const Admin_LightDarkMode = () => {
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [isChecked, setIsChecked] = useState(false);

  const Modal = ({ onClose, children }) => {
    // ... implémentation de la modale ...
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white dark:bg-slate-700 p-6 rounded-lg shadow-lg w-1/3">
          {children}
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
          Gestion des modes Light et Dark
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Régler cette page puis modifier les autres pages avec l'IA (qui
          prendra cette page comme modèle)
        </p>
      </div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
        <div className="flex">
          {/* Light Mode Column */}
          <div className="flex-1 bg-white text-gray-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 m-4">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-gray-900 mb-6">
              Mode Clair
            </h2>
            <div className="space-y-6">
              {/* Label and Textbox */}
              <div>
                <label
                  htmlFor="textbox-light"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Label Textbox
                </label>
                <input
                  type="text"
                  id="textbox-light"
                  className="w-full px-4 py-2 rounded-md border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Texte ici..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>

              {/* Listbox */}
              <div>
                <label
                  htmlFor="listbox-light"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Label Listbox
                </label>
                <select
                  id="listbox-light"
                  className="w-full px-4 py-2 rounded-md border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedOption}
                  onChange={(e) => setSelectedOption(e.target.value)}
                >
                  <option value="">Sélectionnez une option</option>
                  <option value="option1">Option 1</option>
                  <option value="option2">Option 2</option>
                  <option value="option3">Option 3</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex space-x-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors flex items-center gap-2">
                  Bouton Primaire
                </button>
                <button className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors flex items-center gap-2">
                  Bouton Supprimer
                </button>
              </div>

              {/* Checkbox and Icons */}
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  id="checkbox-light"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="checkbox-light"
                  className="text-sm font-medium text-gray-700"
                >
                  Option de case à cocher
                </label>
                <Check size={20} className="text-green-500" />
                <X size={20} className="text-red-500" />
                <Info size={20} className="text-blue-500" />
              </div>

              {/* Modal Button */}
              <button
                onClick={() => setShowModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors flex items-center gap-2"
              >
                Ouvrir Modale
              </button>
            </div>
          </div>

          {/* Dark Mode Column */}
          <div className="flex-1 bg-slate-800 text-white p-6 rounded-lg shadow-sm border border-slate-700 m-4">
            <h2 className="text-3xl font-bold text-white mb-6">Mode Sombre</h2>
            <div className="space-y-6">
              {/* Label and Textbox */}
              <div>
                <label
                  htmlFor="textbox-dark"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Label Textbox
                </label>
                <input
                  type="text"
                  id="textbox-dark"
                  className="w-full px-4 py-2 rounded-md border border-slate-600 bg-slate-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Texte ici..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>

              {/* Listbox */}
              <div>
                <label
                  htmlFor="listbox-dark"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  Label Listbox
                </label>
                <select
                  id="listbox-dark"
                  className="w-full px-4 py-2 rounded-md border border-slate-600 bg-slate-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedOption}
                  onChange={(e) => setSelectedOption(e.target.value)}
                >
                  <option value="">Sélectionnez une option</option>
                  <option value="option1">Option 1</option>
                  <option value="option2">Option 2</option>
                  <option value="option3">Option 3</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex space-x-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors flex items-center gap-2">
                  Bouton Primaire
                </button>
                <button className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors flex items-center gap-2">
                  Bouton Supprimer
                </button>
              </div>

              {/* Checkbox and Icons */}
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  id="checkbox-dark"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="h-4 w-4 text-blue-500 focus:ring-blue-600 border-gray-700 rounded bg-gray-800"
                />
                <label
                  htmlFor="checkbox-dark"
                  className="text-sm font-medium text-gray-300"
                >
                  Option de case à cocher
                </label>
                <Check size={20} className="text-green-400" />
                <X size={20} className="text-red-400" />
                <Info size={20} className="text-blue-400" />
              </div>

              {/* Modal Button */}
              <button
                onClick={() => setShowModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors flex items-center gap-2"
              >
                Ouvrir Modale
              </button>
            </div>
          </div>

          {showModal && (
            <Modal onClose={() => setShowModal(false)}>
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Titre de la Modale
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Ceci est le contenu de votre fenêtre modale.
              </p>
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin_LightDarkMode;
