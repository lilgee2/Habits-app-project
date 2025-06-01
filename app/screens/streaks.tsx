import { RealtimeResponse, client, collectionId, completionsId, databaseId, databases } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Habit, HabitCompletion } from "@/types/database.type";
import { useEffect, useState, useCallback } from "react";
import { View } from "react-native";
import { Card, Text } from "react-native-paper";
import { Query } from "react-native-appwrite";
import { StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export default function StreaksScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<HabitCompletion[]>([]);
  const { user } = useAuth();

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

  const fetchAllHabits = useCallback(async () => {
    if (!user) return;
    try {
      const response = await databases.listDocuments(databaseId, completionsId, [
        Query.equal('user_id', user.$id), 
      ]);
      setCompletedHabits(response.documents as HabitCompletion[]);
    } catch (error) {
      console.error("Failed to fetch completions:", error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    

    const habitsChannel = `databases.${databaseId}.collections.${collectionId}.documents`;
    const habitsSubscription = client.subscribe(habitsChannel, 
      (response) => {
        if (
          response.events.some(e => e.includes('create')) ||
          response.events.some(e => e.includes('update')) ||
          response.events.some(e => e.includes('delete'))
        ) {
          fetchHabits();
        }
      }
    );

    const completionsChannel = `databases.${databaseId}.collections.${completionsId}.documents`;
    const completionsSubscription = client.subscribe(completionsChannel, 
      (response) => {
        if (response.events.some(e => e.includes('create'))) {
          fetchAllHabits();
        } 
      }
    );

    fetchHabits();
    fetchAllHabits();

    return () => {
      habitsSubscription();
      completionsSubscription();
    };
  }, [user, fetchHabits, fetchAllHabits]);

  interface StreakData {
    streak: number;
    bestStreak: number;
    total: number;
  }

  const getStreakData = (habitId: string): StreakData => {
   
    const habitCompletions = completedHabits
      .filter(c => c.habit_id === habitId)
      .map(c => {
        const date = new Date(c.completed_at);
       
        date.setHours(0, 0, 0, 0);
        return { ...c, date };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    if (habitCompletions.length === 0) {
      return { streak: 0, bestStreak: 0, total: 0 };
    }

    // Remove duplicate days
    const uniqueDays = Array.from(
      new Set(habitCompletions.map(c => c.date.toISOString().split('T')[0]))
    ).map(day => new Date(day));

    // Calculate streaks
    let currentStreak = 1;
    let bestStreak = 1;
    let prevDate = uniqueDays[0];
    
    for (let i = 1; i < uniqueDays.length; i++) {
      const currentDate = uniqueDays[i];
      const diffDays = Math.round(
        (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diffDays === 1) {
        currentStreak++;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
      
      prevDate = currentDate;
    }

    return {
      streak: currentStreak,
      bestStreak,
      total: uniqueDays.length
    };
  };

  const habitStreaks = habits.map((habit) => {
    const streakData = getStreakData(habit.$id);
    return { habit, ...streakData };
  });

  const rankedHabits = [...habitStreaks].sort((a, b) => b.bestStreak - a.bestStreak);
  const badgeStyle = [styles.badge1, styles.badge2, styles.badge3];

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>Habit Streaks</Text>
      
      {rankedHabits.length > 0 && (
        <View style={styles.rankingContainer}>
          <Text variant="bodyLarge" style={styles.subTitle}>🏅 Top Streak</Text>
          {rankedHabits.slice(0, 3).map((item, index) => (
            <View key={item.habit.$id} style={styles.rankingItem}>
              <View style={[styles.rankingBadge, badgeStyle[index]]}>
                <Text variant="bodyLarge" style={styles.rankingNumber}>
                  {index + 1}
                </Text>
              </View>
              <Text variant="bodyLarge" style={styles.rankingHabit}>
                {item.habit.title}
              </Text>
              <Text variant="bodyLarge" style={styles.rankingStreak}>
                {item.bestStreak}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      {habits.length === 0 ? (
        <View style={styles.noHabits}>
          <Text variant="bodyLarge">No habits found</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
          {rankedHabits.map(({ habit, streak, bestStreak, total }) => (
            <Card key={habit.$id} style={[styles.card, habit === rankedHabits[0]?.habit && styles.firstCard]}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.habitTitle}>
                  {habit.title}
                </Text>
                <Text variant="bodyLarge" style={styles.habitDescription}>
                  {habit.description}
                </Text>
                <View style={styles.habitStats}>
                  <View style={styles.streakBadge}>
                    <Text variant="bodyLarge" style={styles.statText}>🔥 {streak}</Text>
                    <Text variant="bodyLarge" style={styles.statlabel}>Current</Text>
                  </View>
                  <View style={styles.bestStreakBadge}>
                    <Text variant="bodyLarge" style={styles.statText}>🏆 {bestStreak}</Text>
                    <Text variant="bodyLarge" style={styles.statlabel}>Best</Text>
                  </View>
                  <View style={styles.totalBadge}>
                    <Text variant="bodyLarge" style={styles.statText}>✅ {total}</Text>
                    <Text variant="bodyLarge" style={styles.statlabel}>Total</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  title: {
    fontWeight: "bold",
    color: "#2D2D31",
    marginBottom: 20,
  },
  noHabits: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  firstCard: {
    borderWidth: 2,
    borderColor: '#7c4dff',
  },
  habitTitle: {
    fontSize: 18,
    color: "#2D2D31",
    fontWeight: 'bold',
    marginBottom: 4,
  },
  habitDescription: {
    color: '#6c6c80',
    marginBottom: 12,
  },
  habitStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  streakBadge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  bestStreakBadge: {
    backgroundColor: '#fffde7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  totalBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  statText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22223b',
  },
  statlabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontWeight: '500',
  },
  rankingContainer: {
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    padding: 16,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  rankingBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badge1: {backgroundColor: '#ffd700'},
  badge2: {backgroundColor: '#c0c0c0'},
  badge3: {backgroundColor: '#cd7f32'},
  rankingNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  rankingHabit: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  subTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7c4dff',
    marginBottom: 16,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  rankingStreak: {
    fontSize: 16,
    color: '#7c4dff',
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'right',
  },
});