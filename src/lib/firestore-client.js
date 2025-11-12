// Small Firestore helpers showing read and write usage for a public collection.
// WARNING: These rules are set to public read+write which allows anyone to read and write data.
// This is dangerous for production — the PR includes a strong warning.

import { collection, getDocs, addDoc, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

// Example collection name for public content
const PUBLIC_COLLECTION = "public-collection";

export async function readPublicDocs({ limitCount = 50 } = {}) {
  const colRef = collection(db, PUBLIC_COLLECTION);
  const q = query(colRef, orderBy("__name__"), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addPublicDoc(data) {
  // Validate on client as needed, but server-side validation is safer.
  const colRef = collection(db, PUBLIC_COLLECTION);
  const docRef = await addDoc(colRef, data);
  return docRef.id;
}
