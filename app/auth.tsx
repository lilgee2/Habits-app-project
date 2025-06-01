import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView, TextInput } from "react-native-gesture-handler";
import {Button, useTheme} from "react-native-paper"

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>("");

  const theme = useTheme(); 
  const router = useRouter();

  const {signIn, signUp} = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }  

    setError(null);


      if (isSignUp) {
        const error = await signUp(email, password);
        if (error) {
          setError(error);
          return;
        }
      } else {
        const error = await signIn(email, password);
        if (error) {
          setError(error);
          return;
        }

        router.replace("/screens");
      }
    
  };
  const handleSwitchMode = () => {
    setIsSignUp((prev) => !prev);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Text style={styles.text}>{isSignUp ? "Ceate Account" : "Welcome Back"}</Text>
          <TextInput
            style={styles.textInput}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            onChangeText={setEmail}
          />
          
          <TextInput
            style={styles.textInput}
            autoCapitalize="none"
            secureTextEntry
            placeholder="Password"
            onChangeText={setPassword}
          /> 

          {error && <Text style={{color: theme.colors.error}}>{error}</Text>}

          <Button mode="contained" onPress={handleAuth} style={styles.buttontext}  textColor="white">
            {isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          <Button mode="text" textColor="#0066CC" onPress={handleSwitchMode}>{isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}</Button>

        </View>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  
},
text:{
  fontSize: 24,
  marginBottom: 16,
},
errortext: {
  right: 79,
},
textInput: {
  borderWidth: 1, 
  borderColor: '#ccc', 
  padding: 10, 
  width: '80%',
  marginVertical: 10
},
buttontext: {
  marginTop: 16,
  backgroundColor: '#0066CC',
}
});