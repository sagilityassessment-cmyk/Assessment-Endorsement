import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyA_UDbmN_mWkG4zeppYihulVL--X-vemAc',
  authDomain: 'endorsement-for-assessment.firebaseapp.com',
  projectId: 'endorsement-for-assessment',
  storageBucket: 'endorsement-for-assessment.firebasestorage.app',
  messagingSenderId: '1007926415730',
  appId: '1:1007926415730:web:79cbd9c2122b16bc140deb',
  measurementId: 'G-BZWFGXXCP6'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rowsDocument = doc(db, 'endorsementRows', 'shared');
const thresholdDocument = doc(db, 'settings', 'thresholdWorkbook');

let currentUser = null;
let resolveAuthReady;
const authReady = new Promise((resolve) => { resolveAuthReady = resolve; });

const publishRows = (rows) => window.applyRemoteHistoryRows?.(rows);
const publishThreshold = (workbook) => {
  try {
    const parsedWorkbook = typeof workbook === 'string' ? JSON.parse(workbook) : workbook;
    window.applyRemoteThresholdWorkbook?.(parsedWorkbook);
  } catch (error) {
    console.error('Firebase threshold data is invalid', error);
  }
};

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (!user) return;
  resolveAuthReady(user);
  getDoc(thresholdDocument).then((snapshot) => {
    const workbook = snapshot.data()?.workbook;
    if (typeof workbook === 'string' || Array.isArray(workbook)) publishThreshold(workbook);
  }).catch((error) => console.error('Firebase threshold load failed', error));
  onSnapshot(rowsDocument, (snapshot) => {
    const rows = snapshot.data()?.rows;
    if (Array.isArray(rows)) publishRows(rows);
    else {
      const localRows = window.getLocalHistoryRows?.();
      if (Array.isArray(localRows)) setDoc(rowsDocument, { rows: localRows, updatedAt: serverTimestamp() });
    }
  });
  onSnapshot(thresholdDocument, (snapshot) => {
    const workbook = snapshot.data()?.workbook;
    if (typeof workbook === 'string' || Array.isArray(workbook)) publishThreshold(workbook);
    else {
      const localWorkbook = window.getLocalThresholdWorkbook?.();
      if (Array.isArray(localWorkbook)) setDoc(thresholdDocument, { workbook: JSON.stringify(localWorkbook), updatedAt: serverTimestamp() });
    }
  });
});

signInAnonymously(auth).catch((error) => {
  console.error('Firebase anonymous sign-in failed', error);
});

window.firebaseSync = {
  saveRows(rows) {
    return authReady
      .then(() => setDoc(rowsDocument, { rows, updatedAt: serverTimestamp() }))
      .catch((error) => console.error('Firebase row sync failed', error));
  },
  saveThreshold(workbook) {
    return authReady.then(() => setDoc(thresholdDocument, { workbook: JSON.stringify(workbook), updatedAt: serverTimestamp() }));
  }
};
