/* ============================================================
   成就墙（侧边层）
   ============================================================ */

// 静态模组成就表：不依赖 MODPACK 的加载顺序
const MOD_ACH = [
	{ id: "t",  name: "暮色森林",   image: "img/twilight_moss.png",  resource: "娜迦鳞片" },
	{ id: "b",  name: "植物魔法",   image: "img/manasteel.png",      resource: "魔力钢" },
	{ id: "m",  name: "工业时代",   image: "img/eu_cell.png",        resource: "电力" },
	{ id: "th", name: "神秘时代",   image: "img/void_metal.png",     resource: "虚空金属" },
	{ id: "ae", name: "应用能源",   image: "img/certus_quartz.png",  resource: "赛特斯石英" },
	{ id: "dr", name: "龙之研究",   image: "img/chaos_shard.png",    resource: "混沌碎片" },
	{ id: "gc", name: "星系",       image: "img/moon_dust.png",      resource: "月球尘埃" },
	{ id: "gt", name: "格雷科技",   image: "img/plasma_cell.png",    resource: "等离子" },
	{ id: "pe", name: "等价交换",   image: "img/emc_crystal.png",    resource: "EMC" },
	{ id: "if", name: "冰与火",     image: "img/mega_01.png",        resource: "龙鳞" },
	{ id: "bl", name: "虚无世界",   image: "img/mega_02.png",        resource: "沼泽泥" },
	{ id: "ab", name: "深渊国度",   image: "img/mega_03.png",        resource: "深渊碎片" },
	{ id: "ie", name: "沉浸工程",   image: "img/mega_04.png",        resource: "钢锭" },
	{ id: "tc", name: "匠魂",       image: "img/mega_05.png",        resource: "钴锭" },
	{ id: "fo", name: "林业",       image: "img/mega_06.png",        resource: "蜂王浆" },
	{ id: "te", name: "热力膨胀",   image: "img/mega_07.png",        resource: "红石通量" },
	{ id: "ei", name: "末影接口",   image: "img/mega_08.png",        resource: "脉冲合金" },
	{ id: "me", name: "超能物质",   image: "img/mega_09.png",        resource: "反物质" },
	{ id: "nc", name: "核科技",     image: "img/mega_10.png",        resource: "铀燃料" },
	{ id: "br", name: "反应堆",     image: "img/mega_11.png",        resource: "黄铀锭" },
	{ id: "ma", name: "神秘农业",   image: "img/mega_12.png",        resource: "精华" },
	{ id: "bm", name: "血魔法",     image: "img/mega_13.png",        resource: "生命源质" },
	{ id: "wi", name: "巫术",       image: "img/mega_14.png",        resource: "咒术粉尘" },
	{ id: "an", name: "新生魔艺",   image: "img/mega_15.png",        resource: "源质" },
	{ id: "at", name: "天境",       image: "img/mega_16.png",        resource: "神能" },
	{ id: "et", name: "环境科技",   image: "img/mega_17.png",        resource: "纳米蜂群" },
	{ id: "sd", name: "实用存储",   image: "img/mega_18.png",        resource: "存储升级" },
	{ id: "rc", name: "铁路",       image: "img/mega_19.png",        resource: "强化铁轨" },
	{ id: "ig", name: "无尽贪婪",   image: "img/mega_20.png",        resource: "无尽催化剂" },
	{ id: "cr", name: "创造模式",   image: "img/creative_core.png",  resource: "创造能量" },
]

const ACH_TOTAL = 22 + MOD_ACH.length

addLayer("a", {
	name: "成就",
	symbol: "成就",
	image: "img/golden_apple.png",
	row: "side",
	color: "#f5c542",

	startData() { return {
		unlocked: true,
		points: new Decimal(0),
	}},

	resource: "成就",
	tooltip() {
		return "成就墙 · 已完成 " + player.a.achievements.length + " 个"
	},

	tabFormat: [
		["display-text", "<h1>成就墙</h1>"],
		["display-text", function() {
			return "已完成 <b>" + player.a.achievements.length + " / " + ACH_TOTAL + "</b> · 部分成就会永久提升所有产量"
		}, {"font-size": "16px", "opacity": "0.8"}],
		"blank",
		"achievements",
	],

	achievements: {
		11: {
			name: "第一根原木",
			image: "img/oak_log.png",
			done() { return player.points.gte(1) },
			tooltip: "获得 1 根原木。",
		},
		12: {
			name: "合成台",
			image: "img/crafting_table.png",
			done() { return hasUpgrade("p", 12) },
			tooltip: "购买「工作台」升级。",
		},
		13: {
			name: "木斧时代",
			image: "img/pickaxe_wood.png",
			done() { return hasUpgrade("p", 11) },
			tooltip: "购买「木斧」。<br><br><b>奖励：所有产量 ×1.1</b>",
		},
		14: {
			name: "第一次下矿",
			image: "img/cobblestone.png",
			done() { return player.s.points.gte(1) },
			tooltip: "获得第一块圆石。<br><br><b>奖励：所有产量 ×1.1</b>",
		},
		21: {
			name: "铁器时代",
			image: "img/iron_block.png",
			done() { return player.i.points.gte(1) },
			tooltip: "冶炼出第一块铁锭。<br><br><b>奖励：所有产量 ×1.15</b>",
		},
		22: {
			name: "钻石！",
			image: "img/diamond_block.png",
			done() { return player.d.points.gte(1) },
			tooltip: "挖到第一颗钻石。<br><br><b>奖励：所有产量 ×1.2</b>",
		},
		23: {
			name: "附魔",
			image: "img/beacon.png",
			done() { return hasUpgrade("d", 12) },
			tooltip: "建造附魔台。",
		},
		24: {
			name: "下界",
			image: "img/netherrack.png",
			done() { return player.n.points.gte(1) },
			tooltip: "第一次踏入下界。<br><br><b>奖励：所有产量 ×1.25</b>",
		},
		31: {
			name: "末地",
			image: "img/end_stone.png",
			done() { return player.e.points.gte(1) },
			tooltip: "穿过末地传送门。<br><br><b>奖励：所有产量 ×1.3</b>",
		},
		32: {
			name: "屠龙者",
			image: "img/dragon_egg.png",
			done() { return player.e.points.gte(8) },
			tooltip: "击败末影龙。<br><br><b>奖励：所有产量 ×1.5</b>",
		},
		33: {
			name: "树场大亨",
			image: "img/oak_planks.png",
			done() { return player.p.buyables[11].gte(10) },
			tooltip: "把树场升到 10 级。",
		},
		34: {
			name: "百万原木",
			image: "img/oak_log.png",
			done() { return player.points.gte(1e6) },
			tooltip: "累计拥有 100 万根原木。",
		},
		41: {
			name: "暮色森林",
			image: "img/twilight_moss.png",
			done() { return hasMilestone("t", 0) },
			tooltip: "让「暮色森林」达到第一个里程碑。<br><br><b>奖励：所有产量 ×1.05</b>",
		},
		42: {
			name: "植物魔法",
			image: "img/manasteel.png",
			done() { return hasMilestone("b", 0) },
			tooltip: "让「植物魔法」达到第一个里程碑。<br><br><b>奖励：所有产量 ×1.05</b>",
		},
		43: {
			name: "工业时代",
			image: "img/eu_cell.png",
			done() { return hasMilestone("m", 0) },
			tooltip: "让「工业时代」达到第一个里程碑。<br><br><b>奖励：所有产量 ×1.05</b>",
		},
		44: {
			name: "神秘时代",
			image: "img/void_metal.png",
			done() { return hasMilestone("th", 0) },
			tooltip: "让「神秘时代」达到第一个里程碑。<br><br><b>奖励：所有产量 ×1.05</b>",
		},
		45: {
			name: "应用能源",
			image: "img/certus_quartz.png",
			done() { return hasMilestone("ae", 0) },
			tooltip: "让「应用能源」达到第一个里程碑。<br><br><b>奖励：所有产量 ×1.05</b>",
		},
		46: {
			name: "龙之研究",
			image: "img/chaos_shard.png",
			done() { return hasMilestone("dr", 0) },
			tooltip: "让「龙之研究」达到第一个里程碑。<br><br><b>奖励：所有产量 ×1.05</b>",
		},
		47: {
			name: "星系",
			image: "img/moon_dust.png",
			done() { return hasMilestone("gc", 0) },
			tooltip: "让「星系」达到第一个里程碑。<br><br><b>奖励：所有产量 ×1.05</b>",
		},
		48: {
			name: "格雷科技",
			image: "img/plasma_cell.png",
			done() { return hasMilestone("gt", 0) },
			tooltip: "让「格雷科技」达到第一个里程碑。<br><br><b>奖励：所有产量 ×1.05</b>",
		},
		49: {
			name: "等价交换",
			image: "img/emc_crystal.png",
			done() { return hasMilestone("pe", 0) },
			tooltip: "让「等价交换」达到第一个里程碑。<br><br><b>奖励：所有产量 ×1.05</b>",
		},
		50: {
			name: "创造模式",
			image: "img/creative_core.png",
			done() { return hasMilestone("cr", 0) },
			tooltip: "让「创造模式」达到第一个里程碑。<br><br><b>奖励：所有产量 ×1.05</b>",
		},
	},
})

// 为 30 个模组层各生成一个“投产”成就（51–80）
for (let i = 0; i < MOD_ACH.length; i++) {
	const cfg = MOD_ACH[i]
	layers.a.achievements[51 + i] = {
		name: cfg.name + "·投产",
		image: cfg.image,
		done() { return player[cfg.id] && player[cfg.id].points.gte(1) },
		tooltip: "让「" + cfg.name + "」产出第一份" + cfg.resource + "。<br><br><b>奖励：所有产量 ×1.015</b>",
	}
}
