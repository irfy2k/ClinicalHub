import React, { useState } from 'react';
import { TextInput, TextInputProps, View, Text, TouchableOpacity } from 'react-native';
import clsx from 'clsx';
import { FontAwesome } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof FontAwesome.glyphMap;
}

export function Input({ label, error, icon, className, secureTextEntry, ...props }: InputProps) {
  const [isSecureVisible, setIsSecureVisible] = useState(false);
  const isPasswordField = secureTextEntry !== undefined;
  
  return (
    <View className="mb-5">
      {label && <Text className="text-textMuted text-xs uppercase tracking-wider font-bold mb-2">{label}</Text>}
      <View className={clsx(
        "bg-surfaceLight rounded-xl border flex-row items-center px-4",
        error ? "border-red-500" : "border-borderDark focus:border-textMuted"
      )}>
        {icon && <FontAwesome name={icon} size={16} color="#64748B" style={{ marginRight: 8 }} />}
        <TextInput
          className={clsx(
            "flex-1 py-4 text-textLight text-base",
            className
          )}
          placeholderTextColor="#64748B"
          secureTextEntry={isPasswordField ? !isSecureVisible : false}
          {...props}
        />
        {isPasswordField && (
          <TouchableOpacity onPress={() => setIsSecureVisible(!isSecureVisible)} className="p-2">
            <FontAwesome name={isSecureVisible ? "eye-slash" : "eye"} size={16} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text className="text-red-500 text-xs mt-2">{error}</Text>}
    </View>
  );
}
