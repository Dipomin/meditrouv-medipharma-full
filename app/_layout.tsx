import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreenExpo from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import GlobalMenu from "./components/GlobalMenu";
import PushBootstrap from "./components/PushBootstrap";
import SplashScreen from "./components/SplashScreen";
import { OfflineBanner, ToastProvider } from "./components/ui";
import { PharmacienAuthProvider } from "./context/PharmacienAuthContext";

SplashScreenExpo.preventAutoHideAsync();

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded, fontError] = useFonts({});

  useEffect(() => {
    // Le splash natif ne doit jamais rester affiché : repli temporisé
    // si les polices ou hideAsync restaient en suspens.
    const fallbackTimer = setTimeout(() => {
      SplashScreenExpo.hideAsync().catch(() => undefined);
    }, 5000);
    if (fontsLoaded || fontError) {
      SplashScreenExpo.hideAsync().catch(() => undefined);
    }
    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PharmacienAuthProvider>
        <ToastProvider>
          {showSplash ? (
            <SplashScreen onFinish={() => setShowSplash(false)} />
          ) : (
            <>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "fade",
                }}
              />
              <GlobalMenu />
              <PushBootstrap />
              <OfflineBanner />
            </>
          )}
        </ToastProvider>
      </PharmacienAuthProvider>
    </GestureHandlerRootView>
  );
}
