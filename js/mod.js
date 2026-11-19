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
	num: "6.5",
	name: "成就跳墙",
}

let changelog = `<h1>更新日志</h1><br>
	<h3>v6.5 — 成就跳墙</h3><br>
		- 新增成就奖励「跳墙券」：每完成 5 个成就 +1 张，最多 10 张，首通前可免费跳过时间墙。<br>
		- 有券时自动优先消耗，不再扣上一层资源；没有券时仍可花 3 倍需求的资源跳过。<br>
		- 跳墙卡片区分「暂无」与「已用完」，并显示券会自动优先使用；声望条件不足时点击需确认，避免误耗后被挑战重置。<br>
	<h3>v6.1 — 速查与上限</h3><br>
		- 关于页新增「玩法速查」：起步流程、时间墙 / 软上限、自动化商店规则，可折叠展开。<br>
		- 时间设施最多 13 级，满级后在卡片标记「已满级」，不再能继续购买。<br>
		- 文档同步时间设施上限说明。<br>
	<h3>v6.0 — 首通与自动化</h3><br>
		- 每层首次声望通过后不再等待时间墙；首通前可花上一层 3 倍需求的资源直接跳过时间墙。<br>
		- 自动化商店扩展到购买项（设施与主题核心），并为下一层声望保留所需资源；挑战进行中暂停代买，科技层研究分支仍需手动分配。<br>
		- 模组需求曲线调整为 1.45^i，声望指数与软上限同步收紧。<br>
		- 初始原木产出改为 0.5/秒；旧存档自动回填「已首通」标记。<br>
		- 移除主界面的 Discord 按钮，文档与预览图同步更新。<br>
	<h3>v5.5 — 挑战与核心</h3><br>
		- 每层新增 3 个挑战、主题核心与 5–7 号里程碑；挑战完成记录与奖励永久保留。<br>
		- 挑战进入/退出不再级联重置低层，挑战内恢复正常产出；不再顺带解锁下一层或刷研究点。<br>
		- 采集/工业/探索的 5 号里程碑与挑战目标显示对齐实际数值。<br>
		- 文档同步：设施计数、主题核心公式、标题规则与挑战持久化说明。<br>
	<h3>v5.0 — 文案校准</h3><br>
		- 修正各层产量、设施、里程碑与时间墙说明，使显示数值与实际效果一致；每秒自动产出改为显示真实速率。<br>
		- 修正模组 21 号升级与 4 号里程碑的重复乘算，恢复说明中的 ×1.5。<br>
		- 修正基础层 11 号升级与 d/n 里程碑的资源对象，石镐现在真正提供圆石 ×2。<br>
		- 成就 41–50 改为对应层第一个里程碑的条件，避免与 51–80 重复触发和双倍奖励。<br>
		- 修正永远不会出现的新手提示、p22 与 d12 重名「附魔台」、n12 缺少「锭」等问题。<br>
		- 文档同步：级联重置、14.4 小时时间墙上限、商店价格单位与被动产出公式。<br>
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
	这里没有终点，只有越来越慢的收益。`

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

// 各层 21 号升级提供的全局产量倍率（模组层统一为 1.5，见 globalProductionMult）
const GLOBAL_UPGRADE_BOOSTS = {
	s: 1.5,
	i: 2,
	d: 3,
	n: 2,
	e: 2,
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
		// 模组 21 号升级改为线性叠加：每层 +10%，不再乘法爆炸
		let modBoost = 0
		for (const cfg of MODPACK) {
			let data = player[cfg.id]
			if (!data) continue
			// 直接读存档，避免 updateTemp 尚未构建 tmp[层] 时读取 tmp
			if (data.upgrades.includes(21) || data.upgrades.includes("21")) modBoost += 0.1
			if (cfg.trait.global && data.unlocked) {
				let m6 = data.milestones.includes(6) || data.milestones.includes("6")
				modBoost += cfg.trait.global * (m6 ? 2 : 1)
			}
			if (cfg.trait.core === "global" && data.unlocked && data.buyables && data.buyables[18]) {
				modBoost += 0.005 * Math.min(10, data.buyables[18].toNumber())
			}
		}
		mult = mult.times(1 + modBoost)
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

	let gain = new Decimal(0.5)
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
	function() { if (!player.s.unlocked && player.points.lt(tmp.p.requires)) return "提示：点击「橡木林」中的「徒手撸树」开始这个世界。" },
	function() { if (!player.s.unlocked && player.points.gte(tmp.p.requires)) return "原木已经够了——点击「转化为」合成木板并进入石矿洞。" },
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
