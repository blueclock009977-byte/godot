/**
 * モンスターデータ - 全40体
 */

import { MonsterSpecies, Ability } from '../types';

// ============================================
// 特性データ
// ============================================

export const ABILITIES: Record<string, Ability> = {
  // 炎系
  blaze: {
    id: 'blaze',
    name: '猛火',
    description: 'HP50%以下で炎技威力1.3倍',
    trigger: 'on_low_hp',
  },
  flame_body: {
    id: 'flame_body',
    name: '炎の体',
    description: '接触技を受けると30%で火傷',
    trigger: 'on_hit',
  },
  flash_fire: {
    id: 'flash_fire',
    name: 'もらいび',
    description: '炎技を受けると無効化し炎技威力1.5倍',
    trigger: 'on_hit',
  },
  
  // 水系
  torrent: {
    id: 'torrent',
    name: '激流',
    description: 'HP50%以下で水技威力1.3倍',
    trigger: 'on_low_hp',
  },
  water_absorb: {
    id: 'water_absorb',
    name: '貯水',
    description: '水技を受けるとHP回復',
    trigger: 'on_hit',
  },
  damp: {
    id: 'damp',
    name: '湿り気',
    description: '自爆系技を無効化',
    trigger: 'passive',
  },
  drizzle: {
    id: 'drizzle',
    name: 'あめふらし',
    description: '登場時に雨を降らせる',
    trigger: 'on_enter',
  },
  
  // 土系
  sturdy: {
    id: 'sturdy',
    name: '頑丈',
    description: 'HP満タン時、一撃で倒されずHP1で耐える',
    trigger: 'on_hit',
  },
  sand_veil: {
    id: 'sand_veil',
    name: '砂隠れ',
    description: '砂嵐時に回避率上昇',
    trigger: 'on_weather',
  },
  sand_stream: {
    id: 'sand_stream',
    name: '砂起こし',
    description: '登場時に砂嵐',
    trigger: 'on_enter',
  },
  
  // 風系
  gale_wings: {
    id: 'gale_wings',
    name: '疾風',
    description: '先制技の優先度+1',
    trigger: 'on_attack',
  },
  infiltrator: {
    id: 'infiltrator',
    name: 'すり抜け',
    description: '相手の壁を無視',
    trigger: 'on_attack',
  },
  intimidate: {
    id: 'intimidate',
    name: '威嚇',
    description: '登場時に相手のATK-1',
    trigger: 'on_enter',
  },
  
  // 光系
  illuminate: {
    id: 'illuminate',
    name: '発光',
    description: '毎ターン終了時に相手の命中率-1',
    trigger: 'on_turn_end',
  },
  light_ward: {
    id: 'light_ward',
    name: '光の加護',
    description: '状態異常にかかりにくい（50%で無効）',
    trigger: 'passive',
  },
  magic_guard: {
    id: 'magic_guard',
    name: 'マジックガード',
    description: '直接攻撃以外のダメージ無効',
    trigger: 'passive',
  },
  
  // 闇系
  prankster: {
    id: 'prankster',
    name: '悪戯心',
    description: '変化技の優先度+1',
    trigger: 'on_attack',
  },
  cursed_body: {
    id: 'cursed_body',
    name: '呪われボディ',
    description: '技を受けると30%で封印',
    trigger: 'on_hit',
  },
  pressure: {
    id: 'pressure',
    name: 'プレッシャー',
    description: '相手の技のマナ消費+1',
    trigger: 'passive',
  },
  
  // 雷系
  static: {
    id: 'static',
    name: '静電気',
    description: '接触技を受けると30%で麻痺',
    trigger: 'on_hit',
  },
  volt_absorb: {
    id: 'volt_absorb',
    name: '蓄電',
    description: '雷技を受けるとHP回復',
    trigger: 'on_hit',
  },
  motor_drive: {
    id: 'motor_drive',
    name: '電気エンジン',
    description: '雷技を受けると素早さ上昇',
    trigger: 'on_hit',
  },
  lightning_rod: {
    id: 'lightning_rod',
    name: '避雷針',
    description: '雷技を吸収しMAG+1',
    trigger: 'on_hit',
  },
  
  // 氷系
  snow_cloak: {
    id: 'snow_cloak',
    name: '雪隠れ',
    description: '雪時に回避率上昇',
    trigger: 'on_weather',
  },
  ice_body: {
    id: 'ice_body',
    name: 'アイスボディ',
    description: '雪時にHP回復',
    trigger: 'on_weather',
  },
  snow_warning: {
    id: 'snow_warning',
    name: '雪降らし',
    description: '登場時に雪を降らせる',
    trigger: 'on_enter',
  },
  thick_fat: {
    id: 'thick_fat',
    name: '厚い脂肪',
    description: '炎・氷技ダメージ半減',
    trigger: 'on_hit',
  },
  
  // その他
  moxie: {
    id: 'moxie',
    name: '自信過剰',
    description: '敵を倒すとATK+1',
    trigger: 'on_attack',
  },
  speed_boost: {
    id: 'speed_boost',
    name: '加速',
    description: '毎ターンSPD+1',
    trigger: 'on_turn_end',
  },
  regenerator: {
    id: 'regenerator',
    name: '再生力',
    description: '交代時にHP1/3回復',
    trigger: 'on_switch',
  },
  shell_armor: {
    id: 'shell_armor',
    name: 'シェルアーマー',
    description: '急所に当たらない',
    trigger: 'passive',
  },
  sniper: {
    id: 'sniper',
    name: 'スナイパー',
    description: '急所時ダメージ2.25倍',
    trigger: 'on_attack',
  },
  super_luck: {
    id: 'super_luck',
    name: 'きょううん',
    description: '急所率+1段階',
    trigger: 'passive',
  },
  rivalry: {
    id: 'rivalry',
    name: '闘争心',
    description: '同性相手に攻撃1.25倍',
    trigger: 'on_attack',
  },
  defiant: {
    id: 'defiant',
    name: '負けん気',
    description: '能力を下げられるとATK+2',
    trigger: 'on_hit',
  },
  inner_focus: {
    id: 'inner_focus',
    name: '精神力',
    description: 'ひるまない',
    trigger: 'passive',
  },
  healer: {
    id: 'healer',
    name: '癒しの心',
    description: 'ターン終了時に味方回復（ダブル用、ここでは自分のHP5%回復）',
    trigger: 'on_turn_end',
  },
  hydration: {
    id: 'hydration',
    name: 'うるおいボディ',
    description: '雨時に状態異常回復',
    trigger: 'on_weather',
  },
  drought: {
    id: 'drought',
    name: '日照り',
    description: '登場時に晴れ',
    trigger: 'on_enter',
  },
  chlorophyll: {
    id: 'chlorophyll',
    name: '葉緑素',
    description: '晴れ時に素早さ2倍',
    trigger: 'on_weather',
  },
  illusion: {
    id: 'illusion',
    name: 'イリュージョン',
    description: '最後尾のモンスターに化ける',
    trigger: 'on_enter',
  },
  rough_skin: {
    id: 'rough_skin',
    name: '鮫肌',
    description: '接触技で1/8ダメージ',
    trigger: 'on_hit',
  },
  magic_mirror: {
    id: 'magic_mirror',
    name: 'マジックミラー',
    description: '変化技を跳ね返す',
    trigger: 'on_hit',
  },
  contrary: {
    id: 'contrary',
    name: '天邪鬼',
    description: '能力変化が逆転',
    trigger: 'passive',
  },
  natural_cure: {
    id: 'natural_cure',
    name: '自然回復',
    description: '交代時に状態異常回復',
    trigger: 'on_switch',
  },
  phoenix: {
    id: 'phoenix',
    name: '不死鳥',
    description: '1回だけHP1で復活',
    trigger: 'on_hit',
  },
  chaos_power: {
    id: 'chaos_power',
    name: '混沌の力',
    description: '技タイプがランダムで炎か氷に変化',
    trigger: 'on_attack',
  },
  battery: {
    id: 'battery',
    name: 'バッテリー',
    description: '味方の特殊技威力1.3倍（ダブル用、ここではMAG永続+1）',
    trigger: 'on_enter',
  },
  web_trap: {
    id: 'web_trap',
    name: '蜘蛛の巣',
    description: '相手は逃げられない',
    trigger: 'passive',
  },
  poison_touch: {
    id: 'poison_touch',
    name: '毒手',
    description: '接触技で30%毒',
    trigger: 'on_attack',
  },
  weak_armor: {
    id: 'weak_armor',
    name: '砕ける鎧',
    description: '物理被弾でDEF-1、SPD+2',
    trigger: 'on_hit',
  },
  heat_proof: {
    id: 'heat_proof',
    name: '耐熱',
    description: '炎技ダメージ半減',
    trigger: 'on_hit',
  },
};

// ============================================
// 御三家（490族）
// ============================================

const starterMonsters: MonsterSpecies[] = [
  {
    id: 'flameoo',
    name: 'フレイムー',
    types: ['fire'],
    baseStats: { hp: 80, atk: 95, def: 60, spd: 90, mag: 95, res: 70 },
    statTier: 'starter',
    abilities: ['blaze'],
    skillPool: ['fireball', 'fire_punch', 'intimidate', 'flamethrower'],
    fixedAbility: 'blaze',
    fixedSkills: ['fireball', 'fire_punch', 'intimidate', 'flamethrower'],
    isStarter: true,
    description: '炎の子犬。情熱的で攻撃的なスタンダード。',
  },
  {
    id: 'frosty',
    name: 'フロスティ',
    types: ['ice'],
    baseStats: { hp: 85, atk: 70, def: 80, spd: 80, mag: 95, res: 80 },
    statTier: 'starter',
    abilities: ['snow_cloak'],
    skillPool: ['ice_beam', 'ice_breath', 'aurora_veil', 'blizzard'],
    fixedAbility: 'snow_cloak',
    fixedSkills: ['ice_beam', 'powder_snow', 'protect', 'blizzard'],
    isStarter: true,
    description: '氷の妖精。バランスの取れた万能型。',
  },
  {
    id: 'gale_wing',
    name: 'ゲイルウィング',
    types: ['wind'],
    baseStats: { hp: 70, atk: 90, def: 55, spd: 110, mag: 85, res: 80 },
    statTier: 'starter',
    abilities: ['gale_wings'],
    skillPool: ['air_slash', 'extreme_speed', 'tailwind', 'hurricane'],
    fixedAbility: 'gale_wings',
    fixedSkills: ['air_slash', 'extreme_speed', 'tailwind', 'hurricane'],
    isStarter: true,
    description: '風の小鳥。圧倒的なスピードで翻弄する。',
  },
];

// ============================================
// 早熟モンスター（450族）
// ============================================

const earlyMonsters: MonsterSpecies[] = [
  {
    id: 'sparky',
    name: 'スパーキー',
    types: ['thunder'],
    baseStats: { hp: 55, atk: 60, def: 40, spd: 110, mag: 95, res: 90 },
    statTier: 'early',
    abilities: ['static', 'volt_absorb'],
    skillPool: ['quick_attack', 'thunderbolt', 'thunder_wave', 'thunder', 'volt_switch', 'charge_beam', 'spark', 'zap_cannon'],
    description: '電気ネズミ。素早さと特攻で速攻を仕掛ける。',
  },
  {
    id: 'aquan',
    name: 'アクアン',
    types: ['water'],
    baseStats: { hp: 95, atk: 50, def: 70, spd: 60, mag: 85, res: 90 },
    statTier: 'early',
    abilities: ['water_absorb', 'damp'],
    skillPool: ['bubble', 'surf', 'recover', 'protect', 'aqua_jet', 'muddy_water', 'hydro_pump', 'rest'],
    description: '水玉スライム。高耐久で粘り強く戦う。',
  },
  {
    id: 'rocky',
    name: 'ロッキー',
    types: ['earth'],
    baseStats: { hp: 80, atk: 85, def: 100, spd: 30, mag: 45, res: 110 },
    statTier: 'early',
    abilities: ['sturdy', 'sand_veil'],
    skillPool: ['rock_tomb', 'earthquake', 'stealth_rock', 'stone_edge', 'bulk_up', 'sandstorm', 'earth_power', 'protect'],
    description: '岩ゴーレム（小）。鉄壁の防御で耐える。',
  },
  {
    id: 'shadeling',
    name: 'シェイドリング',
    types: ['dark'],
    baseStats: { hp: 65, atk: 55, def: 55, spd: 95, mag: 100, res: 80 },
    statTier: 'early',
    abilities: ['prankster', 'cursed_body'],
    skillPool: ['shadow_ball', 'nightmare', 'dark_hole', 'dark_pulse', 'disable', 'taunt', 'substitute', 'memento'],
    description: '影の輪っか。変化技で相手を翻弄する。',
  },
  {
    id: 'luminous',
    name: 'ルミナス',
    types: ['light'],
    baseStats: { hp: 75, atk: 45, def: 65, spd: 85, mag: 95, res: 85 },
    statTier: 'early',
    abilities: ['illuminate', 'light_ward'],
    skillPool: ['flash', 'holy_ray', 'recover', 'moonforce', 'light_pillar', 'calm_mind', 'protect', 'morning_sun'],
    description: '光る玉。サポートと特殊攻撃を両立。',
  },
  {
    id: 'ember_cat',
    name: 'エンバーキャット',
    types: ['fire'],
    baseStats: { hp: 65, atk: 95, def: 50, spd: 95, mag: 75, res: 70 },
    statTier: 'early',
    abilities: ['super_luck', 'rivalry'],
    skillPool: ['fire_punch', 'fury_cutter', 'nitro_charge', 'blaze_kick', 'flare_drive', 'taunt', 'extreme_speed', 'swords_dance'],
    description: '炎猫。急所狙いの高速アタッカー。',
  },
  {
    id: 'blizzap',
    name: 'ブリザップ',
    types: ['ice'],
    baseStats: { hp: 70, atk: 45, def: 60, spd: 75, mag: 105, res: 95 },
    statTier: 'early',
    abilities: ['ice_body', 'snow_warning'],
    skillPool: ['ice_shard', 'ice_beam', 'blizzard', 'freeze_dry', 'icicle_crash', 'calm_mind', 'sheer_cold', 'protect'],
    description: '氷の子ペンギン。特殊アタッカー。',
  },
  {
    id: 'storm_wolf',
    name: 'ストームウルフ',
    types: ['wind'],
    baseStats: { hp: 70, atk: 100, def: 60, spd: 95, mag: 55, res: 70 },
    statTier: 'early',
    abilities: ['infiltrator', 'intimidate'],
    skillPool: ['aerial_ace', 'brave_bird', 'tailwind', 'air_slash', 'drill_peck', 'u_turn', 'hurricane', 'extreme_speed'],
    description: '風の狼。壁を無視して攻める物理アタッカー。',
  },
  {
    id: 'magma_beetle',
    name: 'マグマビートル',
    types: ['fire', 'earth'],
    baseStats: { hp: 80, atk: 90, def: 85, spd: 35, mag: 60, res: 100 },
    statTier: 'early',
    abilities: ['flame_body', 'heat_proof'],
    skillPool: ['fireball', 'earthquake', 'rock_tomb', 'flare_drive', 'bulk_up', 'nitro_charge', 'earth_power', 'protect'],
    description: '溶岩カブト虫。高耐久の物理アタッカー。',
  },
  {
    id: 'mist_fairy',
    name: 'ミストフェアリー',
    types: ['water', 'light'],
    baseStats: { hp: 85, atk: 40, def: 60, spd: 70, mag: 90, res: 105 },
    statTier: 'early',
    abilities: ['healer', 'hydration'],
    skillPool: ['recover', 'moonforce', 'surf', 'protect', 'wish', 'calm_mind', 'substitute', 'rest'],
    description: '霧の妖精。回復とサポートの要。',
  },
  {
    id: 'dust_devil',
    name: 'ダストデビル',
    types: ['wind', 'earth'],
    baseStats: { hp: 70, atk: 75, def: 65, spd: 90, mag: 80, res: 70 },
    statTier: 'early',
    abilities: ['sand_stream', 'sand_veil'],
    skillPool: ['sandstorm', 'air_slash', 'earth_power', 'rock_tomb', 'substitute', 'protect', 'hurricane', 'stone_edge'],
    description: '砂塵の悪魔。砂嵐を起こして戦う。',
  },
  {
    id: 'bolt_eel',
    name: 'ボルトイール',
    types: ['thunder', 'water'],
    baseStats: { hp: 75, atk: 50, def: 55, spd: 80, mag: 105, res: 85 },
    statTier: 'early',
    abilities: ['volt_absorb', 'motor_drive'],
    skillPool: ['thunderbolt', 'surf', 'thunder', 'volt_switch', 'thunder_wave', 'aqua_jet', 'hydro_pump', 'charge_beam'],
    description: '電気ウナギ。水雷の特殊アタッカー。',
  },
  {
    id: 'shadow_bat',
    name: 'シャドウバット',
    types: ['dark', 'wind'],
    baseStats: { hp: 60, atk: 70, def: 45, spd: 110, mag: 85, res: 80 },
    statTier: 'early',
    abilities: ['infiltrator', 'inner_focus'],
    skillPool: ['shadow_ball', 'air_slash', 'hypnosis', 'dark_pulse', 'u_turn', 'taunt', 'substitute', 'hurricane'],
    description: '影蝙蝠。高速で撹乱する。',
  },
  {
    id: 'solar_flower',
    name: 'ソーラーフラワー',
    types: ['light', 'earth'],
    baseStats: { hp: 80, atk: 50, def: 75, spd: 55, mag: 95, res: 95 },
    statTier: 'early',
    abilities: ['drought', 'chlorophyll'],
    skillPool: ['moonforce', 'earth_power', 'morning_sun', 'holy_ray', 'protect', 'calm_mind', 'stealth_rock', 'recover'],
    description: '太陽の花。晴れパのサポーター。',
  },
  {
    id: 'crystal_snake',
    name: 'クリスタルスネーク',
    types: ['ice', 'thunder'],
    baseStats: { hp: 60, atk: 45, def: 55, spd: 85, mag: 110, res: 95 },
    statTier: 'early',
    abilities: ['snow_cloak', 'static'],
    skillPool: ['ice_beam', 'thunderbolt', 'blizzard', 'thunder', 'thunder_wave', 'ice_fang', 'protect', 'coil'],
    description: '氷の結晶蛇。氷雷の特殊火力。',
  },
];

// ============================================
// 普通モンスター（490族）
// ============================================

const normalMonsters: MonsterSpecies[] = [
  {
    id: 'thunder_hawk',
    name: 'サンダーホーク',
    types: ['thunder', 'wind'],
    baseStats: { hp: 70, atk: 95, def: 55, spd: 105, mag: 90, res: 75 },
    statTier: 'normal',
    abilities: ['gale_wings', 'lightning_rod'],
    skillPool: ['quick_attack', 'brave_bird', 'thunderbolt', 'u_turn', 'volt_switch', 'air_slash', 'tailwind', 'thunder'],
    description: '雷鳥。先制アタッカー。',
  },
  {
    id: 'coral_golem',
    name: 'コーラルゴーレム',
    types: ['water', 'earth'],
    baseStats: { hp: 95, atk: 70, def: 100, spd: 35, mag: 70, res: 120 },
    statTier: 'normal',
    abilities: ['regenerator', 'water_absorb'],
    skillPool: ['surf', 'earthquake', 'recover', 'stealth_rock', 'stone_edge', 'protect', 'earth_power', 'rest'],
    description: '珊瑚の守護者。物理受けの要。',
  },
  {
    id: 'shadow_fox',
    name: 'シャドウフォックス',
    types: ['dark', 'fire'],
    baseStats: { hp: 65, atk: 70, def: 55, spd: 110, mag: 105, res: 85 },
    statTier: 'normal',
    abilities: ['illusion', 'prankster'],
    skillPool: ['dark_pulse', 'flamethrower', 'taunt', 'substitute', 'will_o_wisp', 'overheat', 'hypnosis', 'memento'],
    description: '妖狐。イリュージョンで騙す。',
  },
  {
    id: 'ice_ghost',
    name: 'アイスゴースト',
    types: ['ice', 'dark'],
    baseStats: { hp: 60, atk: 50, def: 60, spd: 95, mag: 115, res: 110 },
    statTier: 'normal',
    abilities: ['cursed_body', 'snow_cloak'],
    skillPool: ['shadow_ball', 'ice_beam', 'blizzard', 'memento', 'will_o_wisp', 'nightmare', 'sheer_cold', 'protect'],
    description: '凍える亡霊。高特攻の特殊アタッカー。',
  },
  {
    id: 'solar_lion',
    name: 'ソーラーライオン',
    types: ['light', 'fire'],
    baseStats: { hp: 85, atk: 110, def: 70, spd: 95, mag: 75, res: 55 },
    statTier: 'normal',
    abilities: ['drought', 'intimidate'],
    skillPool: ['flare_drive', 'holy_blade', 'nitro_charge', 'morning_sun', 'wild_bolt', 'swords_dance', 'protect', 'extreme_speed'],
    description: '太陽の獅子。晴れパの物理エース。',
  },
  {
    id: 'venom_spider',
    name: 'ヴェノムスパイダー',
    types: ['dark', 'water'],
    baseStats: { hp: 70, atk: 85, def: 75, spd: 90, mag: 85, res: 85 },
    statTier: 'normal',
    abilities: ['poison_touch', 'web_trap'],
    skillPool: ['toxic', 'aqua_jet', 'disable', 'dark_pulse', 'surf', 'substitute', 'protect', 'taunt'],
    description: '毒蜘蛛。状態異常撒き。',
  },
  {
    id: 'crystal_bear',
    name: 'クリスタルベア',
    types: ['ice', 'earth'],
    baseStats: { hp: 100, atk: 100, def: 85, spd: 45, mag: 60, res: 100 },
    statTier: 'normal',
    abilities: ['thick_fat', 'sturdy'],
    skillPool: ['icicle_crash', 'earthquake', 'bulk_up', 'rest', 'stone_edge', 'ice_punch', 'protect', 'recover'],
    description: '氷晶の熊。物理タンク。',
  },
  {
    id: 'storm_eagle',
    name: 'ストームイーグル',
    types: ['wind', 'thunder'],
    baseStats: { hp: 75, atk: 90, def: 60, spd: 105, mag: 95, res: 65 },
    statTier: 'normal',
    abilities: ['motor_drive', 'infiltrator'],
    skillPool: ['brave_bird', 'thunder', 'volt_switch', 'u_turn', 'air_slash', 'thunderbolt', 'tailwind', 'hurricane'],
    description: '嵐の鷲。高速両刀。',
  },
  {
    id: 'holy_elk',
    name: 'ホーリーエルク',
    types: ['light', 'earth'],
    baseStats: { hp: 90, atk: 60, def: 80, spd: 80, mag: 90, res: 90 },
    statTier: 'normal',
    abilities: ['natural_cure', 'regenerator'],
    skillPool: ['moonforce', 'earth_power', 'recover', 'protect', 'stealth_rock', 'calm_mind', 'earthquake', 'wish'],
    description: '聖なる鹿。回復サポート。',
  },
  {
    id: 'magma_serpent',
    name: 'マグマサーペント',
    types: ['fire', 'earth'],
    baseStats: { hp: 85, atk: 75, def: 80, spd: 50, mag: 110, res: 90 },
    statTier: 'normal',
    abilities: ['flame_body', 'weak_armor'],
    skillPool: ['overheat', 'earth_power', 'flamethrower', 'stealth_rock', 'protect', 'calm_mind', 'inferno', 'recover'],
    description: '溶岩蛇。鈍足高火力。',
  },
];

// ============================================
// 晩成モンスター（530族）
// ============================================

const lateMonsters: MonsterSpecies[] = [
  {
    id: 'inferno_dragon',
    name: 'インフェルノドラゴン',
    types: ['fire', 'dark'],
    baseStats: { hp: 90, atk: 125, def: 70, spd: 95, mag: 95, res: 55 },
    statTier: 'late',
    abilities: ['intimidate', 'moxie'],
    skillPool: ['flare_drive', 'dark_pulse', 'earthquake', 'dragon_dance', 'crunch', 'nitro_charge', 'overheat', 'swords_dance'],
    description: '地獄の竜。超火力の物理アタッカー。',
  },
  {
    id: 'leviathan',
    name: 'レヴィアタン',
    types: ['water', 'dark'],
    baseStats: { hp: 110, atk: 90, def: 85, spd: 55, mag: 100, res: 90 },
    statTier: 'late',
    abilities: ['intimidate', 'regenerator'],
    skillPool: ['hydro_pump', 'dark_pulse', 'muddy_water', 'taunt', 'rest', 'recover', 'surf', 'protect'],
    description: '深海の怪物。耐久アタッカー。',
  },
  {
    id: 'titan_golem',
    name: 'タイタンゴーレム',
    types: ['earth', 'thunder'],
    baseStats: { hp: 105, atk: 95, def: 120, spd: 35, mag: 60, res: 115 },
    statTier: 'late',
    abilities: ['sturdy', 'battery'],
    skillPool: ['earthquake', 'wild_bolt', 'stealth_rock', 'bulk_up', 'thunder', 'stone_edge', 'protect', 'recover'],
    description: '巨岩の番人。超耐久。',
  },
  {
    id: 'phoenix',
    name: 'フェニックス',
    types: ['fire', 'light'],
    baseStats: { hp: 90, atk: 80, def: 65, spd: 100, mag: 110, res: 85 },
    statTier: 'late',
    abilities: ['phoenix', 'flame_body'],
    skillPool: ['overheat', 'holy_ray', 'u_turn', 'calm_mind', 'nitro_charge', 'moonforce', 'recover', 'morning_sun'],
    description: '不死鳥。1度だけ復活する。',
  },
  {
    id: 'abyss_shark',
    name: 'アビスシャーク',
    types: ['water', 'ice'],
    baseStats: { hp: 85, atk: 120, def: 75, spd: 95, mag: 70, res: 85 },
    statTier: 'late',
    abilities: ['rough_skin', 'speed_boost'],
    skillPool: ['aqua_jet', 'icicle_crash', 'crunch', 'waterfall', 'ice_punch', 'swords_dance', 'protect', 'ice_shard'],
    description: '深海の氷鮫。加速する物理アタッカー。',
  },
  {
    id: 'thunder_lord',
    name: 'サンダーロード',
    types: ['thunder', 'wind'],
    baseStats: { hp: 85, atk: 70, def: 70, spd: 115, mag: 115, res: 75 },
    statTier: 'late',
    abilities: ['motor_drive', 'volt_absorb'],
    skillPool: ['thunder', 'hurricane', 'drizzle', 'volt_switch', 'air_slash', 'thunder_wave', 'thunderbolt', 'u_turn'],
    description: '雷雲の王。天候マスター。',
  },
  {
    id: 'ancient_tortoise',
    name: 'エンシェントトータス',
    types: ['earth', 'water'],
    baseStats: { hp: 120, atk: 65, def: 115, spd: 25, mag: 75, res: 130 },
    statTier: 'late',
    abilities: ['shell_armor', 'water_absorb'],
    skillPool: ['earthquake', 'surf', 'stealth_rock', 'rest', 'stone_edge', 'protect', 'earth_power', 'recover'],
    description: '古代亀。最高耐久。',
  },
  {
    id: 'holy_unicorn',
    name: 'ホーリーユニコーン',
    types: ['light', 'wind'],
    baseStats: { hp: 90, atk: 60, def: 75, spd: 105, mag: 105, res: 95 },
    statTier: 'late',
    abilities: ['healer', 'magic_guard'],
    skillPool: ['moonforce', 'recover', 'protect', 'calm_mind', 'tailwind', 'wish', 'holy_ray', 'substitute'],
    description: '聖なる一角獣。サポート特化。',
  },
  {
    id: 'dark_knight',
    name: 'ダークナイト',
    types: ['dark', 'thunder'],
    baseStats: { hp: 90, atk: 110, def: 85, spd: 85, mag: 85, res: 75 },
    statTier: 'late',
    abilities: ['defiant', 'intimidate'],
    skillPool: ['dark_pulse', 'wild_bolt', 'swords_dance', 'sucker_punch', 'crunch', 'thunderbolt', 'protect', 'nasty_plot'],
    description: '暗黒騎士。バランス型強者。',
  },
  {
    id: 'blizzard_mammoth',
    name: 'ブリザードマンモス',
    types: ['ice', 'earth'],
    baseStats: { hp: 105, atk: 125, def: 90, spd: 50, mag: 55, res: 105 },
    statTier: 'late',
    abilities: ['thick_fat', 'snow_warning'],
    skillPool: ['earthquake', 'icicle_crash', 'stone_edge', 'ice_shard', 'stealth_rock', 'blizzard', 'bulk_up', 'protect'],
    description: '氷河の巨獣。物理特化。',
  },
  {
    id: 'soul_reaper',
    name: 'ソウルリーパー',
    types: ['dark', 'light'],
    baseStats: { hp: 80, atk: 75, def: 65, spd: 95, mag: 120, res: 95 },
    statTier: 'late',
    abilities: ['cursed_body', 'magic_mirror'],
    skillPool: ['shadow_ball', 'moonforce', 'calm_mind', 'nasty_plot', 'memento', 'holy_ray', 'nightmare', 'protect'],
    description: '魂狩り。二面性の特殊アタッカー。',
  },
  {
    id: 'chaos_dragon',
    name: 'カオスドラゴン',
    types: ['fire', 'ice'],
    baseStats: { hp: 95, atk: 95, def: 75, spd: 90, mag: 100, res: 75 },
    statTier: 'late',
    abilities: ['chaos_power', 'contrary'],
    skillPool: ['overheat', 'blizzard', 'flare_drive', 'ice_beam', 'dragon_dance', 'protect', 'calm_mind', 'recover'],
    description: '混沌の竜。究極のロマン。',
  },
];

// ============================================
// 全モンスターデータをエクスポート
// ============================================

export const ALL_MONSTERS: MonsterSpecies[] = [
  ...starterMonsters,
  ...earlyMonsters,
  ...normalMonsters,
  ...lateMonsters,
];

/** IDからモンスターを取得 */
export function getMonsterById(id: string): MonsterSpecies | undefined {
  return ALL_MONSTERS.find(m => m.id === id);
}

/** 種族値カテゴリからモンスターを取得 */
export function getMonstersByTier(tier: MonsterSpecies['statTier']): MonsterSpecies[] {
  return ALL_MONSTERS.filter(m => m.statTier === tier);
}

/** 御三家を取得 */
export function getStarters(): MonsterSpecies[] {
  return ALL_MONSTERS.filter(m => m.isStarter);
}

/** 特性IDから特性を取得 */
export function getAbilityById(id: string): Ability | undefined {
  return ABILITIES[id];
}

// モンスター総数
export const MONSTER_COUNT = ALL_MONSTERS.length;
