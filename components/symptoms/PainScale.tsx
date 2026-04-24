import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import clsx from 'clsx';
import { FontAwesome } from '@expo/vector-icons';

interface PainScaleProps {
  value: number;
  onChange: (value: number) => void;
}

export function PainScale({ value, onChange }: PainScaleProps) {
  const getColors = (val: number) => {
    if (val <= 3) return 'bg-primary border-primary';
    if (val <= 7) return 'bg-yellow-500 border-yellow-500';
    return 'bg-red-500 border-red-500';
  };

  return (
    <View className="mb-6">
      <Text className="text-textLight font-bold mb-4">Pain Scale (1-10)</Text>
      
      <View className="flex-row justify-between mb-2">
        <Text className="text-textMuted text-xs">No Pain</Text>
        <Text className="text-textMuted text-xs">Moderate</Text>
        <Text className="text-textMuted text-xs">Unbearable</Text>
      </View>
      
      <View className="flex-row items-center justify-between">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <TouchableOpacity
            key={num}
            activeOpacity={0.7}
            onPress={() => onChange(num)}
            className={clsx(
              "w-8 h-10 rounded-md items-center justify-center border",
              value === num 
                ? getColors(num)
                : "bg-surfaceLight border-borderDark"
            )}
          >
            <Text className={clsx(
              "font-bold text-sm",
              value === num ? "text-background" : "text-textMuted"
            )}>
              {num}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View className="items-center mt-4 h-12 justify-center">
         {value > 0 && value <= 3 && <FontAwesome name="smile-o" size={32} color="#85B523" />}
         {value > 3 && value <= 7 && <FontAwesome name="meh-o" size={32} color="#EAB308" />}
         {value > 7 && <FontAwesome name="frown-o" size={32} color="#EF4444" />}
      </View>
    </View>
  );
}
