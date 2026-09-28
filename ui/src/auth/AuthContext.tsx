import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as authApi from "../api/auth";
import { getStored, setStored } from "./storage";
import type { User } from "../api/auth";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  signin: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  signout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStored();
    if (!stored) {
      setLoading(false);
      return;
    }
    setToken(stored.token);
    setUser(stored.user);

    // Validate token in background — if it's expired/invalid, sign out.
    authApi
      .fetchMe(stored.token)
      .then((u) => {
        setUser(u);
        setStored({ token: stored.token, user: u });
      })
      .catch(() => {
        setStored(null);
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback((t: string, u: User) => {
    setStored({ token: t, user: u });
    setToken(t);
    setUser(u);
  }, []);

  const signin = useCallback(
    async (email: string, password: string) => {
      const r = await authApi.signin(email, password);
      persist(r.access_token, r.user);
    },
    [persist],
  );

  const signup = useCallback(
    async (email: string, name: string, password: string) => {
      const r = await authApi.signup(email, name, password);
      persist(r.access_token, r.user);
    },
    [persist],
  );

  const signout = useCallback(() => {
    setStored(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, signin, signup, signout }),
    [user, token, loading, signin, signup, signout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
