import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "./config";
import { APP_PREFIX } from "./config";

export const addDocument = async (collectionName: string, data: any) => {
  const colName = APP_PREFIX + collectionName;
  try {
    const docRef = await addDoc(collection(db, colName), {
      ...data,
      createdAt: new Date(),
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
      updatedAt: new Date(),
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

// Hook-like helper for realtime updates (use within a useEffect)
export const subscribeToCollection = (
  collectionName: string,
  callback: (data: any[]) => void
) => {
  const colName = APP_PREFIX + collectionName;
  const q = collection(db, colName);
  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(data);
  });
};
