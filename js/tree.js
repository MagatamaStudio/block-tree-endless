var layoutInfo = {
    startTab: "none",
    startNavTab: "tree-tab",
	showTree: true,

    treeLayout: ""
}


// 树末尾的一行提示：模组海总共多少层、走到哪、后面还有多少层没露面
function treeHintHTML() {
	let cleared = 0
	for (const cfg of MODPACK) {
		const data = player[cfg.id]
		if (data && data.prestiged) cleared++
	}
	const total = MODPACK.length
	if (cleared >= total) return '<span class="tree-hint"><b>模组海 ' + total + ' / ' + total + ' · 全部首通</b><span class="tree-hint-tail">再往下是「模组记忆」</span></span>'
	const hidden = Math.max(0, total - (mpTreeFrontier() + 1 + MP_TREE_PREVIEW))
	const tail = hidden > 0
		? '树只画到前方 ' + MP_TREE_PREVIEW + ' 层，还有 ' + hidden + ' 层等进度推进后再出现'
		: total + ' 个节点都露出来了，剩下就是逐层首通'
	return '<span class="tree-hint"><b>模组海共 ' + total + ' 层 · 已首通 ' + cleared + ' / ' + total + '</b><span class="tree-hint-tail">' + tail + '</span></span>'
}

// 挑战总览：90 个挑战（30 层 × 3）通了多少、折算成多少全局产量
// 层内的 ×1.5 / ×1.25 太散，不给一条汇总玩家根本感觉不到
function treeChallengeHTML() {
	if (typeof challengeClearedTotal !== "function" || typeof challengeGlobalBonus !== "function") return ""
	const n = challengeClearedTotal()
	const total = (typeof MODPACK === "undefined" ? 30 : MODPACK.length) * 3
	const tier = CHALLENGE_GLOBAL_TIER
	const tierPct = Math.round(CHALLENGE_GLOBAL_TIER_BONUS * 100)
	const pct = Math.round(challengeGlobalBonus() * 1000) / 10
	const fullPct = Math.round((total * CHALLENGE_GLOBAL_PER + Math.floor(total / tier) * CHALLENGE_GLOBAL_TIER_BONUS) * 1000) / 10
	const pctText = (pct % 1 === 0) ? String(pct) : pct.toFixed(1)
	const tail = n >= total
		? '全部通关 · 层内奖励与全局加成吃满'
		: '还差 ' + ((Math.floor(n / tier) + 1) * tier - n) + ' 个再 +' + tierPct + '%，全清共 +' + fullPct + '%'
	return '<span class="tree-hint"><b>挑战 ' + n + ' / ' + total + ' · 全局产量 +' + pctText + '%</b><span class="tree-hint-tail">' + tail + '</span></span>'
}

addLayer("tree-tab", {
    tabFormat: [
		["tree", function() {return (layoutInfo.treeLayout ? layoutInfo.treeLayout : TREE_LAYERS)}],
		["raw-html", function() {return treeHintHTML()}],
		["raw-html", function() {return treeChallengeHTML()}],
	],
    previousTab: "",
    leftTab: true,
    style() {return {"background-color": "transparent"}},
})
