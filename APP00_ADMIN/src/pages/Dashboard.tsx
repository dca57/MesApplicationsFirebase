import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";

const Dashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [appsCount, setAppsCount] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const usersData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            identifiant: data.email || data.displayName || "",
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
            lastLogin: data.lastLoginAt ? new Date(data.lastLoginAt) : null,
          };
        });
        setUsers(usersData);
        setFilteredUsers(usersData);
        // Récupérer le nombre d'applications
        const appsSnapshot = await getDocs(
          collection(db, "APP00_ADMIN_MesAppsFirebase")
        );
        setAppsCount(appsSnapshot.size);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des utilisateurs ou des applications:",
          error
        );
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!search) {
      setFilteredUsers(users);
    } else {
      const lower = search.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            (u.identifiant && u.identifiant.toLowerCase().includes(lower)) ||
            (u.id && u.id.toLowerCase().includes(lower))
        )
      );
    }
  }, [search, users]);

  const formatDate = (date) => {
    if (!date) return "-";
    return (
      date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }) +
      " " +
      date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div className="space-y-2 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-500">
          Bienvenue,{" "}
          <span className="text-blue-600 dark:text-blue-400">
            {user?.displayName || user?.email}
          </span>{" "}
          👋
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Voici un aperçu de l'activité récente sur votre application.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white shadow-md">
          <h3 className="text-lg font-semibold opacity-90">Nb Utilisateurs</h3>
          <p className="text-4xl font-bold mt-2">{users.length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white shadow-md">
          <h3 className="text-lg font-semibold opacity-90">Nb Collections</h3>
          <p className="text-4xl font-bold mt-2">YYY</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-lg text-white shadow-md">
          <h3 className="text-lg font-semibold opacity-90">Nb Applications</h3>
          <p className="text-4xl font-bold mt-2">{appsCount}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            Utilisateurs
          </h3>
          <input
            type="text"
            placeholder="Rechercher par identifiant ou ID..."
            className="border border-slate-300 dark:border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Identifiant
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Date création
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  Dernière Connexion
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-4 text-center text-slate-500 dark:text-slate-400"
                  >
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {u.identifiant}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {u.lastLogin ? formatDate(u.lastLogin) : "-"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-400">
                      {u.id}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
