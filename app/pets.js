// app/pets.js
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { Picker } from "@react-native-picker/picker"; // Updated import

export default function PetsScreen() {
  const [pets, setPets] = useState([]);
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState("Dog");
  const [weight, setWeight] = useState("");

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
    }
  };

  const handleAddPet = async () => {
    if (!petName || !weight) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("pets").insert({
      user_id: user.id,
      name: petName,
      pet_type: petType,
      weight_kg: Number(weight),
    });
    if (error) {
      Alert.alert("Error", "Failed to add pet");
    } else {
      Alert.alert("Success", "Pet added successfully!");
      setPetName("");
      setPetType("Dog");
      setWeight("");
      fetchPets();
    }
  };

  const handleDeletePet = async (petId) => {
    const { error } = await supabase.from("pets").delete().eq("id", petId);
    if (error) {
      Alert.alert("Error", "Failed to delete pet");
    } else {
      fetchPets();
    }
  };

  const renderPetItem = ({ item }) => (
    <View style={styles.petItem}>
      <Ionicons
        name="paw-outline"
        size={24}
        color="#666"
        style={styles.petIcon}
      />
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{item.name}</Text>
        <Text style={styles.petDetail}>Weight: {item.weight_kg}kg</Text>
      </View>
      <TouchableOpacity onPress={() => handleDeletePet(item.id)}>
        <Ionicons name="trash-outline" size={24} color="#d32f2f" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Pets</Text>
      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Add New Pet</Text>
        <TextInput
          style={styles.input}
          placeholder="Pet Name"
          value={petName}
          onChangeText={setPetName}
        />
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Pet Type</Text>
          <Picker
            selectedValue={petType}
            style={styles.picker}
            onValueChange={(itemValue) => setPetType(itemValue)}
          >
            <Picker.Item label="Dog" value="Dog" />
            <Picker.Item label="Cat" value="Cat" />
            <Picker.Item label="Bird" value="Bird" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Weight (kg)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddPet}>
          <Text style={styles.buttonText}>Add Pet</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={pets}
        renderItem={renderPetItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.petList}
      />
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
  input: {
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    color: "#333",
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
  picker: {
    width: 150,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
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
  petList: {
    flex: 1,
  },
  petItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  petIcon: {
    marginRight: 10,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  petDetail: {
    fontSize: 14,
    color: "#666",
  },
});
