import { Tabs, Stack } from 'expo-router';
import React, { useEffect } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { Image } from 'expo-image';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  useEffect(() => {
    void Promise.all([
      Image.loadAsync(require('../../assets/images/bg1.jpg')),
      Image.loadAsync(require('../../assets/images/bg2.jpg')),
      Image.loadAsync(require('../../assets/images/bgfbsc.jpg')),
    ]).catch((error) => {
      console.warn('Background preload failed:', error);
    });
  }, []);
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
        name="roundScoring"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
