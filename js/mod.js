let modInfo = {
	name: "方块树：无尽模组海",
	id: "blocktree",
	author: "q(eˣ)qe308",
	pointsName: "原木",
	modFiles: ["layers/overworld.js", "layers/nether_end.js", "layers/modpack.js", "layers/achievements.js", "layers/shop.js", "tree.js"],

	discordName: "",
	discordLink: "",
	initialStartPoints: new Decimal(10), // 新世界开始时手里的第一捧原木
	offlineLimit: 12,  // 离线收益上限（小时）
}

// 版本号与副标题
let VERSION = {
	num: "4.5",
	name: "一键与开关",
}

let changelog = `<h1>更新日志</h1><br>
	<h3>v4.5 — 一键与开关</h3><br>
		- 树场新增「一键买满」按钮。<br>
		- 商店商品购买后解锁自动购买开关，可随时开关。<br>
	<h3>v4.4 — 自动化商店</h3><br>
		- 侧边新增自动化商店。<br>
		- 可用下一层资源购买上一层自动购买升级，价格昂贵。<br>
	<h3>v4.3 — 彩蛋补丁</h3><br>
		- 不告诉你哦~<br>
		- 就是不告诉你哦~<br>
	<h3>v4.2 — 极限难度</h3><br>
		- 全局难度从 ×2.0 提高到 ×5.0，需求与造价大幅提高。<br>
		- 节点继续显示完整层名，升级/设施保留短前缀。<br>
	<h3>v4.1 — 难度与可读性</h3><br>
		- 全局难度从 ×1.5 提高到 ×2.0，需求与造价更高。<br>
		- 科技树节点改为显示完整层名，不再只显示单字。<br>
		- 修复未解锁提示框竖排、设置页英文、字体过粗的问题。<br>
	<h3>v4.0 — 无尽模组海</h3><br>
		- 模组层从 10 个扩展到 30 个，科技树共 36 层。<br>
		- 每个模组层 10 个升级、4 座自动化设施、5 个里程碑。<br>
		- 每层独立时间墙＋软上限＋硬上限；硬上限由设施与里程碑继续抬高。<br>
		- 层与层之间改为声望自动解锁，不再依赖 1000 小时任务书。<br>
		- 新增 30 个模组成就，成就墙扩展到 52 个。<br>
		- 取消固定通关时长，进入无尽堆叠模式。<br>
	<h3>v2.0 — 整合包：一千小时</h3><br>
		- 加入整合包任务书与 10 个模组维度。<br>
	<h3>v0.1 — 第一块木板</h3><br>
		- 从一棵橡树开始，砍伐原木、合成木板。`

let winText = `你已经把整片模组海堆到了极限。<br><br>
	这里没有终点，只有更高的硬上限。`

// 全局难度：所有需求、升级与自动化造价再乘 5.0
const DIFFICULTY = new Decimal(5.0)

function dReq(n) {
	return new Decimal(n).times(DIFFICULTY)
}

function upgCost(n) {
	return new Decimal(n).times(DIFFICULTY).ceil()
}

function mcBuyCost(base, ratio, x) {
	return Decimal.pow(ratio, x).times(base).times(DIFFICULTY).floor()
}

// 各层 21 号升级提供的全局产量倍率
const GLOBAL_UPGRADE_BOOSTS = {
	s: 1.5,
	i: 2,
	d: 3,
	n: 2,
	e: 2,
	t: 1.5,
	b: 1.5,
	m: 1.5,
	th: 1.5,
	ae: 1.5,
	dr: 1.5,
	gc: 1.5,
	gt: 1.5,
	pe: 1.5,
	cr: 2,
}

// 如果有函数副作用，不要每帧调用它们（这里沿用模板示例）
var doNotCallTheseFunctionsEveryTick = ["blowUpEverything"]

function getStartPoints(){
    return new Decimal(modInfo.initialStartPoints)
}

// 原木始终可以自然增长
function canGenPoints(){
	return true
}

// 所有维度共享的全局产量倍率
function globalProductionMult() {
	let mult = new Decimal(1)

	for (const layer in GLOBAL_UPGRADE_BOOSTS) {
		if (hasUpgrade(layer, 21))
			mult = mult.times(GLOBAL_UPGRADE_BOOSTS[layer])
	}

	if (hasMilestone("e", 0)) mult = mult.times(2)

	if (typeof MODPACK !== "undefined") {
		for (const cfg of MODPACK) {
			if (hasUpgrade(cfg.id, 21)) mult = mult.times(1.5)
			if (hasMilestone(cfg.id, 4)) mult = mult.times(1.5)
		}
	}

	if (hasAchievement("a", 13)) mult = mult.times(1.1)
	if (hasAchievement("a", 14)) mult = mult.times(1.1)
	if (hasAchievement("a", 21)) mult = mult.times(1.15)
	if (hasAchievement("a", 22)) mult = mult.times(1.2)
	if (hasAchievement("a", 24)) mult = mult.times(1.25)
	if (hasAchievement("a", 31)) mult = mult.times(1.3)
	if (hasAchievement("a", 32)) mult = mult.times(1.5)

	// 模组成就：每个 +5%
	for (let i = 41; i <= 50; i++) {
		if (hasAchievement("a", i)) mult = mult.times(1.05)
	}
	// 无尽模组层成就：每个 +1.5%
	for (let i = 51; i <= 80; i++) {
		if (hasAchievement("a", i)) mult = mult.times(1.015)
	}
	return mult
}

// 点击撸树的收益
function clickPower() {
	let power = new Decimal(1)
	if (hasUpgrade("p", 11)) power = power.times(2)
	if (hasUpgrade("p", 21)) power = power.times(5)
	power = power.times(player.p.points.add(1).pow(0.2))
	return power
}

// 每秒原木产量
function getPointGen() {
	if(!canGenPoints())
		return new Decimal(0)

	let gain = new Decimal(1)
	if (hasMilestone("p", 0)) gain = gain.add(2)
	if (hasUpgrade("p", 11)) gain = gain.times(2)
	if (hasUpgrade("p", 12)) gain = gain.times(1.5)
	if (hasUpgrade("p", 22)) gain = gain.times(5)

	// 树场：每级 +2 原木/秒，并乘 1.15 倍
	gain = gain.add(player.p.buyables[11].times(2))
	gain = gain.times(Decimal.pow(1.15, player.p.buyables[11]))

	// 木板本身会反哺森林
	gain = gain.times(tmp.p.effect)
	if (hasMilestone("p", 1)) gain = gain.times(2)

	gain = gain.times(globalProductionMult())
	return gain
}

// 用于顶部提示的动态文本
var displayThings = [
	function() { return "每秒采集 <b>" + format(tmp.pointGen) + "</b> 原木" },
	function() {
		if (typeof MODPACK !== "undefined") {
			let unlocked = MODPACK.filter(c => player[c.id] && player[c.id].unlocked).length
			return "模组层 <b>" + unlocked + "</b> / " + MODPACK.length + " · 无尽堆叠模式"
		}
	},
	function() { if (!player.s.unlocked) return "提示：点击「橡木林」中的「徒手撸树」开始这个世界。" },
	function() { if (player.p.points.gte(10) && !player.s.unlocked) return "木板已经够了——点击「转化为」进入石矿洞。" },
]

function addedPlayerData() { return {
}}

// 无尽模式：完成所有模组层后仍可继续堆叠
function isEndgame() {
	return false
}

// 背景交给 CSS 处理，这里不额外叠加
var backgroundStyle = {
}

function maxTickLength() {
	return(3600)
}

function fixOldSave(oldVersion){
}
