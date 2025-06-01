import { useAuth } from "@/lib/auth-context";
import { StyleSheet, View } from "react-native";
import { Button, Surface, Text } from "react-native-paper";
import { RealtimeResponse, client, collectionId, completionsId, databaseId, databases } from "@/lib/appwrite";
import { ID, Query } from "react-native-appwrite";
import { useEffect, useRef, useState, useCallback } from "react";
import { Habit, HabitCompletion } from "@/types/database.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

export default function Index() {
  const { signOut, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<string[]>([]);
  const swipeableRefs = useRef<{[key: string]: Swipeable | null}>({});

  // Memoized fetch functions
  const fetchHabits = useCallback(async () => {
    if (!user) return;
    try {
      const response = await databases.listDocuments(databaseId, collectionId, [
        Query.equal('user_id', user.$id)
      ]);
      setHabits(response.documents as Habit[]);
    } catch (error) {
      console.error("Failed to fetch habits:", error);
    }
  }, [user]);

  const fetchTodayHabits = useCallback(async () => {
    if (!user) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const response = await databases.listDocuments(databaseId, completionsId, [
        Query.equal('user_id', user.$id), 
        Query.greaterThanEqual('completed_at', today.toISOString())
      ]);
      const completions = response.documents as HabitCompletion[];
      setCompletedHabits(completions.map(c => c.habit_id));
    } catch (error) {
      console.error("Failed to fetch today's habits:", error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    // Real-time subscriptions with proper channel names
    const habitsChannel = `databases.${databaseId}.collections.${collectionId}.documents`;
    const completionsChannel = `databases.${databaseId}.collections.${completionsId}.documents`;

    const habitsSubscription = client.subscribe(habitsChannel, (response) => {
      if (response.events.some(e => 
        e.includes('create') || 
        e.includes('update') || 
        e.includes('delete')
      )) {
        fetchHabits();
      }
    });

    const completionsSubscription = client.subscribe(completionsChannel, (response) => {
      if (response.events.some(e => e.includes('create'))) {
        fetchTodayHabits();
      }
    });

    // Initial data fetch
    fetchHabits();
    fetchTodayHabits();

    // Cleanup subscriptions
    return () => {
      habitsSubscription();
      completionsSubscription();
    };
  }, [user, fetchHabits, fetchTodayHabits]);

  const handleDelete = async (id: string) => {
    try {
      await databases.deleteDocument(databaseId, collectionId, id);
    } catch (error) {
      console.error("Failed to delete habit:", error);
    }
  };

  const handleCompletion = async (id: string) => {
    if (!user || completedHabits.includes(id)) return;
    
    try {
      const currentDate = new Date().toISOString();
      await databases.createDocument(
        databaseId, 
        completionsId, 
        ID.unique(), 
        {
          habit_id: id,
          user_id: user.$id,
          completed_at: currentDate,
        }
      );
      
      const habit = habits.find(h => h.$id === id);
      if (!habit) return;

      await databases.updateDocument(databaseId, collectionId, id, {
        streak_count: habit.streak_count + 1,
        last_completed: currentDate,
      });
    } catch (error) {
      console.error("Failed to complete habit:", error);
    }
  };

  const isHabitCompleted = (habitId: string) => {
    return completedHabits.includes(habitId);
  };

  const renderLeftActions = () => (
    <View style={styles.leftActions}>
      <MaterialCommunityIcons name="trash-can-outline" size={32} color="white" />
    </View>
  );

  const renderRightActions = (habitId: string) => (
    <View style={styles.rightActions}>
      {isHabitCompleted(habitId) ? (
        <Text variant="bodyLarge" style={{color: "white"}}>Completed</Text>
      ) : (
        <MaterialCommunityIcons name="check-circle-outline" size={32} color="white" />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>Today's Habits</Text>
        <Button 
          textColor="#0066CC" 
          mode="text" 
          onPress={signOut} 
          icon="logout"
        >
          Sign Out
        </Button>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {habits.length === 0 ? (
          <View style={styles.noHabits}>
            <Text variant="bodyLarge">No habits found</Text>
          </View>
        ) : (
          <View>
          {habits?.map((habit, key) => (
            <Swipeable ref= {(ref) =>{
              swipeableRefs.current[habit.$id] = ref
            }}
            key={key}
            overshootLeft={false}
            overshootRight={false}
            renderLeftActions={renderLeftActions}
            renderRightActions={()=>renderRightActions(habit.$id)}
            onSwipeableOpen={(direction) => {
              if (direction === "left") {
                handleDelete(habit.$id);
              } else if (direction === "right") {
                handleCompletion(habit.$id);
              }

              swipeableRefs.current[habit.$id]?.close();
              }
            }
              >
                <Surface style={[
                  styles.card, 
                  isHabitCompleted(habit.$id) && styles.completed
                ]} elevation={0}>
                  <View style={styles.habt}>
                    <Text variant="bodyLarge" style={styles.habitTitle}>
                      {habit.title}
                    </Text>
                    <Text variant="bodyLarge" style={styles.habitDescription}>
                      {habit.description}
                    </Text>
                    <View style={styles.habitInfo}>
                      <View style={styles.streakBadge}>
                        <MaterialCommunityIcons name="fire" size={18} color="#ff9800"/>
                        <Text variant="bodyLarge" style={styles.streakCount}>
                          {habit.streak_count} day streak
                        </Text>                
                      </View>
                      <View style={styles.frequencyBadge}>
                        <Text variant="bodyLarge" style={styles.frequencyCount}>
                          {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}
                        </Text>                
                      </View>
                    </View>
                  </View>
                </Surface>
              </Swipeable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontWeight: "bold",
    color: "#2D2D31",
  },
  noHabits: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1
  },
  card: {
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    
  },
  completed: {
   opacity: 0.5,
  },
  habt: {
    padding: 20,
  },
  habitTitle: {
    fontWeight: "bold",
    fontSize: 20,
    color: "#2D2D31",
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 15,
    color: "#666",
    marginBottom: 20,
  },
  habitInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    borderRadius:12,
    paddingHorizontal: 10,
    paddingVertical: 4,

  },
  streakCount: {
    marginLeft: 6,
    color: "#ff9800",
    fontWeight: "bold",
    fontSize: 14,

  },
  frequencyBadge: {
    backgroundColor: "#E3F2FD",
    borderRadius:12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  frequencyCount: {
    color: "#5C6BC0", 
    fontWeight: "bold",
    fontSize: 14,
  },
  rightActions: {
    alignItems: "flex-end",
    justifyContent: "center",
    backgroundColor: "#4caf50",
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    flex: 1,
    padding: 20,
  },
  leftActions: {
    alignItems: "flex-start",
    justifyContent: "center",
    backgroundColor: "#e53935",
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    flex: 1,
    padding: 20,
  },
});