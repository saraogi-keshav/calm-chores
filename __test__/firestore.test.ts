import { getFirestore } from 'firebase/firestore';
import { app } from '../firebase';
import { db } from '../firestore';

// Mock Firebase Firestore 方法
jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(() => ({})),
}));

jest.mock('../firebase', () => ({
    app: {},
}));

describe('Firestore Initialization', () => {
    test('initialize Firestore with the Firebase app', () => {
        getFirestore;
        expect(db).toBeDefined();
    });
});