import './src/namazym/translations/i18n';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';

// Contexts
import { RemoteConfigProvider } from "./src/namazym/context/RemoteConfigContext";
import { PremiumProvider } from "./src/namazym/context/PremiumContext";
import { CityProvider } from "./src/namazym/context/CityContext";

// Navigation
import { AppNavigator } from "./src/namazym/AppNavigator";
import { NotificationService } from "./src/namazym/services/NotificationService";

// Prevent splash screen from hiding automatically until we're ready
SplashScreen.preventAutoHideAsync();

NotificationService.init();

export default function App() {
  const [appReady, setAppReady] = useState(false);

  const [fontsLoaded] = useFonts({
    'Amiri-Regular': Amiri_400Regular,
    'Amiri-Bold': Amiri_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      setAppReady(true);
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!appReady || !fontsLoaded) return null;

  return (
    <RemoteConfigProvider>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </RemoteConfigProvider>
  );
}
