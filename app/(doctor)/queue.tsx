import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Services } from '../../services';
import { Appointment } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import clsx from 'clsx';
import { useRouter } from 'expo-router';

export default function QueueScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const loadAppointments = async () => {
    if (!user) return;
    const data = await Services.appointment.getByDoctor(user.id);
    setAppointments(data);
  };

  const handleStatusChange = async (status: Appointment['status']) => {
    if (!selectedAppt) return;
    await Services.appointment.updateStatus(selectedAppt.id, status);
    setSelectedAppt(null);
    loadAppointments();
  };

  const todayAppts = appointments.filter(a => new Date(a.scheduled_at).toDateString() === new Date(Date.now() + 86400000).toDateString() || true); // Mock fallback to all

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-6 pb-2 bg-background z-10">
        <View className="flex-row justify-between items-start mb-6">
          <View>
            <Text className="text-textMuted text-sm tracking-wider uppercase mb-1">Clinical Hub</Text>
            <Text className="text-2xl font-bold text-textLight">Good Morning, {user?.name || 'Doctor'}</Text>
          </View>
          <TouchableOpacity onPress={logout} className="p-3 bg-surfaceLight border border-borderDark rounded-full">
            <FontAwesome name="sign-out" size={16} color="#E2E8F0" />
          </TouchableOpacity>
        </View>
        
        <View className="flex-row gap-4 mb-4">
          <Card className="flex-1 bg-surface py-4 px-4 items-center">
            <Text className="text-textMuted text-xs font-bold uppercase tracking-wider mb-2">Total</Text>
            <Text className="text-textLight font-bold text-3xl">{todayAppts.length}</Text>
          </Card>
          <Card className="flex-1 bg-surface py-4 px-4 items-center">
            <Text className="text-textMuted text-xs font-bold uppercase tracking-wider mb-2">Waiting</Text>
            <Text className="text-primary font-bold text-3xl">{todayAppts.filter(a => a.status === 'pending').length}</Text>
          </Card>
        </View>

        <Text className="text-textLight font-bold mt-4 mb-2">Daily Queue</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 4 }}>
        {todayAppts.map(appt => (
          <TouchableOpacity key={appt.id} onPress={() => setSelectedAppt(appt)}>
            <Card className="mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-surfaceLight rounded-full items-center justify-center border border-borderDark mr-4">
                  <Text className="text-textLight font-bold">PT</Text>
                </View>
                <View>
                  <Text className="text-textLight font-bold text-lg">Patient #{appt.patient_id.split('-')[1]}</Text>
                  <Text className="text-textMuted text-sm" numberOfLines={1}>
                    {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {appt.notes?.split('|')[0] || 'Follow-up'}
                  </Text>
                </View>
              </View>
              <View>
                <FontAwesome 
                  name={appt.status === 'completed' ? 'check-circle' : appt.status === 'pending' ? 'clock-o' : 'calendar-check-o'} 
                  size={20} 
                  color={appt.status === 'completed' ? '#85B523' : appt.status === 'pending' ? '#E2E8F0' : '#2C3E50'} 
                />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Appointment Action Modal */}
      <Modal visible={!!selectedAppt} animationType="fade" transparent={true}>
        <View className="flex-1 bg-background/90 justify-end">
          <View className="bg-surface rounded-t-3xl p-6 border-t border-borderDark max-h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
               <Text className="text-xl font-bold text-textLight">Manage Appointment</Text>
               <TouchableOpacity onPress={() => setSelectedAppt(null)}>
                  <FontAwesome name="close" size={24} color="#E2E8F0" />
               </TouchableOpacity>
            </View>

            <ScrollView className="mb-6">
              <Text className="text-textLight font-bold text-lg mb-1">Patient #{selectedAppt?.patient_id.split('-')[1]}</Text>
              
              <View className="bg-surfaceLight p-4 rounded-xl border border-borderDark mb-4 mt-2">
                 <Text className="text-textMuted text-xs font-bold uppercase tracking-wider mb-2">Pre-consultation details</Text>
                 <Text className="text-textLight leading-5 mb-3">{selectedAppt?.notes}</Text>
                 
                 <TouchableOpacity 
                   className="flex-row items-center bg-surface border border-borderDark rounded-lg px-3 py-2 self-start"
                   onPress={() => alert('View Photo intent: Hardware API to be implemented in Phase 13')}
                 >
                   <FontAwesome name="image" size={14} color="#85B523" />
                   <Text className="text-primary text-sm font-bold ml-2">View Patient Photo</Text>
                 </TouchableOpacity>
              </View>

              <View className="flex-row items-center">
                 <View className={clsx("px-2 py-1 border rounded-md mr-2", selectedAppt?.status === 'pending' ? "border-primary bg-primary/20" : "border-borderDark")}>
                   <Text className={clsx("text-xs font-bold uppercase", selectedAppt?.status === 'pending' ? "text-primary" : "text-textMuted")}>{selectedAppt?.status}</Text>
                 </View>
                 <Text className="text-textMuted text-sm">{new Date(selectedAppt?.scheduled_at || Date.now()).toLocaleString()}</Text>
              </View>
            </ScrollView>

            <Text className="text-textMuted text-xs font-bold uppercase tracking-wider mb-3">Actions</Text>
            
            {selectedAppt?.status === 'pending' && (
              <Button 
                label="Mark as Confirmed" 
                fullWidth 
                className="mb-3"
                onPress={() => handleStatusChange('confirmed')} 
              />
            )}
            
            {(selectedAppt?.status === 'pending' || selectedAppt?.status === 'confirmed') && (
              <View className="flex-row mb-3">
                <Button 
                  label="Complete Appointment" 
                  className="flex-1"
                  onPress={() => handleStatusChange('completed')} 
                />
                <Button 
                  label="Start Call" 
                  className="flex-1 ml-2" 
                  onPress={() => {
                    setSelectedAppt(null);
                    router.push('/(doctor)/telemedicine');
                  }} 
                />
              </View>
            )}

            <Button 
              label="Message Patient" 
              variant="secondary"
              className="w-full mb-4" 
              onPress={() => {
                if (!selectedAppt) return;
                const apptId = selectedAppt.id;
                setSelectedAppt(null);
                router.push(`/chat/${apptId}` as any);
              }} 
            />

            <Text className="text-textMuted text-xs font-bold uppercase tracking-wider mb-3">Update Status</Text>
            
            <Button 
              label="Cancel Appointment" 
              variant="danger"
              fullWidth 
              onPress={() => handleStatusChange('cancelled')} 
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}
