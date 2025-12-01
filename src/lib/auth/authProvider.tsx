"use client"
import * as React from "react";
import { localStorageWeb } from "@/utils/localstorage";
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
     if (typeof window === "undefined") return;
    if (isAuthenticated) {
      const fetchData = async () => {
        const id = localStorageWeb.getItem("ID"); 
        //ถ้าไม่มีID
        if (!id) {
          setStatus("unauthenticated");
          setUserData(null);
          window.location.reload();
          return;
        }

        const data = await getProfile(id);
        if (!data) {
          setStatus("unauthenticated");
          setUserData(null);
          localStorageWeb.removeItem("ID");
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
      localStorageWeb.setItem("ID", user.data.ID);
      window.location.reload();
      return { success: true, user };
    } catch (err:any) {
      setStatus("unauthenticated");
      setUserData(null);
      localStorageWeb.removeItem("ID");
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  };

  const handleLogout = async (ID: string) => {
    await signOut(ID);
    setStatus("unauthenticated");
    setUserData(null);
    localStorageWeb.removeItem("ID");
    window.location.reload();
  };

  // interface valueType {
  //   user: any;
  //   status: "loading" | "unauthenticated" | "authenticated";
  //   handleLogin: (credentials: { username: string; password: string }) => Promise<void>;
  //   handleLogout: (ID: string) => Promise<void>;
  // }

  return (
    <AuthContext.Provider
      value={{ user: userData, status, handleLogin, handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
