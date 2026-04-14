import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBP3vTcW7ADSkYwNXRzHGZU8GoSgD3HuuY",
  authDomain: "aquafill-74aa1.firebaseapp.com",
  projectId: "aquafill-74aa1",
  storageBucket: "aquafill-74aa1.firebasestorage.app",
  messagingSenderId: "417640862218",
  appId: "1:417640862218:web:f45acf09792f663e4d05f3"
};  

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

provider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutGoogle() {
  await signOut(auth);
}

export { auth };