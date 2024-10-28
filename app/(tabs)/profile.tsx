import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900">
      <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">Profile Screen</Text>
      {user && (
        <Text className="text-lg text-gray-700 dark:text-gray-300 mb-4">
          Welcome, {user.email}
        </Text>
      )}
      <TouchableOpacity
        className="bg-green-500 px-4 py-2 rounded-md"
        onPress={handleLogout}
      >
        <Text className="text-white font-bold">Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}