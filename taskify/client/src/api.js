// Network layer — the ONLY file that knows how to talk to the API.
// Components call these functions; they never call fetch() themselves.

const request = async (path, options) => {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  // 204 (DELETE) has no body; anything else should be JSON.
  const body = res.status === 204 ? null : await res.json().catch(() => null)

  // fetch() does NOT reject on 400/404/500 — convert them into real errors
  // so the server's own message ("name cannot be empty") reaches the UI.
  if (!res.ok) {
    throw new Error(body?.error ?? `Request failed: ${res.status}`)
  }
  return body
}

export const api = {
  // READ
  list: () => request('/names'),

  // CREATE — returns the new row (id + created_at included)
  create: (name) =>
    request('/names', { method: 'POST', body: JSON.stringify({ name }) }),

  // UPDATE — returns the updated row
  update: (id, name) =>
    request(`/names/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),

  // DELETE — returns null (204)
  remove: (id) => request(`/names/${id}`, { method: 'DELETE' }),
}
