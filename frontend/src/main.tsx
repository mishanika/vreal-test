import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { UIProvider } from "./context/UIContext";
import { FilesProvider } from "./context/FilesContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <BrowserRouter>
    <AuthProvider>
      <UIProvider>
        <FilesProvider>
          <App />
        </FilesProvider>
      </UIProvider>
    </AuthProvider>
  </BrowserRouter>,
);
