import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { FontAwesome } from '@expo/vector-icons';
import clsx from 'clsx';

const schema = z.object({
  height: z.string().optional(),
  weight: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const CONDITIONS = [
  'Hypertension', 'Asthma', 'Diabetes Type 2', 
  'Cardiovascular Disease', 'Autoimmune Disorder'
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { height: '', weight: '', bloodType: '', allergies: '' }
  });

  const toggleCondition = (cond: string) => {
    if (selectedConditions.includes(cond)) {
      setSelectedConditions(selectedConditions.filter(c => c !== cond));
    } else {
      setSelectedConditions([...selectedConditions, cond]);
    }
  };

  const onSubmit = (data: FormData) => {
    updateUser({
      medical_history: {
        height: data.height,
        weight: data.weight,
        blood_type: data.bloodType,
        allergies: data.allergies ? data.allergies.split(',').map(a => a.trim()) : [],
        conditions: selectedConditions,
      }
    });
    router.replace('/(patient)/dashboard');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, paddingTop: 60 }}>
        
        <View className="flex-row items-center mb-10">
          <View className="w-10 h-10 rounded-full bg-surfaceLight items-center justify-center mr-4 border border-borderDark">
            <FontAwesome name="lock" size={16} color="#94A3B8" />
          </View>
          <View>
            <Text className="text-xl font-bold text-textLight">Patient Intake</Text>
            <Text className="text-textMuted text-sm">Confidential Medical Record</Text>
          </View>
        </View>

        <View className="mb-8">
          <View className="h-1 bg-borderDark rounded-full overflow-hidden mb-6">
             <View className="w-1/2 h-full bg-primary" />
          </View>
          
           <Text className="text-2xl font-bold text-textLight mb-3">Medical History</Text>
           <Text className="text-textMuted leading-relaxed">
             Please provide accurate details regarding your past and current medical conditions. This information is critical for tailoring a safe and effective care plan.
           </Text>
        </View>

        <View className="mb-6">
          <Controller
            control={control}
            name="height"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Height (cm)"
                placeholder="e.g. 175"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
              />
            )}
          />

          <Controller
            control={control}
            name="weight"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Weight (kg)"
                placeholder="e.g. 72"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
              />
            )}
          />

          <Controller
            control={control}
            name="bloodType"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Blood Type"
                placeholder="Select type"
                value={value}
                onChangeText={onChange}
              />
            )}
          />

          <Text className="text-textMuted text-xs uppercase tracking-wider font-bold mb-3 mt-4">Known Pre-existing Conditions</Text>
          <View className="flex-row flex-wrap gap-2 mb-8">
             {CONDITIONS.map(cond => {
               const isSelected = selectedConditions.includes(cond);
               return (
                 <TouchableOpacity 
                   key={cond}
                   onPress={() => toggleCondition(cond)}
                   className={clsx(
                     "px-4 py-2 rounded-full border flex-row items-center mr-2 mb-2 w-[48%]",
                     isSelected ? "bg-primary/20 border-primary" : "bg-surfaceLight border-borderDark"
                   )}
                 >
                   <View className={clsx("w-4 h-4 rounded-full border items-center justify-center mr-2", isSelected ? "border-primary bg-primary" : "border-textMuted")}>
                      {isSelected && <FontAwesome name="check" size={10} color="#121417" />}
                   </View>
                   <Text className={clsx("text-sm", isSelected ? "text-primary font-bold" : "text-textMuted")}>{cond}</Text>
                 </TouchableOpacity>
               )
             })}
          </View>

          <Controller
            control={control}
            name="allergies"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Drug or Environmental Allergies"
                placeholder="List any known allergies..."
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={3}
                className="h-24"
              />
            )}
          />
        </View>

        <Button 
          label="Complete Intake" 
          fullWidth 
          onPress={handleSubmit(onSubmit)} 
          className="mt-4 mb-8"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
