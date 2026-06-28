<script setup lang="ts">
import { computed } from 'vue'
import type { GameNote } from '../types'

const props = defineProps<{
  games: GameNote[]
}>()

const emit = defineEmits<{
  exportJSON: []
  importJSON: [file: File]
}>()

// Recompute stats inline so this component is self-contained for display
const stats = computed(() => {
  const all = props.games
  const total = all.length
  const wins = all.filter(g => g.result === 'win').length
  const losses = total - wins
  const winRate = total ? Math.round((wins / total) * 100) : 0

  const byCiv = Object.entries(
    all.reduce((acc, g) => {
      const c = g.myCiv || 'Unknown'
      acc[c] = acc[c] ?? { wins: 0, total: 0 }
      acc[c].total++
      if (g.result === 'win') acc[c].wins++
      return acc
    }, {} as Record<string, { wins: number; total: number }>)
  )
    .map(([civ, v]) => ({ civ, ...v, pct: Math.round((v.wins / v.total) * 100) }))
    .sort((a, b) => b.total - a.total)

  const vsStrategy = Object.entries(
    all.reduce((acc, g) => {
      const s = g.opponentStrategy || 'Unknown'
      acc[s] = acc[s] ?? { wins: 0, total: 0 }
      acc[s].total++
      if (g.result === 'win') acc[s].wins++
      return acc
    }, {} as Record<string, { wins: number; total: number }>)
  )
    .map(([strategy, v]) => ({ strategy, ...v, pct: Math.round((v.wins / v.total) * 100) }))
    .sort((a, b) => b.total - a.total)

  // Improvement areas frequency
  const areaMap: Record<string, number> = {}
  for (const g of all) {
    for (const a of g.improvementAreas) {
      areaMap[a] = (areaMap[a] ?? 0) + 1
    }
  }

  const recentForm = all.slice(0, 10).map(g => g.result)

  return { total, wins, losses, winRate, byCiv, vsStrategy, areaMap, recentForm }
})

function handleImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) emit('importJSON', file)
}

function improvementLabel(id: string): string {
  const labels: Record<string, string> = {
    villager_production: 'Villager Production',
    tc_idle_time: 'TC Idle Time',
    economy_management: 'Economy / Resources',
    build_order: 'Build Order Execution',
    scouting: 'Scouting',
    military_micro: 'Military Micro',
    army_composition: 'Army Composition',
    upgrades: 'Upgrades Timing',
    timing_attacks: 'Timing Attacks',
    defense: 'Defense / Walling',
    map_control: 'Map Control',
    landmark_choice: 'Landmark Choice',
    resource_balance: 'Resource Balance',
    age_up_timing: 'Age-Up Timing',
  }
  return labels[id] ?? id
}

const sortedAreas = computed(() =>
  Object.entries(stats.value.areaMap)
    .map(([id, count]) => ({ id, label: improvementLabel(id), count }))
    .sort((a, b) => b.count - a.count)
)

const maxAreaCount = computed(() =>
  Math.max(1, ...sortedAreas.value.map(a => a.count))
)
</script>

<template>
  <div class="flex flex-col gap-4 animate-fade-in">

    <!-- Empty state -->
    <div v-if="stats.total === 0" class="empty-state">
      <div class="empty-state__icon">📊</div>
      <p class="empty-state__title">No data yet</p>
      <p class="empty-state__sub">Log some games and stats will appear here.</p>
    </div>

    <template v-else>

      <!-- Overall -->
      <div class="form-section">
        <p class="form-section__title">Overall Record</p>

        <div class="flex items-center justify-between">
          <div class="text-center">
            <div class="text-[32px] font-bold" :class="stats.winRate >= 50 ? 'text-win-soft' : 'text-loss-soft'">
              {{ stats.winRate }}%
            </div>
            <div class="text-[11px] text-muted uppercase tracking-wide">Win Rate</div>
          </div>
          <div class="text-center">
            <div class="text-[24px] font-bold text-fg">{{ stats.total }}</div>
            <div class="text-[11px] text-muted uppercase tracking-wide">Games</div>
          </div>
          <div class="text-center">
            <div class="text-[24px] font-bold text-win-soft">{{ stats.wins }}</div>
            <div class="text-[11px] text-muted uppercase tracking-wide">Wins</div>
          </div>
          <div class="text-center">
            <div class="text-[24px] font-bold text-loss-soft">{{ stats.losses }}</div>
            <div class="text-[11px] text-muted uppercase tracking-wide">Losses</div>
          </div>
        </div>

        <!-- Win/loss bar -->
        <div class="flex h-2 rounded-full overflow-hidden gap-0.5 mt-1">
          <div
            class="h-full rounded-l-full bg-win transition-all duration-500"
            :style="{ width: stats.winRate + '%' }"
          />
          <div
            class="h-full rounded-r-full bg-loss transition-all duration-500"
            :style="{ width: (100 - stats.winRate) + '%' }"
          />
        </div>

        <!-- Recent form -->
        <div v-if="stats.recentForm.length > 0">
          <div class="text-[10px] text-muted uppercase tracking-wide mb-1.5">Recent Form (last {{ stats.recentForm.length }})</div>
          <div class="flex gap-1.5">
            <span
              v-for="(r, i) in stats.recentForm"
              :key="i"
              class="text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded"
              :class="r === 'win' ? 'bg-win/25 text-win-soft' : 'bg-loss/25 text-loss-soft'"
            >{{ r === 'win' ? 'W' : 'L' }}</span>
          </div>
        </div>
      </div>

      <!-- By my civ -->
      <div v-if="stats.byCiv.length > 0" class="form-section">
        <p class="form-section__title">Win Rate by My Civilization</p>
        <div class="flex flex-col gap-2.5">
          <div v-for="row in stats.byCiv" :key="row.civ" class="flex items-center gap-2">
            <span class="text-[12px] text-fg-soft w-[140px] shrink-0 truncate">{{ row.civ }}</span>
            <div class="stat-bar-track">
              <div
                class="stat-bar-fill"
                :class="row.pct >= 50 ? 'stat-bar-fill--win' : 'stat-bar-fill--loss'"
                :style="{ width: row.pct + '%' }"
              />
            </div>
            <span class="font-mono text-[11px] text-muted shrink-0 w-[60px] text-right">
              {{ row.wins }}/{{ row.total }} ({{ row.pct }}%)
            </span>
          </div>
        </div>
      </div>

      <!-- Vs opponent strategy -->
      <div v-if="stats.vsStrategy.length > 0" class="form-section">
        <p class="form-section__title">Win Rate vs Opponent Strategy</p>
        <div class="flex flex-col gap-2.5">
          <div v-for="row in stats.vsStrategy" :key="row.strategy" class="flex items-center gap-2">
            <span class="text-[12px] text-fg-soft w-[140px] shrink-0 truncate">{{ row.strategy }}</span>
            <div class="stat-bar-track">
              <div
                class="stat-bar-fill"
                :class="row.pct >= 50 ? 'stat-bar-fill--win' : 'stat-bar-fill--loss'"
                :style="{ width: row.pct + '%' }"
              />
            </div>
            <span class="font-mono text-[11px] text-muted shrink-0 w-[60px] text-right">
              {{ row.wins }}/{{ row.total }} ({{ row.pct }}%)
            </span>
          </div>
        </div>
      </div>

      <!-- Improvement areas -->
      <div v-if="sortedAreas.length > 0" class="form-section">
        <p class="form-section__title">Most Flagged Improvement Areas</p>
        <div class="flex flex-col gap-2.5">
          <div v-for="area in sortedAreas" :key="area.id" class="flex items-center gap-2">
            <span class="text-[12px] text-fg-soft w-[140px] shrink-0 truncate">{{ area.label }}</span>
            <div class="stat-bar-track">
              <div
                class="stat-bar-fill"
                :style="{ width: (area.count / maxAreaCount * 100) + '%' }"
              />
            </div>
            <span class="font-mono text-[11px] text-muted shrink-0 w-[60px] text-right">
              {{ area.count }}×
            </span>
          </div>
        </div>
      </div>

    </template>

    <!-- Data management -->
    <div class="form-section">
      <p class="form-section__title">Data</p>
      <p class="text-[12px] text-muted leading-relaxed">
        Your notes are stored locally in your browser. Export to back them up or move to another device.
      </p>
      <div class="flex gap-2">
        <button type="button" class="btn-secondary flex-1" @click="emit('exportJSON')">
          Export JSON
        </button>
        <label class="btn-secondary flex-1 text-center cursor-pointer">
          Import JSON
          <input type="file" accept=".json" class="hidden" @change="handleImport" />
        </label>
      </div>
    </div>
  </div>
</template>
