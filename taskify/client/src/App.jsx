import { useEffect, useState } from 'react'
import { api } from './api.js'
import './App.css'

export default function App() {
  // --- state ---------------------------------------------------------
  const [names, setNames] = useState([])          // the list from the API
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [error, setError] = useState('')          // message for the banner

  const [newName, setNewName] = useState('')      // the "add" input
  const [submitting, setSubmitting] = useState(false) // blocks double-clicks

  const [editingId, setEditingId] = useState(null) // which row is being edited
  const [editValue, setEditValue] = useState('')   // that row's input value

  // --- READ on mount --------------------------------------------------
  const load = () => {
    setStatus('loading')
    api
      .list()
      .then((rows) => {
        setNames(rows)
        setStatus('ready')
        setError('')
      })
      .catch((e) => {
        setError(e.message)
        setStatus('error')
      })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // [] = run ONCE. Remove it on purpose someday to see the fetch loop.

  // --- STEP 3: CREATE -------------------------------------------------
  const handleAdd = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      // The server responds with the stored row (RETURNING *),
      // including its fresh id — append it directly, no refetch needed.
      const row = await api.create(newName)
      setNames((prev) => [...prev, row])
      setNewName('')
      setError('')
    } catch (err) {
      setError(err.message) // e.g. "name cannot be empty" from the server
    } finally {
      setSubmitting(false)
    }
  }

  // --- STEP 4: UPDATE (edit-in-place) ---------------------------------
  const startEdit = (name) => {
    setEditingId(name.id)
    setEditValue(name.name) // prefill so you edit, not retype
    setError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const handleSave = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const updated = await api.update(editingId, editValue)
      // Swap only the changed row; the rest stay untouched.
      setNames((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
      cancelEdit()
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // --- render ---------------------------------------------------------
  return (
    <main className="app">
      <h1>Names</h1>

      {error && (
        <div className="banner" role="alert">
          {error}{' '}
          {status === 'error' && (
            <button onClick={load}>Retry</button>
          )}
        </div>
      )}

      {status === 'loading' && <p className="muted">Loading…</p>}

      {status === 'error' && (
        <p className="muted">Could not reach the API. Is the server running?</p>
      )}

      {status === 'ready' && (
        <>
          {/* --- CREATE form --- */}
          <form className="add-form" onSubmit={handleAdd}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter a name"
              maxLength={100}
              autoFocus
            />
            <button type="submit" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add'}
            </button>
          </form>

          {/* --- empty state --- */}
          {names.length === 0 && <p className="muted">No names yet.</p>}

          {/* --- the list --- */}
          <ul className="name-list">
            {names.map((name) => (
              <li key={name.id} className="name-row">
                {editingId === name.id ? (
                  /* editing this row: swap text for an input */
                  <>
                    <input
                      className="edit-input"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      maxLength={100}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave()
                        if (e.key === 'Escape') cancelEdit()
                      }}
                    />
                    <span className="actions">
                      <button
                        className="save"
                        onClick={handleSave}
                        disabled={submitting}
                      >
                        Save
                      </button>
                      <button onClick={cancelEdit}>Cancel</button>
                    </span>
                  </>
                ) : (
                  /* normal row */
                  <>
                    <span className="name-text">{name.name}</span>
                    <span className="actions">
                      <button onClick={() => startEdit(name)}>Edit</button>
                      {/* Delete arrives in Step 5 */}
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}
