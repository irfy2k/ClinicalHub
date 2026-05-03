import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, Image } from 'react-native';
import { PainScale } from './PainScale';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface IntakeWizardProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
}

export function IntakeWizard({ visible, onClose, onComplete }: IntakeWizardProps) {
  const [step, setStep] = useState(1);
  const [symptoms, setSymptoms] = useState('');
  const [painLevel, setPainLevel] = useState(0);
  const [duration, setDuration] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete({
        symptoms,
        painLevel,
        duration,
        photoData: photoBase64 ? `data:image/jpeg;base64,${photoBase64}` : null
      });
      // reset state after submission
      setStep(1);
      setSymptoms('');
      setPainLevel(0);
      setDuration('');
      setPhotoUri(null);
      setPhotoBase64(null);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 || null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <View className="flex-1 bg-background px-6 pt-10">
        <View className="flex-row justify-between items-center mb-8">
          <Text className="text-xl font-bold text-textLight">Pre-Consultation</Text>
          <TouchableOpacity onPress={onClose}>
            <FontAwesome name="close" size={24} color="#E2E8F0" />
          </TouchableOpacity>
        </View>

        <View className="h-2 w-full bg-borderDark rounded-full mb-8">
          <View 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </View>

        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          {step === 1 && (
            <View>
              <Text className="text-2xl font-bold text-textLight mb-2">What is the primary reason for your visit?</Text>
              <Text className="text-textMuted mb-8">Please describe your symptoms briefly.</Text>
              
              <Input
                placeholder="e.g. Sharp pain in lower back, coughing for 3 days..."
                value={symptoms}
                onChangeText={setSymptoms}
                multiline
                numberOfLines={5}
                className="h-32 text-left align-top"
              />
            </View>
          )}

          {step === 2 && (
            <View>
              <Text className="text-2xl font-bold text-textLight mb-2">How severe is your discomfort?</Text>
              <Text className="text-textMuted mb-8">Select your pain level using the scale below.</Text>
              
              <PainScale value={painLevel} onChange={setPainLevel} />
            </View>
          )}

          {step === 3 && (
            <View>
              <Text className="text-2xl font-bold text-textLight mb-2">Additional Context</Text>
              <Text className="text-textMuted mb-8">How long have you been experiencing these symptoms?</Text>
              
              <Input
                placeholder="e.g. 2 weeks, since yesterday"
                value={duration}
                onChangeText={setDuration}
              />
              
              <Text className="text-textLight font-bold mt-4 mb-2">Photo Reference (Optional)</Text>
              <TouchableOpacity 
                className="w-full h-32 border-2 border-dashed border-borderDark rounded-xl items-center justify-center bg-surfaceLight overflow-hidden"
                onPress={pickImage}
              >
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <>
                    <FontAwesome name="camera" size={32} color="#94A3B8" />
                    <Text className="text-textMuted mt-2 font-semibold">Tap to upload photo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <View className="py-6 flex-row border-t border-borderDark">
          {step > 1 && (
            <View className="flex-1 mr-2">
              <Button 
                label="Back" 
                variant="secondary" 
                fullWidth 
                onPress={() => setStep(step - 1)} 
              />
            </View>
          )}
          <View className={step > 1 ? "flex-1 ml-2" : "flex-1"}>
            <Button 
              label={step === 3 ? "Submit & Book" : "Next Step"} 
              fullWidth 
              onPress={handleNext}
              disabled={step === 1 && !symptoms}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
