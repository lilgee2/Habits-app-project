import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";


function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const {user, isLoading} = useAuth() ;
  const segments = useSegments();
  
  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === "auth";

    if (isReady && !user && !inAuthGroup && !isLoading) {
      router.push("/auth");
    } else if (user && inAuthGroup && !isLoading){
      router.push("/screens")
    }

  }, [isReady, user, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <AuthProvider>
      <PaperProvider>
      <SafeAreaProvider>
    <RouteGuard>
      <Stack>
        <Stack.Screen name="screens" options={{ headerShown: false }} />
        <Stack.Screen 
          name="auth" 
          options={{ headerShown: false }} 
        />
      </Stack>
    </RouteGuard>
    </SafeAreaProvider>
    </PaperProvider>
    </AuthProvider>
    </GestureHandlerRootView>
  );
}