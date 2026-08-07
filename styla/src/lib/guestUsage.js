const STORAGE_KEY = 'styla-guest-usage'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { date: todayString(), count: 0 }
    const parsed = JSON.parse(raw)
    if (parsed.date !== todayString()) return { date: todayString(), count: 0 }
    return parsed
  } catch {
    return { date: todayString(), count: 0 }
  }
}

function write(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getGuestUsageCount() {
  return read().count
}

export function incrementGuestUsage() {
  const state = read()
  const next = { date: todayString(), count: state.count + 1 }
  write(next)
  return next.count
}
