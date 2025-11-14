import { createContext, useContext, useEffect, useState } from 'react';

type User = {
  id: number | string;
  username?: string;
  email?: string;
  name?: string;
  is_admin?: number | boolean;
  user_metadata?: { name?: string };
};

const AUTH_KEY = 'leet_auth_user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (username: string | null, email: string | null, password: string, name?: string | null) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = async (identifier: string, password: string) => {
    try {
      // determine if identifier is an email
      const isEmail = identifier.includes('@');
      const body: any = { password };
      if (isEmail) body.email = identifier; else body.username = identifier;
      const res = await fetch('http://localhost:4000/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (json.ok && json.token) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(json.user));
        localStorage.setItem('leet_token', json.token);
        setUser(json.user as User);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (e) {
      console.error('signIn error', e);
      throw e;
    }
  };

  const signUp = async (username: string | null, email: string | null, password: string, name: string | null = null) => {
    try {
      const payload: any = { password };
      if (username) payload.username = username;
      if (email) payload.email = email;
      if (name) payload.name = name;
      const res = await fetch('http://localhost:4000/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (json.ok && json.token) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(json.user));
        localStorage.setItem('leet_token', json.token);
        setUser(json.user as User);
      } else {
        throw new Error(json.error || 'signup failed');
      }
    } catch (e) {
      console.error('signUp error', e);
      throw e;
    }
  };

  const signOut = async () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
