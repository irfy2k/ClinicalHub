import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { DefaultAvatar } from '../../components/ui/DefaultAvatar';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [isVitalsModalVisible, setIsVitalsModalVisible] = useState(false);
  const [vitals, setVitals] = useState({
    bp: '118/76',
    hr: '72',
    temp: '98.6',
    spo2: '99'
  });

  const [editVitals, setEditVitals] = useState(vitals);

  const handleSaveVitals = () => {
    setVitals(editVitals);
    setIsVitalsModalVisible(false);
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
      {/* Header section */}
      <View className="flex-row items-center justify-between mb-8">
        <View>
          <Text className="text-textMuted text-sm tracking-wider uppercase mb-1">Clinical Hub</Text>
          <Text className="text-2xl font-bold text-textLight">Hi, {user?.name?.split(' ')[0] || 'Patient'}</Text>
        </View>
        <TouchableOpacity 
           onPress={() => router.push('/(patient)/profile')}
           className="flex-row items-center"
        >
          <DefaultAvatar uri={user?.avatar_url} size={48} />
          <View className="p-2 border border-borderDark rounded-full bg-surfaceLight">
            <FontAwesome name="cog" size={16} color="#94A3B8" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Vitals Summary Card */}
      <Card className="mb-6 relative">
        <TouchableOpacity 
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-surfaceLight border border-borderDark flex items-center justify-center"
          onPress={() => setIsVitalsModalVisible(true)}
        >
          <FontAwesome name="edit" size={12} color="#E2E8F0" />
        </TouchableOpacity>

        <View className="flex-row justify-between mb-6">
          <View>
            <View className="flex-row items-center mb-1">
              <FontAwesome name="heartbeat" size={12} color="#94A3B8" />
              <Text className="text-textMuted text-xs ml-2 uppercase tracking-wide">Blood Pressure</Text>
            </View>
            <Text className="text-2xl font-bold text-textLight">{vitals.bp} <Text className="text-sm font-normal text-textMuted">mmHg</Text></Text>
            <Text className="text-primary text-xs font-bold mt-1">Live Update</Text>
          </View>
          <View className="mr-8">
            <View className="flex-row items-center mb-1">
              <FontAwesome name="heart" size={12} color="#94A3B8" />
              <Text className="text-textMuted text-xs ml-2 uppercase tracking-wide">Heart Rate</Text>
            </View>
            <Text className="text-2xl font-bold text-textLight">{vitals.hr} <Text className="text-sm font-normal text-textMuted">bpm</Text></Text>
            <Text className="text-textMuted text-xs mt-1">✓ Stable</Text>
          </View>
        </View>
        
        <View className="h-px bg-borderDark mb-6 w-full" />
        
        <View className="flex-row justify-between">
          <View>
            <View className="flex-row items-center mb-1">
              <FontAwesome name="thermometer-half" size={12} color="#94A3B8" />
              <Text className="text-textMuted text-xs ml-2 uppercase tracking-wide">Temperature</Text>
            </View>
            <Text className="text-textLight font-bold text-lg">{vitals.temp} <Text className="text-xs font-normal text-textMuted">°F</Text></Text>
          </View>
          <View className="mr-8">
            <View className="flex-row items-center mb-1">
              <FontAwesome name="tint" size={12} color="#94A3B8" />
              <Text className="text-textMuted text-xs ml-2 uppercase tracking-wide">SpO2</Text>
            </View>
            <Text className="text-textLight font-bold text-lg">{vitals.spo2} <Text className="text-xs font-normal text-textMuted">%</Text></Text>
          </View>
        </View>
      </Card>

      {/* Vitals Input Modal */}
      <Modal visible={isVitalsModalVisible} animationType="slide" presentationStyle="pageSheet">
         <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background pt-12 px-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-textLight">Record Vitals</Text>
              <TouchableOpacity onPress={() => setIsVitalsModalVisible(false)}>
                <FontAwesome name="close" size={24} color="#E2E8F0" />
              </TouchableOpacity>
            </View>

            <Text className="text-textMuted text-sm mb-6">Enter your latest manual readings from your health devices to sync directly with your provider records.</Text>

            <Input 
              label="Blood Pressure (mmHg)" 
              placeholder="e.g. 120/80" 
              value={editVitals.bp}
              onChangeText={(text) => setEditVitals(prev => ({...prev, bp: text}))}
            />
            <Input 
              label="Heart Rate (BPM)" 
              placeholder="e.g. 72" 
              keyboardType="numeric"
              value={editVitals.hr}
              onChangeText={(text) => setEditVitals(prev => ({...prev, hr: text}))}
            />
            <Input 
              label="Body Temperature (°F)" 
              placeholder="e.g. 98.6" 
              keyboardType="numeric"
              value={editVitals.temp}
              onChangeText={(text) => setEditVitals(prev => ({...prev, temp: text}))}
            />
            <Input 
              label="Oxygen Saturation (SpO2 %)" 
              placeholder="e.g. 99" 
              keyboardType="numeric"
              value={editVitals.spo2}
              onChangeText={(text) => setEditVitals(prev => ({...prev, spo2: text}))}
            />

            <Button label="Save Vitals" onPress={handleSaveVitals} className="mt-4" />
         </KeyboardAvoidingView>
      </Modal>

      {/* Upcoming Care */}
      <View className="mb-4 mt-2">
        <View className="flex-row items-center mb-4">
          <FontAwesome name="calendar" size={14} color="#E2E8F0" />
          <Text className="text-textLight font-bold ml-2">Upcoming Care</Text>
        </View>
        
        <TouchableOpacity 
          className="bg-surfaceLight rounded-2xl p-5 border border-borderDark flex-row justify-between items-center"
          onPress={() => router.push('/(patient)/appointments')}
        >
          <View className="flex-1 mr-4">
             <Text className="text-textMuted text-xs font-bold tracking-wider mb-2 uppercase">Next Appointment</Text>
             <Text className="text-textLight font-bold text-lg mb-1">Dr. Sarah Smith</Text>
             <Text className="text-primary text-sm font-semibold">Tomorrow, 10:00 AM</Text>
          </View>
          <View className="w-12 h-12 bg-surface rounded-full items-center justify-center border border-borderDark">
             <FontAwesome name="chevron-right" size={16} color="#94A3B8" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Actions Grid */}
      <Text className="text-textLight font-bold mb-4 mt-6">Quick Actions</Text>
      <View className="flex-row flex-wrap justify-between gap-y-4">
         <TouchableOpacity 
            className="w-[48%] bg-surface rounded-2xl p-4 border border-borderDark"
            onPress={() => router.push('/(patient)/medications')}
         >
            <View className="w-10 h-10 rounded-full bg-surfaceLight items-center justify-center mb-3">
              <FontAwesome name="medkit" size={16} color="#E2E8F0" />
            </View>
            <Text className="text-textLight font-bold">Medications</Text>
            <Text className="text-textMuted text-xs mt-1">2 Active Scripts</Text>
         </TouchableOpacity>

         <TouchableOpacity 
            className="w-[48%] bg-surface rounded-2xl p-4 border border-borderDark"
            onPress={() => router.push('/(patient)/ehr')}
         >
            <View className="w-10 h-10 rounded-full bg-surfaceLight items-center justify-center mb-3">
              <FontAwesome name="flask" size={16} color="#E2E8F0" />
            </View>
            <Text className="text-textLight font-bold">Lab Results</Text>
            <Text className="text-primary text-xs mt-1 font-bold">1 New Update</Text>
         </TouchableOpacity>

         <TouchableOpacity 
            className="w-[48%] bg-surface rounded-2xl p-4 border border-borderDark"
            onPress={() => router.push('/(patient)/finances')}
         >
            <View className="w-10 h-10 rounded-full bg-surfaceLight items-center justify-center mb-3">
              <FontAwesome name="pie-chart" size={16} color="#E2E8F0" />
            </View>
            <Text className="text-textLight font-bold">Finances</Text>
            <Text className="text-textMuted text-xs mt-1">View Invoices</Text>
         </TouchableOpacity>

         <TouchableOpacity 
            className="w-[48%] bg-surface rounded-2xl p-4 border border-borderDark"
         >
            <View className="w-10 h-10 rounded-full bg-surfaceLight items-center justify-center mb-3">
              <FontAwesome name="comments-o" size={16} color="#E2E8F0" />
            </View>
            <Text className="text-textLight font-bold">Messages</Text>
            <Text className="text-textMuted text-xs mt-1">0 Unread</Text>
         </TouchableOpacity>
      </View>
      
    </ScrollView>
  );
}
