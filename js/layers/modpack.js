/* ============================================================
   无尽整合包 · 30 个模组维度
   每层：10 升级 / 4 自动化设施 / 5 里程碑
   每层：时间墙 + 软上限 + 硬上限
   ============================================================ */

const ARCHETYPES = {
	gather: {
		label: "采集",
		upg2: 2,
		upg3: 3,
		upg5: 5,
		passive: 0.06,
		gain: 1.10,
		soft: 5,
		hard: 14,
		time: 0.9,
		cost: 1.0,
		names: ["手工采集", "铜制工具", "矿脉勘探", "传送带", "自动矿机", "深层钻头", "并行开采", "超频采掘", "地质稳定器", "无限矿脉"],
		buys: ["采集场", "筛选机", "仓储区", "运输带"],
	},
	tech: {
		label: "科技",
		upg2: 2.5,
		upg3: 4,
		upg5: 6,
		passive: 0.04,
		gain: 1.12,
		soft: 4,
		hard: 10,
		time: 1.1,
		cost: 1.15,
		names: ["基础电路", "能量网络", "量子处理器", "纳米装配", "反物质反应堆", "时空压缩", "维度引擎", "奇点计算", "硬上限破解", "终局协议"],
		buys: ["计算核心", "能量矩阵", "量子存储器", "自动化总线"],
	},
	magic: {
		label: "魔法",
		upg2: 2,
		upg3: 3,
		upg5: 7,
		passive: 0.06,
		gain: 1.08,
		soft: 7,
		hard: 18,
		time: 0.9,
		cost: 1.0,
		names: ["符文刻印", "魔力循环", "灵魂绑定", "虚空仪式", "星界投影", "时间法阵", "维度裂隙", "创世之书", "软上限突破", "永恒回响"],
		buys: ["符文祭坛", "魔力池", "灵魂熔炉", "时间法阵"],
	},
	industry: {
		label: "工业",
		upg2: 3,
		upg3: 3,
		upg5: 5,
		passive: 0.05,
		gain: 1.15,
		soft: 6,
		hard: 16,
		time: 1.0,
		cost: 1.1,
		names: ["蒸汽机", "流水线", "高压电网", "聚变核心", "物质重组", "戴森环", "行星引擎", "银河物流", "硬上限扩容", "无限产能"],
		buys: ["生产线", "反应堆", "冷却塔", "物流中心"],
	},
	explore: {
		label: "探索",
		upg2: 2,
		upg3: 3,
		upg5: 5,
		passive: 0.04,
		gain: 1.10,
		soft: 9,
		hard: 25,
		time: 1.2,
		cost: 0.9,
		names: ["星图", "跃迁引擎", "虫洞稳定器", "外星遗迹", "维度锚点", "时间胶囊", "平行宇宙", "万象归一", "边界突破", "无尽远征"],
		buys: ["传送门", "探测器", "星门", "远征营地"],
	},
}

const MOD_THEMES = [
	{ id: "t",  name: "暮色森林",   symbol: "暮", resource: "娜迦鳞片",   color: "#3f7a4a", image: "img/twilight_moss.png",  arch: "explore",  intro: "穿过钻石传送门，森林永远笼罩在黄昏里。娜迦、九头蛇与冰雪女王在迷宫深处等着你。" },
	{ id: "b",  name: "植物魔法",   symbol: "植", resource: "魔力钢",     color: "#55b89a", image: "img/manasteel.png",      arch: "magic",    intro: "把花种在符文祭坛周围，让魔力在池中流动。泰拉钢与盖亚守护者，是植物魔法师的终极浪漫。" },
	{ id: "m",  name: "工业时代",   symbol: "电", resource: "电力",       color: "#e0a92e", image: "img/eu_cell.png",        arch: "industry", intro: "第一台发电机轰鸣起来，电缆把整座基地连成一张网。从太阳能到核反应堆，工业就是力量。" },
	{ id: "th", name: "神秘时代",   symbol: "秘", resource: "虚空金属",   color: "#8e6bbf", image: "img/void_metal.png",     arch: "magic",    intro: "研究台前的烛光照亮了禁忌知识。灵气节点、虚空金属与邪术仪式，让世界变得不太稳定。" },
	{ id: "ae", name: "应用能源",   symbol: "AE", resource: "赛特斯石英", color: "#7fc7e8", image: "img/certus_quartz.png",  arch: "tech",     intro: "ME 网络把所有箱子压缩成一个终端。赛特斯石英在加速生长，分子装配室自动合成一切。" },
	{ id: "dr", name: "龙之研究",   symbol: "龙", resource: "混沌碎片",   color: "#b03cff", image: "img/chaos_shard.png",    arch: "tech",     intro: "龙芯的紫色能量撕裂了天空。觉醒龙锭、混沌守卫与能量核心，把力量推向失控的边缘。" },
	{ id: "gc", name: "星系",       symbol: "星", resource: "月球尘埃",   color: "#c9d6e3", image: "img/moon_dust.png",      arch: "explore",  intro: "火箭升空，月球基地在灰色荒原上亮起灯。从火星殖民到空间站，星系模组把自动化送出了地球。" },
	{ id: "gt", name: "格雷科技",   symbol: "格", resource: "等离子",     color: "#ff8c42", image: "img/plasma_cell.png",    arch: "industry", intro: "蒸汽时代只是开始，高压电网与聚变环才是格雷的浪漫。等离子在涡轮中咆哮。" },
	{ id: "pe", name: "等价交换",   symbol: "EMC", resource: "EMC",       color: "#ffd166", image: "img/emc_crystal.png",    arch: "tech",     intro: "转化桌把万物折算成 EMC，再凭空变回万物。贤者之石、暗物质与红物质，让物质守恒变成一句笑话。" },
	{ id: "if", name: "冰与火",     symbol: "冰", resource: "龙鳞",       color: "#5f9ec9", image: "img/mega_01.png",        arch: "gather",   intro: "冰龙与火龙在雪原与火山之间盘旋。猎龙者的第一片龙鳞，意味着一整套龙钢装备。" },
	{ id: "bl", name: "虚无世界",   symbol: "沼", resource: "沼泽泥",     color: "#6b7d4a", image: "img/mega_02.png",        arch: "magic",    intro: "沼泽会吞噬光线。蜻蜓、泥怪与地下祭坛，让虚无世界的每一步都像在梦里。" },
	{ id: "ab", name: "深渊国度",   symbol: "渊", resource: "深渊碎片",   color: "#4b2d6b", image: "img/mega_03.png",        arch: "magic",    intro: "深渊的眼眸在黑暗中睁开。死灵之书、深渊能量与旧日支配者，正在等待新的信徒。" },
	{ id: "ie", name: "沉浸工程",   symbol: "沉", resource: "钢锭",       color: "#8c9a9e", image: "img/mega_04.png",        arch: "industry", intro: "高压电线塔穿过麦田，电弧炉喷出蓝白色火焰。沉浸工程把工业做成了风景。" },
	{ id: "tc", name: "匠魂",       symbol: "匠", resource: "钴锭",       color: "#4f9bd9", image: "img/mega_05.png",        arch: "gather",   intro: "熔炉里的钴蓝液体流进模具。一把真正属于自己的工具，从选择部件开始。" },
	{ id: "fo", name: "林业",       symbol: "林", resource: "蜂王浆",     color: "#d9b44a", image: "img/mega_06.png",        arch: "gather",   intro: "蜂箱在果园里嗡嗡作响。培育蜂王、杂交树苗，林业把耐心变成产量。" },
	{ id: "te", name: "热力膨胀",   symbol: "热", resource: "红石通量",   color: "#d94f3d", image: "img/mega_07.png",        arch: "tech",     intro: "红石通量在导管里奔流。机器升级、自动输出与能量网络，让基地开始自己运转。" },
	{ id: "ei", name: "末影接口",   symbol: "末", resource: "脉冲合金",   color: "#3f8f7a", image: "img/mega_08.png",        arch: "tech",     intro: "末影接口把机器、管道和存储缝在一起。脉冲合金让每一台设备都能互相说话。" },
	{ id: "me", name: "超能物质",   symbol: "超", resource: "反物质",     color: "#c04fd9", image: "img/mega_09.png",        arch: "industry", intro: "反物质在磁约束中安静地悬浮。超能物质把能量密度推到物理学的边缘。" },
	{ id: "nc", name: "核科技",     symbol: "核", resource: "铀燃料",     color: "#7fbf3f", image: "img/mega_10.png",        arch: "industry", intro: "反应堆控制棒缓缓升起，热量在蒸汽中变成电力。核科技从不温柔。" },
	{ id: "br", name: "反应堆",     symbol: "堆", resource: "黄铀锭",     color: "#bfa53f", image: "img/mega_11.png",        arch: "industry", intro: "黄铀锭在反应堆里发出幽幽的光。规模、冷却与效率，是一道永远解不完的方程。" },
	{ id: "ma", name: "神秘农业",   symbol: "农", resource: "精华",       color: "#7fd94f", image: "img/mega_12.png",        arch: "gather",   intro: "把矿物种进耕地，收获一整片资源田。神秘农业让农场成为真正的矿脉。" },
	{ id: "bm", name: "血魔法",     symbol: "血", resource: "生命源质",   color: "#a32424", image: "img/mega_13.png",        arch: "magic",    intro: "生命源质在血祭坛中旋转。以血为代价，换取超越常理的力量。" },
	{ id: "wi", name: "巫术",       symbol: "巫", resource: "咒术粉尘",   color: "#6b4fa3", image: "img/mega_14.png",        arch: "magic",    intro: "坩埚里冒着绿烟，咒术粉尘在月光下闪烁。巫术从不解释，只给结果。" },
	{ id: "an", name: "新生魔艺",   symbol: "源", resource: "源质",       color: "#4fa3d9", image: "img/mega_15.png",        arch: "magic",    intro: "源质从世界树根须间渗出。法术书自动翻页，魔艺正在学习如何自我书写。" },
	{ id: "at", name: "天境",       symbol: "天", resource: "神能",       color: "#d9d94f", image: "img/mega_16.png",        arch: "explore",  intro: "云层之上，天境群岛漂浮在光里。神能让坠落变成飞行，让传说变成地图。" },
	{ id: "et", name: "环境科技",   symbol: "环", resource: "纳米蜂群",   color: "#4fd9bf", image: "img/mega_17.png",        arch: "tech",     intro: "纳米蜂群在太阳能阵列上空盘旋。环境科技把整颗星球当成一台可升级的机器。" },
	{ id: "sd", name: "实用存储",   symbol: "储", resource: "存储升级",   color: "#bf8f4f", image: "img/mega_18.png",        arch: "tech",     intro: "抽屉墙一眼望不到头。存储升级让每一格空间都变成无限仓库。" },
	{ id: "rc", name: "铁路",       symbol: "铁", resource: "强化铁轨",   color: "#9a9a9a", image: "img/mega_19.png",        arch: "industry", intro: "矿车在强化铁轨上呼啸而过。信号灯、编组站与自动化线路，让物流有了节奏。" },
	{ id: "ig", name: "无尽贪婪",   symbol: "贪", resource: "无尽催化剂", color: "#d94f9a", image: "img/mega_20.png",        arch: "magic",    intro: "无尽催化剂在奇点中缓慢成形。它不满足于一个世界，它要所有世界。" },
	{ id: "cr", name: "创造模式",   symbol: "创", resource: "创造能量",   color: "#ff4fa3", image: "img/creative_core.png",  arch: "explore",  intro: "当所有模组都被压缩进同一个存档，创造模式终于露出真容。这里没有终点，只有更高的硬上限。" },
]

const MODPACK = MOD_THEMES.map((theme, i) => ({
	...theme,
	symbol: theme.name,
	short: theme.symbol,
	index: i,
	row: 6 + i,
	prev: i === 0 ? "e" : MOD_THEMES[i - 1].id,
	baseResource: i === 0 ? "末影珍珠" : MOD_THEMES[i - 1].resource,
	requires: 128 * Math.pow(3, i),
	req: 128 * Math.pow(3, i) * DIFFICULTY.toNumber(),
	exponent: Math.max(0.2, 0.45 - i * 0.008),
	effectExp: Math.max(0.3, 0.62 - i * 0.01),
	timeWall: Math.min(12 * 3600, 900 * Math.pow(1.22, i)),
	arch: ARCHETYPES[theme.arch],
}))

MODPACK.forEach((cfg, i) => {
	cfg.next = MODPACK[i + 1] ? MODPACK[i + 1].id : null
})

function mpBuy(cfg, id) {
	if (!player[cfg.id] || !player[cfg.id].buyables) return new Decimal(0)
	return player[cfg.id].buyables[id] || new Decimal(0)
}

function mpSoftcap(cfg) {
	let base = cfg.req * cfg.arch.soft
	if (hasUpgrade(cfg.id, 23)) base *= 1.5
	if (hasMilestone(cfg.id, 2)) base *= 2
	base *= 1 + 0.15 * mpBuy(cfg, 13).toNumber()
	return new Decimal(base)
}

function mpHardcap(cfg) {
	let base = cfg.req * cfg.arch.hard
	if (hasUpgrade(cfg.id, 24)) base *= 1.5
	if (hasMilestone(cfg.id, 3)) base *= 2
	base *= 1 + 0.15 * mpBuy(cfg, 13).toNumber()
	return new Decimal(base)
}

function mpTimeWall(cfg) {
	let wall = cfg.timeWall * cfg.arch.time
	if (hasUpgrade(cfg.id, 25)) wall *= 0.8
	let reduction = Math.min(0.5, mpBuy(cfg, 14).toNumber() * 0.04)
	return wall * (1 - reduction)
}

function mpUpgradeCost(cfg, factor) {
	return new Decimal(cfg.req).times(factor).times(cfg.arch.cost).ceil()
}

function addModLayer(cfg) {
	const id = cfg.id
	const names = cfg.arch.names
	const buys = cfg.arch.buys
	const upgradeIds = [11, 12, 13, 14, 15, 21, 22, 23, 24, 25]
	const costs = [0.002, 0.004, 0.008, 0.015, 0.03, 0.05, 0.09, 0.14, 0.22, 0.34]

	const upgrades = {}
	for (let j = 0; j < 10; j++) {
		const uid = upgradeIds[j]
		upgrades[uid] = {
			title: cfg.short + "·" + names[(j + cfg.index) % names.length],
			description: [
				cfg.resource + "产量 ×" + cfg.arch.upg2 + "。",
				"解锁「" + buys[0] + "」，购买设施后开始自动产出" + cfg.resource + "。",
				cfg.resource + "产量 ×" + cfg.arch.upg3 + "。",
				"生产设施产出 ×1.5。",
				cfg.resource + "产量 ×" + cfg.arch.upg5 + "。",
				"所有产量 ×1.5。",
				"解锁「" + buys[1] + "」，每级使声望收益 ×" + cfg.arch.gain + "。",
				"软上限 ×1.5。",
				"硬上限 ×1.5，解锁「" + buys[2] + "」。",
				"时间墙 -20%，解锁「" + buys[3] + "」。",
			][j],
			cost: mpUpgradeCost(cfg, costs[j]),
			unlocked() { return j === 0 || hasUpgrade(id, upgradeIds[j - 1]) },
		}
	}

	const buyableData = {
		11: {
			title: cfg.short + "·" + buys[0],
			cost(x) { return Decimal.pow(1.8, x).times(cfg.req * 0.01).floor() },
			effect(x) { return x.times(cfg.arch.passive) },
			display() {
				let amount = getBuyableAmount(this.layer, this.id)
				let data = tmp[this.layer].buyables[this.id]
				return "等级 " + formatWhole(amount) +
					"<br>成本：" + format(data.cost) + " " + cfg.resource +
					"<br>自动产出 +" + format(tmp[this.layer].passiveGeneration.times(tmp[this.layer].resetGain)) + "/秒"
			},
			unlocked() { return hasUpgrade(id, 12) },
			canAfford() { return player[id].points.gte(tmp[id].buyables[11].cost) },
			buy() {
				let cost = tmp[this.layer].buyables[this.id].cost
				player[this.layer].points = player[this.layer].points.sub(cost)
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			style: { "height": "190px", "width": "230px" },
		},
		12: {
			title: cfg.short + "·" + buys[1],
			cost(x) { return Decimal.pow(1.9, x).times(cfg.req * 0.02).floor() },
			effect(x) { return Decimal.pow(cfg.arch.gain, x) },
			display() {
				let amount = getBuyableAmount(this.layer, this.id)
				let data = tmp[this.layer].buyables[this.id]
				return "等级 " + formatWhole(amount) +
					"<br>成本：" + format(data.cost) + " " + cfg.resource +
					"<br>声望收益 ×" + format(this.effect())
			},
			unlocked() { return hasUpgrade(id, 22) },
			canAfford() { return player[id].points.gte(tmp[id].buyables[12].cost) },
			buy() {
				let cost = tmp[this.layer].buyables[this.id].cost
				player[this.layer].points = player[this.layer].points.sub(cost)
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			style: { "height": "190px", "width": "230px" },
		},
		13: {
			title: cfg.short + "·" + buys[2],
			cost(x) { return Decimal.pow(2.0, x).times(cfg.req * 0.03).floor() },
			effect(x) { return x.times(0.15) },
			display() {
				let amount = getBuyableAmount(this.layer, this.id)
				let data = tmp[this.layer].buyables[this.id]
				return "等级 " + formatWhole(amount) +
					"<br>成本：" + format(data.cost) + " " + cfg.resource +
					"<br>软/硬上限 +" + format(this.effect().times(100)) + "%"
			},
			unlocked() { return hasUpgrade(id, 24) },
			canAfford() { return player[id].points.gte(tmp[id].buyables[13].cost) },
			buy() {
				let cost = tmp[this.layer].buyables[this.id].cost
				player[this.layer].points = player[this.layer].points.sub(cost)
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			style: { "height": "190px", "width": "230px" },
		},
		14: {
			title: cfg.short + "·" + buys[3],
			cost(x) { return Decimal.pow(2.1, x).times(cfg.req * 0.04).floor() },
			effect(x) { return x.times(0.04) },
			display() {
				let amount = getBuyableAmount(this.layer, this.id)
				let data = tmp[this.layer].buyables[this.id]
				return "等级 " + formatWhole(amount) +
					"<br>成本：" + format(data.cost) + " " + cfg.resource +
					"<br>时间墙 -" + format(this.effect().min(0.5).times(100)) + "%"
			},
			unlocked() { return hasUpgrade(id, 25) },
			canAfford() { return player[id].points.gte(tmp[id].buyables[14].cost) },
			buy() {
				let cost = tmp[this.layer].buyables[this.id].cost
				player[this.layer].points = player[this.layer].points.sub(cost)
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			style: { "height": "190px", "width": "230px" },
		},
	}

	addLayer(id, {
		name: cfg.name,
		symbol: cfg.symbol,
		image: cfg.image,
		position: 0,
		row: cfg.row,
		branches: [[cfg.prev, cfg.color, 10]],

		startData() { return {
			unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
		}},

		color: cfg.color,
		resource: cfg.resource,
		baseResource: cfg.baseResource,
		baseAmount() { return player[cfg.prev].points },
		requires: dReq(cfg.requires),
		type: "normal",
		exponent: cfg.exponent,
		softcap() { return mpSoftcap(cfg) },
		softcapPower: 0.5,
		hardcap() { return mpHardcap(cfg) },

		getResetGain() {
			let gain = player[cfg.prev].points.div(new Decimal(cfg.requires).times(DIFFICULTY))
				.pow(cfg.exponent)
				.times(layers[id].gainMult())
				.pow(layers[id].gainExp())
			let sc = mpSoftcap(cfg)
			if (gain.gte(sc)) gain = gain.pow(0.5).times(sc.pow(0.5))
			gain = gain.floor().max(0)
			let room = mpHardcap(cfg).sub(player[id].points).max(0)
			return gain.min(room)
		},

		gainMult() {
			let mult = new Decimal(1)
			if (hasUpgrade(id, 11)) mult = mult.times(cfg.arch.upg2)
			if (hasUpgrade(id, 13)) mult = mult.times(cfg.arch.upg3)
			if (hasUpgrade(id, 15)) mult = mult.times(cfg.arch.upg5)
			if (hasMilestone(id, 0)) mult = mult.times(1.5)
			mult = mult.times(Decimal.pow(cfg.arch.gain, mpBuy(cfg, 12)))
			mult = mult.times(globalProductionMult())
			if (cfg.next) mult = mult.times(layers[cfg.next].effect())
			return mult
		},
		gainExp() { return new Decimal(1) },

		effect() {
			return player[id].points.add(1).pow(cfg.effectExp)
		},
		effectDescription() {
			return "，每份" + cfg.resource + "让" + cfg.baseResource + "产量 ×" + format(this.effect())
		},

		passiveGeneration() {
			if (!hasUpgrade(id, 12)) return new Decimal(0)
			let rate = mpBuy(cfg, 11).times(cfg.arch.passive)
			if (hasUpgrade(id, 14)) rate = rate.times(1.5)
			if (hasMilestone(id, 1)) rate = rate.times(2)
			return rate
		},

		update() {
			let cap = mpHardcap(cfg)
			if (player[id].points.gt(cap)) player[id].points = cap
			if (player[id].best.gt(cap)) player[id].best = cap
		},

		canReset() {
			return player[id].resetTime >= mpTimeWall(cfg) &&
				player[cfg.prev].points.gte(dReq(cfg.requires)) &&
				player[id].points.lt(mpHardcap(cfg))
		},

		infoboxes: {
			intro: {
				title: "模组档案 · " + cfg.name,
				body: cfg.intro + "<br><br><span style='color:#9adf75'>原型：" + cfg.arch.label +
					" · 时间墙：" + Math.round(cfg.timeWall * cfg.arch.time / 60) + " 分钟起 · 每层都有软上限与硬上限</span>",
			},
		},

		tabFormat: [
			["infobox", "intro"],
			"main-display",
			"prestige-button",
			"resource-display",
			["display-text", function() {
				let wall = mpTimeWall(cfg)
				let remain = Math.max(0, wall - player[id].resetTime)
				return "时间墙：" + formatTime(wall) +
					(remain > 0 ? "（还需 " + formatTime(remain) + "）" : "（已满足）") +
					"<br>软上限：" + format(tmp[id].softcap) +
					" · 硬上限：" + format(mpHardcap(cfg))
			}, {"font-size": "15px", "color": "#cfcfcf"}],
			"blank",
			"milestones",
			"buyables",
			"upgrades",
		],

		milestones: {
			0: {
				requirementDescription() { return formatWhole(cfg.req * 0.1) + " " + cfg.resource },
				effectDescription: cfg.resource + "产量 ×1.5",
				done() { return player[id].best.gte(cfg.req * 0.1) },
			},
			1: {
				requirementDescription() { return formatWhole(cfg.req * 0.5) + " " + cfg.resource },
				effectDescription: "自动设施产出 ×2",
				done() { return player[id].best.gte(cfg.req * 0.5) },
			},
			2: {
				requirementDescription() { return formatWhole(cfg.req) + " " + cfg.resource },
				effectDescription: "软上限 ×2",
				done() { return player[id].best.gte(cfg.req) },
			},
			3: {
				requirementDescription() { return formatWhole(cfg.req * 2) + " " + cfg.resource },
				effectDescription: "硬上限 ×2",
				done() { return player[id].best.gte(cfg.req * 2) },
			},
			4: {
				requirementDescription() { return formatWhole(cfg.req * 5) + " " + cfg.resource },
				effectDescription: "所有产量 ×1.5",
				done() { return player[id].best.gte(cfg.req * 5) },
			},
		},

		buyables: buyableData,
		upgrades: upgrades,

		doReset(resettingLayer) {
			if (layers[resettingLayer].row > this.row) layerDataReset(this.layer)
			if (resettingLayer === id && cfg.next && !player[cfg.next].unlocked) {
				player[cfg.next].unlocked = true
				player[cfg.next].resetTime = 0
				needCanvasUpdate = true
			}
		},

		layerShown() { return true },
		tooltip() {
			let wall = mpTimeWall(cfg)
			let remain = Math.max(0, wall - player[id].resetTime)
			return cfg.resource + " ×" + formatWhole(player[id].points) +
				"<br>时间墙 " + formatTime(wall) + (remain > 0 ? " · 还需 " + formatTime(remain) : " · 已满足") +
				"<br>软上限 " + format(mpSoftcap(cfg)) + " · 硬上限 " + format(mpHardcap(cfg))
		},
		tooltipLocked() {
			return "完成上一阶段的声望后解锁<br>前置资源：" + cfg.baseResource
		},
	})
}

for (const cfg of MODPACK) {
	addModLayer(cfg)
}
