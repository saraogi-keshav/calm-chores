import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { collection, getDocs, query, where, updateDoc, deleteDoc, doc, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  assignedTo: string | null;
  createdBy: string;
  createdAt: string;
  dueDate: string;
  isRepeating: boolean;
  repeatDays?: number;
  alwaysRepeat: boolean;
  autoRotate: boolean;
  area: string | null;
  completedBy?: string | null;
  completedAt?: string | null;
  overdueCompletion?: boolean;
  repeatTaskId?: string | null;
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { user, house } = useAuth();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isCompletingTask, setIsCompletingTask] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!user || !house || isLoading) return;
    
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, house?.id]);

  useEffect(() => {
    if (user?.uid && house?.id) {
      fetchTasks();
    }
  }, [user?.uid, house?.id]);

  const handleToggleComplete = async (taskId: string, currentStatus: boolean) => {
    if (!user || !house) return;

    setIsCompletingTask(true);
    try {
      const taskRef = doc(db, 'houses', house.id, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);
      const taskData = taskDoc.data() as Task;
      
      if (!taskData) return;

      const now = new Date().toISOString();

      await updateDoc(taskRef, {
        completed: !currentStatus,
        completedBy: !currentStatus ? user.uid : null,
        completedAt: !currentStatus ? now : null,
        overdueCompletion: !currentStatus ? new Date(taskData.dueDate) < new Date() : null
      });

      if (!currentStatus && taskData.isRepeating) {
        const newTaskData = {
          ...taskData,
          completed: false,
          completedBy: null,
          completedAt: null,
          overdueCompletion: null,
          createdAt: now,
        };

        if (taskData.autoRotate) {
          const nextAssignee = await getNextUserInRotation(
            house.id, 
            house.users, 
            taskData.repeatTaskId || null, 
            taskData.assignedTo
          );
          newTaskData.assignedTo = nextAssignee;
        }

        if (taskData.alwaysRepeat) {
          await addDoc(collection(db, 'houses', house.id, 'tasks'), newTaskData);
        } else if (taskData.repeatDays) {
          const currentDueDate = new Date(taskData.dueDate);
          const newDueDate = new Date(currentDueDate.setDate(currentDueDate.getDate() + taskData.repeatDays));
          
          await addDoc(collection(db, 'houses', house.id, 'tasks'), {
            ...newTaskData,
            dueDate: newDueDate.toISOString()
          });
        }
      }
      
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert("Error", "Failed to complete task. Please try again.");
    } finally {
      setIsCompletingTask(false);
    }
  };

  const filteredTasks = useMemo(() => {
    let filtered;
    switch (selectedTab) {
      case 'mine':
        filtered = tasks.filter(task => 
          task.assignedTo === user?.uid && !task.completed
        );
        break;
      case 'completed':
        filtered = tasks.filter(task => task.completed);
        break;
      case 'all':
      default:
        filtered = tasks.filter(task => !task.completed);
    }

    return filtered.sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }, [tasks, selectedTab, user?.uid]);

  const handleRefresh = useCallback(() => {
    fetchTasks();
  }, [fetchTasks]);

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
          {['mine', 'all', 'completed'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab)}
              className={`flex-1 p-2 rounded-md ${
                selectedTab === tab ? 'bg-white dark:bg-gray-700' : ''
              }`}
            >
              <Text
                className={`text-center text-sm ${
                  selectedTab === tab
                    ? 'text-blue-500 font-semibold'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
      </View>

      <View className="flex-1 p-4">
        <FlatList
          key={selectedTab}
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 80 }}
          extraData={selectedTab}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View className="bg-white dark:bg-gray-800 p-4 rounded-md mb-2">
              <View className="flex-row mb-3">
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleComplete(item.id, item.completed);
                  }}
                  className={`w-6 h-6 rounded-full border-2 border-blue-500 mr-3 flex-shrink-0 ${
                    item.completed ? 'bg-blue-500' : 'bg-transparent'
                  }`}
                >
                  {item.completed && (
                    <Ionicons name="checkmark" size={20} color="white" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => router.push(`/task-info/${item.id}`)}
                  className="flex-1"
                >
                  <View className="flex-1">
                    <Text 
                      className={`text-black dark:text-white text-lg flex-wrap ${
                        item.completed ? 'line-through opacity-60' : ''
                      }`}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    {item.description && (
                      <Text 
                        numberOfLines={2} 
                        ellipsizeMode="tail" 
                        className={`text-gray-600 dark:text-gray-400 ${
                          item.completed ? 'opacity-60' : ''
                        }`}
                      >
                        {item.description}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                className="flex-row gap-2 mt-1"
              >
                {!item.alwaysRepeat && (
                  <View className={`bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full ${
                    item.completed ? 'opacity-60' : ''
                  }`}>
                    <Text className="text-xs text-gray-700 dark:text-gray-300">
                      Due: {new Date(item.dueDate).toLocaleString([], {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                )}
                {item.completed && item.completedBy && (
                  <View className={`bg-green-100 dark:bg-green-900 px-2 py-1 rounded-full opacity-60`}>
                    <Text className="text-xs text-green-700 dark:text-green-300">
                      Completed By: {item.completedBy === user?.uid
                        ? user?.displayName || user?.email || 'Me'
                        : house?.users.find(u => u.id === item.completedBy)?.displayName ||
                          house?.users.find(u => u.id === item.completedBy)?.email ||
                          'Unknown User'
                      }
                    </Text>
                  </View>
                )}
                <View className={`px-2 py-1 rounded-full ${
                  item.completed ? 'opacity-60' : ''
                } ${
                  item.assignedTo === user?.uid 
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : item.assignedTo 
                      ? 'bg-yellow-100 dark:bg-yellow-900' 
                      : 'bg-gray-100 dark:bg-gray-900'
                }`}>
                  <Text className={`text-xs ${
                    item.assignedTo === user?.uid
                      ? 'text-blue-700 dark:text-blue-300'
                      : item.assignedTo
                        ? 'text-yellow-700 dark:text-yellow-300'
                        : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Assigned To: {item.assignedTo === user?.uid 
                      ? user?.displayName || user?.email || 'Me'
                      : item.assignedTo
                        ? house?.users.find(u => u.id === item.assignedTo)?.displayName || 
                          house?.users.find(u => u.id === item.assignedTo)?.email || 
                          'Unknown User'
                        : 'None'}
                  </Text>
                </View>
                {new Date(item.dueDate) < new Date() && !item.completed && !item.alwaysRepeat && (
                  <View className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded-full">
                    <Text className="text-xs text-red-700 dark:text-red-300">
                      Overdue
                    </Text>
                  </View>
                )}
                {item.area && (
                  <View className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded-full">
                    <Text className="text-xs text-green-700 dark:text-green-300">
                      {item.area}
                    </Text>
                  </View>
                )}
                {item.isRepeating && (
                  <View className="bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded-full flex-row items-center">
                    <Ionicons name="repeat" size={12} color="#9333ea" className="mr-2" />
                    <Text className="text-xs ml-1 text-purple-700 dark:text-purple-300">
                      {item.alwaysRepeat ? 'Always' : `${item.repeatDays}d`}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
          refreshing={isLoading}
          onRefresh={handleRefresh}
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

      {isCompletingTask && (
        <View className="absolute inset-0 bg-black/50 flex-1 items-center justify-center h-full w-full">
          <View className="bg-white dark:bg-gray-800 px-8 py-4 rounded-xl shadow-lg">
            <Text className="text-lg font-medium text-gray-900 dark:text-white text-center">
              Updating task...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const getUserAssignmentCounts = async (houseId: string, houseUsers: any[]) => {
  try {
    const tasksRef = collection(db, 'houses', houseId, 'tasks');
    const tasksSnapshot = await getDocs(tasksRef);
    const assignments: { [key: string]: number } = {};

    houseUsers.forEach((user: any) => {
      assignments[user.id] = 0;
    });

    tasksSnapshot.forEach((doc) => {
      const task = doc.data();
      if (task.assignedTo) {
        if (!task.completed) {
          assignments[task.assignedTo] = (assignments[task.assignedTo] || 0) + 1;
        } else if (task.completedAt) {
          const completedAt = new Date(task.completedAt);
          const now = new Date();
          const daysSinceCompletion = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysSinceCompletion < 7) {
            assignments[task.assignedTo] = (assignments[task.assignedTo] || 0) + 0.5;
          }
        }
      }
    });

    return assignments;
  } catch (error) {
    console.error('Error getting assignment counts:', error);
    return {};
  }
};

const getNextUserInRotation = async (houseId: string, houseUsers: any[], repeatTaskId: string | null, currentAssignee: string | null) => {
  try {
    const tasksRef = collection(db, 'houses', houseId, 'tasks');
    const rotationQuery = query(
      tasksRef,
      where('repeatTaskId', '==', repeatTaskId),
      where('completed', '==', true)
    );
    const rotationSnapshot = await getDocs(rotationQuery);
    
    const rotationCounts: { [key: string]: number } = {};
    houseUsers.forEach(user => {
      rotationCounts[user.id] = 0;
    });

    rotationSnapshot.forEach(doc => {
      const task = doc.data();
      if (task.assignedTo) {
        rotationCounts[task.assignedTo] = (rotationCounts[task.assignedTo] || 0) + 1;
      }
    });

    const minAssignments = Math.min(...Object.values(rotationCounts));
    const eligibleUsers = Object.entries(rotationCounts)
      .filter(([userId, count]) => count === minAssignments && userId !== currentAssignee)
      .map(([userId]) => userId);

    if (eligibleUsers.length === 0) {
      const anyoneExceptCurrent = houseUsers
        .map(u => u.id)
        .filter(id => id !== currentAssignee);
      return anyoneExceptCurrent[Math.floor(Math.random() * anyoneExceptCurrent.length)];
    }

    return eligibleUsers[Math.floor(Math.random() * eligibleUsers.length)];
  } catch (error) {
    console.error('Error getting next user in rotation:', error);
    return null;
  }
};
