import React, { createContext, useState, useEffect, useContext } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

interface UserInfo {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  vacationMode: boolean;
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
  updateUserDisplayName: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  house: null,
  setHouse: () => {},
  houseLoading: true,
  updateUserDisplayName: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [house, setHouse] = useState<House | null>(null);
  const [houseLoading, setHouseLoading] = useState(true);

  const defaultAreas = ["Common Area", "Kitchen", "Living Area"];

  useEffect(() => {
    console.log("House state updated:", {
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
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const userData = userDoc.data();

          if (userData?.house) {
            const houseRef = doc(db, "houses", userData.house);
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
          console.error("Error fetching user house and members:", error);
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

  const updateUserDisplayName = async (displayName: string) => {
    if (!user) return;

    try {
      if (house) {
        const houseRef = doc(db, "houses", house.id);
        const houseDoc = await getDoc(houseRef);

        if (houseDoc.exists()) {
          const houseData = houseDoc.data();
          const updatedUsers = houseData.users.map((houseUser: any) => {
            if (houseUser.id === user.uid) {
              return {
                ...houseUser,
                displayName: displayName,
              };
            }
            return houseUser;
          });

          await updateDoc(houseRef, {
            users: updatedUsers,
          });

          setHouse({
            ...house,
            users: updatedUsers,
          });
        }
      }
    } catch (error) {
      console.error("Error updating display name in house:", error);
      throw error;
    }
  };

  const value = {
    user,
    house,
    loading,
    updateUserDisplayName,
    setHouse,
    houseLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
