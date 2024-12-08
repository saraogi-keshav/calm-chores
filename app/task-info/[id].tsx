import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Switch,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { nanoid } from "nanoid";

const getUserAssignmentCounts = async (houseId: string, houseUsers: any[]) => {
  try {
    const tasksRef = collection(db, "houses", houseId, "tasks");
    const tasksQuery = query(tasksRef, where("completed", "==", false));
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
    console.error("Error getting assignment counts:", error);
    return {};
  }
};

const getNextAssignee = async (
  houseId: string,
  houseUsers: any[],
  repeatTaskId: string | null = null
) => {
  try {
    const assignments = await getUserAssignmentCounts(houseId, houseUsers);
    const minAssignments = Math.min(...Object.values(assignments));
    const eligibleUsers = Object.entries(assignments)
      .filter(([_, count]) => count === minAssignments)
      .map(([userId]) => userId);

    const randomIndex = Math.floor(Math.random() * eligibleUsers.length);
    return eligibleUsers[randomIndex];
  } catch (error) {
    console.error("Error getting next assignee:", error);
    return null;
  }
};

export default function TaskInfoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { house } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [dueDate, setDueDate] = useState(new Date());
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatDays, setRepeatDays] = useState("");
  const [alwaysRepeat, setAlwaysRepeat] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskData, setTaskData] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchTaskDetails();
    fetchHouseUsers();
    fetchTasks();
    setTimeout(() => {
      setInitialLoading(false);
    }, 500);
  }, [id, house]);

  const fetchTaskDetails = async () => {
    if (!house || !id) return;

    try {
      const taskRef = doc(db, "houses", house.id, "tasks", id as string);
      const taskDoc = await getDoc(taskRef);

      if (taskDoc.exists()) {
        const taskData = taskDoc.data();
        setTitle(taskData.title);
        setDescription(taskData.description || "");
        setDueDate(taskData.dueDate ? new Date(taskData.dueDate) : new Date());
        setIsRepeating(taskData.isRepeating || false);
        setAlwaysRepeat(taskData.alwaysRepeat || false);
        setRepeatDays(taskData.repeatDays?.toString() || "");
        setAutoRotate(taskData.autoRotate || false);
        setSelectedUserId(taskData.assignedTo || null);
        setSelectedArea(taskData.area || null);
        setTaskData(taskDoc.data());
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
    }
  };

  const handleUpdateTask = async () => {
    if (!house || !id) return;
    setLoading(true);
    setInitialLoading(true);

    try {
      let assignedUserId = selectedUserId;
      if (autoRotate) {
        assignedUserId = await getNextAssignee(
          house.id,
          house.users,
          taskData?.repeatTaskId
        );
      }

      const taskRef = doc(db, "houses", house.id, "tasks", id as string);
      await updateDoc(taskRef, {
        title,
        description,
        dueDate: isRepeating && alwaysRepeat ? null : dueDate.toISOString(),
        isRepeating,
        alwaysRepeat,
        repeatDays: isRepeating && !alwaysRepeat ? Number(repeatDays) : null,
        assignedTo: assignedUserId,
        autoRotate,
        area: selectedArea,
      });

      setTimeout(() => {
        router.push("/tasks");
      }, 300);
    } catch (error) {
      console.error("Error updating task:", error);
      setInitialLoading(false);
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

  const fetchHouseUsers = useCallback(async () => {
    if (!house?.id) return;
    try {
      const houseDoc = await getDoc(doc(db, "houses", house.id));
      if (houseDoc.exists()) {
        const houseData = houseDoc.data();
        const usersList = houseData.users || [];
        const mappedUsers = usersList.map((user: any) => ({
          uid: user.id,
          displayName: user.displayName || user.email,
          email: user.email,
          vacationMode: user.vacationMode || false,
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error("Error fetching house users:", error);
    }
  }, [house?.id]);

  useEffect(() => {
    if (house?.id) {
      fetchHouseUsers();
    }
  }, [house?.id]);

  const handleDeleteTask = async () => {
    if (!house || !id) return;
    setLoading(true);
    setInitialLoading(true);

    try {
      const taskRef = doc(db, "houses", house.id, "tasks", id as string);
      await deleteDoc(taskRef);

      setTimeout(() => {
        router.push("/tasks");
      }, 300);
    } catch (error) {
      console.error("Error deleting task:", error);
      setInitialLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = useCallback(async () => {
    if (!house?.id) return;
    const tasksSnapshot = await getDocs(
      collection(db, "houses", house.id, "tasks")
    );
    setTasks(tasksSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  }, [house?.id]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-gray-900">
      {initialLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <View className="flex-1 relative">
          <View className="p-4 flex-1">
            <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">
              Edit Task
            </Text>

            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 150 }}
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
                  <Text className="text-gray-700 dark:text-gray-300 text-lg">
                    House Area:
                  </Text>
                  <View className="flex-1">
                    <TouchableOpacity
                      onPress={() => {
                        setIsAreaDropdownOpen(!isAreaDropdownOpen);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2"
                    >
                      <Text className="text-gray-700 dark:text-gray-300">
                        {selectedArea || "Select area"}
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
                              selectedArea === area
                                ? "bg-blue-50 dark:bg-blue-900"
                                : ""
                            }`}
                          >
                            <Text
                              className={`${
                                selectedArea === area
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
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
                  <Text className="text-gray-700 dark:text-gray-300 text-lg">
                    Repeat Task
                  </Text>
                  <Switch
                    value={isRepeating}
                    onValueChange={setIsRepeating}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={isRepeating ? "#2563eb" : "#f4f3f4"}
                  />
                </View>

                {isRepeating && (
                  <>
                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-gray-700 dark:text-gray-300 text-lg">
                        Always Repeat
                      </Text>
                      <Switch
                        value={alwaysRepeat}
                        onValueChange={setAlwaysRepeat}
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={alwaysRepeat ? "#2563eb" : "#f4f3f4"}
                      />
                    </View>

                    {!alwaysRepeat && (
                      <View className="flex-row items-center space-x-2">
                        <Text className="text-gray-700 dark:text-gray-300">
                          Every
                        </Text>
                        <TextInput
                          className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 mx-2 h-8 text-black dark:text-white"
                          value={repeatDays}
                          onChangeText={(text) =>
                            setRepeatDays(text.replace(/[^0-9]/g, ""))
                          }
                          keyboardType="numeric"
                          placeholder="Enter days"
                          placeholderTextColor="#666"
                          maxLength={3}
                        />
                        <Text className="text-gray-700 dark:text-gray-300">
                          days
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>

              <View className="mb-4 bg-white dark:bg-gray-800 rounded-md p-2 z-50">
                {isRepeating && (
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-gray-700 dark:text-gray-300 text-lg">
                      Auto Rotate Assignment
                    </Text>
                    <Switch
                      value={autoRotate}
                      onValueChange={setAutoRotate}
                      trackColor={{ false: "#767577", true: "#81b0ff" }}
                      thumbColor={autoRotate ? "#2563eb" : "#f4f3f4"}
                    />
                  </View>
                )}

                {!autoRotate && (
                  <View className="flex-row items-center space-x-3">
                    <Text className="text-gray-700 dark:text-gray-300">
                      Assign To:
                    </Text>
                    <View className="flex-1">
                      <TouchableOpacity
                        onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2"
                      >
                        <Text className="text-gray-700 dark:text-gray-300">
                          {selectedUserId && users.length > 0
                            ? users.find((u) => u.uid === selectedUserId)
                                ?.displayName ||
                              users.find((u) => u.uid === selectedUserId)
                                ?.email ||
                              "Select person"
                            : "Select person"}
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
                                selectedUserId === user.uid
                                  ? "bg-blue-50 dark:bg-blue-900"
                                  : ""
                              }`}
                            >
                              <Text
                                className={`${
                                  selectedUserId === user.uid
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-gray-700 dark:text-gray-300"
                                }`}
                              >
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
                  <Text className="text-gray-700 dark:text-gray-300 text-lg mb-2 pl-3">
                    Select Due Date and Time
                  </Text>
                  <View className="flex flex-row px-0 mx-0">
                    <DateTimePicker
                      testID="datePicker"
                      value={dueDate}
                      mode="date"
                      display={Platform.OS === "ios" ? "compact" : "default"}
                      onChange={onChangeDate}
                      className="h-8 p-0 m-0 text-md"
                    />
                    <DateTimePicker
                      testID="timePicker"
                      value={dueDate}
                      mode="time"
                      display={Platform.OS === "ios" ? "compact" : "default"}
                      onChange={onChangeTime}
                      className="h-8 p-0 m-0 text-md"
                    />
                  </View>
                </View>
              )}

              {isRepeating && taskData && (
                <View className="bg-white dark:bg-gray-800 rounded-md p-4 mb-4 mt-4">
                  <Text className="text-gray-700 dark:text-gray-300 text-lg font-semibold mb-3">
                    Task Completion History
                  </Text>

                  <View className="flex-row justify-between mb-2 px-2">
                    <Text className="text-gray-600 dark:text-gray-400 font-medium w-1/3">
                      User
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 font-medium text-center flex-1">
                      Completed
                    </Text>
                    {!taskData.alwaysRepeat && (
                      <Text className="text-gray-600 dark:text-gray-400 font-medium text-center flex-1">
                        Overdue
                      </Text>
                    )}
                    <Text className="text-gray-600 dark:text-gray-400 font-medium text-center flex-1">
                      Missed
                    </Text>
                  </View>

                  {users.map((user) => {
                    const onTimeCompletions =
                      tasks?.filter(
                        (task) =>
                          task.repeatTaskId === taskData.repeatTaskId &&
                          task.completedBy === user.uid &&
                          task.completed &&
                          (!task.overdueCompletion ||
                            taskData.alwaysRepeat ||
                            task.assignedTo !== user.uid)
                      ).length || 0;

                    const overdueCompletions = !taskData.alwaysRepeat
                      ? tasks?.filter(
                          (task) =>
                            task.repeatTaskId === taskData.repeatTaskId &&
                            task.completedBy === user.uid &&
                            task.completed &&
                            task.overdueCompletion &&
                            task.assignedTo === user.uid
                        ).length || 0
                      : 0;

                    const missedTasks =
                      tasks?.filter(
                        (task) =>
                          task.repeatTaskId === taskData.repeatTaskId &&
                          task.assignedTo === user.uid &&
                          task.completed &&
                          task.completedBy !== user.uid
                      ).length || 0;

                    return (
                      <View
                        key={user.uid}
                        className="flex-row justify-between items-center py-2 px-2 border-b border-gray-200 dark:border-gray-700"
                      >
                        <Text
                          className="text-gray-700 dark:text-gray-300 w-1/3"
                          numberOfLines={1}
                        >
                          {user.displayName || user.email}
                        </Text>
                        <Text className="text-green-600 dark:text-green-400 flex-1 text-center">
                          {onTimeCompletions}
                        </Text>
                        {!taskData.alwaysRepeat && (
                          <Text className="text-yellow-600 dark:text-yellow-400 flex-1 text-center">
                            {overdueCompletions}
                          </Text>
                        )}
                        <Text className="text-red-600 dark:text-red-400 flex-1 text-center">
                          {missedTasks}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
            <View className="absolute bottom-5 left-0 right-0 h-[130px] bg-gray-100 dark:bg-gray-900 px-4 pt-4 pb-6 shadow-lg border-t border-gray-200 dark:border-gray-800">
              <TouchableOpacity
                onPress={handleUpdateTask}
                disabled={loading}
                className={`w-full rounded-md p-4 mb-2 ${
                  loading ? "bg-blue-300" : "bg-blue-500"
                }`}
              >
                <Text className="text-white font-bold text-center">
                  {loading ? "Updating..." : "Update Task"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteTask}
                disabled={loading}
                className={`w-full rounded-md p-4 ${
                  loading ? "bg-red-300" : "bg-red-500"
                }`}
              >
                <Text className="text-white font-bold text-center">
                  {loading ? "Deleting..." : "Delete Task"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
