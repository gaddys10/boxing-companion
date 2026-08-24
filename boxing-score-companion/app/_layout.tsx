import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ gestureEnabled: false, fullScreenGestureEnabled: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="createMatch" options={{ animationTypeForReplace: 'pop', orientation: 'default', }} />
          <Stack.Screen name="matchInfo" options={{ animationTypeForReplace: 'push', orientation: 'default', }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal',  title: 'Modal' }} />
          <Stack.Screen name="roundScoring" options={{headerShown: false, orientation: 'default', animation: 'fade', animationDuration: 200}}/>
        </Stack>
        {/* <StatusBar style="auto" /> */}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
