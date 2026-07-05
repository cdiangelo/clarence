// Club catalog — 88 real models, seed data for clubs_catalog table
// category: blade | players_cb | players_distance | game_improvement | max_gi | standard
// type: driver | fw | hybrid | iron | wedge | putter

export interface ClubModel {
  id: string;
  brand: string;
  family: string;
  model: string;
  year: number;
  type: 'driver' | 'fw' | 'hybrid' | 'iron' | 'wedge' | 'putter';
  category: 'blade' | 'players_cb' | 'players_distance' | 'game_improvement' | 'max_gi' | 'standard';
  stockShaft: string;
  stockLoft?: number;       // degrees (driver, fw, woods)
  stock7iLoft?: number;     // degrees (iron sets)
  carryBase?: number;       // yards at reference slot (7i for irons, face loft for others)
}

// Carry estimates by slot (yards, mid-handicap baseline)
// Iron carries are offset from 7i carryBase
export const IRON_SLOT_OFFSETS: Record<string, number> = {
  '3i': 30, '4i': 20, '5i': 15, '6i': 10, '7i': 0,
  '8i': -10, '9i': -20, 'PW': -30, 'GW': -38, 'SW': -46, 'LW': -55,
};

// Category baselines for 7i carry
export const CATEGORY_7I_CARRY: Record<string, number> = {
  blade: 140,
  players_cb: 148,
  players_distance: 155,
  game_improvement: 160,
  max_gi: 165,
};

// Wedge carry by loft (mid-handicap)
export const WEDGE_CARRY_BY_LOFT: Record<number, number> = {
  46: 130, 48: 125, 50: 118, 52: 112, 54: 106, 56: 100, 58: 90, 60: 80, 62: 72,
};

// Driver/FW/Hybrid reference carries
export const DRIVER_CARRY_BY_CATEGORY: Record<string, number> = {
  max_gi: 245, game_improvement: 238, players_distance: 230, players_cb: 225, blade: 220, standard: 235,
};

export const FW3_CARRY = 225;
export const FW5_CARRY = 210;
export const FW7_CARRY = 200;
export const HYB3_CARRY = 210;
export const HYB4_CARRY = 200;
export const HYB5_CARRY = 190;

export const CLUBS: ClubModel[] = [
  // ─── CALLAWAY ───────────────────────────────────────────────
  { id: 'cal-paradym-aismax-dr-24', brand:'Callaway', family:'Paradym Ai Smoke', model:'Max Driver', year:2024, type:'driver', category:'max_gi', stockShaft:'Fujikura Ventus Red 5', stockLoft:9, carryBase:248 },
  { id: 'cal-paradym-aismls-dr-24', brand:'Callaway', family:'Paradym Ai Smoke', model:'Max LS Driver', year:2024, type:'driver', category:'players_distance', stockShaft:'Fujikura Ventus Black 6', stockLoft:9, carryBase:242 },
  { id: 'cal-paradym-aism-dr-24',   brand:'Callaway', family:'Paradym Ai Smoke', model:'Triple Diamond Driver', year:2024, type:'driver', category:'players_cb', stockShaft:'Fujikura Ventus Black 6', stockLoft:9, carryBase:235 },
  { id: 'cal-paradym-aism-3w-24',   brand:'Callaway', family:'Paradym Ai Smoke', model:'Max 3-Wood', year:2024, type:'fw', category:'max_gi', stockShaft:'Fujikura Ventus Red 5', stockLoft:15, carryBase:225 },
  { id: 'cal-paradym-aism-5w-24',   brand:'Callaway', family:'Paradym Ai Smoke', model:'Max 5-Wood', year:2024, type:'fw', category:'max_gi', stockShaft:'Fujikura Ventus Red 5', stockLoft:18, carryBase:210 },
  { id: 'cal-apex-uw-3h-24',        brand:'Callaway', family:'Apex', model:'UW 3-Hybrid', year:2024, type:'hybrid', category:'players_distance', stockShaft:'True Temper Elevate EX 95', stockLoft:19, carryBase:208 },
  { id: 'cal-apex-pro24-iron',      brand:'Callaway', family:'Apex Pro', model:'24 Irons', year:2024, type:'iron', category:'players_distance', stockShaft:'True Temper Elevate EX 95', stock7iLoft:34, carryBase:154 },
  { id: 'cal-apex-ai200-iron',      brand:'Callaway', family:'Apex Ai', model:'200 Irons', year:2024, type:'iron', category:'game_improvement', stockShaft:'True Temper Elevate 95', stock7iLoft:31, carryBase:162 },
  { id: 'cal-apex-ai300-iron',      brand:'Callaway', family:'Apex Ai', model:'300 Irons', year:2024, type:'iron', category:'max_gi', stockShaft:'True Temper Elevate 95', stock7iLoft:29, carryBase:167 },
  { id: 'cal-elyte-iron-25',        brand:'Callaway', family:'Elyte', model:'Irons', year:2025, type:'iron', category:'game_improvement', stockShaft:'KBS Max MT 85', stock7iLoft:30, carryBase:163 },
  { id: 'cal-opus-50',              brand:'Callaway', family:'Opus', model:'50° Wedge', year:2024, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold Spinner', stockLoft:50, carryBase:118 },
  { id: 'cal-opus-56',              brand:'Callaway', family:'Opus', model:'56° Wedge', year:2024, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold Spinner', stockLoft:56, carryBase:100 },
  { id: 'cal-opus-60',              brand:'Callaway', family:'Opus', model:'60° Wedge', year:2024, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold Spinner', stockLoft:60, carryBase:80 },

  // ─── TAYLORMADE ─────────────────────────────────────────────
  { id: 'tm-qi10max-dr-24',         brand:'TaylorMade', family:'Qi10', model:'Max Driver', year:2024, type:'driver', category:'max_gi', stockShaft:'Fujikura Speeder NX Black 50', stockLoft:9, carryBase:250 },
  { id: 'tm-qi10-dr-24',            brand:'TaylorMade', family:'Qi10', model:'Driver', year:2024, type:'driver', category:'players_distance', stockShaft:'Fujikura Ventus TR Blue 6', stockLoft:9, carryBase:243 },
  { id: 'tm-qi10lst-dr-24',         brand:'TaylorMade', family:'Qi10', model:'LS Driver', year:2024, type:'driver', category:'players_cb', stockShaft:'Fujikura Ventus TR Black 6', stockLoft:9, carryBase:238 },
  { id: 'tm-qi10-3w-24',            brand:'TaylorMade', family:'Qi10', model:'Max 3-Wood', year:2024, type:'fw', category:'max_gi', stockShaft:'Fujikura Speeder NX Black 50', stockLoft:16, carryBase:223 },
  { id: 'tm-qi10-7w-24',            brand:'TaylorMade', family:'Qi10', model:'7-Wood', year:2024, type:'fw', category:'game_improvement', stockShaft:'Fujikura Speeder NX 55', stockLoft:21, carryBase:202 },
  { id: 'tm-p790-iron-23',          brand:'TaylorMade', family:'P Series', model:'P790 Irons', year:2023, type:'iron', category:'players_distance', stockShaft:'KBS Tour 120', stock7iLoft:34, carryBase:155 },
  { id: 'tm-p770-iron-23',          brand:'TaylorMade', family:'P Series', model:'P770 Irons', year:2023, type:'iron', category:'players_cb', stockShaft:'KBS Tour 130', stock7iLoft:36, carryBase:148 },
  { id: 'tm-p7cb-iron-23',          brand:'TaylorMade', family:'P Series', model:'P7CB Irons', year:2023, type:'iron', category:'players_cb', stockShaft:'KBS Tour 130', stock7iLoft:37, carryBase:145 },
  { id: 'tm-p7mb-iron-23',          brand:'TaylorMade', family:'P Series', model:'P7MB Irons', year:2023, type:'iron', category:'blade', stockShaft:'KBS Tour V 120', stock7iLoft:37.5, carryBase:140 },
  { id: 'tm-mg4-50',                brand:'TaylorMade', family:'MG4', model:'50° Wedge', year:2024, type:'wedge', category:'standard', stockShaft:'KBS Hi-Rev 2.0 115', stockLoft:50, carryBase:118 },
  { id: 'tm-mg4-54',                brand:'TaylorMade', family:'MG4', model:'54° Wedge', year:2024, type:'wedge', category:'standard', stockShaft:'KBS Hi-Rev 2.0 115', stockLoft:54, carryBase:106 },
  { id: 'tm-mg4-58',                brand:'TaylorMade', family:'MG4', model:'58° Wedge', year:2024, type:'wedge', category:'standard', stockShaft:'KBS Hi-Rev 2.0 115', stockLoft:58, carryBase:90 },
  { id: 'tm-spider-tour-24',        brand:'TaylorMade', family:'Spider', model:'Spider Tour Black Putter', year:2024, type:'putter', category:'standard', stockShaft:'KBS CT Tour' },
  { id: 'tm-spider-x-23',           brand:'TaylorMade', family:'Spider', model:'Spider X Putter', year:2023, type:'putter', category:'standard', stockShaft:'KBS CT Tour' },

  // ─── TITLEIST ────────────────────────────────────────────────
  { id: 'tit-gt2-dr-24',            brand:'Titleist', family:'GT', model:'GT2 Driver', year:2024, type:'driver', category:'players_distance', stockShaft:'HZRDUS Black 6X Gen 4', stockLoft:9, carryBase:238 },
  { id: 'tit-gt3-dr-24',            brand:'Titleist', family:'GT', model:'GT3 Driver', year:2024, type:'driver', category:'players_cb', stockShaft:'HZRDUS Black 6X Gen 4', stockLoft:9, carryBase:232 },
  { id: 'tit-gt2-3w-24',            brand:'Titleist', family:'GT', model:'GT2 3-Wood', year:2024, type:'fw', category:'players_distance', stockShaft:'HZRDUS Red 5G', stockLoft:15, carryBase:220 },
  { id: 'tit-t100-iron-23',         brand:'Titleist', family:'T Series', model:'T100 Irons', year:2023, type:'iron', category:'players_cb', stockShaft:'True Temper AMT Tour White', stock7iLoft:36, carryBase:147 },
  { id: 'tit-t150-iron-23',         brand:'Titleist', family:'T Series', model:'T150 Irons', year:2023, type:'iron', category:'players_cb', stockShaft:'True Temper AMT Tour White', stock7iLoft:35, carryBase:150 },
  { id: 'tit-t200-iron-23',         brand:'Titleist', family:'T Series', model:'T200 Irons', year:2023, type:'iron', category:'players_distance', stockShaft:'True Temper AMT Red', stock7iLoft:33, carryBase:157 },
  { id: 'tit-t350-iron-23',         brand:'Titleist', family:'T Series', model:'T350 Irons', year:2023, type:'iron', category:'game_improvement', stockShaft:'True Temper AMT Red', stock7iLoft:30, carryBase:164 },
  { id: 'tit-sm9-50',               brand:'Titleist', family:'Vokey SM9', model:'50° Wedge', year:2022, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold Wedge', stockLoft:50, carryBase:118 },
  { id: 'tit-sm9-56',               brand:'Titleist', family:'Vokey SM9', model:'56° Wedge', year:2022, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold Wedge', stockLoft:56, carryBase:100 },
  { id: 'tit-sm9-60',               brand:'Titleist', family:'Vokey SM9', model:'60° Wedge', year:2022, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold Wedge', stockLoft:60, carryBase:80 },
  { id: 'tit-sm10-50',              brand:'Titleist', family:'Vokey SM10', model:'50° Wedge', year:2024, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold Wedge', stockLoft:50, carryBase:118 },
  { id: 'tit-sm10-56',              brand:'Titleist', family:'Vokey SM10', model:'56° Wedge', year:2024, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold Wedge', stockLoft:56, carryBase:100 },
  { id: 'tit-sm10-60',              brand:'Titleist', family:'Vokey SM10', model:'60° Wedge', year:2024, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold Wedge', stockLoft:60, carryBase:80 },

  // ─── PING ────────────────────────────────────────────────────
  { id: 'png-g430max-dr-23',        brand:'Ping', family:'G430', model:'Max 10K Driver', year:2023, type:'driver', category:'max_gi', stockShaft:'ALTA CB Black 55', stockLoft:9, carryBase:250 },
  { id: 'png-g430lst-dr-23',        brand:'Ping', family:'G430', model:'LST Driver', year:2023, type:'driver', category:'players_distance', stockShaft:'PING Tour 2.0 Chrome 65', stockLoft:9, carryBase:240 },
  { id: 'png-g430-3w-23',           brand:'Ping', family:'G430', model:'Max 3-Wood', year:2023, type:'fw', category:'max_gi', stockShaft:'ALTA CB Black 55', stockLoft:15, carryBase:222 },
  { id: 'png-g430-3h-23',           brand:'Ping', family:'G430', model:'3-Hybrid', year:2023, type:'hybrid', category:'game_improvement', stockShaft:'ALTA CB Black 70', stockLoft:19, carryBase:207 },
  { id: 'png-blueprints-iron-23',   brand:'Ping', family:'Blueprint', model:'Blueprint S Irons', year:2023, type:'iron', category:'players_cb', stockShaft:'KBS Tour Lite', stock7iLoft:37, carryBase:145 },
  { id: 'png-blueprintt-iron-23',   brand:'Ping', family:'Blueprint', model:'Blueprint T Irons', year:2023, type:'iron', category:'blade', stockShaft:'KBS Tour 120', stock7iLoft:38, carryBase:140 },
  { id: 'png-i230-iron-22',         brand:'Ping', family:'i Series', model:'i230 Irons', year:2022, type:'iron', category:'players_distance', stockShaft:'AWT 2.0', stock7iLoft:32, carryBase:157 },
  { id: 'png-i525-iron-22',         brand:'Ping', family:'i Series', model:'i525 Irons', year:2022, type:'iron', category:'game_improvement', stockShaft:'AWT 2.0', stock7iLoft:29, carryBase:165 },
  { id: 'png-s159-iron-23',         brand:'Ping', family:'s159', model:'s159 Irons', year:2023, type:'iron', category:'players_cb', stockShaft:'KBS Tour Lite', stock7iLoft:36, carryBase:148 },
  { id: 'png-pld-anser-23',         brand:'Ping', family:'PLD', model:'PLD Milled Anser Putter', year:2023, type:'putter', category:'standard', stockShaft:'PING PP60' },
  { id: 'png-pld-birdseye-24',      brand:'Ping', family:'PLD', model:'PLD Milled Bird\'s Eye Putter', year:2024, type:'putter', category:'standard', stockShaft:'PING PP60' },

  // ─── MIZUNO ─────────────────────────────────────────────────
  { id: 'miz-stz230-dr-23',         brand:'Mizuno', family:'ST', model:'ST-Z 230 Driver', year:2023, type:'driver', category:'players_distance', stockShaft:'Fujikura Ventus Blue 6', stockLoft:9.5, carryBase:238 },
  { id: 'miz-pro241-iron-24',       brand:'Mizuno', family:'Pro', model:'Pro 241 Irons', year:2024, type:'iron', category:'blade', stockShaft:'True Temper Dynamic Gold 120', stock7iLoft:37, carryBase:140 },
  { id: 'miz-pro245-iron-24',       brand:'Mizuno', family:'Pro', model:'Pro 245 Irons', year:2024, type:'iron', category:'players_cb', stockShaft:'True Temper Dynamic Gold 105', stock7iLoft:36, carryBase:147 },
  { id: 'miz-pro243-iron-24',       brand:'Mizuno', family:'Pro', model:'Pro 243 Irons', year:2024, type:'iron', category:'players_distance', stockShaft:'True Temper Dynamic Gold 105', stock7iLoft:33, carryBase:155 },
  { id: 'miz-jpx925hm-iron-24',     brand:'Mizuno', family:'JPX 925', model:'JPX 925 Hot Metal Irons', year:2024, type:'iron', category:'game_improvement', stockShaft:'KBS Max MT 85', stock7iLoft:29, carryBase:165 },
  { id: 'miz-jpx925f-iron-24',      brand:'Mizuno', family:'JPX 925', model:'JPX 925 Forged Irons', year:2024, type:'iron', category:'players_cb', stockShaft:'True Temper Dynamic Gold 105', stock7iLoft:36, carryBase:149 },
  { id: 'miz-t24-50',               brand:'Mizuno', family:'T24', model:'T24 50° Wedge', year:2024, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold', stockLoft:50, carryBase:118 },
  { id: 'miz-t24-56',               brand:'Mizuno', family:'T24', model:'T24 56° Wedge', year:2024, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold', stockLoft:56, carryBase:100 },
  { id: 'miz-t24-60',               brand:'Mizuno', family:'T24', model:'T24 60° Wedge', year:2024, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold', stockLoft:60, carryBase:80 },

  // ─── SRIXON ─────────────────────────────────────────────────
  { id: 'srx-zx7mk2-dr-23',         brand:'Srixon', family:'ZX', model:'ZX7 Mk II Driver', year:2023, type:'driver', category:'players_cb', stockShaft:'Miyazaki C Kua 55', stockLoft:9.5, carryBase:233 },
  { id: 'srx-zx5mk2-dr-23',         brand:'Srixon', family:'ZX', model:'ZX5 Mk II Driver', year:2023, type:'driver', category:'players_distance', stockShaft:'Miyazaki C Kua 55', stockLoft:9.5, carryBase:240 },
  { id: 'srx-zx7mk2-iron-23',       brand:'Srixon', family:'ZX', model:'ZX7 Mk II Irons', year:2023, type:'iron', category:'players_cb', stockShaft:'True Temper Dynamic Gold 120', stock7iLoft:36.5, carryBase:146 },
  { id: 'srx-zx5mk2-iron-23',       brand:'Srixon', family:'ZX', model:'ZX5 Mk II Irons', year:2023, type:'iron', category:'players_distance', stockShaft:'True Temper Dynamic Gold 105', stock7iLoft:33, carryBase:155 },
  { id: 'srx-zxi-iron-25',          brand:'Srixon', family:'ZXi', model:'ZXi Irons', year:2025, type:'iron', category:'players_distance', stockShaft:'KBS Tour Lite', stock7iLoft:33, carryBase:156 },
  { id: 'srx-z945-50',              brand:'Srixon', family:'Z Series', model:'Z 945 50° Wedge', year:2023, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold', stockLoft:50, carryBase:118 },
  { id: 'srx-z945-56',              brand:'Srixon', family:'Z Series', model:'Z 945 56° Wedge', year:2023, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold', stockLoft:56, carryBase:100 },
  { id: 'srx-z945-60',              brand:'Srixon', family:'Z Series', model:'Z 945 60° Wedge', year:2023, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold', stockLoft:60, carryBase:80 },

  // ─── CLEVELAND ───────────────────────────────────────────────
  { id: 'cle-rtx6-50',              brand:'Cleveland', family:'RTX 6 ZipCore', model:'RTX 6 50° Wedge', year:2022, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold', stockLoft:50, carryBase:118 },
  { id: 'cle-rtx6-54',              brand:'Cleveland', family:'RTX 6 ZipCore', model:'RTX 6 54° Wedge', year:2022, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold', stockLoft:54, carryBase:106 },
  { id: 'cle-rtx6-58',              brand:'Cleveland', family:'RTX 6 ZipCore', model:'RTX 6 58° Wedge', year:2022, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold', stockLoft:58, carryBase:90 },
  { id: 'cle-rtx6-60',              brand:'Cleveland', family:'RTX 6 ZipCore', model:'RTX 6 60° Wedge', year:2022, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold', stockLoft:60, carryBase:80 },
  { id: 'cle-rtzc-56',              brand:'Cleveland', family:'RTX ZipCore', model:'RTZ ZipCore 56° Wedge', year:2020, type:'wedge', category:'standard', stockShaft:'True Temper Dynamic Gold', stockLoft:56, carryBase:100 },

  // ─── SCOTTY CAMERON (TITLEIST) ───────────────────────────────
  { id: 'sc-newport2-22',           brand:'Scotty Cameron', family:'Select', model:'Newport 2 Putter', year:2022, type:'putter', category:'standard', stockShaft:'Teryllium T9.5e' },
  { id: 'sc-phantom-x5-22',         brand:'Scotty Cameron', family:'Phantom', model:'Phantom X 5 Putter', year:2022, type:'putter', category:'standard', stockShaft:'Teryllium T9.5e' },
  { id: 'sc-supselect-np2p-23',     brand:'Scotty Cameron', family:'Super Select', model:'Newport 2 Plus Putter', year:2023, type:'putter', category:'standard', stockShaft:'Teryllium T9.5e' },
  { id: 'sc-phantom-x11-22',        brand:'Scotty Cameron', family:'Phantom', model:'Phantom X 11 Putter', year:2022, type:'putter', category:'standard', stockShaft:'Teryllium T9.5e' },
  { id: 'sc-fastback15-22',         brand:'Scotty Cameron', family:'Special Select', model:'Fastback 1.5 Putter', year:2022, type:'putter', category:'standard', stockShaft:'Teryllium T9.5e' },
  { id: 'sc-golo6-23',              brand:'Scotty Cameron', family:'Super Select', model:'Golo 6 Putter', year:2023, type:'putter', category:'standard', stockShaft:'Teryllium T9.5e' },

  // ─── ODYSSEY ─────────────────────────────────────────────────
  { id: 'ody-aione-1-24',           brand:'Odyssey', family:'Ai-ONE', model:'Ai-ONE #1 Putter', year:2024, type:'putter', category:'standard', stockShaft:'Winn DriTac' },
  { id: 'ody-aione-m5-24',          brand:'Odyssey', family:'Ai-ONE Milled', model:'Ai-ONE Milled #5 Putter', year:2024, type:'putter', category:'standard', stockShaft:'Winn DriTac' },
  { id: 'ody-whog-1-23',            brand:'Odyssey', family:'White Hot OG', model:'White Hot OG #1 Putter', year:2023, type:'putter', category:'standard', stockShaft:'Winn DriTac' },
  { id: 'ody-whog-7-23',            brand:'Odyssey', family:'White Hot OG', model:'White Hot OG #7 Putter', year:2023, type:'putter', category:'standard', stockShaft:'Winn DriTac' },
  { id: 'ody-trihot-two-23',        brand:'Odyssey', family:'Tri-Hot 5K', model:'Tri-Hot 5K Two Putter', year:2023, type:'putter', category:'standard', stockShaft:'Winn DriTac' },

  // ─── L.A.B. & BETTINARDI ────────────────────────────────────
  { id: 'lab-df3-23',               brand:'L.A.B.', family:'DF', model:'DF3 Putter', year:2023, type:'putter', category:'standard', stockShaft:'L.A.B. Armlock' },
  { id: 'lab-link1-22',             brand:'L.A.B.', family:'Link', model:'Link.1 Putter', year:2022, type:'putter', category:'standard', stockShaft:'L.A.B. Arm Lock' },
  { id: 'bet-bb1-23',               brand:'Bettinardi', family:'BB', model:'BB1 Flow Putter', year:2023, type:'putter', category:'standard', stockShaft:'Lamkin Sinkfit' },
  { id: 'bet-qb6-23',               brand:'Bettinardi', family:'Queen B', model:'Queen B 6 Putter', year:2023, type:'putter', category:'standard', stockShaft:'Lamkin Sinkfit' },
];
