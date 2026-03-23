import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from "react";
import { apiLogin, apiRegister, apiBypassLogin, apiMe, User } from "../api/auth.api";
import { connectSocket, disconnectSocket } from "../socket";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { token: string; user: User } }
  | { type: "AUTH_FAIL"; payload: string }
  | { type: "SET_USER"; payload: User }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return { ...state, loading: true, error: null };
    case "AUTH_SUCCESS":
      return { ...state, loading: false, token: action.payload.token, user: action.payload.user };
    case "AUTH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "SET_USER":
      return { ...state, user: action.payload };
    case "LOGOUT":
      return { ...state, token: null, user: null };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  bypassLogin: (token: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: localStorage.getItem("token"),
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (state.token) {
      connectSocket(state.token);
      apiMe()
        .then((res) => dispatch({ type: "SET_USER", payload: res.data }))
        .catch(() => {
          localStorage.removeItem("token");
          disconnectSocket();
          dispatch({ type: "LOGOUT" });
        });
    } else {
      disconnectSocket();
    }
  }, [state.token]);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      const res = await apiLogin(email, password);
      localStorage.setItem("token", res.data.access_token);
      dispatch({ type: "AUTH_SUCCESS", payload: { token: res.data.access_token, user: res.data.user } });
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      dispatch({ type: "AUTH_FAIL", payload: Array.isArray(msg) ? msg.join(", ") : msg || "Login failed" });
    }
  }, []);

  const register = useCallback(async (email: string, name: string, password: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      const res = await apiRegister(email, name, password);
      localStorage.setItem("token", res.data.access_token);
      dispatch({ type: "AUTH_SUCCESS", payload: { token: res.data.access_token, user: res.data.user } });
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      dispatch({ type: "AUTH_FAIL", payload: Array.isArray(msg) ? msg.join(", ") : msg || "Registration failed" });
    }
  }, []);

  const bypassLogin = useCallback(async (token: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      const res = await apiBypassLogin(token);
      localStorage.setItem("token", res.data.access_token);
      dispatch({ type: "AUTH_SUCCESS", payload: { token: res.data.access_token, user: res.data.user } });
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      dispatch({ type: "AUTH_FAIL", payload: Array.isArray(msg) ? msg.join(", ") : msg || "Bypass login failed" });
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    disconnectSocket();
    dispatch({ type: "LOGOUT" });
  }, []);

  const clearError = useCallback(() => dispatch({ type: "CLEAR_ERROR" }), []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, bypassLogin, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}
