import React from 'react';
import { View, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface DefaultAvatarProps {
  uri?: string | null;
  size?: number;
  className?: string;
}

/**
 * Reusable avatar component that shows a user's photo or a clean
 * FontAwesome placeholder icon when no image is available.
 */
export function DefaultAvatar({ uri, size = 48, className = '' }: DefaultAvatarProps) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className={`border border-borderDark ${className}`}
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={`bg-surfaceLight border border-borderDark items-center justify-center ${className}`}
    >
      <FontAwesome name="user-circle" size={size * 0.65} color="#94A3B8" />
    </View>
  );
}
