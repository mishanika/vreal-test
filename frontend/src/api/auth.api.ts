import client from "./client";
import { EApiRoutes } from "./routes";
import type { User, AuthResponse } from "../types";

export type { User };

export const apiLogin = (email: string, password: string) =>
  client.post<AuthResponse>(EApiRoutes.AuthLogin, { email, password });

export const apiRegister = (email: string, name: string, password: string) =>
  client.post<AuthResponse>(EApiRoutes.AuthRegister, { email, name, password });

export const apiBypassLogin = (token: string) => client.post<AuthResponse>(EApiRoutes.AuthBypass, { token });

export const apiMe = () => client.get<User>(EApiRoutes.AuthMe);
