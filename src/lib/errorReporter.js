const listeners = new Set()

export function reportHttpError(detail) {
  listeners.forEach((callback) => callback(detail))
}

export function subscribeToHttpErrors(callback) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}
