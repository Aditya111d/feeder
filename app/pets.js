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
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

const petTypes = ["Dog", "Cat", "Bird", "Other"];

export default function PetsScreen() {
  const [pets, setPets] = useState([]);
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState("Dog");
  const [weight, setWeight] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

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
        <Text style={styles.petDetail}>
          {item.pet_type} • {item.weight_kg}kg
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleDeletePet(item.id)}>
        <Ionicons name="trash-outline" size={24} color="#d32f2f" />
      </TouchableOpacity>
    </View>
  );

  const renderDropdown = () => {
    return (
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.dropdownOverlay}>
            <View style={styles.dropdownContainer}>
              {petTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setPetType(type);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{type}</Text>
                  {petType === type && (
                    <Ionicons name="checkmark" size={18} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Pets</Text>
      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Add New Pet</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter pet name"
            value={petName}
            onChangeText={setPetName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Type</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(true)}
          >
            <Text style={styles.dropdownButtonText}>{petType}</Text>
            <Ionicons
              name={showDropdown ? "chevron-up" : "chevron-down"}
              size={18}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter weight in kg"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddPet}>
          <Text style={styles.buttonText}>Add Pet</Text>
        </TouchableOpacity>
      </View>

      {renderDropdown()}

      <FlatList
        data={pets}
        renderItem={renderPetItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.petList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No pets added yet</Text>
        }
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
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dropdownButton: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 5,
    elevation: 5,
  },
  dropdownItem: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
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
    marginBottom: 3,
  },
  petDetail: {
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
});
