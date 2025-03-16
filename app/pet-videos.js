// app/pet-videos.js
import React from "react";
import { StyleSheet, View, Text } from "react-native";

export default function PetVideosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pet Videos</Text>
      <Text style={styles.message}>
        Coming soon! Record and view your pet's feeding videos here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
