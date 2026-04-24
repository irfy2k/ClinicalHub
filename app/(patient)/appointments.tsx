import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Services } from '../../services';
import { Appointment } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { IntakeWizard } from '../../components/symptoms/IntakeWizard';
import clsx from 'clsx';
import { useRouter } from 'expo-router';

export default function PatientAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'Upcoming' | 'Past'>('Upcoming');
  const [isBooking, setIsBooking] = useState(false);
  const [wizardTargetDoctor, setWizardTargetDoctor] = useState<string | null>(null);
  const [wizardTargetTime, setWizardTargetTime] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const loadAppointments = async () => {
    if (!user) return;
    const data = await Services.appointment.getByPatient(user.id);
    setAppointments(data);
  };

  const handleBook = (doctorId: string, timeSlot: string) => {
    setWizardTargetDoctor(doctorId);
    setWizardTargetTime(timeSlot);
  };

  const handleIntakeComplete = async (intakeData: any) => {
    if (!user || !wizardTargetDoctor) return;
    
    // Parse time to actual mock target
    const today = new Date();
    // Defaulting to "tomorrow" if needed, or today based on original code mockup
    
    await Services.appointment.create({
      patient_id: user.id,
      doctor_id: wizardTargetDoctor,
      status: 'pending',
      scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Mock tomorrow regardless of exact slot for simplicity
      notes: `Symptoms: ${intakeData.symptoms} | Pain: ${intakeData.painLevel}/10 | Duration: ${intakeData.duration} | Slot: ${wizardTargetTime}`
    });
    setWizardTargetDoctor(null);
    setWizardTargetTime(null);
    setIsBooking(false);
    loadAppointments();
  };

  const filteredAppointments = appointments.filter(appt => {
    const isPast = new Date(appt.scheduled_at) < new Date();
    if (filter === 'Upcoming') return !isPast && appt.status !== 'cancelled' && appt.status !== 'completed';
    return isPast || appt.status === 'completed' || appt.status === 'cancelled';
  });

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
        {filteredAppointments.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FontAwesome name="calendar-times-o" size={48} color="#2F333A" />
            <Text className="text-textMuted mt-4">No appointments found</Text>
          </View>
        ) : (
          filteredAppointments.map(appt => (
            <Card key={appt.id} className="mb-4">
              <View className="flex-row justify-between items-start mb-3">
                <View>
                  <Text className="text-primary text-xs font-bold uppercase tracking-wider mb-1">{appt.status}</Text>
                  <Text className="text-textLight font-bold text-lg">Dr. Smith</Text>
                  <Text className="text-textMuted text-sm">General Practice</Text>
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
                <TouchableOpacity>
                  <Text className="text-primary font-bold text-sm">Reschedule</Text>
                </TouchableOpacity>
              </View>

              {/* Added descriptions view requested by user */}
              <View className="mt-4 pt-4 border-t border-borderDark">
                  <Text className="text-textMuted text-xs font-semibold mb-1 uppercase tracking-wider">Additional details</Text>
                  <Text className="text-textLight text-sm leading-5">
                    {appt.notes || 'No description provided.'}
                  </Text>
              </View>

              {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                <View className="mt-4 pt-4 border-t border-borderDark flex-row justify-between items-center">
                   <View>
                     <Text className="text-textMuted text-xs mb-1">Add visual context</Text>
                     <Text className="text-textLight font-semibold text-sm">Upload Symptoms Photo</Text>
                   </View>
                   <View className="flex-row gap-2">
                     <TouchableOpacity 
                       className="w-10 h-10 bg-surfaceLight border border-borderDark rounded-full items-center justify-center"
                       onPress={() => router.push(`/chat/${appt.id}` as any)}
                     >
                       <FontAwesome name="commenting" size={16} color="#E2E8F0" />
                     </TouchableOpacity>
                     
                     <TouchableOpacity 
                       className="w-10 h-10 bg-surfaceLight border border-borderDark rounded-full items-center justify-center"
                       onPress={() => alert('Camera intent: Hardware API to be implemented in Phase 13')}
                     >
                       <FontAwesome name="camera" size={16} color="#E2E8F0" />
                     </TouchableOpacity>
                   </View>
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity 
          className="w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
          onPress={() => setIsBooking(true)}
        >
          <FontAwesome name="plus" size={24} color="#121417" />
        </TouchableOpacity>
      </View>

      {/* Find a Doctor / Booking Modal */}
      <Modal visible={isBooking} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background pt-12 px-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-textLight">Find a Specialist</Text>
            <TouchableOpacity onPress={() => setIsBooking(false)}>
              <FontAwesome name="close" size={24} color="#E2E8F0" />
            </TouchableOpacity>
          </View>
          
          <Input placeholder="Search by name, specialty..." icon="search" />

          <Text className="text-textLight font-bold mt-4 mb-4">Available Doctors & Times</Text>

          {/* Ideally fetching from mockUsers matching doctor role */}
          <Card className="mb-4 bg-surfaceLight border-borderDark flex-col">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-surface rounded-full items-center justify-center border border-borderDark mr-4">
                   <FontAwesome name="user-md" size={20} color="#94A3B8" />
                </View>
                <View>
                  <Text className="text-textLight font-bold text-lg">Dr. Sarah Jenkins</Text>
                  <Text className="text-textMuted text-sm">Cardiology • 4.9 ★</Text>
                </View>
              </View>
            </View>
            <View className="border-t border-borderDark pt-4">
              <Text className="text-textMuted text-xs font-bold uppercase tracking-wider mb-3">Available Today (30m blocks)</Text>
              <View className="flex-row flex-wrap gap-2">
                 {['09:00', '10:30', '14:00', '15:30'].map(slot => (
                    <TouchableOpacity 
                      key={slot} 
                      className="bg-primary/20 border border-primary rounded px-3 py-2"
                      onPress={() => handleBook('doctor-1', slot)}
                    >
                       <Text className="text-primary font-bold">{slot}</Text>
                    </TouchableOpacity>
                 ))}
                 <Text className="text-textMuted text-xs ml-2 self-center">Tap to Book</Text>
              </View>
            </View>
          </Card>
        </View>
      </Modal>

      {/* Intake Wizard Modal integration */}
      {wizardTargetDoctor && (
        <IntakeWizard 
          visible={!!wizardTargetDoctor} 
          onClose={() => { setWizardTargetDoctor(null); setWizardTargetTime(null); }}
          onComplete={handleIntakeComplete}
        />
      )}

    </View>
  );
}
