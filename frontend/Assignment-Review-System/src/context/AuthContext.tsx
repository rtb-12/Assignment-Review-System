// frontend/Assignment-Review-System/src/context/AuthContext.tsx

import React, { createContext, useContext, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store/store";
import {
  login as loginAction,
  logout as logoutAction,
} from "../features/auth/authSlice";

interface AuthContextProps {
  isAuthenticated: boolean;
  user: { username: string; profilePic: string } | null;
  login: (user: { username: string; profilePic: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );

  const login = (user: { username: string; profilePic: string }) => {
    console.log("Logging in:", user);
    dispatch(loginAction(user));
  };

  const logout = () => {
    console.log("Logging out");
    dispatch(logoutAction());
  };

  console.log("AuthContext state:", { isAuthenticated, user });

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
