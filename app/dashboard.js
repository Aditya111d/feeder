// import React, { useContext, useState, useEffect } from "react";
// import {
//   StyleSheet,
//   View,
//   Text,
//   TouchableOpacity,
//   Alert,
//   TextInput,
//   ActivityIndicator,
//   ScrollView,
//   RefreshControl,
// } from "react-native";
// import { router, useNavigation } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { AuthContext } from "../context/AuthContext";
// import { supabase } from "../lib/supabase";
// import { Picker } from "@react-native-picker/picker";

// export default function DashboardScreen() {
//   const { user, loading } = useContext(AuthContext);
//   const navigation = useNavigation();
//   const [pets, setPets] = useState([]);
//   const [selectedPet, setSelectedPet] = useState(null);
//   const [lastFeeding, setLastFeeding] = useState(null);
//   const [todaysTotal, setTodaysTotal] = useState(0);
//   const [amount, setAmount] = useState(10);
//   const [isFeeding, setIsFeeding] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);

//   // Function to fetch pets
//   const fetchPets = async () => {
//     const { data, error } = await supabase
//       .from("pets")
//       .select("*")
//       .eq("user_id", user.id);
//     if (error) {
//       console.error("Error fetching pets:", error);
//       Alert.alert("Error", "Failed to load pets");
//     } else {
//       setPets(data);
//       if (data.length > 0 && !selectedPet) {
//         setSelectedPet(data[0]);
//       }
//     }
//   };

//   // Function to fetch feeding data
//   const fetchFeedingData = async () => {
//     if (!selectedPet) return;

//     const today = new Date().toISOString().split("T")[0];
//     const { data: feeds, error } = await supabase
//       .from("feeds")
//       .select("*")
//       .eq("pet_id", selectedPet.id)
//       .gte("timestamp", `${today}T00:00:00`)
//       .lte("timestamp", `${today}T23:59:59`)
//       .order("timestamp", { ascending: false });

//     if (error) {
//       console.error("Error fetching feeds:", error);
//       Alert.alert("Error", "Failed to load feeding data");
//     } else {
//       if (feeds.length > 0) {
//         setLastFeeding(feeds[0].timestamp);
//         const total = feeds.reduce((sum, feed) => sum + feed.amount_g, 0);
//         setTodaysTotal(total);
//       } else {
//         setLastFeeding(null);
//         setTodaysTotal(0);
//       }
//     }
//   };

//   // Initial fetch on mount
//   useEffect(() => {
//     if (!user) return;
//     fetchPets();
//   }, [user]);

//   useEffect(() => {
//     fetchFeedingData();
//   }, [selectedPet]);

//   // Pull-to-refresh handler
//   const onRefresh = async () => {
//     setRefreshing(true);
//     try {
//       await fetchPets();
//       await fetchFeedingData();
//     } catch (error) {
//       Alert.alert("Error", "Failed to refresh data");
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   const handleFeed = async () => {
//     if (!selectedPet) {
//       Alert.alert("Error", "Please add a pet first.");
//       return;
//     }
//     if (!amount || amount <= 0) {
//       Alert.alert("Error", "Please enter a valid amount greater than 0.");
//       return;
//     }

//     setIsFeeding(true);
//     try {
//       const { error } = await supabase.from("feeds").insert({
//         user_id: user.id,
//         pet_id: selectedPet.id,
//         amount_g: amount,
//         status: "pending",
//       });
//       if (error) {
//         Alert.alert("Error", "Failed to trigger feed: " + error.message);
//       } else {
//         Alert.alert("Success", "Feed triggered!");
//         setAmount(10);
//         await fetchFeedingData();
//       }
//     } catch (error) {
//       Alert.alert("Error", "An unexpected error occurred.");
//     } finally {
//       setIsFeeding(false);
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <Text>Loading...</Text>
//       </View>
//     );
//   }

//   if (!user) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.title}>Pet Feeder</Text>
//         <Text style={styles.subtitle}>Please log in to continue.</Text>
//         <TouchableOpacity
//           style={styles.button}
//           onPress={() => router.replace("/login")}
//         >
//           <Ionicons
//             name="log-in-outline"
//             size={24}
//             color="#fff"
//             style={styles.icon}
//           />
//           <Text style={styles.buttonText}>Login</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={styles.button}
//           onPress={() => router.replace("/signup")}
//         >
//           <Ionicons
//             name="person-add-outline"
//             size={24}
//             color="#fff"
//             style={styles.icon}
//           />
//           <Text style={styles.buttonText}>Sign Up</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <ScrollView
//       style={styles.container}
//       refreshControl={
//         <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//       }
//     >
//       <Text style={styles.welcomeText}>Welcome {user.email.split("@")[0]}</Text>
//       {pets.length > 0 ? (
//         <>
//           <View style={styles.petSelector}>
//             <Text style={styles.inputLabel}>Select Pet</Text>
//             <Picker
//               selectedValue={
//                 selectedPet ? selectedPet.id.toString() : undefined
//               } // Convert to string
//               style={styles.picker}
//               onValueChange={(itemValue) => {
//                 const newSelectedPet = pets.find(
//                   (p) => p.id.toString() === itemValue
//                 ); // Match as string
//                 setSelectedPet(newSelectedPet);
//               }}
//             >
//               {pets.map((pet) => (
//                 <Picker.Item
//                   key={pet.id}
//                   label={pet.name}
//                   value={pet.id.toString()}
//                 /> // Convert to string
//               ))}
//             </Picker>
//           </View>
//           {selectedPet && (
//             <>
//               <View style={styles.statusCard}>
//                 <Text style={styles.cardTitle}>
//                   {selectedPet.name}'s Status
//                 </Text>
//                 <View style={styles.statusItem}>
//                   <Ionicons
//                     name="time-outline"
//                     size={24}
//                     color="#666"
//                     style={styles.statusIcon}
//                   />
//                   <Text style={styles.statusText}>
//                     Last Feeding:{" "}
//                     {lastFeeding
//                       ? (() => {
//                           const feedDate = new Date(lastFeeding);
//                           const localDate = new Date(
//                             feedDate.getTime() -
//                               feedDate.getTimezoneOffset() * 60 * 1000
//                           );
//                           return localDate.toLocaleString("en-US", {
//                             year: "numeric",
//                             month: "2-digit",
//                             day: "2-digit",
//                             hour: "2-digit",
//                             minute: "2-digit",
//                             second: "2-digit",
//                             hour12: true,
//                           });
//                         })()
//                       : "No feedings recorded"}
//                   </Text>
//                 </View>
//                 <View style={styles.statusItem}>
//                   <Ionicons
//                     name="scale-outline"
//                     size={24}
//                     color="#666"
//                     style={styles.statusIcon}
//                   />
//                   <Text style={styles.statusText}>
//                     Today's Total: {todaysTotal}g
//                   </Text>
//                 </View>
//               </View>
//               <View style={styles.feedCard}>
//                 <Text style={styles.cardTitle}>Manual Feed</Text>
//                 <View style={styles.feedInputContainer}>
//                   <Text style={styles.inputLabel}>Amount (g)</Text>
//                   <TextInput
//                     style={styles.input}
//                     value={amount.toString()}
//                     onChangeText={(text) => setAmount(Number(text) || 0)}
//                     keyboardType="numeric"
//                   />
//                   <TouchableOpacity
//                     style={styles.feedButton}
//                     onPress={handleFeed}
//                     disabled={isFeeding}
//                   >
//                     {isFeeding ? (
//                       <ActivityIndicator color="#fff" />
//                     ) : (
//                       <>
//                         <Ionicons
//                           name="play-circle-outline"
//                           size={24}
//                           color="#fff"
//                           style={styles.icon}
//                         />
//                         <Text style={styles.buttonText}>Feed Now</Text>
//                       </>
//                     )}
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             </>
//           )}
//         </>
//       ) : (
//         <Text style={styles.noPetText}>
//           No pets added. Go to "Pets" to add one!
//         </Text>
//       )}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f5f5f5",
//     padding: 20,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#333",
//     marginLeft: 10,
//   },
//   welcomeText: {
//     fontSize: 22,
//     fontWeight: "bold",
//     color: "#333",
//     marginBottom: 20,
//   },
//   petSelector: {
//     marginBottom: 20,
//   },
//   inputLabel: {
//     fontSize: 16,
//     color: "#333",
//     marginBottom: 5,
//   },
//   picker: {
//     width: "100%",
//     backgroundColor: "#fff",
//     borderRadius: 5,
//     elevation: 2,
//   },
//   statusCard: {
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     padding: 20,
//     marginBottom: 20,
//     elevation: 3,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//   },
//   cardTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#333",
//     marginBottom: 10,
//   },
//   statusItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginVertical: 5,
//   },
//   statusIcon: {
//     marginRight: 10,
//   },
//   statusText: {
//     fontSize: 16,
//     color: "#666",
//   },
//   feedCard: {
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     padding: 20,
//     elevation: 3,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//   },
//   feedInputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: 10,
//   },
//   input: {
//     backgroundColor: "#f0f0f0",
//     borderRadius: 5,
//     padding: 10,
//     width: 80,
//     textAlign: "center",
//     fontSize: 16,
//     color: "#333",
//   },
//   feedButton: {
//     flexDirection: "row",
//     backgroundColor: "#4CAF50",
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 25,
//     alignItems: "center",
//     elevation: 5,
//   },
//   quickFeedButton: {
//     backgroundColor: "#388E3C",
//     marginTop: 10,
//   },
//   buttonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   icon: {
//     marginRight: 10,
//   },
//   noPetText: {
//     fontSize: 16,
//     color: "#666",
//     textAlign: "center",
//     marginTop: 20,
//   },
// });

import React, { useContext, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { router, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Picker } from "@react-native-picker/picker";

export default function DashboardScreen() {
  const { user, loading } = useContext(AuthContext);
  const navigation = useNavigation();
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [lastFeeding, setLastFeeding] = useState(null);
  const [todaysTotal, setTodaysTotal] = useState(0);
  const [amount, setAmount] = useState(10);
  const [isFeeding, setIsFeeding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Function to fetch pets
  const fetchPets = async () => {
    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .eq("user_id", user.id);
    if (error) {
      console.error("Error fetching pets:", error);
      Alert.alert("Error", "Failed to load pets");
    } else {
      setPets(data);
      if (data.length > 0 && !selectedPet) {
        setSelectedPet(data[0]);
      }
    }
  };

  // Function to fetch feeding data
  const fetchFeedingData = async () => {
    if (!selectedPet) return;

    const today = new Date().toISOString().split("T")[0];
    const { data: feeds, error } = await supabase
      .from("feeds")
      .select("*")
      .eq("pet_id", selectedPet.id)
      .gte("timestamp", `${today}T00:00:00`)
      .lte("timestamp", `${today}T23:59:59`)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching feeds:", error);
      Alert.alert("Error", "Failed to load feeding data");
    } else {
      if (feeds.length > 0) {
        setLastFeeding(feeds[0].timestamp);
        const total = feeds.reduce((sum, feed) => sum + feed.amount_g, 0);
        setTodaysTotal(total);
      } else {
        setLastFeeding(null);
        setTodaysTotal(0);
      }
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    if (!user) return;
    fetchPets();
  }, [user]);

  useEffect(() => {
    fetchFeedingData();
  }, [selectedPet]);

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPets();
      await fetchFeedingData();
    } catch (error) {
      Alert.alert("Error", "Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleFeed = async () => {
    if (!selectedPet) {
      Alert.alert("Error", "Please add a pet first.");
      return;
    }
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount greater than 0.");
      return;
    }

    setIsFeeding(true);
    try {
      const { error } = await supabase.from("feeds").insert({
        user_id: user.id,
        pet_id: selectedPet.id,
        amount_g: amount,
        status: "pending",
      });
      if (error) {
        Alert.alert("Error", "Failed to trigger feed: " + error.message);
      } else {
        Alert.alert("Success", "Feed triggered!");
        setAmount(10);
        await fetchFeedingData();
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setIsFeeding(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Pet Feeder</Text>
        <Text style={styles.subtitle}>Please log in to continue.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/login")}
        >
          <Ionicons
            name="log-in-outline"
            size={24}
            color="#fff"
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/signup")}
        >
          <Ionicons
            name="person-add-outline"
            size={24}
            color="#fff"
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.welcomeText}>
        Welcome{" "}
        {user.email.split("@")[0].charAt(0).toUpperCase() +
          user.email.split("@")[0].slice(1).toLowerCase()}
      </Text>
      {pets.length > 0 ? (
        <>
          <View style={styles.petSelector}>
            <Text style={styles.inputLabel}>Select Pet</Text>
            <Picker
              selectedValue={
                selectedPet ? selectedPet.id.toString() : undefined
              }
              style={styles.picker}
              onValueChange={(itemValue) => {
                const newSelectedPet = pets.find(
                  (p) => p.id.toString() === itemValue
                );
                setSelectedPet(newSelectedPet);
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
          </View>
          {selectedPet && (
            <>
              <View style={styles.statusCard}>
                <Text style={styles.cardTitle}>
                  {selectedPet.name}'s Status
                </Text>
                <View style={styles.statusItem}>
                  <Ionicons
                    name="time-outline"
                    size={24}
                    color="#666"
                    style={styles.statusIcon}
                  />
                  <Text style={styles.statusText}>
                    Last Feeding:{" "}
                    {lastFeeding
                      ? (() => {
                          const feedDate = new Date(lastFeeding);
                          const localDate = new Date(
                            feedDate.getTime() -
                              feedDate.getTimezoneOffset() * 60 * 1000
                          );
                          return localDate.toLocaleString("en-US", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          });
                        })()
                      : "No feedings recorded"}
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <Ionicons
                    name="scale-outline"
                    size={24}
                    color="#666"
                    style={styles.statusIcon}
                  />
                  <Text style={styles.statusText}>
                    Today's Total: {todaysTotal}g
                  </Text>
                </View>
              </View>
              <View style={styles.feedCard}>
                <Text style={styles.cardTitle}>Manual Feed</Text>
                <View style={styles.feedInputContainer}>
                  <Text style={styles.inputLabel}>Amount (g)</Text>
                  <TextInput
                    style={styles.input}
                    value={amount.toString()}
                    onChangeText={(text) => setAmount(Number(text) || 0)}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={styles.feedButton}
                    onPress={handleFeed}
                    disabled={isFeeding}
                  >
                    {isFeeding ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name="play-circle-outline"
                          size={24}
                          color="#fff"
                          style={styles.icon}
                        />
                        <Text style={styles.buttonText}>Feed Now</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </>
      ) : (
        <Text style={styles.noPetText}>
          No pets added. Go to "Pets" to add one!
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  petSelector: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  picker: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 5,
    elevation: 2,
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  statusIcon: {
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    color: "#666",
  },
  feedCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  feedInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    padding: 10,
    width: 80,
    textAlign: "center",
    fontSize: 16,
    color: "#333",
  },
  feedButton: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    elevation: 5,
  },
  quickFeedButton: {
    backgroundColor: "#388E3C",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  icon: {
    marginRight: 10,
  },
  noPetText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
});
