import { Usuario } from '../service/auth.api';

let currentUser: Usuario | null = null;

export const setCurrentUser = (user: Usuario | null) => {
  currentUser = user;
};

export const getCurrentUser = (): Usuario | null => {
  return currentUser;
};

export const getToken = (): string | null => {
  return currentUser?.token || null;
};

export const updateCurrentUser = (updates: Partial<Usuario>) => {
  if (currentUser) {
    currentUser = { ...currentUser, ...updates };
  }
};

export const logout = () => {
  currentUser = null;
};
