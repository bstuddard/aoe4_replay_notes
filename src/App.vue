<script setup lang="ts">
import { ref, computed } from 'vue'
import GameList from './components/GameList.vue'
import StatsView from './components/StatsView.vue'
import { useGames } from './composables/useGames'

type View = 'history' | 'stats'

const view = ref<View>('history')
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout>

const { games, deleteGame, exportJSON, importJSON, importSingleGame } = useGames()

const gameUrl = ref('')
const skipUrl = ref(false)
const canCopy = computed(() => gameUrl.value.trim().length > 0 || skipUrl.value)

function showToast(msg: string) {
  clearTimeout(toastTimer)
  toast.value = msg
  toastTimer = setTimeout(() => (toast.value = ''), 2800)
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
  try {
    importSingleGame(json)
    showToast('Game note saved from Claude!')
    view.value = 'history'
  } catch {
    showToast('Save failed — check the JSON format.')
  }
}

async function copyClaudePrompt() {
  const base = (window.location.origin + window.location.pathname).replace(/\/?$/, '')
  const schemaUrl = base + '/llms.txt'

  const urlLine = gameUrl.value.trim()
    ? `\n\nThe game to log is: ${gameUrl.value.trim()}\nStart by fetching that game's data from the aoe4world API, then continue the interview for the remaining fields.`
    : ''

  const historySection = games.value.length > 0
    ? `\n\nHere is my complete game history (${games.value.length} game${games.value.length !== 1 ? 's' : ''}) for context. Use it to offer smart defaults and spot patterns during the interview:\n\n${JSON.stringify(games.value)}`
    : ''

  const prompt = `Please fetch and read ${schemaUrl} — it describes a JSON schema for logging AoE4 replay notes. Then interview me to log a new game and give me the completed JSON at the end.${urlLine}${historySection}`

  try {
    await navigator.clipboard.writeText(prompt)
    showToast('Prompt copied — paste it into Claude!')
    gameUrl.value = ''
    skipUrl.value = false
  } catch {
    showToast('Could not copy — try selecting and copying manually.')
  }
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

      <!-- Claude prompt launcher -->
      <div class="mt-4 flex flex-col gap-2 text-left">
        <label class="field__label text-center">aoe4world game link</label>
        <input
          v-model="gameUrl"
          type="url"
          placeholder="https://aoe4world.com/players/…/games/…"
          class="w-full"
          @keydown.enter="canCopy && copyClaudePrompt()"
        />
        <div class="flex items-center justify-between gap-3">
          <label class="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              v-model="skipUrl"
              type="checkbox"
              class="accent-[var(--color-gold-soft)] w-3.5 h-3.5"
            />
            <span class="text-[11px] text-muted">no link yet</span>
          </label>
          <button
            type="button"
            :disabled="!canCopy"
            class="px-4 py-1.5 rounded-full border text-[11px] font-mono tracking-wide transition-colors duration-150"
            :class="canCopy
              ? 'border-line-gold text-gold-soft hover:bg-surface-2 cursor-pointer'
              : 'border-line text-muted-2 cursor-not-allowed opacity-50'"
            @click="copyClaudePrompt"
          >
            copy claude prompt
          </button>
        </div>
      </div>
    </header>

    <!-- Nav tabs -->
    <nav class="grid grid-cols-2 gap-2 mb-5" role="tablist">
      <button
        v-for="tab in [
          { id: 'history', label: 'History', sub: `${games.length} game${games.length !== 1 ? 's' : ''}` },
          { id: 'stats',   label: 'Stats',   sub: 'win rate · data' },
        ] as { id: View; label: string; sub: string }[]"
        :key="tab.id"
        class="flex flex-col gap-0.5 py-[9px] px-[6px] rounded-[10px] border border-line bg-surface text-fg-soft cursor-pointer transition-[border-color,background] duration-150 active:scale-[0.97]"
        :class="view === tab.id ? 'border-line-gold bg-surface-2 shadow-[0_0_0_1px_var(--color-line-gold)_inset]' : ''"
        role="tab"
        :aria-selected="view === tab.id"
        @click="view = tab.id"
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
        @delete="handleDelete"
      />

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
