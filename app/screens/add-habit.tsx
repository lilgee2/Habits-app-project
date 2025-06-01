import { StyleSheet, Text, View } from "react-native";
import { Button, SegmentedButtons, TextInput, useTheme } from "react-native-paper";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { collectionId, databaseId, databases } from "@/lib/appwrite";
import { ID } from "react-native-appwrite";
import { router } from "expo-router";

const FREQUENCIES = ["Daily", "Weekly", "Monthly"];
type Frequency = (typeof FREQUENCIES)[number];

export default function AddHabitScreen() {
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [frequency, setFrequency] = useState<Frequency>('Daily'); 
    const {user} = useAuth();
    const [error, setError] = useState<string >("");
    const theme = useTheme(); 
    
    const handleSubmit =async ()  => {
        if (!user) return;
        try {
            await databases.createDocument(
                databaseId, 
                collectionId,
                 ID.unique(),
                 {
                     user_id: user.$id,
                     title,
                     description,
                     frequency,
                     streak_count: 0,
                     last_completed: new Date().toISOString(),
                     created_at: new Date().toISOString(),
                 });
            

            setTitle('');
            setDescription('');
            setFrequency('Daily');
            setError(''); 
            
            router.back();
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
                return
            }
            setError("Something went wrong");
        }
    }

    return (
        <View style={styles.container}>
          <TextInput 
            label="Title"
            value={title}
            mode="outlined" 
            onChangeText={setTitle}
            style={styles.input} 
            textColor="black"
            activeOutlineColor="#0066CC"
          />
          <TextInput 
            label="Description"
            value={description}
            mode="outlined" 
            onChangeText={setDescription}
            style={styles.input}
            textColor="black"
            activeOutlineColor="#0066CC"
          />
          <View style={styles.frequencyContainer}>
          <SegmentedButtons 
          value={frequency}
          onValueChange={(value) => setFrequency(value as Frequency)}
          buttons={FREQUENCIES.map((freq) => 
          ({ value: freq,
            label: freq.charAt(0).toUpperCase() + freq.slice(1),
          }))} />
           </View>
           <Button 
             mode="contained" 
             onPress={handleSubmit} 
             disabled={!title || !description || !frequency} 
             textColor="white" 
             style={styles.button}
           >
            Add Habit
           </Button>
           {error && <Text style={{color: theme.colors.error}}>{error}</Text>}
        </View>
      );
}


const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: "#f5f5f5",
    },
    input: {
      marginBottom: 16,
      backgroundColor: '#f5f5f5',
    },
    frequencyContainer: {
     marginBottom: 24,
    },
    button: {
      backgroundColor: "#0066CC",
    },


});