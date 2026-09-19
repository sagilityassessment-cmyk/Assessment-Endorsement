import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, writeBatch, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDZq9YjSktCV9onQkNKRNNVTqmpysIqOqs',
  authDomain: 'endorsement-for-assessment-v2.firebaseapp.com',
  projectId: 'endorsement-for-assessment-v2',
  storageBucket: 'endorsement-for-assessment-v2.firebasestorage.app',
  messagingSenderId: '215362510087',
  appId: '1:215362510087:web:0b9e52f923e70fa4f2f9a2',
  measurementId: 'G-KCHMYEPPKQ'
};

const app = getApps().some((item) => item.name === 'endorsement')
  ? getApp('endorsement')
  : initializeApp(firebaseConfig, 'endorsement');
const auth = getAuth(app);
const db = getFirestore(app);
const candidatesCollection = collection(db, 'endorsementCandidates');
const thresholdDocument = doc(db, 'settings', 'thresholdWorkbook');

let syncedCandidateRows = new Map();
let candidateSyncQueue = Promise.resolve();
let resolveAuthReady;
const authReady = new Promise((resolve) => { resolveAuthReady = resolve; });
const withoutSyncMetadata = (row) => {
  const { updatedAt, ...data } = row;
  return data;
};

const publishThreshold = (workbook) => {
  try {
    const parsedWorkbook = typeof workbook === 'string' ? JSON.parse(workbook) : workbook;
    window.applyRemoteThresholdWorkbook?.(parsedWorkbook);
  } catch (error) {
    console.error('Firebase threshold data is invalid', error);
  }
};

onAuthStateChanged(auth, (user) => {
  if (!user) return;
  resolveAuthReady(user);
  onSnapshot(candidatesCollection, (snapshot) => {
    const rows = snapshot.docs
      .map((item) => withoutSyncMetadata(item.data()))
      .sort((first, second) => Number(first.order ?? 0) - Number(second.order ?? 0));
    syncedCandidateRows = new Map(rows.map((row) => [row.recordId, JSON.stringify(row)]));
    window.applyRemoteHistoryRows?.(rows);
  }, (error) => console.error('Firebase candidate sync failed', error));
  onSnapshot(thresholdDocument, (snapshot) => {
    const workbook = snapshot.data()?.workbook;
    let remoteWorkbook = [];
    try {
      remoteWorkbook = typeof workbook === 'string' ? JSON.parse(workbook) : workbook;
    } catch (error) {
      console.error('Firebase threshold data is invalid', error);
    }
    const localWorkbook = window.getLocalThresholdWorkbook?.() || [];
    if (Array.isArray(remoteWorkbook) && remoteWorkbook.length) {
      publishThreshold(remoteWorkbook);
    } else if (localWorkbook.length) {
      window.firebaseSync?.saveThreshold(localWorkbook);
    } else if (snapshot.exists()) {
      publishThreshold([]);
    }
  }, (error) => console.error('Firebase threshold sync failed', error));
});

window.firebaseSync = {
  saveRows(rows) {
    const requestedRows = rows.map((row, index) => ({
      ...row,
      recordId: row.recordId || `candidate-${index}`,
      order: index
    }));
    candidateSyncQueue = candidateSyncQueue.then(() => authReady.then(async (user) => {
      if (!user) return;
      const changedRows = requestedRows.filter((row) => syncedCandidateRows.get(row.recordId) !== JSON.stringify(withoutSyncMetadata(row)));
      const operationCount = changedRows.length;
      for (let start = 0; start < operationCount; start += 200) {
        const batch = writeBatch(db);
        changedRows.slice(start, start + 200).forEach((row) => {
          batch.set(doc(candidatesCollection, row.recordId), { ...row, updatedAt: serverTimestamp() }, { merge: true });
        });
        await batch.commit();
      }
      changedRows.forEach((row) => syncedCandidateRows.set(row.recordId, JSON.stringify(row)));
    })).catch((error) => console.error('Firebase candidate save failed', error));
    return candidateSyncQueue;
  },
  deleteRows(recordIds) {
    const ids = [...new Set(recordIds.filter(Boolean))];
    candidateSyncQueue = candidateSyncQueue.then(() => authReady.then(async (user) => {
      if (!user || !ids.length) return;
      const batch = writeBatch(db);
      ids.forEach((recordId) => batch.delete(doc(candidatesCollection, recordId)));
      await batch.commit();
      ids.forEach((recordId) => syncedCandidateRows.delete(recordId));
    })).catch((error) => console.error('Firebase candidate delete failed', error));
    return candidateSyncQueue;
  },
  saveThreshold(workbook) {
    return authReady.then((user) => {
      if (!user) return;
      return setDoc(thresholdDocument, { workbook: JSON.stringify(workbook), updatedAt: serverTimestamp() });
    }).catch((error) => console.error('Firebase threshold save failed', error));
  }
};
