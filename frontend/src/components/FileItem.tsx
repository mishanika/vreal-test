import React from "react";
import { FileNode } from "../context/FilesContext";

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getIcon(node: FileNode) {
  if (node.type === "folder") return "📁";
  if (node.mimeType?.startsWith("image/")) return "🖼";
  return "📄";
}

interface Props {
  node: FileNode;
  selected: boolean;
  viewMode: "grid" | "list";
  onOpen: (node: FileNode) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
  onSelect: (id: string | null) => void;
}

export default function FileItem({
  node,
  selected,
  viewMode,
  onOpen,
  onContextMenu,
  onDragStart,
  onDrop,
  onSelect,
}: Props) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    onDragStart(node.id);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(node.id);
  };

  const thumbnail =
    node.type === "file" && node.filePath ? (
      <img className="file-thumb" src={`/uploads/${node.filePath}`} alt={node.name} loading="lazy" />
    ) : (
      <span className="file-icon">{getIcon(node)}</span>
    );

  const sharedProps = {
    draggable: true,
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
    onContextMenu: (e: React.MouseEvent) => onContextMenu(e, node),
    onClick: () => {
      onSelect(node.id);
      if (node.type === "folder") onOpen(node);
    },
    onDoubleClick: () => {
      if (node.type === "file") onOpen(node);
    },
  };

  if (viewMode === "list") {
    return (
      <div className={`file-list-item${selected ? " selected" : ""}`} {...sharedProps}>
        <span className="list-icon">{getIcon(node)}</span>
        <span className="list-name">{node.name}</span>
        {node.isPublic && <span className="badge badge-green">Public</span>}
        {node.compressionStatus === "pending" && <span className="badge badge-yellow">⏳ Processing</span>}
        {node.size != null && <span className="list-meta">{formatBytes(node.size)}</span>}
      </div>
    );
  }

  return (
    <div className={`file-item${selected ? " selected" : ""}`} {...sharedProps}>
      {node.isPublic && <span className="public-badge">Public</span>}
      {node.compressionStatus === "pending" && <span className="compress-badge">⏳</span>}
      {thumbnail}
      <span className="file-name">{node.name}</span>
      {node.size != null && <span className="file-meta">{formatBytes(node.size)}</span>}
      <span className="drag-handle" title="Drag to reorder">
        ⠿
      </span>
    </div>
  );
}
