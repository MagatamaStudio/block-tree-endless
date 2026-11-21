/* ============================================================
   模组记忆（转生侧栏层）
   三十层首通后开放：清空数值进度，按累计模组声望领取永久记忆
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

function rebirthUnlocked() {
	return rebirthClearedCount() >= rebirthModLayerCount()
}

function rebirthPrestigeCount() {
	const quests = player && player.quests
	if (quests && quests.stats && quests.stats.prestiges) return quests.stats.prestiges
	return rebirthClearedCount()
}

function rebirthTotalMemory() {
	return Math.floor(Math.sqrt(Math.max(0, rebirthPrestigeCount())))
}

function rebirthClaimed() {
	return (player && player.rebirth && player.rebirth.claimed) || 0
}

function rebirthClaimable() {
	return Math.max(0, rebirthTotalMemory() - rebirthClaimed())
}

const REBIRTH_TRACKS = {
	flow: {
		name: "记忆洪流",
		desc: "全局产量 +4%/级",
		max: 5,
		cost(level) { return Math.ceil(3 * Math.pow(1.8, level)) },
		effect(level) { return "全局产量 +" + (level * 4) + "%" },
	},
	soft: {
		name: "记忆扩容",
		desc: "模组软上限 ×1.04/级",
		max: 5,
		cost(level) { return Math.ceil(3 * Math.pow(1.8, level)) },
		effect(level) { return "模组软上限 ×" + (1 + level * 0.04).toFixed(2) },
	},
	kit: {
		name: "记忆起手",
		desc: "转生后保留生产设施",
		max: 3,
		cost(level) { return Math.ceil(3 * Math.pow(1.8, level)) },
		effect(level) { return level > 0 ? "转生后保留 " + level + " 级生产设施" : "未启用" },
	},
	auto: {
		name: "记忆捷径",
		desc: "降低自动声望阈值",
		max: 3,
		cost(level) { return Math.ceil(3 * Math.pow(1.8, level)) },
		effect(level) { return "自动声望阈值 " + (1.5 - level * 0.05).toFixed(2) + "× 需求" },
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

function rebirthGlobalBonus() {
	return 0.04 * rebirthLevel("flow")
}

function rebirthSoftcapMult() {
	return 1 + 0.04 * rebirthLevel("soft")
}

function rebirthKitLevel() {
	return rebirthLevel("kit")
}

function rebirthAutoThreshold() {
	return 1.5 - 0.05 * rebirthLevel("auto")
}

const REBIRTH_WALL_MULT = 0.5

// 转生后本轮施工尚未完成：首通标记保留，但施工按熟路减半重做
function rebirthWallPending(id) {
	if (!player || !player.rebirth || !(player.rebirth.claimed > 0)) return false
	const data = player[id]
	return !!(data && data.prestiged && !data.runCleared)
}

function rebirthWallMult() {
	return REBIRTH_WALL_MULT
}

function rebirthRunClearedCount() {
	if (typeof MODPACK === "undefined" || typeof player === "undefined") return 0
	let n = 0
	for (const cfg of MODPACK) if (player[cfg.id] && player[cfg.id].runCleared) n++
	return n
}

function rebirthNumericLayerIds() {
	const ids = []
	for (const id in layers) {
		const row = layers[id].row
		if (typeof row === "number" && !isNaN(row)) ids.push(id)
	}
	return ids
}

function rebirthResetAll() {
	const kit = rebirthKitLevel()
	for (const id of rebirthNumericLayerIds()) {
		layerDataReset(id, ["prestiged", "challenges", "mechCount", "everBest"])
		const data = player[id]
		if (!data) continue
		Vue.set(data, "activeChallenge", null)
		// 本轮施工重做（construct 随 startData 归零），首通标记不受影响
		Vue.set(data, "runCleared", false)
		data.resetTime = 0
		if (kit <= 0) continue
		// 起手只恢复生产设施与其解锁升级，不恢复其他购买项
		if (layers[id].upgrades && layers[id].upgrades[12]) data.upgrades = [12]
		if (layers[id].buyables && layers[id].buyables[11]) data.buyables[11] = new Decimal(kit)
	}
	player.points = getStartPoints()
	player.resetFloor = 0
	updateTemp()
	updateTemp()
	needCanvasUpdate = true
}

function rebirthClaim() {
	if (!rebirthUnlocked()) return
	const gain = rebirthClaimable()
	if (gain <= 0) return
	const msg = "转生将清空全部 " + rebirthNumericLayerIds().length + " 层的资源、升级、设施与层机制状态，" +
		"并领取 " + gain + " 点模组记忆。\n首通、挑战、成就、层间任务、商店与深层反哺会保留。\n" +
		"本轮施工会重新做一遍（熟路减半需求），施工券仍可使用。\n确定转生？"
	if (!confirm(msg)) return
	player.rebirth.claimed = rebirthTotalMemory()
	rebirthResetAll()
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
	const layerCount = rebirthNumericLayerIds().length
	return '<div class="shop-wrap">' +
		'<div class="shop-topbar">' +
			'<div class="shop-summary">已首通 <b>' + cleared + ' / ' + need + '</b> · 本轮已完工 <b>' + rebirthRunClearedCount() + ' / ' + need + '</b> · 累计模组声望 <b>' + prestiges + '</b><br>' +
				'总记忆 <b>' + total + '</b>（累计声望的平方根） · 已领取 <b>' + claimed + '</b> · 已投入 <b>' + spent + '</b> · 可用 <b>' + available + '</b>' +
			'</div>' +
			'<button class="shop-master ' + (canClaim ? "on" : "off") + '" onclick="rebirthClaim()" ' + (canClaim ? "" : "disabled") + '>' +
				(canClaim ? '转生并领取 <b>' + claimable + '</b> 记忆' : '暂无可领取记忆') +
			'</button>' +
		'</div>' +
		'<div class="shop-grid">' +
			'<div class="shop-card rebirth-wide">' +
				'<div class="shop-card-head"><span class="shop-card-name">转生规则</span><span class="shop-badge muted">只增不减</span></div>' +
				'<div class="rebirth-keep">' +
					'转生会清空 <b>' + layerCount + ' 层</b> 的资源、升级、设施、研究、路线、法术与层机制状态，并从原木重新开始。<br>' +
					'保留首通标记、挑战完成、成就、层间任务、商店与自动化开关、深层反哺。<br>' +
					'本轮施工重做一遍（首通后熟路减半需求），每层重新声望后当轮不再检查施工；施工券仍可使用。<br>' +
					'每次转生领取「总记忆 − 已领取」，记忆用于下方永久升级，不会因转生减少。' +
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
	color: "#9b7bff",

	startData() { return {
		unlocked: true,
		points: new Decimal(0),
		claimed: 0,
		levels: { flow: 0, soft: 0, kit: 0, auto: 0 },
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
