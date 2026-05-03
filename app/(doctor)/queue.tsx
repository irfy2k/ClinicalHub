import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Image, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Services } from '../../services';
import { Appointment, User } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { notificationService } from '../../services/notificationService';
import clsx from 'clsx';
import { useRouter } from 'expo-router';

export default function QueueScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const loadAppointments = async () => {
    if (!user) return;
    try {
      const data = await Services.appointment.getByDoctor(user.id);
      setAppointments(data);

      // Fetch patient names for all unique patient IDs
      const uniquePatientIds = [...new Set(data.map(a => a.patient_id))];
      const names: Record<string, string> = {};
      await Promise.all(
        uniquePatientIds.map(async (pid) => {
          const apptWithName = data.find(a => a.patient_id === pid && a.patient_name);
          if (apptWithName?.patient_name) {
            names[pid] = apptWithName.patient_name;
          } else {
            const patient = await Services.auth.getUser(pid);
            names[pid] = patient?.name || 'Unknown Patient';
          }
        })
      );
      setPatientNames(names);
    } catch (error) {
      Alert.alert('Error', 'Failed to load appointments. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const processStatusChange = async (status: Appointment['status']) => {
    if (!selectedAppt) return;
    await Services.appointment.updateStatus(selectedAppt.id, status);

    // Send a notification about the status change
    const statusMessages: Record<string, { title: string; body: string }> = {
      confirmed: { title: '✅ Appointment Confirmed', body: `Your appointment has been confirmed by ${user?.name || 'your doctor'}.` },
      completed: { title: '🏥 Visit Complete', body: `Your appointment with ${user?.name || 'your doctor'} has been marked as completed.` },
      cancelled: { title: '❌ Appointment Cancelled', body: `Your appointment with ${user?.name || 'your doctor'} has been cancelled.` },
    };
    const msg = statusMessages[status];
    if (msg) {
      await notificationService.sendInstantNotification(msg.title, msg.body, {
        type: 'appointment_status',
        appointmentId: selectedAppt.id,
        status,
      });
    }

    setSelectedAppt(null);
    loadAppointments();
  };

  const handleStatusChange = (status: Appointment['status']) => {
    if (status === 'completed' || status === 'cancelled') {
      const actionText = status === 'completed' ? 'Complete Appointment' : 'Cancel Appointment';
      Alert.alert(
        actionText,
        `Are you sure you want to ${status === 'completed' ? 'complete' : 'cancel'} this appointment?`,
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', style: status === 'cancelled' ? 'destructive' : 'default', onPress: () => processStatusChange(status) }
        ]
      );
    } else {
      processStatusChange(status);
    }
  };

  const upcomingAppts = appointments
    .filter(a => a.status === 'pending' || a.status === 'confirmed')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const getPatientName = (patientId: string) => patientNames[patientId] || 'Loading...';

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-6 pb-2 bg-background z-10">
        <View className="flex-row justify-between items-start mb-6">
          <View>
            <Text className="text-textMuted text-sm tracking-wider uppercase mb-1">Clinical Hub</Text>
            <Text className="text-2xl font-bold text-textLight">{new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'}, {user?.name || 'Doctor'}</Text>
          </View>
          <TouchableOpacity onPress={logout} className="p-3 bg-surfaceLight border border-borderDark rounded-full">
            <FontAwesome name="sign-out" size={16} color="#E2E8F0" />
          </TouchableOpacity>
        </View>
        
        <View className="flex-row gap-4 mb-4">
          <Card className="flex-1 bg-surface py-4 px-4 items-center">
            <Text className="text-textMuted text-xs font-bold uppercase tracking-wider mb-2">Total</Text>
            <Text className="text-textLight font-bold text-3xl">{upcomingAppts.length}</Text>
          </Card>
          <Card className="flex-1 bg-surface py-4 px-4 items-center">
            <Text className="text-textMuted text-xs font-bold uppercase tracking-wider mb-2">Needs Action</Text>
            <Text className="text-primary font-bold text-3xl">{upcomingAppts.filter(a => a.status === 'pending').length}</Text>
          </Card>
        </View>

        <Text className="text-textLight font-bold mt-4 mb-2">Your Upcoming Queue</Text>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 24, paddingTop: 4 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#85B523" />}
      >
        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#85B523" />
            <Text className="text-textMuted mt-4">Loading queue...</Text>
          </View>
        ) : upcomingAppts.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FontAwesome name="calendar-check-o" size={48} color="#2F333A" />
            <Text className="text-textMuted mt-4">No upcoming appointments</Text>
          </View>
        ) : (
          upcomingAppts.map(appt => (
            <TouchableOpacity key={appt.id} onPress={() => setSelectedAppt(appt)}>
              <Card className="mb-4 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-surfaceLight rounded-full items-center justify-center border border-borderDark mr-4">
                    <FontAwesome name="user-circle" size={24} color="#94A3B8" />
                  </View>
                  <View className="flex-1 pr-4">
                    <Text className="text-textLight font-bold text-lg">{getPatientName(appt.patient_id)}</Text>
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
          ))
        )}
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
              <Text className="text-textLight font-bold text-lg mb-1">
                {selectedAppt ? getPatientName(selectedAppt.patient_id) : ''}
              </Text>
              
              <View className="bg-surfaceLight p-4 rounded-xl border border-borderDark mb-4 mt-2">
                 <Text className="text-textMuted text-xs font-bold uppercase tracking-wider mb-2">Pre-consultation details</Text>
                 <Text className="text-textLight leading-5 mb-3">{selectedAppt?.notes}</Text>
                 
                 {selectedAppt?.photo_data && (
                   <View className="mt-4">
                     <Text className="text-textMuted text-xs font-bold uppercase tracking-wider mb-2">Patient Uploaded Photo</Text>
                     <Image 
                       source={{ uri: selectedAppt.photo_data }} 
                       style={{ width: '100%', height: 200, borderRadius: 8, borderWidth: 1, borderColor: '#2F333A' }} 
                       resizeMode="cover"
                     />
                   </View>
                 )}
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

            <View className="flex-row mb-4">
              <Button 
                label="Message Patient" 
                variant="secondary"
                className="flex-1 mr-2 px-1" 
                onPress={() => {
                  if (!selectedAppt) return;
                  const apptId = selectedAppt.id;
                  setSelectedAppt(null);
                  router.push(`/chat/${apptId}` as any);
                }} 
              />
              <Button 
                label="Prescribe Medicine" 
                variant="secondary"
                className="flex-1 ml-2 px-1 text-center" 
                onPress={() => {
                  if (!selectedAppt) return;
                  const patientId = selectedAppt.patient_id;
                  setSelectedAppt(null);
                  router.push({ pathname: '/(doctor)/prescriptions', params: { patientId } } as any);
                }} 
              />
            </View>

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
