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
  verifyOTPAndSignUp: (email: string, fullName: string, mobileNo: string, otp: string, cityId?: string, stateId?: string) => Promise<authAPI.SignUpResponse>;
  citizenLoginWithOTP: (email: string, otp: string) => Promise<authAPI.SignUpResponse>;
  adminLogin: (email: string, password: string) => Promise<authAPI.SignUpResponse>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        fetchProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (sessionUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, states(name, code), cities(name), departments(name)')
        .eq('id', sessionUser.id)
        .single();

      if (data) {
        setUser({ ...sessionUser, ...data } as AppUser);
      } else {
        setUser(sessionUser as AppUser);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser(sessionUser as AppUser);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
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
    cityId?: string,
    stateId?: string
  ) => {
    const response = await authAPI.verifyOTPAndSignUp(email, fullName, mobileNo, otp, cityId, stateId);
    
    if (response.success && response.data?.user) {
      await fetchProfile(response.data.user);
    }
    
    return response;
  };

  const loginCitizenWithOTP = async (email: string, otp: string) => {
    const response = await authAPI.citizenLoginWithOTP(email, otp);
    
    if (response.success && response.data?.user) {
      await fetchProfile(response.data.user);
    }
    
    return response;
  };

  const loginAdmin = async (email: string, password: string) => {
    const response = await authAPI.adminLogin(email, password);
    
    if (response.success && response.data?.user) {
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
        citizenLoginWithOTP: loginCitizenWithOTP,
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