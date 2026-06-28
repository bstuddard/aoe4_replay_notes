<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { CIVS, MAPS, MY_STRATEGIES, OPPONENT_STRATEGIES, IMPROVEMENT_AREAS } from '../types'
import type { GameNote, ImprovementAreaId, Result } from '../types'

const props = defineProps<{
  editGame?: GameNote | null
}>()

const emit = defineEmits<{
  submit: [data: Omit<GameNote, 'id' | 'createdAt'>]
  cancel: []
}>()

function today() {
  return new Date().toISOString().slice(0, 10)
}

function blankForm(): Omit<GameNote, 'id' | 'createdAt'> {
  return {
    date: today(),
    result: 'win',
    map: '',
    aoe4worldUrl: '',
    myCiv: '',
    opponentName: '',
    opponentCiv: '',
    myFeudalTime: '',
    myCastleTime: '',
    opponentFeudalTime: '',
    opponentCastleTime: '',
    myStrategy: '',
    myLandmarks: '',
    opponentStrategy: '',
    opponentLandmarks: '',
    whatOpponentDid: '',
    howIResponded: '',
    keyMoments: '',
    whatIWouldDoNext: '',
    improvementAreas: [],
    selfRating: 3,
    generalNotes: '',
  }
}

const form = reactive<Omit<GameNote, 'id' | 'createdAt'>>(blankForm())

// My strategy dropdown state
const myStrategySelect = ref('')
const myStrategyCustom = ref('')

watch([myStrategySelect, myStrategyCustom], ([sel, custom]) => {
  form.myStrategy = sel === 'Other' ? custom : sel
})

function initMyStrategy(val: string) {
  if ((MY_STRATEGIES as readonly string[]).includes(val)) {
    myStrategySelect.value = val
    myStrategyCustom.value = ''
  } else if (val) {
    myStrategySelect.value = 'Other'
    myStrategyCustom.value = val
  } else {
    myStrategySelect.value = ''
    myStrategyCustom.value = ''
  }
}

// Populate form when editing
watch(
  () => props.editGame,
  (game) => {
    if (game) {
      Object.assign(form, {
        date: game.date,
        result: game.result,
        map: game.map,
        aoe4worldUrl: game.aoe4worldUrl,
        myCiv: game.myCiv,
        opponentName: game.opponentName,
        opponentCiv: game.opponentCiv,
        myFeudalTime: game.myFeudalTime,
        myCastleTime: game.myCastleTime,
        opponentFeudalTime: game.opponentFeudalTime,
        opponentCastleTime: game.opponentCastleTime,
        myStrategy: game.myStrategy,
        myLandmarks: game.myLandmarks,
        opponentStrategy: game.opponentStrategy,
        opponentLandmarks: game.opponentLandmarks,
        whatOpponentDid: game.whatOpponentDid,
        howIResponded: game.howIResponded,
        keyMoments: game.keyMoments,
        whatIWouldDoNext: game.whatIWouldDoNext,
        improvementAreas: [...game.improvementAreas],
        selfRating: game.selfRating,
        generalNotes: game.generalNotes,
      })
      initMyStrategy(game.myStrategy)
    } else {
      Object.assign(form, blankForm())
      initMyStrategy('')
    }
  },
  { immediate: true }
)

function setResult(r: Result) {
  form.result = r
}

function toggleArea(id: ImprovementAreaId) {
  const idx = form.improvementAreas.indexOf(id)
  if (idx >= 0) form.improvementAreas.splice(idx, 1)
  else form.improvementAreas.push(id)
}

function setRating(n: number) {
  form.selfRating = n
}

function handleSubmit() {
  emit('submit', { ...form, improvementAreas: [...form.improvementAreas] })
}
</script>

<template>
  <form class="flex flex-col gap-4 animate-fade-in" @submit.prevent="handleSubmit">

    <!-- Match Info -->
    <div class="form-section">
      <p class="form-section__title">Match Info</p>

      <div class="field-row">
        <div class="field">
          <label class="field__label">Date</label>
          <input type="date" v-model="form.date" />
        </div>
        <div class="field">
          <label class="field__label">Map</label>
          <select v-model="form.map">
            <option value="">— select —</option>
            <option v-for="m in MAPS" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label class="field__label">Result</label>
        <div class="result-toggle">
          <button
            type="button"
            class="result-btn result-btn--win"
            :class="{ active: form.result === 'win' }"
            @click="setResult('win')"
          >WIN</button>
          <button
            type="button"
            class="result-btn result-btn--loss"
            :class="{ active: form.result === 'loss' }"
            @click="setResult('loss')"
          >LOSS</button>
        </div>
      </div>

      <div class="field">
        <label class="field__label">aoe4world.com game URL <span class="text-[10px] text-muted normal-case font-normal">(optional)</span></label>
        <input type="url" v-model="form.aoe4worldUrl" placeholder="https://aoe4world.com/players/…/games/…" />
      </div>
    </div>

    <!-- Civs & Players -->
    <div class="form-section">
      <p class="form-section__title">Civs &amp; Players</p>

      <div class="field-row">
        <div class="field">
          <label class="field__label">My Civilization</label>
          <select v-model="form.myCiv">
            <option value="">— select —</option>
            <option v-for="c in CIVS" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="field">
          <label class="field__label">Opponent Civ</label>
          <select v-model="form.opponentCiv">
            <option value="">— select —</option>
            <option v-for="c in CIVS" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label class="field__label">Opponent Name <span class="text-[10px] text-muted normal-case font-normal">(optional)</span></label>
        <input type="text" v-model="form.opponentName" placeholder="e.g. ledzep320" />
      </div>
    </div>

    <!-- Age-Up Timing -->
    <div class="form-section">
      <p class="form-section__title">Age-Up Timing</p>
      <p class="text-[11px] text-muted mt-[-6px]">Format: mm:ss — leave blank if unknown</p>

      <div class="field-row">
        <div class="field">
          <label class="field__label">My Feudal Time</label>
          <input type="text" v-model="form.myFeudalTime" placeholder="4:20" maxlength="5" />
        </div>
        <div class="field">
          <label class="field__label">My Castle Time</label>
          <input type="text" v-model="form.myCastleTime" placeholder="10:30" maxlength="5" />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label class="field__label">Opp. Feudal Time</label>
          <input type="text" v-model="form.opponentFeudalTime" placeholder="3:50" maxlength="5" />
        </div>
        <div class="field">
          <label class="field__label">Opp. Castle Time</label>
          <input type="text" v-model="form.opponentCastleTime" placeholder="9:15" maxlength="5" />
        </div>
      </div>
    </div>

    <!-- Strategies -->
    <div class="form-section">
      <p class="form-section__title">Strategies</p>

      <div class="field-row">
        <div class="field">
          <label class="field__label">My Strategy</label>
          <select v-model="myStrategySelect">
            <option value="">— select —</option>
            <option v-for="s in MY_STRATEGIES" :key="s" :value="s">{{ s }}</option>
            <option value="Other">Other…</option>
          </select>
          <input v-if="myStrategySelect === 'Other'" type="text" v-model="myStrategyCustom"
            placeholder="Describe your strategy…" class="mt-1.5" />
        </div>
        <div class="field">
          <label class="field__label">My Landmarks</label>
          <input type="text" v-model="form.myLandmarks" placeholder="e.g. Council Hall" />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label class="field__label">Opp. Strategy</label>
          <select v-model="form.opponentStrategy">
            <option value="">— select —</option>
            <option v-for="s in OPPONENT_STRATEGIES" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="field">
          <label class="field__label">Opp. Landmarks</label>
          <input type="text" v-model="form.opponentLandmarks" placeholder="e.g. Red Palace" />
        </div>
      </div>
    </div>

    <!-- Game Analysis -->
    <div class="form-section">
      <p class="form-section__title">Game Analysis</p>

      <div class="field">
        <label class="field__label">What Did the Opponent Do?</label>
        <textarea v-model="form.whatOpponentDid" rows="3"
          placeholder="e.g. Fast castled into knights, sent two groups of 8 to harass my wood line around 11:00" />
      </div>

      <div class="field">
        <label class="field__label">How Did I Respond?</label>
        <textarea v-model="form.howIResponded" rows="3"
          placeholder="e.g. Walled off the north and pulled 4 spears to defend, delayed castle push" />
      </div>

      <div class="field">
        <label class="field__label">Key Moments / Turning Points</label>
        <textarea v-model="form.keyMoments" rows="3"
          placeholder="e.g. Lost 6 archers trying to chase cavalry at 14:00, that opened up my base" />
      </div>

      <div class="field">
        <label class="field__label">What I'd Do Differently</label>
        <textarea v-model="form.whatIWouldDoNext" rows="3"
          placeholder="e.g. Wall earlier, scout the 2nd TC position, build a tower on the gold" />
      </div>
    </div>

    <!-- Self Assessment -->
    <div class="form-section">
      <p class="form-section__title">Self Assessment</p>

      <div class="field">
        <label class="field__label">Improvement Areas <span class="text-[10px] text-muted normal-case font-normal">(select all that apply)</span></label>
        <div class="chips">
          <button
            v-for="area in IMPROVEMENT_AREAS"
            :key="area.id"
            type="button"
            class="chip"
            :class="{ active: form.improvementAreas.includes(area.id) }"
            @click="toggleArea(area.id)"
          >{{ area.label }}</button>
        </div>
      </div>

      <div class="field">
        <label class="field__label">Overall Performance <span class="text-[10px] text-muted normal-case font-normal">(1 = poor, 5 = excellent)</span></label>
        <div class="rating">
          <button
            v-for="n in 5"
            :key="n"
            type="button"
            class="rating__star"
            :class="{ active: n <= form.selfRating }"
            @click="setRating(n)"
          >★</button>
        </div>
      </div>
    </div>

    <!-- General Notes -->
    <div class="form-section">
      <p class="form-section__title">General Notes</p>
      <div class="field">
        <textarea v-model="form.generalNotes" rows="4"
          placeholder="Anything else worth remembering about this game…" />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-3">
      <button type="button" class="btn-secondary flex-1" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary flex-[2]">
        {{ editGame ? 'Save Changes' : 'Save Game Note' }}
      </button>
    </div>

  </form>
</template>
