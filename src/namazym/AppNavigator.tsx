import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./screens/HomeScreen";
import DailyVerseScreen from "./screens/DailyVerseScreen";
import RamadanCalendarScreen from "./screens/RamadanCalendarScreen";
import QuranReaderScreen from "./screens/QuranReaderScreen";
import HadithReaderScreen from "./screens/HadithReaderScreen";
import KyblaScreen from "./screens/KyblaScreen";

import NamazKitabyScreen from "./screens/NamazKitabyScreen";
import NamazKitabyReaderScreen from "./screens/NamazKitabyReaderScreen";
import SahetliGunScreen from "./screens/SahetliGunScreen";
import TasbihScreen from "./screens/TasbihScreen";
import KazaScreen from "./screens/KazaScreen";
import AsmaulHusnaScreen from "./screens/AsmaulHusnaScreen";
import MetjitlerScreen from "./screens/MetjitlerScreen";
import IslamBayramlaryScreen from "./screens/IslamBayramlaryScreen";
import NamazDetailScreen from "./screens/NamazDetailScreen";
import SacredPlacesListScreen from "./screens/SacredPlacesListScreen";
import SacredPlaceDetailScreen from "./screens/SacredPlaceDetailScreen";
import SettingsScreen from "./screens/SettingsScreen";
import GurhanLibraryScreen from "./screens/GurhanLibraryScreen";
import NamazLearnScreen from "./screens/NamazLearnScreen";
import NamazLearnDetailScreen from "./screens/NamazLearnDetailScreen";
import DogalarScreen from "./screens/DogalarScreen";
import DogaDetailScreen from "./screens/DogaDetailScreen";
import LegalScreen from "./screens/LegalScreen";

import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { CityProvider } from "./context/CityContext";

import * as Notifications from 'expo-notifications';
import { NotificationService } from "./services/NotificationService";
import AudioPlayerService from "./services/AudioPlayerService";

const Stack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef();

import { PremiumProvider } from "./context/PremiumContext";

import OnboardingScreen from "./screens/OnboardingScreen";
import { StorageService } from "./services/StorageService";
import { View, ActivityIndicator, Platform } from "react-native";
import { colors } from "./theme/colors";

export function AppNavigator() {
    const [initialRoute, setInitialRoute] = useState<string | null>(null);

    // Notification Listener for Smart Routing
    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
            const data = response.notification.request.content.data;
            if (!data) return;

            // Short delay to ensure navigation is ready
            setTimeout(() => {
                const nav: any = navigationRef.current;
                if (!nav) return;

                switch (data.type) {
                    case 'hadith':
                        nav.navigate('HadithReader', { hadithId: data.hadithId });
                        break;
                    case 'ayah':
                        nav.navigate('QuranReader', {
                            surahId: data.surahId,
                            ayahId: data.ayahId,
                            autoScroll: true
                        });
                        break;
                    case 'prayer_alert':
                        nav.navigate('Home');
                        break;
                    case 'prayer':
                        nav.navigate('Home');
                        // Trigger foreground audio
                        AudioPlayerService.playFullAzan();
                        break;
                    default:
                        console.log('[NotificationRouting] Unknown type:', data.type);
                }
            }, 500);
        });

        return () => subscription.remove();
    }, []);

    useEffect(() => {
        NotificationService.init();
        setInitialRoute("Home");
    }, []);

    if (!initialRoute) {

        return (
            <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.gold} />
            </View>
        );
    }

    return (
        <PremiumProvider>
            <CityProvider>
                <NavigationContainer ref={navigationRef}>
                    <Stack.Navigator
                        initialRouteName={initialRoute}
                        screenOptions={{
                            headerShown: false,
                            animation: "fade",
                            animationDuration: 420, // Spec V1.1 Sacred Interaction
                        }}
                    >
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="DailyVerse" component={DailyVerseScreen} />
                        <Stack.Screen name="HadithReader" component={HadithReaderScreen} />
                        <Stack.Screen name="RamadanCalendar" component={RamadanCalendarScreen} />
                        <Stack.Screen name="SahetliGun" component={SahetliGunScreen} />
                        <Stack.Screen name="QiblaScreen" component={KyblaScreen} />
                        <Stack.Screen name="NamazKitaby" component={NamazKitabyScreen} />
                        <Stack.Screen name="QuranReader" component={QuranReaderScreen} initialParams={{ surahId: 1 }} />
                        <Stack.Screen name="TasbihScreen" component={TasbihScreen} />
                        <Stack.Screen name="Kaza" component={KazaScreen} />
                        <Stack.Screen name="AsmaulHusna" component={AsmaulHusnaScreen} />
                        <Stack.Screen name="IslamBayramlary" component={IslamBayramlaryScreen} />
                        <Stack.Screen name="Metjitler" component={MetjitlerScreen} />
                        <Stack.Screen name="Dogalar" component={DogalarScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="QuranMain" component={GurhanLibraryScreen} />

                        <Stack.Screen name="NamazKitabyReader" component={NamazKitabyReaderScreen} />
                        <Stack.Screen name="NamazDetail" component={NamazDetailScreen} />
                        <Stack.Screen name="SacredPlacesList" component={SacredPlacesListScreen} />
                        <Stack.Screen name="SacredPlaceDetail" component={SacredPlaceDetailScreen} />
                        <Stack.Screen name="NamazLearn" component={NamazLearnScreen} />
                        <Stack.Screen name="NamazLearnDetail" component={NamazLearnDetailScreen} />
                        <Stack.Screen name="DogaDetail" component={DogaDetailScreen} />
                        <Stack.Screen name="Legal" component={LegalScreen} />
                        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                    </Stack.Navigator>
                </NavigationContainer>
            </CityProvider>
        </PremiumProvider>
    );
}
