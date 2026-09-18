import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore, doc, collection, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyA_UDbmN_mWkG4zeppYihulVL--X-vemAc',
  authDomain: 'endorsement-for-assessment.firebaseapp.com',
  projectId: 'endorsement-for-assessment',
  storageBucket: 'endorsement-for-assessment.firebasestorage.app',
  messagingSenderId: '1007926415730',
  appId: '1:1007926415730:web:79cbd9c2122b16bc140deb',
  measurementId: 'G-BZWFGXXCP6'
};

const app = initializeApp(firebaseConfig, 'endorsement-auth');
const auth = getAuth(app);
const db = getFirestore(app);
const sessionDocument = doc(db, 'settings', 'adminSession');
const activeUsersCollection = collection(db, 'activePortalUsers');
const loginView = document.querySelector('#portalLoginView');
const loginForm = document.querySelector('#portalLoginForm');
const loginMessage = document.querySelector('#portalLoginMessage');
const sessionKey = 'endorsementPortalLoggedIn';
const sessionStartedKey = 'endorsementPortalSessionStarted';
const isAssessmentOnly = new URLSearchParams(window.location.search).has('assessmentOnly');
let activeUserId = '';
let activeAuthUid = '';
let activeUserHeartbeat = null;
let stopActiveUsersListener = null;
let popupHideTimer = null;

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

const stopActiveUserPresence = () => {
  if (activeUserHeartbeat) window.clearInterval(activeUserHeartbeat);
  activeUserHeartbeat = null;
  if (stopActiveUsersListener) stopActiveUsersListener();
  stopActiveUsersListener = null;
  if (activeUserId) deleteDoc(doc(activeUsersCollection, activeUserId)).catch(() => {});
  activeUserId = '';
  activeAuthUid = '';
};

const startActiveUserPresence = (user) => {
  if (!user || activeAuthUid === user.uid) return;
  stopActiveUserPresence();
  activeAuthUid = user.uid;
  activeUserId = window.crypto?.randomUUID?.() || `${user.uid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const presenceRef = doc(activeUsersCollection, activeUserId);
  const heartbeat = () => setDoc(presenceRef, { uid: user.uid, email: user.email || '', lastSeen: serverTimestamp() }, { merge: true }).catch((error) => {
    console.error('Active user presence write failed', error);
  });
  heartbeat();
  activeUserHeartbeat = window.setInterval(heartbeat, 30000);
  stopActiveUsersListener = onSnapshot(activeUsersCollection, (snapshot) => {
    const now = Date.now();
    const sessionsByEmail = new Map();
    snapshot.docs.forEach((item) => {
      const data = item.data();
      const lastSeen = data.lastSeen?.toMillis?.() || 0;
      if (!lastSeen || now - lastSeen >= 90000) return;
      const email = data.email || 'Signed-in user';
      sessionsByEmail.set(email, (sessionsByEmail.get(email) || 0) + 1);
    });
    const currentEmail = user.email || 'Signed-in user';
    const count = document.querySelector('#portalUserCount');
    const currentSessionCount = String(sessionsByEmail.get(currentEmail) || 1);
    if (count) count.textContent = currentSessionCount;
    document.querySelector('#portalUserProfile')?.setAttribute('data-count', currentSessionCount);
    const list = document.querySelector('#portalUserList');
    if (list) {
      list.replaceChildren(...Array.from(sessionsByEmail.entries())
        .filter(([email]) => email !== currentEmail)
        .map(([email, sessionCount]) => {
          const userItem = document.createElement('button');
          userItem.className = 'portal-user-list-item';
          userItem.type = 'button';
          userItem.setAttribute('role', 'listitem');
          userItem.textContent = getUserInitials(email);
          userItem.title = email;
          userItem.setAttribute('aria-label', email);
          userItem.dataset.email = email;
          userItem.dataset.initial = getUserInitials(email);
          userItem.dataset.count = String(sessionCount);
          const emailLabel = document.createElement('span');
          emailLabel.className = 'portal-user-label';
          emailLabel.textContent = email;
          userItem.append(emailLabel);
          userItem.addEventListener('click', () => {
            const currentName = document.querySelector('#portalUserName');
            if (currentName) currentName.hidden = true;
            const wasSelected = userItem.classList.contains('is-selected');
            document.querySelectorAll('#portalUserList .portal-user-list-item.is-selected')
              .forEach((item) => {
                if (item !== userItem) item.classList.remove('is-selected');
              });
            userItem.classList.toggle('is-selected', !wasSelected);
            if (!wasSelected) schedulePopupHide();
            else if (popupHideTimer) window.clearTimeout(popupHideTimer);
          });
          return userItem;
        }));
    }
  }, (error) => {
    console.error('Active user presence read failed', error);
    const count = document.querySelector('#portalUserCount');
    if (count) {
      count.textContent = '!';
      count.title = 'Active users unavailable: check Firebase Firestore permissions.';
    }
  });
};

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
    await signInWithEmailAndPassword(auth, email, password);
    sessionStorage.setItem(sessionKey, 'true');
    sessionStorage.setItem(sessionStartedKey, String(Date.now()));
    unlock();
  } catch {
    loginMessage.textContent = 'Incorrect email or password.';
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
  stopActiveUserPresence();
  await signOut(auth).catch(() => {});
  lock();
});

document.querySelector('#adminLogoutLink')?.addEventListener('click', async (event) => {
  event.preventDefault();
  if (window.prompt('Enter the admin logout password:') !== 'Sagility_1') return;
  await setDoc(sessionDocument, { logoutAt: serverTimestamp() }, { merge: true });
  stopActiveUserPresence();
  await signOut(auth).catch(() => {});
  lock();
});

let globalLogoutListening = false;
const watchGlobalLogout = () => {
  if (globalLogoutListening) return;
  globalLogoutListening = true;
  onSnapshot(sessionDocument, (snapshot) => {
    const logoutAt = snapshot.data()?.logoutAt?.toMillis?.() || 0;
    const started = Number(sessionStorage.getItem(sessionStartedKey) || 0);
    if (logoutAt > started) lock();
  });
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    updateUserProfile(user);
    startActiveUserPresence(user);
    watchGlobalLogout();
  } else {
    stopActiveUserPresence();
  }
});

window.addEventListener('beforeunload', stopActiveUserPresence);

if (sessionStorage.getItem(sessionKey) === 'true' || isAssessmentOnly) unlock();
