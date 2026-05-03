import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Services } from '../../services';
import { ChatMessage, Appointment } from '../../types/database';
import { firebaseChatService } from '../../services/firebase/firebaseChatService';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!id) return;
    const fetchAppt = async () => {
      const appt = await Services.appointment.getById(id);
      setAppointment(appt);
    };
    fetchAppt();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    // Subscribe to real-time message updates via Firebase listener
    const unsubscribe = firebaseChatService.onMessagesChanged(id, (msgs) => {
      setMessages(msgs);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (id && user) {
      Services.appointment.markAsRead(id, user.role as any);
    }
  }, [id, user]);

  const handleSend = async () => {
    if (!inputText.trim() || !user || !id) return;

    await Services.chat.sendMessage({
      appointment_id: id,
      sender_id: user.id,
      content: inputText.trim()
    });

    setInputText('');
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#121417', paddingTop: Platform.OS === 'ios' ? 50 : 10 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(47, 51, 58, 0.5)', backgroundColor: '#121417', zIndex: 10 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginRight: 8 }}>
            <FontAwesome name="arrow-left" size={20} color="#E2E8F0" />
          </TouchableOpacity>
          <View>
            <Text style={{ color: '#F8FAFC', fontWeight: 'bold', fontSize: 18 }}>
              {user?.role === 'patient'
                ? (appointment?.doctor_name || 'Doctor')
                : (appointment?.patient_name || 'Patient')}
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 12 }}>
              {appointment ? (
                `Appt: ${new Date(appointment.scheduled_at).toLocaleDateString()} at ${new Date(appointment.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              ) : (
                'Secure Chat'
              )}
            </Text>
          </View>
        </View>

        {/* Messages feed */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <View style={{ width: 64, height: 64, backgroundColor: '#1E293B', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <FontAwesome name="lock" size={24} color="#94A3B8" />
              </View>
              <Text style={{ color: '#94A3B8', textAlign: 'center' }}>This chat is securely established. Say hello!</Text>
            </View>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <View
                  key={msg.id}
                  style={{
                    maxWidth: '80%',
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    marginBottom: 16,
                    backgroundColor: isMine ? '#3B82F6' : '#1E293B',
                    borderWidth: isMine ? 0 : 1,
                    borderColor: '#2F333A',
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                    borderTopRightRadius: isMine ? 4 : 16,
                    borderTopLeftRadius: isMine ? 16 : 4,
                  }}
                >
                  <Text style={{ color: isMine ? '#121417' : '#F8FAFC', fontWeight: isMine ? '600' : '400' }}>
                    {msg.content}
                  </Text>
                  <Text style={{ fontSize: 10, marginTop: 4, textAlign: 'right', color: isMine ? 'rgba(18, 20, 23, 0.7)' : '#94A3B8' }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#2F333A', backgroundColor: '#121417', flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#2F333A', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 8, marginRight: 12, flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Secure message..."
              placeholderTextColor="#94A3B8"
              style={{ flex: 1, color: '#F8FAFC', paddingVertical: 8 }}
              multiline
            />
          </View>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim()}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: inputText.trim() ? '#3B82F6' : '#1E293B',
              borderWidth: inputText.trim() ? 0 : 1,
              borderColor: '#2F333A'
            }}
          >
            <FontAwesome name="send" size={16} color={inputText.trim() ? '#121417' : '#94A3B8'} style={{ marginLeft: -2 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
