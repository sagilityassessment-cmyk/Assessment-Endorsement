import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore, doc, setDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

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
const sessionDocument = doc(db, 'settings', 'adminSession');
const loginView = document.querySelector('#portalLoginView');
const loginForm = document.querySelector('#portalLoginForm');
const loginMessage = document.querySelector('#portalLoginMessage');
const sessionKey = 'endorsementPortalLoggedIn';
const sessionStartedKey = 'endorsementPortalSessionStarted';
const isAssessmentOnly = new URLSearchParams(window.location.search).has('assessmentOnly');
let popupHideTimer = null;
let stopGlobalLogoutListener = null;

const getAuthErrorMessage = (error) => {
  const code = error?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Incorrect email or password.';
  }
  if (code.includes('too-many-requests')) return 'Too many attempts. Try again later.';
  if (code.includes('network-request-failed')) return 'Network error. Check your connection and try again.';
  if (code.includes('operation-not-allowed')) return 'Email/password sign-in is disabled in Firebase Authentication.';
  return 'Unable to sign in right now. Check the browser console for the Firebase error.';
};

const schedulePopupHide = () => {
  if (popupHideTimer) window.clearTimeout(popupHideTimer);
  popupHideTimer = window.setTimeout(() => {
    document.querySelector('#portalUserName')?.setAttribute('hidden', '');
    document.querySelectorAll('#portalUserList .portal-user-list-item.is-selected')
      .forEach((item) => item.classList.remove('is-selected'));
    popupHideTimer = null;
  }, 5000);
};

const getUserInitials = (email) => {
  const name = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
  const nameParts = name.split(/\s+/).filter(Boolean);
  return nameParts.length > 1
    ? `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

const updateUserProfile = (user) => {
  const profile = document.querySelector('#portalUserWrap');
  const emailElement = document.querySelector('#portalUserEmail');
  const nameElement = document.querySelector('#portalUserName');
  const avatar = document.querySelector('#portalUserAvatar');
  if (!profile || !user) return;
  const email = user.email || 'Signed-in user';
  profile.hidden = false;
  emailElement.textContent = email;
  nameElement.textContent = email;
  profile.title = email;
  avatar.textContent = getUserInitials(email);
};

document.querySelector('#portalUserProfile')?.addEventListener('click', () => {
  const nameElement = document.querySelector('#portalUserName');
  if (!nameElement) return;
  document.querySelectorAll('#portalUserList .portal-user-list-item.is-selected')
    .forEach((item) => item.classList.remove('is-selected'));
  nameElement.hidden = !nameElement.hidden;
  if (!nameElement.hidden) schedulePopupHide();
  else if (popupHideTimer) window.clearTimeout(popupHideTimer);
});

document.querySelector('#portalUserAvatar')?.addEventListener('click', (event) => {
  event.stopPropagation();
  document.querySelector('#portalUserProfile')?.click();
});

const unlock = () => {
  document.body.classList.remove('portal-locked');
  document.documentElement.classList.remove('portal-login-locked');
  loginView?.remove();
  window.dispatchEvent(new Event('portalUnlocked'));
};

const lock = () => {
  sessionStorage.removeItem(sessionKey);
  sessionStorage.removeItem(sessionStartedKey);
  document.body.classList.add('portal-locked');
  document.documentElement.classList.add('portal-login-locked');
  if (!document.querySelector('#portalLoginView')) window.location.reload();
};

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.querySelector('#portalLoginEmail').value.trim().toLowerCase();
  const password = document.querySelector('#portalLoginPassword').value;
  loginMessage.textContent = 'Signing in...';
  try {
    await Promise.race([
      signInWithEmailAndPassword(auth, email, password),
      new Promise((_, reject) => window.setTimeout(() => reject({ code: 'auth/timeout' }), 15000))
    ]);
    sessionStorage.setItem(sessionKey, 'true');
    sessionStorage.setItem(sessionStartedKey, String(Date.now()));
    unlock();
  } catch (error) {
    console.error('Portal sign-in failed', error);
    loginMessage.textContent = error?.code === 'auth/timeout'
      ? 'Sign-in timed out. Check your connection and try again.'
      : getAuthErrorMessage(error);
  }
});

document.querySelector('#portalResetPassword')?.addEventListener('click', async () => {
  const email = document.querySelector('#portalLoginEmail').value.trim().toLowerCase();
  if (!email) { loginMessage.textContent = 'Enter your company email first.'; return; }
  try {
    await sendPasswordResetEmail(auth, email);
    loginMessage.textContent = 'Password reset email sent.';
  } catch {
    loginMessage.textContent = 'Unable to send the reset email.';
  }
});

document.querySelector('.logout')?.addEventListener('click', async () => {
  await signOut(auth).catch(() => {});
  lock();
});

document.querySelector('#adminLogoutLink')?.addEventListener('click', async (event) => {
  event.preventDefault();
  if (window.prompt('Enter the admin logout password:') !== 'Sagility_1') return;
  await setDoc(sessionDocument, { logoutAt: serverTimestamp() }, { merge: true }).catch((error) => {
    console.error('Global logout signal failed', error);
  });
  await signOut(auth).catch(() => {});
  lock();
});

onAuthStateChanged(auth, (user) => {
  stopGlobalLogoutListener?.();
  stopGlobalLogoutListener = null;
  if (!user) return;
  stopGlobalLogoutListener = onSnapshot(sessionDocument, (snapshot) => {
    const logoutAt = snapshot.data()?.logoutAt?.toMillis?.() || 0;
    const sessionStarted = Number(sessionStorage.getItem(sessionStartedKey) || 0);
    if (logoutAt > sessionStarted) {
      signOut(auth).catch(() => {});
      lock();
    }
  }, (error) => console.error('Global logout listener failed', error));
});

if (sessionStorage.getItem(sessionKey) === 'true' || isAssessmentOnly) unlock();
