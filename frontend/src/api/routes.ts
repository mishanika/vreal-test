export enum EApiRoutes {
  AuthLogin = "/auth/login",
  AuthRegister = "/auth/register",
  AuthBypass = "/auth/bypass",
  AuthMe = "/auth/me",

  Files = "/files",
  FilesSearch = "/files/search",
  FilesFolder = "/files/folder",
  FilesUpload = "/files/upload",
  FilesReorder = "/files/reorder",

  Shares = "/shares",
}
export enum EAppRoutes {
  Root = "/",
  Login = "/login",
  Register = "/register",
  Shared = "/shared/:shareToken",
}
