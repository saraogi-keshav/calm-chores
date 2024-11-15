import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, Redirect } from 'expo-router';
 
export default function IndexScreen() {
  const { user, loading } = useAuth();
 
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Text className="text-2xl text-blue-600 dark:text-blue-400">Loading...</Text>
      </View>
    );
  }
 
  if (user) {
    return <Redirect href="/(tabs)/home" />;
  }
 
  return <Redirect href="/login" />;
}