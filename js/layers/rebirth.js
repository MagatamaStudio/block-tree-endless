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
	// 首通 20 层就先让记忆页露出来（此时只能领期中），30 层全通才能真转生
	return rebirthClearedCount() >= REBIRTH_STAGE_LAYERS || rebirthClaimed() > 0
}

// 记忆总额只增不减：每打通一轮 +10 点，分两笔记入
//   · 期中 5 点：本轮已首通 20 层 且 本轮声望满 50 次
//   · 全通 5 点：30 个模组层首通一遍
// 为什么期中要绑 20 层：只绑声望的话，开局自动声望刷 50 次（几分钟）就能领走 5 点、
// 真转生重置、再刷 50 次，一小时就能把 736 点刷满 —— 声望必须和真实进度绑在一起。
// 为什么是 20 层而不是 15 层：15 层的兑换率是 5/15 ≈ 0.33 点/层，和打穿一轮一样，
// 玩家会算出来「打一半就重置」更划算；20 层是 0.25 点/层，明显低于全通的 0.33，没人有动力去刷半轮。
const REBIRTH_MEMORY_PER_ROUND = 10
const REBIRTH_STAGE_MEMORY = 5
const REBIRTH_STAGE_LAYERS = 20
const REBIRTH_STAGE_PRESTIGES = 50

// 封顶折扣：本轮每 100 次声望 −1% 记忆价格，上限 −10%。
// 折扣在真转生那一刻按「刚打完这一轮」的声望冻结 —— 购买基本发生在转生之后，那时本轮声望已经清零，
// 实时算折扣的话永远是 0%，等于没有。
const REBIRTH_DISCOUNT_PER = 100
const REBIRTH_DISCOUNT_STEP = 0.01
const REBIRTH_DISCOUNT_MAX = 0.10

// 本轮声望次数：真转生会把层间任务一起清空，所以这就是「本轮」的计数
function rebirthRunPrestigeCount() {
	const quests = player && player.quests
	if (!quests || !quests.stats) return 0
	return Math.max(0, Math.floor(Number(quests.stats.prestiges) || 0))
}

// 期中是否达标：20 层首通 + 50 次本轮声望，两个都要
function rebirthStageMet() {
	return rebirthClearedCount() >= REBIRTH_STAGE_LAYERS && rebirthRunPrestigeCount() >= REBIRTH_STAGE_PRESTIGES
}

function rebirthRound() {
	const data = player && player.rebirth
	const base = Math.max(0, Math.floor(Number(data && data.rounds) || 0))
	// 当前这一轮打通 30 层就算完成：领取时把轮数固定下来，重置首通后不再重算
	const done = rebirthClearedCount() >= rebirthModLayerCount() ? 1 : 0
	return base + done
}

// 已冻结的轮数 × 10，加上当前这一轮已经赚到的部分（期中 5 / 全通再 5）
function rebirthTotalMemory() {
	const data = player && player.rebirth
	const frozen = Math.max(0, Math.floor(Number(data && data.rounds) || 0)) * REBIRTH_MEMORY_PER_ROUND
	if (rebirthClearedCount() >= rebirthModLayerCount()) return frozen + REBIRTH_MEMORY_PER_ROUND
	return frozen + (rebirthStageMet() ? REBIRTH_STAGE_MEMORY : 0)
}

// 老档迁移：v9.8 及更早的记忆总额按累计声望算，已领取的折算成轮数，已经买到的等级不作废
function rebirthMigrateRounds() {
	const data = player && player.rebirth
	if (!data || Number(data.rounds) > 0) return
	const claimed = Number(data.claimed) || 0
	if (claimed <= 0) return
	data.rounds = Math.floor(claimed / REBIRTH_MEMORY_PER_ROUND)
}

function rebirthClaimed() {
	return (player && player.rebirth && player.rebirth.claimed) || 0
}

function rebirthClaimable() {
	return Math.max(0, rebirthTotalMemory() - rebirthClaimed())
}

// 按某个声望次数能拿到多少折扣（每满 100 次 −1%，封顶 −10%）
function rebirthDiscountAt(prestiges) {
	const steps = Math.floor(Math.max(0, Number(prestiges) || 0) / REBIRTH_DISCOUNT_PER)
	return Math.min(REBIRTH_DISCOUNT_MAX, steps * REBIRTH_DISCOUNT_STEP)
}

// 当前生效的折扣：上一轮真转生时冻结下来的值
function rebirthDiscount() {
	const data = player && player.rebirth
	const value = Number(data && data.discount)
	if (!isFinite(value) || value <= 0) return 0
	return Math.min(REBIRTH_DISCOUNT_MAX, value)
}

// 上一轮结束时的声望次数（只用于显示折扣进度）
function rebirthDiscountPrestige() {
	const data = player && player.rebirth
	return Math.max(0, Math.floor(Number(data && data.discountPrestige) || 0))
}

// 距离下一档折扣还差多少次声望
function rebirthDiscountNext() {
	const prestige = rebirthDiscountPrestige()
	const steps = Math.floor(prestige / REBIRTH_DISCOUNT_PER)
	if (steps * REBIRTH_DISCOUNT_STEP >= REBIRTH_DISCOUNT_MAX) return 0
	return REBIRTH_DISCOUNT_PER - (prestige % REBIRTH_DISCOUNT_PER)
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

// 按当前等级回算「一分折扣都没用过」的花费：老存档没有 player.rebirth.spent，用这个兜底
function rebirthSpentByLevels() {
	let spent = 0
	for (const key in REBIRTH_TRACKS) {
		const level = rebirthLevel(key)
		for (let i = 0; i < level; i++) spent += REBIRTH_TRACKS[key].cost(i)
	}
	return spent
}

// 已投入：有记录就用记录（打折买的按实付记账），没有就按等级回算
function rebirthSpent() {
	const data = player && player.rebirth
	if (data && typeof data.spent === "number" && isFinite(data.spent)) return Math.max(0, data.spent)
	return rebirthSpentByLevels()
}

// 整条轨道买到 level 级为止的原价累计
function rebirthBaseCum(key, level) {
	const def = REBIRTH_TRACKS[key]
	if (!def) return 0
	let sum = 0
	for (let i = 0; i < level && i < def.max; i++) sum += def.cost(i)
	return sum
}

// 打折后「整条轨道买到 level 级」的累计价：折扣按整条轨道算，取整误差才不会把 −10% 吃掉一半
function rebirthDiscountedCum(key, level) {
	const cum = rebirthBaseCum(key, level)
	if (cum <= 0) return 0
	return Math.ceil(cum * (1 - rebirthDiscount()) - 1e-9)
}

// 下一级实付价 = 打完折的累计价之差
function rebirthBuyCost(key, level) {
	const def = REBIRTH_TRACKS[key]
	if (!def || level >= def.max) return 0
	return Math.max(1, rebirthDiscountedCum(key, level + 1) - rebirthDiscountedCum(key, level))
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
	// mpPeak 同理：它是「前置层点数峰值」，转生把各层清零后峰值必须一起归零，
	// 否则带上一次转生的高水位，模组层一解锁就直接够门槛，整条链一路白给。
	if (player.mpPeak) Vue.set(player, "mpPeak", {})
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
	const need = rebirthModLayerCount()
	const earned = rebirthTotalMemory()
	const msg = "转生是「真转生」：除模组记忆等级与记忆点外，全部进度清零 ——\n" +
		"资源、升级、设施、首通标记、挑战、成就、层间任务、商店自动化、深层反哺都会重置。\n" +
		"第 " + rebirthRound() + " 轮打通 " + need + " 层：本次可领 " + gain + " 记忆，累计 " + earned + " 点。\n" +
		"本轮声望 " + rebirthRunPrestigeCount() + " 次 → 下一轮记忆价格 −" + Math.round(rebirthDiscountAt(rebirthRunPrestigeCount()) * 100) + "%（每 100 次 −1%，上限 −10%）。\n" +
		"转生后抽 3 条世界词条选 1 条，本轮生效。\n" +
		"记忆在下方换成永久升级，并且不会因转生减少。确定转生？"
	if (!confirm(msg)) return
	// 冻结本轮：打通 30 层算一轮，记忆总额 = 冻结轮数 × 10 + 本轮已赚（期中可能已经先领了 5 点）
	// 注意别在重置后再算总额 —— 首通清零前 done 仍然算 1，会重复计一轮
	const rounds = rebirthRound()
	player.rebirth.rounds = rounds
	player.rebirth.claimed = Math.max(rebirthClaimed(), earned)
	player.rebirth.basePrestige = rebirthPrestigeCount()
	// 冻结本轮折扣：按刚打完这一轮的声望算，下一轮买记忆时生效（真转生之后本轮声望就清零了）
	const runPrestiges = rebirthRunPrestigeCount()
	player.rebirth.discount = rebirthDiscountAt(runPrestiges)
	player.rebirth.discountPrestige = runPrestiges
	rebirthResetAll()
	if (typeof rollWorldMods === "function") {
		rollWorldMods()
		if (typeof doPopup === "function") {
			doPopup("default", "本轮世界词条已抽取：去「模组记忆」页三选一，选完才开始生效", "世界词条", 6)
		}
	}
}

// 期中可以单独领：不重置进度，只是把这一轮的 5 点先拿到手
function rebirthStageClaimable() {
	if (!rebirthStageMet()) return 0
	if (rebirthClearedCount() >= rebirthModLayerCount()) return 0
	return Math.min(rebirthClaimable(), REBIRTH_STAGE_MEMORY)
}

function rebirthCollectStage() {
	const gain = rebirthStageClaimable()
	if (gain <= 0) return
	if (typeof confirm === "function") {
		const msg = "领取本轮期中 " + gain + " 记忆：\n" +
			"本轮首通 " + rebirthClearedCount() + " 层、声望 " + rebirthRunPrestigeCount() + " 次，已达期中门槛（" +
			REBIRTH_STAGE_LAYERS + " 层 + " + REBIRTH_STAGE_PRESTIGES + " 次）。\n" +
			"领取不会重置进度，可以继续打；打通 " + rebirthModLayerCount() + " 层后再真转生领剩下的 " +
			(REBIRTH_MEMORY_PER_ROUND - REBIRTH_STAGE_MEMORY) + " 点。\n" +
			"期中的 5 点包含在本轮 " + REBIRTH_MEMORY_PER_ROUND + " 点里，不会额外多给。确定领取？"
		if (!confirm(msg)) return
	}
	player.rebirth.claimed = rebirthClaimed() + gain
	updateTemp()
	if (typeof needCanvasUpdate !== "undefined") needCanvasUpdate = true
}

function rebirthBuy(key) {
	const def = REBIRTH_TRACKS[key]
	if (!def || !player || !player.rebirth) return
	const level = rebirthLevel(key)
	if (level >= def.max) return
	const cost = rebirthBuyCost(key, level)
	if (rebirthAvailable() < cost) return
	if (!player.rebirth.levels) Vue.set(player.rebirth, "levels", {})
	Vue.set(player.rebirth.levels, key, level + 1)
	// 按实付记账：打折买下的部分不能让「已投入」按原价回涨
	player.rebirth.spent = rebirthSpent() + cost
	updateTemp()
}

function rebirthTrackCard(key) {
	const def = REBIRTH_TRACKS[key]
	const level = rebirthLevel(key)
	const maxed = level >= def.max
	const cost = maxed ? 0 : rebirthBuyCost(key, level)
	const baseCost = maxed ? 0 : def.cost(level)
	const discount = rebirthDiscount()
	const can = !maxed && rebirthAvailable() >= cost
	const badge = maxed ? "已满级" : "等级 " + level + " / " + def.max
	return '<div class="shop-card ' + (maxed ? "owned" : can ? "purchasable" : "dim") + '">' +
		'<div class="shop-card-head"><span class="shop-card-name">' + def.name + '</span>' +
			'<span class="shop-badge ' + (maxed ? "owned" : "muted") + '">' + badge + '</span></div>' +
		'<div class="shop-price">' + def.desc + '<br>当前：' + def.effect(level) +
			(maxed ? "" : "<br>下一级：" + def.effect(level + 1)) +
			(maxed || cost >= baseCost ? "" : "<br><span class=\"rebirth-discount\">本轮折扣 −" + Math.round(discount * 100) + "%：原价 " + baseCost + "</span>") + '</div>' +
		'<button class="shop-buy" ' + (can ? "" : "disabled") + ' onclick="rebirthBuy(\'' + key + '\')">' +
			(maxed ? "已满级" : "花费 " + cost + " 记忆") + '</button>' +
	'</div>'
}

function rebirthTabHTML() {
	const cleared = rebirthClearedCount()
	const need = rebirthModLayerCount()
	const rounds = rebirthRound()
	const total = rebirthTotalMemory()
	const claimable = rebirthClaimable()
	const claimed = rebirthClaimed()
	const spent = rebirthSpent()
	const available = rebirthAvailable()
	// 期中档进度：20 层首通 + 50 次本轮声望，两个都要
	const stageLayers = Math.min(cleared, REBIRTH_STAGE_LAYERS)
	const stagePrestiges = Math.min(rebirthRunPrestigeCount(), REBIRTH_STAGE_PRESTIGES)
	const stageMet = rebirthStageMet()
	const stageClaimable = rebirthStageClaimable()
	const canClaim = claimable > 0 && cleared >= need
	const canStage = stageClaimable > 0
	const layerCount = Object.keys(layers).filter(function(id) { return id !== "rebirth" && id !== "tree-tab" }).length
	const stageText = cleared >= need
		? '本轮 <b>' + need + ' 层已打通</b>（期中 + 全通共 ' + REBIRTH_MEMORY_PER_ROUND + ' 点可领）'
		: canStage
		? '本轮期中 <b>已达标</b>（+' + REBIRTH_STAGE_MEMORY + ' 点，可领）'
		: stageMet
		? '本轮期中 <b>已达标</b>（+' + REBIRTH_STAGE_MEMORY + ' 点，已领）'
		: '本轮期中：首通 <b>' + stageLayers + ' / ' + REBIRTH_STAGE_LAYERS + '</b> · 声望 <b>' + stagePrestiges + ' / ' + REBIRTH_STAGE_PRESTIGES + '</b>（达标 +' + REBIRTH_STAGE_MEMORY + ' 点）'
	// 封顶折扣：真转生时按本轮声望结算，下一轮一直有效
	const discount = rebirthDiscount()
	const discountPct = Math.round(discount * 100)
	const discountFrom = rebirthDiscountPrestige()
	const discountText = discountPct >= Math.round(REBIRTH_DISCOUNT_MAX * 100)
		? '记忆折扣 <b>−' + discountPct + '%</b>（已封顶）'
		: discountFrom > 0
		? '记忆折扣 <b>−' + discountPct + '%</b>（上轮声望 ' + discountFrom + ' 次，再 ' + rebirthDiscountNext() + ' 次到 −' + (discountPct + 1) + '%）'
		: '记忆折扣 <b>—</b>（' + REBIRTH_DISCOUNT_PER + ' 次声望 −1%，上限 ' + Math.round(REBIRTH_DISCOUNT_MAX * 100) + '%，真转生后结算）'
	return '<div class="shop-wrap">' +
		'<div class="shop-topbar">' +
			'<div class="shop-summary">已首通 <b>' + cleared + ' / ' + need + '</b> · 已真转生 <b>' + rounds + '</b> 次 · ' + stageText + '<br>' +
				'总记忆 <b>' + total + '</b>（每轮 ' + REBIRTH_MEMORY_PER_ROUND + ' = 期中 ' + REBIRTH_STAGE_MEMORY + ' + 全通 ' + (REBIRTH_MEMORY_PER_ROUND - REBIRTH_STAGE_MEMORY) + '） · 已领取 <b>' + claimed + '</b> · 已投入 <b>' + spent + '</b> · 可用 <b>' + available + '</b><br>' +
				discountText +
			'</div>' +
			'<div class="rebirth-actions">' +
				'<button class="shop-master ' + (canStage ? "on" : "off") + '" onclick="rebirthCollectStage()" ' + (canStage ? "" : "disabled") + '>' +
					(canStage ? '领取期中 <b>' + stageClaimable + '</b> 记忆' : (stageMet ? '期中已领取' : '期中未达标')) +
				'</button>' +
				'<button class="shop-master ' + (canClaim ? "on" : "off") + '" onclick="rebirthClaim()" ' + (canClaim ? "" : "disabled") + '>' +
					(canClaim ? '转生并领取 <b>' + claimable + '</b> 记忆' : (cleared >= need ? '暂无可领取记忆' : '打通 ' + need + ' 层后才能转生')) +
				'</button>' +
			'</div>' +
		'</div>' +
		(typeof worldModCardHTML === "function" ? worldModCardHTML() : "") +
		'<div class="shop-grid">' +
			'<div class="shop-card rebirth-wide">' +
				'<div class="shop-card-head"><span class="shop-card-name">真转生规则</span><span class="shop-badge muted">只保留记忆</span></div>' +
				'<div class="rebirth-keep">' +
					'转生会清空 <b>' + layerCount + ' 层</b> 的全部数据：资源、升级、设施、研究、路线、法术、层机制、首通标记与深层反哺，从原木重新开始。<br>' +
					'成就、挑战完成记录、层间任务与商店自动化也一并重置 —— <b>跨转生保留的只有模组记忆等级和记忆点</b>。<br>' +
					'首通 ' + REBIRTH_STAGE_LAYERS + ' 个模组层先露出记忆页（这时只能领期中 ' + REBIRTH_STAGE_MEMORY + ' 点），打通 ' + need + ' 层才能真转生。<br>' +
					'每次转生领取「总记忆 − 已领取」。每轮记忆固定 <b>' + REBIRTH_MEMORY_PER_ROUND + ' 点</b>，分两笔：' +
					'<b>期中 ' + REBIRTH_STAGE_MEMORY + ' 点</b>（本轮首通 ' + REBIRTH_STAGE_LAYERS + ' 层 + 本轮声望 ' + REBIRTH_STAGE_PRESTIGES + ' 次）与 ' +
					'<b>全通 ' + (REBIRTH_MEMORY_PER_ROUND - REBIRTH_STAGE_MEMORY) + ' 点</b>（' + need + ' 层全部首通）。' +
					'期中可以提前领、不重置进度；剩下的全通后再真转生一起拿。只刷声望不打层不给期中 —— 两个条件必须同时满足。' +
					'挂机时长、自动声望次数不会让总额超过每轮 ' + REBIRTH_MEMORY_PER_ROUND + ' 点，记忆也不会因转生减少。<br>' +
					'<b>封顶折扣</b>：真转生时按「刚打完这一轮」的声望结算 —— 每 ' + REBIRTH_DISCOUNT_PER + ' 次 −1%，' +
					'上限 −' + Math.round(REBIRTH_DISCOUNT_MAX * 100) + '%，下一轮一直有效。折扣按整条轨道的累计价算，取整误差不会被放大；' +
					'最便宜的一两级本来只有 2–3 点，抹零后可能看不出差别，3 点以上的价格才明显。' +
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
		rounds: 0,
		// 封顶折扣：真转生时按本轮声望冻结，下轮购买生效
		discount: 0,
		discountPrestige: 0,
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
			"<br>已真转生 " + rebirthRound() + " 次（每轮 +" + REBIRTH_MEMORY_PER_ROUND + "）" +
			"<br>本轮期中 " + Math.min(rebirthClearedCount(), REBIRTH_STAGE_LAYERS) + "/" + REBIRTH_STAGE_LAYERS +
				" 层 · 声望 " + Math.min(rebirthRunPrestigeCount(), REBIRTH_STAGE_PRESTIGES) + "/" + REBIRTH_STAGE_PRESTIGES +
			"<br>本次可领取 " + rebirthClaimable() +
			"<br>记忆折扣 −" + Math.round(rebirthDiscount() * 100) + "%（每 " + REBIRTH_DISCOUNT_PER + " 次声望 −1%，上限 −" + Math.round(REBIRTH_DISCOUNT_MAX * 100) + "%）"
	},
})
