import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import Gauge from '@/components/Gauge';
 
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
 
export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateUserDisplayName, house } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(user?.uid || null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userStats, setUserStats] = useState({
    onTime: 0,
    overdue: 0,
    missed: 0,
    total: 0,
    completed: 0
  });
  const [isUpdating, setIsUpdating] = useState(false);
 
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };
 
  const handleUpdateDisplayName = async () => {
    try {
      if (!user || !house) return;
      setIsUpdating(true);
 
      // Update Firebase Auth profile
      await updateProfile(user, { displayName });
 
      // Update user's display name in Firestore house document
      const houseRef = doc(db, 'houses', house.id);
      const updatedUsers = house.users.map(u => 
        u.id === user.uid ? { ...u, displayName } : u
      );
 
      await updateDoc(houseRef, {
        users: updatedUsers
      });
 
      await updateUserDisplayName(displayName);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating display name:', error);
    } finally {
      setIsUpdating(false);
    }
  };
 
  useEffect(() => {
    if (!house || !selectedUserId) return;

    // Create real-time subscription to tasks
    const tasksRef = collection(db, 'houses', house.id, 'tasks');
    const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));
      
      const stats = {
        total: tasks.filter(task => 
          task.completed && task.assignedTo === selectedUserId
        ).length,
        completed: tasks.filter(task => 
          task.completed && 
          task.completedBy === selectedUserId
        ).length,
        onTime: tasks.filter(task => 
          task.completed && 
          !task.overdueCompletion && 
          (task.completedBy === selectedUserId && task.assignedTo !== selectedUserId)
        ).length,
        overdue: tasks.filter(task => 
          task.completed && 
          task.assignedTo === selectedUserId && 
          task.completedBy === selectedUserId && 
          task.overdueCompletion
        ).length,
        missed: tasks.filter(task => 
          task.completed && 
          task.assignedTo === selectedUserId && 
          task.completedBy !== selectedUserId
        ).length
      };

      setUserStats(stats);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [house?.id, selectedUserId]);
 
  const calculateScore = () => {
    if (userStats.total === 0) return 0;
    return Math.max(0, 
      (userStats.completed / userStats.total * 100) - (userStats.overdue / 2)
    );
  };
 
  return (
    <View className="flex-1 bg-gray-100 dark:bg-gray-900 space-y-4">
      <View className="h-2/3 space-y-4">
        <View className="bg-white dark:bg-gray-800 shadow-sm p-4 mb-4 m-4 rounded-lg relative">
          <Text className="text-center text-gray-500 text-2xl mb-4">Ratings</Text>
 
          <TouchableOpacity
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
          >
            <Text className="text-gray-700 dark:text-gray-300">
              {(() => {
                const selectedUser = house?.users.find(u => u.id === selectedUserId);
                return selectedUser?.displayName || selectedUser?.email || 'Select User';
              })()}
            </Text>
          </TouchableOpacity>
        </View>
 
        {isDropdownOpen && (
          <View className="absolute top-32 left-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-30">
            {house?.users.map(user => (
              <TouchableOpacity
                key={user.id}
                onPress={() => {
                  setSelectedUserId(user.id);
                  setIsDropdownOpen(false);
                }}
                className="p-3 border-b border-gray-200 dark:border-gray-600"
              >
                <Text className="text-gray-700 dark:text-gray-300">
                  {user.displayName || user.email}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
 
        <View className="bg-white dark:bg-gray-800 shadow-sm p-2 m-4 mb-4 rounded-lg">
          <Text className="text-center text-gray-500 text-sm mb-4 pt-4">Task Statistics</Text>
          <View className="flex-row justify-between mt-4 px-4" key={JSON.stringify(userStats)}>
            <View className="items-center">
              <Text className="text-blue-500 text-2xl font-bold">{userStats.total}</Text>
              <Text className="text-gray-500 text-sm">Assigned</Text>
            </View>
            <View className="items-center">
              <Text className="text-purple-500 text-2xl font-bold">{userStats.completed}</Text>
              <Text className="text-gray-500 text-sm">Completed</Text>
            </View>
            <View className="items-center">
              <Text className="text-green-500 text-2xl font-bold">{userStats.onTime}</Text>
              <Text className="text-gray-500 text-sm">On Time</Text>
            </View>
            <View className="items-center">
              <Text className="text-yellow-500 text-2xl font-bold">{userStats.overdue}</Text>
              <Text className="text-gray-500 text-sm">Overdue</Text>
            </View>
            <View className="items-center">
              <Text className="text-red-500 text-2xl font-bold">{userStats.missed}</Text>
              <Text className="text-gray-500 text-sm">Missed</Text>
            </View>
          </View>
          <View className='flex-row justify-between'>
            <View className="h-32 items-center justify-center my-4 w-2/3">
              <Gauge 
                score={calculateScore()} 
                key={`${selectedUserId}-${JSON.stringify(userStats)}`}
              />
            </View>
            <View className="items-center justify-center pt-4 w-1/3">
              <View className={`rounded-full p-1.5 mb-1 ${
                calculateScore() < 50 
                  ? 'bg-red-400'
                  : calculateScore() <= 100
                    ? 'bg-green-400'
                    : 'bg-purple-400'
              }`}>
                <Image 
                  source={
                    calculateScore() < 50 
                      ? require('../../assets/images/thief.png')
                      : calculateScore() <= 100
                        ? require('../../assets/images/police.png') 
                        : require('../../assets/images/soldier.png')
                  }
                  className="w-16 h-16 opacity-50 rounded-full"
                />
              </View>
              <Text className="text-gray-500 text-xs text-center">Rank</Text>
              <Text className="text-gray-500 text-sm text-center font-bold">
                {calculateScore() < 50 
                  ? 'CalmChore'
                  : calculateScore() <= 100
                    ? 'Police'
                    : 'Soldier'
                }
              </Text>
            </View>
          </View>        
        </View>
      </View>
      <View className="h-1/3">
        <View className="bg-white dark:bg-gray-800 shadow-sm p-4 mb-4 m-4 rounded-lg">
          {user && (
            <View className="space-y-4">
              <View className="space-y-1">
                <Text className="text-sm text-gray-400 dark:text-gray-500">Email</Text>
                <Text className="text-base text-gray-700 dark:text-gray-200">{user.email}</Text>
              </View>
 
              <View className="space-y-1">
                <Text className="text-sm text-gray-400 dark:text-gray-500">Display Name</Text>
                {isEditing ? (
                  <View className="space-y-2">
                    <TextInput
                      className="w-full bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                      value={displayName}
                      onChangeText={setDisplayName}
                      placeholder="Enter your name"
                      placeholderTextColor="#9CA3AF"
                      editable={!isUpdating}
                    />
                    <View className="flex-row space-x-2">
                      <TouchableOpacity
                        className={`flex-1 ${isUpdating ? 'bg-blue-400' : 'bg-blue-500'} p-3 rounded-lg`}
                        onPress={handleUpdateDisplayName}
                        disabled={isUpdating}
                      >
                        <Text className="text-white text-center font-medium">
                          {isUpdating ? 'Saving...' : 'Save'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 bg-gray-200 dark:bg-gray-700 p-3 rounded-lg"
                        onPress={() => setIsEditing(false)}
                        disabled={isUpdating}
                      >
                        <Text className="text-gray-700 dark:text-gray-200 text-center font-medium">Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base text-gray-700 dark:text-gray-200">
                      {user.displayName || 'Not set'}
                    </Text>
                    <TouchableOpacity
                      className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg"
                      onPress={() => setIsEditing(true)}
                    >
                      <Text className="text-gray-600 dark:text-gray-300">Edit</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
        <TouchableOpacity
            className="bg-red-400 mx-4 px-4 py-2 rounded-md w-1/3 self-center"
            onPress={handleLogout}
          >
            <Text className="text-white font-bold text-center">Log Out</Text>
        </TouchableOpacity>
 
      </View>
 
    </View>
  );
}