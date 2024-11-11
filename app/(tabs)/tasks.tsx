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
  const [selectedTab, setSelectedTab] = useState('all');

  const fetchTasks = useCallback(async () => {
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
  }, [user, house]);

  useFocusEffect(
    useCallback(() => {
      if (user && house) {
        fetchTasks();
      }
    }, [user, house, fetchTasks])
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
      <View className="px-4 pt-4 flex-row items-center justify-between">
        <Text className="text-2xl pr-4 pl-1 font-bold text-gray-500 dark:text-white">
          Chores
        </Text>
        <View className="flex-row bg-gray-200 dark:bg-gray-800 rounded-lg p-1 flex-1 max-w-[290px]">
          {['Mine', 'All', 'Completed'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab.toLowerCase())}
              className={`flex-1 p-2 rounded-md ${
                selectedTab === tab.toLowerCase()
                  ? 'bg-white dark:bg-gray-700'
                  : ''
              }`}
            >
              <Text
                className={`text-center text-sm ${
                  selectedTab === tab.toLowerCase()
                    ? 'text-blue-500 font-semibold'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
      </View>

      <View className="flex-1 p-4">
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 80 }} 
          renderItem={({ item }) => (
            <View className="bg-white dark:bg-gray-800 p-4 rounded-md mb-2">
              <TouchableOpacity
                onPress={() => router.push(`/task-info/${item.id}`)}
                className="flex-1 flex-row items-center"
              >
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleComplete(item.id, item.completed);
                  }}
                  className={`w-6 h-6 rounded-full border-2 border-blue-500 mr-3 ${
                    item.completed ? 'bg-blue-500' : 'bg-transparent'
                  }`}
                >
                  {item.completed && (
                    <Ionicons name="checkmark" size={20} color="white" />
                  )}
                </TouchableOpacity>
                <View className="flex-1">
                  <Text className={`text-black dark:text-white text-lg ${
                    item.completed ? 'line-through' : ''
                  }`}>
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text 
                      numberOfLines={2} 
                      ellipsizeMode="tail" 
                      className="text-gray-600 dark:text-gray-400"
                    >
                      {item.description}
                    </Text>
                  )}
                </View>
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
