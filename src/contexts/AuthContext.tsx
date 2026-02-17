import React, { createContext, useContext, useState, useEffect } from 'react';
import { account } from '@/lib/appwrite';
import { api } from '@/lib/api';

type UserRole = 'admin' | 'collector' | 'household' | null;

interface AuthContextType {
  user: any;
  role: UserRole;
  isLoading: boolean;
  login: (type: 'admin' | 'collector' | 'household', identifier: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const session = await account.get();
      if (session) {
        setUser(session);
        // Determine role from labels or prefs if using Appwrite Auth
        // For this prototype, we'll check if it's a household/collector via local storage backup
        // or just re-verify from Appwrite
        const savedRole = localStorage.getItem('userRole') as UserRole;
        const savedData = localStorage.getItem('userData');
        if (savedRole) {
          setRole(savedRole);
          if (savedData) setUser(JSON.parse(savedData));
        } else {
            setRole('admin'); // Default if session exists but no role saved
        }
      }
    } catch (error) {
      // No session
      const savedRole = localStorage.getItem('userRole') as UserRole;
      const savedData = localStorage.getItem('userData');
      if (savedRole && savedData) {
          setRole(savedRole);
          setUser(JSON.parse(savedData));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (type: 'admin' | 'collector' | 'household', identifier: string, password?: string) => {
    setIsLoading(true);
    try {
      if (type === 'admin' || type === 'collector') {
        try {
            // Attempt to delete any existing session first to avoid the 'session active' error
            await account.deleteSession('current');
        } catch (e) {
            // Ignore error if no session exists
        }
        
        await account.createEmailPasswordSession(identifier, password!);
        const userData = await account.get();
        setUser(userData);
        setRole(type);
        localStorage.setItem('userRole', type);
        localStorage.setItem('userData', JSON.stringify(userData));
      } else if (type === 'household') {
        // Find household by phone
        const household = await api.getHouseholdByPhone(identifier);
        if (!household) throw new Error('Household not found with this phone number');
        
        setUser(household);
        setRole('household');
        localStorage.setItem('userRole', 'household');
        localStorage.setItem('userData', JSON.stringify(household));
      }
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
    } catch (e) {}
    setUser(null);
    setRole(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, logout }}>
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
