import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface House {
  id: string;
  name: string;
  // Add other house properties as needed
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  house: House | null;
  setHouse: (house: House | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  house: null,
  setHouse: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [house, setHouse] = useState<House | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Fetch user's house information from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          if (userData?.house) {
            // If user has a house, fetch house details
            const houseDoc = await getDoc(doc(db, 'houses', userData.house));
            const houseData = houseDoc.data();
            
            if (houseData) {
              setHouse({
                id: userData.house,
                name: houseData.name,
              });
            }
          } else {
            setHouse(null);
          }
        } catch (error) {
          console.error('Error fetching user house:', error);
          setHouse(null);
        }
      } else {
        setHouse(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, house, setHouse }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
