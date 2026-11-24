var tmp = {}
var temp = tmp // Proxy for tmp
var funcs = {}
var NaNalert = false;

// Tmp will not call these
var activeFunctions = [
	"startData", "onPrestige", "doReset", "update", "automate",
	"buy", "buyMax", "respec", "onPress", "onClick", "onHold", "masterButtonPress",
	"sellOne", "sellAll", "pay", "actualCostFunction", "actualEffectFunction",
	"effectDescription", "display", "fullDisplay", "effectDisplay", "rewardDisplay",
	"tabFormat", "content",
	"onComplete", "onPurchase", "onEnter", "onExit", "done",
	"getUnlocked", "getStyle", "getCanClick", "getTitle", "getDisplay"
]

var noCall = doNotCallTheseFunctionsEveryTick
for (item in noCall) {
	activeFunctions.push(noCall[item])
}

// Add the names of classes to traverse
var traversableClasses = []

function setupTemp() {
	tmp = {}
	tmp.pointGen = {}
	tmp.backgroundStyle = {}
	tmp.displayThings = []
	tmp.scrolled = 0
	tmp.gameEnded = false
	funcs = {}
	
	setupTempData(layers, tmp, funcs)
	for (layer in layers){
		tmp[layer].resetGain = {}
		tmp[layer].nextAt = {}
		tmp[layer].nextAtDisp = {}
		tmp[layer].canReset = {}
		tmp[layer].notify = {}
		tmp[layer].prestigeNotify = {}
		tmp[layer].computedNodeStyle = []
		setupBuyables(layer)
		tmp[layer].trueGlowColor = []
	}

	tmp.other = {
		lastPoints: player.points || decimalZero,
		oomps: decimalZero,
		screenWidth: 0,
		screenHeight: 0,
    }

	updateWidth()

	temp = tmp
}

const boolNames = ["unlocked", "deactivated"]

function setupTempData(layerData, tmpData, funcsData) {
	for (item in layerData){
		if (layerData[item] == null) {
			tmpData[item] = null
		}
		else if (layerData[item] instanceof Decimal)
			tmpData[item] = layerData[item]
		else if (Array.isArray(layerData[item])) {
			tmpData[item] = []
			funcsData[item] = []
			setupTempData(layerData[item], tmpData[item], funcsData[item])
		}
		else if ((!!layerData[item]) && (layerData[item].constructor === Object)) {
			tmpData[item] = {}
			funcsData[item] = []
			setupTempData(layerData[item], tmpData[item], funcsData[item])
		}
		else if ((!!layerData[item]) && (typeof layerData[item] === "object") && traversableClasses.includes(layerData[item].constructor.name)) {
			tmpData[item] = new layerData[item].constructor()
			funcsData[item] = new layerData[item].constructor()
		}
		else if (isFunction(layerData[item]) && !activeFunctions.includes(item)){
			funcsData[item] = layerData[item]
			if (boolNames.includes(item))
				tmpData[item] = false
			else
				tmpData[item] = decimalOne // The safest thing to put probably?
		} else {
			tmpData[item] = layerData[item]
		}
	}	
}


// 单层的关键指标：声望收益、下一级门槛、是否可重置、通知标记、历史峰值
// 抽出来是为了分帧刷新时能按层调用（原先是整体遍历一次）
function updateTempLayerStats(layer) {
	if (!tmp[layer] || !layers[layer]) return
	// 自动声望的门槛（当前产量池 / 需求）必须每帧新鲜：这两个只是几次 Decimal 运算，
	// 但决定自动化什么时候触发，跟着分帧刷新走会让声望晚半秒、一次吃掉更多资源
	if (typeof layers[layer].baseAmount === "function") Vue.set(tmp[layer], "baseAmount", layers[layer].baseAmount())
	if (typeof layers[layer].requires === "function") Vue.set(tmp[layer], "requires", layers[layer].requires())

	tmp[layer].resetGain = getResetGain(layer)
	tmp[layer].nextAt = getNextAt(layer)
	tmp[layer].nextAtDisp = getNextAt(layer, true)
	tmp[layer].canReset = canReset(layer)
	tmp[layer].trueGlowColor = tmp[layer].glowColor
	tmp[layer].notify = shouldNotify(layer)
	tmp[layer].prestigeNotify = prestigeNotify(layer)
	if (tmp[layer].passiveGeneration === true) tmp[layer].passiveGeneration = 1 // new Decimal(true) = decimalZero

	// 历史最高资源：声望、消费与级联重置都不会减少，用于深层反哺基础产量
	let ever = player[layer].everBest instanceof Decimal ? player[layer].everBest : new Decimal(player[layer].everBest || 0)
	if (!ever.isFinite()) ever = new Decimal(0)
	// best 由 addPoints 持续记录，避免采样间隙消费点数导致历史峰值被永久低估
	if (player[layer].best && player[layer].best.gt(ever)) ever = player[layer].best
	if (player[layer].points && player[layer].points.gt(ever)) ever = player[layer].points
	if (player[layer].everBest instanceof Decimal) player[layer].everBest = ever
	else Vue.set(player[layer], "everBest", ever)
}

// 与具体哪几层被刷新无关的全局量
function updateTempGlobals() {
	refreshDepthBaseMult()
	tmp.pointGen = getPointGen()
	tmp.backgroundStyle = readData(backgroundStyle)

	tmp.displayThings = []
	for (thing in displayThings){
		let text = displayThings[thing]
		if (isFunction(text)) text = text()
		tmp.displayThings.push(text) 
	}
}

// 只重算指定层（声望回退后只有窗口内的层真变了），其余层等下一帧分帧刷新补上
function updateTempPartial(ids) {
	if (tmp === undefined) { updateTemp(); return }
	refreshGlobalProductionMult()
	for (let i = 0; i < ids.length; i++) {
		const id = ids[i]
		if (!tmp[id] || !layers[id]) continue
		updateTempData(layers[id], tmp[id], funcs[id])
		updateTempLayerStats(id)
	}
	updateTempGlobals()
}

// 手部操作（点击卡片、买升级、投入施工）之后：只重算这一层。
// 原来这些地方一律全量 updateTemp()（45 层约 48ms），一次点击就是一次掉帧。
// 不在这里补刷上层：点击不会清空任何资源，上层的收益最多在下一轮分帧里更新（<0.6 秒）；
// 而决定自动声望的 canReset / baseAmount / requires 每帧全量重算，触发时机不受影响。
function updateTempAfterAction(id) {
	if (tmp === undefined || !id || !layers[id]) { updateTemp(); return }
	updateTempPartial([id])
}

// 一次声望真正改动过的层：回退窗口 [resetFloor, row] 里的层，加上层外的常驻层
function layersTouchedByReset(row, resetFloor) {
	const ids = []
	for (const id in layers) {
		const r = layers[id].row
		if (typeof r === "number" && r >= resetFloor && r <= row) ids.push(id)
	}
	for (const id in OTHER_LAYERS) {
		const v = OTHER_LAYERS[id]
		if (Array.isArray(v)) { for (const sub of v) if (typeof sub === "string") ids.push(sub) }
		else if (typeof v === "string") ids.push(v)
	}
	return ids
}

// 全量重算：购买、声望、切页等手部操作后立即调用，保证看到的数字就是这一刻的
function updateTemp() {
	if (tmp === undefined)
		setupTemp()
	if (tmp === undefined) return

	// 层脚本是异步注入的 <script>：冷缓存下会有层在 setupTemp 之后才到，
	// 缺了它的 tmp 条目，下面按层遍历就直接读到 undefined（硬刷新黑屏就是它）。
	// 发现新层就整体重建一次，代价只在首次加载那一下。
	if (typeof layers !== "undefined") {
		for (const id in layers) if (!tmp[id]) { setupTemp(); break }
	}

	// 本帧内各层 gainMult 共用同一份全局产量倍率，避免重复遍历 36 层
	refreshGlobalProductionMult()
	updateTempData(layers, tmp, funcs)

	for (layer in layers) updateTempLayerStats(layer)
	updateTempGlobals()
}

// 分帧重算：空闲时每帧只刷新一部分层，全部层在几帧内轮一遍。
// 全量一次约 40ms（45 层 / 354 购买项 / 402 升级 / 312 里程碑），10Hz 就是每秒钟 0.4 秒 CPU，
// 这是「挂久了越来越卡」的主因。分帧后单帧只碰几层，数字最多晚 100~200ms，肉眼无感。
var tempSliceIds = null
var tempSliceCursor = 0
var tempSliceSeen = null
var TEMP_FRAME_TURNS = 6        // 解锁层多时，用几帧轮一遍
var TEMP_MIN_LAYERS = 4         // 但每帧至少刷这么多层，避免后期一帧只算一层
var TEMP_FULL_BELOW = 10        // 解锁层不超过这个数就每帧全刷，前期手感与原来一致
var TEMP_LOCKED_PER_FRAME = 1   // 未解锁层每帧顺带算一个，保证解锁瞬间是热的

// 购买/入账等手部动作会改了某层的数据：标脏，下一帧优先补算这一层，
// 分帧刷新才不会让「刚点完的价格/数量」晚半秒才变
var tempDirty = null
function markTempDirty(id) {
	if (id === undefined || id === null) return
	if (tempDirty === null) tempDirty = {}
	tempDirty[id] = true
}

// 声望回退会同时改掉上层的数据（产量、下一级门槛都依赖被清空的前置资源），
// 分帧轮转最快也要 0.6 秒才轮到它们，这段时间上层会按旧速率白产。
// 打一个「下一帧补刷 row 以上所有层」的标记，把误差压到一帧；
// 只补刷受影响的层，深层声望不至于每次都把 45 层全算一遍。
var tempSweepAbove = null
function markTempSweep(row) {
	if (typeof row !== "number") { if (tempSweepAbove === null) tempSweepAbove = -1; return }
	tempSweepAbove = tempSweepAbove === null ? row : Math.min(tempSweepAbove, row)
}

function refreshTempLayer(id) {
	if (!tmp || !tmp[id] || !layers || !layers[id]) return
	updateTempData(layers[id], tmp[id], funcs[id])
	updateTempLayerStats(id)
}

function updateTempSliced() {
	if (tmp === undefined || tempSliceIds === null) {
		if (tmp === undefined) setupTemp()
		if (tmp === undefined) return
		tempSliceIds = Object.keys(layers).filter(id => layers[id] && typeof layers[id] === "object")
		tempSliceSeen = {}
		updateTemp()
		return
	}

	refreshGlobalProductionMult()

	const ids = tempSliceIds
	const count = ids.length
	if (!count) return

	// 便宜的那部分每帧全算：收益 / 下一级门槛 / 能否重置决定自动声望的时机，必须新鲜
	// （45 层全量约 2.3ms，贵的是下面的购买项、升级、里程碑）

	// 刚买过/刚入账的层：当场补算数据，点击的反馈不等下一轮
	if (tempDirty) {
		for (const id in tempDirty) refreshTempLayer(id)
		tempDirty = {}
	}

	// 当前打开的层页每帧刷新，切页与点击看到的就是此刻的数字
	const tab = (typeof player !== "undefined" && player) ? player.tab : null
	if (tab && typeof tab === "string" && tmp[tab] && layers[tab] && player[tab] && player[tab].unlocked) refreshTempLayer(tab)

	// 已解锁的层：数量少就每帧全刷（前期与原来完全一致），多了才按 TEMP_FRAME_TURNS 轮转
	const unlockedIds = []
	const lockedIds = []
	for (let i = 0; i < count; i++) {
		const id = ids[i]
		if (player[id] && player[id].unlocked) unlockedIds.push(id)
		else lockedIds.push(id)
	}

	if (unlockedIds.length <= TEMP_FULL_BELOW || tempSweepAbove !== null) {
		const sweep = tempSweepAbove
		for (let i = 0; i < unlockedIds.length; i++) {
			const id = unlockedIds[i]
			if (sweep === null) { refreshTempLayer(id); continue }
			const r = layers[id].row
			if (typeof r !== "number" || r > sweep) refreshTempLayer(id)
		}
		tempSweepAbove = null
	}
	else {
		const perFrame = Math.max(TEMP_MIN_LAYERS, Math.ceil(unlockedIds.length / TEMP_FRAME_TURNS))
		for (let k = 0; k < perFrame; k++) refreshTempLayer(unlockedIds[(tempSliceCursor + k) % unlockedIds.length])
		tempSliceCursor = (tempSliceCursor + perFrame) % unlockedIds.length
	}

	// 解锁瞬间补算：否则新层要等轮转回来（最多几帧）才显示正确价格
	for (let i = 0; i < unlockedIds.length; i++) {
		const id = unlockedIds[i]
		if (!tempSliceSeen[id]) {
			tempSliceSeen[id] = true
			refreshTempLayer(id)
		}
	}
	for (let i = 0; i < lockedIds.length; i++) tempSliceSeen[lockedIds[i]] = false

	// 未解锁层顺带轮询一个：解锁前就把 tmp 算热，切过去不闪
	for (let k = 0; k < TEMP_LOCKED_PER_FRAME && lockedIds.length; k++) {
		refreshTempLayer(lockedIds[(tempSliceCursor + k * 7 + 3) % lockedIds.length])
	}

	// 指标放在数据之后统一算，保证「所见的价格」与「收益/门槛」出自同一份数据
	for (let i = 0; i < count; i++) updateTempLayerStats(ids[i])

	updateTempGlobals()
}

function updateTempData(layerData, tmpData, funcsData, useThis) {
	for (item in funcsData){
		if (Array.isArray(layerData[item])) {
			if (item !== "tabFormat" && item !== "content") // These are only updated when needed
				updateTempData(layerData[item], tmpData[item], funcsData[item], useThis)
		}
		else if ((!!layerData[item]) && (layerData[item].constructor === Object) || (typeof layerData[item] === "object") && traversableClasses.includes(layerData[item].constructor.name)){
			updateTempData(layerData[item], tmpData[item], funcsData[item], useThis)
		}
		else if (isFunction(layerData[item]) && !isFunction(tmpData[item])){
			let value

			if (useThis !== undefined) value = layerData[item].bind(useThis)()
			else value = layerData[item]()
			Vue.set(tmpData, item, value)
		}
	}	
}

function updateChallengeTemp(layer)
{
	updateTempData(layers[layer].challenges, tmp[layer].challenges, funcs[layer].challenges)
}


function updateBuyableTemp(layer)
{
	updateTempData(layers[layer].buyables, tmp[layer].buyables, funcs[layer].buyables)
}

function updateClickableTemp(layer)
{
	updateTempData(layers[layer].clickables, tmp[layer].clickables, funcs[layer].clickables)
}

function setupBuyables(layer) {
	for (id in layers[layer].buyables) {
		if (isPlainObject(layers[layer].buyables[id])) {
			let b = layers[layer].buyables[id]
			b.actualCostFunction = b.cost
			b.cost = function(x) {
				x = (x === undefined ? player[this.layer].buyables[this.id] : x)
				return layers[this.layer].buyables[this.id].actualCostFunction(x)
			}
			b.actualEffectFunction = b.effect
			b.effect = function(x) {
				x = (x === undefined ? player[this.layer].buyables[this.id] : x)
				return layers[this.layer].buyables[this.id].actualEffectFunction(x)
			}
		}
	}
}

function checkDecimalNaN(x) {
	return (x instanceof Decimal) && !x.eq(x)
}