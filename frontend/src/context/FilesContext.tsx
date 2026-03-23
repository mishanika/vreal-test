import React, { createContext, useContext, useReducer, useRef, useCallback, useEffect, ReactNode } from "react";
import { socket } from "../socket";
import { useAuth } from "./AuthContext";
import type { FileNode, Permission, Breadcrumb } from "../types";
import {
  apiFetchFiles,
  apiSearchFiles,
  apiCreateFolder,
  apiUploadFile,
  apiUpdateNode,
  apiDeleteNode,
  apiCloneNode,
  apiReorderNodes,
  apiFetchPermissions,
  apiGrantPermission,
  apiRevokePermission,
} from "../api/files.api";

export type { FileNode, Permission, Breadcrumb };

interface FilesState {
  items: FileNode[];
  loading: boolean;
  error: string | null;
  currentParentId: string | null;
  breadcrumbs: Breadcrumb[];
  searchQuery: string;
  searchResults: FileNode[];
  permissions: Permission[];
  permissionsLoading: boolean;
}

type FilesAction =
  | { type: "SET_ITEMS"; payload: FileNode[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "NAVIGATE_INTO"; payload: FileNode }
  | { type: "NAVIGATE_TO"; payload: { crumbId: string | null; breadcrumbs: Breadcrumb[] } }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_SEARCH_RESULTS"; payload: FileNode[] }
  | { type: "SET_PERMISSIONS"; payload: Permission[] }
  | { type: "SET_PERMISSIONS_LOADING"; payload: boolean }
  | { type: "UPSERT_NODE"; payload: FileNode }
  | { type: "REMOVE_NODE"; payload: string };

const initialState: FilesState = {
  items: [],
  loading: false,
  error: null,
  currentParentId: null,
  breadcrumbs: [{ id: null, name: "Root" }],
  searchQuery: "",
  searchResults: [],
  permissions: [],
  permissionsLoading: false,
};

function filesReducer(state: FilesState, action: FilesAction): FilesState {
  switch (action.type) {
    case "SET_ITEMS":
      return { ...state, items: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "NAVIGATE_INTO":
      return {
        ...state,
        currentParentId: action.payload.id,
        breadcrumbs: [...state.breadcrumbs, { id: action.payload.id, name: action.payload.name }],
        searchQuery: "",
        searchResults: [],
      };
    case "NAVIGATE_TO": {
      const idx = state.breadcrumbs.findIndex((b) => b.id === action.payload.crumbId);
      return {
        ...state,
        currentParentId: action.payload.crumbId,
        breadcrumbs: state.breadcrumbs.slice(0, idx + 1),
        searchQuery: "",
        searchResults: [],
      };
    }
    case "SET_SEARCH":
      return { ...state, searchQuery: action.payload };
    case "SET_SEARCH_RESULTS":
      return { ...state, searchResults: action.payload };
    case "SET_PERMISSIONS":
      return { ...state, permissions: action.payload };
    case "SET_PERMISSIONS_LOADING":
      return { ...state, permissionsLoading: action.payload };
    case "UPSERT_NODE": {
      const exists = state.items.some((n) => n.id === action.payload.id);
      if (exists) {
        return { ...state, items: state.items.map((n) => (n.id === action.payload.id ? action.payload : n)) };
      }
      if (action.payload.parentId === state.currentParentId) {
        return { ...state, items: [...state.items, action.payload] };
      }
      return state;
    }
    case "REMOVE_NODE":
      return { ...state, items: state.items.filter((n) => n.id !== action.payload) };
    default:
      return state;
  }
}

interface FilesContextValue extends FilesState {
  fetchFiles: (parentId?: string | null) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  uploadFile: (formData: FormData) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  renameNode: (id: string, name: string) => Promise<void>;
  cloneNode: (id: string) => Promise<void>;
  reorderNodes: (reorderItems: { id: string; order: number }[]) => Promise<void>;
  searchFiles: (q: string) => void;
  clearSearch: () => void;
  togglePublic: (id: string, isPublic: boolean) => Promise<void>;
  navigateInto: (node: FileNode) => void;
  navigateTo: (crumb: Breadcrumb) => void;
  fetchPermissions: (nodeId: string) => Promise<void>;
  grantPermission: (nodeId: string, email: string, level: string) => Promise<void>;
  revokePermission: (nodeId: string, permId: string) => Promise<void>;
}

const FilesContext = createContext<FilesContextValue>(null!);
export const useFiles = () => useContext(FilesContext);

export function FilesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(filesReducer, initialState);
  const { user } = useAuth();

  // Ref so async callbacks always see latest parentId without stale closure
  const parentRef = useRef<string | null>(null);
  const userRef = useRef(user);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ─── WebSocket listeners ──────────────────────────────────────────────────
  useEffect(() => {
    const onUpsert = (node: FileNode) => dispatch({ type: "UPSERT_NODE", payload: node });
    const onRemove = (data: { id: string }) => dispatch({ type: "REMOVE_NODE", payload: data.id });

    const onUpdated = (node: FileNode) => {
      const currentUserId = userRef.current?.id;
      // Node was made private and current user is not the owner — remove it.
      // fetchFiles will add it back if the user has an explicit permission grant.
      if (!node.isPublic && currentUserId && node.ownerId !== currentUserId) {
        dispatch({ type: "REMOVE_NODE", payload: node.id });
        apiFetchFiles(parentRef.current)
          .then((res) => dispatch({ type: "SET_ITEMS", payload: res.data }))
          .catch(() => {});
      } else {
        dispatch({ type: "UPSERT_NODE", payload: node });
      }
    };

    socket.on("file:created", onUpsert);
    socket.on("file:updated", onUpdated);
    socket.on("file:compressed", onUpsert);
    socket.on("file:deleted", onRemove);

    return () => {
      socket.off("file:created", onUpsert);
      socket.off("file:updated", onUpdated);
      socket.off("file:compressed", onUpsert);
      socket.off("file:deleted", onRemove);
    };
  }, []);

  // ─── Data fetching ────────────────────────────────────────────────────────
  const fetchFiles = useCallback(async (parentId?: string | null) => {
    const pid = parentId === undefined ? parentRef.current : parentId;
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    try {
      const res = await apiFetchFiles(pid);
      dispatch({ type: "SET_ITEMS", payload: res.data });
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: e?.response?.data?.message || "Failed to load files" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const navigateInto = useCallback(
    (node: FileNode) => {
      if (node.type !== "folder") return;
      parentRef.current = node.id;
      dispatch({ type: "NAVIGATE_INTO", payload: node });
      fetchFiles(node.id);
    },
    [fetchFiles],
  );

  const navigateTo = useCallback(
    (crumb: Breadcrumb) => {
      parentRef.current = crumb.id;
      dispatch({ type: "NAVIGATE_TO", payload: { crumbId: crumb.id, breadcrumbs: [] } });
      fetchFiles(crumb.id);
    },
    [fetchFiles],
  );

  const createFolder = useCallback(
    async (name: string) => {
      await apiCreateFolder(name, parentRef.current);
      fetchFiles(parentRef.current);
    },
    [fetchFiles],
  );

  const uploadFile = useCallback(
    async (formData: FormData) => {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });
      try {
        await apiUploadFile(formData);
        fetchFiles(parentRef.current);
      } catch (e: any) {
        const msg = e?.response?.data?.message;
        dispatch({ type: "SET_ERROR", payload: Array.isArray(msg) ? msg.join(", ") : msg || "Upload failed" });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [fetchFiles],
  );

  const deleteNode = useCallback(
    async (id: string) => {
      await apiDeleteNode(id);
      fetchFiles(parentRef.current);
    },
    [fetchFiles],
  );

  const renameNode = useCallback(
    async (id: string, name: string) => {
      await apiUpdateNode(id, { name });
      fetchFiles(parentRef.current);
    },
    [fetchFiles],
  );

  const cloneNode = useCallback(
    async (id: string) => {
      await apiCloneNode(id);
      fetchFiles(parentRef.current);
    },
    [fetchFiles],
  );

  const reorderNodes = useCallback(
    async (reorderItems: { id: string; order: number }[]) => {
      await apiReorderNodes(reorderItems);
      fetchFiles(parentRef.current);
    },
    [fetchFiles],
  );

  const searchFiles = useCallback((q: string) => {
    dispatch({ type: "SET_SEARCH", payload: q });
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q.trim()) {
      dispatch({ type: "SET_SEARCH_RESULTS", payload: [] });
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await apiSearchFiles(q);
        dispatch({ type: "SET_SEARCH_RESULTS", payload: res.data });
      } catch {}
    }, 350);
  }, []);

  const clearSearch = useCallback(() => {
    dispatch({ type: "SET_SEARCH", payload: "" });
    dispatch({ type: "SET_SEARCH_RESULTS", payload: [] });
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }, []);

  const togglePublic = useCallback(
    async (id: string, isPublic: boolean) => {
      await apiUpdateNode(id, { isPublic });
      fetchFiles(parentRef.current);
    },
    [fetchFiles],
  );

  const fetchPermissions = useCallback(async (nodeId: string) => {
    dispatch({ type: "SET_PERMISSIONS_LOADING", payload: true });
    try {
      const res = await apiFetchPermissions(nodeId);
      dispatch({ type: "SET_PERMISSIONS", payload: res.data });
    } catch {
      dispatch({ type: "SET_PERMISSIONS", payload: [] });
    } finally {
      dispatch({ type: "SET_PERMISSIONS_LOADING", payload: false });
    }
  }, []);

  const grantPermission = useCallback(
    async (nodeId: string, email: string, level: string) => {
      await apiGrantPermission(nodeId, email, level);
      await fetchPermissions(nodeId);
    },
    [fetchPermissions],
  );

  const revokePermission = useCallback(
    async (nodeId: string, permId: string) => {
      await apiRevokePermission(nodeId, permId);
      await fetchPermissions(nodeId);
    },
    [fetchPermissions],
  );

  return (
    <FilesContext.Provider
      value={{
        ...state,
        fetchFiles,
        createFolder,
        uploadFile,
        deleteNode,
        renameNode,
        cloneNode,
        reorderNodes,
        searchFiles,
        clearSearch,
        togglePublic,
        navigateInto,
        navigateTo,
        fetchPermissions,
        grantPermission,
        revokePermission,
      }}
    >
      {children}
    </FilesContext.Provider>
  );
}
