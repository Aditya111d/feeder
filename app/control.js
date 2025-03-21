import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Picker } from "@react-native-picker/picker";
import usePullToRefresh from "../hooks/usePullToRefresh";

export default function ControlScreen() {
  const { user } = useAuth();
  const [feeds, setFeeds] = useState([]);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [subscription, setSubscription] = useState(null);

  // Fetch pets
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
        console.log("Setting initial selectedPet:", data[0].id.toString());
        setSelectedPet(data[0].id.toString());
      }
    }
  };

  // Fetch feeds
  const fetchFeeds = async () => {
    if (!selectedPet) {
      console.log("No selectedPet, skipping fetchFeeds");
      return;
    }
    console.log("Fetching feeds for pet:", selectedPet);
    const { data, error } = await supabase
      .from("feeds")
      .select("*")
      .eq("user_id", user.id)
      .eq("pet_id", selectedPet)
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

  // Use the pull-to-refresh hook
  const { refreshControl } = usePullToRefresh(async () => {
    console.log("Starting pull-to-refresh...");
    // Unsubscribe from real-time updates during refresh
    if (subscription) {
      console.log("Unsubscribing from real-time updates...");
      subscription.unsubscribe();
      setSubscription(null);
    }

    // Fetch data
    await fetchPets();
    await fetchFeeds();

    // Re-subscribe to real-time updates after refresh
    if (selectedPet) {
      console.log("Re-subscribing to real-time updates for pet:", selectedPet);
      const newSubscription = supabase
        .channel(`feeds-${selectedPet}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "feeds",
            filter: `user_id=eq.${user.id},pet_id=eq.${selectedPet}`,
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

  // Initial fetch on mount
  useEffect(() => {
    if (!user) return;
    fetchPets();
  }, [user]);

  // Fetch feeds and manage real-time subscription when selectedPet changes
  useEffect(() => {
    if (!user || !selectedPet) return;

    fetchFeeds();

    // Clean up previous subscription if it exists
    if (subscription) {
      console.log("Cleaning up previous subscription...");
      subscription.unsubscribe();
    }

    // Set up real-time subscription
    console.log("Setting up real-time subscription for pet:", selectedPet);
    const newSubscription = supabase
      .channel(`feeds-${selectedPet}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "feeds",
          filter: `user_id=eq.${user.id},pet_id=eq.${selectedPet}`,
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
          Feed at {formattedTime} - Status: {item.status} - Amount: {item.amount_g || "N/A"}{" "}
          {item.amount_g ? "grams" : ""}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Feed History</Text>
      <View style={styles.pickerContainer}>
        <Text style={styles.subtitle}>Select Pet:</Text>
        <Picker
          selectedValue={selectedPet}
          style={styles.picker}
          onValueChange={(itemValue) => {
            console.log("Selected pet changed to:", itemValue);
            setSelectedPet(itemValue);
          }}
        >
          {pets.length === 0 ? (
            <Picker.Item label="No pets available" value="" />
          ) : (
            pets.map((pet) => (
              <Picker.Item
                key={pet.id}
                label={pet.name}
                value={pet.id.toString()}
              />
            ))
          )}
        </Picker>
      </View>
      <Text style={styles.historyTitle}>
        Recent Feeds for{" "}
        {pets.find((p) => p.id.toString() === selectedPet)?.name || "Selected Pet"}
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
  picker: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 2,
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