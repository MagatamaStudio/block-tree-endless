function hasUpgrade(layer, id) {
	return ((player[layer].upgrades.includes(toNumber(id)) || player[layer].upgrades.includes(id.toString())) && !tmp[layer].deactivated)
}

function hasMilestone(layer, id) {
	return ((player[layer].milestones.includes(toNumber(id)) || player[layer].milestones.includes(id.toString())) && !tmp[layer].deactivated)
}

function hasAchievement(layer, id) {
	return ((player[layer].achievements.includes(toNumber(id)) || player[layer].achievements.includes(id.toString())) && !tmp[layer].deactivated)
}

function hasChallenge(layer, id) {
	return ((player[layer].challenges[id]) && !tmp[layer].deactivated)
}

function maxedChallenge(layer, id) {
	return ((player[layer].challenges[id] >= tmp[layer].challenges[id].completionLimit) && !tmp[layer].deactivated)
}

function challengeCompletions(layer, id) {
	return (player[layer].challenges[id])
}

function canEnterChallenge(layer, id){
	return tmp[layer].challenges[id].canEnter ?? true
}

function canExitChallenge(layer, id){
	return tmp[layer].challenges[id].canExit ?? true
}

function getBuyableAmount(layer, id) {
	// 层还没进 player（启动竞态 / 老存档缺层）时给 0，别把整个渲染打断
	const pl = (typeof player !== "undefined" && player) ? player[layer] : null
	if (!pl || !pl.buyables) return decimalZero
	return (pl.buyables[id])
}

function setBuyableAmount(layer, id, amt) {
	player[layer].buyables[id] = amt
	markTempDirty(layer)
}

function addBuyables(layer, id, amt) {
	player[layer].buyables[id] = player[layer].buyables[id].add(amt)
	markTempDirty(layer)
}

function getClickableState(layer, id) {
	const pl = (typeof player !== "undefined" && player) ? player[layer] : null
	if (!pl || !pl.clickables) return 0
	return (pl.clickables[id])
}

function setClickableState(layer, id, state) {
	player[layer].clickables[id] = state
}

function getGridData(layer, id) {
	return (player[layer].grid[id])
}

function setGridData(layer, id, data) {
	player[layer].grid[id] = data
}

function upgradeEffect(layer, id) {
	return (tmp[layer].upgrades[id].effect)
}

function challengeEffect(layer, id) {
	return (tmp[layer].challenges[id].rewardEffect)
}

function buyableEffect(layer, id) {
	return (tmp[layer].buyables[id].effect)
}

function clickableEffect(layer, id) {
	return (tmp[layer].clickables[id].effect)
}

function achievementEffect(layer, id) {
	return (tmp[layer].achievements[id].effect)
}

function gridEffect(layer, id) {
	return (gridRun(layer, 'getEffect', player[layer].grid[id], id))
}