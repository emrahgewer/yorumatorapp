"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
  type UserCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const credential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      return credential.user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Giriş hatası";
      setError(errorMessage);
      throw err;
    }
  };

  const registerUser = async (email: string, password: string) => {
    setError(null);
    try {
      const credential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      return credential.user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Kayıt hatası";
      setError(errorMessage);
      throw err;
    }
  };

  const logoutUser = async () => {
    setError(null);
    await signOut(auth).catch((err) => {
      setError(err.message);
      throw err;
    });
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      register: registerUser,
      logout: logoutUser,
    }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth sadece AuthProvider içinde kullanılabilir.");
  }
  return context;
}

