export type Result = 'win' | 'loss'

export const CIVS = [
  'Abbasid Dynasty',
  'Ayyubids',
  'Byzantines',
  'Chinese',
  'Delhi Sultanate',
  'English',
  'French',
  'HRE',
  'House of Lancaster',
  "Jeanne d'Arc",
  'Japanese',
  'Malians',
  'Mongols',
  'Order of the Dragon',
  'Ottomans',
  'Rus',
  "Zhu Xi's Legacy",
  'Other / Unknown',
] as const

export type Civilization = (typeof CIVS)[number]

export const MAPS = [
  'Altai',
  'Ancient Spires',
  'Arabian Peninsula',
  'Archipelago',
  'Black Forest',
  'Boulder Bay',
  'Canal',
  'Cliffside',
  'Confluence',
  'Continental',
  'Danube River',
  'Dry Arabia',
  'French Pass',
  'Glade',
  'Golden Heights',
  'Golden Pit',
  'Gorge',
  'High View',
  'Hideout',
  'Hill and Dale',
  'King of the Hill',
  'Lipany',
  'Mongolian Heights',
  'Mountain Pass',
  'Nagari',
  'Prairie',
  'Red Desert',
  'Rocky River',
  'Savanna',
  'Scandinavia',
  'Socotra',
  'Wetlands',
  'Wolf Lakes',
  'Other',
] as const

export const MY_STRATEGIES = [
  'Fast Castle',
  '2 TC Boom',
  'Feudal Aggression',
  'MAA Rush',
  'Archer Rush',
  'Horseman Rush',
  'Tower Rush',
  'Scout Rush',
  'Springald Rush',
  'Fast Imperial',
  'Sacred Sites',
  'Navy Rush',
  'Siege Push',
  'Landmark Rush',
  'Mixed / Adaptive',
] as const

export const OPPONENT_STRATEGIES = [
  'Fast Castle',
  '2 TC Boom',
  'Feudal Aggression',
  'MAA Rush',
  'Archer Rush',
  'Horseman Rush',
  'Tower Rush',
  'Scout Rush',
  'Springald Rush',
  'Fast Imperial',
  'Sacred Sites',
  'Navy Rush',
  'Siege Push',
  'Landmark Rush',
  'Mixed / Adaptive',
  'Unknown',
] as const

export type OpponentStrategy = (typeof OPPONENT_STRATEGIES)[number]

export const IMPROVEMENT_AREAS = [
  { id: 'villager_production', label: 'Villager Production' },
  { id: 'tc_idle_time', label: 'TC Idle Time' },
  { id: 'economy_management', label: 'Economy / Resources' },
  { id: 'build_order', label: 'Build Order Execution' },
  { id: 'scouting', label: 'Scouting' },
  { id: 'military_micro', label: 'Military Micro' },
  { id: 'army_composition', label: 'Army Composition' },
  { id: 'upgrades', label: 'Upgrades Timing' },
  { id: 'timing_attacks', label: 'Timing Attacks' },
  { id: 'defense', label: 'Defense / Walling' },
  { id: 'map_control', label: 'Map Control' },
  { id: 'landmark_choice', label: 'Landmark Choice' },
  { id: 'resource_balance', label: 'Resource Balance' },
  { id: 'age_up_timing', label: 'Age-Up Timing' },
] as const

export type ImprovementAreaId = (typeof IMPROVEMENT_AREAS)[number]['id']

export interface GameNote {
  id: string
  createdAt: string

  // Match metadata
  date: string
  result: Result
  map: string
  aoe4worldUrl: string

  // Civs & players
  myCiv: string
  opponentName: string
  opponentCiv: string

  // Age-up timing (mm:ss)
  myFeudalTime: string
  myCastleTime: string
  opponentFeudalTime: string
  opponentCastleTime: string

  // Strategies
  myStrategy: string
  myLandmarks: string
  opponentStrategy: string
  opponentLandmarks: string

  // Narrative analysis
  whatOpponentDid: string
  howIResponded: string
  keyMoments: string
  whatIWouldDoNext: string

  // Structured self-assessment
  improvementAreas: ImprovementAreaId[]
  selfRating: number // 1–5

  // General notes
  generalNotes: string
}
