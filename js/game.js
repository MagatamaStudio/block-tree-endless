var player;
var needCanvasUpdate = true;

// Don't change this
const TMT_VERSION = {
	tmtNum: "2.7",
	tmtName: "Δ"
}

// 单次声望最多回退本层及下面 4 层，更低的层与资源保留
const RESET_DEPTH = 5

function getResetGain(layer, useType = null) {
	let type = useType
	if (!useType){ 
		type = tmp[layer].type
		if (layers[layer].getResetGain !== undefined)
			return layers[layer].getResetGain()
	} 
	if(tmp[layer].type == "none")
		return new Decimal (0)
	if (tmp[layer].gainExp.eq(0)) return decimalZero
	if (type=="static") {
		if ((!tmp[layer].canBuyMax) || tmp[layer].baseAmount.lt(tmp[layer].requires)) return decimalOne
		let gain = tmp[layer].baseAmount.div(tmp[layer].requires).div(tmp[layer].gainMult).max(1).log(tmp[layer].base).times(tmp[layer].gainExp).pow(Decimal.pow(tmp[layer].exponent, -1))
		gain = gain.times(tmp[layer].directMult)
		return gain.floor().sub(player[layer].points).add(1).max(1);
	} else if (type=="normal"){
		if (tmp[layer].baseAmount.lt(tmp[layer].requires)) return decimalZero
		let gain = tmp[layer].baseAmount.div(tmp[layer].requires).pow(tmp[layer].exponent).times(tmp[layer].gainMult).pow(tmp[layer].gainExp)
		if (gain.gte(tmp[layer].softcap)) gain = gain.pow(tmp[layer].softcapPower).times(tmp[layer].softcap.pow(decimalOne.sub(tmp[layer].softcapPower)))
		gain = gain.times(tmp[layer].directMult)
		return gain.floor().max(0);
	} else if (type=="custom"){
		return layers[layer].getResetGain()
	} else {
		return decimalZero
	}
}

function getNextAt(layer, canMax=false, useType = null) {
	let type = useType
	if (!useType) {
		type = tmp[layer].type
		if (layers[layer].getNextAt !== undefined)
			return layers[layer].getNextAt(canMax)

		}
	if(tmp[layer].type == "none")
		return new Decimal (Infinity)

	if (tmp[layer].gainMult.lte(0)) return new Decimal(Infinity)
	if (tmp[layer].gainExp.lte(0)) return new Decimal(Infinity)

	if (type=="static") 
	{
		if (!tmp[layer].canBuyMax) canMax = false
		let amt = player[layer].points.plus((canMax&&tmp[layer].baseAmount.gte(tmp[layer].nextAt))?tmp[layer].resetGain:0).div(tmp[layer].directMult)
		let extraCost = Decimal.pow(tmp[layer].base, amt.pow(tmp[layer].exponent).div(tmp[layer].gainExp)).times(tmp[layer].gainMult)
		let cost = extraCost.times(tmp[layer].requires).max(tmp[layer].requires)
		if (tmp[layer].roundUpCost) cost = cost.ceil()
		return cost;
	} else if (type=="normal"){
		let next = tmp[layer].resetGain.add(1).div(tmp[layer].directMult)
		if (next.gte(tmp[layer].softcap)) next = next.div(tmp[layer].softcap.pow(decimalOne.sub(tmp[layer].softcapPower))).pow(decimalOne.div(tmp[layer].softcapPower))
		next = next.root(tmp[layer].gainExp).div(tmp[layer].gainMult).root(tmp[layer].exponent).times(tmp[layer].requires).max(tmp[layer].requires)
		if (tmp[layer].roundUpCost) next = next.ceil()
		return next;
	} else if (type=="custom"){
		return layers[layer].getNextAt(canMax)
	} else {
		return decimalZero
	}}

function softcap(value, cap, power = 0.5) {
	if (value.lte(cap)) return value
	else
		return value.pow(power).times(cap.pow(decimalOne.sub(power)))
}

// Return true if the layer should be highlighted. By default checks for upgrades only.
function shouldNotify(layer){
	for (id in tmp[layer].upgrades){
		if (isPlainObject(layers[layer].upgrades[id])){
			if (canAffordUpgrade(layer, id) && !hasUpgrade(layer, id) && tmp[layer].upgrades[id].unlocked){
				return true
			}
		}
	}
	if (player[layer].activeChallenge && canCompleteChallenge(layer, player[layer].activeChallenge)) {
		return true
	}

	if (tmp[layer].shouldNotify)
		return true

	if (isPlainObject(tmp[layer].tabFormat)) {
		for (subtab in tmp[layer].tabFormat){
			if (subtabShouldNotify(layer, 'mainTabs', subtab)) {
				tmp[layer].trueGlowColor = tmp[layer].tabFormat[subtab].glowColor || defaultGlow

				return true
			}
		}
	}

	for (family in tmp[layer].microtabs) {
		for (subtab in tmp[layer].microtabs[family]){
			if (subtabShouldNotify(layer, family, subtab)) {
				tmp[layer].trueGlowColor = tmp[layer].microtabs[family][subtab].glowColor
				return true
			}
		}
	}
	 
	return false
	
}

function canReset(layer)
{	
	if (layers[layer].canReset!== undefined)
		return run(layers[layer].canReset, layers[layer])
	else if(tmp[layer].type == "normal")
		return tmp[layer].baseAmount.gte(tmp[layer].requires)
	else if(tmp[layer].type== "static")
		return tmp[layer].baseAmount.gte(tmp[layer].nextAt) 
	else 
		return false
}

function rowReset(row, layer) {
	for (lr in ROW_LAYERS[row]){
		if(layers[lr].doReset) {
			if (!isNaN(row)) Vue.set(player[lr], "activeChallenge", null) // Exit challenges on any row reset on an equal or higher row
			run(layers[lr].doReset, layers[lr], layer)
		}
		else
			if(tmp[layer].row > tmp[lr].row && !isNaN(row)) layerDataReset(lr)
	}
}

function layerDataReset(layer, keep = []) {
	let storedData = {unlocked: player[layer].unlocked, forceTooltip: player[layer].forceTooltip, noRespecConfirm: player[layer].noRespecConfirm, prevTab:player[layer].prevTab} // Always keep these

	for (thing in keep) {
		if (player[layer][keep[thing]] !== undefined)
			storedData[keep[thing]] = player[layer][keep[thing]]
	}

	Vue.set(player[layer], "buyables", getStartBuyables(layer))
	Vue.set(player[layer], "clickables", getStartClickables(layer))
	Vue.set(player[layer], "challenges", getStartChallenges(layer))
	Vue.set(player[layer], "grid", getStartGrid(layer))

	layOver(player[layer], getStartLayerData(layer))
	player[layer].upgrades = []
	player[layer].milestones = []
	player[layer].achievements = []

	for (thing in storedData) {
		player[layer][thing] =storedData[thing]
	}
}

// 已首通层被级联重置时保留 12 号升级与 1 级生产设施，自动产出无需手动重启
function retainStartKit(layer, keep = []) {
	const data = player[layer]
	const cleared = !!(data && data.prestiged)
	const hasProductionUpgrade = cleared && data.upgrades &&
		(data.upgrades.includes(12) || data.upgrades.includes("12"))
	layerDataReset(layer, keep)
	if (hasProductionUpgrade) {
		data.upgrades = [12]
		data.buyables[11] = new Decimal(1)
	}
}



function addPoints(layer, gain) {
	player[layer].points = player[layer].points.add(gain).max(0)
	if (player[layer].best) player[layer].best = player[layer].best.max(player[layer].points)
	if (player[layer].total) player[layer].total = player[layer].total.add(gain)
}

function generatePoints(layer, diff) {
	addPoints(layer, tmp[layer].resetGain.times(diff))
}

function doReset(layer, force=false, auto=false) {
	if (tmp[layer].type == "none") return
	let row = tmp[layer].row
	const naturalFloor = isNaN(row) ? 0 : Math.max(0, row - (RESET_DEPTH - 1))
	// 自动声望不越过上次声望的回退下限，避免保留层被逐 tick 连锁重置
	const resetFloor = auto ? Math.max(naturalFloor, player.resetFloor || 0) : naturalFloor
	if (auto && resetFloor > row) return
	if (!force) {
		
		if (tmp[layer].canReset === false) return;
		
		if (tmp[layer].baseAmount.lt(tmp[layer].requires)) return;
		let gain = tmp[layer].resetGain
		// 层可对声望入账打折（模组施工：没完工只拿部分收益），不影响自动产出
		if (layers[layer].prestigeGainMult) {
			const full = gain
			gain = full.times(run(layers[layer].prestigeGainMult, layers[layer])).floor()
			if (full.gte(1)) gain = gain.max(1)
		}
		if (tmp[layer].type=="static") {
			if (tmp[layer].baseAmount.lt(tmp[layer].nextAt)) return;
			gain =(tmp[layer].canBuyMax ? gain : 1)
		}

		if (layers[layer].onPrestige){
			updateMilestones(layer)
			run(layers[layer].onPrestige, layers[layer], gain)
		}
		
		addPoints(layer, gain)
		updateMilestones(layer)
		updateAchievements(layer)

		if (!player[layer].unlocked) {
			player[layer].unlocked = true;
			needCanvasUpdate = true;

			if (tmp[layer].increaseUnlockOrder){
				lrs = tmp[layer].increaseUnlockOrder
				for (lr in lrs)
					if (!player[lrs[lr]].unlocked) player[lrs[lr]].unlockOrder++
			}
		}
	
	}

	if (run(layers[layer].resetsNothing, layers[layer])) return
	tmp[layer].baseAmount = decimalZero // quick fix
	player.resetFloor = resetFloor


	for (layerResetting in layers) {
		if (row >= layers[layerResetting].row && layers[layerResetting].row >= resetFloor && (!force || layerResetting != layer)) completeChallenge(layerResetting)
	}

	if (resetFloor === 0) player.points = (row == 0 ? decimalZero : getStartPoints())

	for (let x = row; x >= resetFloor; x--) rowReset(x, layer)
	for (r in OTHER_LAYERS){
		rowReset(r, layer)
	}

	player[layer].resetTime = 0

	updateTemp()
	updateTemp()
}

function resetRow(row) {
	if (prompt('Are you sure you want to reset this row? It is highly recommended that you wait until the end of your current run before doing this! Type "I WANT TO RESET THIS" to confirm')!="I WANT TO RESET THIS") return
	let pre_layers = ROW_LAYERS[row-1]
	let layers = ROW_LAYERS[row]
	let post_layers = ROW_LAYERS[row+1]
	rowReset(row+1, post_layers[0])
	const pre = pre_layers[0]
	const preRow = tmp[pre].row
	doReset(pre, true)
	// 调试用整行重置需要清到第 0 层，doReset 只回退 5 层，剩余部分在这里补齐
	for (let x = preRow - RESET_DEPTH; x >= 0; x--) rowReset(x, pre)
	player.resetFloor = 0
	for (let layer in layers) {
		player[layer].unlocked = false
		if (player[layer].unlockOrder) player[layer].unlockOrder = 0
	}
	player.points = getStartPoints()
	updateTemp();
	resizeCanvas();
}

function startChallenge(layer, x) {
	let enter = false
	if (!player[layer].unlocked || !tmp[layer].challenges[x].unlocked || !canEnterChallenge(layer, x)) return

	if (player[layer].activeChallenge == x) {
		// This needs to be embedded due to how 'enter' works
		if(canExitChallenge(layer, x)){
			completeChallenge(layer, x)
			Vue.set(player[layer], "activeChallenge", null)
		}
	}
	else {
		enter = true
	}
	if((enter || canExitChallenge(layer, x)) && !layers[layer].challengeResetsNothing) doReset(layer, true)
	if(enter) {
		Vue.set(player[layer], "activeChallenge", x)
		run(layers[layer].challenges[x].onEnter, layers[layer].challenges[x])
	}
	updateChallengeTemp(layer)
}

function canCompleteChallenge(layer, x)
{
	if (x != player[layer].activeChallenge) return
	let challenge = tmp[layer].challenges[x]
	if (challenge.canComplete !== undefined) return challenge.canComplete

	if (challenge.currencyInternalName){
		let name = challenge.currencyInternalName
		if (challenge.currencyLocation){
			return !(challenge.currencyLocation[name].lt(challenge.goal)) 
		}
		else if (challenge.currencyLayer){
			let lr = challenge.currencyLayer
			return !(player[lr][name].lt(challenge.goal)) 
		}
		else {
			return !(player[name].lt(challenge.goal))
		}
	}
	else {
		return !(player.points.lt(challenge.goal))
	}

}

function completeChallenge(layer, x) {
	var x = player[layer].activeChallenge
	if (!x) return
	
	let completions = canCompleteChallenge(layer, x)
	if (!completions){
		Vue.set(player[layer], "activeChallenge", null)
		run(layers[layer].challenges[x].onExit, layers[layer].challenges[x])
		return
	}
	if (player[layer].challenges[x] < tmp[layer].challenges[x].completionLimit) {
		needCanvasUpdate = true
		player[layer].challenges[x] += completions
		player[layer].challenges[x] = Math.min(player[layer].challenges[x], tmp[layer].challenges[x].completionLimit)
		if (layers[layer].challenges[x].onComplete) run(layers[layer].challenges[x].onComplete, layers[layer].challenges[x])
	}
	Vue.set(player[layer], "activeChallenge", null)
	run(layers[layer].challenges[x].onExit, layers[layer].challenges[x])
	updateChallengeTemp(layer)
}

VERSION.withoutName = "v" + VERSION.num + (VERSION.pre ? " Pre-Release " + VERSION.pre : VERSION.pre ? " Beta " + VERSION.beta : "")
VERSION.withName = VERSION.withoutName + (VERSION.name ? ": " + VERSION.name : "")


// 挑战进行中不代买，避免自动化花掉挑战进度
function isInChallenge(layer){
	const active = player[layer] && player[layer].activeChallenge
	return active !== undefined && active !== null
}

function nextLayerOf(layer){
	for (const x in layers)
		if (x !== layer && layers[x].baseResource === layers[layer].resource) return x
	return null
}

// 商店自动化保留下一层声望所需资源，只花超出的部分
function shopAutoReserve(layer){
	const next = nextLayerOf(layer)
	return next ? new Decimal(layers[next].requires) : new Decimal(0)
}

const AUTO_PRESTIGE_MULT = 1.5

// 转生「记忆捷径」会下调自动声望阈值，默认仍为 1.5 倍需求
function autoPrestigeMult(){
	if (typeof rebirthAutoThreshold === "function") return rebirthAutoThreshold()
	return AUTO_PRESTIGE_MULT
}

function anyChallengeActive(){
	for (const layer in layers) {
		if (player[layer] && player[layer].activeChallenge) return true
	}
	return false
}

// 自动声望允许回退到的最低层：不越过上次声望的下限，低层需要手动声望
function autoResetFloor(layer){
	const row = tmp[layer].row
	if (isNaN(row)) return 0
	return Math.max(0, row - (RESET_DEPTH - 1), player.resetFloor || 0)
}

// 自动声望：已开启本层自动声望的层在前置资源达到 1.5 倍需求时触发，任意挑战进行中暂停
function shopAutoPrestigeReady(layer){
	if (!player.shop || player.shop.autoPrestige === false) return false
	if (!player.shop.owns || !player.shop.owns[layer]) return false
	if (!player.shop.autoPrestigeLayer || !player.shop.autoPrestigeLayer[layer]) return false
	if (!player[layer] || !player[layer].unlocked) return false
	if (!tmp[layer] || tmp[layer].type === "none") return false
	if (isNaN(tmp[layer].row) || autoResetFloor(layer) > tmp[layer].row) return false
	if (!tmp[layer].canReset) return false
	// 层可要求自动化再等一等（模组层要等本轮施工完成才拿全额收益）
	if (layers[layer].autoPrestigeReady && !layers[layer].autoPrestigeReady()) return false
	if (!tmp[layer].baseAmount.gte(tmp[layer].requires.times(autoPrestigeMult()))) return false
	if (anyChallengeActive()) return false
	return true
}

function autobuyUpgrades(layer, reserve){
	if (!tmp[layer].upgrades) return
	if (isInChallenge(layer)) return
	for (id in tmp[layer].upgrades) {
		const temp = tmp[layer].upgrades[id]
		if (!isPlainObject(temp)) continue
		const data = layers[layer].upgrades[id]
		if (data.canAfford !== undefined && data.canAfford() !== true) continue
		if (reserve && temp.cost !== undefined && player[layer].points.sub(temp.cost).lt(reserve)) continue
		buyUpg(layer, id)
	}
}

// 商店自动化：每 tick 每个购买项最多买一次，避免同帧连买
function autobuyBuyables(layer, reserve){
	if (!tmp[layer].buyables) return
	if (isInChallenge(layer)) return
	let bought = false
	for (let id in tmp[layer].buyables) {
		const data = layers[layer].buyables && layers[layer].buyables[id]
		const temp = tmp[layer].buyables[id]
		if (!data || !isPlainObject(temp) || !data.buy) continue
		if (data.autobuy === false) continue
		if (temp.unlocked === false) continue
		if (data.canAfford && !run(data.canAfford, data)) continue
		if (reserve && temp.cost !== undefined && player[layer].points.sub(temp.cost).lt(reserve)) continue
		// buyMax 会把资源花到只够买下一级，无法遵守保留额，因此有保留额时逐级购买
		if (data.buyMax && (!reserve || reserve.lte(0))) data.buyMax()
		else data.buy()
		bought = true
	}
	// 同一层多个购买项每 tick 各买一次，循环结束后刷新一次即可
	if (bought) updateBuyableTemp(layer)
}

function gameLoop(diff) {
	if (isEndgame() || tmp.gameEnded){
		if (!tmp.gameEnded && isEndgame()) activePopups.length = 0
		tmp.gameEnded = true
		clearParticles()
	}

	if (isNaN(diff) || diff < 0) diff = 0
	if (tmp.gameEnded && !player.keepGoing) {
		diff = 0
		//player.tab = "tmp.gameEnded"
		clearParticles()
	}

	if (maxTickLength) {
		let limit = maxTickLength()
		if(diff > limit)
			diff = limit
	}
	addTime(diff)
	player.points = player.points.add(tmp.pointGen.times(diff)).max(0)

	// 每个 tick 最多自动声望一次，避免同一帧级联多次重置
	let autoPrestigedThisTick = false

	for (let x = 0; x <= maxRow; x++){
		for (item in TREE_LAYERS[x]) {
			let layer = TREE_LAYERS[x][item]
			player[layer].resetTime += diff
			if (tmp[layer].passiveGeneration) generatePoints(layer, diff*tmp[layer].passiveGeneration);
			if (layers[layer].update) layers[layer].update(diff);
		}
	}

	for (row in OTHER_LAYERS){
		for (item in OTHER_LAYERS[row]) {
			let layer = OTHER_LAYERS[row][item]
			player[layer].resetTime += diff
			if (tmp[layer].passiveGeneration) generatePoints(layer, diff*tmp[layer].passiveGeneration);
			if (layers[layer].update) layers[layer].update(diff);
		}
	}	

	for (let x = maxRow; x >= 0; x--){
		for (item in TREE_LAYERS[x]) {
			let layer = TREE_LAYERS[x][item]
			if (!autoPrestigedThisTick && shopAutoPrestigeReady(layer)) {
				doReset(layer, false, true)
				autoPrestigedThisTick = true
			}
			if (tmp[layer].autoUpgrade) {
				autobuyUpgrades(layer)
				autobuyBuyables(layer)
			}
			if (player.shop && player.shop.autoBuy && player.shop.autoBuy[layer]) {
				const reserve = shopAutoReserve(layer)
				autobuyUpgrades(layer, reserve)
				autobuyBuyables(layer, reserve)
			}
		}
	}

	for (row in OTHER_LAYERS){
		for (item in OTHER_LAYERS[row]) {
			let layer = OTHER_LAYERS[row][item]
			if (!autoPrestigedThisTick && shopAutoPrestigeReady(layer)) {
				doReset(layer, false, true)
				autoPrestigedThisTick = true
			}
			player[layer].best = player[layer].best.max(player[layer].points)
			if (tmp[layer].autoUpgrade) {
				autobuyUpgrades(layer)
				autobuyBuyables(layer)
			}
			if (player.shop && player.shop.autoBuy && player.shop.autoBuy[layer]) {
				const reserve = shopAutoReserve(layer)
				autobuyUpgrades(layer, reserve)
				autobuyBuyables(layer, reserve)
			}
		}
	}

	for (layer in layers){
		if (layers[layer].milestones) updateMilestones(layer);
		if (layers[layer].achievements) updateAchievements(layer)
	}

}

function hardReset(resetOptions) {
	if (!confirm("Are you sure you want to do this? You will lose all your progress!")) return
	player = null
	if(resetOptions) options = null
	save(true);
	window.location.reload();
}

var ticking = false
var tempTick = 0

var interval = setInterval(function() {
	if (player===undefined||tmp===undefined) return;
	if (ticking) return;
	if (tmp.gameEnded&&!player.keepGoing) return;
	ticking = true
	let now = Date.now()
	let diff = (now - player.time) / 1e3
	let trueDiff = diff
	if (player.offTime !== undefined) {
		if (player.offTime.remain > modInfo.offlineLimit * 3600) player.offTime.remain = modInfo.offlineLimit * 3600
		if (player.offTime.remain > 0) {
			let offlineDiff = Math.max(player.offTime.remain / 10, diff)
			if (maxTickLength) offlineDiff = Math.min(offlineDiff, maxTickLength())
			player.offTime.remain -= offlineDiff
			diff += offlineDiff
		}
		if (!options.offlineProd || player.offTime.remain <= 0) player.offTime = undefined
	}
	if (player.devSpeed) diff *= player.devSpeed
	player.time = now
	if (needCanvasUpdate){ resizeCanvas();
		needCanvasUpdate = false;
	}
	tmp.scrolled = document.getElementById('treeTab') && document.getElementById('treeTab').scrollTop > 30
	// tmp 重算较贵，降到 10Hz；gameLoop 仍按 20Hz 运行，购买与重置会自行触发 updateTemp
	if (tempTick++ % 2 === 0) updateTemp();
	updateOomps(diff);
	updateWidth()
	updateTabFormats()
	gameLoop(diff)
	// 全存档 NaN 扫描较重，降到 2Hz；自动购买与重置仍会即时更新存档
	if (tempTick % 10 === 0) fixNaNs()
	adjustPopupTime(trueDiff)
	updateParticles(trueDiff)
	ticking = false
}, 50)

setInterval(function() { if (!document.hidden) needCanvasUpdate = true }, 500)