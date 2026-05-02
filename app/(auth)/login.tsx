import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address first to reset your password.');
      return;
    }
    try {
      const { Services } = await import('../../services');
      await Services.auth.resetPassword(email);
      Alert.alert('Reset Email Sent', 'Check your inbox for a password reset link.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send reset email.');
    }
  };

  const handleLogin = async () => {
    setError('');
    if (!email) {
      setError('WORK EMAIL is required');
      return;
    }
    
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e.message || 'Failed to login');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, paddingTop: 60 }}>
        
        <View className="flex-row items-center mb-12">
           <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2">
             <FontAwesome name="arrow-left" size={20} color="#E2E8F0" />
           </TouchableOpacity>
           <View className="w-8 h-8 rounded-lg bg-surfaceLight items-center justify-center mr-3 border border-borderDark">
             <Text className="text-primary font-bold">C</Text>
           </View>
           <Text className="text-textLight font-bold text-center mt-2">Clinical Hub</Text>
        </View>

        <View className="mb-10">
          <Text className="text-3xl font-bold text-textLight mb-2">Welcome Back</Text>
          <Text className="text-textMuted text-base">Authenticate to access your workspace.</Text>
        </View>

        <View className="mb-6">
          <Input
            label="Work Email"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            error={error}
          />
          <View className="flex-row justify-end -mt-2 mb-6">
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text className="text-primary font-bold text-sm">Forgot Password?</Text>
            </TouchableOpacity>
          </View>
          
          <Button 
            label="Sign In →" 
            fullWidth 
            onPress={handleLogin} 
          />
        </View>

        <View className="flex-row justify-center mt-auto pb-4">
          <Text className="text-textMuted">New practitioner? </Text>
          <Text 
            className="text-textLight font-bold"
            onPress={() => router.push('/(auth)/register')}
          >
            Account Signup
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
