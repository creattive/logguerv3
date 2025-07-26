import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyA9niPl0-OWWv-CoAy-EJ-Q8vrLFm9YJHM",
  authDomain: "baiano-playout.firebaseapp.com",
  projectId: "baiano-playout",
  storageBucket: "baiano-playout.firebasestorage.app",
  messagingSenderId: "53952186676",
  appId: "1:53952186676:web:07e54c1c96d9d8d8743d61",
  measurementId: "G-DLXCLGLK01"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export default app;