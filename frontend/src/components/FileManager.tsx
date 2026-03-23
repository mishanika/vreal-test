import React, { useEffect, useCallback, useRef } from "react";
import { useFiles, FileNode } from "../context/FilesContext";
import { useUI } from "../context/UIContext";
import FileItem from "./FileItem";
import BreadcrumbBar from "./Breadcrumb";

export default function FileManager() {
  const {
    items,
    loading,
    error,
    currentParentId,
    searchQuery,
    searchResults,
    fetchFiles,
    navigateInto,
    deleteNode,
    cloneNode,
    togglePublic,
    reorderNodes,
    searchFiles,
    clearSearch,
  } = useFiles();

  const {
    viewMode,
    contextMenu,
    selectedNodeId,
    setViewMode,
    showContextMenu,
    hideContextMenu,
    setSelected,
    openCreateFolder,
    openUpload,
    openRename,
    openShare,
    openPermissions,
  } = useUI();

  const dragSrcRef = useRef<string | null>(null);

  useEffect(() => {
    fetchFiles(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const hide = () => hideContextMenu();
    document.addEventListener("click", hide);
    return () => document.removeEventListener("click", hide);
  }, [hideContextMenu]);

  const handleOpen = useCallback(
    (node: FileNode) => {
      if (node.type === "folder") navigateInto(node);
    },
    [navigateInto],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, node: FileNode) => {
      e.preventDefault();
      e.stopPropagation();
      showContextMenu({
        x: e.clientX,
        y: e.clientY,
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        isPublic: node.isPublic,
      });
      setSelected(node.id);
    },
    [showContextMenu, setSelected],
  );

  const handleDragStart = useCallback((id: string) => {
    dragSrcRef.current = id;
  }, []);

  const handleDrop = useCallback(
    (targetId: string) => {
      if (!dragSrcRef.current || dragSrcRef.current === targetId) return;
      const srcIdx = items.findIndex((i) => i.id === dragSrcRef.current);
      const tgtIdx = items.findIndex((i) => i.id === targetId);
      if (srcIdx === -1 || tgtIdx === -1) return;
      const reordered = [...items];
      const [moved] = reordered.splice(srcIdx, 1);
      reordered.splice(tgtIdx, 0, moved);
      const payload = reordered.map((n, idx) => ({ id: n.id, order: idx }));
      reorderNodes(payload);
      dragSrcRef.current = null;
    },
    [items, reorderNodes],
  );

  const displayed = searchQuery.trim() ? searchResults : items;

  return (
    <div className="file-manager">
      {/* Toolbar */}
      <div className="file-manager-toolbar">
        <div className="toolbar-left">
          <BreadcrumbBar />
        </div>
        <div className="toolbar-right">
          <input
            className="search-input"
            type="text"
            placeholder="Search files…"
            value={searchQuery}
            onChange={(e) => searchFiles(e.target.value)}
          />
          {searchQuery && (
            <button className="btn btn-secondary btn-sm" onClick={clearSearch}>
              ✕
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={openCreateFolder}>
            + Folder
          </button>
          <button className="btn btn-primary btn-sm" onClick={openUpload}>
            ⬆ Upload
          </button>
          <button
            className={`btn btn-secondary btn-sm${viewMode === "grid" ? " active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Grid view"
          >
            ⊞
          </button>
          <button
            className={`btn btn-secondary btn-sm${viewMode === "list" ? " active" : ""}`}
            onClick={() => setViewMode("list")}
            title="List view"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}
      {error && (
        <p className="error-msg" style={{ padding: "1rem" }}>
          ⚠ {error}
        </p>
      )}

      {!loading && displayed.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">{searchQuery ? "🔍" : "📂"}</div>
          <p>{searchQuery ? `No results for "${searchQuery}"` : "This folder is empty"}</p>
          {!searchQuery && (
            <div className="empty-actions">
              <button className="btn btn-primary" onClick={openCreateFolder}>
                Create folder
              </button>
              <button className="btn btn-secondary" onClick={openUpload}>
                Upload file
              </button>
            </div>
          )}
        </div>
      )}

      <div className={`file-grid${viewMode === "list" ? " file-list" : ""}`}>
        {displayed.map((node) => (
          <FileItem
            key={node.id}
            node={node}
            selected={selectedNodeId === node.id}
            viewMode={viewMode}
            onOpen={handleOpen}
            onContextMenu={handleContextMenu}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onSelect={setSelected}
          />
        ))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ul
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.nodeType === "folder" && (
            <li
              onClick={() => {
                navigateInto({ id: contextMenu.nodeId, type: "folder" } as FileNode);
                hideContextMenu();
              }}
            >
              📂 Open
            </li>
          )}
          <li
            onClick={() => {
              openRename(contextMenu.nodeId, contextMenu.nodeName);
              hideContextMenu();
            }}
          >
            ✏️ Rename
          </li>
          <li
            onClick={() => {
              cloneNode(contextMenu.nodeId);
              hideContextMenu();
            }}
          >
            📋 Clone
          </li>
          <li
            onClick={() => {
              openShare(contextMenu.nodeId, contextMenu.nodeName);
              hideContextMenu();
            }}
          >
            🔗 Share
          </li>
          <li
            onClick={() => {
              openPermissions(contextMenu.nodeId, contextMenu.nodeName);
              hideContextMenu();
            }}
          >
            🔐 Permissions
          </li>
          <li
            onClick={() => {
              togglePublic(contextMenu.nodeId, !contextMenu.isPublic);
              hideContextMenu();
            }}
          >
            {contextMenu.isPublic ? "🔒 Make private" : "🌐 Make public"}
          </li>
          <li
            className="danger"
            onClick={() => {
              deleteNode(contextMenu.nodeId);
              hideContextMenu();
            }}
          >
            🗑 Delete
          </li>
        </ul>
      )}
    </div>
  );
}
