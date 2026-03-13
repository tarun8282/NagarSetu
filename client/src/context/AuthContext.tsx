import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import * as authAPI from '../api/auth';

export interface AppUser extends User {
  full_name?: string;
  phone?: string;
  email?: string;
  role?: 'citizen' | 'dept_officer' | 'mc_admin' | 'state_admin';
  state_id?: string;
  city_id?: string;
  department_id?: string;
  ward_number?: string;
  states?: { name: string; code: string };
  cities?: { name: string };
  departments?: { name: string };
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  sendRegistrationOTP: (email: string, fullName: string, mobileNo: string) => Promise<authAPI.SignUpResponse>;
  sendLoginOTP: (email: string) => Promise<authAPI.SignUpResponse>;
  verifyOTPAndSignUp: (email: string, fullName: string, mobileNo: string, otp: string, password?: string, cityId?: string, stateId?: string) => Promise<authAPI.SignUpResponse>;
  citizenLogin: (email: string, password: string) => Promise<authAPI.SignUpResponse>;
  adminLogin: (username: string, password: string) => Promise<authAPI.SignUpResponse>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // First, check localStorage for stored user session (fastest restore)
        const storedUser = localStorage.getItem('app_user_session');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setLoading(false);
            return;
          } catch (e) {
            console.error('Error parsing stored user:', e);
            localStorage.removeItem('app_user_session');
          }
        }
        
        // Then try to get the Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          fetchProfile(session.user);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        fetchProfile(session.user);
      } else {
        localStorage.removeItem('app_user_session');
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (sessionUser: User) => {
    try {
      let profileData = null;

      // First check if user is a citizen
      const { data: citizenData } = await supabase
        .from('citizens')
        .select('*, states(name, code), cities(name)')
        .eq('id', sessionUser.id)
        .maybeSingle();

      if (citizenData) {
        profileData = { ...citizenData, role: 'citizen' };
      } else {
        // If not citizen, check if they are an officer/admin
        const { data: officerData } = await supabase
          .from('officers')
          .select('*, states(name, code), cities(name), departments(name)')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (officerData) {
          profileData = officerData;
        }
      }

      const userData = profileData ? { ...sessionUser, ...profileData } : sessionUser;
      const appUser = userData as AppUser;
      
      // Save to localStorage for persistence across page refreshes (10-year session)
      localStorage.setItem('app_user_session', JSON.stringify(appUser));
      
      setUser(appUser);
    } catch (error) {
      console.error('Error fetching profile:', error);
      const appUser = sessionUser as AppUser;
      // Still save to localStorage even if profile fetch fails
      localStorage.setItem('app_user_session', JSON.stringify(appUser));
      setUser(appUser);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('app_user_session');
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      localStorage.removeItem('app_user_session');
      setUser(null);
    }
  };

  const sendRegistrationOTPHandler = async (email: string, fullName: string, mobileNo: string) => {
    return authAPI.sendRegistrationOTP(email, fullName, mobileNo);
  };

  const sendLoginOTPHandler = async (email: string) => {
    return authAPI.sendLoginOTP(email);
  };

  const verifyOTPAndRegister = async (
    email: string,
    fullName: string,
    mobileNo: string,
    otp: string,
    password?: string,
    cityId?: string,
    stateId?: string
  ) => {
    const response = await authAPI.verifyOTPAndSignUp(email, fullName, mobileNo, otp, password, cityId, stateId);

    if (response.success && response.data?.user) {
      // Set session in Supabase if provided by backend
      if (response.data?.session) {
        try {
          await supabase.auth.setSession(response.data.session);
        } catch (error) {
          console.error('Error setting session:', error);
        }
      }
      await fetchProfile(response.data.user);
    }

    return response;
  };

  const loginCitizen = async (email: string, password: string) => {
    const response = await authAPI.citizenLogin(email, password);

    if (response.success && response.data?.user) {
      // Set session in Supabase if provided by backend
      if (response.data?.session) {
        try {
          await supabase.auth.setSession(response.data.session);
        } catch (error) {
          console.error('Error setting session:', error);
        }
      }
      await fetchProfile(response.data.user);
    }

    return response;
  };

  const loginAdmin = async (username: string, password: string) => {
    const response = await authAPI.adminLogin(username, password);

    if (response.success && response.data?.user) {
      // Set session in Supabase if provided by backend
      if (response.data?.session) {
        try {
          await supabase.auth.setSession(response.data.session);
        } catch (error) {
          console.error('Error setting session:', error);
        }
      }
      await fetchProfile(response.data.user);
    }

    return response;
  };

  const refreshUserData = async () => {
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (sessionUser) {
      await fetchProfile(sessionUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        sendRegistrationOTP: sendRegistrationOTPHandler,
        sendLoginOTP: sendLoginOTPHandler,
        verifyOTPAndSignUp: verifyOTPAndRegister,
        citizenLogin: loginCitizen,
        adminLogin: loginAdmin,
        refreshUser: refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};