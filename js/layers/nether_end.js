/* ============================================================
   下界与末地 · 终局两层
   下界合金 → 末影珍珠
   ============================================================ */

// ------------------------------------------------------------
// 第 4 层：下界
// ------------------------------------------------------------
addLayer("n", {
	name: "下界",
	symbol: "下界",
	image: "img/netherrack.png",
	position: 0,
	row: 4,
	branches: [["e", "#8b2d24", 12]],

	startData() { return {
		unlocked: false,
		points: new Decimal(0),
		best: new Decimal(0),
		total: new Decimal(0),
		prestiged: false,
	}},

	color: "#c0392b",
	resource: "下界合金锭",
	baseResource: "钻石",
	baseAmount() { return player.d.points },
	get requires() { return reqNow("n", 60) },
	type: "normal",
	exponent: 0.5,

	gainMult() {
		let mult = new Decimal(1)
		if (hasUpgrade("n", 11)) mult = mult.times(2)
		if (hasUpgrade("n", 13)) mult = mult.times(3)
		if (hasUpgrade("n", 22)) mult = mult.times(5)
		if (hasMilestone("n", 0)) mult = mult.times(1.5)
		mult = mult.times(chainEffect(layers.d.effect()))
		mult = mult.times(globalProductionMult())
		return mult
	},
	gainExp() { return new Decimal(1) },

	effect() {
		return player.n.points.add(1).pow(0.6)
	},
	effectDescription() {
		return "，每块下界合金让末影珍珠产量 ×" + format(chainEffect(this.effect()))
	},

	passiveGeneration() {
		if (!hasUpgrade("n", 12)) return new Decimal(0)
		let rate = player.n.buyables[11].times(0.03)
		if (hasMilestone("n", 1)) rate = rate.times(2)
		return rate
	},

	infoboxes: {
		intro: {
			title: "生存日志 · 第 5 天",
			body: "黑曜石框架亮起紫色微光。<br>下界没有夜晚，只有岩浆、猪灵，以及埋在远古残骸里的下界合金。",
		},
	},

	milestones: {
		0: {
			requirementDescription: "10 下界合金锭",
			effectDescription: "下界合金锭产量 ×1.5",
			done() { return player.n.best.gte(10) },
		},
		1: {
			requirementDescription: "50 下界合金锭",
			effectDescription: "挖掘机产出 ×2",
			done() { return player.n.best.gte(50) },
		},
	},

	buyables: {
		11: {
			title: "远古残骸挖掘机",
			cost(x) { return mcBuyCost(15, 1.7, x) },
			effect(x) { return x.times(0.03) },
			display() {
				let amount = getBuyableAmount(this.layer, this.id)
				let data = (tmp[this.layer] && tmp[this.layer].buyables && tmp[this.layer].buyables[this.id]) || layers[this.layer].buyables[this.id]
				return "部署 " + formatWhole(amount) + " 台" +
					"<br>成本：" + format(data.cost) + " 下界合金锭" +
					"<br>自动产出 +" + format(tmp[this.layer].passiveGeneration.times(tmp[this.layer].resetGain)) + " 下界合金锭/秒"
			},
			unlocked() { return hasUpgrade("n", 12) },
			canAfford() { return player.n.points.gte(tmp.n.buyables[11].cost) },
			buy() {
				let cost = getBuyableCost(this.layer, this.id)
				player[this.layer].points = player[this.layer].points.sub(cost)
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			style: { "height": "190px", "width": "230px" },
		},
	},

	upgrades: {
		11: {
			title: "下界传送门",
			description: "下界合金锭产量 ×2。",
			cost() { return vUpg("n", 0.7) },
		},
		12: {
			title: "烈焰棒",
			description: "解锁「远古残骸挖掘机」，自动产出下界合金锭。",
			cost() { return vUpg("n", 1.3) },
			unlocked() { return hasUpgrade("n", 11) },
		},
		13: {
			title: "猪灵交易",
			description: "下界合金产量 ×3。",
			cost() { return vUpg("n", 2.2) },
			unlocked() { return hasUpgrade("n", 12) },
		},
		21: {
			title: "抗火药水",
			description: "所有产量 ×2。",
			cost() { return vUpg("n", 3.8) },
			unlocked() { return hasUpgrade("n", 13) },
		},
		22: {
			title: "下界之星",
			description: "下界合金产量 ×5。",
			cost() { return vUpg("n", 6.5) },
			unlocked() { return hasUpgrade("n", 21) },
		},
	},

	doReset(resettingLayer) {
		if (layers[resettingLayer].row > this.row) retainStartKit(this.layer, ["prestiged"])
		if (resettingLayer === "n") player[this.layer].prestiged = true
		if (resettingLayer === "n" && !player.e.unlocked) {
			player.e.unlocked = true
			player.e.resetTime = 0
			needCanvasUpdate = true
		}
	},

	layerShown() { return true },
	tooltip() {
		return "下界合金锭 ×" + formatWhole(player.n.points) +
			"<br>钻石产量 ×" + format(this.effect())
	},
	tooltipLocked() {
		return "需要 " + formatWhole(layers.n.requires) + " 钻石<br>你拥有 " + formatWhole(player.d.points) + " 钻石"
	},
	hotkeys: [
		{key: "n", description: "N：探索下界", onPress() { if (canReset(this.layer)) doReset(this.layer) }},
	],
})

// ------------------------------------------------------------
// 第 5 层：末地
// ------------------------------------------------------------
addLayer("e", {
	name: "末地",
	symbol: "末地",
	image: "img/end_stone.png",
	position: 0,
	row: 5,

	startData() { return {
		unlocked: false,
		points: new Decimal(0),
		best: new Decimal(0),
		total: new Decimal(0),
		prestiged: false,
	}},

	color: "#b39ddb",
	resource: "末影珍珠",
	baseResource: "下界合金锭",
	baseAmount() { return player.n.points },
	get requires() { return reqNow("e", 30) },
	type: "normal",
	exponent: 0.5,

	gainMult() {
		let mult = new Decimal(1)
		if (hasUpgrade("e", 11)) mult = mult.times(2)
		if (hasUpgrade("e", 13)) mult = mult.times(3)
		if (hasUpgrade("e", 22)) mult = mult.times(5)
		if (hasMilestone("e", 1)) mult = mult.times(1.5)
		mult = mult.times(globalProductionMult())
		mult = mult.times(chainEffect(layers.n.effect()))
		return mult
	},
	gainExp() { return new Decimal(1) },

	effect() {
		return player.e.points.add(1).pow(0.7)
	},
	effectDescription() {
		return "，每颗末影珍珠让暮色森林产量 ×" + format(this.effect())
	},

	passiveGeneration() {
		if (!hasUpgrade("e", 12)) return new Decimal(0)
		return player.e.buyables[11].times(0.03)
	},

	infoboxes: {
		intro: {
			title: "生存日志 · 第 6 天",
			body: "末地石浮在虚空中。<br>末影珍珠不再是终点——层间任务会指引你继续深入模组海。",
		},
	},

	milestones: {
		0: {
			requirementDescription: "1 末影珍珠",
			effectDescription: "所有产量 ×2",
			done() { return player.e.best.gte(1) },
		},
		1: {
			requirementDescription: "8 末影珍珠",
			effectDescription: "末影珍珠产量 ×1.5",
			done() { return player.e.best.gte(8) },
		},
	},

	buyables: {
		11: {
			title: "末影人农场",
			cost(x) { return mcBuyCost(20, 1.75, x) },
			effect(x) { return x.times(0.03) },
			display() {
				let amount = getBuyableAmount(this.layer, this.id)
				let data = (tmp[this.layer] && tmp[this.layer].buyables && tmp[this.layer].buyables[this.id]) || layers[this.layer].buyables[this.id]
				return "运行 " + formatWhole(amount) + " 座" +
					"<br>成本：" + format(data.cost) + " 末影珍珠" +
					"<br>自动产出 +" + format(tmp[this.layer].passiveGeneration.times(tmp[this.layer].resetGain)) + " 末影珍珠/秒"
			},
			unlocked() { return hasUpgrade("e", 12) },
			canAfford() { return player.e.points.gte(tmp.e.buyables[11].cost) },
			buy() {
				let cost = getBuyableCost(this.layer, this.id)
				player[this.layer].points = player[this.layer].points.sub(cost)
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			style: { "height": "190px", "width": "220px" },
		},
	},

	upgrades: {
		11: {
			title: "末地传送门",
			description: "末影珍珠产量 ×2。",
			cost() { return vUpg("e", 0.7) },
		},
		12: {
			title: "末影之眼",
			description: "解锁「末影人农场」，自动产出末影珍珠。",
			cost() { return vUpg("e", 1.3) },
			unlocked() { return hasUpgrade("e", 11) },
		},
		13: {
			title: "龙息",
			description: "末影珍珠产量 ×3。",
			cost() { return vUpg("e", 2.2) },
			unlocked() { return hasUpgrade("e", 12) },
		},
		21: {
			title: "鞘翅",
			description: "所有产量 ×2。",
			cost() { return vUpg("e", 3.8) },
			unlocked() { return hasUpgrade("e", 13) },
		},
		22: {
			title: "屠龙",
			description: "末影珍珠产量 ×5。",
			cost() { return vUpg("e", 6.5) },
			unlocked() { return hasUpgrade("e", 21) },
		},
	},

	doReset(resettingLayer) {
		if (layers[resettingLayer].row > this.row) retainStartKit(this.layer, ["prestiged"])
		if (resettingLayer === "e") player[this.layer].prestiged = true
		if (resettingLayer === "e" && !player.t.unlocked) {
			player.t.unlocked = true
			player.t.resetTime = 0
			needCanvasUpdate = true
		}
	},

	layerShown() { return true },
	tooltip() {
		return "末影珍珠 ×" + formatWhole(player.e.points) +
			"<br>下界合金产量 ×" + format(this.effect())
	},
	tooltipLocked() {
		return "需要 " + formatWhole(layers.e.requires) + " 下界合金锭<br>你拥有 " + formatWhole(player.n.points) + " 下界合金锭"
	},
	hotkeys: [
		{key: "e", description: "E：前往末地", onPress() { if (canReset(this.layer)) doReset(this.layer) }},
	],
})
