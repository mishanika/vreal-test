# VReal Storage

A full-stack file storage application similar to Google Drive, built with NestJS and React.

## Features

- **Authentication** — Register/login with JWT tokens, session persisted via `localStorage`
- **Hierarchical file system** — Folders and files with unlimited nesting, breadcrumb navigation
- **Image uploads** — JPEG, PNG, WebP (max 20 MB) via drag-and-drop or file picker
- **Object storage** — Files stored in MinIO (S3-compatible); served via `/uploads/` proxy
- **Compression** — Uploaded images are automatically compressed to WebP (Sharp)
- **Rename, clone, delete** — Full CRUD on every node
- **Drag-and-drop reorder** — Rearrange files and folders within a folder
- **Search** — Debounced full-text search across your files
- **Permissions** — Grant `read`/`write`/`admin` access to other users by email
- **Sharing** — Create public share links with `read` permission
- **Real-time sync** — WebSocket (socket.io) pushes create/update/delete/compress events to all connected clients
- **Grid & list views** — Toggle between views from the toolbar

---

## Tech Stack

| Layer        | Technology                                          |
| ------------ | --------------------------------------------------- |
| Backend      | NestJS 10, TypeORM 0.3, PostgreSQL 16               |
| Auth         | JWT (`@nestjs/jwt`), bcrypt                         |
| File storage | MinIO (S3-compatible), `@aws-sdk/client-s3`         |
| Compression  | Sharp (WebP, fire-and-forget)                       |
| WebSockets   | socket.io (`@nestjs/websockets`)                    |
| Frontend     | React 18, TypeScript 5, Vite 5                      |
| State        | React Context API + `useReducer`                    |
| Routing      | React Router v6                                     |
| HTTP client  | Axios                                               |
| API docs     | Swagger (`/api/docs`)                               |
| Container    | Docker Compose (postgres + minio + backend + nginx) |

---

## Project Structure

```
vreal-test/
├── docker-compose.yml        # postgres + minio + backend + frontend (nginx)
├── backend/
│   └── src/
│       ├── app.module.ts     # Root module, TypeORM config (sync: false)
│       ├── data-source.ts    # TypeORM CLI data source for migrations
│       ├── main.ts           # Bootstrap (port 3001, CORS, Swagger)
│       ├── entities/         # TypeORM entities: User, FileNode, Permission, Share
│       ├── migrations/       # SQL migrations (run with npm run migration:run)
│       └── modules/
│           ├── auth/         # JWT guard, register/login/me, DTOs
│           ├── events/       # socket.io WebSocket gateway
│           ├── files/        # CRUD, upload, search, reorder, permissions
│           │   └── dto/      # CreateFolderDto, UpdateFileDto, ReorderDto, GrantPermissionDto
│           └── shares/       # Share link creation and public access
│               └── dto/      # CreateShareDto
└── frontend/
    └── src/
        ├── types.ts          # All shared TypeScript interfaces and enums
        ├── App.tsx           # React Router routes (uses EAppRoutes)
        ├── socket.ts         # socket.io singleton
        ├── api/
        │   ├── routes.ts     # EApiRoutes + EAppRoutes enums
        │   ├── client.ts     # Axios instance with auth interceptor
        │   ├── auth.api.ts   # login, register, me
        │   ├── files.api.ts  # all file/folder/permission endpoints
        │   └── shares.api.ts # share link endpoints
        ├── context/
        │   ├── AuthContext.tsx  # auth state (useReducer)
        │   ├── FilesContext.tsx # file tree + WS listeners (useReducer)
        │   └── UIContext.tsx    # modals + view mode (useReducer)
        └── components/
            ├── Dashboard.tsx
            ├── FileManager.tsx
            ├── FileItem.tsx
            ├── Breadcrumb.tsx
            ├── LoginPage.tsx
            ├── RegisterPage.tsx
            ├── SharedPage.tsx
            └── Modals/
                ├── CreateFolderModal.tsx
                ├── UploadModal.tsx
                ├── RenameModal.tsx
                ├── ShareModal.tsx
                └── PermissionsModal.tsx
```

---

## Getting Started

### Option A — Docker Compose (recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
docker compose up --build
```

| Service       | URL                       |
| ------------- | ------------------------- |
| App (nginx)   | http://localhost          |
| Backend API   | http://localhost/api      |
| Swagger docs  | http://localhost/api/docs |
| MinIO console | http://localhost:9001     |

### Option B — Local development

#### Prerequisites

- Node.js 20+
- PostgreSQL 16 running on `localhost:5432` (or use `docker compose up -d db minio`)
- MinIO running on `localhost:9000` (or use `docker compose up -d db minio`)

#### 1. Start infrastructure only

```bash
docker compose up -d db minio
```

#### 2. Backend

```bash
cd backend
npm install
npm run migration:run   # create tables on first run
npm run start:dev       # http://localhost:3001
```

#### 3. Frontend

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

Vite proxies `/api` → `http://localhost:3001` and `/uploads` → MinIO bucket automatically.

---

## Environment Variables

All variables have sensible local defaults. For production, override via Docker Compose environment or a `.env` file:

| Variable           | Default                 | Description              |
| ------------------ | ----------------------- | ------------------------ |
| `DB_HOST`          | `localhost`             | PostgreSQL host          |
| `DB_PORT`          | `5432`                  | PostgreSQL port          |
| `DB_USER`          | `vreal`                 | PostgreSQL user          |
| `DB_PASSWORD`      | `vreal_secret`          | PostgreSQL password      |
| `DB_NAME`          | `vreal`                 | PostgreSQL database name |
| `MINIO_ENDPOINT`   | `http://localhost:9000` | MinIO S3 endpoint        |
| `MINIO_ACCESS_KEY` | `vreal_admin`           | MinIO access key         |
| `MINIO_SECRET_KEY` | `vreal_secret123`       | MinIO secret key         |
| `MINIO_BUCKET`     | `vreal`                 | MinIO bucket name        |
| `JWT_SECRET`       | `vreal-jwt-secret-2024` | JWT signing secret       |

---

## Database Migrations

```bash
cd backend

# Apply all pending migrations
npm run migration:run

# Roll back the last migration
npm run migration:revert

# Auto-generate a migration from entity changes
npm run migration:generate src/migrations/MyChange

# List applied / pending migrations
npm run migration:show
```

---

## Demo Bypass Token

For API testing without real credentials:

```
Authorization: Bearer vreal-demo-bypass-2026
```

---

## Running Tests

```bash
cd backend
npm test
```

Uses **Mocha** + **Sinon** for unit tests covering file list, folder creation, upload validation, search, delete, and reorder.

## Features

- **Authentication** — Register/login with JWT tokens
- **Hierarchical file system** — Folders and files with unlimited nesting
- **Image uploads** — JPEG, PNG, WebP (max 20 MB) via drag-and-drop or file picker
- **Rename, clone, delete** — Full CRUD on every node
- **Reordering** — Drag-and-drop to rearrange files and folders
- **Search** — Full-text search across all your files
- **Permissions** — Grant read/write/admin access to other users by email
- **Sharing** — Create public share links with read or write permissions
- **Public access** — View shared files/folders without authentication
- **Grid & list views** — Toggle between views with a toolbar button

---

## Tech Stack

| Layer    | Technology                         |
| -------- | ---------------------------------- |
| Backend  | NestJS 10, TypeORM, better-sqlite3 |
| Auth     | JWT (jsonwebtoken), bcrypt         |
| Uploads  | Multer (local disk, `/uploads/`)   |
| Frontend | React 18, TypeScript 5, Vite 5     |
| State    | React Context API + Axios          |
| Routing  | React Router v6                    |
| API docs | Swagger (`/api/docs`)              |

---

## Project Structure

```
vreal test/
├── backend/          # NestJS API
│   └── src/
│       ├── auth/     # JWT auth guard, register/login/me
│       ├── files/    # File/folder CRUD + upload + search + permissions
│       ├── shares/   # Share link creation and public access
│       └── entities/ # TypeORM entities (User, FileNode, Permission, Share)
├── frontend/         # React SPA
│   └── src/
│       ├── api/      # Axios API client + typed helpers
│       ├── context/  # AuthContext, FilesContext, UIContext
│       └── components/
│           ├── Modals/   # All modal dialogs (functional components)
│           └── ...       # Pages and layout components
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Backend

```bash
cd backend
npm install
npm run start:dev
```

The API starts on **http://localhost:3001**.  
Swagger docs: **http://localhost:3001/api/docs**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app starts on **http://localhost:5173**.  
Vite dev server proxies `/api` and `/uploads` to the backend automatically.

### 3. Production build

```bash
cd frontend
npm run build
```

---

## Environment Variables

No `.env` files are required for local development. Defaults:

| Variable     | Default                 | Location        |
| ------------ | ----------------------- | --------------- |
| `JWT_SECRET` | `vreal-jwt-secret-2024` | `auth.guard.ts` |
| Backend port | `3001`                  | `main.ts`       |
| DB file      | `data.db` (SQLite)      | `app.module.ts` |

> For production, set `JWT_SECRET` as an environment variable.

---

## Demo Bypass Token

For testing without credentials, the backend accepts a hardcoded bypass token:

```
Authorization: Bearer vreal-demo-bypass-2026
```

---

## Running Tests

```bash
cd backend
npm test
```

Uses **Mocha** with **Sinon** stubs for unit tests covering file list, folder creation, upload validation, search, delete, and reorder.

---

## Features

- 🔐 **Authentication** — Register & login with JWT
- 📁 **Folder hierarchy** — Nested folders, breadcrumb navigation
- 🖼 **Image uploads** — JPEG, PNG, WebP (up to 20 MB)
- ↕ **Drag & drop reordering** — Reorder files/folders by dragging
- ✏ **File management** — Rename, clone, delete
- 🔍 **Search** — Full-text search across all files and folders
- 🌐 **Public/private toggle** — Control file visibility
- 🔑 **Permission management** — Grant read/write/admin access per user
- 🔗 **Share links** — Generate public share links with specific permissions
- 📋 **OpenAPI docs** — Swagger UI at `/api/docs`

---

## Tech Stack

### Backend

- **NestJS** (Node.js framework)
- **TypeORM** + **SQLite** (better-sqlite3)
- **JWT** authentication + hardcoded bypass token
- **Multer** for file uploads
- **Swagger/OpenAPI** documentation
- **Mocha** unit tests

### Frontend

- **React 18** + **TypeScript**
- **React class components** (no hooks)
- **Redux** (plain, no Toolkit) + **Redux Sagas**
- **React Context API** — `AuthContext` provides auth state app-wide
- **Axios** for REST API calls
- **React Router v6**
- **Vite** bundler

---

## Setup & Run

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Clone the repository

```bash
git clone <repo-url>
cd vreal-test
```

### 2. Start the Backend

```bash
cd backend
npm install
npm run start:dev
```

Backend runs at **http://localhost:3001**  
Swagger docs: **http://localhost:3001/api/docs**

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

---

## Demo / API Access

A hardcoded bypass token is available for API testing without authentication:

```
Authorization: Bearer vreal-demo-bypass-2026
```

---

## Architecture

```
vreal-test/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── entities/     # TypeORM entities (User, FileNode, Permission, Share)
│   │   ├── auth/         # Auth controller + JWT guard
│   │   ├── files/        # Files controller (all DB logic in controller per spec)
│   │   └── shares/       # Shares controller
│   └── test/             # Mocha unit tests
└── frontend/             # React + Redux + Vite
    └── src/
        ├── api/          # Axios API layer
        ├── store/        # Redux store, actions, reducers
        │   ├── auth/
        │   ├── files/
        │   └── ui/
        ├── sagas/        # Redux Sagas (async side effects)
        ├── context/      # AuthContext (React Context API)
        ├── utils/        # withRouter HOC for class components
        └── components/   # React class components
            └── Modals/   # Upload, CreateFolder, Rename, Share, Permissions
```

### State Management Architecture

- **Redux Store** — Single source of truth for auth, files, and UI state
- **Redux Sagas** — All async operations (API calls) handled in sagas
- **React Context API** — `AuthContext` subscribes to Redux store and exposes `user`, `isAuthenticated`, and `logout()` to any class component via `static contextType`
- **Axios client** — Automatically injects JWT token from localStorage into every request

---

## Running Tests

```bash
cd backend
npm test
```

Uses **Mocha** with **ts-node** for TypeScript support.
