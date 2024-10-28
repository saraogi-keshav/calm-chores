import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { collection, addDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function AddHouseScreen() {
  const [houseName, setHouseName] = useState('');
  const { user, setHouse } = useAuth();
  const router = useRouter();

  const handleAddHouse = async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      
      const houseRef = await addDoc(collection(db, 'houses'), {
        name: houseName,
        ownerId: user.uid,
        createdAt: new Date().toISOString(),
      });

      
      const tasksCollectionRef = collection(db, 'houses', houseRef.id, 'tasks');
      await setDoc(doc(tasksCollectionRef, 'initial-task'), {
        title: 'Welcome to your new house!',
        description: 'Start by adding some tasks for your household.',
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
      });

      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        house: houseRef.id,
        houseName: houseName 
      });

      
      setHouse({
        id: houseRef.id,
        name: houseName,
      });

      console.log('House created and user updated successfully');
      router.back(); 
    } catch (error) {
      console.error('Error adding house: ', error);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900 p-4">
      <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">Add New House</Text>
      <TextInput
        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 mb-4 text-black dark:text-white"
        placeholder="House Name"
        value={houseName}
        onChangeText={setHouseName}
      />
      <TouchableOpacity
        className="w-full bg-blue-500 rounded-md p-2 mb-4"
        onPress={handleAddHouse}
      >
        <Text className="text-white font-bold text-center">Create House</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}>
        <Text className="text-blue-500 dark:text-blue-400">Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}
