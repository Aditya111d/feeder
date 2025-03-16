// app/control.js
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Picker } from "@react-native-picker/picker"; // Already updated import

export default function ControlScreen() {
  const { user } = useAuth();
  const [feeds, setFeeds] = useState([]);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(""); // Initialize as empty string
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchPets = async () => {
      const { data, error } = await supabase
        .from("pets")
        .select("id, name")
        .eq("user_id", user.id);
      if (error) {
        console.error("Error fetching pets:", error);
      } else {
        setPets(data);
        if (data.length > 0) setSelectedPet(data[0].id.toString()); // Convert to string
      }
    };

    const fetchFeeds = async () => {
      if (!selectedPet) return;
      const { data, error } = await supabase
        .from("feeds")
        .select("*")
        .eq("user_id", user.id)
        .eq("pet_id", selectedPet)
        .order("timestamp", { ascending: false })
        .limit(10);
      if (error) {
        console.error("Error fetching feeds:", error);
      } else {
        setFeeds(data);
      }
    };

    fetchPets();
    fetchFeeds();

    const subscription = supabase
      .channel("feeds")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "feeds",
          filter: `user_id=eq.${user.id},pet_id=eq.${selectedPet}`,
        },
        (payload) => {
          setFeeds((currentFeeds) =>
            [payload.new, ...currentFeeds].slice(0, 10)
          );
        }
      )
      .subscribe();

    const petChangeHandler = supabase
      .channel("pet_change")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pets" },
        () => fetchPets()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      petChangeHandler.unsubscribe();
    };
  }, [user, selectedPet]);

  const handleFeed = async () => {
    if (!selectedPet) {
      Alert.alert("Error", "Please select a pet");
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    const { error } = await supabase.from("feeds").insert({
      user_id: user.id,
      pet_id: Number(selectedPet),
      status: "pending",
      amount_g: Number(amount),
    });
    if (error) {
      Alert.alert("Error", "Failed to trigger feed");
    } else {
      setAmount("");
      Alert.alert("Success", "Feed triggered!");
    }
  };

  const renderFeedItem = ({ item }) => (
    <View style={styles.feedItem}>
      <Text style={styles.feedText}>
        Feed at {new Date(item.timestamp).toLocaleString()} - Status:{" "}
        {item.status} - Amount: {item.amount_g || "N/A"}{" "}
        {item.amount_g ? "grams" : ""}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Control Panel</Text>
      <View style={styles.pickerContainer}>
        <Text style={styles.subtitle}>Select Pet:</Text>
        <Picker
          selectedValue={selectedPet} // Already a string
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedPet(itemValue)} // Value is a string
        >
          {pets.map((pet) => (
            <Picker.Item
              key={pet.id}
              label={pet.name}
              value={pet.id.toString()}
            /> // Convert to string
          ))}
        </Picker>
      </View>
      <View style={styles.inputContainer}>
        <Ionicons
          name="nutrition-outline"
          size={24}
          color="#4CAF50"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Amount (grams)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholderTextColor="#333"
        />
      </View>
      <TouchableOpacity style={styles.feedButton} onPress={handleFeed}>
        <Ionicons
          name="fast-food-outline"
          size={24}
          color="#fff"
          style={styles.icon}
        />
        <Text style={styles.buttonText}>Trigger Feed</Text>
      </TouchableOpacity>
      <Text style={styles.historyTitle}>
        Recent Feeds for{" "}
        {pets.find((p) => p.id.toString() === selectedPet)?.name ||
          "Selected Pet"}
      </Text>
      <FlatList
        data={feeds}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.feedList}
        ListEmptyComponent={
          <Text style={styles.feedText}>No feed history available</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#333",
    marginBottom: 5,
  },
  pickerContainer: {
    width: "100%",
    marginBottom: 20,
  },
  picker: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  inputIcon: {
    marginLeft: 15,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  feedButton: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 20,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  icon: {
    marginRight: 10,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  feedList: {
    width: "100%",
    flex: 1,
  },
  feedItem: {
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    marginBottom: 5,
    elevation: 2,
  },
  feedText: {
    fontSize: 16,
    color: "#333",
  },
});
