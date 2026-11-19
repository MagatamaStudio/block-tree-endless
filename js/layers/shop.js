const CHAIN_IDS = ["p", "s", "i", "d", "n", "e", "t", "b", "m", "th", "ae", "dr", "gc", "gt", "pe", "if", "bl", "ab", "ie", "tc", "fo", "te", "ei", "me", "nc", "br", "ma", "bm", "wi", "an", "at", "et", "sd", "rc", "ig", "cr"]

const SHOP_PAIRS = CHAIN_IDS.slice(0, -1).map((target, i) => ({
	target: target,
	currency: CHAIN_IDS[i + 1],
}))

function shopCost(pair) {
	return layers[pair.currency].requires.times(8).ceil()
}

const SHOP_ITEMS = {}

SHOP_PAIRS.forEach((pair, i) => {
	const id = (Math.floor(i / 9) + 1) * 10 + (i % 9 + 1)
	SHOP_ITEMS[id] = {
		title() { return "自动·" + (layers[pair.target] ? layers[pair.target].name : pair.target) },
		display() {
			const name = layers[pair.target] ? layers[pair.target].name : pair.target
			const cur = layers[pair.currency] ? layers[pair.currency].resource : pair.currency
			if (player.shop.owns[pair.target]) {
				return "已解锁 · 自动购买：" + (player.shop.auto[pair.target] ? "开启" : "关闭") +
					"<br>覆盖升级与购买项<br>点击切换开关"
			}
			return "价格：" + format(shopCost(pair)) + " " + cur +
				"<br>购买后解锁「" + name + "」的<br>升级与购买项自动购买"
		},
		unlocked() { return true },
		canClick() {
			return player.shop.owns[pair.target] || player[pair.currency].points.gte(shopCost(pair))
		},
		onClick() {
			if (!player.shop.owns[pair.target]) {
				const cost = shopCost(pair)
				if (player[pair.currency].points.lt(cost)) return
				player[pair.currency].points = player[pair.currency].points.sub(cost)
				Vue.set(player.shop.owns, pair.target, true)
				Vue.set(player.shop.auto, pair.target, true)
			} else {
				player.shop.auto[pair.target] = !player.shop.auto[pair.target]
			}
			updateTemp()
			needCanvasUpdate = true
		},
		style: { "width": "200px", "height": "150px" },
	}
})

addLayer("shop", {
	name: "自动化商店",
	symbol: "商店",
	image: "img/crafting_table.png",
	row: "side",
	color: "#d9b44a",

	startData() { return {
		unlocked: true,
		points: new Decimal(0),
		owns: {},
		auto: {},
		migrated: false,
	}},

	resource: "自动购买",
	type: "none",

	tabFormat: [
		["display-text", "<h1>自动化商店</h1>"],
		["display-text", function() {
			const n = Object.keys(player.shop.owns || {}).length
			return "已解锁 <b>" + n + " / " + SHOP_PAIRS.length + "</b> · 购买后点击商品可切换自动购买开关<br>自动购买覆盖普通升级与购买项，研究点分配仍需手动<br>价格是下一层声望需求的 8 倍。"
		}, {"font-size": "15px", "opacity": "0.85"}],
		"blank",
		"clickables",
	],

	clickables: SHOP_ITEMS,

	update() {
		if (!player.shop.owns) Vue.set(player.shop, "owns", {})
		if (!player.shop.auto) Vue.set(player.shop, "auto", {})
		if (player.shop.buyables && !player.shop.migrated) {
			for (let i = 0; i < SHOP_PAIRS.length; i++) {
				const pair = SHOP_PAIRS[i]
				const id = (Math.floor(i / 9) + 1) * 10 + (i % 9 + 1)
				const old = player.shop.buyables[id]
				if (old && old.gt && old.gt(0)) {
					Vue.set(player.shop.owns, pair.target, true)
					Vue.set(player.shop.auto, pair.target, true)
				}
			}
			player.shop.migrated = true
		}
	},

	layerShown() { return true },
	tooltip() {
		const n = Object.keys(player.shop.owns || {}).length
		return "自动化商店<br>已解锁 " + n + " / " + SHOP_PAIRS.length
	},
})
