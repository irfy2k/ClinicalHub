import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Services } from '../../services';
import { Appointment, User } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { IntakeWizard } from '../../components/symptoms/IntakeWizard';
import { notificationService } from '../../services/notificationService';
import { firebaseAuthService } from '../../services/firebase/firebaseAuthService';
import clsx from 'clsx';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function PatientAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'Upcoming' | 'Past'>('Upcoming');
  const [isBooking, setIsBooking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [wizardTargetDoctor, setWizardTargetDoctor] = useState<string | null>(null);
  const [wizardTargetTime, setWizardTargetTime] = useState<string | null>(null);
  const [wizardDoctorName, setWizardDoctorName] = useState<string>('');
  const [doctors, setDoctors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadAppointments();
    loadDoctors();
  }, [user]);

  const loadAppointments = async () => {
    if (!user) return;
    try {
      const data = await Services.appointment.getByPatient(user.id);
      setAppointments(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load appointments. Please try again.');
    }
  };

  const loadDoctors = async () => {
    try {
      const docs = await firebaseAuthService.getUsersByRole('doctor');
      setDoctors(docs);
    } catch (e) {
      // Handle error silently here
    } finally {
      setIsLoading(false);
    }
  };

  const handleBook = (doctorId: string, doctorName: string, timeSlot: string) => {
    setWizardTargetDoctor(doctorId);
    setWizardDoctorName(doctorName);
    setWizardTargetTime(timeSlot);
  };

  const handleIntakeComplete = async (intakeData: any) => {
    if (!user || !wizardTargetDoctor || !wizardTargetTime) return;

    // Use the selectedDate state instead of new Date()
    const baseDate = new Date(selectedDate);
    if (wizardTargetTime) {
      const [hours, minutes] = wizardTargetTime.split(':').map(Number);
      baseDate.setHours(hours, minutes, 0, 0);
    }
    const scheduledAt = baseDate.toISOString();

    // BUG-11 FIX: Check for slot conflicts
    try {
      const doctorAppts = await Services.appointment.getByDoctor(wizardTargetDoctor);
      const hasConflict = doctorAppts.some(appt => 
        (appt.status === 'pending' || appt.status === 'confirmed') && 
        appt.scheduled_at === scheduledAt
      );

      if (hasConflict) {
        Alert.alert('Slot Unavailable', 'This time slot was just booked by someone else. Please choose another slot.');
        setWizardTargetDoctor(null);
        return;
      }
      
      await Services.appointment.create({
        patient_id: user.id,
        doctor_id: wizardTargetDoctor,
        patient_name: user.name,
        doctor_name: wizardDoctorName,
        status: 'pending',
        scheduled_at: scheduledAt,
        notes: `Symptoms: ${intakeData.symptoms} | Pain: ${intakeData.painLevel}/10 | Duration: ${intakeData.duration} | Slot: ${wizardTargetTime}`,
        photo_data: intakeData.photoData || undefined
      });

      // Schedule a push notification reminder 30 minutes before the appointment
      await notificationService.scheduleAppointmentReminder(
        `appt-${Date.now()}`,
        wizardDoctorName,
        scheduledAt
      );

      // Confirm booking with an instant notification
      await notificationService.sendInstantNotification(
        '📅 Appointment Booked',
        `Your appointment with ${wizardDoctorName} for ${wizardTargetTime} has been confirmed. You'll be reminded 30 minutes before.`
      );

      setWizardTargetDoctor(null);
      setWizardTargetTime(null);
      setWizardDoctorName('');
      setIsBooking(false);
      loadAppointments();
    } catch (e) {
      Alert.alert('Booking Error', 'Could not create appointment. Please try again.');
    }
  };

  const cancelAppointment = (apptId: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              await Services.appointment.updateStatus(apptId, 'cancelled');
              loadAppointments();
            } catch (e) {
              Alert.alert('Error', 'Failed to cancel appointment.');
            }
          }
        }
      ]
    );
  };

  const handleUploadPhoto = async (id: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      try {
        const photoData = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await Services.appointment.updateAppointment(id, { photo_data: photoData });
        loadAppointments();
        Alert.alert('Success', 'Photo attached to your appointment record.');
      } catch (e) {
        Alert.alert('Error', 'Failed to upload photo.');
      }
    }
  };

  const filteredAppointments = appointments.filter(appt => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const apptDate = new Date(appt.scheduled_at);
    const isBeforeToday = apptDate < now;
    
    const isActive = appt.status === 'pending' || appt.status === 'confirmed';

    if (filter === 'Upcoming') {
      return isActive && !isBeforeToday;
    }
    return !isActive || isBeforeToday;
  });

  const filteredDoctors = doctors.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (doc.specialty && doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-6 pb-4 bg-background z-10">
        <Text className="text-3xl font-bold text-textLight mb-4">Appointments</Text>
        
        <View className="flex-row rounded-lg bg-surfaceLight p-1">
           <TouchableOpacity 
             className={clsx("flex-1 py-2 items-center rounded-md", filter === 'Upcoming' && "bg-surface border border-borderDark")}
             onPress={() => setFilter('Upcoming')}
           >
             <Text className={clsx("font-bold", filter === 'Upcoming' ? "text-textLight" : "text-textMuted")}>Upcoming</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             className={clsx("flex-1 py-2 items-center rounded-md", filter === 'Past' && "bg-surface border border-borderDark")}
             onPress={() => setFilter('Past')}
           >
             <Text className={clsx("font-bold", filter === 'Past' ? "text-textLight" : "text-textMuted")}>Past</Text>
           </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {isLoading ? (
          <View className="items-center justify-center py-20">
            <Text className="text-textMuted">Loading appointments...</Text>
          </View>
        ) : filteredAppointments.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FontAwesome name="calendar-times-o" size={48} color="#2F333A" />
            <Text className="text-textMuted mt-4 mb-6">No appointments found</Text>
            <Button 
              label="Find a Specialist" 
              onPress={() => setIsBooking(true)} 
              className="w-full max-w-[250px]"
            />
          </View>
        ) : (
          filteredAppointments.map(appt => {
            const doc = doctors.find(d => d.id === appt.doctor_id);
            const specialty = doc?.specialty || 'General Practice';

            return (
              <Card key={appt.id} className="mb-4">
                <View className="flex-row justify-between items-start mb-3">
                  <View>
                    <Text className="text-primary text-xs font-bold uppercase tracking-wider mb-1">{appt.status}</Text>
                    <Text className="text-textLight font-bold text-lg">{appt.doctor_name || 'Doctor'}</Text>
                    <Text className="text-textMuted text-sm">{specialty}</Text>
                  </View>
                  <View className="bg-surfaceLight px-3 py-1.5 rounded-lg border border-borderDark items-center">
                    <Text className="text-textLight font-bold">{new Date(appt.scheduled_at).getDate()}</Text>
                    <Text className="text-textMuted text-xs uppercase">{new Date(appt.scheduled_at).toLocaleString('default', { month: 'short' })}</Text>
                  </View>
                </View>
                
                <View className="h-px bg-borderDark mb-3 w-full" />
                
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <FontAwesome name="clock-o" size={14} color="#94A3B8" />
                    <Text className="text-textMuted text-sm ml-2">
                      {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {(appt.status === 'pending' || appt.status === 'confirmed') && (
                    <TouchableOpacity onPress={() => cancelAppointment(appt.id)}>
                      <Text className="text-red-400 font-bold text-sm">Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View className="mt-4 pt-4 border-t border-borderDark">
                    <Text className="text-textMuted text-xs font-semibold mb-1 uppercase tracking-wider">Additional details</Text>
                    <Text className="text-textLight text-sm leading-5">
                      {appt.notes || 'No description provided.'}
                    </Text>
                </View>

                {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                  <View className="mt-4 pt-4 border-t border-borderDark flex-row justify-between items-center">
                     <View className="flex-1">
                       <Text className="text-textMuted text-xs mb-1">Visual context</Text>
                       <TouchableOpacity onPress={() => appt.photo_data ? setPreviewPhoto(appt.photo_data) : handleUploadPhoto(appt.id)} className="flex-row items-center">
                         <FontAwesome name={appt.photo_data ? "image" : "camera"} size={14} color={appt.photo_data ? "#85B523" : "#94A3B8"} />
                         <Text className={clsx("font-semibold text-sm ml-2", appt.photo_data ? "text-primary" : "text-textLight")}>
                           {appt.photo_data ? "View Symptoms Photo" : "Upload Symptoms Photo"}
                         </Text>
                       </TouchableOpacity>
                     </View>
                  </View>
                )}
              </Card>
            )
          })
        )}
      </ScrollView>

      <View className="absolute bottom-6 right-6">
        <TouchableOpacity 
          className="w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
          onPress={() => setIsBooking(true)}
        >
          <FontAwesome name="plus" size={24} color="#121417" />
        </TouchableOpacity>
      </View>

      <Modal visible={isBooking} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background pt-12 px-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-textLight">Find a Specialist</Text>
            <TouchableOpacity onPress={() => setIsBooking(false)}>
              <FontAwesome name="close" size={24} color="#E2E8F0" />
            </TouchableOpacity>
          </View>
          
          <Input 
            placeholder="Search by name, specialty..." 
            icon="search" 
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <View className="flex-row justify-between items-center mt-4 mb-2">
            <Text className="text-textLight font-bold">Select Date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} className="flex-row items-center bg-surfaceLight px-3 py-1.5 rounded-lg border border-borderDark">
              <Text className="text-primary font-bold mr-2">{selectedDate}</Text>
              <FontAwesome name="calendar" size={14} color="#85B523" />
            </TouchableOpacity>
          </View>

          <Text className="text-textLight font-bold mt-2 mb-4">Available Doctors & Times</Text>

          <ScrollView>
            {filteredDoctors.length === 0 ? (
              <View className="items-center py-10">
                <FontAwesome name="user-md" size={48} color="#2F333A" />
                <Text className="text-textMuted mt-4">No doctors found matching "{searchQuery}"</Text>
              </View>
            ) : (
              filteredDoctors.map(doc => (
                <Card key={doc.id} className="mb-4 bg-surfaceLight border-borderDark flex-col">
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 bg-surface rounded-full items-center justify-center border border-borderDark mr-4">
                         <FontAwesome name="user-md" size={20} color="#94A3B8" />
                      </View>
                      <View>
                        <Text className="text-textLight font-bold text-lg">{doc.name}</Text>
                        <Text className="text-textMuted text-sm">{doc.specialty || 'General Practice'}</Text>
                      </View>
                    </View>
                  </View>
                  <View className="border-t border-borderDark pt-4">
                    <Text className="text-textMuted text-xs font-bold uppercase tracking-wider mb-3">Available Slots (30m blocks)</Text>
                    <View className="flex-row flex-wrap gap-2">
                       {(doc.available_times || ['09:00', '10:00', '14:00', '15:00']).map(slot => (
                          <TouchableOpacity 
                            key={slot} 
                            className="bg-primary/20 border border-primary rounded px-3 py-2"
                            onPress={() => handleBook(doc.id, doc.name, slot)}
                          >
                             <Text className="text-primary font-bold">{slot}</Text>
                          </TouchableOpacity>
                       ))}
                       <Text className="text-textMuted text-xs ml-2 self-center">Tap to Book</Text>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Date Selection Modal */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center p-6">
          <Card className="w-full max-w-sm">
            <Text className="text-xl font-bold text-textLight mb-4">Select Appointment Date</Text>
            <ScrollView className="max-h-64">
               {Array.from({ length: 14 }).map((_, i) => {
                 const date = new Date();
                 date.setDate(date.getDate() + i);
                 const dateStr = date.toISOString().split('T')[0];
                 return (
                   <TouchableOpacity 
                     key={dateStr}
                     className="py-3 border-b border-borderDark flex-row justify-between items-center"
                     onPress={() => {
                       setSelectedDate(dateStr);
                       setShowDatePicker(false);
                     }}
                   >
                     <Text className="text-textLight">{date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                     <FontAwesome name="chevron-right" size={12} color="#2F333A" />
                   </TouchableOpacity>
                 );
               })}
            </ScrollView>
            <Button label="Cancel" variant="secondary" fullWidth className="mt-4" onPress={() => setShowDatePicker(false)} />
          </Card>
        </View>
      </Modal>

      {/* Photo Preview Modal */}
      <Modal visible={!!previewPhoto} transparent animationType="fade">
        <View className="flex-1 bg-black/90 items-center justify-center p-6">
           <TouchableOpacity 
             className="absolute top-12 right-6 z-10 w-10 h-10 bg-white/10 rounded-full items-center justify-center"
             onPress={() => setPreviewPhoto(null)}
           >
             <FontAwesome name="close" size={20} color="white" />
           </TouchableOpacity>
           <View className="w-full h-[70%] bg-surface rounded-3xl overflow-hidden">
             {previewPhoto && (
               <View style={{ width: '100%', height: '100%' }}>
                  <Text className="text-white text-center mt-20">Loading symptom photo...</Text>
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                    {/* Native Image would go here, using a placeholder for text-based context */}
                    <View className="flex-1 items-center justify-center bg-zinc-900">
                       <FontAwesome name="image" size={80} color="#2F333A" />
                       <Text className="text-textMuted mt-4">High Resolution Base64 Image</Text>
                    </View>
                  </View>
               </View>
             )}
           </View>
        </View>
      </Modal>

      {/* Intake Wizard Modal integration */}
      {wizardTargetDoctor && (
        <IntakeWizard 
          visible={!!wizardTargetDoctor} 
          onClose={() => setWizardTargetDoctor(null)}
          onComplete={handleIntakeComplete}
        />
      )}
    </View>
  );
}
