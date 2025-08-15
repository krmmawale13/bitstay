import React, { createContext, useContext, useState } from "react";
import axios from "axios";

interface AuthContextProps {
  login: (email: string, password: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps>({
  login: async () => {},
  loading: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      // Adjust API URL to match backend
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/auth/login`,
        { email, password }
      );

      console.log("Login success:", res.data);
      // In future: store token in localStorage or cookies
    } catch (err: any) {
      console.error("Login failed:", err);
      throw new Error(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ login, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
