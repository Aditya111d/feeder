// app/schedule.js
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { Picker } from "@react-native-picker/picker"; // Already updated import

export default function ScheduleScreen() {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [time, setTime] = useState("12:00");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .eq("user_id", user.id);
    if (error) {
      console.error("Error fetching pets:", error);
    } else {
      setPets(data);
      if (data.length > 0) {
        setSelectedPet(data[0]); // Set the first pet as selected
      }
    }
  };

  useEffect(() => {
    if (!selectedPet) return;
    fetchSchedules();
  }, [selectedPet]);

  const fetchSchedules = async () => {
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("pet_id", selectedPet.id);
    if (error) {
      console.error("Error fetching schedules:", error);
    } else {
      setSchedules(data);
    }
  };

  const handleAddSchedule = async () => {
    if (!time || !amount) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("schedules").insert({
      user_id: user.id,
      pet_id: selectedPet.id,
      time,
      amount_g: Number(amount),
      is_active: true,
    });
    if (error) {
      Alert.alert("Error", "Failed to add schedule");
    } else {
      Alert.alert("Success", "Schedule added successfully!");
      setTime("12:00");
      setAmount("");
      fetchSchedules();
    }
  };

  const handleToggleSchedule = async (scheduleId, isActive) => {
    const { error } = await supabase
      .from("schedules")
      .update({ is_active: !isActive })
      .eq("id", scheduleId);
    if (error) {
      Alert.alert("Error", "Failed to update schedule");
    } else {
      fetchSchedules();
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    const { error } = await supabase
      .from("schedules")
      .delete()
      .eq("id", scheduleId);
    if (error) {
      Alert.alert("Error", "Failed to delete schedule");
    } else {
      fetchSchedules();
    }
  };

  const renderScheduleItem = ({ item }) => (
    <View style={styles.scheduleItem}>
      <Ionicons
        name="time-outline"
        size={24}
        color="#666"
        style={styles.scheduleIcon}
      />
      <Text style={styles.scheduleText}>
        {item.time} - {item.amount_g}g
      </Text>
      <Switch
        value={item.is_active}
        onValueChange={() => handleToggleSchedule(item.id, item.is_active)}
        trackColor={{ false: "#767577", true: "#4CAF50" }}
        thumbColor={item.is_active ? "#fff" : "#f4f3f4"}
      />
      <TouchableOpacity onPress={() => handleDeleteSchedule(item.id)}>
        <Ionicons name="trash-outline" size={24} color="#d32f2f" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Feeding Schedule</Text>
      {pets.length > 0 ? (
        <>
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Select Pet</Text>
            <Picker
              selectedValue={
                selectedPet ? selectedPet.id.toString() : undefined
              } // Convert id to string
              style={styles.picker}
              onValueChange={(itemValue) => {
                const pet = pets.find((p) => p.id.toString() === itemValue); // Match as string
                setSelectedPet(pet);
              }}
            >
              {pets.map((pet) => (
                <Picker.Item
                  key={pet.id}
                  label={pet.name}
                  value={pet.id.toString()}
                /> // Convert value to string
              ))}
            </Picker>
            {selectedPet && (
              <>
                <Text style={styles.cardTitle}>
                  {selectedPet.name}'s Schedule
                </Text>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Time</Text>
                  <TextInput
                    style={styles.input}
                    value={time}
                    onChangeText={setTime}
                    placeholder="HH:MM"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Amount (g)"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddSchedule}
                >
                  <Text style={styles.buttonText}>Add Schedule</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          <FlatList
            data={schedules}
            renderItem={renderScheduleItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.scheduleList}
          />
        </>
      ) : (
        <Text style={styles.noPetText}>
          No pets added. Go to "Pets" to add one!
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 16,
    color: "#333",
  },
  input: {
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    padding: 10,
    width: 100,
    textAlign: "center",
    fontSize: 16,
    color: "#333",
  },
  picker: {
    width: "100%",
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  scheduleList: {
    flex: 1,
  },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  scheduleIcon: {
    marginRight: 10,
  },
  scheduleText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  noPetText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
});
