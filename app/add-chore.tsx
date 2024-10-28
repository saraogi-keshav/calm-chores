import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function AddChoreScreen() {
  const [choreName, setChoreName] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const router = useRouter();
  const { user, house } = useAuth();

  const onChangeDate = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || dueDate;
    setDueDate(currentDate);
  };

  const onChangeTime = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || dueDate;
    setDueDate(currentDate);
  };

  const handleAddChore = async () => {
    if (!user || !house) {
      console.error('User not authenticated or no house selected');
      return;
    }

    try {
      await addDoc(collection(db, 'houses', house.id, 'tasks'), {
        title: choreName,
        dueDate: dueDate.toISOString(),
        userId: user.uid,
        completed: false,
        createdAt: new Date().toISOString(),
      });
      router.back();
    } catch (error) {
      console.error('Error adding chore: ', error);
    }
  };

  if (!house) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900">
        <Text className="text-gray-600 dark:text-gray-400">
          Please join or create a house first
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-gray-900">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">Add New Chore</Text>
        
        <TextInput
          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 mb-6 text-black dark:text-white"
          placeholder="Chore Name"
          value={choreName}
          onChangeText={setChoreName}
        />

        <View className="mb-6 items-center space-y-2">
          <Text className="text-gray-700 dark:text-gray-300 text-lg mb-2">Select Due Date and Time</Text>
          <DateTimePicker 
            testID="datePicker"
            value={dueDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'compact' : 'default'}
            onChange={onChangeDate}
            className="h-12 mb-2"
          />
          <DateTimePicker
            testID="timePicker"
            value={dueDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'compact' : 'default'}
            onChange={onChangeTime}
            className="h-12 mb-4"
          />
        </View>

        <View className="flex-1" />

        <TouchableOpacity
          className="w-full bg-blue-500 rounded-md p-4 mb-4"
          onPress={handleAddChore}
        >
          <Text className="text-white font-bold text-center text-lg">Add Chore</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
