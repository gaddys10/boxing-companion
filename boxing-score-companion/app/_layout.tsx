import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack, usePathname } from 'expo-router';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect } from 'react';
import { Asset } from 'expo-asset';
import { PremiumProvider } from '@/contexts/PremiumContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    void Asset.loadAsync([
      require('../assets/images/bgfbsc.jpg'),
      require('../assets/images/bg1.jpg'),
      require('../assets/images/bg2.jpg'),
      require('../assets/images/flatwhiteicon-optimized.png'),
      require('../assets/images/appstore-optimized.png'),
      require('../assets/images/google-play-store-badge.png'),
      require('../assets/images/twitter-x-jyw81k7vr85ry57c7ym2d.webp'),
      require('../assets/images/instagram-optimized.png'),
      require('../assets/images/portrait-optimized.png'),
      require('../assets/images/landscape-optimized.png'),
    ]).catch((error) => {
      console.warn('Background preload failed:', error);
    });
  }, []);

  // const pathname = usePathname();
  // const orientationUpdate = useRef<Promise<void>>(Promise.resolve());

  // useEffect(() => {
  //   const orientationLock = pathname === '/roundScoring'
  //     ? ScreenOrientation.OrientationLock.LANDSCAPE
  //     : ScreenOrientation.OrientationLock.DEFAULT;

    // Native orientation changes are asynchronous. Queue them so a slower lock
    // from the previous route cannot finish after (and override) the current one.
  //   orientationUpdate.current = orientationUpdate.current
  //     .catch(() => undefined)
  //     .then(() => ScreenOrientation.lockAsync(orientationLock));
  // }, [pathname]);

  return (
    <PremiumProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ gestureEnabled: false, fullScreenGestureEnabled: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="createMatch" options={{ animationTypeForReplace: 'pop', orientation: 'default', }} />
            <Stack.Screen name="matchInfo" options={{ animationTypeForReplace: 'push', orientation: 'default', }} />
            <Stack.Screen name="matchNotes" options={{ animationTypeForReplace: 'push', orientation: 'default', }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal',  title: 'Modal' }} />
            <Stack.Screen
              name="roundScoring"
              options={({ route }) => {
                const params = route.params as
                  | { scoringOrientation?: 'portrait' | 'landscape' }
                  | undefined;

                return {
                  headerShown: false,
                  orientation:
                    params?.scoringOrientation === 'portrait'
                      ? 'portrait'
                      : 'landscape',
                  animation: 'fade',
                  animationDuration: 200,
                };
              }}
            />
          </Stack>
          {/* <StatusBar style="auto" /> */}
        </ThemeProvider>
      </GestureHandlerRootView>
    </PremiumProvider>
  );
}
