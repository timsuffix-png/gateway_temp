"use client"
import * as React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { signIn, getProfile, isAuthenticated, signOut } from "./auth";



const AuthContext = createContext<any | null>(null);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userData, setUserData] = useState<{} | null>({});
  const [status, setStatus] = useState<
    "loading" | "unauthenticated" | "authenticated"
  >("loading");

  useEffect(() => {
    setStatus("loading");
    if (isAuthenticated) {
      const fetchData = async () => {
        const id = localStorage.getItem("ID") ?? ""; 
        const data = await getProfile(id);
        if (!data) {
          setStatus("unauthenticated");
          setUserData(null);
          localStorage.removeItem("ID");
          window.location.reload();
        } else {
          setStatus("authenticated");
          setUserData(data);
        }
      };
      fetchData();
      return;
    }
    setStatus("unauthenticated");
  }, []);

  const handleLogin = async (credentials: {
    username: string;
    password: string;
  }) => {
    setStatus("loading");
    try {
      const user = await signIn({
        username: credentials.username,
        password: credentials.password,
      });
      setStatus("authenticated");
      setUserData(user);
      localStorage.setItem("ID", user.data.ID);
      window.location.reload();
    } catch (err:any) {
      setStatus("unauthenticated");
      setUserData(null);
      localStorage.removeItem("ID");
      throw new Error(err);
    }
  };

  const handleLogout = async (ID: string) => {
    await signOut(ID);
    setStatus("unauthenticated");
    setUserData(null);
    localStorage.removeItem("ID");
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{ user: userData, status, handleLogin, handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
