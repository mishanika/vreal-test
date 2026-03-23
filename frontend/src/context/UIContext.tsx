import React, { createContext, useContext, useReducer, useCallback, ReactNode } from "react";
import type { ContextMenuState } from "../types";

export type { ContextMenuState };

interface ModalsState {
  createFolder: boolean;
  upload: boolean;
  rename: { open: boolean; nodeId: string | null; currentName: string };
  share: { open: boolean; nodeId: string | null; nodeName: string };
  permissions: { open: boolean; nodeId: string | null; nodeName: string };
}

interface UIState {
  modals: ModalsState;
  viewMode: "grid" | "list";
  contextMenu: ContextMenuState | null;
  selectedNodeId: string | null;
}

type UIAction =
  | { type: "OPEN_CREATE_FOLDER" }
  | { type: "CLOSE_CREATE_FOLDER" }
  | { type: "OPEN_UPLOAD" }
  | { type: "CLOSE_UPLOAD" }
  | { type: "OPEN_RENAME"; payload: { nodeId: string; currentName: string } }
  | { type: "CLOSE_RENAME" }
  | { type: "OPEN_SHARE"; payload: { nodeId: string; nodeName: string } }
  | { type: "CLOSE_SHARE" }
  | { type: "OPEN_PERMISSIONS"; payload: { nodeId: string; nodeName: string } }
  | { type: "CLOSE_PERMISSIONS" }
  | { type: "SET_VIEW_MODE"; payload: "grid" | "list" }
  | { type: "SHOW_CONTEXT_MENU"; payload: ContextMenuState }
  | { type: "HIDE_CONTEXT_MENU" }
  | { type: "SET_SELECTED"; payload: string | null };

const initialModals: ModalsState = {
  createFolder: false,
  upload: false,
  rename: { open: false, nodeId: null, currentName: "" },
  share: { open: false, nodeId: null, nodeName: "" },
  permissions: { open: false, nodeId: null, nodeName: "" },
};

const initialState: UIState = {
  modals: initialModals,
  viewMode: "grid",
  contextMenu: null,
  selectedNodeId: null,
};

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case "OPEN_CREATE_FOLDER":
      return { ...state, modals: { ...state.modals, createFolder: true } };
    case "CLOSE_CREATE_FOLDER":
      return { ...state, modals: { ...state.modals, createFolder: false } };
    case "OPEN_UPLOAD":
      return { ...state, modals: { ...state.modals, upload: true } };
    case "CLOSE_UPLOAD":
      return { ...state, modals: { ...state.modals, upload: false } };
    case "OPEN_RENAME":
      return { ...state, modals: { ...state.modals, rename: { open: true, ...action.payload } } };
    case "CLOSE_RENAME":
      return { ...state, modals: { ...state.modals, rename: { open: false, nodeId: null, currentName: "" } } };
    case "OPEN_SHARE":
      return { ...state, modals: { ...state.modals, share: { open: true, ...action.payload } } };
    case "CLOSE_SHARE":
      return { ...state, modals: { ...state.modals, share: { open: false, nodeId: null, nodeName: "" } } };
    case "OPEN_PERMISSIONS":
      return { ...state, modals: { ...state.modals, permissions: { open: true, ...action.payload } } };
    case "CLOSE_PERMISSIONS":
      return { ...state, modals: { ...state.modals, permissions: { open: false, nodeId: null, nodeName: "" } } };
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };
    case "SHOW_CONTEXT_MENU":
      return { ...state, contextMenu: action.payload };
    case "HIDE_CONTEXT_MENU":
      return { ...state, contextMenu: null };
    case "SET_SELECTED":
      return { ...state, selectedNodeId: action.payload };
    default:
      return state;
  }
}

interface UIContextValue {
  modals: ModalsState;
  viewMode: "grid" | "list";
  contextMenu: ContextMenuState | null;
  selectedNodeId: string | null;
  openCreateFolder: () => void;
  closeCreateFolder: () => void;
  openUpload: () => void;
  closeUpload: () => void;
  openRename: (nodeId: string, currentName: string) => void;
  closeRename: () => void;
  openShare: (nodeId: string, nodeName: string) => void;
  closeShare: () => void;
  openPermissions: (nodeId: string, nodeName: string) => void;
  closePermissions: () => void;
  setViewMode: (mode: "grid" | "list") => void;
  showContextMenu: (ctx: ContextMenuState) => void;
  hideContextMenu: () => void;
  setSelected: (id: string | null) => void;
}

const UIContext = createContext<UIContextValue>(null!);
export const useUI = () => useContext(UIContext);

export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  const openCreateFolder = useCallback(() => dispatch({ type: "OPEN_CREATE_FOLDER" }), []);
  const closeCreateFolder = useCallback(() => dispatch({ type: "CLOSE_CREATE_FOLDER" }), []);
  const openUpload = useCallback(() => dispatch({ type: "OPEN_UPLOAD" }), []);
  const closeUpload = useCallback(() => dispatch({ type: "CLOSE_UPLOAD" }), []);
  const openRename = useCallback(
    (nodeId: string, currentName: string) => dispatch({ type: "OPEN_RENAME", payload: { nodeId, currentName } }),
    [],
  );
  const closeRename = useCallback(() => dispatch({ type: "CLOSE_RENAME" }), []);
  const openShare = useCallback(
    (nodeId: string, nodeName: string) => dispatch({ type: "OPEN_SHARE", payload: { nodeId, nodeName } }),
    [],
  );
  const closeShare = useCallback(() => dispatch({ type: "CLOSE_SHARE" }), []);
  const openPermissions = useCallback(
    (nodeId: string, nodeName: string) => dispatch({ type: "OPEN_PERMISSIONS", payload: { nodeId, nodeName } }),
    [],
  );
  const closePermissions = useCallback(() => dispatch({ type: "CLOSE_PERMISSIONS" }), []);
  const setViewMode = useCallback((mode: "grid" | "list") => dispatch({ type: "SET_VIEW_MODE", payload: mode }), []);
  const showContextMenu = useCallback(
    (ctx: ContextMenuState) => dispatch({ type: "SHOW_CONTEXT_MENU", payload: ctx }),
    [],
  );
  const hideContextMenu = useCallback(() => dispatch({ type: "HIDE_CONTEXT_MENU" }), []);
  const setSelected = useCallback((id: string | null) => dispatch({ type: "SET_SELECTED", payload: id }), []);

  return (
    <UIContext.Provider
      value={{
        ...state,
        openCreateFolder,
        closeCreateFolder,
        openUpload,
        closeUpload,
        openRename,
        closeRename,
        openShare,
        closeShare,
        openPermissions,
        closePermissions,
        setViewMode,
        showContextMenu,
        hideContextMenu,
        setSelected,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}
