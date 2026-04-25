import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function LoginScreen() {
  const [email, setEmail] = useState('john@example.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setError('');
    if (!email) {
      setError('WORK EMAIL is required');
      return;
    }
    
    try {
      await login(email);
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
           <View className="w-8 h-8 rounded-lg bg-surfaceLight items-center justify-center mr-3 border border-borderDark">
             {/* Logo placeholder */}
             <Text className="text-primary font-bold">C</Text>
           </View>
                <Text className="text-textLight font-bold text-center mt-2">Doctor</Text>
        </View>

        <View className="mb-10">
          <Text className="text-3xl font-bold text-textLight mb-2">Welcome Back</Text>
          <Text className="text-textMuted text-base">Authenticate to access your workspace.</Text>
        </View>

        <View className="mb-6">
          <Input
            label="Work Email"
            placeholder="dr.smith@clinic.com"
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
            <Text className="text-textMuted text-sm">Forgot?</Text>
          </View>
          
          <Button 
            label="Sign In →" 
            fullWidth 
            onPress={handleLogin} 
          />
          
          <View className="flex-row items-center my-8">
            <View className="flex-1 h-px bg-borderDark" />
            <Text className="text-textMuted text-xs font-bold px-4 uppercase tracking-wider">Or Secure Login</Text>
            <View className="flex-1 h-px bg-borderDark" />
          </View>

          <Button 
            label="Login with OTP" 
            variant="secondary"
            fullWidth 
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
