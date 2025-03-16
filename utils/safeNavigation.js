// utils/safeNavigation.js
import { useNavigation } from "expo-router";
import { useEffect, useState } from "react";

export function useSafeNavigation() {
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    // Wait for the navigation context to be ready
    if (navigation) {
      setIsNavigationReady(true);
    }
  }, [navigation]);

  return { navigation, isNavigationReady };
}
