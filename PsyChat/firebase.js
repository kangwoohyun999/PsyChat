// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase 프로젝트 설정
// ⚠️ 실제 값으로 교체하세요!
const firebaseConfig = {
  apiKey: "AIzaSyCfmQU5NBRlB_oTDPAQukEt348cWQy9v9U",
  authDomain: "aiappproject-b3a30.firebaseapp.com",
  projectId: "aiappproject-b3a30",
  storageBucket: "aiappproject-b3a30.firebasestorage.app",
  messagingSenderId: "243555863658",
  appId: "1:243555863658:web:1edc711e21595fcdf84e13",
  measurementId: "G-DRZ26J9RG4"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 인증 및 Firestore 인스턴스
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;