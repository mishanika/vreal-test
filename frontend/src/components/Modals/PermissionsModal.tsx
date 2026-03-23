import React, { useState, useEffect } from 'react'
import { useFiles, Permission } from '../../context/FilesContext'
import { useUI } from '../../context/UIContext'

export default function PermissionsModal() {
  const { permissions, permissionsLoading, fetchPermissions, grantPermission, revokePermission } = useFiles()
  const { modals, closePermissions } = useUI()
  const { nodeId, nodeName } = modals.permissions
  const [email, setEmail] = useState('')
  const [level, setLevel] = useState<'read' | 'write' | 'admin'>('read')

  useEffect(() => {
    if (nodeId) fetchPermissions(nodeId)
  }, [nodeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !nodeId) return
    await grantPermission(nodeId, email, level)
    setEmail('')
  }

  return (
    <div className="modal-overlay" onClick={closePermissions}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔑 Manage Access — {nodeName}</h2>
          <button className="modal-close" onClick={closePermissions}>✕</button>
        </div>

        <form onSubmit={handleGrant}>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>Grant access to a user by their email address:</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>Email</label>
              <input type="email" placeholder="user@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Level</label>
              <select value={level} onChange={e => setLevel(e.target.value as any)}>
                <option value="read">👁 Read</option>
                <option value="write">✏ Write</option>
                <option value="admin">🔑 Admin</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={permissionsLoading || !email}>Grant</button>
          </div>
        </form>

        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
            Current Access
          </p>
          {permissionsLoading && <div className="loading-center"><div className="spinner" /></div>}
          {!permissionsLoading && permissions.length === 0 && (
            <p style={{ fontSize: 13, color: '#aaa' }}>No explicit permissions set. Only the owner can access this item.</p>
          )}
          <div className="perm-list">
            {permissions.map(p => (
              <div key={p.id} className="perm-item">
                <div style={{ flex: 1 }}>
                  <div className="perm-email">{p.user?.email || p.userId}</div>
                  {p.user?.name && <div style={{ fontSize: 11, color: '#aaa' }}>{p.user.name}</div>}
                </div>
                <span className="perm-level">{p.level}</span>
                <button className="btn btn-danger btn-sm"
                  onClick={() => nodeId && revokePermission(nodeId, p.id)}>Remove</button>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={closePermissions}>Done</button>
        </div>
      </div>
    </div>
  )
}

