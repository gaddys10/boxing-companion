import { Tabs, Stack } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false, fullScreenGestureEnabled: false }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
          orientation: 'default',
        }}
      />
      <Stack.Screen
        name="explore"
        options={{
          title: 'Explore',
        }}
      />
      <Stack.Screen
        name="roundScoring"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
