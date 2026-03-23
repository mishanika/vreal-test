import React from 'react'
import { useFiles } from '../context/FilesContext'

export default function Breadcrumb() {
  const { breadcrumbs, navigateTo } = useFiles()
  return (
    <div className="breadcrumbs">
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1
        return (
          <React.Fragment key={crumb.id ?? 'root'}>
            {idx > 0 && <span className="breadcrumb-sep">›</span>}
            {isLast
              ? <span className="breadcrumb-current">{crumb.name}</span>
              : <span className="breadcrumb-item" onClick={() => navigateTo(crumb)}>{crumb.name}</span>
            }
          </React.Fragment>
        )
      })}
    </div>
  )
}
