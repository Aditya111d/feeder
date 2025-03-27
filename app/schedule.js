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
  Modal,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";

export default function ScheduleScreen() {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [time, setTime] = useState("12:00 PM");
  const [amount, setAmount] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [date, setDate] = useState(new Date()); // For DateTimePicker
  const fadeAnim = useState(new Animated.Value(0))[0];

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
        setSelectedPet(data[0]);
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
      const formattedSchedules = data.map((schedule) => ({
        ...schedule,
        time: convertTo12Hour(schedule.time),
      }));
      setSchedules(formattedSchedules);
    }
  };

  const handleAddSchedule = async () => {
    if (!time || !amount || Number(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid time and amount (greater than 0)");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const time24Hour = convertTo24Hour(time);
    const { error } = await supabase.from("schedules").insert({
      user_id: user.id,
      pet_id: selectedPet.id,
      time: time24Hour,
      amount_g: Number(amount),
      is_active: true,
    });
    if (error) {
      Alert.alert("Error", "Failed to add schedule");
    } else {
      Alert.alert("Success", "Schedule added successfully!");
      resetForm();
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

  const resetForm = () => {
    setTime("12:00 PM");
    setDate(new Date());
    setAmount("");
  };

  const openTimePicker = () => {
    // Initialize DateTimePicker with current time or selected time
    if (time !== "12:00 PM") {
      const [hourMinute, period] = time.split(" ");
      const [hour, minute] = hourMinute.split(":");
      let hourNum = parseInt(hour, 10);
      if (period === "PM" && hourNum !== 12) hourNum += 12;
      if (period === "AM" && hourNum === 12) hourNum = 0;
      const newDate = new Date();
      newDate.setHours(hourNum);
      newDate.setMinutes(parseInt(minute, 10));
      setDate(newDate);
    }
    setShowTimePicker(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const onTimeChange = (event, selectedDate) => {
    if (event.type === "dismissed") {
      closeTimePicker();
      return;
    }
    const currentDate = selectedDate || date;
    setDate(currentDate);
    const hour = currentDate.getHours();
    const minute = currentDate.getMinutes();
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    setTime(`${hour12.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} ${period}`);
    closeTimePicker();
  };

  const closeTimePicker = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowTimePicker(false));
  };

  const convertTo12Hour = (time24) => {
    const [hour, minute] = time24.split(":");
    const hourNum = parseInt(hour, 10);
    const period = hourNum >= 12 ? "PM" : "AM";
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${hour12.toString().padStart(2, "0")}:${minute} ${period}`;
  };

  const convertTo24Hour = (time12) => {
    const [hourMinute, period] = time12.split(" ");
    const [hour, minute] = hourMinute.split(":");
    let hourNum = parseInt(hour, 10);
    if (period === "PM" && hourNum !== 12) hourNum += 12;
    if (period === "AM" && hourNum === 12) hourNum = 0;
    return `${hourNum.toString().padStart(2, "0")}:${minute}`;
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
              }
              style={styles.picker}
              onValueChange={(itemValue) => {
                const pet = pets.find((p) => p.id.toString() === itemValue);
                setSelectedPet(pet);
              }}
            >
              {pets.map((pet) => (
                <Picker.Item
                  key={pet.id}
                  label={pet.name}
                  value={pet.id.toString()}
                />
              ))}
            </Picker>
            {selectedPet && (
              <>
                <Text style={styles.cardTitle}>
                  {selectedPet.name}'s Schedule
                </Text>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Time</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={openTimePicker}
                  >
                    <Text style={styles.timeButtonText}>{time}</Text>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color="#4CAF50"
                      style={styles.timeIcon}
                    />
                  </TouchableOpacity>
                </View>
                {showTimePicker && (
                  <Modal
                    visible={showTimePicker}
                    transparent={true}
                    animationType="none"
                    onRequestClose={closeTimePicker}
                  >
                    <View style={styles.modalOverlay}>
                      <Animated.View
                        style={[styles.modalContent, { opacity: fadeAnim }]}
                      >
                        <Text style={styles.modalTitle}>Set Feeding Time</Text>
                        <DateTimePicker
                          value={date}
                          mode="time"
                          is24Hour={false}
                          display={Platform.OS === "ios" ? "spinner" : "default"}
                          onChange={onTimeChange}
                          textColor="#333"
                          style={styles.dateTimePicker}
                        />
                        {Platform.OS === "ios" && (
                          <View style={styles.buttonRow}>
                            <TouchableOpacity
                              style={styles.cancelButton}
                              onPress={closeTimePicker}
                            >
                              <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.confirmButton}
                              onPress={() => onTimeChange({ type: "set" }, date)}
                            >
                              <Text style={styles.confirmButtonText}>Confirm</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </Animated.View>
                    </View>
                  </Modal>
                )}
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
  timeButton: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
    width: 140,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  timeButtonText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  timeIcon: {
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    width: 320,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  dateTimePicker: {
    width: 200,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: "#d32f2f",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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