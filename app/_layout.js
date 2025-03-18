import { Drawer } from "expo-router/drawer";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { DrawerItemList, DrawerItem } from "@react-navigation/drawer";
import { useEffect, useState, useRef } from "react";

const CustomDrawerContent = (props) => {
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleLogOut = async () => {
    await logout();
    router.replace("/welcome");
  };

  return (
    <View style={styles.drawerContainer}>
      {/* Drawer Header */}
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerHeaderText}>Pet Feeder</Text>
      </View>

      {/* Drawer Items */}
      <View style={{ flex: 1 }}>
        {user ? (
          <>
            {/* Show only authenticated screens in the drawer */}
            <DrawerItemList {...props} />
            {/* Log Out button */}
            <View style={styles.logoutContainer}>
              <DrawerItem
                label="Log Out"
                onPress={handleLogOut}
                icon={({ size, color }) => (
                  <Ionicons name="log-out-outline" size={size} color={color} />
                )}
                style={styles.drawerItem}
                labelStyle={styles.labelStyle}
                activeTintColor="#4CAF50"
                inactiveTintColor="#333"
              />
            </View>
          </>
        ) : (
          <Text style={styles.unauthenticatedText}>
            Please log in to access the menu.
          </Text>
        )}
      </View>
    </View>
  );
};

function AppContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [navigatorReady, setNavigatorReady] = useState(false);
  const hasNavigated = useRef(false);

  // Mark the component as mounted after the first render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Mark the navigator as ready after the Drawer is mounted
  useEffect(() => {
    setNavigatorReady(true);
  }, []);

  // Handle redirect after the navigator is ready
  useEffect(() => {
    if (loading || !isMounted || !navigatorReady || hasNavigated.current)
      return;

    console.log("Current pathname:", pathname);
    if (
      user &&
      !["/dashboard", "/schedule", "/pets", "/pet-videos", "/control"].includes(
        pathname
      )
    ) {
      console.log("Redirecting to /dashboard for user:", user?.email);
      router.replace("/dashboard");
      hasNavigated.current = true;
    } else if (!user && !["/welcome", "/login", "/signup"].includes(pathname)) {
      console.log("Redirecting to /welcome for no user");
      router.replace("/welcome");
      hasNavigated.current = true;
    }
  }, [loading, user, isMounted, navigatorReady, pathname]);

  if (loading || !isMounted) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Drawer
      initialRouteName="dashboard"
      screenOptions={{
        headerStyle: { backgroundColor: "#4CAF50" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        drawerStyle: { backgroundColor: "#fff" },
        drawerActiveTintColor: "#4CAF50",
        drawerInactiveTintColor: "#333",
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      {/* Welcome (not in drawer) */}
      <Drawer.Screen
        name="welcome"
        options={{
          drawerItemStyle: { display: "none" }, // Hide from drawer
          title: "Welcome",
        }}
      />

      {/* Dashboard */}
      <Drawer.Screen
        name="dashboard"
        options={{
          drawerLabel: "Dashboard",
          title: "Pet Feeder",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Schedule */}
      <Drawer.Screen
        name="schedule"
        options={{
          drawerLabel: "Schedule",
          title: "Feeding Schedule",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Pets */}
      <Drawer.Screen
        name="pets"
        options={{
          drawerLabel: "Pets",
          title: "Manage Pets",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="paw-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Pet Videos */}
      <Drawer.Screen
        name="pet-videos"
        options={{
          drawerLabel: "Pet Videos",
          title: "Pet Videos",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="play-circle-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Control */}
      <Drawer.Screen
        name="control"
        options={{
          drawerLabel: "Control",
          title: "Control Panel",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Login (not in drawer) */}
      <Drawer.Screen
        name="login"
        options={{
          drawerItemStyle: { display: "none" }, // Hide from drawer
          title: "Login",
        }}
      />

      {/* Signup (not in drawer) */}
      <Drawer.Screen
        name="signup"
        options={{
          drawerItemStyle: { display: "none" }, // Hide from drawer
          title: "Signup",
        }}
      />
    </Drawer>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    paddingTop: 20,
  },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  drawerHeaderText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  drawerItem: {
    marginVertical: 5,
  },
  labelStyle: {
    fontSize: 16,
    color: "#333",
  },
  logoutContainer: {
    marginBottom: 20,
  },
  unauthenticatedText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
});