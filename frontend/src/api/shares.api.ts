import axios from "axios";
import client from "./client";
import { EApiRoutes } from "./routes";
import type { Share } from "../types";

export const apiCreateShare = (fileNodeId: string) => client.post<Share>(EApiRoutes.Shares, { fileNodeId });

export const apiListShares = (fileNodeId: string) => client.get<Share[]>(`${EApiRoutes.Shares}/file/${fileNodeId}`);

export const apiRevokeShare = (shareId: string) => client.delete(`${EApiRoutes.Shares}/${shareId}`);

/** Public endpoint — no auth required */
export const apiGetSharePublic = (token: string) => axios.get(`/api${EApiRoutes.Shares}/public/${token}`);
