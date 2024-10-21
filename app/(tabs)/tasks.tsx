import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const taskList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(taskList);
        console.log(taskList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to fetch tasks');
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900">
        <Text className="text-xl text-blue-600 dark:text-blue-400">Loading tasks...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900">
        <Text className="text-xl text-red-600 dark:text-red-400">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100 dark:bg-gray-900 p-4">
      <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">Tasks</Text>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="bg-white dark:bg-gray-800 p-4 mb-2 rounded-md">
            <Text className="text-lg text-gray-800 dark:text-gray-200">{item.name}</Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              Due: {new Date(item.dueDate).toLocaleString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-gray-600 dark:text-gray-400 text-center">No tasks found</Text>
        }
      />
      <TouchableOpacity
        className="bg-blue-500 rounded-full p-4"
        onPress={() => router.push('/add-chore')}
      >
        <Text className="text-white font-bold text-xl">+ add chore</Text>
      </TouchableOpacity>
    </View>
  );
}