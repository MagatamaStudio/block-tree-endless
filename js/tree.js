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

addLayer("tree-tab", {
    tabFormat: [
		["tree", function() {return (layoutInfo.treeLayout ? layoutInfo.treeLayout : TREE_LAYERS)}],
		["raw-html", function() {return treeHintHTML()}],
	],
    previousTab: "",
    leftTab: true,
    style() {return {"background-color": "transparent"}},
})
