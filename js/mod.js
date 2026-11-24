let modInfo = {
	name: "方块树：无尽模组海",
	id: "blocktree",
	author: "q(eˣ)qe308",
	pointsName: "原木",
	modFiles: ["features.js", "layers/overworld.js", "layers/nether_end.js", "layers/modpack-structs.js", "layers/modpack.js", "layers/achievements.js", "layers/shop.js", "layers/story.js", "layers/quests.js", "layers/rifts.js", "layers/rebirth.js", "tree.js"],

	discordName: "",
	discordLink: "",
	initialStartPoints: new Decimal(10), // 新世界开始时手里的第一捧原木
	offlineLimit: 12,  // 离线收益上限（小时）
}

// 版本号与副标题
let VERSION = {
	num: "11.5",
	name: "数量级门槛",
	// 资源串：改过任何 js 就 +1，让 index.html 与 loader 注入的脚本一起失效，
	// 否则旧 mod.js 配新层文件（或反过来）会直接白屏
	asset: "11.5.0",
}

let changelog = `<h1>更新日志</h1>
<p style="opacity:.7;max-width:760px;margin:0 auto 12px">每版一句话，完整记录见仓库 wiki 的「更新日志」页。</p>
<br>
<details class="cl-box"><summary>v11.5 · 声望封顶与层深减速</summary><ul>
<li>一次声望不再一步冲到顶，层越深攒得越慢（末层慢约 24 倍）。</li>
</ul></details>
<details class="cl-box"><summary>v11.4 · 数量级门槛</summary><ul>
<li>门槛按数量级跳，跳不过就得回头补产量。</li>
</ul></details>
<details class="cl-box"><summary>v11.3 · 后段门槛不再暴涨</summary><ul>
<li>后段几层门槛改成同档，不再一层一味翻倍。</li>
</ul></details>
<details class="cl-box"><summary>v11.2 · 市场、网格与节奏</summary><ul>
<li>三种新玩法：看行情买卖、摆模块、按节拍操作。</li>
</ul></details>
<details class="cl-box"><summary>v11.1 · 配方与蓝图</summary><ul>
<li>两种新玩法：凑配方、照蓝图施工。</li>
</ul></details>
<details class="cl-box"><summary>v11.0 · 每层有自己的玩法</summary><ul>
<li>层玩法拆成「结构」，先上配比型。</li>
</ul></details>
<details class="cl-box"><summary>v10.2 · 记忆折扣有上限</summary><ul>
<li>记忆越买越便宜，但有折扣上限。</li>
</ul></details>
<details class="cl-box"><summary>v10.1 · 记忆分两段结算</summary><ul>
<li>记忆改成打到一半、全通各结算一次。</li>
</ul></details>
<details class="cl-box"><summary>v10.0 · 90 个挑战总览</summary><ul>
<li>挑战汇总成一页，达成越多全局加成越高。</li>
</ul></details>
<details class="cl-box"><summary>v9.9 · 记忆按打通轮数</summary><ul>
<li>记忆按打通轮数累积，不看挂机时长。</li>
</ul></details>
<details class="cl-box"><summary>v9.8 · 橡木林不被回退</summary><ul>
<li>橡木林不参与回退，开局不用重来。</li>
</ul></details>
<details class="cl-box"><summary>v9.7 · 科技树只画前沿三层</summary><ul>
<li>科技树只显示最前面三层。</li>
</ul></details>
<details class="cl-box"><summary>v9.6 · 新增剧情页</summary><ul>
<li>新增剧情页，按层首通解锁手记。</li>
</ul></details>
<details class="cl-box"><summary>v9.5 · 攻略扩到八节</summary><ul>
<li>攻略扩到八节，新玩法都有说明。</li>
</ul></details>
<details class="cl-box"><summary>v9.4 · 深层不再掉帧</summary><ul>
<li>层数多时不再掉帧。</li>
</ul></details>
<details class="cl-box"><summary>v9.3 · 首通不再要求收益 ≥1</summary><ul>
<li>门槛够了就能首通，不用等收益凑到 1。</li>
</ul></details>
<details class="cl-box"><summary>v9.2 · 声望只回退 3 层</summary><ul>
<li>一次声望最多回退 3 层，前面打下的都留着。</li>
</ul></details>
<details class="cl-box"><summary>v9.1 · 记忆总额收敛</summary><ul>
<li>记忆总额按 ^0.6 结算，堆多了也收敛。</li>
</ul></details>
<details class="cl-box"><summary>v9.0 · 四种手动操作</summary><ul>
<li>每层多了专精、连击、裂隙、押注。</li>
</ul></details>
<details class="cl-box"><summary>v8.7 · 开局要自己点</summary><ul>
<li>开局不再白送原木。</li>
</ul></details>
<details class="cl-box"><summary>v8.6 · 修自动声望与存档</summary><ul>
<li>修了自动声望提前触发、存档读坏。</li>
</ul></details>
<details class="cl-box"><summary>v8.5 · 时间墙改成投入点数</summary><ul>
<li>时间墙改成投点数施工，进度看得见。</li>
</ul></details>
<details class="cl-box"><summary>v8.4 · 时间墙变软</summary><ul>
<li>时间墙不再硬卡，可以提前过。</li>
</ul></details>
<details class="cl-box"><summary>v8.3 · 离线也能打开</summary><ul>
<li>前端改成本地加载，断网也进得去。</li>
</ul></details>
<details class="cl-box"><summary>v8.2 · 分屏 HUD 居中</summary><ul>
<li>分屏时 HUD 居中。</li>
</ul></details>
<details class="cl-box"><summary>v8.1 · HUD 显示上层资源</summary><ul>
<li>HUD 多显示上一层的资源。</li>
</ul></details>
<details class="cl-box"><summary>v8.0 · 科技树每行三个</summary><ul>
<li>科技树每行三个节点，一屏看得完。</li>
</ul></details>
<details class="cl-box"><summary>v7.9 · 深层不再卡</summary><ul>
<li>产量每帧只算一次，深层更顺。</li>
</ul></details>
<details class="cl-box"><summary>v7.8 · 商店与成就改卡片</summary><ul>
<li>商店、成就墙改成卡片式。</li>
</ul></details>
<details class="cl-box"><summary>v7.7 · 真转生「记忆」</summary><ul>
<li>新增真转生，重开也带着进度。</li>
</ul></details>
<details class="cl-box"><summary>v7.6 · 速查改名「游戏攻略」</summary></details>
<details class="cl-box"><summary>v7.5 · 层间任务</summary><ul>
<li>每层一组小任务，做完给加成。</li>
</ul></details>
<details class="cl-box"><summary>v7.4 · 层机制拆成三种变体</summary><ul>
<li>层机制拆成三种变体，每层玩法不同。</li>
</ul></details>
<details class="cl-box"><summary>v7.3 · 前六层专属机制</summary><ul>
<li>原版六层各加了专属机制。</li>
</ul></details>
<details class="cl-box"><summary>v7.2 · 本层规则卡</summary><ul>
<li>每层页面加了规则卡，一眼看懂怎么玩。</li>
</ul></details>
<details class="cl-box"><summary>v7.1 · 研究点按超出比例</summary><ul>
<li>研究点改成按超出比例给。</li>
</ul></details>
<details class="cl-box"><summary>v7.0 · 深层反哺原木</summary><ul>
<li>深层产量反哺下层原木，前段不用干等。</li>
</ul></details>
<details class="cl-box"><summary>v6.9 · 声望最多回退 5 层</summary></details>
<details class="cl-box"><summary>v6.8 · 自动购买按新价结算</summary><ul>
<li>自动购买每次刷新价格。</li>
</ul></details>
<details class="cl-box"><summary>v6.7 · 时间墙封顶 2 小时</summary><ul>
<li>时间墙最多等 2 小时。</li>
</ul></details>
<details class="cl-box"><summary>v6.6 · 自动化商店改本层资源</summary><ul>
<li>自动化商店用本层资源买。</li>
</ul></details>
<details class="cl-box"><summary>v6.5 · 新增跳墙券</summary><ul>
<li>新增跳墙券，能跳过一次等待。</li>
</ul></details>
<details class="cl-box"><summary>v6.1 · 新增玩法速查</summary></details>
<details class="cl-box"><summary>v6.0 · 首通免等时间墙</summary><ul>
<li>首次通关不用等。</li>
</ul></details>
<details class="cl-box"><summary>v5.5 · 挑战、主题核心与里程碑</summary><ul>
<li>新增挑战、主题核心、里程碑。</li>
</ul></details>
<details class="cl-box"><summary>v5.0 · 文案与速率校准</summary><ul>
<li>文案和实际速率对上。</li>
</ul></details>
<details class="cl-box"><summary>v4.5 · 树场一键买满</summary><ul>
<li>树场可以一键买满。</li>
</ul></details>
<details class="cl-box"><summary>v4.4 · 自动化商店</summary><ul>
<li>能用本层资源买自动购买、自动声望。</li>
</ul></details>
<details class="cl-box"><summary>v4.3 · 彩蛋补丁（不告诉你）</summary></details>
<details class="cl-box"><summary>v4.2 · 全局难度 ×5</summary></details>
<details class="cl-box"><summary>v4.1 · 全局难度 ×2</summary></details>
<details class="cl-box"><summary>v4.0 · 模组层扩到 30 个</summary><ul>
<li>一条树 36 层。</li>
</ul></details>
<details class="cl-box"><summary>v2.0 · 整合包任务书</summary><ul>
<li>10 个维度 + 任务书。</li>
</ul></details>
<details class="cl-box"><summary>v0.1 · 从一棵橡树开始</summary></details>`

let winText = `你已经把整片模组海堆到了极限。<br><br>
	这里没有终点，只有越来越慢的收益。`

// 全局难度：所有需求、升级与自动化造价按此倍率放大
// 玩家可在设置页调整（默认 1.0×），存在 player.difficulty 里，读档时由 fixOldSave 应用
// 只保留 1.0× 及以上：低于 1.0 的档位会把需求压到 1 位数，整条链一路平推，没有游戏可言
const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5]
let DIFFICULTY = new Decimal(1)

function difficultyNow() {
	const raw = (typeof player !== "undefined" && player) ? Number(player.difficulty) : 1
	return DIFFICULTY_LEVELS.includes(raw) ? raw : 1
}

function setDifficulty(v) {
	const next = DIFFICULTY_LEVELS.includes(Number(v)) ? Number(v) : 1
	if (typeof player !== "undefined" && player) player.difficulty = next
	DIFFICULTY = new Decimal(next)
	// 模组层的 req / 门槛 / 层需求都是按难度算出来的，改完就地重算一遍
	if (typeof refreshModpackReq === "function") refreshModpackReq()
	if (typeof updateTemp === "function") updateTemp()
	if (typeof needCanvasUpdate !== "undefined") needCanvasUpdate = true
}

function adjustDifficulty() {
	const i = DIFFICULTY_LEVELS.indexOf(difficultyNow())
	setDifficulty(DIFFICULTY_LEVELS[(i + 1) % DIFFICULTY_LEVELS.length])
}

function difficultyLabel() {
	const v = difficultyNow()
	return v.toFixed(1) + "×"
}

// 层间回馈：原版六层的产量都乘「下一层的效果」，而效果本身是点数^指数。
// 六层串成一条链、再叠上模组层对末影珍珠的放大，闭环里会有限时间爆炸（原木能刷到 e11000000）。
// 这里把单链路效果压住：1e12 以下原样，以上按 log10 开方，闭环的指数就封顶了。
function chainEffect(e) {
	const v = new Decimal(e)
	// 坏档里的 Infinity / NaN 别指望开方能救回来，直接按上限处理
	if (!v.isFinite()) return new Decimal("1e100")
	if (v.lte(1e12)) return v
	return v.log10().sub(12).times(0.5).pow10().times(1e12)
}

function dReq(n) {
	// 需求取整：难度倍率一乘就会出现 25.81 这种尾巴，而上一层的结算产出是整数，
	// 差这 0.3 就永远跨不过去（低难度整条链卡在「差一点点」）。
	return new Decimal(n).times(DIFFICULTY).floor().max(1)
}

function upgCost(n) {
	return new Decimal(n).times(DIFFICULTY).ceil()
}

// 原版层的升级价格 = 本层门槛的固定比例（0.33 / 0.6 / 1 / 1.9 / 3.4 倍）。
// 以前写死 1/2/5/15/40 这种绝对值，门槛一涨、产量一高就变成零钱；改成跟门槛一起缩放，
// 第一档吃掉三成门槛，最后一档要攒够三个多门槛，升级才和「过不过这一层」抢钱。
function vUpg(id, frac) {
	const req = layers[id].requires
	return new Decimal(req).times(frac).ceil().max(1)
}

function mcBuyCost(base, ratio, x) {
	// 低难度下 floor 会算出 0，白送等于送产量，至少收 1
	return Decimal.pow(ratio, x).times(base).times(DIFFICULTY).floor().max(1)
}

// 各层 21 号升级提供的全局产量倍率（原版六层为乘算，模组层另按 +10% 线性叠加，见 globalProductionMult）
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
// updateTemp 内各层 gainMult 会重复调用，按次缓存结果，避免 O(层数²) 扫描
let globalProductionMultCache = null

function refreshGlobalProductionMult() {
	globalProductionMultCache = computeGlobalProductionMult()
}

function globalProductionMult() {
	if (globalProductionMultCache !== null) return globalProductionMultCache
	return computeGlobalProductionMult()
}

// 仅成就提供的产量加成，成就页摘要直接复用
function achievementProductionMult() {
	let mult = new Decimal(1)
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

function computeGlobalProductionMult() {
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
				modBoost += typeof mpTraitGlobal === "function" ? mpTraitGlobal(cfg) : 0
			}
			if (cfg.trait.core === "global" && data.unlocked) {
				modBoost += typeof mpCoreGlobal === "function" ? mpCoreGlobal(cfg) : 0
			}
		}
		mult = mult.times(1 + modBoost)
	}

	mult = mult.times(achievementProductionMult())
	// 层间任务：已完成任务的奖励线性叠加，避免连乘
	if (typeof questGlobalBonus === "function") mult = mult.times(1 + questGlobalBonus())
	// 挑战总览：每通关一个挑战 +0.5% 全局产量，每满 10 个再 +5%（满 90 个 +90%）
	if (typeof challengeGlobalBonus === "function") {
		const chBonus = challengeGlobalBonus()
		if (chBonus > 0) mult = mult.times(1 + chBonus)
	}
	// 转生记忆：每级 +10%，最多 10 级，同样走加法
	if (typeof rebirthGlobalBonus === "function") {
		const bonus = rebirthGlobalBonus()
		if (bonus > 0) mult = mult.times(1 + bonus)
	}
	// 点击连击：每层 +15%，最多 5 层，30 秒不点就断
	if (typeof clickComboMult === "function") mult = mult.times(clickComboMult())
	// 裂隙增益：限时全局加成
	if (typeof riftBuffMult === "function") mult = mult.times(riftBuffMult())
	// 世界词条：全局产量倍率
	if (typeof worldModProd === "function") mult = mult.times(worldModProd())
	return mult
}

// 深层反哺：第三层起的每层历史最高资源永久提升原木基础产量，重置不会清零
// 各层按 effectExp 折算后线性相加，避免 30 多个模组层连乘把基础产量推到失控
const DEPTH_BASE_EXP = 0.15
const VANILLA_EFFECT_EXP = { i: 0.5, d: 0.6, n: 0.6, e: 0.7 }

function computeDepthBaseMult() {
	let bonus = new Decimal(0)
	for (const layer in layers) {
		const row = layers[layer].row
		if (typeof row !== "number" || row < 2) continue
		const data = player[layer]
		if (!data || !data.unlocked || !data.everBest) continue
		let ever = data.everBest instanceof Decimal ? data.everBest : new Decimal(data.everBest || 0)
		if (!ever.isFinite()) continue
		let exp = VANILLA_EFFECT_EXP[layer]
		if (exp === undefined && typeof MODPACK !== "undefined") {
			for (const cfg of MODPACK) if (cfg.id === layer) exp = cfg.effectExp
		}
		if (exp === undefined) continue
		// 模组记忆「记忆深潜」：每级把反哺指数再加 0.02
		let expBonus = typeof rebirthDepthBonus === "function" ? rebirthDepthBonus() : 0
		bonus = bonus.add(ever.add(1).pow((exp + expBonus) * DEPTH_BASE_EXP).sub(1))
	}
	return bonus.add(1)
}

// 每帧刷新一次，避免产量计算与界面反复遍历 36 层
let depthBaseCache = null
function refreshDepthBaseMult() {
	depthBaseCache = computeDepthBaseMult()
}
function depthBaseMult() {
	if (depthBaseCache === null) refreshDepthBaseMult()
	return depthBaseCache
}

// 点击撸树的收益
function clickPower() {
	let power = new Decimal(1)
	if (hasUpgrade("p", 11)) power = power.times(2)
	if (hasUpgrade("p", 21)) power = power.times(5)
	power = power.times(player.p.points.add(1).pow(0.2))
	// 点击是真实时间操作：随加速开方放大（封顶 10×），否则高加速下点击等于没有
	if (typeof clickSpeedMult === "function") power = power.times(clickSpeedMult())
	// 世界词条：点击收益倍率
	if (typeof worldModClick === "function") power = power.times(worldModClick())
	// 连点叠层要真的加到点击上：只加「全局产量」的话，橡木林开局没有被动产出，连击等于看不见
	if (typeof clickComboMult === "function") power = power.times(clickComboMult())
	return power
}

// 每秒原木产量
function getPointGen() {
	if(!canGenPoints())
		return new Decimal(0)

	// 开局没有自动产出：原木只能靠「徒手撸树」点出来，产量要靠升级与树场挣
	let gain = new Decimal(0)
	if (hasMilestone("p", 0)) gain = gain.add(2)
	if (hasUpgrade("p", 11)) gain = gain.times(2)
	if (hasUpgrade("p", 12)) gain = gain.times(1.5)
	if (hasUpgrade("p", 22)) gain = gain.times(5)

	// 树场：每级 +2 原木/秒，并乘 1.15 倍。1.15^级数是指数加成，而级数能用原木无限买，
	// 于是原木自己把自己推成 e11000000（全游戏只有这一处指数加成）。
	// 50 级以内照旧，之后再涨按级数开方：仍然越买越强，但不再是纯指数。
	// 老档里 buyables 可能存成 number / 字符串 / 干脆没有这个键，直接 .times 会抛错，
	// 而 getPointGen 每帧都跑，一抛就是整页白屏。先裹成 Decimal。
	const groveLv = new Decimal(player.p.buyables[11] === undefined ? 0 : player.p.buyables[11])
	gain = gain.add(groveLv.times(2))
	gain = gain.times(Decimal.pow(1.15, groveLv.min(50)))
	if (groveLv.gt(50)) gain = gain.times(groveLv.sub(50).add(1).pow(0.5))

	// 木板本身会反哺森林
	gain = gain.times(tmp.p.effect)
	if (hasMilestone("p", 1)) gain = gain.times(2)

	gain = gain.times(depthBaseMult())
	gain = gain.times(globalProductionMult())
	return gain
}

// 顶部 HUD 第二行跟随最后打开的非侧栏层；没有记录时退回橡木林
function hudFocusLayer() {
	let tab = player.tab
	if (tab && layers[tab] && player[tab] && player[tab].unlocked && tmp[tab] &&
		tmp[tab].row !== "side" && tmp[tab].row !== "otherside") return tab
	let last = player.lastSafeTab
	if (last && layers[last] && player[last] && player[last].unlocked) return last
	return layers.p ? "p" : null
}

function hudFocusRate(layer) {
	let gen = tmp[layer].passiveGeneration
	if (!gen || !tmp[layer].resetGain) return new Decimal(0)
	return new Decimal(gen).times(tmp[layer].resetGain)
}

function hudSubText() {
	let layer = hudFocusLayer()
	if (!layer) return ""
	let rate = hudFocusRate(layer)
	let html = "<b>" + formatWhole(player[layer].points) + "</b> " + (layers[layer].resource || "")
	if (rate.gt(0)) html += ' <span class="hud-sub-rate">+' + formatSmall(rate) + "/秒</span>"
	return html
}

function hudDepthText() {
	let mult = depthBaseMult()
	if (mult.lte(1.0001)) return ""
	return "深层反哺 ×" + format(mult)
}

function hudModText() {
	if (typeof MODPACK === "undefined") return ""
	let unlocked = MODPACK.filter(c => player[c.id] && player[c.id].unlocked).length
	return "模组 " + unlocked + " / " + MODPACK.length
}

// 用于顶部提示的动态文本
var displayThings = [
	function() { if (!player.s.unlocked && player.points.lt(tmp.p.requires)) return "提示：点击「橡木林」中的「徒手撸树」开始这个世界。" },
	function() { if (!player.s.unlocked && player.points.gte(tmp.p.requires)) return "原木已经够了——点击「转化为」合成木板并进入石矿洞。" },
]

function addedPlayerData() { return {
	difficulty: 1,
	// 各层点数峰值。层自己的 best 会被级联重置、首通清零反复打回 0，
	// 放在这里当跨重置高水位，模组层的入账池（mpPrevPool）只认它。
	mpPeak: {},
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
	// 难度存在存档里（player.difficulty），层定义却是在还没有存档的时候建的，
	// 所以读档后按存档值把需求重算一遍。
	// 11.3 之前所有存档都跑在 ×5 的难度上，直接按新的 1.0 读档等于把门槛砍掉 5 倍，
	// 进度会瞬间对不上号，所以老档按 ×5 保留；新档从 1.0 起。
	if (typeof player !== "undefined" && player && typeof refreshModpackReq !== "undefined") {
		const legacy = !(parseFloat(oldVersion) >= 11.3)
		const progressed = player.points && player.points.gt(1e3)
		if (legacy && progressed) setDifficulty(5)
		else setDifficulty(difficultyNow())
	}
	// 老档没有跨重置峰值：用现有 best / 点数兜个底，免得模组链的入账池从 0 重新攒
	// fixOldSave 是在读档路径上跑的，这里抛一个错就是整页打不开，所以一律裹成 Decimal 再兜 try
	if (typeof player !== "undefined" && player && !player.mpPeak) {
		const peak = {}
		try {
			for (const id in player) {
				const d = player[id]
				if (!d || typeof d !== "object" || d.points === undefined || d.points === null) continue
				const pts = new Decimal(d.points)
				const best = d.best === undefined || d.best === null ? new Decimal(0) : new Decimal(d.best)
				if (!pts.isFinite() || !best.isFinite()) continue
				peak[id] = pts.max(best)
			}
		} catch (e) {
			console.warn("mpPeak 兜底失败，按空表处理", e)
		}
		if (typeof Vue !== "undefined" && Vue.set) Vue.set(player, "mpPeak", peak)
		else player.mpPeak = peak
	}
}
