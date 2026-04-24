import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { UserRole } from '../../types/database';
import clsx from 'clsx';
import { FontAwesome } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    setError('');
    if (!email || !name || !role || !phone) {
      setError('Please fill in all fields and select a role');
      return;
    }
    
    try {
      await register({
        email,
        name,
        role,
        phone_number: phone
      });
      if (role === 'patient') {
        router.push('/(auth)/onboarding');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to register');
    }
  };

  if (!role) {
    return (
      <View className="flex-1 bg-background p-6 pt-20">
        <View className="items-center mb-10">
          <Text className="text-2xl font-bold text-textLight mb-3">Clinical Hub</Text>
          <Text className="text-textMuted text-center leading-relaxed">
            Please select your role to continue. This ensures your dashboard is tailored to your specific clinical or personal needs.
          </Text>
        </View>

        <TouchableOpacity 
          className="bg-surfaceLight rounded-2xl p-6 mb-4 border border-borderDark"
          onPress={() => setRole('patient')}
        >
          <View className="w-10 h-10 rounded-full bg-borderDark items-center justify-center mb-4">
            <FontAwesome name="user" size={18} color="#94A3B8" />
          </View>
          <Text className="text-xl font-bold text-textLight mb-2">I am a Patient</Text>
          <Text className="text-textMuted leading-relaxed mb-6">
            Access your medical records, schedule appointments, review lab results, and communicate securely with your doctors.
          </Text>
          <Text className="text-textLight font-bold text-xs tracking-wider uppercase">Continue as Patient →</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-surfaceLight rounded-2xl p-6 border border-borderDark"
          onPress={() => setRole('doctor')}
        >
          <View className="w-10 h-10 rounded-full bg-borderDark items-center justify-center mb-4">
            <FontAwesome name="stethoscope" size={18} color="#94A3B8" />
          </View>
          <Text className="text-xl font-bold text-textLight mb-2">I am a Doctor</Text>
          <Text className="text-textMuted leading-relaxed mb-6">
            Manage patient files, write prescriptions, review clinical notes, and oversee your daily schedule in a secure environment.
          </Text>
          <Text className="text-textLight font-bold text-xs tracking-wider uppercase">Continue as Clinician →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, paddingTop: 60 }}>
        <View className="mb-8">
          <Text className="text-3xl font-bold text-textLight mb-2">Create Account</Text>
          <Text className="text-textMuted text-base">You are signing up as a {role}</Text>
        </View>

        <View className="mb-6">
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Input
            label="Email Address"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Mobile Phone Number"
            placeholder="+1 555-0100"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          
          {error ? <Text className="text-red-500 text-sm mt-1 mb-4">{error}</Text> : null}
          
          <Button 
            label={role === 'patient' ? "Continue to Onboarding" : "Create Account"} 
            fullWidth 
            onPress={handleRegister} 
            className="mt-4"
          />
          
          <Button 
            label="Change Role" 
            variant="ghost"
            fullWidth 
            onPress={() => setRole(null)} 
            className="mt-2"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
