
"use client";

import { create } from 'zustand';

export type UserRole = 'candidate' | 'hr' | null;

interface AuthState {
  user: {
    name: string;
    email: string;
    role: UserRole;
  } | null;
  login: (name: string, email: string, role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// Minimal zustand-like implementation since we don't have it installed
// We'll use a simple state management for the demo
import { useState, useEffect } from 'react';

let currentUser: AuthState['user'] = null;
const listeners = new Set<(user: AuthState['user']) => void>();

export function useAuth() {
  const [user, setUser] = useState<AuthState['user']>(currentUser);

  useEffect(() => {
    const callback = (u: AuthState['user']) => setUser(u);
    listeners.add(callback);
    // Initial sync
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('verihire_auth');
      if (stored && !currentUser) {
        currentUser = JSON.parse(stored);
        setUser(currentUser);
      }
    }
    return () => { listeners.delete(callback); };
  }, []);

  const login = (name: string, email: string, role: UserRole) => {
    const newUser = { name, email, role };
    currentUser = newUser;
    if (typeof window !== 'undefined') {
      localStorage.setItem('verihire_auth', JSON.stringify(newUser));
    }
    listeners.forEach(l => l(newUser));
  };

  const logout = () => {
    currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('verihire_auth');
    }
    listeners.forEach(l => l(null));
  };

  return {
    user,
    isAuthenticated: !!user,
    login,
    logout
  };
}
