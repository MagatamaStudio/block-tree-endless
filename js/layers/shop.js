const CHAIN_IDS = ["p", "s", "i", "d", "n", "e", "t", "b", "m", "th", "ae", "dr", "gc", "gt", "pe", "if", "bl", "ab", "ie", "tc", "fo", "te", "ei", "me", "nc", "br", "ma", "bm", "wi", "an", "at", "et", "sd", "rc", "ig", "cr"]

// 首通后即可用本层资源购买本层自动化
const SHOP_PAIRS = CHAIN_IDS.map(id => ({ target: id, currency: id }))

// v4.4 旧商店：用下一层资源购买上一层自动化，仅用于迁移
const LEGACY_SHOP_PAIRS = CHAIN_IDS.slice(0, -1).map((target, i) => ({
	target: target,
	currency: CHAIN_IDS[i + 1],
}))

const SHOP_PRICE_MULT = 2

function shopCost(pair) {
	return layers[pair.target].requires.times(SHOP_PRICE_MULT).ceil()
}

function shopCleared(target) {
	const data = player[target]
	if (!data) return false
	return !!(data.prestiged || (data.best && data.best.gt(0)))
}

function shopItemId(i) {
	return (Math.floor(i / 9) + 1) * 10 + (i % 9 + 1)
}

const SHOP_ITEMS = {
	1: {
		title() { return "自动声望" },
		display() {
			if (player.shop.autoPrestige === false) {
				return "自动声望：<b>关闭</b><br>已购自动化的层只自动购买<br>点击开启"
			}
			return "自动声望：<b>开启</b><br>前置资源 ≥ " + AUTO_PRESTIGE_MULT + "× 需求时自动声望<br>挑战中暂停 · 点击关闭"
		},
		canClick() { return true },
		onClick() {
			player.shop.autoPrestige = player.shop.autoPrestige === false
			updateTemp()
		},
		style: { "width": "200px", "height": "130px" },
	},
}

SHOP_PAIRS.forEach((pair, i) => {
	const id = shopItemId(i)
	SHOP_ITEMS[id] = {
		title() { return "自动·" + (layers[pair.target] ? layers[pair.target].name : pair.target) },
		display() {
			const name = layers[pair.target] ? layers[pair.target].name : pair.target
			const cur = layers[pair.currency] ? layers[pair.currency].resource : pair.currency
			if (player.shop.owns[pair.target]) {
				return "已解锁 · 自动购买：" + (player.shop.auto[pair.target] ? "开启" : "关闭") +
					"<br>覆盖升级、购买项与自动声望<br>点击切换开关"
			}
			if (!shopCleared(pair.target)) {
				return "首通「" + name + "」后解锁<br>自动化覆盖升级、购买项<br>与自动声望"
			}
			return "价格：" + format(shopCost(pair)) + " " + cur +
				"<br>购买后解锁「" + name + "」的<br>自动购买与自动声望"
		},
		unlocked() { return true },
		canClick() {
			return player.shop.owns[pair.target] ||
				(shopCleared(pair.target) && player[pair.target].points.gte(shopCost(pair)))
		},
		onClick() {
			if (!player.shop.owns[pair.target]) {
				if (!shopCleared(pair.target)) return
				const cost = shopCost(pair)
				if (player[pair.target].points.lt(cost)) return
				player[pair.target].points = player[pair.target].points.sub(cost)
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
		autoPrestige: true,
		migrated: false,
	}},

	resource: "自动购买",
	type: "none",

	tabFormat: [
		["display-text", "<h1>自动化商店</h1>"],
		["display-text", function() {
			const n = Object.keys(player.shop.owns || {}).length
			return "已解锁 <b>" + n + " / " + SHOP_PAIRS.length + "</b> · 点击商品可切换自动购买开关<br>本层首通后，用本层资源购买本层自动化（价格 " + SHOP_PRICE_MULT + "× 本层需求）<br>自动化覆盖普通升级、购买项与自动声望；研究点分配仍需手动"
		}, {"font-size": "15px", "opacity": "0.85"}],
		"blank",
		["clickable", 1],
		"blank",
		"clickables",
	],

	clickables: SHOP_ITEMS,

	update() {
		if (!player.shop.owns) Vue.set(player.shop, "owns", {})
		if (!player.shop.auto) Vue.set(player.shop, "auto", {})
		if (player.shop.autoPrestige === undefined) Vue.set(player.shop, "autoPrestige", true)
		if (player.shop.buyables && !player.shop.migrated) {
			for (let i = 0; i < LEGACY_SHOP_PAIRS.length; i++) {
				const pair = LEGACY_SHOP_PAIRS[i]
				const old = player.shop.buyables[shopItemId(i)]
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
		return "自动化商店<br>已解锁 " + n + " / " + SHOP_PAIRS.length +
			"<br>自动声望：" + (player.shop.autoPrestige === false ? "关闭" : "开启")
	},
})
