import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface UserInfo {
  id: string;
  email: string;
  displayName: string | null;
  // Add any other user fields you need
}

interface House {
  id: string;
  name: string;
  users: UserInfo[];
  areas: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  house: House | null;
  setHouse: (house: House | null) => void;
  houseLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  house: null,
  setHouse: () => {},
  houseLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [house, setHouse] = useState<House | null>(null);
  const [houseLoading, setHouseLoading] = useState(true);

  const defaultAreas = ["Common Area", "Kitchen", "Living Area"];

  useEffect(() => {
    console.log('House state updated:', {
      id: house?.id,
      name: house?.name,
      users: house?.users,
      areas: house?.areas,
    });
  }, [house]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          setHouseLoading(true);
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          if (userData?.house) {
            const houseRef = doc(db, 'houses', userData.house);
            const houseDoc = await getDoc(houseRef);
            const houseData = houseDoc.data();
            
            if (houseData) {
              setHouse({
                id: userData.house,
                name: houseData.name,
                users: houseData.users || [],
                areas: houseData.areas || defaultAreas,
              });
            }
          } else {
            setHouse(null);
          }
        } catch (error) {
          console.error('Error fetching user house and members:', error);
          setHouse(null);
        } finally {
          setHouseLoading(false);
          setLoading(false);
        }
      } else {
        setHouse(null);
        setHouseLoading(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      house, 
      setHouse,
      houseLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
