import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Services } from '../../services';
import { Card } from '../../components/ui/Card';
import { DefaultAvatar } from '../../components/ui/DefaultAvatar';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useRouter } from 'expo-router';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardScreen() {
  const { user, updateUser } = useAuth();
  const router = useRouter();

  const [isVitalsModalVisible, setIsVitalsModalVisible] = useState(false);
  // Initialize vitals from persisted medical_history if available
  const [vitals, setVitals] = useState({
    bp: user?.medical_history?.vitals?.bp || '',
    hr: user?.medical_history?.vitals?.hr || '',
    temp: user?.medical_history?.vitals?.temp || '',
    spo2: user?.medical_history?.vitals?.spo2 || ''
  });
  const [nextAppt, setNextAppt] = useState<any>(null);

  // Dynamic counts from Firebase
  const [activeScripts, setActiveScripts] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isChatSelectionVisible, setIsChatSelectionVisible] = useState(false);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    // Load next appointment
    const appts = await Services.appointment.getByPatient(user.id);
    const upcoming = appts
      .filter(a => a.status === 'pending' || a.status === 'confirmed')
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    setNextAppt(upcoming.length > 0 ? upcoming[0] : null);

    // Find most recent appointment for messages shortcut
    const allSorted = appts
      .filter(a => a.status === 'pending' || a.status === 'confirmed')
      .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
    
    setAllAppointments(allSorted);
    // Calculate total unread messages for patient
    const unread = allSorted.reduce((sum, a) => sum + (a.unread_count_patient || 0), 0);
    setTotalUnread(unread);

  // Load active prescriptions count
  const prescData = await Services.prescription.getByPatient(user.id);
  setActiveScripts(prescData.filter(p => p.is_active).length);

  // Load documents count
  const docs = await Services.document.getByPatient(user.id);
  setDocCount(docs.length);
}, [user]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

const [editVitals, setEditVitals] = useState(vitals);

const handleSaveVitals = () => {
  setVitals(editVitals);
  // Persist vitals to Firebase via medical_history
  updateUser({
    medical_history: {
      ...user?.medical_history,
      vitals: editVitals
    }
  });
  setIsVitalsModalVisible(false);
  Alert.alert('Saved', 'Vitals have been recorded and synced.');
};

return (
  <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
    {/* Header section */}
    <View className="flex-row items-center justify-between mb-8">
      <View>
        <Text className="text-textMuted text-sm tracking-wider uppercase mb-1">Clinical Hub</Text>
        <Text className="text-2xl font-bold text-textLight">{getGreeting()}, {user?.name?.split(' ')[0] || 'Patient'}</Text>
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
        onPress={() => { setEditVitals(vitals); setIsVitalsModalVisible(true); }}
      >
        <FontAwesome name="edit" size={12} color="#E2E8F0" />
      </TouchableOpacity>

      {vitals.bp || vitals.hr ? (
        <>
          <View className="flex-row justify-between mb-6">
            <View>
              <View className="flex-row items-center mb-1">
                <FontAwesome name="heartbeat" size={12} color="#94A3B8" />
                <Text className="text-textMuted text-xs ml-2 uppercase tracking-wide">Blood Pressure</Text>
              </View>
              <Text className="text-2xl font-bold text-textLight">{vitals.bp || '—'} <Text className="text-sm font-normal text-textMuted">mmHg</Text></Text>
            </View>
            <View className="mr-8">
              <View className="flex-row items-center mb-1">
                <FontAwesome name="heart" size={12} color="#94A3B8" />
                <Text className="text-textMuted text-xs ml-2 uppercase tracking-wide">Heart Rate</Text>
              </View>
              <Text className="text-2xl font-bold text-textLight">{vitals.hr || '—'} <Text className="text-sm font-normal text-textMuted">bpm</Text></Text>
            </View>
          </View>

          <View className="h-px bg-borderDark mb-6 w-full" />

          <View className="flex-row justify-between">
            <View>
              <View className="flex-row items-center mb-1">
                <FontAwesome name="thermometer-half" size={12} color="#94A3B8" />
                <Text className="text-textMuted text-xs ml-2 uppercase tracking-wide">Temperature</Text>
              </View>
              <Text className="text-textLight font-bold text-lg">{vitals.temp || '—'} <Text className="text-xs font-normal text-textMuted">°F</Text></Text>
            </View>
            <View className="mr-8">
              <View className="flex-row items-center mb-1">
                <FontAwesome name="tint" size={12} color="#94A3B8" />
                <Text className="text-textMuted text-xs ml-2 uppercase tracking-wide">SpO2</Text>
              </View>
              <Text className="text-textLight font-bold text-lg">{vitals.spo2 || '—'} <Text className="text-xs font-normal text-textMuted">%</Text></Text>
            </View>
          </View>
        </>
      ) : (
        <View className="items-center py-4">
          <FontAwesome name="heartbeat" size={28} color="#2F333A" />
          <Text className="text-textMuted mt-2">No vitals recorded yet</Text>
          <Text className="text-textMuted text-xs mt-1">Tap the edit button to add your readings</Text>
        </View>
      )}
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
          onChangeText={(text) => setEditVitals(prev => ({ ...prev, bp: text }))}
        />
        <Input
          label="Heart Rate (BPM)"
          placeholder="e.g. 72"
          keyboardType="numeric"
          value={editVitals.hr}
          onChangeText={(text) => setEditVitals(prev => ({ ...prev, hr: text }))}
        />
        <Input
          label="Body Temperature (°F)"
          placeholder="e.g. 98.6"
          keyboardType="numeric"
          value={editVitals.temp}
          onChangeText={(text) => setEditVitals(prev => ({ ...prev, temp: text }))}
        />
        <Input
          label="Oxygen Saturation (SpO2 %)"
          placeholder="e.g. 99"
          keyboardType="numeric"
          value={editVitals.spo2}
          onChangeText={(text) => setEditVitals(prev => ({ ...prev, spo2: text }))}
        />

        <Button
          label="Save Vitals"
          onPress={handleSaveVitals}
          className="mt-4"
          disabled={!editVitals.bp || !editVitals.hr || !editVitals.temp || !editVitals.spo2}
        />
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
          {nextAppt ? (
            <>
              <Text className="text-textMuted text-xs font-bold tracking-wider mb-2 uppercase">Next Appointment</Text>
              <Text className="text-textLight font-bold text-lg mb-1">{nextAppt.doctor_name || 'Your Doctor'}</Text>
              <Text className="text-primary text-sm font-semibold">
                {new Date(nextAppt.scheduled_at).toLocaleDateString()} at {new Date(nextAppt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </>
          ) : (
            <>
              <Text className="text-textMuted text-xs font-bold tracking-wider mb-2 uppercase">No Upcoming Care</Text>
              <Text className="text-textLight font-bold text-lg mb-1">Book an appointment</Text>
              <Text className="text-textMuted text-sm font-semibold">Tap here to find a specialist</Text>
            </>
          )}
        </View>
        <View className="w-12 h-12 bg-surface rounded-full items-center justify-center border border-borderDark relative">
          <FontAwesome name={nextAppt ? "chevron-right" : "plus"} size={16} color="#94A3B8" />
          {(nextAppt?.unread_count_patient || 0) > 0 && (
            <View className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full items-center justify-center border-2 border-surface">
              <Text className="text-background text-[10px] font-bold">{nextAppt?.unread_count_patient || 0}</Text>
            </View>
          )}
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
        <Text className="text-textMuted text-xs mt-1">{activeScripts} Active Script{activeScripts !== 1 ? 's' : ''}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="w-[48%] bg-surface rounded-2xl p-4 border border-borderDark"
        onPress={() => router.push('/(patient)/ehr')}
      >
        <View className="w-10 h-10 rounded-full bg-surfaceLight items-center justify-center mb-3">
          <FontAwesome name="flask" size={16} color="#E2E8F0" />
        </View>
        <Text className="text-textLight font-bold">Lab Results</Text>
        <Text className="text-textMuted text-xs mt-1">{docCount} Record{docCount !== 1 ? 's' : ''}</Text>
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
        className="w-[48%] bg-surface rounded-2xl p-4 border border-borderDark relative"
        onPress={() => {
          if (allAppointments.length > 0) {
            setIsChatSelectionVisible(true);
          } else {
            Alert.alert('No Conversations', 'Book an appointment to start messaging your doctor.');
          }
        }}
      >
        {totalUnread > 0 && (
          <View className="absolute -top-2 -right-2 bg-primary px-2 py-0.5 rounded-full border-2 border-background z-20">
            <Text className="text-background text-[10px] font-bold">{totalUnread}</Text>
          </View>
        )}
        <View className="w-10 h-10 rounded-full bg-surfaceLight items-center justify-center mb-3">
          <FontAwesome name="comments-o" size={16} color="#E2E8F0" />
        </View>
        <Text className="text-textLight font-bold">Messages</Text>
        <Text className="text-textMuted text-xs mt-1">{totalUnread > 0 ? `${totalUnread} Unread` : 'Open Chat'}</Text>
      </TouchableOpacity>
    </View>

    {/* Chat Selection Modal */}
    <Modal visible={isChatSelectionVisible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-background rounded-t-[40px] p-8 max-h-[80%]">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-textLight">Select Conversation</Text>
            <TouchableOpacity onPress={() => setIsChatSelectionVisible(false)}>
              <FontAwesome name="times-circle" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {allAppointments.map(appt => (
              <TouchableOpacity
                key={appt.id}
                className="bg-surfaceLight p-4 rounded-2xl border border-borderDark mb-3 flex-row items-center justify-between"
                onPress={() => {
                  setIsChatSelectionVisible(false);
                  router.push(`/chat/${appt.id}` as any);
                }}
              >
                <View className="flex-1">
                  <Text className="text-textLight font-bold text-lg">{appt.doctor_name || 'Secure Chat'}</Text>
                  <Text className="text-textMuted text-xs">
                    {new Date(appt.scheduled_at).toLocaleDateString()} at {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                {(appt.unread_count_patient || 0) > 0 && (
                  <View className="bg-primary w-6 h-6 rounded-full items-center justify-center">
                    <Text className="text-background text-xs font-bold">{appt.unread_count_patient || 0}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </ScrollView>
);
}
