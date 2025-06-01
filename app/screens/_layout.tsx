import {MaterialCommunityIcons} from '@expo/vector-icons';
import { Tabs } from "expo-router";
import {useTheme} from "react-native-paper"


export default function ScreenLayout() {

  const theme = useTheme(); 


  return (
  <Tabs screenOptions= {{ 
    headerStyle: { backgroundColor: "#f5f5f5" },
    headerShadowVisible: false,
    tabBarStyle: { backgroundColor: "#f5f5f5",
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
    tabBarActiveTintColor: "#0066CC",
    tabBarInactiveTintColor: '666666'}}>

    <Tabs.Screen name="index" 
    options={{ title: "Today's Habits", 

    headerTitleAlign: 'center', 

    tabBarIcon: ({color, size}) => 
    <MaterialCommunityIcons name="calendar-today" 
    size={size} color={color} /> }} />
  
   <Tabs.Screen name="streaks" 
    options={{ title: "Streaks", 
    headerTitleAlign: 'center', 
    tabBarIcon: ({color, size}) => 
    <MaterialCommunityIcons name="chart-line" 
    size={size} color={color} /> }} />
    
    <Tabs.Screen name="add-habit" 
    options={{ title: "Add Habit", 
    headerTitleAlign: 'center', 
    tabBarIcon: ({color, size}) => 
    <MaterialCommunityIcons name="plus-circle" 
    size={size} color={color} /> }} />

  </Tabs>
  );
}
