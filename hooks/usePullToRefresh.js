// src/hooks/usePullToRefresh.js
import { useState, useCallback } from "react";
import { RefreshControl, Alert } from "react-native";

const usePullToRefresh = (refreshCallback) => {
  const [refreshing, setRefreshing] = useState(false);

  // Handle the pull-to-refresh action
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshCallback();
    } catch (error) {
      console.error("Pull-to-refresh error:", error);
      Alert.alert("Error", "Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  }, [refreshCallback]);

  // Return the RefreshControl component and refreshing state
  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#4CAF50"
      colors={["#4CAF50"]}
    />
  );

  return { refreshControl, refreshing, onRefresh };
};

export default usePullToRefresh;