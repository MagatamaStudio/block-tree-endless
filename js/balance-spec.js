// 全局数值单一来源：需求、升级价、设施价、收益上限全部从这里取值。
// 各层文件只保留自己的基准值，调平衡只改这一个文件。
// 当前这份是「与旧版等价」的基线值，任何一项改动都要用 tools/sim 复测。
var BAL = {
	// 目标：36 层全通 8–10 小时（只作校准参考，不参与运行）
	targetHours: 9,

	// 需求 = 基准 × 难度 × grow^min(声望次数, 上限)。grow = 1 表示不增长（旧版行为）
	reqGrowVanilla: 1,
	reqGrowMod: 1,
	reqCountCap: 0,

	// 单次声望收益上限 = 当前需求 × gainCap（模组层另有 MP_GAIN_CAP）
	gainCap: 6,

	// 原版升级价 = 当前需求 × 各层 frac × vanillaUpgScale
	vanillaUpgScale: 1,

	// 原版四层生产设施：底价、每级涨价、每级效果（效果 > 涨价 = 越买越亏，旧版是 1.8 效果 / 1.4 涨价）
	facility: {
		p: { base: 5, ratio: 1.4, effect: 1.8 },
		s: { base: 8, ratio: 1.6, effect: 1.8 },
		i: { base: 10, ratio: 1.65, effect: 1.8 },
		d: { base: 12, ratio: 1.7, effect: 1.8 },
	},

	// 模组层：整排升级的总价系数 + 十档价格比例（按需求折算）
	modCostScale: 12,
	modCostFracs: [0.011, 0.023, 0.046, 0.095, 0.194, 0.398, 0.816, 1.674, 3.431, 7.034],

	// 模组层三个设施：底价占需求比例、每级涨价
	modFacility: [
		{ base: 0.01, ratio: 1.8 },
		{ base: 0.02, ratio: 1.9 },
		{ base: 0.03, ratio: 2.0 },
	],

	// 单次声望收益上限 = 当前需求 × 该系数（越小越要多刷几轮，声望不再一步到位）
	modGainCap: 4,

	// 模组层需求曲线（层内几何上涨）
	modReqEarly: 1.42,
	modReqStep: 50,
}

function balPrestigeCount(layer) {
	try {
		const p = typeof player !== "undefined" ? player[layer] : null
		return (p && p.prestigeCount) || 0
	} catch (e) { return 0 }
}

function balReqGrowth(layer, isMod) {
	if (!BAL.reqCountCap) return 1
	const grow = isMod ? BAL.reqGrowMod : BAL.reqGrowVanilla
	return Math.pow(grow, Math.min(balPrestigeCount(layer), BAL.reqCountCap))
}

// 层需求 = 基准 × 难度 × 声望次数增长。取整避免「差 0.3 永远跨不过去」。
function reqNow(layer, base, isMod) {
	const d = (typeof DIFFICULTY !== "undefined") ? DIFFICULTY : new Decimal(1)
	return new Decimal(base).times(d).times(balReqGrowth(layer, isMod)).floor().max(1)
}

// 解锁门槛：下一层要求上一层先买够几档升级（不碰「首通」，不可能死锁：
// 上一层货币本来就能刷到，只是逼你把钱花在升级上）。
// p 不需要门槛（开局的 木板 只能从 p 自己的声望里来）。
const BAL_UNLOCK_MIN = { s: 2, i: 2, d: 2, n: 2, e: 2 }
const BAL_UNLOCK_PREV = { s: "p", i: "s", d: "i", n: "d", e: "n" }

function balInvestedLayer(layer) {
	const need = BAL_UNLOCK_MIN[layer]
	if (!need) return true
	try {
		const p = player && player[BAL_UNLOCK_PREV[layer]]
		if (!p) return false
		return (p.upgrades ? p.upgrades.length : 0) >= need
	} catch (e) { return true }
}
// 声望结算时调用：本层计数 +1
function balAddPrestige(layer) {
	const p = player && player[layer]
	if (!p) return
	const n = (p.prestigeCount || 0) + 1
	if (typeof Vue !== "undefined" && Vue.set) Vue.set(p, "prestigeCount", n)
	else p.prestigeCount = n
}
