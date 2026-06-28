<script setup lang="ts">
import { ref } from 'vue'
import GameForm from './components/GameForm.vue'
import GameList from './components/GameList.vue'
import StatsView from './components/StatsView.vue'
import { useGames } from './composables/useGames'
import type { GameNote } from './types'

type View = 'history' | 'log' | 'stats'

const view = ref<View>('history')
const editingGame = ref<GameNote | null>(null)
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout>

const { games, addGame, updateGame, deleteGame, exportJSON, importJSON, importSingleGame } = useGames()

function showToast(msg: string) {
  clearTimeout(toastTimer)
  toast.value = msg
  toastTimer = setTimeout(() => (toast.value = ''), 2800)
}

function goLog() {
  editingGame.value = null
  view.value = 'log'
}

function handleEdit(game: GameNote) {
  editingGame.value = game
  view.value = 'log'
}

function handleFormSubmit(data: Omit<GameNote, 'id' | 'createdAt'>) {
  if (editingGame.value) {
    updateGame(editingGame.value.id, data)
    showToast('Game note updated.')
  } else {
    addGame(data)
    showToast('Game note saved!')
  }
  editingGame.value = null
  view.value = 'history'
}

function handleCancel() {
  editingGame.value = null
  view.value = 'history'
}

function handleDelete(id: string) {
  deleteGame(id)
  showToast('Game note deleted.')
}

async function handleImport(file: File) {
  try {
    await importJSON(file)
    showToast('Import successful.')
  } catch {
    showToast('Import failed — check the file format.')
  }
}

function handlePasteGame(json: string) {
  importSingleGame(json)
  showToast('Game note saved from Claude!')
}
</script>

<template>
  <div
    class="max-w-[520px] mx-auto flex flex-col min-h-[100svh]"
    style="padding: calc(20px + env(safe-area-inset-top)) calc(16px + env(safe-area-inset-right)) calc(40px + env(safe-area-inset-bottom)) calc(16px + env(safe-area-inset-left));"
  >
    <!-- Header -->
    <header class="text-center mb-5">
      <h1 class="m-0 font-display text-[30px] tracking-[0.28em] font-bold text-gold-soft indent-[0.28em]">REPLAY NOTES</h1>
      <p class="mt-1 mb-0 font-mono text-[10px] tracking-[0.16em] uppercase text-muted">Age of Empires IV · Game Analysis</p>
    </header>

    <!-- Nav tabs -->
    <nav class="grid grid-cols-3 gap-2 mb-5" role="tablist">
      <button
        v-for="tab in [
          { id: 'history', label: 'History', sub: `${games.length} game${games.length !== 1 ? 's' : ''}` },
          { id: 'log',     label: 'Log Game', sub: editingGame ? 'editing' : 'add new' },
          { id: 'stats',   label: 'Stats',    sub: 'win rate' },
        ] as { id: View; label: string; sub: string }[]"
        :key="tab.id"
        class="flex flex-col gap-0.5 py-[9px] px-[6px] rounded-[10px] border border-line bg-surface text-fg-soft cursor-pointer transition-[border-color,background] duration-150 active:scale-[0.97]"
        :class="view === tab.id ? 'border-line-gold bg-surface-2 shadow-[0_0_0_1px_var(--color-line-gold)_inset]' : ''"
        role="tab"
        :aria-selected="view === tab.id"
        @click="tab.id === 'log' ? goLog() : (view = tab.id)"
      >
        <span
          class="text-[13px] font-semibold"
          :class="view === tab.id ? 'text-gold-soft' : ''"
        >{{ tab.label }}</span>
        <span class="font-mono text-[9px] tracking-[0.05em] text-muted-2">{{ tab.sub }}</span>
      </button>
    </nav>

    <!-- Views -->
    <div class="flex-1">
      <GameList
        v-if="view === 'history'"
        :games="games"
        @edit="handleEdit"
        @delete="handleDelete"
      />

      <div v-else-if="view === 'log'">
        <div class="mb-4 flex items-center gap-2">
          <h2 class="m-0 font-display text-[18px] text-fg-soft">
            {{ editingGame ? 'Edit Game Note' : 'Log New Game' }}
          </h2>
          <span v-if="editingGame" class="text-[11px] text-muted-2 font-mono">editing</span>
        </div>
        <GameForm
          :edit-game="editingGame"
          @submit="handleFormSubmit"
          @cancel="handleCancel"
        />
      </div>

      <StatsView
        v-else-if="view === 'stats'"
        :games="games"
        @export-j-s-o-n="exportJSON"
        @import-j-s-o-n="handleImport"
        @paste-game="handlePasteGame"
      />
    </div>

    <!-- Toast notification -->
    <Transition name="toast">
      <div
        v-if="toast"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-3 border border-line-gold text-gold-soft text-[13px] font-semibold px-4 py-2.5 rounded-full shadow-lg z-50 pointer-events-none whitespace-nowrap"
      >
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.toast-enter-active { transition: opacity 0.2s, transform 0.2s; }
.toast-leave-active { transition: opacity 0.25s, transform 0.25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 10px); }
</style>
