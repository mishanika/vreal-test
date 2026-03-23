import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import Dashboard from "./components/Dashboard";
import SharedPage from "./components/SharedPage";
import { EAppRoutes } from "./api/routes";

export default function App() {
  const { token } = useAuth();
  return (
    <Routes>
      <Route path={EAppRoutes.Login} element={token ? <Navigate to={EAppRoutes.Root} replace /> : <LoginPage />} />
      <Route path={EAppRoutes.Register} element={token ? <Navigate to={EAppRoutes.Root} replace /> : <RegisterPage />} />
      <Route path={EAppRoutes.Root} element={token ? <Dashboard /> : <Navigate to={EAppRoutes.Login} replace />} />
      <Route path={EAppRoutes.Shared} element={<SharedPage />} />
      <Route path="*" element={<Navigate to={EAppRoutes.Root} replace />} />
    </Routes>
  );
}
