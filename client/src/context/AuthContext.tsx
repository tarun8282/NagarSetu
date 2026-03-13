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
  adminLogin: (email: string, password: string) => Promise<authAPI.SignUpResponse>;
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
        
        // First, check localStorage for stored user session (from custom auth)
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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn('Error getting Supabase session:', sessionError);
        }
        
        if (session?.user) {
          // Session exists, fetch the user profile
          await fetchProfile(session.user);
        } else {
          // No session found
          setUser(null);
          setTimeout(() => setLoading(false), 100);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          // Only clear if it's not a custom auth logout
          const storedUser = localStorage.getItem('app_user_session');
          if (!storedUser) {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (sessionUser: User) => {
    try {
      let profileData = null;

      // First check if user is a citizen
      const { data: citizenData, error: citizenError } = await supabase
        .from('citizens')
        .select('*, states(name, code), cities(name)')
        .eq('id', sessionUser.id)
        .maybeSingle();

      if (citizenError && citizenError.code !== 'PGRST116') {
        console.error('Error fetching citizen data:', citizenError);
      }

      if (citizenData) {
        profileData = { ...citizenData, role: 'citizen' };
      } else {
        // If not citizen, check if they are an officer/admin
        const { data: officerData, error: officerError } = await supabase
          .from('officers')
          .select('*, states(name, code), cities(name), departments(name)')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (officerError && officerError.code !== 'PGRST116') {
          console.error('Error fetching officer data:', officerError);
        }

        if (officerData) {
          profileData = officerData;
        }
      }

      // Combine session user with profile data
      const userData = profileData ? { ...sessionUser, ...profileData } : sessionUser;
      const appUser = userData as AppUser;
      
      // Save to local storage for persistence across refreshes
      localStorage.setItem('app_user_session', JSON.stringify(appUser));
      
      setUser(appUser);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Still set the user with at least the session data and save to localStorage
      const appUser = sessionUser as AppUser;
      localStorage.setItem('app_user_session', JSON.stringify(appUser));
      setUser(appUser);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Clear the stored session
      localStorage.removeItem('app_user_session');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      // Still clear local state even if Supabase signOut fails
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
      // If backend returns a session, set it in Supabase
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
      // If backend returns a session, set it in Supabase
      if (response.data?.session) {
        try {
          await supabase.auth.setSession(response.data.session);
        } catch (error) {
          console.error('Error setting session:', error);
        }
      }
      
      // Fetch profile and save user data
      await fetchProfile(response.data.user);
    }

    return response;
  };

  const loginAdmin = async (email: string, password: string) => {
    const response = await authAPI.adminLogin(email, password);

    if (response.success && response.data?.user) {
      // If backend returns a session, set it in Supabase
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