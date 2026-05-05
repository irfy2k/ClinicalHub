import React, { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Services } from '../../services';
import { Prescription, User } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { notificationService } from '../../services/notificationService';
import { useLocalSearchParams } from 'expo-router';

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

export default function DoctorPrescriptions() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filter, setFilter] = useState<'Active' | 'All'>('Active');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreating, setIsCreating] = useState(false);
  const [patientUsers, setPatientUsers] = useState<User[]>([]);
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [costEstimate, setCostEstimate] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<{ field: 'start' | 'end'; visible: boolean }>({ field: 'start', visible: false });

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const [prescData, patientData] = await Promise.all([
        Services.prescription.getByDoctor(user.id),
        Services.auth.getUsersByRole('patient')
      ]);
      setPrescriptions(prescData);
      setPatientUsers(patientData);
    } catch (error) {
      console.error("Load error:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (params?.patientId && typeof params.patientId === 'string') {
      setIsCreating(true);
      setSelectedPatientId(params.patientId);
    }
  }, [params?.patientId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const toggleTime = (time: string) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(prev => prev.filter(t => t !== time));
    } else {
      setSelectedTimes(prev => [...prev, time].sort());
    }
  };

  const resetForm = () => {
    setMedName('');
    setDosage('');
    setCostEstimate('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setSelectedTimes([]);
    setSelectedPatientId(null);
  };

  const handleCreate = async () => {
    if (!user || !selectedPatientId || !medName || !dosage || selectedTimes.length === 0) {
      Alert.alert('Validation Error', 'Please fill in all required fields and select at least one schedule time.');
      return;
    }

    const patientName = patientUsers.find(u => u.id === selectedPatientId)?.name || 'Patient';

    const newPrescription = await Services.prescription.create({
      patient_id: selectedPatientId,
      doctor_id: user.id,
      patient_name: patientName,
      doctor_name: user.name,
      medication_name: medName,
      dosage,
      schedule_times: selectedTimes,
      start_date: startDate,
      end_date: endDate || undefined,
      cost_estimate: costEstimate ? parseFloat(costEstimate) : undefined,
      is_active: true,
    });

    await notificationService.scheduleMedicationReminders(newPrescription);
    await notificationService.sendInstantNotification(
      '💊 New Prescription Issued',
      `${medName} (${dosage}) has been prescribed to ${patientName}. Reminders have been scheduled.`,
      undefined,
      selectedPatientId
    );

    resetForm();
    setIsCreating(false);
    await loadData();
    Alert.alert('Success', 'Prescription created and reminders scheduled.');
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    Alert.alert(
      currentStatus ? 'Discontinue Medication' : 'Reactivate Medication',
      `Are you sure you want to ${currentStatus ? 'discontinue' : 'reactivate'} this prescription?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          style: currentStatus ? 'destructive' : 'default',
          onPress: async () => {
            await Services.prescription.updateStatus(id, !currentStatus);
            loadData();
          }
        }
      ]
    );
  };

  const filtered = filter === 'Active'
    ? prescriptions.filter(p => p.is_active)
    : prescriptions;

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-6 pb-4 bg-background z-10">
        <Text className="text-3xl font-bold text-textLight mb-2">Prescriptions</Text>
        <Text className="text-textMuted text-sm mb-4">Manage and issue patient prescriptions.</Text>

        <View className="flex-row rounded-lg bg-surfaceLight p-1">
          <TouchableOpacity
            className={clsx("flex-1 py-2 items-center rounded-md", filter === 'Active' && "bg-surface border border-borderDark")}
            onPress={() => setFilter('Active')}
          >
            <Text className={clsx("font-bold", filter === 'Active' ? "text-textLight" : "text-textMuted")}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={clsx("flex-1 py-2 items-center rounded-md", filter === 'All' && "bg-surface border border-borderDark")}
            onPress={() => setFilter('All')}
          >
            <Text className={clsx("font-bold", filter === 'All' ? "text-textLight" : "text-textMuted")}>All</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#85B523" />}
      >
        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#85B523" />
            <Text className="text-textMuted mt-4">Loading prescriptions...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FontAwesome name="file-text-o" size={48} color="#2F333A" />
            <Text className="text-textMuted mt-4">No prescriptions found</Text>
          </View>
        ) : (
          filtered.map(presc => (
            <Card key={presc.id} className="mb-4">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 pr-4">
                  <View className="flex-row items-center mb-1">
                    <View className={clsx(
                      "w-2 h-2 rounded-full mr-2",
                      presc.is_active ? "bg-primary" : "bg-textMuted"
                    )} />
                    <Text className={clsx(
                      "text-xs font-bold uppercase tracking-wider",
                      presc.is_active ? "text-primary" : "text-textMuted"
                    )}>
                      {presc.is_active ? 'Active' : 'Completed'}
                    </Text>
                  </View>
                  <Text className="text-textLight font-bold text-lg">{presc.medication_name}</Text>
                  <Text className="text-textMuted text-sm">{presc.dosage}</Text>
                </View>
                {presc.cost_estimate && (
                  <View className="bg-surfaceLight px-3 py-1.5 rounded-lg border border-borderDark">
                    <Text className="text-textLight font-bold">Rs. {presc.cost_estimate.toFixed(2)}</Text>
                    <Text className="text-textMuted text-[10px] uppercase">Est. Cost</Text>
                  </View>
                )}
              </View>

              <View className="h-px bg-borderDark mb-3 w-full" />

              <View className="flex-row items-center mb-2">
                <FontAwesome name="user" size={12} color="#94A3B8" />
                <Text className="text-textMuted text-sm ml-2">
                  Patient: {presc.patient_name || presc.patient_id}
                </Text>
              </View>

              <View className="flex-row items-center mb-2">
                <FontAwesome name="clock-o" size={12} color="#94A3B8" />
                <Text className="text-textMuted text-sm ml-2">
                  Schedule: {presc.schedule_times.join(', ')}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <FontAwesome name="calendar" size={12} color="#94A3B8" />
                  <Text className="text-textMuted text-sm ml-2">
                    {presc.start_date}{presc.end_date ? ` → ${presc.end_date}` : ' → Ongoing'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleToggleStatus(presc.id, presc.is_active)}>
                  <Text className={clsx("font-bold text-sm", presc.is_active ? "text-red-400" : "text-primary")}>
                    {presc.is_active ? 'Discontinue' : 'Reactivate'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <View className="absolute bottom-6 right-6">
        <TouchableOpacity
          className="w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
          onPress={() => setIsCreating(true)}
        >
          <FontAwesome name="plus" size={24} color="#121417" />
        </TouchableOpacity>
      </View>

      <Modal visible={isCreating} animationType="slide" presentationStyle="pageSheet">
        <ScrollView className="flex-1 bg-background pt-12 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-textLight">New Prescription</Text>
            <TouchableOpacity onPress={() => { resetForm(); setIsCreating(false); }}>
              <FontAwesome name="close" size={24} color="#E2E8F0" />
            </TouchableOpacity>
          </View>

          <Text className="text-textMuted text-xs uppercase tracking-wider font-bold mb-3">Select Patient</Text>
          {patientUsers.length === 0 ? (
            <Text className="text-textMuted text-sm mb-6">No patients registered yet.</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2 mb-6">
              {patientUsers.map(patient => (
                <TouchableOpacity
                  key={patient.id}
                  className={clsx(
                    "px-4 py-3 rounded-xl border flex-row items-center",
                    selectedPatientId === patient.id
                      ? "bg-primary/20 border-primary"
                      : "bg-surfaceLight border-borderDark"
                  )}
                  onPress={() => setSelectedPatientId(patient.id)}
                >
                  <View className={clsx(
                    "w-8 h-8 rounded-full items-center justify-center mr-3 border",
                    selectedPatientId === patient.id ? "border-primary bg-primary/30" : "border-borderDark bg-surface"
                  )}>
                    <Text className={clsx("font-bold text-sm", selectedPatientId === patient.id ? "text-primary" : "text-textMuted")}>
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                  <Text className={clsx("font-bold", selectedPatientId === patient.id ? "text-primary" : "text-textLight")}>
                    {patient.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Input label="Medication Name" placeholder="e.g. Amoxicillin" value={medName} onChangeText={setMedName} />
          <Input label="Dosage" placeholder="e.g. 500mg, 2 tablets" value={dosage} onChangeText={setDosage} />
          <Input label="Cost Estimate (Rs.)" placeholder="e.g. 1500" value={costEstimate} onChangeText={setCostEstimate} keyboardType="decimal-pad" />

          <Text className="text-textMuted text-xs uppercase tracking-wider font-bold mb-3 mt-2">Treatment Duration</Text>
          <View className="flex-row gap-4 mb-6">
            <TouchableOpacity 
              className="flex-1 bg-surfaceLight border border-borderDark rounded-xl p-4"
              onPress={() => setShowDatePicker({ field: 'start', visible: true })}
            >
              <Text className="text-textMuted text-[10px] uppercase font-bold mb-1">Start Date</Text>
              <Text className="text-textLight font-bold">{startDate}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 bg-surfaceLight border border-borderDark rounded-xl p-4"
              onPress={() => setShowDatePicker({ field: 'end', visible: true })}
            >
              <Text className="text-textMuted text-[10px] uppercase font-bold mb-1">End Date (Optional)</Text>
              <Text className="text-textLight font-bold">{endDate || 'Ongoing'}</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-textMuted text-xs uppercase tracking-wider font-bold mb-3">Schedule Times</Text>
          <View className="flex-row flex-wrap gap-2 mb-8">
            {TIME_SLOTS.map(slot => {
              const isActive = selectedTimes.includes(slot);
              return (
                <TouchableOpacity
                  key={slot}
                  className={clsx("px-3 py-2 border rounded-lg", isActive ? "bg-primary/20 border-primary" : "bg-surfaceLight border-borderDark")}
                  onPress={() => toggleTime(slot)}
                >
                  <Text className={clsx("font-bold text-sm", isActive ? "text-primary" : "text-textMuted")}>{slot}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Button label="Create Prescription" fullWidth onPress={handleCreate} className="mt-4" disabled={!medName || !dosage || !selectedPatientId || selectedTimes.length === 0} />
        </ScrollView>
      </Modal>

      <Modal visible={showDatePicker.visible} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center p-6">
          <Card className="w-full max-w-sm">
            <Text className="text-xl font-bold text-textLight mb-4">Select {showDatePicker.field === 'start' ? 'Start' : 'End'} Date</Text>
            <ScrollView className="max-h-64">
               {Array.from({ length: 30 }).map((_, i) => {
                 const date = new Date();
                 date.setDate(date.getDate() + i);
                 const dateStr = date.toISOString().split('T')[0];
                 return (
                   <TouchableOpacity 
                     key={dateStr}
                     className="py-3 border-b border-borderDark flex-row justify-between items-center"
                     onPress={() => {
                       if (showDatePicker.field === 'start') setStartDate(dateStr);
                       else setEndDate(dateStr);
                       setShowDatePicker({ ...showDatePicker, visible: false });
                     }}
                   >
                     <Text className="text-textLight">{date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                     <FontAwesome name="chevron-right" size={12} color="#2F333A" />
                   </TouchableOpacity>
                 );
               })}
               {showDatePicker.field === 'end' && (
                 <TouchableOpacity 
                    className="py-3 items-center"
                    onPress={() => { setEndDate(''); setShowDatePicker({ ...showDatePicker, visible: false }); }}
                 >
                    <Text className="text-primary font-bold">Set as Ongoing (No End Date)</Text>
                 </TouchableOpacity>
               )}
            </ScrollView>
            <Button label="Cancel" variant="secondary" fullWidth className="mt-4" onPress={() => setShowDatePicker({ ...showDatePicker, visible: false })} />
          </Card>
        </View>
      </Modal>
    </View>
  );
}
