import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function AddChoreScreen() {
  const [choreName, setChoreName] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || dueDate;
    setShowDatePicker(Platform.OS === 'ios');
    setDueDate(currentDate);
  };

  const onChangeTime = (event, selectedTime) => {
    const currentTime = selectedTime || dueDate;
    setShowTimePicker(Platform.OS === 'ios');
    setDueDate(currentTime);
  };

  const handleAddChore = async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      await addDoc(collection(db, 'tasks'), {
        name: choreName,
        dueDate: dueDate.toISOString(),
        userId: user.uid,
        completed: false,
      });
      router.back();
    } catch (error) {
      console.error('Error adding chore: ', error);
    }
  };

  return (
    <View className="flex-1 bg-gray-100 dark:bg-gray-900 p-4">
      <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">Add New Chore</Text>
      <TextInput
        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 mb-4 text-black dark:text-white"
        placeholder="Chore Name"
        value={choreName}
        onChangeText={setChoreName}
      />
      <TouchableOpacity
        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 mb-4"
        onPress={() => setShowDatePicker(true)}
      >
        <Text className="text-black dark:text-white">
          Due Date: {dueDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 mb-4"
        onPress={() => setShowTimePicker(true)}
      >
        <Text className="text-black dark:text-white">
          Due Time: {dueDate.toLocaleTimeString()}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          testID="datePicker"
          value={dueDate}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={onChangeDate}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          testID="timePicker"
          value={dueDate}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onChangeTime}
        />
      )}
      <TouchableOpacity
        className="w-full bg-blue-500 rounded-md p-2 mt-4"
        onPress={handleAddChore}
      >
        <Text className="text-white font-bold text-center">Add Chore</Text>
      </TouchableOpacity>
    </View>
  );
}
