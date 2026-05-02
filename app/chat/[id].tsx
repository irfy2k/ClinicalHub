import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Services } from '../../services';
import { ChatMessage } from '../../types/database';
import { firebaseChatService } from '../../services/firebase/firebaseChatService';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!id) return;

    // Subscribe to real-time message updates via Firebase listener
    const unsubscribe = firebaseChatService.onMessagesChanged(id, (msgs) => {
      setMessages(msgs);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [id]);

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
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-4 py-4 flex-row items-center border-b border-borderDark/50 bg-background z-10">
          <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
             <FontAwesome name="arrow-left" size={20} color="#E2E8F0" />
          </TouchableOpacity>
          <View>
            <Text className="text-textLight font-bold text-lg">Secure Chat</Text>
            <Text className="text-textMuted text-xs">End-to-End Encrypted</Text>
          </View>
        </View>

        {/* Messages feed */}
        <ScrollView 
           ref={scrollViewRef}
           contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
           onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View className="items-center py-10">
               <View className="w-16 h-16 bg-surfaceLight rounded-full items-center justify-center mb-4">
                 <FontAwesome name="lock" size={24} color="#94A3B8" />
               </View>
               <Text className="text-textMuted text-center">This chat is securely established. Say hello!</Text>
            </View>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <View 
                  key={msg.id} 
                  className={`max-w-[80%] rounded-2xl px-4 py-3 mb-4 ${isMine ? 'bg-primary self-end rounded-tr-sm' : 'bg-surface border border-borderDark self-start rounded-tl-sm'}`}
                >
                  <Text className={isMine ? 'text-background font-semibold' : 'text-textLight'}>
                    {msg.content}
                  </Text>
                  <Text className={`text-[10px] mt-1 text-right ${isMine ? 'text-background/70' : 'text-textMuted'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Bar */}
        <View className="p-4 border-t border-borderDark bg-background flex-row items-center">
          <View className="flex-1 bg-surface border border-borderDark rounded-full px-4 py-2 mr-3 flex-row items-center">
            <TextInput 
              value={inputText}
              onChangeText={setInputText}
              placeholder="Secure message..."
              placeholderTextColor="#94A3B8"
              className="flex-1 text-textLight py-2"
              multiline
            />
          </View>
          <TouchableOpacity 
            onPress={handleSend}
            disabled={!inputText.trim()}
            className={`w-12 h-12 rounded-full items-center justify-center ${inputText.trim() ? 'bg-primary shadow-lg' : 'bg-surface border border-borderDark'}`}
          >
            <FontAwesome name="send" size={16} color={inputText.trim() ? '#121417' : '#94A3B8'} style={{ marginLeft: -2 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
