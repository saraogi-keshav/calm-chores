import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth } from 'firebase/auth';

import { app, auth, db } from '../firebase';

// Mock initial
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'fakeApiKey';
process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = 'fakeAuthDomain';
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'fakeProjectId';
process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = 'fakeStorageBucket';
process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'fakeMessagingSenderId';
process.env.EXPO_PUBLIC_FIREBASE_APP_ID = 'fakeAppId';

jest.mock('firebase/app', () => ({
    initializeApp: jest.fn(() => ({})),
}));
jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(() => ({})),
}));
jest.mock('firebase/auth', () => ({
    initializeAuth: jest.fn(() => ({})),
    getReactNativePersistence: jest.fn(() => ({})),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({}));

// test
describe('Firebase Initialization', () => {
    test('initialize Firebase app', () => {
        initializeApp;
        expect(app).toBeDefined();   
    });

    test('initialize Firebase Authentication', () => {
        initializeAuth
        expect(auth).toBeDefined();
    });

    test('initialize Firestore', () => {
        getFirestore
        expect(db).toBeDefined();
    });
});

