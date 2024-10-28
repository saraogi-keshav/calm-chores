import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: new Date().toISOString(),
        
      });

      router.replace('/(tabs)/home');
    } catch (error) {
      setError('Failed to sign up'+error);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900 p-4">
      <Text className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-6">
        Sign Up
      </Text>
      <TextInput
        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 mb-4 text-black dark:text-white"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 mb-4 text-black dark:text-white"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        className="w-full bg-blue-500 rounded-md p-2 mb-4"
        onPress={handleSignUp}
      >
        <Text className="text-white font-bold text-center">Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}>
        <Text className="text-blue-500 dark:text-blue-400">
          Already have an account? Log in
        </Text>
      </TouchableOpacity>
      {error ? <Text className="text-red-500 mt-2">{error}</Text> : null}
    </View>
  );
}
