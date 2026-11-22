/* ============================================================
   主动玩法（阶段一）：层专精、点击连击、裂隙事件
   状态全部写在 player 上，旧存档缺字段时由 ensure* 补齐
   ============================================================ */

// ---------------- 层专精 ----------------

const SPECIALIZATIONS = [
	{ id: 0, name: "未选", desc: "还没有选专精", color: "#9a9a9a" },
	{ id: 1, name: "产能", desc: "本层产量与自动产出 ×2.5", color: "#9adf75" },
	{ id: 2, name: "施工", desc: "本层施工材料需求 −45%", color: "#7fc7e8" },
	{ id: 3, name: "声望", desc: "本层声望收益 ×1.8，产量 ×0.9", color: "#e8d38a" },
]

const SPEC_GAIN = { 1: 2.5, 3: 0.9 }
const SPEC_WALL = { 2: 0.55 }
const SPEC_PRESTIGE = { 3: 1.8 }

function specOf(layer) {
	if (typeof player === "undefined" || !player[layer]) return 0
	const spec = player[layer].spec
	return typeof spec === "number" && spec >= 0 && spec <= 3 ? spec : 0
}

function specGainMult(layer) {
	const spec = specOf(layer)
	return new Decimal(SPEC_GAIN[spec] !== undefined ? SPEC_GAIN[spec] : 1)
}

function specPassiveMult(layer) {
	const spec = specOf(layer)
	return new Decimal(SPEC_GAIN[spec] !== undefined ? SPEC_GAIN[spec] : 1)
}

function specWallMult(layer) {
	const spec = specOf(layer)
	return new Decimal(SPEC_WALL[spec] !== undefined ? SPEC_WALL[spec] : 1)
}

function specPrestigeMult(layer) {
	const spec = specOf(layer)
	return new Decimal(SPEC_PRESTIGE[spec] !== undefined ? SPEC_PRESTIGE[spec] : 1)
}

// 挑战进行中禁止改选，避免临时切专精钻空子；选过之后本轮不能再改
function setSpecialization(layer, spec) {
	if (typeof player === "undefined" || !player[layer]) return
	if (spec !== 1 && spec !== 2 && spec !== 3) return
	if (!player[layer].unlocked) return
	if (specOf(layer) !== 0) return
	if (typeof mpActiveChallenge === "function" && typeof MODPACK !== "undefined") {
		const cfg = MODPACK.find(c => c.id === layer)
		if (cfg && mpActiveChallenge(cfg)) {
			doPopup("default", "挑战进行中不能选专精，完成或放弃后再来。", "专精", 3)
			return
		}
	}
	Vue.set(player[layer], "spec", spec)
	updateTemp()
	doPopup("default", "本层专精：" + SPECIALIZATIONS[spec].name + " —— " + SPECIALIZATIONS[spec].desc, "专精", 3)
}

function specCardHTML(cfg) {
	if (typeof player === "undefined" || !player[cfg.id]) return ""
	const spec = specOf(cfg.id)
	const cur = SPECIALIZATIONS[spec]
	const locked = spec !== 0
	const inChallenge = typeof mpActiveChallenge === "function" && !!mpActiveChallenge(cfg)

	let head = "<b>本层专精</b>：<b style='color:" + cur.color + "'>" + cur.name + "</b>"
	if (!locked) head += "<span style='font-size:13px; opacity:0.8;'> —— 声望一次后重置，可重新选</span>"
	else head += "<span style='font-size:13px; opacity:0.8;'> —— " + cur.desc + "（本轮已锁定）</span>"
	if (!locked && inChallenge) head += "<br><span style='font-size:13px; color:#e8a0a0;'>挑战进行中，暂不能选</span>"

	const rows = SPECIALIZATIONS.slice(1).map(s => {
		const on = spec === s.id
		const disabled = locked || inChallenge
		const style = "display:block; width:100%; box-sizing:border-box; text-align:left; margin:5px 0; " +
			"padding:7px 11px; border-radius:9px; border:1px solid " +
			(on ? s.color : "rgba(255,255,255,0.16)") + "; background:" +
			(on ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.18)") + "; color:" +
			(on ? s.color : "#d8d8d8") + "; cursor:" + (disabled ? "default" : "pointer") +
			"; opacity:" + (disabled && !on ? "0.4" : "1") + ";"
		const onclick = disabled ? "" : " onclick=\"setSpecialization('" + cfg.id + "'," + s.id + ")\""
		return "<div style='" + style + "'" + onclick + ">" +
			"<b>" + s.name + "</b>" +
			"<span style='font-size:13px; opacity:0.85;'>　" + s.desc + "</span>" +
			(on ? "<span style='font-size:12px; float:right;'>已选</span>" : "") +
			"</div>"
	}).join("")

	return "<div style='text-align:left; max-width:560px; margin:8px auto; padding:10px 14px; " +
		"border:1px solid rgba(255,255,255,0.16); border-radius:10px; background:rgba(0,0,0,0.14); line-height:1.5;'>" +
		head + rows + "</div>"
}

// ---------------- 点击连击 ----------------

const CLICK_COMBO_PER = 3        // 每 N 次点击叠一层
const CLICK_COMBO_STEP = 0.15    // 每层 +15% 全局产量
const CLICK_COMBO_MAX = 5        // 最多 5 层
const CLICK_COMBO_KEEP = 30      // 30 秒不点就清空
const CLICK_SPEED_CAP = 10       // 点击随加速放大的上限

function ensureClickCombo() {
	if (typeof player === "undefined") return null
	if (!player.clickCombo || typeof player.clickCombo !== "object") {
		Vue.set(player, "clickCombo", { clicks: 0, stacks: 0, until: 0 })
	}
	const c = player.clickCombo
	if (typeof c.clicks !== "number") c.clicks = 0
	if (typeof c.stacks !== "number") c.stacks = 0
	if (typeof c.until !== "number") c.until = 0
	return c
}

function noteClick() {
	const c = ensureClickCombo()
	if (!c) return
	c.clicks++
	if (c.clicks % CLICK_COMBO_PER === 0) c.stacks = Math.min(CLICK_COMBO_MAX, c.stacks + 1)
	c.until = Date.now() + CLICK_COMBO_KEEP * 1000
	noteRiftClick()
}

function clickComboStacks() {
	if (typeof player === "undefined" || !player.clickCombo) return 0
	const c = player.clickCombo
	if (!c.until || Date.now() >= c.until) return 0
	return Math.max(0, Math.min(CLICK_COMBO_MAX, c.stacks || 0))
}

function clickComboMult() {
	return new Decimal(1 + CLICK_COMBO_STEP * clickComboStacks())
}

// 点击收益随加速开方增长，封顶 10×：加速 100× 时点击不是白点，也不会喧宾夺主
function clickSpeedMult() {
	let speed = player && player.devSpeed ? Number(player.devSpeed) : 1
	if (!isFinite(speed) || speed < 1) speed = 1
	return new Decimal(Math.min(CLICK_SPEED_CAP, Math.sqrt(speed)))
}

// ---------------- 裂隙事件（真实时间，加速免疫） ----------------

const RIFT_WINDOW = 90           // 事件窗口（秒）
const RIFT_GAP_MIN = 240         // 两次裂隙之间的最短间隔（秒）
const RIFT_GAP_MAX = 420         // 最长间隔（秒）
const RIFT_BUFF_TIME = 600       // 裂隙增益持续（秒）

const RIFT_TYPES = {
	collapse: {
		name: "坍缩",
		goal: 15,
		desc: "点击 15 次「徒手撸树」",
		reward: "全局产量 ×2，持续 10 分钟",
		color: "#e88a8a",
	},
	caravan: {
		name: "商队",
		goal: 3,
		desc: "向任意层的施工投入 3 次材料",
		reward: "该层施工进度 +25%",
		color: "#e8c46a",
	},
	overload: {
		name: "过载",
		goal: 8,
		desc: "购买 8 次升级或设施",
		reward: "全局产量 ×1.5，持续 10 分钟",
		color: "#8ab6e8",
	},
}

const RIFT_KEYS = Object.keys(RIFT_TYPES)

// 自动购买期间置 true：裂隙只统计玩家亲手买的
let riftAutoBuying = false

function riftState() {
	if (typeof player === "undefined") return null
	if (!player.rifts || typeof player.rifts !== "object") Vue.set(player, "rifts", {})
	const s = player.rifts
	if (typeof s.type !== "string") s.type = ""
	if (typeof s.until !== "number") s.until = 0
	if (typeof s.progress !== "number") s.progress = 0
	if (typeof s.goal !== "number") s.goal = 0
	if (typeof s.won !== "number") s.won = 0
	if (typeof s.missed !== "number") s.missed = 0
	if (typeof s.buffMult !== "number") s.buffMult = 1
	if (typeof s.buffUntil !== "number") s.buffUntil = 0
	if (typeof s.buffName !== "string") s.buffName = ""
	if (typeof s.layer !== "string") s.layer = ""
	if (typeof s.nextAt !== "number") s.nextAt = Date.now() + 90 * 1000
	return s
}

function riftRemain() {
	const s = riftState()
	if (!s || !s.type) return 0
	return Math.max(0, Math.ceil((s.until - Date.now()) / 1000))
}

function riftBuffMult() {
	if (typeof player === "undefined" || !player.rifts) return new Decimal(1)
	const s = player.rifts
	if (!s.buffUntil || Date.now() >= s.buffUntil) return new Decimal(1)
	return new Decimal(s.buffMult || 1)
}

function riftNextIn() {
	const s = riftState()
	if (!s) return 0
	return Math.max(0, Math.ceil((s.nextAt - Date.now()) / 1000))
}

function riftPopup(text) {
	// 弹窗计时走真实时间，加速下也看得见
	doPopup("default", text, "裂隙", 4)
}

function riftSpawn() {
	const s = riftState()
	if (!s) return
	if (s.type) return
	const key = RIFT_KEYS[Math.floor(Math.random() * RIFT_KEYS.length)]
	const type = RIFT_TYPES[key]
	s.type = key
	s.goal = type.goal
	s.progress = 0
	s.until = Date.now() + RIFT_WINDOW * 1000
	s.layer = ""
	riftPopup("「" + type.name + "」出现：" + type.desc + "<br>奖励：" + type.reward)
}

function riftMiss() {
	const s = riftState()
	if (!s) return
	s.missed++
	s.type = ""
	s.until = 0
	s.progress = 0
	s.nextAt = Date.now() + riftGap()
}

function riftGap() {
	return (RIFT_GAP_MIN + Math.random() * (RIFT_GAP_MAX - RIFT_GAP_MIN)) * 1000
}

function riftWin() {
	const s = riftState()
	if (!s) return
	const key = s.type
	const type = RIFT_TYPES[key]
	if (!type) {
		s.type = ""
		return
	}
	if (key === "caravan") {
		const cfg = MODPACK.find(c => c.id === s.layer)
		if (cfg) {
			const add = mpBuildNeed(cfg).times(0.25)
			Vue.set(player[cfg.id], "construct", mpBuildSpent(cfg).add(add).min(mpBuildNeed(cfg)))
			riftPopup("「商队」到站：" + cfg.name + " 施工进度 +25%")
		} else {
			riftPopup("「商队」到站，但这一轮没有可施工的层，奖励作废")
		}
	} else {
		const mult = key === "collapse" ? 2 : 1.5
		if (mult >= (s.buffMult || 1) || Date.now() >= s.buffUntil) {
			s.buffMult = mult
			s.buffUntil = Date.now() + RIFT_BUFF_TIME * 1000
			s.buffName = type.name
		}
		riftPopup("「" + type.name + "」完成：全局产量 ×" + mult + "，持续 10 分钟")
	}
	s.won++
	s.type = ""
	s.until = 0
	s.progress = 0
	s.layer = ""
	s.nextAt = Date.now() + riftGap()
	updateTemp()
}

function updateRifts() {
	const s = riftState()
	if (!s) return
	const now = Date.now()

	// 增益到期
	if (s.buffUntil && now >= s.buffUntil) {
		s.buffMult = 1
		s.buffUntil = 0
		s.buffName = ""
	}

	// 连击到期清空，避免界面一直显示旧层数
	const c = player.clickCombo
	if (c && c.until && now >= c.until && c.stacks) c.stacks = 0

	if (s.type) {
		if (s.progress >= s.goal) riftWin()
		else if (now >= s.until) {
			s.missed++
			s.type = ""
			s.until = 0
			s.progress = 0
			s.nextAt = now + riftGap()
		}
		return
	}
	if (now >= s.nextAt) riftSpawn()
}

// 各处的计数钩子：只有对应事件进行中才累加
function noteRiftClick() {
	const s = riftState()
	if (s && s.type === "collapse" && s.progress < s.goal) s.progress++
}

function noteRiftInvest(cfg) {
	const s = riftState()
	if (!s || s.type !== "caravan") return
	s.layer = cfg.id
	if (s.progress < s.goal) s.progress++
}

function noteRiftPurchase() {
	const s = riftState()
	if (!s || s.type !== "overload") return
	// 自动购买不算：过载要玩家自己动手
	if (typeof riftAutoBuying !== "undefined" && riftAutoBuying) return
	if (s.progress < s.goal) s.progress++
}

// 顶部 HUD / 侧栏共用的摘要
function riftSummaryText() {
	const s = riftState()
	if (!s) return ""
	if (s.type) {
		const type = RIFT_TYPES[s.type]
		return "裂隙「" + type.name + "」：" + s.progress + " / " + s.goal + " · 剩余 " + riftRemain() + " 秒"
	}
	return "下一个裂隙：" + riftNextIn() + " 秒后"
}
