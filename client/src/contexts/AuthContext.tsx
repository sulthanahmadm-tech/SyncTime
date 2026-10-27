import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '../lib/types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ data?: any; error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserProfile = async (token?: string): Promise<Profile | null> => {
    try {
      const accessToken = token || (await supabase.auth.getSession()).data.session?.access_token;
      if (!accessToken) return null;
      const res = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (res.ok) {
        return (await res.json()) as Profile;
      }
      return null;
    } catch (e) {
      console.error('Error fetching profile:', e);
      return null;
    }
  };

  const refreshProfile = async (): Promise<Profile | null> => {
    const p = await fetchUserProfile();
    setProfile(p);
    return p;
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        setSession(session);
        setUser(session.user);
        const p = await fetchUserProfile(session.access_token);
        if (mounted) setProfile(p);
      }
      if (mounted) setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      if (!mounted) return;
      if (_event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
      } else if (session) {
        setSession(session);
        setUser(session.user);
        const p = await fetchUserProfile(session.access_token);
        if (mounted) setProfile(p);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.session) {
      setSession(data.session);
      setUser(data.session.user);
      const p = await fetchUserProfile(data.session.access_token);
      setProfile(p);
    }
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data?.session) {
      setSession(data.session);
      setUser(data.session.user);
      const p = await fetchUserProfile(data.session.access_token);
      setProfile(p);
    }
    return { data, error };
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signIn, signUp, signOut, refreshProfile }}>
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
