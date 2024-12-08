import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../firebase";
import { User } from "firebase/auth";

interface UserDetails {
  email: string;
  displayName: string | null;
  id: string;
  vacationMode: boolean;
}

interface HouseUser {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}

interface UserInfo {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  vacationMode: boolean;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, house, setHouse, houseLoading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [houseId, setHouseId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [houseUsers, setHouseUsers] = useState<UserDetails[]>([]);
  const [isEditingAreas, setIsEditingAreas] = useState(false);
  const [areas, setAreas] = useState<string[]>([]);
  const [newArea, setNewArea] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchHouseUsers = async () => {
      if (!house?.users) return;

      try {
        const userPromises = (
          Array.isArray(house.users) ? house.users : []
        ).map(async (userInfo: any) => ({
          email: userInfo.email || "",
          displayName: userInfo.displayName || null,
          id: userInfo.id,
          vacationMode: userInfo.vacationMode || false,
        }));

        const users = await Promise.all(userPromises);
        setHouseUsers(users);
      } catch (error) {
        console.error("Error fetching house users:", error);
      }
    };

    fetchHouseUsers();
  }, [house]);

  const handleAddHouse = () => {
    router.push("/add-house");
  };

  const copyToClipboard = async () => {
    if (house?.id) {
      await Clipboard.setStringAsync(house.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoinHouse = async () => {
    if (!user || !houseId.trim()) {
      Alert.alert("Error", "Please enter a house ID");
      return;
    }

    setIsLoading(true);
    try {
      const houseRef = doc(db, "houses", houseId.trim());
      const houseDoc = await getDoc(houseRef);

      if (!houseDoc.exists()) {
        Alert.alert(
          "Error",
          "House not found. Please check the ID and try again."
        );
        setIsLoading(false);
        return;
      }

      const houseData = houseDoc.data();

      const userExists = houseData.users?.some(
        (houseUser: HouseUser) => houseUser.id === user.uid
      );
      if (userExists) {
        Alert.alert("Error", "You are already a member of this house");
        setIsLoading(false);
        return;
      }

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        house: houseId.trim(),
        houseName: houseData.name,
      });

      await updateDoc(houseRef, {
        users: arrayUnion({
          id: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          photoURL: user.photoURL || null,
          vacationMode: false,
        }),
      });

      setHouse({
        id: houseId.trim(),
        name: houseData.name,
        users: [
          ...(houseData.users || []),
          {
            id: user.uid,
            email: user.email || "",
            displayName: user.displayName || "",
            photoURL: user.photoURL || null,
            vacationMode: false,
          },
        ],
        areas: houseData.areas || [],
      });

      Alert.alert("Success", `You've joined ${houseData.name}!`);
      setHouseId("");
    } catch (error) {
      console.error("Error joining house:", error);
      Alert.alert("Error", "Failed to join house. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshHouseDetails = useCallback(async () => {
    if (!user || isRefreshing) return;

    setIsRefreshing(true);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      if (userData?.house) {
        const houseRef = doc(db, "houses", userData.house);
        const houseDoc = await getDoc(houseRef);
        const houseData = houseDoc.data();

        if (houseData && Array.isArray(houseData.users)) {
          const usersInfo = houseData.users.map((houseUser: any) => ({
            id: houseUser.id,
            email: houseUser.email || "",
            displayName: houseUser.displayName || "",
            photoURL: houseUser.photoURL || null,
            vacationMode: houseUser.vacationMode || false,
          }));

          setHouse({
            id: userData.house,
            name: houseData.name || "",
            users: usersInfo,
            areas: houseData.areas || [],
          });
        } else {
          setHouse({
            id: userData.house,
            name: houseData?.name || "",
            users: [],
            areas: [],
          });
        }
      }
    } catch (error) {
      console.error("Error refreshing house details:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user, isRefreshing]);

  useEffect(() => {
    if (user) {
      refreshHouseDetails();
    }
  }, [user]);

  const handleUpdateAreas = async () => {
    if (!house?.id) return;

    try {
      const houseRef = doc(db, "houses", house.id);
      await updateDoc(houseRef, {
        areas: areas,
      });

      setHouse({
        ...house,
        areas: areas,
      });

      setIsEditingAreas(false);
    } catch (error) {
      console.error("Error updating areas:", error);
      Alert.alert("Error", "Failed to update house areas");
    }
  };

  useEffect(() => {
    if (house?.areas) {
      setAreas(house.areas);
    }
  }, [house]);

  const handleVacationModeToggle = async (
    userId: string,
    currentMode: boolean
  ) => {
    if (!house?.id) return;

    try {
      const houseRef = doc(db, "houses", house.id);
      const updatedUsers = house.users.map((u) =>
        u.id === userId ? { ...u, vacationMode: !currentMode } : u
      );

      // Update Firestore
      await updateDoc(houseRef, {
        users: updatedUsers,
      });

      // Update local state
      setHouse({
        ...house,
        users: updatedUsers,
      });
    } catch (error) {
      console.error("Error updating vacation mode:", error);
      Alert.alert("Error", "Failed to update vacation mode");
    }
  };

  if (houseLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900">
        <Text className="text-gray-600 dark:text-gray-400">
          Loading house details...
        </Text>
      </View>
    );
  }

  if (!house) {
    return (
      <View className="flex-1 justify-center bg-gray-100 dark:bg-gray-900 mx-6">
        <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">
          Welcome to CalmChores!
        </Text>
        <TouchableOpacity
          className="w-full bg-blue-500 rounded-md p-2 mb-4"
          onPress={handleAddHouse}
        >
          <Text className="text-white font-bold text-center">Add House</Text>
        </TouchableOpacity>

        <View className="w-full space-y-2">
          <TextInput
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-black dark:text-white"
            placeholder="Enter House ID"
            placeholderTextColor="#9CA3AF"
            value={houseId}
            onChangeText={setHouseId}
          />
          <TouchableOpacity
            className={`w-full bg-blue-500 rounded-md p-2 ${
              isLoading ? "opacity-50" : ""
            }`}
            onPress={handleJoinHouse}
            disabled={isLoading}
          >
            <Text className="text-white font-bold text-center">
              {isLoading ? "Joining..." : "Join House"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900 mx-8">
      <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">
        Home Screen
      </Text>
      <Text className="text-lg text-gray-700 dark:text-gray-300 mb-4">
        Your House: {house.name}
      </Text>
      <Pressable
        onPress={copyToClipboard}
        className="flex-row items-center bg-gray-200 dark:bg-gray-800 rounded-lg p-3 mb-4"
      >
        <Text className="text-gray-700 dark:text-gray-300 mr-2">
          House ID: {house.id}
        </Text>
        <Ionicons
          name={copied ? "checkmark-circle" : "copy-outline"}
          size={20}
          color={copied ? "#22c55e" : "#6b7280"}
        />
      </Pressable>
      {copied && (
        <Text className="text-green-500 text-sm mb-4">
          Copied to clipboard!
        </Text>
      )}

      <View className="w-full bg-white dark:bg-gray-800 rounded-lg p-2 mt-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
            House Members
          </Text>
          <Text className="text-blue-500">Vacation Mode</Text>
        </View>

        {houseUsers.map((houseUser, index) => (
          <View
            key={index}
            className="flex-row items-center py-2 border-t border-gray-200 dark:border-gray-700"
          >
            <Ionicons
              name="person-circle-outline"
              size={24}
              color="#6b7280"
              className="mr-2"
            />
            <Text className="text-gray-700 dark:text-gray-300 mx-2">
              {houseUser.displayName || houseUser.email}
            </Text>
            <TouchableOpacity
              className="ml-auto flex-row items-center"
              onPress={() => {
                if (houseUser.email === user?.email) {
                  handleVacationModeToggle(
                    houseUser.id,
                    houseUser.vacationMode
                  );
                }
              }}
              disabled={houseUser.email !== user?.email}
            >
              <View
                className={`w-12 h-6 rounded-full mx-2 ${
                  houseUser.vacationMode
                    ? "bg-blue-500"
                    : "bg-gray-300 dark:bg-gray-600"
                } ${houseUser.email !== user?.email ? "opacity-50" : ""}`}
              >
                <View
                  className={`w-5 h-5 rounded-full bg-white shadow mt-0.5 ${
                    houseUser.vacationMode ? "ml-7" : "ml-0.5"
                  }`}
                />
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View className="w-full bg-white dark:bg-gray-800 rounded-lg p-2 mt-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-bold text-gray-700 dark:text-gray-300">
            House Areas
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (isEditingAreas) {
                handleUpdateAreas();
              } else {
                setIsEditingAreas(true);
              }
            }}
          >
            <Text className="text-blue-500">
              {isEditingAreas ? "Done" : "Edit"}
            </Text>
          </TouchableOpacity>
        </View>

        {isEditingAreas ? (
          <View>
            {areas.map((area, index) => (
              <View
                key={index}
                className="flex-row items-center justify-between py-2 border-t border-gray-200 dark:border-gray-700"
              >
                <Text className="text-gray-700 dark:text-gray-300">{area}</Text>
                <TouchableOpacity
                  onPress={() => {
                    const newAreas = areas.filter((_, i) => i !== index);
                    setAreas(newAreas);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            <View className="flex-row items-center mt-2">
              <TextInput
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md p-2 mr-2 text-gray-700 dark:text-gray-300"
                placeholder="Add new area"
                placeholderTextColor="#9CA3AF"
                value={newArea}
                onChangeText={setNewArea}
              />
              <TouchableOpacity
                onPress={() => {
                  if (newArea.trim()) {
                    setAreas([...areas, newArea.trim()]);
                    setNewArea("");
                  }
                }}
              >
                <Ionicons name="add-circle-outline" size={24} color="#3b82f6" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            {areas.map((area, index) => (
              <View
                key={index}
                className="flex-row items-center py-2 border-t border-gray-200 dark:border-gray-700"
              >
                <Ionicons
                  name="home-outline"
                  size={24}
                  color="#6b7280"
                  className="mr-2"
                />
                <Text className="mx-2 text-gray-700 dark:text-gray-300">
                  {area}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
