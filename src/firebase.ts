import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, setDoc, addDoc, deleteDoc, updateDoc, getDoc, getDocFromServer, query, where, getDocs, arrayUnion } from 'firebase/firestore';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Safely initialize messaging dynamically
export let messaging: any = null;
if (typeof window !== 'undefined') {
  import('firebase/messaging').then(({ getMessaging, isSupported }) => {
    isSupported().then((supported) => {
      if (supported) {
        messaging = getMessaging(app);
      }
    }).catch(console.error);
  }).catch(console.error);
}

export const googleProvider = new GoogleAuthProvider();

// Secondary app for creating users without signing out the admin
const secondaryApp = initializeApp(firebaseConfig, 'Secondary');
export const secondaryAuth = getAuth(secondaryApp);

// Auth Helpers
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const loginWithEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const registerWithEmail = async (email: string, pass: string, name: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(userCredential.user, { displayName: name });
  return userCredential;
};
export const createClientAccount = async (email: string, pass: string, name: string) => {
  const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
  await updateProfile(userCredential.user, { displayName: name });
  await signOut(secondaryAuth); // Sign out the secondary app immediately
  return userCredential;
};
export const logout = () => signOut(auth);

export const getUserCompanyId = async (uid: string, email: string): Promise<string | null> => {
  if (!uid && !email) return null;
  try {
    // Try direct lookup by UID first (most secure and efficient)
    if (uid) {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists() && userDoc.data().company_id) {
        return userDoc.data().company_id;
      }
    }

    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const usersRef = collection(db, 'users');
    
    // Try exact match first (best for security rules)
    const q1 = query(usersRef, where('email', '==', email));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) return snap1.docs[0].data().company_id;

    // Try lowercase match
    if (email !== cleanEmail) {
      const q2 = query(usersRef, where('email', '==', cleanEmail));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) return snap2.docs[0].data().company_id;
    }
    
    // Try with a trailing space (common typo)
    const q3 = query(usersRef, where('email', '==', cleanEmail + ' '));
    const snap3 = await getDocs(q3);
    if (!snap3.empty) return snap3.docs[0].data().company_id;

    console.warn("No user document found for uid/email:", uid, cleanEmail);
    return null;
  } catch (error) {
    console.error("Error fetching user company ID:", error);
    return null;
  }
};

// Firestore Error Handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const getShopIdBySlug = async (slug: string): Promise<string | null> => {
  try {
    const cleanSlug = slug.toLowerCase().trim();
    const slugDoc = await getDoc(doc(db, 'slugs', cleanSlug));
    if (slugDoc.exists()) {
      return slugDoc.data().shopId;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `slugs/${slug}`);
    return null;
  }
};

// FCM Helpers
export const requestNotificationToken = async () => {
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const { getToken } = await import('firebase/messaging');
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
};

export const saveNotificationToken = async (shopId: string, userId: string, token: string) => {
  try {
    await setDoc(doc(db, 'shops', shopId, 'notification_tokens', userId), {
      token,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving notification token:", error);
  }
};

export const sendPushNotification = async (token: string, title: string, body: string, data?: any) => {
  try {
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, title, body, data })
    });
  } catch (error) {
    console.error("Error calling send-notification API:", error);
  }
};

// Connection Test
async function testConnection() {
  try {
    // Use a path that is allowed by rules to avoid permission errors during boot
    await getDocFromServer(doc(db, 'slugs', 'health-check'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();
