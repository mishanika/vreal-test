export interface User {
  id: string;
  email: string;
  name: string;
}

export type FileNodeType = "file" | "folder";
export type CompressionStatus = "none" | "pending" | "done" | "error";
export type PermissionLevel = "read" | "write" | "admin";
export type SharePermission = "read";

export interface FileNode {
  id: string;
  name: string;
  type: FileNodeType;
  parentId: string | null;
  ownerId: string;
  isPublic: boolean;
  mimeType: string | null;
  size: number | null;
  filePath: string | null;
  order: number;
  compressionStatus: CompressionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  userId: string;
  level: PermissionLevel;
  user: { email: string; name: string };
}

export interface Share {
  id: string;
  fileNodeId: string;
  email: string | null;
  permission: SharePermission;
  token: string;
  publicUrl?: string;
  createdAt: string;
}

export interface Breadcrumb {
  id: string | null;
  name: string;
}

export interface ContextMenuState {
  x: number;
  y: number;
  nodeId: string;
  nodeName: string;
  nodeType: FileNodeType;
  isPublic: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
