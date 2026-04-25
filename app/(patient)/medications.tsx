import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Services } from '../../services';
import { Prescription, MedicationLog } from '../../types/database';
import { Card } from '../../components/ui/Card';
import clsx from 'clsx';

interface TimelineEntry {
  prescriptionId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  status: 'taken' | 'skipped' | 'pending';
  logId?: string;
}

export default function MedicationsScreen() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    const prescData = await Services.prescription.getByPatient(user.id);
    setPrescriptions(prescData);

    // Load all logs for active prescriptions
    const allLogs: MedicationLog[] = [];
    for (const p of prescData.filter(p => p.is_active)) {
      const prescLogs = await Services.prescription.getLogsByPrescription(p.id);
      allLogs.push(...prescLogs);
    }
    setLogs(allLogs);

    // Build today's timeline from active prescriptions
    const todayEntries: TimelineEntry[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const p of prescData.filter(p => p.is_active)) {
      for (const time of p.schedule_times) {
        // Check if there's a log for this specific slot today
        const existingLog = allLogs.find(l =>
          l.prescription_id === p.id &&
          l.logged_at.startsWith(today) &&
          l.logged_at.includes(time)
        );

        todayEntries.push({
          prescriptionId: p.id,
          medicationName: p.medication_name,
          dosage: p.dosage,
          scheduledTime: time,
          status: existingLog?.status || 'pending',
          logId: existingLog?.id,
        });
      }
    }

    // Sort by time
    todayEntries.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    setTimeline(todayEntries);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle = async (entry: TimelineEntry) => {
    let newStatus: 'taken' | 'skipped' | 'pending';
    if (entry.status === 'pending') newStatus = 'taken';
    else if (entry.status === 'taken') newStatus = 'skipped';
    else newStatus = 'pending';

    if (newStatus === 'pending') {
      // Reset — just update local state, no log
      setTimeline(prev => prev.map(t =>
        t.prescriptionId === entry.prescriptionId && t.scheduledTime === entry.scheduledTime
          ? { ...t, status: 'pending', logId: undefined }
          : t
      ));
      return;
    }

    // Log to service
    const today = new Date().toISOString().split('T')[0];
    await Services.prescription.logMedication({
      prescription_id: entry.prescriptionId,
      status: newStatus,
      logged_at: `${today}T${entry.scheduledTime}:00.000Z`,
    });

    // Refresh data
    loadData();
  };

  // Calculate adherence based accurately on all historical logs vs total tracked
  const takenCount = logs.filter(l => l.status === 'taken').length;
  const adherenceScore = logs.length > 0 ? Math.round((takenCount / logs.length) * 100) : 100;

  const activePrescriptions = prescriptions.filter(p => p.is_active);

  const formatTime12h = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-6 pb-2 bg-background z-10">
        <Text className="text-3xl font-bold text-textLight mb-6">Medications</Text>

        <Card className="flex-row items-center p-4 bg-surfaceLight border-borderDark mb-4">
          <View className="mr-6 relative items-center justify-center">
            <View className={clsx(
              "w-16 h-16 rounded-full border-4 items-center justify-center",
              adherenceScore >= 80 ? "border-primary" : adherenceScore >= 50 ? "border-yellow-500" : "border-red-500"
            )}>
              <Text className="text-textLight font-bold text-sm">{adherenceScore}%</Text>
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-textLight font-bold text-lg">Weekly Adherence</Text>
            <Text className="text-textMuted text-sm leading-5">
              {adherenceScore >= 80
                ? "You're doing great! Keep taking your medications on time."
                : adherenceScore >= 50
                  ? "Room for improvement. Try setting a reminder."
                  : "Your adherence is low. Please take your medications as prescribed."}
            </Text>
          </View>
        </Card>

        <Text className="text-textLight font-bold mt-4 mb-2">Today's Schedule</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 4 }}>
        {timeline.length === 0 ? (
          <View className="items-center justify-center py-16">
            <FontAwesome name="check-circle" size={48} color="#2F333A" />
            <Text className="text-textMuted mt-4">No medications scheduled for today</Text>
          </View>
        ) : (
          timeline.map((entry, idx) => (
            <Card key={`${entry.prescriptionId}-${entry.scheduledTime}`} className="mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                {/* Time indicator */}
                <View className="mr-4 items-center">
                  <Text className="text-textMuted text-xs font-bold">{formatTime12h(entry.scheduledTime)}</Text>
                  {idx < timeline.length - 1 && (
                    <View className="w-px h-4 bg-borderDark mt-1" />
                  )}
                </View>

                {/* Medication icon */}
                <View className={clsx(
                  "w-12 h-12 rounded-full items-center justify-center mr-4 border",
                  entry.status === 'taken' ? "bg-primary/20 border-primary" :
                  entry.status === 'skipped' ? "bg-red-500/20 border-red-500" :
                  "bg-surfaceLight border-borderDark"
                )}>
                  <FontAwesome
                    name={entry.status === 'taken' ? 'check' : entry.status === 'skipped' ? 'times' : 'medkit'}
                    size={18}
                    color={
                      entry.status === 'taken' ? '#85B523' :
                      entry.status === 'skipped' ? '#EF4444' : '#94A3B8'
                    }
                  />
                </View>

                {/* Medication info */}
                <View className="flex-1">
                  <Text className="text-textLight font-bold text-lg">
                    {entry.medicationName}{' '}
                    <Text className="text-textMuted font-normal text-sm">{entry.dosage}</Text>
                  </Text>
                  <Text className={clsx(
                    "text-sm mt-1 font-semibold",
                    entry.status === 'taken' ? "text-primary" :
                    entry.status === 'skipped' ? "text-red-400" :
                    "text-textMuted"
                  )}>
                    {entry.status === 'taken' ? '✓ Taken' :
                     entry.status === 'skipped' ? '✗ Skipped' :
                     'Tap to mark'}
                  </Text>
                </View>
              </View>

              {/* Toggle button */}
              <TouchableOpacity
                className={clsx(
                  "px-4 py-2 rounded-lg border",
                  entry.status === 'taken' ? "border-primary bg-primary/10" :
                  entry.status === 'skipped' ? "border-red-500 bg-red-500/10" :
                  "border-borderDark bg-surfaceLight"
                )}
                onPress={() => handleToggle(entry)}
              >
                <Text className={clsx(
                  "font-bold text-sm",
                  entry.status === 'taken' ? "text-primary" :
                  entry.status === 'skipped' ? "text-red-500" :
                  "text-textMuted"
                )}>
                  {entry.status === 'taken' ? 'Taken' : entry.status === 'skipped' ? 'Skipped' : 'Mark'}
                </Text>
              </TouchableOpacity>
            </Card>
          ))
        )}

        {/* Active Prescriptions Section */}
        <Text className="text-textLight font-bold mt-6 mb-4">Active Prescriptions</Text>

        {activePrescriptions.length === 0 ? (
          <View className="items-center py-8">
            <Text className="text-textMuted">No active prescriptions</Text>
          </View>
        ) : (
          activePrescriptions.map(presc => (
            <Card key={presc.id} className="mb-4">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="text-textLight font-bold text-lg">{presc.medication_name}</Text>
                  <Text className="text-textMuted">{presc.dosage} • {presc.schedule_times.map(t => formatTime12h(t)).join(', ')}</Text>
                </View>
                {presc.cost_estimate && (
                  <View className="bg-primary/20 px-2 py-1 rounded border border-primary">
                    <Text className="text-primary text-xs font-bold uppercase tracking-wider">${presc.cost_estimate.toFixed(2)}</Text>
                  </View>
                )}
              </View>
              <View className="flex-row items-center mt-2">
                <FontAwesome name="calendar" size={12} color="#94A3B8" />
                <Text className="text-textMuted text-sm ml-2">
                  {presc.start_date}{presc.end_date ? ` → ${presc.end_date}` : ' → Ongoing'}
                </Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}
