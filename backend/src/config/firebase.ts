import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

export const db = getFirestore();
export const auth = getAuth();

// Collections
export const collections = {
  users: db.collection('users'),
  bots: db.collection('bots'),
  sessions: db.collection('sessions'),
  commands: db.collection('commands'),
  logs: db.collection('logs'),
  warnings: db.collection('warnings'),
  deletedMessages: db.collection('deletedMessages')
};

export default admin;
