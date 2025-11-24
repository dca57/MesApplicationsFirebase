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

interface Message {
  role: "user" | "assistant";
  content: string;
}

const LLM = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    "mistralai/mistral-7b-instruct:free"
  );

  const models = [
    {
      id: "mistralai/mistral-7b-instruct:free",
      name: "Mistral 7B Instruct (Free)",
    },
    { id: "deepseek/deepseek-r1-0528:free", name: "Deepseek R1-0528 (Free)" },
    { id: "deepseek/deepseek-chat", name: "Deepseek Chat" },
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
  ];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage: Message = { role: "user", content: inputMessage };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputMessage("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.statusText}`);
      }

      const data = await response.json();
      setMessages((prevMessages) => [...prevMessages, data.choices[0].message]);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: "Désolé, une erreur est survenue." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-2 animate-fade-in">
      <div className="bg-slate-200 dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-300 dark:border-slate-700">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-500 mb-2">
          Utiliser l'Intelligence Artificielle
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Communication avec les LLM
        </p>
      </div>

      <div className="bg-slate-200 dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-300 dark:border-slate-700 mb-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-500 mb-2">
          Choix du modèle LLM :
        </h2>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="p-2 border border-slate-400 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-slate-200 dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-300 dark:border-slate-700 mb-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-500 mb-4">
          Chat :
        </h2>
        <form
          onSubmit={handleSendMessage}
          className="flex w-1/2 space-x-2 mb-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-grow p-2 border border-slate-400 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={chatLoading}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={chatLoading}
          >
            Envoyer
          </button>
        </form>
        <div className="chat-box h-80 overflow-y-auto p-4 border border-slate-400 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 mb-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-2 ${
                msg.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <span
                className={`inline-block p-2 rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300 text-gray-800 dark:bg-slate-700 dark:text-slate-200"
                }`}
              >
                {msg.content}
              </span>
            </div>
          ))}
          {chatLoading && (
            <div className="text-center text-slate-500 dark:text-slate-400">
              Chargement...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LLM;
