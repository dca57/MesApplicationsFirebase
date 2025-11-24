import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  deleteField,
  QuerySnapshot,
  DocumentData,
  writeBatch,
  serverTimestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./config";
import { APP_PREFIX } from "./config";

export const addDocument = async (collectionName: string, data: any) => {
  const colName = APP_PREFIX + collectionName;
  try {
    const colRef = collection(db, colName);
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

export const updateDocument = async (
  collectionName: string,
  id: string,
  data: any
) => {
  const colName = APP_PREFIX + collectionName;
  try {
    const docRef = doc(db, colName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating document: ", error);
    throw error;
  }
};

export const deleteDocument = async (collectionName: string, id: string) => {
  const colName = APP_PREFIX + collectionName;
  try {
    const docRef = doc(db, colName, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw error;
  }
};

// Abonnement temps réel (Modifié pour supporter le filtre userId)
export const subscribeToCollection = (
  collectionName: string,
  callback: (data: any[]) => void,
  userId?: string | null
) => {
  const colName = APP_PREFIX + collectionName;
  const colRef = collection(db, colName);

  let q;
  if (userId) {
    // Si un userId est fourni, on filtre
    q = query(colRef, where("userId", "==", userId));
  } else {
    // Sinon comportement par défaut (tout récupérer)
    q = colRef;
  }

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(data);
  });
};

// Récupérer un document unique
export const getDocument = async (collectionName: string, id: string) => {
  const colName = APP_PREFIX + collectionName;
  try {
    const docRef = doc(db, colName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting document:", error);
    throw error;
  }
};

// Récupérer une collection entière une seule fois (pour copie)
export const getCollectionData = async (collectionPath: string) => {
  const colPath = APP_PREFIX + collectionPath;
  try {
    const colRef = collection(db, colPath);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting collection:", error);
    throw error;
  }
};

// Ajout par lot (Batch)
export const addBatchItems = async (collectionPath: string, items: any[]) => {
  const batchSize = 500; // Limite Firebase
  const chunks = [];
  const colPath = APP_PREFIX + collectionPath;
  // Découpage en chunks de 500
  for (let i = 0; i < items.length; i += batchSize) {
    chunks.push(items.slice(i, i + batchSize));
  }

  try {
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      const colRef = collection(db, colPath);

      chunk.forEach((item) => {
        const docRef = doc(colRef); // ID auto
        batch.set(docRef, item);
      });

      await batch.commit();
    }
    return { success: true };
  } catch (error) {
    console.error("Error batch write: ", error);
    throw error;
  }
};

export const removeFieldFromDocument = async (
  collectionName: string,
  id: string,
  fieldName: string
) => {
  const colName = APP_PREFIX + collectionName;
  try {
    const docRef = doc(db, colName, id);
    await updateDoc(docRef, { [fieldName]: deleteField() });
    return { success: true };
  } catch (error) {
    console.error(`Error removing field '${fieldName}' from document: `, error);
    throw error;
  }
};
