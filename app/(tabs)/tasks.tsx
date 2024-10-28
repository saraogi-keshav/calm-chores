import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { collection, getDocs, query, where, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  userId: string;
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { user, house } = useAuth();
  const router = useRouter();

  const fetchTasks = async () => {
    if (!user || !house) return;

    try {
      
      const tasksRef = collection(db, 'houses', house.id, 'tasks');
      const q = query(tasksRef);
      const querySnapshot = await getDocs(q);
      
      const fetchedTasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        fetchedTasks.push({
          id: doc.id,
          ...doc.data(),
        } as Task);
      });
      
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [user, house])
  );

  const handleToggleComplete = async (taskId: string, currentStatus: boolean) => {
    if (!user || !house) return;

    try {
      
      const taskRef = doc(db, 'houses', house.id, 'tasks', taskId);
      await updateDoc(taskRef, {
        completed: !currentStatus
      });
      await fetchTasks(); 
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user || !house) return;

    try {
      
      const taskRef = doc(db, 'houses', house.id, 'tasks', taskId);
      await deleteDoc(taskRef);
      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
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
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 80 }} 
          renderItem={({ item }) => (
            <View className="bg-white dark:bg-gray-800 p-4 rounded-md mb-2 flex-row justify-between items-center">
              <TouchableOpacity
                onPress={() => handleToggleComplete(item.id, item.completed)}
                className="flex-1 flex-row items-center"
              >
                <View className={`w-6 h-6 rounded-full border-2 border-blue-500 mr-3 ${
                  item.completed ? 'bg-blue-500' : 'bg-transparent'
                }`}>
                  {item.completed && (
                    <Ionicons name="checkmark" size={20} color="white" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className={`text-black dark:text-white text-lg ${
                    item.completed ? 'line-through' : ''
                  }`}>
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text className="text-gray-600 dark:text-gray-400">
                      {item.description}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleDeleteTask(item.id)}
                className="ml-4"
              >
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-gray-100 dark:bg-gray-900">
        <TouchableOpacity
          className="bg-blue-500 p-4 rounded-md"
          onPress={() => router.push('/add-chore')}
        >
          <Text className="text-white text-center font-bold">Add New Task</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
