import { collection, addDoc, getDocs, query, deleteDoc, doc } from "firebase/firestore";
import { db, APP_PREFIX } from "../firebase/config";

export const seedInitialProducts = async (
  products: Array<{ name: string; rayon: string }>
) => {
  if (!db) {
    console.error("Firestore DB is not initialized.");
    return;
  }
  const collectionRef = collection(db, `${APP_PREFIX}Produits_Init`);

  // Supprimer tous les documents existants dans la collection
  const existingDocs = await getDocs(query(collectionRef));
  const deletePromises = existingDocs.docs.map((d) => deleteDoc(doc(db, `${APP_PREFIX}Produits_Init`, d.id)));
  await Promise.all(deletePromises);
  console.log(`Collection ${APP_PREFIX}Produits_Init nettoyée.`);

  for (const product of products) {
    try {
      await addDoc(collectionRef, {
        nom: product.name,
        rayon: product.rayon, 
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`Produit "${product.name}" ajouté à ${APP_PREFIX}Produits_Init.`);
    } catch (error) {
      console.error(`Erreur lors de l'ajout de "${product.name}" :`, error);
    }
  }
  console.log("Peuplement de la collection Produits_Init terminé.");
};

export const getInitialProducts = async () => {
  const colName = `${APP_PREFIX}Produits_Init`;
  try {
    const q = query(collection(db, colName));
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return products;
  } catch (error) {
    console.error("Error getting initial products: ", error);
    throw error;
  }
};
