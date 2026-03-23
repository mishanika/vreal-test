import React from "react";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";
import FileManager from "./FileManager";
import UploadModal from "./Modals/UploadModal";
import CreateFolderModal from "./Modals/CreateFolderModal";
import RenameModal from "./Modals/RenameModal";
import ShareModal from "./Modals/ShareModal";
import PermissionsModal from "./Modals/PermissionsModal";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { modals } = useUI();

  return (
    <div className="dashboard">
      <header className="app-header">
        <div className="header-logo">
          📁 <span>VReal</span> Storage
        </div>
        <div className="header-user">
          <span className="header-user-name">👤 {user?.name || user?.email || "User"}</span>
          <button className="btn btn-secondary btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </header>
      <FileManager />
      {modals.upload && <UploadModal />}
      {modals.createFolder && <CreateFolderModal />}
      {modals.rename.open && <RenameModal />}
      {modals.share.open && <ShareModal />}
      {modals.permissions.open && <PermissionsModal />}
    </div>
  );
}
