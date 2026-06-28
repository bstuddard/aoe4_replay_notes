<script setup lang="ts">
import { ref, computed } from 'vue'
import { CIVS, OPPONENT_STRATEGIES, IMPROVEMENT_AREAS } from '../types'
import type { GameNote } from '../types'

const props = defineProps<{
  games: GameNote[]
}>()

const emit = defineEmits<{
  edit: [game: GameNote]
  delete: [id: string]
}>()

// Filters
const filterResult = ref<'all' | 'win' | 'loss'>('all')
const filterCiv = ref('')
const filterStrategy = ref('')
const searchOpponent = ref('')
const expandedId = ref<string | null>(null)

const filtered = computed(() => {
  return props.games.filter(g => {
    if (filterResult.value !== 'all' && g.result !== filterResult.value) return false
    if (filterCiv.value && g.myCiv !== filterCiv.value) return false
    if (filterStrategy.value && g.opponentStrategy !== filterStrategy.value) return false
    if (searchOpponent.value) {
      const q = searchOpponent.value.toLowerCase()
      if (!g.opponentName.toLowerCase().includes(q)) return false
    }
    return true
  })
})

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function improvementLabel(id: string) {
  return IMPROVEMENT_AREAS.find(a => a.id === id)?.label ?? id
}

function confirmDelete(id: string) {
  if (confirm('Delete this game note?')) emit('delete', id)
}
</script>

<template>
  <div class="flex flex-col gap-3 animate-fade-in">

    <!-- Filters -->
    <div class="form-section gap-3">
      <p class="form-section__title">Filter &amp; Search</p>

      <div class="field-row">
        <!-- Result filter -->
        <div class="field">
          <label class="field__label">Result</label>
          <div class="result-toggle">
            <button type="button" class="result-btn result-btn--win" :class="{ active: filterResult === 'win' }" @click="filterResult = filterResult === 'win' ? 'all' : 'win'">W</button>
            <button type="button" class="result-btn result-btn--loss" :class="{ active: filterResult === 'loss' }" @click="filterResult = filterResult === 'loss' ? 'all' : 'loss'">L</button>
          </div>
        </div>
        <!-- Opponent search -->
        <div class="field">
          <label class="field__label">Opponent</label>
          <input type="text" v-model="searchOpponent" placeholder="Search name…" />
        </div>
      </div>

      <div class="field-row">
        <!-- My civ filter -->
        <div class="field">
          <label class="field__label">My Civ</label>
          <select v-model="filterCiv">
            <option value="">All</option>
            <option v-for="c in CIVS" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <!-- Opp strategy filter -->
        <div class="field">
          <label class="field__label">Opp. Strategy</label>
          <select v-model="filterStrategy">
            <option value="">All</option>
            <option v-for="s in OPPONENT_STRATEGIES" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
      </div>

      <p class="text-[11px] text-muted">
        Showing {{ filtered.length }} of {{ games.length }} game{{ games.length !== 1 ? 's' : '' }}
      </p>
    </div>

    <!-- Empty state -->
    <div v-if="games.length === 0" class="empty-state">
      <div class="empty-state__icon">⚔️</div>
      <p class="empty-state__title">No games logged yet</p>
      <p class="empty-state__sub">Use "Log Game" to save your first replay analysis.</p>
    </div>

    <div v-else-if="filtered.length === 0" class="empty-state">
      <div class="empty-state__icon">🔍</div>
      <p class="empty-state__title">No matches</p>
      <p class="empty-state__sub">Try adjusting the filters above.</p>
    </div>

    <!-- Game cards -->
    <template v-else>
      <div
        v-for="game in filtered"
        :key="game.id"
        class="game-card"
        :class="game.result === 'win' ? 'game-card--win' : 'game-card--loss'"
        @click="toggleExpand(game.id)"
      >
        <!-- Card header -->
        <div class="flex items-start justify-between gap-2">
          <div class="flex flex-col gap-1 min-w-0">
            <!-- Date + result badge -->
            <div class="flex items-center gap-2">
              <span
                class="text-[11px] font-bold px-[6px] py-[1px] rounded-[4px]"
                :class="game.result === 'win'
                  ? 'bg-win/20 text-win-soft'
                  : 'bg-loss/20 text-loss-soft'"
              >{{ game.result === 'win' ? 'WIN' : 'LOSS' }}</span>
              <span class="text-[11px] text-muted font-mono">{{ formatDate(game.date) }}</span>
              <span v-if="game.map" class="text-[11px] text-muted">· {{ game.map }}</span>
            </div>
            <!-- Civ matchup -->
            <div class="flex items-center gap-1 text-[13px] font-semibold text-fg min-w-0">
              <span class="truncate">{{ game.myCiv || '?' }}</span>
              <span class="text-muted text-[10px] shrink-0">vs</span>
              <span class="truncate">{{ game.opponentCiv || '?' }}</span>
              <span v-if="game.opponentName" class="text-[11px] text-muted font-normal truncate">({{ game.opponentName }})</span>
            </div>
            <!-- Strategy tags -->
            <div class="flex flex-wrap gap-1 mt-0.5">
              <span v-if="game.myStrategy" class="text-[10px] bg-surface-3 border border-line-2 rounded px-[5px] py-[1px] text-fg-soft">
                Me: {{ game.myStrategy }}
              </span>
              <span v-if="game.opponentStrategy" class="text-[10px] bg-surface-3 border border-line-2 rounded px-[5px] py-[1px] text-fg-soft">
                Opp: {{ game.opponentStrategy }}
              </span>
            </div>
          </div>
          <!-- Self rating -->
          <div class="flex flex-col items-end gap-1 shrink-0">
            <span class="text-[13px] text-gold-soft leading-none">{{ '★'.repeat(game.selfRating) }}<span class="text-muted-2">{{ '★'.repeat(5 - game.selfRating) }}</span></span>
            <span class="text-[10px] text-muted">{{ expandedId === game.id ? '▲' : '▼' }}</span>
          </div>
        </div>

        <!-- Expanded detail -->
        <div v-if="expandedId === game.id" class="mt-3 pt-3 border-t border-line flex flex-col gap-3 animate-slide-up" @click.stop>

          <!-- Timing row -->
          <div v-if="game.myFeudalTime || game.myCastleTime || game.opponentFeudalTime || game.opponentCastleTime"
            class="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span class="text-muted uppercase tracking-wide">My times</span>
              <div class="font-mono text-fg-soft mt-0.5">
                <span v-if="game.myFeudalTime">Feudal: {{ game.myFeudalTime }}</span>
                <span v-if="game.myFeudalTime && game.myCastleTime"> · </span>
                <span v-if="game.myCastleTime">Castle: {{ game.myCastleTime }}</span>
                <span v-if="!game.myFeudalTime && !game.myCastleTime" class="text-muted">—</span>
              </div>
            </div>
            <div>
              <span class="text-muted uppercase tracking-wide">Opp. times</span>
              <div class="font-mono text-fg-soft mt-0.5">
                <span v-if="game.opponentFeudalTime">Feudal: {{ game.opponentFeudalTime }}</span>
                <span v-if="game.opponentFeudalTime && game.opponentCastleTime"> · </span>
                <span v-if="game.opponentCastleTime">Castle: {{ game.opponentCastleTime }}</span>
                <span v-if="!game.opponentFeudalTime && !game.opponentCastleTime" class="text-muted">—</span>
              </div>
            </div>
          </div>

          <!-- Narrative fields -->
          <div v-for="[label, val] in [
            ['What Opponent Did', game.whatOpponentDid],
            ['How I Responded', game.howIResponded],
            ['Key Moments', game.keyMoments],
            ['What I\'d Do Differently', game.whatIWouldDoNext],
            ['General Notes', game.generalNotes],
          ] as [string, string][]" :key="label">
            <div v-if="val" class="flex flex-col gap-1">
              <span class="text-[10px] font-semibold uppercase tracking-wide text-muted">{{ label }}</span>
              <p class="text-[13px] text-fg-soft leading-relaxed m-0 whitespace-pre-wrap">{{ val }}</p>
            </div>
          </div>

          <!-- Improvement areas -->
          <div v-if="game.improvementAreas.length > 0">
            <span class="text-[10px] font-semibold uppercase tracking-wide text-muted">Improvement Areas</span>
            <div class="chips mt-1.5">
              <span v-for="id in game.improvementAreas" :key="id" class="chip active" style="cursor:default">
                {{ improvementLabel(id) }}
              </span>
            </div>
          </div>

          <!-- aoe4world link -->
          <div v-if="game.aoe4worldUrl">
            <a :href="game.aoe4worldUrl" target="_blank" rel="noopener"
              class="text-[12px] text-gold-soft underline underline-offset-2 hover:text-gold"
              @click.stop>
              View on aoe4world.com ↗
            </a>
          </div>

          <!-- Action buttons -->
          <div class="flex gap-2 pt-1">
            <button type="button" class="btn-secondary" @click.stop="emit('edit', game)">Edit</button>
            <button type="button" class="btn-danger" @click.stop="confirmDelete(game.id)">Delete</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
