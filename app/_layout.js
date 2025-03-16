import { Drawer } from "expo-router/drawer";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { DrawerItemList, DrawerItem } from "@react-navigation/drawer";
import { useEffect } from "react";

const CustomDrawerContent = (props) => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogOut = async () => {
    await logout();
    router.replace("/welcome");
  };

  return (
    <View style={styles.drawerContainer}>
      {/* Add "Pet Feeder" title */}
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerHeaderText}>Pet Feeder</Text>
      </View>

      {/* Render drawer items */}
      <View style={{ flex: 1 }}>
        <DrawerItemList {...props} />
      </View>

      {/* Log Out button at the bottom */}
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
    </View>
  );
};

function AppContent() {
  const { user, loading } = useAuth(); // Get user and loading state from AuthContext
  const router = useRouter(); // Get the router object for navigation

  useEffect(() => {
    if (!loading) {
      // If the user is logged in, redirect to the dashboard
      if (user) {
        router.replace("/dashboard");
      } else {
        // If the user is not logged in, redirect to the welcome screen
        router.replace("/welcome");
      }
    }
  }, [loading, user, router]);

  if (loading) {
    // Show a loading indicator while checking the authentication state
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: "#4CAF50" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        drawerStyle: {
          backgroundColor: "#fff",
        },
        drawerActiveTintColor: "#4CAF50",
        drawerInactiveTintColor: "#333",
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      {/* Welcome */}
      <Drawer.Screen
        name="welcome"
        options={{
          drawerLabel: "Welcome",
          title: "Welcome",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
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

      {/* Login */}
      <Drawer.Screen
        name="login"
        options={{
          drawerLabel: "Login",
          title: "Login",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="log-in-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Signup */}
      <Drawer.Screen
        name="signup"
        options={{
          drawerLabel: "Signup",
          title: "Signup",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="person-add-outline" size={size} color={color} />
          ),
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
    paddingTop: 20, // Add padding to avoid overlap with status bar
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
    marginBottom: 20, // Add margin to the bottom for spacing
  },
});
