// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBdpQUGpUEfph7KUPI1ej04Q1s3zXC12lw",
  authDomain: "hotel-heaven-d3664.firebaseapp.com",
  projectId: "hotel-heaven-d3664",
  storageBucket: "hotel-heaven-d3664.firebasestorage.app",
  messagingSenderId: "516588805136",
  appId: "1:516588805136:web:e4b1832b377188c3af3e95",
  measurementId: "G-K4SRH5FZ1N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Google provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();