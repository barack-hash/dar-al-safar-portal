import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';

interface UserContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAdmin: boolean;
  isAgent: boolean;
  isViewer: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isAgent = user?.role === 'AGENT';
  const isViewer = user?.role === 'VIEWER';

  return (
    <UserContext.Provider value={{ user, login, logout, isAdmin, isAgent, isViewer }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
