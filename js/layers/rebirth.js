/* ============================================================
   模组记忆（转生侧栏层）
   三十层首通后开放：真转生 —— 除记忆等级与记忆点外全部清零
   ============================================================ */

function rebirthModLayerCount() {
	return typeof MODPACK === "undefined" ? 30 : MODPACK.length
}

function rebirthClearedCount() {
	if (typeof MODPACK === "undefined" || typeof player === "undefined") return 0
	let n = 0
	for (const cfg of MODPACK) if (player[cfg.id] && player[cfg.id].prestiged) n++
	return n
}

// 真转生会清空层间任务，累计声望因此要单独记一份基线，否则记忆总额会倒退
function rebirthBasePrestige() {
	return (player && player.rebirth && player.rebirth.basePrestige) || 0
}

function rebirthPrestigeCount() {
	const quests = player && player.quests
	const run = (quests && quests.stats && quests.stats.prestiges) || 0
	return rebirthBasePrestige() + run
}

function rebirthUnlocked() {
	return rebirthClearedCount() >= rebirthModLayerCount() || rebirthClaimed() > 0
}

// 记忆总额只增不减：累计模组声望 ^0.6 ×2。指数取 0.6（而非平方根）是为了让每轮收获随累计声望一起长，
// 30 轮左右能摸到 8 条轨道六成、50 轮八成；改这里会整体移动长线节奏
const REBIRTH_MEMORY_POW = 0.6
const REBIRTH_MEMORY_SCALE = 2

function rebirthTotalMemory() {
	return Math.floor(Math.pow(Math.max(0, rebirthPrestigeCount()), REBIRTH_MEMORY_POW) * REBIRTH_MEMORY_SCALE)
}

function rebirthClaimed() {
	return (player && player.rebirth && player.rebirth.claimed) || 0
}

function rebirthClaimable() {
	return Math.max(0, rebirthTotalMemory() - rebirthClaimed())
}

// 记忆升级：全部为永久效果，真转生不清空
const REBIRTH_TRACKS = {
	flow: {
		name: "记忆洪流",
		desc: "全局产量 +10%/级",
		max: 10,
		cost(level) { return Math.ceil(2 * Math.pow(1.45, level)) },
		effect(level) { return "全局产量 +" + (level * 10) + "%" },
	},
	soft: {
		name: "记忆扩容",
		desc: "模组软上限 ×1.06/级",
		max: 8,
		cost(level) { return Math.ceil(2 * Math.pow(1.45, level)) },
		effect(level) { return "模组软上限 ×" + (1 + level * 0.06).toFixed(2) },
	},
	kit: {
		name: "记忆起手",
		desc: "转生后立即获得生产设施",
		max: 6,
		cost(level) { return Math.ceil(2 * Math.pow(1.45, level)) },
		effect(level) { return level > 0 ? "转生后直接获得 " + level + " 级生产设施与 12 号升级" : "未启用" },
	},
	auto: {
		name: "记忆捷径",
		desc: "自动声望收益 ×1.10/级",
		max: 10,
		cost(level) { return Math.ceil(2 * Math.pow(1.45, level)) },
		effect(level) { return "自动声望收益 ×" + (1 + 0.1 * level).toFixed(1) },
	},
	wall: {
		name: "记忆熟路",
		desc: "施工需求 −6%/级",
		max: 8,
		cost(level) { return Math.ceil(2 * Math.pow(1.45, level)) },
		effect(level) { return "施工需求 −" + (level * 6) + "%" },
	},
	yield: {
		name: "记忆丰产",
		desc: "模组层声望收益 ×1.15/级",
		max: 8,
		cost(level) { return Math.ceil(2 * Math.pow(1.45, level)) },
		effect(level) { return "模组层声望收益 ×" + Math.pow(1.15, level).toFixed(2) },
	},
	passive: {
		name: "记忆自动",
		desc: "模组层自动产出 ×1.25/级",
		max: 6,
		cost(level) { return Math.ceil(2 * Math.pow(1.45, level)) },
		effect(level) { return "模组层自动产出 ×" + Math.pow(1.25, level).toFixed(2) },
	},
	depth: {
		name: "记忆深潜",
		desc: "深层反哺指数 +0.02/级",
		max: 6,
		cost(level) { return Math.ceil(2 * Math.pow(1.45, level)) },
		effect(level) { return "深层反哺指数 +" + (level * 0.02).toFixed(2) },
	},
}

function rebirthLevel(key) {
	const levels = player && player.rebirth && player.rebirth.levels
	return Number(levels && levels[key]) || 0
}

function rebirthSpent() {
	let spent = 0
	for (const key in REBIRTH_TRACKS) {
		const level = rebirthLevel(key)
		for (let i = 0; i < level; i++) spent += REBIRTH_TRACKS[key].cost(i)
	}
	return spent
}

function rebirthAvailable() {
	return Math.max(0, rebirthClaimed() - rebirthSpent())
}

// —— 记忆效果：供各层计算调用 ——
function rebirthGlobalBonus() {
	return 0.10 * rebirthLevel("flow")
}

function rebirthSoftcapMult() {
	return 1 + 0.06 * rebirthLevel("soft")
}

function rebirthKitLevel() {
	return rebirthLevel("kit")
}

// 自动声望固定等到 1.5× 需求再触发（降阈值会让每次收益更差，是负收益）
function rebirthAutoThreshold() {
	return 1.5
}

// 记忆「捷径」：按等级放大自动声望收益
function rebirthAutoGainMult() {
	return new Decimal(1 + 0.1 * rebirthLevel("auto"))
}

function rebirthWallCut() {
	return 0.06 * rebirthLevel("wall")
}

function rebirthYieldMult() {
	return new Decimal(Math.pow(1.15, rebirthLevel("yield")))
}

function rebirthPassiveMult() {
	return new Decimal(Math.pow(1.25, rebirthLevel("passive")))
}

function rebirthDepthBonus() {
	return 0.02 * rebirthLevel("depth")
}

function rebirthNumericLayerIds() {
	const ids = []
	for (const id in layers) {
		const row = layers[id].row
		if (typeof row === "number" && !isNaN(row)) ids.push(id)
	}
	return ids
}

// 真转生：除模组记忆层本身，其余每一层（含成就、层间任务、商店）全部回到初始数据
function rebirthResetAll() {
	const kit = rebirthKitLevel()
	for (const id in layers) {
		if (id === "rebirth") continue
		layerDataReset(id, [])
	}
	// layOver 只覆盖 startData 里出现的键，动态 map 必须显式清空，否则商店购买会跨转生残留
	if (player.shop) {
		Vue.set(player.shop, "owns", {})
		Vue.set(player.shop, "auto", {})
		Vue.set(player.shop, "autoBuy", {})
		Vue.set(player.shop, "autoPrestigeLayer", {})
		Vue.set(player.shop, "autoPrestige", true)
	}
	for (const id in layers) {
		if (id === "rebirth") continue
		const data = player[id]
		if (!data) continue
		// everBest 不在 startData 里，深层反哺要吃这一份，必须手动清掉
		if (data.everBest !== undefined) Vue.set(data, "everBest", new Decimal(0))
		if (data.activeChallenge !== undefined) Vue.set(data, "activeChallenge", null)
		if (data.resetTime !== undefined) data.resetTime = 0
		if (data.runCleared !== undefined) Vue.set(data, "runCleared", false)
		if (kit <= 0) continue
		// 起手只恢复生产设施与其解锁升级，不恢复其他购买项
		if (layers[id].upgrades && layers[id].upgrades[12]) data.upgrades = [12]
		if (layers[id].buyables && layers[id].buyables[11]) Vue.set(data.buyables, 11, new Decimal(kit))
	}
	player.points = getStartPoints()
	player.resetFloor = 0
	// layerDataReset 会保留 unlocked，这里按 startData 重新锁回去，否则转生后整棵树仍是全解锁
	for (const id in layers) {
		if (id === "rebirth") continue
		const start = layers[id].startData
		if (typeof start !== "function" || !player[id]) continue
		if (!start().unlocked) player[id].unlocked = false
	}
	refreshDepthBaseMult()
	updateTemp()
	updateTemp()
	// 回到树根视图：当前页可能是刚被锁回去的层
	player.tab = "none"
	player.lastSafeTab = "tree-tab"
	if (typeof showNavTab === "function") showNavTab("tree-tab")
	needCanvasUpdate = true
}

function rebirthClaim() {
	if (!rebirthUnlocked()) return
	const gain = rebirthClaimable()
	if (gain <= 0) return
	const msg = "转生是「真转生」：除模组记忆等级与记忆点外，全部进度清零 ——\n" +
		"资源、升级、设施、首通标记、挑战、成就、层间任务、商店自动化、深层反哺都会重置。\n" +
		"本次可领取 " + gain + " 点模组记忆，累计 " + rebirthTotalMemory() + " 点。\n" +
		"转生后抽 3 条世界词条选 1 条，本轮生效。\n" +
		"记忆在下方换成永久升级，并且不会因转生减少。确定转生？"
	if (!confirm(msg)) return
	player.rebirth.claimed = rebirthTotalMemory()
	player.rebirth.basePrestige = rebirthPrestigeCount()
	rebirthResetAll()
	if (typeof rollWorldMods === "function") {
		rollWorldMods()
		if (typeof doPopup === "function") {
			doPopup("default", "本轮世界词条已抽取：去「模组记忆」页三选一，选完才开始生效", "世界词条", 6)
		}
	}
}

function rebirthBuy(key) {
	const def = REBIRTH_TRACKS[key]
	if (!def || !player || !player.rebirth) return
	const level = rebirthLevel(key)
	if (level >= def.max) return
	const cost = def.cost(level)
	if (rebirthAvailable() < cost) return
	if (!player.rebirth.levels) Vue.set(player.rebirth, "levels", {})
	Vue.set(player.rebirth.levels, key, level + 1)
	updateTemp()
}

function rebirthTrackCard(key) {
	const def = REBIRTH_TRACKS[key]
	const level = rebirthLevel(key)
	const maxed = level >= def.max
	const cost = maxed ? 0 : def.cost(level)
	const can = !maxed && rebirthAvailable() >= cost
	const badge = maxed ? "已满级" : "等级 " + level + " / " + def.max
	return '<div class="shop-card ' + (maxed ? "owned" : can ? "purchasable" : "dim") + '">' +
		'<div class="shop-card-head"><span class="shop-card-name">' + def.name + '</span>' +
			'<span class="shop-badge ' + (maxed ? "owned" : "muted") + '">' + badge + '</span></div>' +
		'<div class="shop-price">' + def.desc + '<br>当前：' + def.effect(level) +
			(maxed ? "" : "<br>下一级：" + def.effect(level + 1)) + '</div>' +
		'<button class="shop-buy" ' + (can ? "" : "disabled") + ' onclick="rebirthBuy(\'' + key + '\')">' +
			(maxed ? "已满级" : "花费 " + cost + " 记忆") + '</button>' +
	'</div>'
}

function rebirthTabHTML() {
	const cleared = rebirthClearedCount()
	const need = rebirthModLayerCount()
	const prestiges = rebirthPrestigeCount()
	const total = rebirthTotalMemory()
	const claimable = rebirthClaimable()
	const claimed = rebirthClaimed()
	const spent = rebirthSpent()
	const available = rebirthAvailable()
	const canClaim = claimable > 0
	const layerCount = Object.keys(layers).filter(function(id) { return id !== "rebirth" && id !== "tree-tab" }).length
	return '<div class="shop-wrap">' +
		'<div class="shop-topbar">' +
			'<div class="shop-summary">已首通 <b>' + cleared + ' / ' + need + '</b> · 累计模组声望 <b>' + prestiges + '</b><br>' +
				'总记忆 <b>' + total + '</b>（累计声望的平方根 ×1.5） · 已领取 <b>' + claimed + '</b> · 已投入 <b>' + spent + '</b> · 可用 <b>' + available + '</b>' +
			'</div>' +
			'<button class="shop-master ' + (canClaim ? "on" : "off") + '" onclick="rebirthClaim()" ' + (canClaim ? "" : "disabled") + '>' +
				(canClaim ? '转生并领取 <b>' + claimable + '</b> 记忆' : '暂无可领取记忆') +
			'</button>' +
		'</div>' +
		(typeof worldModCardHTML === "function" ? worldModCardHTML() : "") +
		'<div class="shop-grid">' +
			'<div class="shop-card rebirth-wide">' +
				'<div class="shop-card-head"><span class="shop-card-name">真转生规则</span><span class="shop-badge muted">只保留记忆</span></div>' +
				'<div class="rebirth-keep">' +
					'转生会清空 <b>' + layerCount + ' 层</b> 的全部数据：资源、升级、设施、研究、路线、法术、层机制、首通标记与深层反哺，从原木重新开始。<br>' +
					'成就、挑战完成记录、层间任务与商店自动化也一并重置 —— <b>跨转生保留的只有模组记忆等级和记忆点</b>。<br>' +
					'首通 ' + need + ' 个模组层解锁转生；转生后入口不会消失，可以直接用记忆升级。<br>' +
					'每次转生领取「总记忆 − 已领取」，记忆的总量只看累计模组声望，不会因转生减少。' +
				'</div>' +
			'</div>' +
			Object.keys(REBIRTH_TRACKS).map(rebirthTrackCard).join("") +
		'</div>' +
	'</div>'
}

addLayer("rebirth", {
	name: "模组记忆",
	symbol: "记忆",
	image: "img/ender_eye.png",
	row: "side",
	position: 50,
	color: "#9b7bff",

	startData() { return {
		unlocked: true,
		points: new Decimal(0),
		claimed: 0,
		basePrestige: 0,
		levels: { flow: 0, soft: 0, kit: 0, auto: 0, wall: 0, yield: 0, passive: 0, depth: 0 },
		mod: "",
		modChoices: [],
	}},

	resource: "模组记忆",
	type: "none",

	tabFormat: [
		["display-text", "<h1>模组记忆</h1>"],
		["raw-html", function() { return rebirthTabHTML() }],
	],

	layerShown() { return rebirthUnlocked() },
	tooltip() {
		return "模组记忆 · 可用 " + rebirthAvailable() +
			"<br>累计模组声望 " + rebirthPrestigeCount() +
			"<br>本次可领取 " + rebirthClaimable()
	},
})
