import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import usePullToRefresh from "../hooks/usePullToRefresh";

export default function ControlScreen() {
  const { user } = useAuth();
  const [feeds, setFeeds] = useState([]);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [subscription, setSubscription] = useState(null);

  const fetchPets = async () => {
    console.log("Fetching pets...");
    const { data, error } = await supabase
      .from("pets")
      .select("id, name")
      .eq("user_id", user.id);
    if (error) {
      console.error("Error fetching pets:", error);
      throw new Error("Failed to load pets");
    } else {
      console.log("Fetched pets:", data);
      setPets(data);
      if (data.length > 0 && !selectedPet) {
        console.log("Setting initial selectedPet:", data[0]);
        setSelectedPet(data[0]);
      }
    }
  };

  const fetchFeeds = async () => {
    if (!selectedPet) {
      console.log("No selectedPet, skipping fetchFeeds");
      return;
    }
    console.log("Fetching feeds for pet:", selectedPet.id);
    const { data, error } = await supabase
      .from("feeds")
      .select("*")
      .eq("user_id", user.id)
      .eq("pet_id", selectedPet.id)
      .order("timestamp", { ascending: false })
      .limit(10);
    if (error) {
      console.error("Error fetching feeds:", error);
      throw new Error("Failed to load feeds");
    } else {
      console.log("Fetched feeds:", data);
      setFeeds(data);
    }
  };

  const { refreshControl } = usePullToRefresh(async () => {
    console.log("Starting pull-to-refresh...");
    if (subscription) {
      console.log("Unsubscribing from real-time updates...");
      subscription.unsubscribe();
      setSubscription(null);
    }

    await fetchPets();
    await fetchFeeds();

    if (selectedPet) {
      console.log(
        "Re-subscribing to real-time updates for pet:",
        selectedPet.id
      );
      const newSubscription = supabase
        .channel(`feeds-${selectedPet.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "feeds",
            filter: `user_id=eq.${user.id},pet_id=eq.${selectedPet.id}`,
          },
          (payload) => {
            console.log("Real-time update received:", payload);
            setFeeds((currentFeeds) =>
              [payload.new, ...currentFeeds].slice(0, 10)
            );
          }
        )
        .subscribe();
      setSubscription(newSubscription);
    }
    console.log("Pull-to-refresh completed.");
  });

  useEffect(() => {
    if (!user) return;
    fetchPets();
  }, [user]);

  useEffect(() => {
    if (!user || !selectedPet) return;

    fetchFeeds();

    if (subscription) {
      console.log("Cleaning up previous subscription...");
      subscription.unsubscribe();
    }

    console.log("Setting up real-time subscription for pet:", selectedPet.id);
    const newSubscription = supabase
      .channel(`feeds-${selectedPet.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "feeds",
          filter: `user_id=eq.${user.id},pet_id=eq.${selectedPet.id}`,
        },
        (payload) => {
          console.log("Real-time update received:", payload);
          setFeeds((currentFeeds) =>
            [payload.new, ...currentFeeds].slice(0, 10)
          );
        }
      )
      .subscribe();

    setSubscription(newSubscription);

    return () => {
      console.log("Unsubscribing from real-time updates on cleanup...");
      newSubscription.unsubscribe();
    };
  }, [user, selectedPet]);

  const renderFeedItem = ({ item }) => {
    const feedDate = new Date(item.timestamp);
    const localDate = new Date(
      feedDate.getTime() - feedDate.getTimezoneOffset() * 60 * 1000
    );
    const formattedTime = localDate.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    return (
      <View style={styles.feedItem}>
        <Text style={styles.feedText}>
          Feed at {formattedTime} - Status: {item.status} - Amount:{" "}
          {item.amount_g || "N/A"} {item.amount_g ? "grams" : ""}
        </Text>
      </View>
    );
  };

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
              {pets.map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    console.log("Selected pet changed to:", pet);
                    setSelectedPet(pet);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{pet.name}</Text>
                  {selectedPet?.id === pet.id && (
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
      <Text style={styles.title}>Feed History</Text>
      <View style={styles.pickerContainer}>
        <Text style={styles.subtitle}>Select Pet:</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowDropdown(true)}
        >
          <Text style={styles.dropdownButtonText}>
            {selectedPet ? selectedPet.name : "Select a pet"}
          </Text>
          <Ionicons
            name={showDropdown ? "chevron-up" : "chevron-down"}
            size={18}
            color="#666"
          />
        </TouchableOpacity>
        {renderDropdown()}
      </View>
      <Text style={styles.historyTitle}>
        Recent Feeds for {selectedPet?.name || "Selected Pet"}
      </Text>
      <FlatList
        data={feeds}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.feedList}
        ListEmptyComponent={
          <Text style={styles.feedText}>No feed history available</Text>
        }
        refreshControl={refreshControl}
        extraData={selectedPet}
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
