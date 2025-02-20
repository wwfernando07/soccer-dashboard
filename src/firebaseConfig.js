import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAQcqQhsFijIZ48aehhx2JNsDCdR8rQBoY",
  authDomain: "newington-soccer-admin.firebaseapp.com",
  projectId: "newington-soccer-admin",
  storageBucket: "newington-soccer-admin.appspot.com", // Fixed format
  messagingSenderId: "783028533904",
  appId: "1:783028533904:web:428f7cd15cbd194e4e7615",
  measurementId: "G-PE5N406385",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db };
