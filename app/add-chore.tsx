import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, SafeAreaView, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, addDoc, getDoc, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import 'react-native-get-random-values';
import { nanoid } from 'nanoid';

export default function AddChoreScreen() {
  const [choreName, setChoreName] = useState('');
  const [description, setDescription] = useState('');
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

    if (isRepeating && !alwaysRepeat && (!repeatDays || repeatDays === '0')) {
      alert('Please enter the number of days for repeating task');
      return;
    }

    try {
      const repeatTaskId = isRepeating ? nanoid() : null;
      let assignedUserId = selectedUserId;

      if (autoRotate) {
        assignedUserId = await getNextAssignee(house.id, house.users, repeatTaskId);
      }

      await addDoc(collection(db, 'houses', house.id, 'tasks'), {
        title: choreName,
        description,
        dueDate: isRepeating && alwaysRepeat ? null : dueDate.toISOString(),
        assignedTo: assignedUserId,
        createdBy: user.uid,
        autoRotate,
        completed: false,
        createdAt: new Date().toISOString(),
        isRepeating,
        alwaysRepeat,
        repeatDays: isRepeating && !alwaysRepeat ? Number(repeatDays) : null,
        area: selectedArea,
        repeatTaskId,
      });
      router.push('/tasks');
    } catch (error) {
      console.error('Error adding chore: ', error);
    }
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
        console.log('Fetched house users:', mappedUsers);
      }
    } catch (error) {
      console.error('Error fetching house users:', error);
    }
  };

  useEffect(() => {
    fetchHouseUsers();
  }, [house]);

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
        
        <View className="flex-1">
          <ScrollView 
            className="flex-1" 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <TextInput
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 mb-4 text-black dark:text-white"
              placeholder="Chore Name"
              value={choreName}
              onChangeText={setChoreName}
            />

            <TextInput
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-3 mb-6 text-black dark:text-white"
              placeholder="Description (optional)"
              value={description}
              onChangeText={setDescription}
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
                      onPress={() => {
                        setIsDropdownOpen(!isDropdownOpen);
                        setIsAreaDropdownOpen(false);
                      }}
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
                    display={Platform.OS === 'ios' ? 'compact' : 'spinner'}
                    onChange={onChangeDate}
                    className="h-8 p-0 m-0 text-md"
                  />
                  <DateTimePicker
                    testID="timePicker"
                    value={dueDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'compact' : 'spinner'}
                    onChange={onChangeTime}
                    className="h-8 p-0 m-0 text-md"
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        <TouchableOpacity
          className="w-full bg-blue-500 rounded-md p-4 mt-4"
          onPress={handleAddChore}
        >
          <Text className="text-white font-bold text-center">Add Chore</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getUserAssignmentCounts = async (houseId: string, houseUsers: any[]) => {
  try {
    const tasksRef = collection(db, 'houses', houseId, 'tasks');
    const tasksQuery = query(tasksRef, where('completed', '==', false));
    const tasksSnapshot = await getDocs(tasksQuery);
    const assignments: { [key: string]: number } = {};

    houseUsers.forEach((user: any) => {
      assignments[user.id] = 0;
    });

    tasksSnapshot.forEach((doc) => {
      const task = doc.data();
      if (task.assignedTo) {
        assignments[task.assignedTo] = (assignments[task.assignedTo] || 0) + 1;
      }
    });

    return assignments;
  } catch (error) {
    console.error('Error getting assignment counts:', error);
    return {};
  }
};

const getNextAssignee = async (houseId: string, houseUsers: any[], repeatTaskId: string | null = null) => {
  try {
    const assignments = await getUserAssignmentCounts(houseId, houseUsers);
    
    const minAssignments = Math.min(...Object.values(assignments));
    const eligibleUsers = Object.entries(assignments)
      .filter(([_, count]) => count === minAssignments)
      .map(([userId]) => userId);

    const randomIndex = Math.floor(Math.random() * eligibleUsers.length);
    return eligibleUsers[randomIndex];
  } catch (error) {
    console.error('Error getting next assignee:', error);
    return null;
  }
};
