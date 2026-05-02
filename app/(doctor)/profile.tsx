import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { DefaultAvatar } from '../../components/ui/DefaultAvatar';
import { useAuth } from '../../context/AuthContext';

export default function DoctorProfileScreen() {
  const { user, logout, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [avatar, setAvatar] = useState(user?.avatar_url || '');

  // Available schedule blocks natively stored
  const [availableTimes, setAvailableTimes] = useState<string[]>(user?.available_times || ['09:00', '10:00', '14:00']);

  const TIME_SLOTS = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const handleUpdate = () => {
    updateUser({ name, phone_number: phone, avatar_url: avatar || undefined, available_times: availableTimes });
    Alert.alert('Success', 'Profile and schedule updated successfully.');
  };

  const handlePickAvatar = async () => {
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

  const toggleSlot = (slot: string) => {
    if (availableTimes.includes(slot)) {
      setAvailableTimes(prev => prev.filter(t => t !== slot));
    } else {
      setAvailableTimes(prev => [...prev, slot].sort());
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <View className="px-6 pt-6 pb-2 bg-background z-10 flex-row justify-between items-start">
        <View>
          <Text className="text-3xl font-bold text-textLight mb-1">Profile</Text>
          <Text className="text-textMuted text-sm">Manage configurations & settings.</Text>
        </View>
        <TouchableOpacity 
           onPress={logout}
           className="bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg flex-row items-center"
        >
           <FontAwesome name="sign-out" size={14} color="#EF4444" />
           <Text className="text-red-500 font-bold ml-2">Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="flex-row items-center bg-surfaceLight border border-borderDark rounded-xl p-4 mb-8">
           <TouchableOpacity onPress={handlePickAvatar} className="relative mr-4">
             <DefaultAvatar uri={avatar || user?.avatar_url} size={64} />
             <View className="absolute bottom-0 right-0 bg-primary w-6 h-6 rounded-full items-center justify-center shadow-lg border-2 border-background">
                <FontAwesome name="camera" size={10} color="#121417" />
             </View>
           </TouchableOpacity>
           <View>
             <Text className="text-xl font-bold text-textLight">{user?.name}</Text>
             <Text className="text-primary text-sm font-bold uppercase tracking-wider">Active Practitioner</Text>
           </View>
        </View>

        <Text className="text-textLight font-bold mb-4 uppercase text-xs tracking-wider">Account Details</Text>
        
        <Input 
           label="Full Name"
           value={name}
           onChangeText={setName}
        />
        
        <Input 
           label="Phone Number"
           value={phone}
           onChangeText={setPhone}
           keyboardType="phone-pad"
        />

        <Text className="text-textLight font-bold mb-2 uppercase text-xs tracking-wider mt-4">Working Hours (30min Blocks)</Text>
        <Text className="text-textMuted text-xs mb-4">Select slots that patients are allowed to book. Maximum appointment length is 30m.</Text>
        
        <View className="flex-row flex-wrap gap-2 mb-6">
           {TIME_SLOTS.map(slot => {
             const isActive = availableTimes.includes(slot);
             return (
               <TouchableOpacity 
                 key={slot}
                 className={`w-1/4 py-2 border rounded-lg items-center ${isActive ? 'bg-primary/20 border-primary' : 'bg-surface border-borderDark'}`}
                 onPress={() => toggleSlot(slot)}
               >
                 <Text className={`font-bold ${isActive ? 'text-primary' : 'text-textMuted'}`}>{slot}</Text>
               </TouchableOpacity>
             )
           })}
        </View>

        <Button 
          label="Save Configuration" 
          onPress={handleUpdate} 
          className="mt-2" 
          disabled={!name || availableTimes.length === 0 || (name === (user?.name || '') && phone === (user?.phone_number || '') && avatar === (user?.avatar_url || '') && JSON.stringify(availableTimes) === JSON.stringify(user?.available_times || ['09:00', '10:00', '14:00']))}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
