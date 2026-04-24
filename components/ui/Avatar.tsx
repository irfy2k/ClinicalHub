import { View, Text, Image } from 'react-native';
import clsx from 'clsx';

interface AvatarProps {
  url?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ url, name, size = 'md' }: AvatarProps) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-base",
    lg: "text-xl",
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <View className={clsx("rounded-full bg-sky-200 items-center justify-center overflow-hidden", sizes[size])}>
      {url ? (
        <Image source={{ uri: url }} className="w-full h-full" />
      ) : (
        <Text className={clsx("text-sky-800 font-bold", textSizes[size])}>{initials}</Text>
      )}
    </View>
  );
}
