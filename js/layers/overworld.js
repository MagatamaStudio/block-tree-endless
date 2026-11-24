/* ============================================================
   主世界 · 四层进阶
   原木 → 木板 → 圆石 → 铁锭 → 钻石
   ============================================================ */

// ------------------------------------------------------------
// 第 0 层：橡木林
// ------------------------------------------------------------
addLayer("p", {
	name: "橡木林",
	symbol: "橡木林",
	image: "img/oak_log.png",
	position: 0,
	row: 0,
	branches: [["s", "#5a4630", 12]],

	startData() { return {
		unlocked: true,
		points: new Decimal(0),
		best: new Decimal(0),
		total: new Decimal(0),
		lastClick: 0,
		prestiged: false,
	}},

	color: "#b5834b",
	resource: "木板",
	baseResource: "原木",
	baseAmount() { return player.points },
	get requires() { return dReq(15) },
	type: "normal",
	exponent: 0.55,

	gainMult() {
		let mult = new Decimal(1)
		if (hasUpgrade("p", 13)) mult = mult.times(2)
		mult = mult.times(globalProductionMult())
		return mult
	},
	gainExp() { return new Decimal(1) },

	// 只喂下一层（圆石），不再乘回原木：产物回头加成本层产出就是自己推自己
	effect() {
		return player.p.points.add(1).pow(0.6)
	},
	effectDescription() {
		return "，每根木板让圆石产量 ×" + format(this.effect())
	},

	infoboxes: {
		intro: {
			title: "生存日志 · 第 1 天",
			body: "你醒来时，身边只有一棵橡树。<br>用拳头撸下原木，合成木板，然后向地下挖。<br><span style='color:#7ec850'>提示：按住升级按钮可以连续购买。</span>",
		},
	},

	tabFormat: [
		["infobox", "intro"],
		"main-display",
		["row", [
			["clickable", 11],
			["column", [
				"prestige-button",
				"resource-display",
			], {"justify-content": "center"}],
		]],
		"blank",
		"milestones",
		"blank",
		"buyables",
		["clickable", 12],
		"upgrades",
	],

	clickables: {
		11: {
			title: "徒手撸树",
			display() {
				const stacks = typeof clickComboStacks === "function" ? clickComboStacks() : 0
				const combo = stacks > 0
					? "<br><span style='color:#9adf75'>连击 " + stacks + " 层 · 点击 ×" + format(clickComboMult()) + "</span>"
					: "<br><span style='opacity:.65'>连点 3 下叠 1 层，最多 5 层</span>"
				return "点击 +" + format(clickPower()) + " 原木<br><span style='opacity:.65'>间隔 " + (clickInterval() / 1000).toFixed(2) + " 秒</span>" + combo
			},
			canClick() {
				return Date.now() - (player.p.lastClick || 0) > clickInterval()
			},
			onClick() {
				player.p.lastClick = Date.now()
				player.points = player.points.add(clickPower())
				makeParticles(logParticle)
				if (typeof noteClick === "function") noteClick()
				// 连击改了全局产量倍率，立刻重算一次，不然要等下一帧数字才动
				if (typeof refreshGlobalProductionMult === "function") refreshGlobalProductionMult()
				if (typeof updateTempAfterAction === "function") updateTempAfterAction("p")
			},
			style: { "height": "150px", "width": "220px" },
		},
		12: {
			title: "一键买满树场",
			display() {
				return "当前等级 " + formatWhole(getBuyableAmount("p", 11)) +
					"<br>按当前木板自动购买"
			},
			unlocked() { return hasUpgrade("p", 12) },
			canClick() { return player.p.points.gte(tmp.p.buyables[11].cost) },
			onClick() {
				buyMaxBuyable("p", 11)
				updateTempAfterAction("p")
			},
			style: { "height": "110px", "width": "210px" },
		},
	},

	milestones: {
		0: {
			requirementDescription: "10 木板",
			effectDescription: "原木基础产量 +2/秒",
			done() { return player.p.best.gte(10) },
		},
		1: {
			requirementDescription: "100 木板",
			effectDescription: "原木产量 ×2",
			done() { return player.p.best.gte(100) },
		},
	},

	buyables: {
		11: {
			title: "树场",
			cost(x) { return mcBuyCost(5, 1.4, x) },
			effect(x) { return Decimal.pow(1.8, x) },
			display() {
				let amount = getBuyableAmount(this.layer, this.id)
				let data = (tmp[this.layer] && tmp[this.layer].buyables && tmp[this.layer].buyables[this.id]) || layers[this.layer].buyables[this.id]
				return "等级 " + formatWhole(amount) +
					"<br>成本：" + format(data.cost) + " 木板" +
					"<br>产量 ×" + format(this.effect()) +
					"<br>基础 +" + format(amount.times(2)) + " 原木/秒"
			},
			unlocked() { return hasUpgrade("p", 12) },
			canAfford() { return player.p.points.gte(tmp.p.buyables[11].cost) },
			buy() {
				let cost = getBuyableCost(this.layer, this.id)
				player[this.layer].points = player[this.layer].points.sub(cost)
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			buyMax() {
				const money = player.p.points
				const ratio = new Decimal(1.4)
				const amount = getBuyableAmount("p", 11)
				const first = new Decimal(5).times(DIFFICULTY).times(ratio.pow(amount))
				if (money.lt(first)) return
				let n = money.div(first).times(ratio.sub(1)).add(1).log(ratio).floor()
				let cost = first.times(ratio.pow(n).sub(1)).div(ratio.sub(1))
				let guard = 0
				while (n.gt(0) && cost.gt(money) && guard < 100) {
					n = n.sub(1)
					cost = first.times(ratio.pow(n).sub(1)).div(ratio.sub(1))
					guard++
				}
				if (n.lte(0)) return
				player.p.points = money.sub(cost.floor())
				setBuyableAmount("p", 11, amount.add(n))
			},
			style: { "height": "190px", "width": "210px" },
		},
	},

	upgrades: {
		11: {
			title: "木斧",
			description: "原木产量 ×2。",
			cost() { return vUpg("p", 0.7) },
		},
		12: {
			title: "工作台",
			description: "解锁「树场」，原木产量 ×1.5。",
			cost() { return vUpg("p", 1.3) },
			unlocked() { return hasUpgrade("p", 11) },
		},
		13: {
			title: "木镐",
			description: "木板产量 ×2。",
			cost() { return vUpg("p", 2.2) },
			unlocked() { return hasUpgrade("p", 12) },
		},
		21: {
			title: "骨粉",
			description: "点击撸树获得 5 倍原木。",
			cost() { return vUpg("p", 3.8) },
			unlocked() { return hasUpgrade("p", 13) },
		},
		22: {
			title: "效率 V",
			description: "原木产量 ×5；木板产量基于圆石提升。",
			cost() { return vUpg("p", 6.5) },
			unlocked() { return hasUpgrade("p", 21) },
		},
	},

	doReset(resettingLayer) {
		if (layers[resettingLayer].row > this.row) retainStartKit(this.layer, ["prestiged"])
		if (resettingLayer === "p") player[this.layer].prestiged = true
		if (resettingLayer === "p" && !player.s.unlocked) {
			player.s.unlocked = true
			player.s.resetTime = 0
			needCanvasUpdate = true
		}
	},

	layerShown() { return true },
	tooltip() {
		return "木板 ×" + formatWhole(player.p.points) +
			"<br>原木产量 ×" + format(this.effect())
	},
	tooltipLocked() {
		return "再收集一些原木，就能合成第一块木板。"
	},
	hotkeys: [
		{key: "p", description: "P：合成木板", onPress() { if (canReset(this.layer)) doReset(this.layer) }},
	],
})

const logParticle = {
	spread: 18,
	gravity: 0,
	time: 1.4,
	speed: 0,
	text: function() { return "<b style='color:#c9a227'>+" + format(clickPower()) + " 原木</b>" },
	offset: 24,
	fadeInTime: 0.25,
}

// ------------------------------------------------------------
// 第 1 层：石矿洞
// ------------------------------------------------------------
addLayer("s", {
	name: "石矿洞",
	symbol: "石矿洞",
	image: "img/cobblestone.png",
	position: 0,
	row: 1,
	branches: [["i", "#6b6b6b", 12]],

	startData() { return {
		unlocked: false,
		points: new Decimal(0),
		best: new Decimal(0),
		total: new Decimal(0),
		prestiged: false,
	}},

	color: "#9a9a9a",
	resource: "圆石",
	baseResource: "木板",
	baseAmount() { return player.p.points },
	get requires() { return dReq(60) },
	type: "normal",
	exponent: 0.5,

	gainMult() {
		let mult = new Decimal(1)
		if (hasUpgrade("s", 11)) mult = mult.times(2)
		if (hasUpgrade("s", 13)) mult = mult.times(3)
		if (hasUpgrade("s", 22)) mult = mult.times(5)
		if (hasMilestone("s", 1)) mult = mult.times(2)
		mult = mult.times(chainEffect(layers.p.effect()))
		mult = mult.times(globalProductionMult())
		return mult
	},
	gainExp() { return new Decimal(1) },

	effect() {
		return player.s.points.add(1).pow(0.5)
	},
	effectDescription() {
		return "，每块圆石让铁锭产量 ×" + format(chainEffect(this.effect()))
	},

	passiveGeneration() {
		if (!hasUpgrade("s", 12)) return new Decimal(0)
		let rate = player.s.buyables[11].times(0.15)
		if (hasMilestone("s", 0)) rate = rate.times(1.5)
		if (hasUpgrade("s", 22)) rate = rate.times(2)
		return rate
	},

	infoboxes: {
		intro: {
			title: "生存日志 · 第 2 天",
			body: "木镐敲开了第一块石头。<br>圆石能让你的木板产量飞涨；把矿工留在矿洞里，它们会持续挖矿。",
		},
	},

	milestones: {
		0: {
			requirementDescription: "10 圆石",
			effectDescription: "矿工产出 ×1.5",
			done() { return player.s.best.gte(10) },
		},
		1: {
			requirementDescription: "100 圆石",
			effectDescription: "圆石产量 ×2",
			done() { return player.s.best.gte(100) },
		},
	},

	buyables: {
		11: {
			title: "矿工",
			cost(x) { return mcBuyCost(8, 1.6, x) },
			effect(x) {
				let rate = x.times(0.15)
				if (hasMilestone("s", 0)) rate = rate.times(1.5)
				if (hasUpgrade("s", 22)) rate = rate.times(2)
				return rate
			},
			display() {
				let amount = getBuyableAmount(this.layer, this.id)
				let data = (tmp[this.layer] && tmp[this.layer].buyables && tmp[this.layer].buyables[this.id]) || layers[this.layer].buyables[this.id]
				return "已雇佣 " + formatWhole(amount) + " 人" +
					"<br>成本：" + format(data.cost) + " 圆石" +
					"<br>自动产出 +" + format(tmp[this.layer].passiveGeneration.times(tmp[this.layer].resetGain)) + " 圆石/秒"
			},
			unlocked() { return hasUpgrade("s", 12) },
			canAfford() { return player.s.points.gte(tmp.s.buyables[11].cost) },
			buy() {
				let cost = getBuyableCost(this.layer, this.id)
				player[this.layer].points = player[this.layer].points.sub(cost)
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			style: { "height": "190px", "width": "210px" },
		},
	},

	upgrades: {
		11: {
			title: "石镐",
			description: "圆石产量 ×2。",
			cost() { return vUpg("s", 0.7) },
		},
		12: {
			title: "熔炉",
			description: "解锁「矿工」，自动产出圆石。",
			cost() { return vUpg("s", 1.3) },
			unlocked() { return hasUpgrade("s", 11) },
		},
		13: {
			title: "矿车",
			description: "圆石产量 ×3。",
			cost() { return vUpg("s", 2.2) },
			unlocked() { return hasUpgrade("s", 12) },
		},
		21: {
			title: "火把",
			description: "所有产量 ×1.5。",
			cost() { return vUpg("s", 3.8) },
			unlocked() { return hasUpgrade("s", 13) },
		},
		22: {
			title: "深层矿道",
			description: "圆石产量 ×5，矿工产出 ×2。",
			cost() { return vUpg("s", 6.5) },
			unlocked() { return hasUpgrade("s", 21) },
		},
	},

	doReset(resettingLayer) {
		if (layers[resettingLayer].row > this.row) retainStartKit(this.layer, ["prestiged"])
		if (resettingLayer === "s") player[this.layer].prestiged = true
		if (resettingLayer === "s" && !player.i.unlocked) {
			player.i.unlocked = true
			player.i.resetTime = 0
			needCanvasUpdate = true
		}
	},

	layerShown() { return true },
	tooltip() {
		return "圆石 ×" + formatWhole(player.s.points) +
			"<br>木板产量 ×" + format(this.effect())
	},
	tooltipLocked() {
		return "需要 " + formatWhole(layers.s.requires) + " 木板<br>你拥有 " + formatWhole(player.p.points) + " 木板"
	},
	hotkeys: [
		{key: "s", description: "S：开采圆石", onPress() { if (canReset(this.layer)) doReset(this.layer) }},
	],
})

// ------------------------------------------------------------
// 第 2 层：铁矿脉
// ------------------------------------------------------------
addLayer("i", {
	name: "铁矿脉",
	symbol: "铁矿脉",
	image: "img/iron_block.png",
	position: 0,
	row: 2,
	branches: [["d", "#b9b9b9", 12]],

	startData() { return {
		unlocked: false,
		points: new Decimal(0),
		best: new Decimal(0),
		total: new Decimal(0),
		prestiged: false,
	}},

	color: "#d9d9d9",
	resource: "铁锭",
	baseResource: "圆石",
	baseAmount() { return player.s.points },
	get requires() { return dReq(80) },
	type: "normal",
	exponent: 0.45,

	gainMult() {
		let mult = new Decimal(1)
		if (hasUpgrade("i", 11)) mult = mult.times(2)
		if (hasUpgrade("i", 13)) mult = mult.times(3)
		if (hasUpgrade("i", 22)) mult = mult.times(5)
		if (hasMilestone("i", 0)) mult = mult.times(1.5)
		mult = mult.times(chainEffect(layers.s.effect()))
		mult = mult.times(globalProductionMult())
		return mult
	},
	gainExp() { return new Decimal(1) },

	effect() {
		return player.i.points.add(1).pow(0.5)
	},
	effectDescription() {
		return "，每块铁锭让钻石产量 ×" + format(chainEffect(this.effect()))
	},

	passiveGeneration() {
		if (!hasUpgrade("i", 12)) return new Decimal(0)
		let rate = player.i.buyables[11].times(0.08)
		if (hasMilestone("i", 1)) rate = rate.times(2)
		return rate
	},

	infoboxes: {
		intro: {
			title: "生存日志 · 第 3 天",
			body: "石镐挖到了铁。<br>高炉阵列会把矿石炼成铁锭，即使你正在地表种树。",
		},
	},

	milestones: {
		0: {
			requirementDescription: "10 铁锭",
			effectDescription: "铁锭产量 ×1.5",
			done() { return player.i.best.gte(10) },
		},
		1: {
			requirementDescription: "100 铁锭",
			effectDescription: "高炉阵列产出 ×2",
			done() { return player.i.best.gte(100) },
		},
	},

	buyables: {
		11: {
			title: "高炉阵列",
			cost(x) { return mcBuyCost(10, 1.65, x) },
			effect(x) { return x.times(0.08) },
			display() {
				let amount = getBuyableAmount(this.layer, this.id)
				let data = (tmp[this.layer] && tmp[this.layer].buyables && tmp[this.layer].buyables[this.id]) || layers[this.layer].buyables[this.id]
				return "运行 " + formatWhole(amount) + " 座" +
					"<br>成本：" + format(data.cost) + " 铁锭" +
					"<br>自动产出 +" + format(tmp[this.layer].passiveGeneration.times(tmp[this.layer].resetGain)) + " 铁锭/秒"
			},
			unlocked() { return hasUpgrade("i", 12) },
			canAfford() { return player.i.points.gte(tmp.i.buyables[11].cost) },
			buy() {
				let cost = getBuyableCost(this.layer, this.id)
				player[this.layer].points = player[this.layer].points.sub(cost)
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			style: { "height": "190px", "width": "210px" },
		},
	},

	upgrades: {
		11: {
			title: "铁镐",
			description: "铁锭产量 ×2。",
			cost() { return vUpg("i", 0.7) },
		},
		12: {
			title: "高炉",
			description: "解锁「高炉阵列」，自动产出铁锭。",
			cost() { return vUpg("i", 1.3) },
			unlocked() { return hasUpgrade("i", 11) },
		},
		13: {
			title: "铁轨",
			description: "铁锭产量 ×3。",
			cost() { return vUpg("i", 2.2) },
			unlocked() { return hasUpgrade("i", 12) },
		},
		21: {
			title: "铁砧",
			description: "所有产量 ×2。",
			cost() { return vUpg("i", 3.8) },
			unlocked() { return hasUpgrade("i", 13) },
		},
		22: {
			title: "盾牌",
			description: "铁锭产量 ×5。",
			cost() { return vUpg("i", 6.5) },
			unlocked() { return hasUpgrade("i", 21) },
		},
	},

	doReset(resettingLayer) {
		if (layers[resettingLayer].row > this.row) retainStartKit(this.layer, ["prestiged"])
		if (resettingLayer === "i") player[this.layer].prestiged = true
		if (resettingLayer === "i" && !player.d.unlocked) {
			player.d.unlocked = true
			player.d.resetTime = 0
			needCanvasUpdate = true
		}
	},

	layerShown() { return true },
	tooltip() {
		return "铁锭 ×" + formatWhole(player.i.points) +
			"<br>圆石产量 ×" + format(this.effect())
	},
	tooltipLocked() {
		return "需要 " + formatWhole(layers.i.requires) + " 圆石<br>你拥有 " + formatWhole(player.s.points) + " 圆石"
	},
	hotkeys: [
		{key: "i", description: "I：冶炼铁锭", onPress() { if (canReset(this.layer)) doReset(this.layer) }},
	],
})

// ------------------------------------------------------------
// 第 3 层：钻石层
// ------------------------------------------------------------
addLayer("d", {
	name: "钻石层",
	symbol: "钻石层",
	image: "img/diamond_block.png",
	position: 0,
	row: 3,
	branches: [["n", "#39d8c8", 12]],

	startData() { return {
		unlocked: false,
		points: new Decimal(0),
		best: new Decimal(0),
		total: new Decimal(0),
		prestiged: false,
	}},

	color: "#39d8c8",
	resource: "钻石",
	baseResource: "铁锭",
	baseAmount() { return player.i.points },
	get requires() { return dReq(100) },
	type: "normal",
	exponent: 0.45,

	gainMult() {
		let mult = new Decimal(1)
		if (hasUpgrade("d", 11)) mult = mult.times(2)
		if (hasUpgrade("d", 13)) mult = mult.times(3)
		if (hasUpgrade("d", 22)) mult = mult.times(5)
		if (hasMilestone("d", 0)) mult = mult.times(1.5)
		mult = mult.times(chainEffect(layers.i.effect()))
		mult = mult.times(globalProductionMult())
		return mult
	},
	gainExp() { return new Decimal(1) },

	effect() {
		return player.d.points.add(1).pow(0.6)
	},
	effectDescription() {
		return "，每颗钻石让下界合金产量 ×" + format(chainEffect(this.effect()))
	},

	passiveGeneration() {
		if (!hasUpgrade("d", 12)) return new Decimal(0)
		let rate = player.d.buyables[11].times(0.05)
		if (hasMilestone("d", 1)) rate = rate.times(2)
		return rate
	},

	infoboxes: {
		intro: {
			title: "生存日志 · 第 4 天",
			body: "钻石在岩层深处闪光。<br>附魔室会把时间变成钻石——但下界已经在等着你了。",
		},
	},

	milestones: {
		0: {
			requirementDescription: "10 钻石",
			effectDescription: "钻石产量 ×1.5",
			done() { return player.d.best.gte(10) },
		},
		1: {
			requirementDescription: "100 钻石",
			effectDescription: "附魔室产出 ×2",
			done() { return player.d.best.gte(100) },
		},
	},

	buyables: {
		11: {
			title: "附魔室",
			cost(x) { return mcBuyCost(12, 1.7, x) },
			effect(x) {
				let rate = x.times(0.05)
				if (hasMilestone("d", 1)) rate = rate.times(2)
				return rate
			},
			display() {
				let amount = getBuyableAmount(this.layer, this.id)
				let data = (tmp[this.layer] && tmp[this.layer].buyables && tmp[this.layer].buyables[this.id]) || layers[this.layer].buyables[this.id]
				return "等级 " + formatWhole(amount) +
					"<br>成本：" + format(data.cost) + " 钻石" +
					"<br>自动产出 +" + format(tmp[this.layer].passiveGeneration.times(tmp[this.layer].resetGain)) + " 钻石/秒"
			},
			unlocked() { return hasUpgrade("d", 12) },
			canAfford() { return player.d.points.gte(tmp.d.buyables[11].cost) },
			buy() {
				let cost = getBuyableCost(this.layer, this.id)
				player[this.layer].points = player[this.layer].points.sub(cost)
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			style: { "height": "190px", "width": "210px" },
		},
	},

	upgrades: {
		11: {
			title: "钻石镐",
			description: "钻石产量 ×2。",
			cost() { return vUpg("d", 0.7) },
		},
		12: {
			title: "附魔台",
			description: "解锁「附魔室」，自动产出钻石。",
			cost() { return vUpg("d", 1.3) },
			unlocked() { return hasUpgrade("d", 11) },
		},
		13: {
			title: "时运 III",
			description: "钻石产量 ×3。",
			cost() { return vUpg("d", 2.2) },
			unlocked() { return hasUpgrade("d", 12) },
		},
		21: {
			title: "信标",
			description: "所有产量 ×3。",
			cost() { return vUpg("d", 3.8) },
			unlocked() { return hasUpgrade("d", 13) },
		},
		22: {
			title: "下界合金模板",
			description: "钻石产量 ×5。",
			cost() { return vUpg("d", 6.5) },
			unlocked() { return hasUpgrade("d", 21) },
		},
	},

	doReset(resettingLayer) {
		if (layers[resettingLayer].row > this.row) retainStartKit(this.layer, ["prestiged"])
		if (resettingLayer === "d") player[this.layer].prestiged = true
		if (resettingLayer === "d" && !player.n.unlocked) {
			player.n.unlocked = true
			player.n.resetTime = 0
			needCanvasUpdate = true
		}
	},

	layerShown() { return true },
	tooltip() {
		return "钻石 ×" + formatWhole(player.d.points) +
			"<br>铁锭产量 ×" + format(this.effect())
	},
	tooltipLocked() {
		return "需要 " + formatWhole(layers.d.requires) + " 铁锭<br>你拥有 " + formatWhole(player.i.points) + " 铁锭"
	},
	hotkeys: [
		{key: "d", description: "D：开采钻石", onPress() { if (canReset(this.layer)) doReset(this.layer) }},
	],
})
