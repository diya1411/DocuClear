import { StoredDocument } from '../types';

const STORAGE_KEY = 'legalease_docs';

export const saveDocument = (doc: StoredDocument) => {
  try {
    const existing = getDocuments();
    // Keep only last 5 to avoid storage limits
    const updated = [doc, ...existing].slice(0, 5);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save document to localStorage", error);
  }
};

export const getDocuments = (): StoredDocument[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load documents", error);
    return [];
  }
};

export const deleteDocument = (docId: string) => {
  const existing = getDocuments();
  const updated = existing.filter(d => d.docId !== docId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};