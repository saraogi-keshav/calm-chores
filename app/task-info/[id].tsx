import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Switch, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
 
export default function TaskInfoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { house } = useAuth();
 
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [dueDate, setDueDate] = useState(new Date());
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatDays, setRepeatDays] = useState('');
  const [alwaysRepeat, setAlwaysRepeat] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
 
  useEffect(() => {
    fetchTaskDetails();
    fetchHouseUsers();
  }, [id, house]);
 
  const fetchTaskDetails = async () => {
    if (!house || !id) return;
 
    try {
      const taskRef = doc(db, 'houses', house.id, 'tasks', id as string);
      const taskDoc = await getDoc(taskRef);
 
      if (taskDoc.exists()) {
        const taskData = taskDoc.data();
        setTitle(taskData.title);
        setDescription(taskData.description || '');
        setDueDate(taskData.dueDate ? new Date(taskData.dueDate) : new Date());
        setIsRepeating(taskData.isRepeating || false);
        setAlwaysRepeat(taskData.alwaysRepeat || false);
        setRepeatDays(taskData.repeatDays?.toString() || '');
        setAutoRotate(taskData.autoRotate || false);
        setSelectedUserId(taskData.assignedTo || null);
        setSelectedArea(taskData.area || null);
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
    }
  };
 
  const handleUpdateTask = async () => {
    if (!house || !id) return;
    setLoading(true);
 
    try {
      const taskRef = doc(db, 'houses', house.id, 'tasks', id as string);
      await updateDoc(taskRef, {
        title,
        description,
        dueDate: isRepeating && alwaysRepeat ? null : dueDate.toISOString(),
        isRepeating,
        alwaysRepeat,
        repeatDays: isRepeating && !alwaysRepeat ? Number(repeatDays) : null,
        assignedTo: autoRotate ? null : selectedUserId,
        autoRotate,
        area: selectedArea,
      });
      router.push('/tasks');
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setLoading(false);
    }
  };
 
  const onChangeDate = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || dueDate;
    setDueDate(currentDate);
  };
 
  const onChangeTime = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || dueDate;
    setDueDate(currentDate);
  };
 
  const fetchHouseUsers = async () => {
    if (!house) return;
    try {
      const houseDoc = await getDoc(doc(db, 'houses', house.id));
      if (houseDoc.exists()) {
        const houseData = houseDoc.data();
        const usersList = houseData.users || [];
        const mappedUsers = usersList.map((user: any) => ({
          uid: user.id,
          displayName: user.displayName || user.email,
          email: user.email
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error('Error fetching house users:', error);
    }
  };
 
  const handleDeleteTask = async () => {
    if (!house || !id) return;
    setLoading(true);
 
    try {
      const taskRef = doc(db, 'houses', house.id, 'tasks', id as string);
      await deleteDoc(taskRef);
      router.push('/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-gray-900">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">Edit Task</Text>
 
        <View className="flex-1 pb-4">
          <ScrollView 
            className="flex-1" 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
        <TextInput
          value={title}
          onChangeText={setTitle}
          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 mb-4 text-black dark:text-white"
          placeholder="Task title"
          placeholderTextColor="#666"
        />
 
        <TextInput
          value={description}
          onChangeText={setDescription}
          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-3 mb-6 text-black dark:text-white"
          placeholder="Description (optional)"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
 
      <View className="mb-4 bg-white dark:bg-gray-800 rounded-md p-2 z-[100]">
          <View className="flex-row items-center space-x-3">
            <Text className="text-gray-700 dark:text-gray-300 text-lg">House Area:</Text>
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => {
                  setIsAreaDropdownOpen(!isAreaDropdownOpen);
                  setIsDropdownOpen(false);
                }}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2"
              >
                <Text className="text-gray-700 dark:text-gray-300">
                  {selectedArea || 'Select area'}
                </Text>
              </TouchableOpacity>
 
              {isAreaDropdownOpen && (
                <View className="absolute top-8 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg elevation-5 z-[999]">
                  {house?.areas?.map((area) => (
                    <TouchableOpacity
                      key={area}
                      onPress={() => {
                        setSelectedArea(area);
                        setIsAreaDropdownOpen(false);
                      }}
                      className={`p-3 border-b border-gray-200 dark:border-gray-700 ${
                        selectedArea === area ? 'bg-blue-50 dark:bg-blue-900' : ''
                      }`}
                    >
                      <Text className={`${
                        selectedArea === area 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {area}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
 
        <View className="bg-white dark:bg-gray-800 rounded-md p-2 mb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-700 dark:text-gray-300 text-lg">Repeat Task</Text>
            <Switch
              value={isRepeating}
              onValueChange={setIsRepeating}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isRepeating ? '#2563eb' : '#f4f3f4'}
            />
          </View>
 
          {isRepeating && (
            <>
              <View className="flex-row items-center justify-between py-2">
                <Text className="text-gray-700 dark:text-gray-300 text-lg">Always Repeat</Text>
                <Switch
                  value={alwaysRepeat}
                  onValueChange={setAlwaysRepeat}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={alwaysRepeat ? '#2563eb' : '#f4f3f4'}
                />
              </View>
 
              {!alwaysRepeat && (
                <View className="flex-row items-center space-x-2">
                  <Text className="text-gray-700 dark:text-gray-300">Every</Text>
                  <TextInput
                    className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 mx-2 h-8 text-black dark:text-white"
                    value={repeatDays}
                    onChangeText={(text) => setRepeatDays(text.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    placeholder="Enter days"
                    placeholderTextColor="#666"
                    maxLength={3}
                  />
                  <Text className="text-gray-700 dark:text-gray-300">days</Text>
                </View>
              )}
            </>
          )}
        </View>
 
 
 
        <View className="mb-4 bg-white dark:bg-gray-800 rounded-md p-2 z-50">
          {isRepeating && (
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-700 dark:text-gray-300 text-lg">Auto Rotate Assignment</Text>
              <Switch
                value={autoRotate}
                onValueChange={setAutoRotate}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={autoRotate ? '#2563eb' : '#f4f3f4'}
              />
            </View>
          )}
 
          {!autoRotate && (
            <View className="flex-row items-center space-x-3">
              <Text className="text-gray-700 dark:text-gray-300">Assign To:</Text>
              <View className="flex-1">
                <TouchableOpacity
                  onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2"
                >
                  <Text className="text-gray-700 dark:text-gray-300">
                    {selectedUserId && users.length > 0
                      ? users.find(u => u.uid === selectedUserId)?.displayName || 
                        users.find(u => u.uid === selectedUserId)?.email ||
                        'Select person'
                      : 'Select person'}
                  </Text>
                </TouchableOpacity>
 
                {isDropdownOpen && (
                  <View className="absolute top-8 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg elevation-5">
                    {users.map((user) => (
                      <TouchableOpacity
                        key={user.uid}
                        onPress={() => {
                          setSelectedUserId(user.uid);
                          setIsDropdownOpen(false);
                        }}
                        className={`p-3 border-b border-gray-200 dark:border-gray-700 ${
                          selectedUserId === user.uid ? 'bg-blue-50 dark:bg-blue-900' : ''
                        }`}
                      >
                        <Text className={`${
                          selectedUserId === user.uid 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {user.displayName || user.email}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
 
        {(!isRepeating || !alwaysRepeat) && (
          <View className="bg-white dark:bg-gray-800 rounded-md p-2 pb-3">
            <Text className="text-gray-700 dark:text-gray-300 text-lg mb-2 pl-3">Select Due Date and Time</Text>
            <View className="flex flex-row px-0 mx-0">
              <DateTimePicker 
                testID="datePicker"
                value={dueDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'compact' : 'default'}
                onChange={onChangeDate}
                className="h-8 p-0 m-0 text-md"
              />
              <DateTimePicker
                testID="timePicker"
                value={dueDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'compact' : 'default'}
                onChange={onChangeTime}
                className="h-8 p-0 m-0 text-md"
              />
            </View>
          </View>
        )}
 
        {isRepeating && (
          <View className="bg-white dark:bg-gray-800 rounded-md p-4 mb-4 mt-4">
            <Text className="text-gray-700 dark:text-gray-300 text-lg font-semibold mb-3">
              Task Completions
            </Text>
 
            <View className="flex-row justify-between mb-2 px-2">
              <Text className="text-gray-600 dark:text-gray-400 font-medium w-2/3">User</Text>
              <Text className="text-gray-600 dark:text-gray-400 font-medium flex-1 text-center">Completions</Text>
            </View>
 
            {users.map((user) => (
              <View key={user.uid} className="flex-row justify-between items-center py-2 px-2 border-b border-gray-200 dark:border-gray-700">
                <Text className="text-gray-700 dark:text-gray-300 w-2/3" numberOfLines={1}>
                  {user.displayName || user.email}
                </Text>
                <Text className="text-gray-700 dark:text-gray-300 flex-1 text-center">
                  0
                </Text>
              </View>
            ))}
          </View>
        )}
        </ScrollView>
        </View>
 
        <TouchableOpacity
          onPress={handleUpdateTask}
          disabled={loading}
          className="w-full bg-blue-500 rounded-md p-4 mb-4"
        >
          <Text className="text-white font-bold text-center">
            {loading ? 'Updating...' : 'Update Task'}
          </Text>
        </TouchableOpacity>
 
        <TouchableOpacity
          onPress={handleDeleteTask}
          disabled={loading}
          className="w-full bg-red-500 rounded-md p-4"
        >
          <Text className="text-white font-bold text-center">
            {loading ? 'Deleting...' : 'Delete Task'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}