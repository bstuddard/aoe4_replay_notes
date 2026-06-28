import { ref, computed } from 'vue'
import type { GameNote, ImprovementAreaId } from '../types'
import { IMPROVEMENT_AREAS } from '../types'

const STORAGE_KEY = 'aoe4_replay_notes_v1'

function loadGames(): GameNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const games = ref<GameNote[]>(loadGames())

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games.value))
}

export function useGames() {
  function addGame(data: Omit<GameNote, 'id' | 'createdAt'>) {
    games.value.unshift({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    })
    persist()
  }

  function updateGame(id: string, data: Omit<GameNote, 'id' | 'createdAt'>) {
    const idx = games.value.findIndex(g => g.id === id)
    if (idx >= 0) {
      games.value[idx] = { ...games.value[idx], ...data }
      persist()
    }
  }

  function deleteGame(id: string) {
    games.value = games.value.filter(g => g.id !== id)
    persist()
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(games.value, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aoe4_replay_notes_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importJSON(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string)
          if (!Array.isArray(parsed)) throw new Error('Expected an array')
          // Merge: keep existing, add imported that don't exist by id
          const existingIds = new Set(games.value.map(g => g.id))
          const newOnes = parsed.filter((g: GameNote) => !existingIds.has(g.id))
          games.value = [...games.value, ...newOnes].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          persist()
          resolve()
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const stats = computed(() => {
    const all = games.value
    const total = all.length
    const wins = all.filter(g => g.result === 'win').length
    const losses = total - wins
    const winRate = total ? Math.round((wins / total) * 100) : 0

    // Win rate by my civ
    const byCiv: Record<string, { wins: number; total: number }> = {}
    for (const g of all) {
      const c = g.myCiv || 'Unknown'
      if (!byCiv[c]) byCiv[c] = { wins: 0, total: 0 }
      byCiv[c].total++
      if (g.result === 'win') byCiv[c].wins++
    }

    // Win rate vs opponent strategy
    const vsStrategy: Record<string, { wins: number; total: number }> = {}
    for (const g of all) {
      const s = g.opponentStrategy || 'Unknown'
      if (!vsStrategy[s]) vsStrategy[s] = { wins: 0, total: 0 }
      vsStrategy[s].total++
      if (g.result === 'win') vsStrategy[s].wins++
    }

    // Most tagged improvement areas
    const improvements: { id: ImprovementAreaId; label: string; count: number }[] = IMPROVEMENT_AREAS.map(a => ({
      id: a.id,
      label: a.label,
      count: all.reduce((sum, g) => sum + (g.improvementAreas.includes(a.id) ? 1 : 0), 0),
    })).filter(a => a.count > 0).sort((a, b) => b.count - a.count)

    // Recent form (last 10)
    const recentForm = all.slice(0, 10).map(g => g.result)

    return { total, wins, losses, winRate, byCiv, vsStrategy, improvements, recentForm }
  })

  return { games, addGame, updateGame, deleteGame, exportJSON, importJSON, stats }
}
