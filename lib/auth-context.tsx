import { createContext, useState, useEffect, useContext } from "react";
import { Models } from "react-native-appwrite";
import { account } from "./appwrite";
import { ID } from "react-native-appwrite";
import { useRouter } from "expo-router";

type AuthContextType = {
    user: Models.User<Models.Preferences> | null;
    signUp: (email: string, password: string) => Promise<string | null>;
    signIn: (email: string, password: string) => Promise<string | null>;
    signOut: () => Promise<void>;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Check current session on app start
    useEffect(() => {
        const checkSession = async () => {
            try {
                const currentUser = await account.get();
                setUser(currentUser);
            } catch (error) {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, []);

    const signUp = async (email: string, password: string) => {
        try {
            await account.create(ID.unique(), email, password);
            return await signIn(email, password);
        } catch (error: any) {
            return error.message || "Something went wrong during signup";
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            await account.createEmailPasswordSession(email, password);
            const currentUser = await account.get();
            setUser(currentUser);
            return null;
        } catch (error: any) {
            return error.message || "Something went wrong during login";
        }
    };

    const signOut = async () => {
        try {
            await account.deleteSession('current');
            setUser(null);
            router.replace('./auth');
          } catch (error: any) {
            console.error('Error signing out:', error.message);
            // Fallback to clearing local state even if server logout fails
            setUser(null);
            router.replace('./auth');
          }
        };

    return (
        <AuthContext.Provider value={{ user, signUp, signIn, signOut, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}