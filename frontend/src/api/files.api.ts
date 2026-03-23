import client from "./client";
import { EApiRoutes } from "./routes";
import type { FileNode, Permission } from "../types";

export const apiFetchFiles = (parentId?: string | null) =>
  client.get<FileNode[]>(EApiRoutes.Files, { params: parentId ? { parentId } : {} });

export const apiSearchFiles = (q: string) =>
  client.get<FileNode[]>(EApiRoutes.FilesSearch, { params: { q } });

export const apiCreateFolder = (name: string, parentId?: string | null) =>
  client.post<FileNode>(EApiRoutes.FilesFolder, { name, ...(parentId ? { parentId } : {}) });

export const apiUploadFile = (formData: FormData) =>
  client.post<FileNode>(EApiRoutes.FilesUpload, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const apiUpdateNode = (id: string, data: { name?: string; isPublic?: boolean }) =>
  client.patch<FileNode>(`${EApiRoutes.Files}/${id}`, data);

export const apiDeleteNode = (id: string) =>
  client.delete(`${EApiRoutes.Files}/${id}`);

export const apiCloneNode = (id: string) =>
  client.post<FileNode>(`${EApiRoutes.Files}/${id}/clone`);

export const apiReorderNodes = (items: { id: string; order: number }[]) =>
  client.patch(EApiRoutes.FilesReorder, { items });

export const apiFetchPermissions = (id: string) =>
  client.get<Permission[]>(`${EApiRoutes.Files}/${id}/permissions`);

export const apiGrantPermission = (id: string, email: string, level: string) =>
  client.post<Permission>(`${EApiRoutes.Files}/${id}/permissions`, { email, level });

export const apiRevokePermission = (nodeId: string, permId: string) =>
  client.delete(`${EApiRoutes.Files}/${nodeId}/permissions/${permId}`);
