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
	return !!data.prestiged
}

function shopItemId(i) {
	return (Math.floor(i / 9) + 1) * 10 + (i % 9 + 1)
}

// 本层自动声望是否被全局回退下限挡住
function shopFloorBlocked(target) {
	const row = tmp[target] ? tmp[target].row : NaN
	if (isNaN(row)) return false
	return autoResetFloor(target) > row
}

function shopFloorName() {
	const ids = ROW_LAYERS[player.resetFloor || 0]
	if (!ids) return ""
	const first = Object.keys(ids)[0]
	return first && layers[first] ? (layers[first].name || first) : ""
}

function shopPausedCount() {
	let n = 0
	for (const pair of SHOP_PAIRS) {
		if (!player.shop.owns || !player.shop.owns[pair.target]) continue
		if (!player.shop.autoPrestigeLayer || !player.shop.autoPrestigeLayer[pair.target]) continue
		if (shopFloorBlocked(pair.target)) n++
	}
	return n
}

function shopToggleMaster() {
	if (!player.shop) return
	player.shop.autoPrestige = player.shop.autoPrestige === false
	updateTemp()
}

function shopToggleBuy(layer) {
	if (!player.shop || !player.shop.owns || !player.shop.owns[layer]) return
	player.shop.autoBuy[layer] = !player.shop.autoBuy[layer]
	updateTemp()
}

function shopTogglePrestige(layer) {
	if (!player.shop || !player.shop.owns || !player.shop.owns[layer]) return
	player.shop.autoPrestigeLayer[layer] = !player.shop.autoPrestigeLayer[layer]
	updateTemp()
}

function shopBuy(layer) {
	const pair = SHOP_PAIRS.find(p => p.target === layer)
	if (!pair || !player.shop) return
	if (player.shop.owns && player.shop.owns[layer]) return
	if (!shopCleared(layer)) return
	const cost = shopCost(pair)
	if (player[layer].points.lt(cost)) return
	player[layer].points = player[layer].points.sub(cost)
	Vue.set(player.shop.owns, layer, true)
	Vue.set(player.shop.autoBuy, layer, true)
	Vue.set(player.shop.autoPrestigeLayer, layer, true)
	updateTemp()
	needCanvasUpdate = true
}

function shopCardHead(name, badge, cls) {
	return '<div class="shop-card-head"><span class="shop-card-name">' + name + '</span>' +
		'<span class="shop-badge ' + cls + '">' + badge + '</span></div>'
}

function shopCardHTML(pair) {
	const target = pair.target
	const name = layers[target] ? layers[target].name : target
	const cur = layers[pair.currency] ? layers[pair.currency].resource : pair.currency
	const owned = !!(player.shop.owns && player.shop.owns[target])

	if (owned) {
		const buyOn = !!(player.shop.autoBuy && player.shop.autoBuy[target])
		const presOn = !!(player.shop.autoPrestigeLayer && player.shop.autoPrestigeLayer[target])
		const blocked = shopFloorBlocked(target)
		let presText = presOn ? "开启" : "关闭"
		let presClass = presOn ? "on" : "off"
		if (presOn && blocked) {
			presText = "下限暂停"
			presClass = "paused"
		} else if (presOn && player.shop.autoPrestige === false) {
			presText = "总开关关闭"
			presClass = "paused"
		}
		return '<div class="shop-card owned">' +
			shopCardHead(name, "已解锁", "owned") +
			'<div class="shop-toggles">' +
				'<button class="shop-toggle ' + (buyOn ? "on" : "off") + '" onclick="shopToggleBuy(\'' + target + '\')"><span>自动购买</span><b>' + (buyOn ? "开启" : "关闭") + '</b></button>' +
				'<button class="shop-toggle ' + presClass + '" onclick="shopTogglePrestige(\'' + target + '\')"><span>自动声望</span><b>' + presText + '</b></button>' +
			'</div>' +
			'<div class="shop-note">' + (blocked ? "手动声望更低层可下移回退下限" : "自动购买会保留下一层声望需求") + '</div>' +
		'</div>'
	}

	if (!shopCleared(target)) {
		return '<div class="shop-card dim">' +
			shopCardHead(name, "未首通", "muted") +
			'<div class="shop-price">首通后解锁本层自动化</div>' +
			'<div class="shop-note">覆盖升级、购买项与自动声望</div>' +
		'</div>'
	}

	const cost = shopCost(pair)
	const afford = player[target] && player[target].points.gte(cost)
	return '<div class="shop-card purchasable">' +
		shopCardHead(name, afford ? "可购买" : "资源不足", afford ? "ready" : "muted") +
		'<div class="shop-price">价格 <b>' + format(cost) + '</b> ' + cur + '</div>' +
		'<button class="shop-buy"' + (afford ? '' : ' disabled') + ' onclick="shopBuy(\'' + target + '\')">' +
			(afford ? "购买自动化" : "资源不足") +
		'</button>' +
		'<div class="shop-note">购买后分别控制自动购买与自动声望</div>' +
	'</div>'
}

function shopTabHTML() {
	const n = Object.keys(player.shop.owns || {}).length
	const floor = player.resetFloor || 0
	const floorName = shopFloorName()
	const paused = shopPausedCount()
	const masterOn = player.shop.autoPrestige !== false
	return '<div class="shop-wrap">' +
		'<div class="shop-topbar">' +
			'<div class="shop-summary">已解锁 <b>' + n + ' / ' + SHOP_PAIRS.length + '</b> · 回退下限：第 ' + (floor + 1) + ' 行' +
				(floorName ? '（' + floorName + '）' : '') +
				(paused ? ' · <b class="shop-warn">' + paused + '</b> 层被下限暂停' : '') +
				'<br>本层首通后，用本层资源购买本层自动化（' + SHOP_PRICE_MULT + '× 本层需求）' +
			'</div>' +
			'<button class="shop-master ' + (masterOn ? 'on' : 'off') + '" onclick="shopToggleMaster()">' +
				'自动声望总开关 <b>' + (masterOn ? "开启" : "关闭") + '</b>' +
			'</button>' +
		'</div>' +
		'<div class="shop-grid">' + SHOP_PAIRS.map(shopCardHTML).join('') + '</div>' +
	'</div>'
}

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
		autoBuy: {},
		autoPrestigeLayer: {},
		autoMigrated: false,
		autoPrestige: true,
		migrated: false,
	}},

	resource: "自动购买",
	type: "none",

	tabFormat: [
		["display-text", "<h1>自动化商店</h1>"],
		["raw-html", function() { return shopTabHTML() }],
	],

	update() {
		if (!player.shop.owns) Vue.set(player.shop, "owns", {})
		if (!player.shop.auto) Vue.set(player.shop, "auto", {})
		if (!player.shop.autoBuy) Vue.set(player.shop, "autoBuy", {})
		if (!player.shop.autoPrestigeLayer) Vue.set(player.shop, "autoPrestigeLayer", {})
		if (player.shop.autoPrestige === undefined) Vue.set(player.shop, "autoPrestige", true)
		// 旧档的单层开关同时迁移到「自动购买」与「本层自动声望」
		if (!player.shop.autoMigrated) {
			for (const pair of SHOP_PAIRS) {
				if (!player.shop.owns[pair.target]) continue
				const legacy = !!player.shop.auto[pair.target]
				if (player.shop.autoBuy[pair.target] === undefined) Vue.set(player.shop.autoBuy, pair.target, legacy)
				if (player.shop.autoPrestigeLayer[pair.target] === undefined) Vue.set(player.shop.autoPrestigeLayer, pair.target, legacy)
			}
			player.shop.autoMigrated = true
		}
		if (player.shop.buyables && !player.shop.migrated) {
			for (let i = 0; i < LEGACY_SHOP_PAIRS.length; i++) {
				const pair = LEGACY_SHOP_PAIRS[i]
				const old = player.shop.buyables[shopItemId(i)]
				if (old && old.gt && old.gt(0)) {
					Vue.set(player.shop.owns, pair.target, true)
					Vue.set(player.shop.autoBuy, pair.target, true)
					Vue.set(player.shop.autoPrestigeLayer, pair.target, true)
				}
			}
			player.shop.migrated = true
		}
	},

	layerShown() { return true },
	tooltip() {
		const n = Object.keys(player.shop.owns || {}).length
		const paused = shopPausedCount()
		return "自动化商店<br>已解锁 " + n + " / " + SHOP_PAIRS.length +
			"<br>自动声望总开关：" + (player.shop.autoPrestige === false ? "关闭" : "开启") +
			(paused ? "<br>下限暂停 " + paused + " 层" : "")
	},
})
