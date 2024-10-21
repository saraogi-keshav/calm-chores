import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function IndexScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Text className="text-2xl text-blue-600 dark:text-blue-400">Loading...</Text>
      </View>
    );
  }

  return null; // This component will not render anything as it will always redirect
}