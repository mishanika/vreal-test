import React, { useState } from 'react'
import { useFiles } from '../../context/FilesContext'
import { useUI } from '../../context/UIContext'

export default function CreateFolderModal() {
  const { createFolder, loading } = useFiles()
  const { closeCreateFolder } = useUI()
  const [name, setName] = useState('')
  const [err, setErr] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setErr('Name is required'); return }
    try {
      await createFolder(name.trim())
      closeCreateFolder()
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Failed to create folder')
    }
  }

  return (
    <div className="modal-overlay" onClick={closeCreateFolder}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Folder</h2>
          <button className="modal-close" onClick={closeCreateFolder}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Folder name</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setErr('') }}
                placeholder="My folder"
              />
            </div>
            {err && <p className="error-msg">⚠ {err}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeCreateFolder}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>Create</button>
          </div>
        </form>
      </div>
    </div>
  )
}

