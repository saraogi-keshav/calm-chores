import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function HomeScreen() {
  const router = useRouter();
  const { user, house, setHouse } = useAuth();
  const [copied, setCopied] = useState(false);
  const [houseId, setHouseId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddHouse = () => {
    router.push('/add-house');
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
      Alert.alert('Error', 'Please enter a house ID');
      return;
    }

    setIsLoading(true);
    try {
      const houseRef = doc(db, 'houses', houseId.trim());
      const houseDoc = await getDoc(houseRef);

      if (!houseDoc.exists()) {
        Alert.alert('Error', 'House not found. Please check the ID and try again.');
        return;
      }

      const houseData = houseDoc.data();

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        house: houseId.trim(),
        houseName: houseData.name
      });

      setHouse({
        id: houseId.trim(),
        name: houseData.name
      });

      Alert.alert('Success', `You've joined ${houseData.name}!`);
      setHouseId(''); 

    } catch (error) {
      console.error('Error joining house:', error);
      Alert.alert('Error', 'Failed to join house. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900 mx-8">
      <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">Home Screen</Text>
      {house ? (
        <>
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
        </>
      ) : (
        <>
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
              className={`w-full bg-blue-500 rounded-md p-2 ${isLoading ? 'opacity-50' : ''}`}
              onPress={handleJoinHouse}
              disabled={isLoading}
            >
              <Text className="text-white font-bold text-center">
                {isLoading ? 'Joining...' : 'Join House'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
