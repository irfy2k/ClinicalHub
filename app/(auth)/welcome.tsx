import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { FontAwesome } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 justify-center">
        <View className="items-center mb-12">
          <View className="w-20 h-20 bg-surfaceLight rounded-3xl items-center justify-center border border-borderDark mb-6 shadow-lg shadow-black/20">
             <FontAwesome name="stethoscope" size={36} color="#85B523" />
          </View>
          <Text className="text-4xl font-bold text-textLight text-center mb-4">Clinical Hub</Text>
          <Text className="text-textMuted text-base text-center px-4 leading-relaxed">
            Your secure platform for managing healthcare, booking appointments, and connecting with specialists.
          </Text>
        </View>

        <View className="gap-4">
          <Button 
            label="Sign In to Account" 
            fullWidth 
            onPress={() => router.push('/(auth)/login')} 
          />
          <Button 
            label="Create New Account" 
            variant="secondary"
            fullWidth 
            onPress={() => router.push('/(auth)/register')} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
