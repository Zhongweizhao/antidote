import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

firebase.initializeApp({
  apiKey: "AIzaSyDsKBNlCVmsiW2V9VA7KKXj1UoGXU1nMNY",
  authDomain: "antidote-6717c.firebaseapp.com",
  projectId: "antidote-6717c",
  storageBucket: "antidote-6717c.appspot.com",
  messagingSenderId: "538217539770",
  appId: "1:538217539770:web:733a470e0bb68071763a83",
  measurementId: "G-KY94LPRBHB"
});

const auth = firebase.auth();
const firestore = firebase.firestore();

export { firebase, auth, firestore };