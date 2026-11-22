// ************ Save stuff ************
let getModID = () => modInfo.id ?? `${modInfo.name.replace(/\s+/g, '-')}-${modInfo.author.replace(/\s+/g, '-')}`;

function save(force) {
	NaNcheck(player)
	if (NaNalert && !force) return
	localStorage.setItem(getModID(), encodeSave(player));
	localStorage.setItem(getModID()+"_options", encodeSave(options));

}
function startPlayerBase() {
	return {
		tab: layoutInfo.startTab,
		navTab: (layoutInfo.showTree ? layoutInfo.startNavTab : "none"),
		time: Date.now(),
		notify: {},
		versionType: getModID(),
		version: VERSION.num,
		beta: VERSION.beta,
		timePlayed: 0,
		keepGoing: false,
		hasNaN: false,

		points: modInfo.initialStartPoints,
		resetFloor: 0,
		subtabs: {},
		lastSafeTab: (readData(layoutInfo.showTree) ? "none" : layoutInfo.startTab)
	};
}
function getStartPlayer() {
	playerdata = startPlayerBase();

	if (addedPlayerData) {
		extradata = addedPlayerData();
		for (thing in extradata)
			playerdata[thing] = extradata[thing];
	}

	playerdata.infoboxes = {};
	for (layer in layers) {
		playerdata[layer] = getStartLayerData(layer);

		if (layers[layer].tabFormat && !Array.isArray(layers[layer].tabFormat)) {
			playerdata.subtabs[layer] = {};
			playerdata.subtabs[layer].mainTabs = Object.keys(layers[layer].tabFormat)[0];
		}
		if (layers[layer].microtabs) {
			if (playerdata.subtabs[layer] == undefined)
				playerdata.subtabs[layer] = {};
			for (item in layers[layer].microtabs)
				playerdata.subtabs[layer][item] = Object.keys(layers[layer].microtabs[item])[0];
		}
		if (layers[layer].infoboxes) {
			if (playerdata.infoboxes[layer] == undefined)
				playerdata.infoboxes[layer] = {};
			for (item in layers[layer].infoboxes)
				playerdata.infoboxes[layer][item] = false;
		}

	}
	return playerdata;
}
function getStartLayerData(layer) {
	layerdata = {};
	if (layers[layer].startData)
		layerdata = layers[layer].startData();

	if (layerdata.unlocked === undefined)
		layerdata.unlocked = true;
	if (layerdata.total === undefined)
		layerdata.total = decimalZero;
	if (layerdata.best === undefined)
		layerdata.best = decimalZero;
	if (layerdata.resetTime === undefined)
		layerdata.resetTime = 0;
	if (layerdata.forceTooltip === undefined)
		layerdata.forceTooltip = false;

	layerdata.buyables = getStartBuyables(layer);
	if (layerdata.noRespecConfirm === undefined) layerdata.noRespecConfirm = false
	if (layerdata.clickables == undefined)
		layerdata.clickables = getStartClickables(layer);
	layerdata.spentOnBuyables = decimalZero;
	layerdata.upgrades = [];
	layerdata.milestones = [];
	layerdata.lastMilestone = null;
	layerdata.achievements = [];
	layerdata.challenges = getStartChallenges(layer);
	layerdata.grid = getStartGrid(layer);
	layerdata.prevTab = ""

	return layerdata;
}
function getStartBuyables(layer) {
	let data = {};
	if (layers[layer].buyables) {
		for (id in layers[layer].buyables)
			if (isPlainObject(layers[layer].buyables[id]))
				data[id] = decimalZero;
	}
	return data;
}
function getStartClickables(layer) {
	let data = {};
	if (layers[layer].clickables) {
		for (id in layers[layer].clickables)
			if (isPlainObject(layers[layer].clickables[id]))
				data[id] = "";
	}
	return data;
}
function getStartChallenges(layer) {
	let data = {};
	if (layers[layer].challenges) {
		for (id in layers[layer].challenges)
			if (isPlainObject(layers[layer].challenges[id]))
				data[id] = 0;
	}
	return data;
}
function getStartGrid(layer) {
	let data = {};
	if (! layers[layer].grid) return data
	if (layers[layer].grid.maxRows === undefined) layers[layer].grid.maxRows=layers[layer].grid.rows
	if (layers[layer].grid.maxCols === undefined) layers[layer].grid.maxCols=layers[layer].grid.cols

	for (let y = 1; y <= layers[layer].grid.maxRows; y++) {
		for (let x = 1; x <= layers[layer].grid.maxCols; x++) {
			data[100*y + x] = layers[layer].grid.getStartData(100*y + x)
		}
	}
	return data;
}

function fixSave() {
	defaultData = getStartPlayer();
	fixData(defaultData, player);

	for (layer in layers) {
		if (player[layer].best !== undefined)
			player[layer].best = new Decimal(player[layer].best);
		if (player[layer].total !== undefined)
			player[layer].total = new Decimal(player[layer].total);

		if (layers[layer].tabFormat && !Array.isArray(layers[layer].tabFormat)) {

			if (!Object.keys(layers[layer].tabFormat).includes(player.subtabs[layer].mainTabs))
				player.subtabs[layer].mainTabs = Object.keys(layers[layer].tabFormat)[0];
		}
		if (layers[layer].microtabs) {
			if (!player.subtabs[layer]) player.subtabs[layer] = {};
			for (item in layers[layer].microtabs)
				if (!Object.keys(layers[layer].microtabs[item]).includes(player.subtabs[layer][item]))
					player.subtabs[layer][item] = Object.keys(layers[layer].microtabs[item])[0];
		}
	}

	migratePrestigeFlags();
}

// 旧存档没有 prestiged 字段：已获得过资源或已解锁下一层的层视为已首通
function migratePrestigeFlags() {
	if (!player.migratedPrestiged) {
		player.migratedPrestiged = true
		if (typeof MODPACK !== "undefined") {
			for (const cfg of MODPACK) {
				const data = player[cfg.id]
				if (!data) continue
				const cleared = (data.best && data.best.gt(0)) ||
					(cfg.next && player[cfg.next] && player[cfg.next].unlocked === true)
				if (cleared) data.prestiged = true
			}
		}
	}
	if (!player.migratedVanillaPrestiged) {
		player.migratedVanillaPrestiged = true
		const nextLayer = { p: "s", s: "i", i: "d", d: "n", n: "e", e: "t" }
		for (const layer in nextLayer) {
			if (player[layer] && player[nextLayer[layer]] && player[nextLayer[layer]].unlocked) {
				player[layer].prestiged = true
			}
		}
	}
}
function fixData(defaultData, newData) {
	for (item in defaultData) {
		if (defaultData[item] == null) {
			if (newData[item] === undefined)
				newData[item] = null;
		}
		else if (Array.isArray(defaultData[item])) {
			if (newData[item] === undefined)
				newData[item] = defaultData[item];

			else
				fixData(defaultData[item], newData[item]);
		}
		else if (defaultData[item] instanceof Decimal) { // Convert to Decimal
			if (newData[item] === undefined)
				newData[item] = defaultData[item];

			else
				newData[item] = new Decimal(newData[item]);
		}
		else if ((!!defaultData[item]) && (typeof defaultData[item] === "object")) {
			if (newData[item] === undefined || (typeof defaultData[item] !== "object"))
				newData[item] = defaultData[item];

			else
				fixData(defaultData[item], newData[item]);
		}
		else {
			if (newData[item] === undefined)
				newData[item] = defaultData[item];
		}
	}
}
function load() {
	let get = localStorage.getItem(getModID());

	if (get === null || get === undefined) {
		player = getStartPlayer();
		options = getStartOptions();
	}
	else {
		// 坏档时不要让整个游戏白屏：备份原始数据后按新档启动
		try {
			player = Object.assign(getStartPlayer(), decodeSave(get));
		} catch (e) {
			localStorage.setItem(getModID() + "_broken_" + Date.now(), get);
			console.error("存档解析失败，已备份并重新开始：", e);
			setTimeout(() => alert("存档损坏，无法读取。\n原始存档已备份到 localStorage，游戏将以新档启动。"), 0);
			player = getStartPlayer();
		}
		fixSave();
		loadOptions();
	}

	if (options.offlineProd) {
		if (player.offTime === undefined)
			player.offTime = { remain: 0 };
		player.offTime.remain += (Date.now() - player.time) / 1000;
	}
	player.time = Date.now();
	versionCheck();
	changeTheme();
	changeTreeQuality();
	updateLayers();
	setupModInfo();

	setupTemp();
	updateTemp();
	updateTemp();
	// 科技树现在只画到前沿 + 3 层，老存档的 tab 可能指向已经被藏起来的层：退回树根
	let savedRow = player.tab && tmp[player.tab] ? tmp[player.tab].row : undefined
	if (player.tab && player.tab !== "none" && typeof savedRow === "number" && savedRow >= 0
		&& !layerunlocked(player.tab)) {
		player.tab = "none"
	}
	updateTabFormats()
	loadVue();
}

function loadOptions() {
	let get2 = localStorage.getItem(getModID()+"_options");
	if (get2) 
		options = Object.assign(getStartOptions(), decodeSave(get2));
	else 
		options = getStartOptions()
	if (themes.indexOf(options.theme) < 0) options.theme = "default"
	fixData(getStartOptions(), options)

}

function setupModInfo() {
	modInfo.changelog = changelog;
	modInfo.winText = winText ? winText : `Congratulations! You have reached the end and beaten this game, but for now...`;

}
function fixNaNs() {
	NaNcheck(player);
}
function NaNcheck(data) {
	for (item in data) {
		if (data[item] == null) {
		}
		else if (Array.isArray(data[item])) {
			NaNcheck(data[item]);
		}
		else if (data[item] !== data[item] || checkDecimalNaN(data[item])) {
			if (!NaNalert) {
				clearInterval(interval);
				NaNalert = true;
				alert("Invalid value found in player, named '" + item + "'. Please let the creator of this mod know! You can refresh the page, and you will be un-NaNed.")
				return
			}
		}
		else if (data[item] instanceof Decimal) {
		}
		else if ((!!data[item]) && (data[item].constructor === Object)) {
			NaNcheck(data[item]);
		}
	}
}
// 存档编解码：save/load 与导出/导入必须用同一套，否则含非 ASCII 字符时会坏档
function encodeSave(data) {
	return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}
function decodeSave(str) {
	// 老存档可能是直接用 btoa(JSON) 写的纯 ASCII，UTF-8 解码失败时回退到原样解析
	try {
		return JSON.parse(decodeURIComponent(escape(atob(str))));
	} catch (e) {
		return JSON.parse(atob(str));
	}
}
function exportSave() {
	//if (NaNalert) return
	let str = encodeSave(player);

	const el = document.createElement("textarea");
	el.value = str;
	document.body.appendChild(el);
	el.select();
	el.setSelectionRange(0, 99999);
	document.execCommand("copy");
	document.body.removeChild(el);
}
function importSave(imported = undefined, forced = false) {
	if (imported === undefined)
		imported = prompt("Paste your save here");
	if (imported === undefined || imported === null || imported.trim() === "") return;
	try {
		tempPlr = Object.assign(getStartPlayer(), decodeSave(imported.trim()));
		if (tempPlr.versionType != getModID() && !forced && !confirm("This save appears to be for a different mod! Are you sure you want to import?")) // Wrong save (use "Forced" to force it to accept.)
			return;
		player = tempPlr;
		player.versionType = getModID();
		fixSave();
		versionCheck();
		NaNcheck(player)
		save();
		window.location.reload();
	} catch (e) {
		alert("导入失败：存档格式不正确。\n" + (e && e.message ? e.message : e));
		return;
	}
}
// 版本号逐段比较：8.10 > 8.9，8.6 > 8.5.3
function versionGreater(a, b) {
	const pa = String(a === undefined ? 0 : a).split(".");
	const pb = String(b === undefined ? 0 : b).split(".");
	for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
		const x = parseInt(pa[i], 10) || 0;
		const y = parseInt(pb[i], 10) || 0;
		if (x !== y) return x > y;
	}
	return false;
}
function versionCheck() {
	let setVersion = true;

	if (player.versionType === undefined || player.version === undefined) {
		player.versionType = getModID();
		player.version = 0;
	}

	if (setVersion) {
		// VERSION.num 是字符串（"8.6"），直接用 > 比较会在 8.10 / 8.9 这类版本号上判错，按点分段比较
		if (player.versionType == getModID() && versionGreater(VERSION.num, player.version)) {
			player.keepGoing = false;
			if (fixOldSave)
				fixOldSave(player.version);
		}
		player.versionType = getStartPlayer().versionType;
		player.version = VERSION.num;
		player.beta = VERSION.beta;
	}
}
var saveInterval = setInterval(function () {
	if (player === undefined)
		return;
	if (tmp.gameEnded && !player.keepGoing)
		return;
	if (options.autosave)
		save();
}, 5000);

window.onbeforeunload = () => {
    if (typeof player !== "undefined" && player && options.autosave) {
        save();
    }
};