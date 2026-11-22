/* ============================================================
   层间任务（侧边层）
   目标全部来自只增不减的存档状态，完成后奖励立即生效
   ============================================================ */

function questModClearedCount() {
	if (typeof MODPACK === "undefined" || typeof player === "undefined") return 0
	let n = 0
	for (const cfg of MODPACK) if (player[cfg.id] && player[cfg.id].prestiged) n++
	return n
}

function questChallengeCount() {
	if (typeof MODPACK === "undefined" || typeof player === "undefined") return 0
	let n = 0
	for (const cfg of MODPACK) {
		for (const slot of [11, 12, 13]) {
			if (challengeCompletions(cfg.id, slot) > 0) n++
		}
	}
	return n
}

function questFullClearCount() {
	if (typeof MODPACK === "undefined" || typeof player === "undefined") return 0
	let n = 0
	for (const cfg of MODPACK) {
		if ([11, 12, 13].every(x => challengeCompletions(cfg.id, x) > 0)) n++
	}
	return n
}

function questAutoCount() {
	if (typeof player === "undefined" || !player.shop || !player.shop.owns) return 0
	let n = 0
	for (const id in player.shop.owns) if (player.shop.owns[id]) n++
	return n
}

function questPrestigeCount() {
	if (typeof player === "undefined" || !player.quests || !player.quests.stats) return 0
	return player.quests.stats.prestiges || 0
}

function questCountPrestige() {
	if (typeof player === "undefined" || !player.quests) return
	if (!player.quests.stats) Vue.set(player.quests, "stats", { prestiges: 0 })
	player.quests.stats.prestiges = (player.quests.stats.prestiges || 0) + 1
}

const MAIN_QUESTS = [
	{ id: "first", name: "初见模组海", desc: "首通 1 个模组层。", goal: 1, reward: 0.04, unit: "层", progress: questModClearedCount },
	{ id: "five", name: "五层连穿", desc: "首通 5 个模组层。", goal: 5, reward: 0.06, unit: "层", progress: questModClearedCount },
	{ id: "ten", name: "十层工业带", desc: "首通 10 个模组层。", goal: 10, reward: 0.08, unit: "层", progress: questModClearedCount },
	{ id: "twenty", name: "二十层远征", desc: "首通 20 个模组层。", goal: 20, reward: 0.10, unit: "层", progress: questModClearedCount },
	{ id: "thirty", name: "三十层全图", desc: "首通全部 30 个模组层。", goal: 30, reward: 0.12, unit: "层", progress: questModClearedCount },
	{ id: "ch10", name: "挑战者", desc: "累计完成 10 个模组挑战。", goal: 10, reward: 0.04, unit: "个", progress: questChallengeCount },
	{ id: "ch40", name: "挑战收割机", desc: "累计完成 40 个模组挑战。", goal: 40, reward: 0.06, unit: "个", progress: questChallengeCount },
	{ id: "full1", name: "单层全清", desc: "任意 1 层完成全部 3 个挑战。", goal: 1, reward: 0.05, unit: "层", progress: questFullClearCount },
	{ id: "full5", name: "五层全清", desc: "5 层各自完成全部挑战。", goal: 5, reward: 0.08, unit: "层", progress: questFullClearCount },
	{ id: "auto10", name: "自动化网络", desc: "在 10 个层购买自动化。", goal: 10, reward: 0.06, unit: "层", progress: questAutoCount },
	{ id: "depth", name: "深层回响", desc: "深层反哺倍率达到 ×2。", goal: 2, reward: 0.05, unit: "×", decimal: true,
		progress: () => depthBaseMult().toNumber() },
	{ id: "prestige100", name: "声望长跑", desc: "累计完成 100 次模组声望。", goal: 100, reward: 0.08, unit: "次", progress: questPrestigeCount },
]

const QUEST_ALL = {
	id: "all",
	name: "模组海征服者",
	desc: "完成以上全部 " + MAIN_QUESTS.length + " 个任务。",
	goal: MAIN_QUESTS.length,
	reward: 0.10,
	unit: "个",
	progress: () => MAIN_QUESTS.filter(questDone).length,
}

const QUESTS = MAIN_QUESTS.concat([QUEST_ALL])

function questDone(q) {
	return q.progress() >= q.goal
}

function questCompletedCount() {
	let n = 0
	for (const q of QUESTS) if (questDone(q)) n++
	return n
}

function questGlobalBonus() {
	if (typeof player === "undefined" || !player.quests) return 0
	let bonus = 0
	for (const q of QUESTS) if (questDone(q)) bonus += q.reward
	return bonus
}

function questProgressText(q) {
	const p = q.progress()
	if (q.decimal) return "×" + format(Math.min(p, q.goal)) + " / ×" + format(q.goal)
	return formatWhole(Math.min(p, q.goal)) + " / " + formatWhole(q.goal) + " " + q.unit
}

function questCardHTML(q) {
	const p = q.progress()
	const done = p >= q.goal
	const pct = Math.max(0, Math.min(100, q.goal > 0 ? (p / q.goal) * 100 : 0))
	const color = done ? "#6fbf73" : "#7fc7e8"
	const status = done ? "<span style='color:#9adf75'>已完成</span>" : "<span style='opacity:0.65'>进行中</span>"
	return "<div style='text-align:left; border:1px solid " +
		(done ? "rgba(111,191,115,0.55)" : "rgba(255,255,255,0.14)") +
		"; border-radius:10px; padding:10px 12px; background:rgba(0,0,0,0.16); margin:0;'>" +
		"<div style='display:flex; justify-content:space-between; gap:8px;'><b style='color:" + color + "'>" +
		q.name + "</b>" + status + "</div>" +
		"<div style='font-size:13px; opacity:0.85; margin-top:2px;'>" + q.desc + "</div>" +
		"<div style='height:6px; background:rgba(255,255,255,0.12); border-radius:3px; overflow:hidden; margin:7px 0 4px;'>" +
		"<div style='height:100%; width:" + pct + "%; background:" + color + "; margin:0;'></div></div>" +
		"<div style='font-size:13px; display:flex; justify-content:space-between; gap:8px;'>" +
		"<span>进度：" + questProgressText(q) + "</span>" +
		"<span style='color:#e8d38a'>全局产量 +" + format(q.reward * 100) + "%</span></div></div>"
}

function questBoardHTML() {
	return "<div style='display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:10px; max-width:760px; margin:8px auto;'>" +
		QUESTS.map(questCardHTML).join("") + "</div>"
}

addLayer("quests", {
	name: "层间任务",
	symbol: "任务",
	image: "img/quest_book.png",
	row: "side",
	position: 30,
	color: "#7fc7e8",

	startData() { return {
		unlocked: true,
		points: new Decimal(0),
		stats: { prestiges: 0 },
		migrated: false,
	}},

	resource: "任务",

	tabFormat: [
		["display-text", "<h1>层间任务</h1>"],
		["display-text", function() {
			return "已完成 <b>" + questCompletedCount() + " / " + QUESTS.length +
				"</b> · 任务加成：<b>全局产量 +" + format(questGlobalBonus() * 100) + "%</b><br>" +
				"任务自动完成、奖励立即生效；进度只增不减，重置不会回退"
		}, {"font-size": "15px", "opacity": "0.85"}],
		"blank",
		["display-text", questBoardHTML],
	],

	update() {
		if (!player.quests.stats) Vue.set(player.quests, "stats", { prestiges: 0 })
		if (!player.quests.migrated) {
			player.quests.migrated = true
			// 旧存档没有声望计数：按已首通层数回填，避免从 0 重新数
			if (!player.quests.stats.prestiges) {
				player.quests.stats.prestiges = questModClearedCount()
			}
		}
	},

	layerShown() { return true },
	tooltip() {
		return "层间任务 · 已完成 " + questCompletedCount() + " / " + QUESTS.length +
			"<br>全局产量 +" + format(questGlobalBonus() * 100) + "%"
	},
})
