import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { DefaultAvatar } from '../../components/ui/DefaultAvatar';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function PatientProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [avatar, setAvatar] = useState(user?.avatar_url || '');

  const handleUpdate = () => {
    updateUser({ name, phone_number: phone, avatar_url: avatar || undefined });
    Alert.alert('Success', 'Profile updated successfully.');
  };

  const handlePickAvatar = async () => {
    // Show simple alert options
    Alert.alert('Change Profile Picture', 'Choose an option', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take Photo', onPress: launchCamera },
      { text: 'Choose from Gallery', onPress: launchGallery },
    ]);
  };

  const launchCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Error', 'Camera permission is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const launchGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <View className="px-6 pt-6 pb-2 bg-background z-10 flex-row justify-between items-center">
        <View>
          <Text className="text-3xl font-bold text-textLight mb-1">Profile</Text>
          <Text className="text-textMuted text-sm">Manage your personal information.</Text>
        </View>
        <TouchableOpacity 
           onPress={logout}
           className="bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-lg flex-row items-center"
        >
           <FontAwesome name="sign-out" size={14} color="#EF4444" />
           <Text className="text-red-500 font-bold ml-2">Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="items-center mb-8 pb-8 border-b border-borderDark/50 relative">
          <TouchableOpacity onPress={handlePickAvatar} className="relative mb-4">
            <DefaultAvatar uri={avatar || user?.avatar_url} size={96} />
            <View className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full items-center justify-center shadow-lg border-2 border-background">
               <FontAwesome name="camera" size={12} color="#121417" />
            </View>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-textLight">{user?.name}</Text>
          <Text className="text-textMuted text-sm">Medical Record No: MRN-{user?.id.substring(0, 6).toUpperCase() || 'N/A'}</Text>
        </View>

        <Text className="text-textLight font-bold mb-4 uppercase text-xs tracking-wider">Account Details</Text>
        
        <Input 
           label="Full Name"
           value={name}
           onChangeText={setName}
        />
        
        <Input 
           label="Email Address"
           value={user?.email || ''}
           editable={false}
        />
        
        <Input 
           label="Phone Number"
           value={phone}
           onChangeText={setPhone}
           keyboardType="phone-pad"
        />

        <Button 
           label="Save Changes" 
           onPress={handleUpdate} 
           className="mt-4" 
           disabled={!name || (name === (user?.name || '') && phone === (user?.phone_number || '') && avatar === (user?.avatar_url || ''))}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
