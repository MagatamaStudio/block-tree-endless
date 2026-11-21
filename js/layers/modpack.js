/* ============================================================
   无尽整合包 · 30 个模组维度
   每层：10 升级 / 4 自动化设施 + 主题核心 / 10 里程碑 / 3 挑战
   每层：首通施工 + 软上限（无存储上限，靠收益递减拉长）
   ============================================================ */

const ARCHETYPES = {
	gather: {
		label: "采集",
		upg2: 2,
		upg3: 3,
		passive: 0.06,
		gain: 1.10,
		soft: 0.14,
		time: 0.9,
		cost: 1.0,
		names: ["手工采集", "铜制工具", "矿脉勘探", "传送带", "自动矿机", "深层钻头", "并行开采", "超频采掘", "地质稳定器", "无限矿脉"],
		buys: ["采集场", "筛选机", "仓储区", "运输带"],
	},
	tech: {
		label: "科技",
		upg2: 2.5,
		upg3: 4,
		passive: 0.04,
		gain: 1.12,
		soft: 0.10,
		time: 1.1,
		cost: 1.15,
		names: ["基础电路", "能量网络", "量子处理器", "纳米装配", "反物质反应堆", "时空压缩", "维度引擎", "奇点计算", "产能突破", "终局协议"],
		buys: ["计算核心", "能量矩阵", "量子存储器", "自动化总线"],
	},
	magic: {
		label: "魔法",
		upg2: 2,
		upg3: 3,
		passive: 0.06,
		gain: 1.08,
		soft: 0.19,
		time: 0.9,
		cost: 1.0,
		names: ["符文刻印", "魔力循环", "灵魂绑定", "虚空仪式", "星界投影", "时间法阵", "维度裂隙", "创世之书", "软上限突破", "永恒回响"],
		buys: ["符文祭坛", "魔力池", "灵魂熔炉", "时间法阵"],
	},
	industry: {
		label: "工业",
		upg2: 3,
		upg3: 3,
		passive: 0.05,
		gain: 1.15,
		soft: 0.15,
		time: 1.0,
		cost: 1.1,
		names: ["蒸汽机", "流水线", "高压电网", "聚变核心", "物质重组", "戴森环", "行星引擎", "银河物流", "产能扩容", "无限产能"],
		buys: ["生产线", "反应堆", "冷却塔", "物流中心"],
	},
	explore: {
		label: "探索",
		upg2: 2,
		upg3: 3,
		passive: 0.04,
		gain: 1.10,
		soft: 0.26,
		time: 1.2,
		cost: 0.9,
		names: ["星图", "跃迁引擎", "虫洞稳定器", "外星遗迹", "维度锚点", "时间胶囊", "平行宇宙", "万象归一", "边界突破", "无尽远征"],
		buys: ["传送门", "探测器", "星门", "远征营地"],
	},
}

// 原型专属机制：每个原型一套可操作的规则，而不只是数值差异
const CORE_NAMES = {
	gather: "核心矿脉",
	tech: "主控核心",
	magic: "咒术核心",
	industry: "总控核心",
	explore: "旗舰核心",
}

const ARCH_MECH = {
	gather: {
		key: "gather",
		label: "连续采掘",
		desc: "自动产出随本轮施工进度从 ×1 递增到 ×3，首通后固定 ×3。",
	},
	tech: {
		key: "tech",
		label: "研究分支",
		desc: "每次声望获得研究点，可投入三条分支：声望收益、软上限、自动产出。",
	},
	magic: {
		key: "magic",
		label: "主动咒语",
		desc: "消耗 10% 本层资源，60 秒内声望收益 ×5，冷却 8 分钟。",
	},
	industry: {
		key: "industry",
		label: "设施联动",
		desc: "生产与上限设施每级使声望收益 +1%，增益设施每级使自动产出 +2%。",
	},
	explore: {
		key: "explore",
		label: "远征路线",
		desc: "切换 快/稳/丰 路线：快减施工需求、稳加软上限、丰增声望收益。",
	},
}

// 挑战条件按层轮换，ID 仍为 11–13；封存/熄核只放在 13 号，避免早期挑战被升级或里程碑卡住
const MP_CHALLENGES = {
	soft: { name: "薄雾", rule: "软上限 ×0.5", goal: 1 },
	passive: { name: "断供", rule: "自动产出 ×0.25", goal: 1.5 },
	gain: { name: "迟滞", rule: "声望收益 ×0.6", goal: 1.2 },
	sig: { name: "封存", rule: "签名升级失效", goal: 1 },
	trait: { name: "失谐", rule: "主题特性失效", goal: 0.9 },
	core: { name: "熄核", rule: "主题核心失效", goal: 1 },
}

const MP_CHALLENGE_SETS = [
	["soft", "passive", "gain"],
	["passive", "gain", "sig"],
	["gain", "soft", "trait"],
	["soft", "passive", "core"],
	["passive", "gain", "trait"],
	["gain", "trait", "sig"],
	["soft", "trait", "core"],
	["passive", "gain", "core"],
	["gain", "soft", "passive"],
	["trait", "gain", "sig"],
]

function mpChallengeKey(cfg, slot) {
	return MP_CHALLENGE_SETS[cfg.index % MP_CHALLENGE_SETS.length][slot - 11]
}

function mpChallengeRule(cfg, slot) {
	return MP_CHALLENGES[mpChallengeKey(cfg, slot)]
}

function mpActiveChallenge(cfg) {
	const data = (typeof player !== "undefined" && player) ? player[cfg.id] : null
	if (!data) return null
	const active = Number(data.activeChallenge)
	if (active !== 11 && active !== 12 && active !== 13) return null
	return mpChallengeKey(cfg, active)
}

function mpChallengeGoal(cfg, slot) {
	return new Decimal(cfg.req).times(mpChallengeRule(cfg, slot).goal)
}

// 层机制只读取自身状态，不调用 updateTemp，避免与临时倍率计算递归
function mpMech2Mods(cfg) {
	const out = { gain: 1, passive: 1, softcap: 1, wall: 1 }
	const data = (typeof player !== "undefined" && player) ? player[cfg.id] : null
	if (!data || !cfg.mech2 || !cfg.mech2.mods) return out
	cfg.mech2.mods(cfg, data, out)
	return out
}

// 同一模板的 3 层各取一个变体，数值与节奏不同
function mpMechVar(cfg) {
	const vs = cfg.mech2 && cfg.mech2.variants
	if (!vs) return null
	return vs[Math.min(vs.length - 1, Math.max(0, cfg.mechV || 0))]
}

function mpMechLabel(cfg) {
	const v = mpMechVar(cfg)
	return cfg.mech2.label + (v ? " · " + v.name : "")
}

function mpMechDesc(cfg) {
	const v = mpMechVar(cfg)
	return (v && v.desc) || (cfg.mech2 && cfg.mech2.desc) || ""
}

function mpReserveBank(data, v) {
	if (!data.mechAt) return new Decimal(0)
	const rate = v ? v.rate : 0.001
	const cap = v ? v.cap : 0.6
	const acc = data.points.times(rate).times((Date.now() - data.mechAt) / 1000)
	return acc.min(data.points.times(cap)).max(0)
}

// 8 套模板机制，按层轮换；每套 3 个变体，提供 status / mods / 可选 click
const MP_TEMPLATE_MECHS = {
	tide: {
		label: "潮汐",
		desc: "按周期涨落：涨潮时本层产量提高。",
		variants: [
			{ name: "缓潮", cycle: 60, high: 30, mult: 1.45, desc: "60 秒一个周期，涨潮的 30 秒内本层产量 ×1.45。" },
			{ name: "快潮", cycle: 24, high: 8, mult: 1.75, desc: "24 秒一个周期，涨潮只有 8 秒，但本层产量 ×1.75。" },
			{ name: "长潮", cycle: 50, high: 35, mult: 1.36, desc: "50 秒一个周期，涨潮长达 35 秒，本层产量 ×1.36。" },
		],
		status(cfg) {
			const v = mpMechVar(cfg)
			const t = (Date.now() / 1000 + cfg.index * 7) % v.cycle
			const high = t < v.high
			const left = Math.ceil(high ? v.high - t : v.cycle - t)
			return [high ? "正在涨潮：产量 ×" + v.mult + "（剩余 " + left + " 秒）" : "正在退潮（" + left + " 秒后涨潮）"]
		},
		mods(cfg, data, out) {
			const v = mpMechVar(cfg)
			if ((Date.now() / 1000 + cfg.index * 7) % v.cycle < v.high) out.gain *= v.mult
		},
	},
	rotate: {
		label: "轮转",
		desc: "按周期轮换重点加成。",
		variants: [
			{ name: "三相", cycle: 90, phase: 30, stats: ["gain", "softcap", "passive"], labels: ["产量", "软上限", "自动产出"], mult: 1.35,
				desc: "每 30 秒轮换一次重点：产量 / 软上限 / 自动产出，当前项 ×1.35。" },
			{ name: "双相", cycle: 60, phase: 30, stats: ["gain", "softcap"], labels: ["产量", "软上限"], mult: 1.5,
				desc: "每 30 秒在产量与软上限之间轮换，当前项 ×1.5。" },
			{ name: "深耕", cycle: 120, phase: 40, stats: ["gain", "softcap", "passive"], labels: ["产量", "软上限", "自动产出"], mult: 1.4,
				desc: "每 40 秒轮换一次重点：产量 / 软上限 / 自动产出，当前项 ×1.4。" },
		],
		status(cfg) {
			const v = mpMechVar(cfg)
			const t = (Date.now() / 1000 + cfg.index * 11) % v.cycle
			const idx = Math.floor(t / v.phase)
			return ["当前重点：" + v.labels[idx] + " ×" + v.mult + "（" +
				Math.ceil(v.phase - (t % v.phase)) + " 秒后轮换）"]
		},
		mods(cfg, data, out) {
			const v = mpMechVar(cfg)
			const idx = Math.floor(((Date.now() / 1000 + cfg.index * 11) % v.cycle) / v.phase)
			out[v.stats[idx]] *= v.mult
		},
	},
	echo: {
		label: "回响",
		desc: "本层每完成一次声望，累积一层永久加成。",
		variants: [
			{ name: "常响", cap: 20, gain: 0.05, passive: 0, desc: "本层每完成一次声望，本层产量 +5%，最多累计 20 次。" },
			{ name: "深响", cap: 30, gain: 0.03, passive: 0, desc: "本层每完成一次声望，本层产量 +3%，最多累计 30 次。" },
			{ name: "共振", cap: 20, gain: 0.04, passive: 0.02, desc: "本层每完成一次声望，本层产量 +4%、自动产出 +2%，最多累计 20 次。" },
		],
		status(cfg) {
			const v = mpMechVar(cfg)
			const n = Math.min(v.cap, player[cfg.id].mechCount || 0)
			let line = "回响：" + n + "/" + v.cap + " · 产量 ×" + format(1 + v.gain * n)
			if (v.passive) line += " · 自动 ×" + format(1 + v.passive * n)
			return [line]
		},
		mods(cfg, data, out) {
			const v = mpMechVar(cfg)
			const n = Math.min(v.cap, data.mechCount || 0)
			out.gain *= 1 + v.gain * n
			if (v.passive) out.passive *= 1 + v.passive * n
		},
	},
	matrix: {
		label: "矩阵",
		desc: "设施总等级按档位提供成套加成。",
		variants: [
			{ name: "常阵", step: 6, gain: 0.04, passive: 0.02, desc: "设施总等级每 6 级提供一套加成：产量 +4%、自动产出 +2%。" },
			{ name: "密阵", step: 4, gain: 0.025, passive: 0.015, desc: "设施总等级每 4 级提供一套加成：产量 +2.5%、自动产出 +1.5%。" },
			{ name: "重阵", step: 10, gain: 0.07, passive: 0.03, desc: "设施总等级每 10 级提供一套加成：产量 +7%、自动产出 +3%。" },
		],
		status(cfg) {
			const v = mpMechVar(cfg)
			const lv = [11, 12, 13, 14, 18].reduce((a, x) => a + mpBuy(cfg, x).toNumber(), 0)
			const sets = Math.floor(lv / v.step)
			return ["设施总等级 " + lv + " · 矩阵 " + sets + " 套（产量 +" + format(sets * v.gain * 100) + "%）"]
		},
		mods(cfg, data, out) {
			const v = mpMechVar(cfg)
			const lv = [11, 12, 13, 14, 18].reduce((a, x) => a + mpBuy(cfg, x).toNumber(), 0)
			const sets = Math.floor(lv / v.step)
			out.gain *= 1 + v.gain * sets
			out.passive *= 1 + v.passive * sets
		},
	},
	wager: {
		label: "赌局",
		desc: "押上部分资源搏一把，冷却后可再次下注。",
		variants: [
			{ name: "小赌", stake: 0.08, chance: 0.5, mult: 2.5, cd: 45000, desc: "押上 8% 资源：一半概率收回 250%，一半概率输掉本金；45 秒一次。" },
			{ name: "稳局", stake: 0.05, chance: 0.6, mult: 2.0, cd: 30000, desc: "押上 5% 资源：六成概率收回 200%，四成输掉本金；30 秒一次。" },
			{ name: "豪赌", stake: 0.15, chance: 0.5, mult: 2.4, cd: 60000, desc: "押上 15% 资源：一半概率收回 240%，一半概率输掉本金；60 秒一次。" },
		],
		status(cfg) {
			const v = mpMechVar(cfg)
			const d = player[cfg.id]
			if (Date.now() < (d.mechAt || 0))
				return [v.name + "冷却：" + Math.ceil(((d.mechAt || 0) - Date.now()) / 1000) + " 秒"]
			return [v.name + "可用：点击下方下注卡"]
		},
		click(cfg) {
			return {
				title: cfg.short + "·" + mpMechVar(cfg).name,
				display() {
					const v = mpMechVar(cfg)
					const d = player[cfg.id]
					if (Date.now() < (d.mechAt || 0))
						return "冷却中<br>还需 " + Math.ceil(((d.mechAt || 0) - Date.now()) / 1000) + " 秒"
					return "押上当前资源的 " + Math.round(v.stake * 100) + "%<br>赢：" +
						Math.round(v.mult * 100) + "%（概率 " + Math.round(v.chance * 100) + "%）<br>输：本金没了 · 点击下注"
				},
				canClick() {
					return Date.now() >= (player[cfg.id].mechAt || 0) && player[cfg.id].points.gt(0)
				},
				onClick() {
					const v = mpMechVar(cfg)
					const d = player[cfg.id]
					if (Date.now() < (d.mechAt || 0)) return
					const stake = d.points.times(v.stake)
					d.points = d.points.sub(stake)
					if (Math.random() < v.chance) d.points = d.points.add(stake.times(v.mult))
					d.mechAt = Date.now() + v.cd
					updateTemp()
				},
				style: { "height": "140px", "width": "260px" },
			}
		},
	},
	reserve: {
		label: "储备",
		desc: "按当前资源持续累积可领取量，点击领取。",
		autoStart: true,
		variants: [
			{ name: "常备", rate: 0.001, cap: 0.6, desc: "每秒累积当前资源的 0.1%，最多累积到当前资源的 60%，点击领取。" },
			{ name: "活期", rate: 0.0012, cap: 0.3, desc: "每秒累积当前资源的 0.12%，最多累积到当前资源的 30%，点击领取。" },
			{ name: "定期", rate: 0.0009, cap: 0.9, desc: "每秒累积当前资源的 0.09%，最多累积到当前资源的 90%，点击领取。" },
		],
		status(cfg) {
			const v = mpMechVar(cfg)
			const d = player[cfg.id]
			return ["可领取：" + format(mpReserveBank(d, v)) + "（上限：当前资源的 " + format(v.cap * 100) + "%）"]
		},
		click(cfg) {
			return {
				title: cfg.short + "·" + mpMechVar(cfg).name,
				display() {
					const v = mpMechVar(cfg)
					const d = player[cfg.id]
					return "可领取：" + format(mpReserveBank(d, v)) + " " + cfg.resource +
						"<br>每秒累积当前资源的 " + format(v.rate * 100) + "%<br>最多累积到当前资源的 " +
						format(v.cap * 100) + "% · 点击领取"
				},
				canClick() { return mpReserveBank(player[cfg.id], mpMechVar(cfg)).gt(0) },
				onClick() {
					const v = mpMechVar(cfg)
					const d = player[cfg.id]
					const bank = mpReserveBank(d, v)
					if (bank.lte(0)) return
					d.points = d.points.add(bank)
					d.best = d.best.max(d.points)
					d.mechAt = Date.now()
					updateTemp()
				},
				style: { "height": "140px", "width": "260px" },
			}
		},
	},
	overload: {
		label: "过载",
		desc: "开启时以自动产出与施工需求换取产量；点击切换。",
		variants: [
			{ name: "常载", gain: 1.35, passive: 0.6, wall: 1.1, desc: "开启时本层产量 ×1.35、自动产出 ×0.6、施工需求 ×1.1；点击切换。" },
			{ name: "微载", gain: 1.2, passive: 0.8, wall: 1.05, desc: "开启时本层产量 ×1.2、自动产出 ×0.8、施工需求 ×1.05；点击切换。" },
			{ name: "暴力过载", gain: 1.6, passive: 0.45, wall: 1.2, desc: "开启时本层产量 ×1.6、自动产出 ×0.45、施工需求 ×1.2；点击切换。" },
		],
		status(cfg) {
			const v = mpMechVar(cfg)
			return [player[cfg.id].mechOn
				? v.name + "：开启（产量 ×" + v.gain + "）"
				: v.name + "：关闭"]
		},
		mods(cfg, data, out) {
			const v = mpMechVar(cfg)
			if (!data.mechOn) return
			out.gain *= v.gain
			out.passive *= v.passive
			out.wall *= v.wall
		},
		click(cfg) {
			return {
				title: cfg.short + "·" + mpMechVar(cfg).name,
				display() {
					const v = mpMechVar(cfg)
					return player[cfg.id].mechOn
						? v.name + "开启<br>产量 ×" + v.gain + " · 自动 ×" + v.passive + " · 施工需求 ×" + v.wall + "<br>点击关闭"
						: v.name + "关闭<br>点击开启换取产量"
				},
				canClick() { return true },
				onClick() {
					player[cfg.id].mechOn = !player[cfg.id].mechOn
					updateTemp()
				},
				style: { "height": "130px", "width": "260px" },
			}
		},
	},
	resonance: {
		label: "共鸣",
		desc: "本层每完成一个挑战，叠加一层永久加成。",
		variants: [
			{ name: "常律", gain: 0.08, passive: 0.04, desc: "本层每完成一个挑战，产量 +8%、自动产出 +4%。" },
			{ name: "战律", gain: 0.12, passive: 0, desc: "本层每完成一个挑战，产量 +12%。" },
			{ name: "稳律", gain: 0.06, passive: 0.06, desc: "本层每完成一个挑战，产量 +6%、自动产出 +6%。" },
		],
		status(cfg) {
			const v = mpMechVar(cfg)
			const n = [11, 12, 13].filter(x => challengeCompletions(cfg.id, x) > 0).length
			let line = "共鸣：" + n + "/3 · 产量 ×" + format(1 + v.gain * n)
			if (v.passive) line += " · 自动 ×" + format(1 + v.passive * n)
			return [line]
		},
		mods(cfg, data, out) {
			const v = mpMechVar(cfg)
			const n = [11, 12, 13].filter(x => challengeCompletions(cfg.id, x) > 0).length
			out.gain *= 1 + v.gain * n
			if (v.passive) out.passive *= 1 + v.passive * n
		},
	},
}

// 前 6 层的手工机制
const MP_UNIQUE_MECHS = {
	t: {
		label: "迷宫探索",
		desc: "深入迷宫消耗 12% 资源，最多 12 层；每层产量 +4%、自动产出 +2%、软上限 +1%。",
		status(cfg) {
			const depth = Math.min(12, player[cfg.id].mechDepth || 0)
			if (depth >= 12) return ["迷宫深度 12/12 · 已通关"]
			const guards = ["娜迦", "九头蛇", "冰雪女王", "暮色巫妖"]
			return ["迷宫深度 " + depth + "/12 · 下一位守卫：" + guards[Math.min(3, Math.floor(depth / 3))]]
		},
		mods(cfg, data, out) {
			const depth = Math.min(12, data.mechDepth || 0)
			out.gain *= 1 + 0.04 * depth
			out.passive *= 1 + 0.02 * depth
			out.softcap *= 1 + 0.01 * depth
		},
		click(cfg) {
			return {
				title: cfg.short + "·深入迷宫",
				display() {
					const d = player[cfg.id]
					const depth = Math.min(12, d.mechDepth || 0)
					if (depth >= 12) return "迷宫已通关<br>产量 +48% · 自动 +24% · 软上限 +12%"
					return "迷宫深度 " + depth + "/12<br>深入一层：消耗当前资源的 12%<br>产量 +4% · 自动 +2% · 软上限 +1%"
				},
				canClick() {
					const d = player[cfg.id]
					return Math.min(12, d.mechDepth || 0) < 12 && d.points.gt(0)
				},
				onClick() {
					const d = player[cfg.id]
					const depth = Math.min(12, d.mechDepth || 0)
					if (depth >= 12 || d.points.lte(0)) return
					d.points = d.points.times(0.88)
					d.mechDepth = depth + 1
					updateTemp()
				},
				style: { "height": "130px", "width": "260px" },
			}
		},
	},
	b: {
		label: "魔力花圃",
		desc: "种下魔力花，40 秒后收获约 30 秒自动产出，并让产量 +3%（最多 10 次）。",
		status(cfg) {
			const d = player[cfg.id]
			const stacks = Math.min(10, d.mechDepth || 0)
			const lines = ["收获次数：" + stacks + "/10 · 产量 ×" + format(1 + 0.03 * stacks)]
			if (!d.mechAt) lines.unshift("花圃空着 · 点击花圃卡播种")
			else {
				const left = Math.ceil((d.mechAt + 40000 - Date.now()) / 1000)
				lines.unshift(left > 0 ? "生长中：还需 " + left + " 秒" : "魔力花已盛开 · 点击收获")
			}
			return lines
		},
		mods(cfg, data, out) {
			out.gain *= 1 + 0.03 * Math.min(10, data.mechDepth || 0)
		},
		click(cfg) {
			return {
				title: cfg.short + "·魔力花圃",
				display() {
					const d = player[cfg.id]
					if (!d.mechAt) return "花圃空着<br>点击播种，40 秒后收获"
					const left = Math.ceil((d.mechAt + 40000 - Date.now()) / 1000)
					if (left > 0) return "生长中<br>还需 " + left + " 秒"
					return "魔力花已盛开<br>点击收获 30 秒自动产出"
				},
				canClick() {
					const d = player[cfg.id]
					return !d.mechAt || Date.now() >= d.mechAt + 40000
				},
				onClick() {
					const d = player[cfg.id]
					if (!d.mechAt) {
						d.mechAt = Date.now()
						return
					}
					if (Date.now() < d.mechAt + 40000) return
					const burst = tmp[cfg.id].passiveGeneration.times(tmp[cfg.id].resetGain).times(30)
					d.points = d.points.add(burst.max(0))
					d.best = d.best.max(d.points)
					d.mechDepth = Math.min(10, (d.mechDepth || 0) + 1)
					d.mechAt = 0
					updateTemp()
				},
				style: { "height": "130px", "width": "260px" },
			}
		},
	},
	m: {
		label: "电压档位",
		desc: "在 低耗 / 标准 / 超频 间切换：低耗减施工需求，超频加产量但抬高需求与压低软上限。",
		default: 1,
		status(cfg) {
			const mode = player[cfg.id].mechMode || 0
			return [["低耗：施工需求 ×0.85、产量 ×0.85", "标准：无额外修正",
				"超频：产量 ×1.6、软上限 ×0.85、施工需求 ×1.25"][mode]]
		},
		mods(cfg, data, out) {
			const mode = data.mechMode || 0
			if (mode === 0) {
				out.gain *= 0.85
				out.wall *= 0.85
			}
			else if (mode === 2) {
				out.gain *= 1.6
				out.softcap *= 0.85
				out.wall *= 1.25
			}
		},
		click(cfg) {
			return {
				title: cfg.short + "·电压档位",
				display() {
					const mode = player[cfg.id].mechMode || 0
					return "当前：" + ["低耗", "标准", "超频"][mode] +
						"<br>" + ["材料少、产量略低", "平衡", "产量高、软上限与需求变差"][mode] +
						"<br>点击切换档位"
				},
				canClick() { return true },
				onClick() {
					const d = player[cfg.id]
					d.mechMode = ((d.mechMode || 0) + 1) % 3
					updateTemp()
				},
				style: { "height": "125px", "width": "250px" },
			}
		},
	},
	th: {
		label: "虚空凝视",
		desc: "开启凝视：产量 ×1.35，但施工需求 ×1.25、软上限 ×0.92；点击切换。",
		status(cfg) {
			return [player[cfg.id].mechOn ? "凝视：开启（产量 ×1.35）" : "凝视：关闭"]
		},
		mods(cfg, data, out) {
			if (!data.mechOn) return
			out.gain *= 1.35
			out.wall *= 1.25
			out.softcap *= 0.92
		},
		click(cfg) {
			return {
				title: cfg.short + "·虚空凝视",
				display() {
					return player[cfg.id].mechOn
						? "凝视开启<br>产量 ×1.35 · 施工需求 ×1.25 · 软上限 ×0.92<br>点击关闭"
						: "凝视关闭<br>点击以理智换取产量"
				},
				canClick() { return true },
				onClick() {
					player[cfg.id].mechOn = !player[cfg.id].mechOn
					updateTemp()
				},
				style: { "height": "120px", "width": "250px" },
			}
		},
	},
	ae: {
		label: "网络优先级",
		desc: "在 存储优先（软上限 ×1.2）与 产量优先（产量 ×1.15）之间切换。",
		status(cfg) {
			return [player[cfg.id].mechOn ? "产量优先：产量 ×1.15" : "存储优先：软上限 ×1.2"]
		},
		mods(cfg, data, out) {
			if (data.mechOn) out.gain *= 1.15
			else out.softcap *= 1.2
		},
		click(cfg) {
			return {
				title: cfg.short + "·网络优先级",
				display() {
					return player[cfg.id].mechOn
						? "产量优先：产量 ×1.15<br>点击切回存储优先"
						: "存储优先：软上限 ×1.2<br>点击切换到产量优先"
				},
				canClick() { return true },
				onClick() {
					player[cfg.id].mechOn = !player[cfg.id].mechOn
					updateTemp()
				},
				style: { "height": "120px", "width": "250px" },
			}
		},
	},
	dr: {
		label: "混沌风险",
		desc: "在 0–3 级风险间切换：风险越高产量越高，软上限与施工需求惩罚越重。",
		status(cfg) {
			const mode = player[cfg.id].mechMode || 0
			return [["安全：无额外修正", "低风险：产量 ×1.08",
				"高风险：产量 ×1.2、软上限 ×0.92",
				"失控：产量 ×1.4、软上限 ×0.8、施工需求 ×1.2"][mode]]
		},
		mods(cfg, data, out) {
			const mode = data.mechMode || 0
			if (mode === 1) out.gain *= 1.08
			else if (mode === 2) {
				out.gain *= 1.2
				out.softcap *= 0.92
			}
			else if (mode === 3) {
				out.gain *= 1.4
				out.softcap *= 0.8
				out.wall *= 1.2
			}
		},
		click(cfg) {
			return {
				title: cfg.short + "·混沌风险",
				display() {
					const mode = player[cfg.id].mechMode || 0
					return "当前风险：" + ["安全", "低", "高", "失控"][mode] +
						"<br>" + ["无修正", "产量 ×1.08", "产量 ×1.2 · 软上限 ×0.92",
							"产量 ×1.4 · 软上限 ×0.8 · 施工需求 ×1.2"][mode] +
						"<br>点击提升风险，到顶后回到安全"
				},
				canClick() { return true },
				onClick() {
					const d = player[cfg.id]
					d.mechMode = ((d.mechMode || 0) + 1) % 4
					updateTemp()
				},
				style: { "height": "135px", "width": "260px" },
			}
		},
	},
}

const MP_TEMPLATE_ORDER = ["tide", "rotate", "echo", "matrix", "wager", "reserve", "overload", "resonance"]

// 30 个主题各挂一条低成本特性
const TRAITS = {
	gain:     { label: "丰饶", desc: "本层产量 ×1.12", gain: 1.12, core: "gain" },
	soft:     { label: "稳固", desc: "软上限 ×1.20", soft: 1.20, core: "soft" },
	wall:     { label: "疾行", desc: "施工需求 ×0.92", wall: 0.92, core: "wall" },
	facility: { label: "工程", desc: "设施造价 ×0.90", facility: 0.90, core: "passive" },
	upgrade:  { label: "博学", desc: "升级造价 ×0.85", upgrade: 0.85, core: "gain" },
	ms:       { label: "先驱", desc: "里程碑需求 ×0.80", ms: 0.80, core: "soft" },
	passive:  { label: "涌动", desc: "自动产出 ×1.25", passive: 1.25, core: "passive" },
	global:   { label: "共鸣", desc: "全局产量 +5%", global: 0.05, core: "global" },
}

const THEME_TRAITS = {
	t: "wall", b: "passive", m: "facility", th: "soft", ae: "upgrade",
	dr: "gain", gc: "wall", gt: "global", pe: "upgrade", if: "gain",
	bl: "passive", ab: "soft", ie: "facility", tc: "gain", fo: "ms",
	te: "facility", ei: "upgrade", me: "global", nc: "wall", br: "facility",
	ma: "passive", bm: "gain", wi: "soft", an: "ms", at: "ms",
	et: "upgrade", sd: "soft", rc: "facility", ig: "global", cr: "gain",
}

// 15 号升级改为主题签名升级：标题、文案与倍率逐层不同
const THEME_SIGS = {
	t:  { name: "暮色契约", text: "娜迦在黄昏中低语，鳞片比传说里更坚硬。", mult: 7 },
	b:  { name: "盖亚祝福", text: "泰拉钢在花海中缓慢生长，魔力从不枯竭。", mult: 7 },
	m:  { name: "高压电网", text: "电缆嗡鸣，整座基地的机器永不停机。", mult: 7 },
	th: { name: "虚空低语", text: "邪术仪式让虚空金属自己从黑暗中析出。", mult: 8 },
	ae: { name: "ME 终端", text: "一个终端装下所有箱子，网络自动合成一切。", mult: 7 },
	dr: { name: "混沌核心", text: "龙芯的紫光撕开天空，混沌碎片不断坠落。", mult: 8 },
	gc: { name: "火箭方程", text: "每一次点火，都把月球尘埃带回地面。", mult: 7 },
	gt: { name: "聚变环", text: "等离子在涡轮中咆哮，格雷的浪漫从不降温。", mult: 8 },
	pe: { name: "贤者之石", text: "物质守恒变成一句笑话，EMC 凭空增殖。", mult: 8 },
	if: { name: "猎龙者", text: "第一片龙鳞意味着一整套龙钢装备。", mult: 7 },
	bl: { name: "梦境徘徊", text: "沼泽吞掉光线，泥浆自己爬上收集槽。", mult: 7 },
	ab: { name: "死灵之书", text: "深渊的眼眸睁开，碎片顺着旧日低语涌来。", mult: 8 },
	ie: { name: "电弧炉", text: "蓝白火焰舔舐炉壁，钢锭一炉接一炉。", mult: 7 },
	tc: { name: "钴蓝模具", text: "熔炉里的钴液流进模具，工具自己成形。", mult: 8 },
	fo: { name: "蜂王培育", text: "蜂箱嗡嗡作响，耐心最终都会变成产量。", mult: 7 },
	te: { name: "通量导管", text: "红石通量在导管里奔流，机器开始自己运转。", mult: 7 },
	ei: { name: "脉冲合金", text: "末影接口把每台设备缝进同一张网。", mult: 7 },
	me: { name: "反物质约束", text: "反物质安静悬浮，能量密度逼近物理边缘。", mult: 8 },
	nc: { name: "控制棒", text: "控制棒缓缓升起，热量在蒸汽中变成电力。", mult: 7 },
	br: { name: "黄铀增殖", text: "黄铀锭在幽光中一层层增殖，反应堆从不休息。", mult: 8 },
	ma: { name: "精华农场", text: "把矿物种进耕地，收获一整片矿脉。", mult: 8 },
	bm: { name: "血祭", text: "生命源质在祭坛中旋转，以血换取超越常理的力量。", mult: 8 },
	wi: { name: "坩埚咒语", text: "绿烟升起，咒术粉尘在月光下闪烁。", mult: 7 },
	an: { name: "自动书写", text: "法术书自己翻页，源质从世界树根须间渗出。", mult: 7 },
	at: { name: "神能羽翼", text: "云层之上，坠落被改写成了飞行。", mult: 8 },
	et: { name: "纳米蜂群", text: "整颗星球被拆解成一台可升级的机器。", mult: 7 },
	sd: { name: "抽屉墙", text: "每一格空间都变成无限仓库，升级自己叠自己。", mult: 7 },
	rc: { name: "编组站", text: "信号灯亮起，强化铁轨把物流跑成了节奏。", mult: 8 },
	ig: { name: "无尽催化剂", text: "它不满足于一个世界，它要所有世界。", mult: 8 },
	cr: { name: "创造核心", text: "所有模组被压缩进同一个存档，能量不再需要理由。", mult: 10 },
}

const MOD_THEMES = [
	{ id: "t",  name: "暮色森林",   symbol: "暮", resource: "娜迦鳞片",   color: "#3f7a4a", image: "img/twilight_moss.png",  arch: "explore",  intro: "穿过钻石传送门，森林永远笼罩在黄昏里。娜迦、九头蛇与冰雪女王在迷宫深处等着你。" },
	{ id: "b",  name: "植物魔法",   symbol: "植", resource: "魔力钢",     color: "#55b89a", image: "img/manasteel.png",      arch: "magic",    intro: "把花种在符文祭坛周围，让魔力在池中流动。泰拉钢与盖亚守护者，是植物魔法师的终极浪漫。" },
	{ id: "m",  name: "工业时代",   symbol: "电", resource: "电力",       color: "#e0a92e", image: "img/eu_cell.png",        arch: "industry", intro: "第一台发电机轰鸣起来，电缆把整座基地连成一张网。从太阳能到核反应堆，工业就是力量。" },
	{ id: "th", name: "神秘时代",   symbol: "秘", resource: "虚空金属",   color: "#8e6bbf", image: "img/void_metal.png",     arch: "magic",    intro: "研究台前的烛光照亮了禁忌知识。灵气节点、虚空金属与邪术仪式，让世界变得不太稳定。" },
	{ id: "ae", name: "应用能源",   symbol: "AE", resource: "赛特斯石英", color: "#7fc7e8", image: "img/certus_quartz.png",  arch: "tech",     intro: "ME 网络把所有箱子压缩成一个终端。赛特斯石英在加速生长，分子装配室自动合成一切。" },
	{ id: "dr", name: "龙之研究",   symbol: "龙", resource: "混沌碎片",   color: "#b03cff", image: "img/chaos_shard.png",    arch: "tech",     intro: "龙芯的紫色能量撕裂了天空。觉醒龙锭、混沌守卫与能量核心，把力量推向失控的边缘。" },
	{ id: "gc", name: "星系",       symbol: "星", resource: "月球尘埃",   color: "#c9d6e3", image: "img/moon_dust.png",      arch: "explore",  intro: "火箭升空，月球基地在灰色荒原上亮起灯。从火星殖民到空间站，星系模组把自动化送出了地球。" },
	{ id: "gt", name: "格雷科技",   symbol: "格", resource: "等离子",     color: "#ff8c42", image: "img/plasma_cell.png",    arch: "industry", intro: "蒸汽时代只是开始，高压电网与聚变环才是格雷的浪漫。等离子在涡轮中咆哮。" },
	{ id: "pe", name: "等价交换",   symbol: "EMC", resource: "EMC",       color: "#ffd166", image: "img/emc_crystal.png",    arch: "tech",     intro: "转化桌把万物折算成 EMC，再凭空变回万物。贤者之石、暗物质与红物质，让物质守恒变成一句笑话。" },
	{ id: "if", name: "冰与火",     symbol: "冰", resource: "龙鳞",       color: "#5f9ec9", image: "img/mega_01.png",        arch: "gather",   intro: "冰龙与火龙在雪原与火山之间盘旋。猎龙者的第一片龙鳞，意味着一整套龙钢装备。" },
	{ id: "bl", name: "虚无世界",   symbol: "沼", resource: "沼泽泥",     color: "#6b7d4a", image: "img/mega_02.png",        arch: "magic",    intro: "沼泽会吞噬光线。蜻蜓、泥怪与地下祭坛，让虚无世界的每一步都像在梦里。" },
	{ id: "ab", name: "深渊国度",   symbol: "渊", resource: "深渊碎片",   color: "#4b2d6b", image: "img/mega_03.png",        arch: "magic",    intro: "深渊的眼眸在黑暗中睁开。死灵之书、深渊能量与旧日支配者，正在等待新的信徒。" },
	{ id: "ie", name: "沉浸工程",   symbol: "沉", resource: "钢锭",       color: "#8c9a9e", image: "img/mega_04.png",        arch: "industry", intro: "高压电线塔穿过麦田，电弧炉喷出蓝白色火焰。沉浸工程把工业做成了风景。" },
	{ id: "tc", name: "匠魂",       symbol: "匠", resource: "钴锭",       color: "#4f9bd9", image: "img/mega_05.png",        arch: "gather",   intro: "熔炉里的钴蓝液体流进模具。一把真正属于自己的工具，从选择部件开始。" },
	{ id: "fo", name: "林业",       symbol: "林", resource: "蜂王浆",     color: "#d9b44a", image: "img/mega_06.png",        arch: "gather",   intro: "蜂箱在果园里嗡嗡作响。培育蜂王、杂交树苗，林业把耐心变成产量。" },
	{ id: "te", name: "热力膨胀",   symbol: "热", resource: "红石通量",   color: "#d94f3d", image: "img/mega_07.png",        arch: "tech",     intro: "红石通量在导管里奔流。机器升级、自动输出与能量网络，让基地开始自己运转。" },
	{ id: "ei", name: "末影接口",   symbol: "末", resource: "脉冲合金",   color: "#3f8f7a", image: "img/mega_08.png",        arch: "tech",     intro: "末影接口把机器、管道和存储缝在一起。脉冲合金让每一台设备都能互相说话。" },
	{ id: "me", name: "超能物质",   symbol: "超", resource: "反物质",     color: "#c04fd9", image: "img/mega_09.png",        arch: "industry", intro: "反物质在磁约束中安静地悬浮。超能物质把能量密度推到物理学的边缘。" },
	{ id: "nc", name: "核科技",     symbol: "核", resource: "铀燃料",     color: "#7fbf3f", image: "img/mega_10.png",        arch: "industry", intro: "反应堆控制棒缓缓升起，热量在蒸汽中变成电力。核科技从不温柔。" },
	{ id: "br", name: "反应堆",     symbol: "堆", resource: "黄铀锭",     color: "#bfa53f", image: "img/mega_11.png",        arch: "industry", intro: "黄铀锭在反应堆里发出幽幽的光。规模、冷却与效率，是一道永远解不完的方程。" },
	{ id: "ma", name: "神秘农业",   symbol: "农", resource: "精华",       color: "#7fd94f", image: "img/mega_12.png",        arch: "gather",   intro: "把矿物种进耕地，收获一整片资源田。神秘农业让农场成为真正的矿脉。" },
	{ id: "bm", name: "血魔法",     symbol: "血", resource: "生命源质",   color: "#a32424", image: "img/mega_13.png",        arch: "magic",    intro: "生命源质在血祭坛中旋转。以血为代价，换取超越常理的力量。" },
	{ id: "wi", name: "巫术",       symbol: "巫", resource: "咒术粉尘",   color: "#6b4fa3", image: "img/mega_14.png",        arch: "magic",    intro: "坩埚里冒着绿烟，咒术粉尘在月光下闪烁。巫术从不解释，只给结果。" },
	{ id: "an", name: "新生魔艺",   symbol: "源", resource: "源质",       color: "#4fa3d9", image: "img/mega_15.png",        arch: "magic",    intro: "源质从世界树根须间渗出。法术书自动翻页，魔艺正在学习如何自我书写。" },
	{ id: "at", name: "天境",       symbol: "天", resource: "神能",       color: "#d9d94f", image: "img/mega_16.png",        arch: "explore",  intro: "云层之上，天境群岛漂浮在光里。神能让坠落变成飞行，让传说变成地图。" },
	{ id: "et", name: "环境科技",   symbol: "环", resource: "纳米蜂群",   color: "#4fd9bf", image: "img/mega_17.png",        arch: "tech",     intro: "纳米蜂群在太阳能阵列上空盘旋。环境科技把整颗星球当成一台可升级的机器。" },
	{ id: "sd", name: "实用存储",   symbol: "储", resource: "存储升级",   color: "#bf8f4f", image: "img/mega_18.png",        arch: "tech",     intro: "抽屉墙一眼望不到头。存储升级让每一格空间都变成无限仓库。" },
	{ id: "rc", name: "铁路",       symbol: "铁", resource: "强化铁轨",   color: "#9a9a9a", image: "img/mega_19.png",        arch: "industry", intro: "矿车在强化铁轨上呼啸而过。信号灯、编组站与自动化线路，让物流有了节奏。" },
	{ id: "ig", name: "无尽贪婪",   symbol: "贪", resource: "无尽催化剂", color: "#d94f9a", image: "img/mega_20.png",        arch: "magic",    intro: "无尽催化剂在奇点中缓慢成形。它不满足于一个世界，它要所有世界。" },
	{ id: "cr", name: "创造模式",   symbol: "创", resource: "创造能量",   color: "#ff4fa3", image: "img/creative_core.png",  arch: "explore",  intro: "当所有模组都被压缩进同一个存档，创造模式终于露出真容。这里没有终点，只有没有尽头的收益递减。" },
]

const MODPACK = MOD_THEMES.map((theme, i) => ({
	...theme,
	symbol: theme.name,
	short: theme.symbol,
	index: i,
	row: 6 + i,
	displayRow: 6 + Math.floor(i / 3),
	position: i % 3,
	prev: i === 0 ? "e" : MOD_THEMES[i - 1].id,
	baseResource: i === 0 ? "末影珍珠" : MOD_THEMES[i - 1].resource,
	requires: 128 * Math.pow(1.42, i),
	req: 128 * Math.pow(1.42, i) * DIFFICULTY.toNumber(),
	exponent: Math.max(0.22, 0.44 - i * 0.007),
	effectExp: Math.max(0.3, 0.62 - i * 0.01),
	arch: ARCHETYPES[theme.arch],
	mech: ARCH_MECH[theme.arch],
	mech2: MP_UNIQUE_MECHS[theme.id] ||
		MP_TEMPLATE_MECHS[MP_TEMPLATE_ORDER[(i - 6) % MP_TEMPLATE_ORDER.length]],
	mechV: i >= 6 ? Math.floor((i - 6) / MP_TEMPLATE_ORDER.length) : 0,
	trait: TRAITS[THEME_TRAITS[theme.id]],
	sig: THEME_SIGS[theme.id],
}))

MODPACK.forEach((cfg, i) => {
	cfg.next = MODPACK[i + 1] ? MODPACK[i + 1].id : null
})

function mpBuy(cfg, id) {
	if (!player[cfg.id] || !player[cfg.id].buyables) return new Decimal(0)
	return player[cfg.id].buyables[id] || new Decimal(0)
}

function mpSoftcap(cfg) {
	let base = cfg.req * cfg.arch.soft
	if (hasUpgrade(cfg.id, 23)) base *= 1.5
	if (hasMilestone(cfg.id, 2)) base *= 2
	base *= 1 + 0.15 * mpBuy(cfg, 13).toNumber()
	base *= mpTraitMult(cfg, "soft")
	base *= mpCoreMult(cfg, "soft")
	base *= mpMech2Mods(cfg).softcap
	if (hasMilestone(cfg.id, 8) && cfg.trait.core === "soft") base *= 1.2
	if (cfg.mech.key === "tech") base *= 1 + 0.1 * mpBuy(cfg, 16).toNumber()
	if (cfg.mech.key === "explore" && player[cfg.id].route === 1) {
		base *= 1 + 0.25 * (hasMilestone(cfg.id, 5) ? 1.5 : 1)
	}
	if (mpActiveChallenge(cfg) === "soft") base *= 0.5
	if (challengeCompletions(cfg.id, 12) > 0) base *= 1.25
	if (typeof rebirthSoftcapMult === "function") base *= rebirthSoftcapMult()
	return new Decimal(base)
}

// 首通施工：投入上一层资源推进进度，投入满额后声望拿满收益
const MP_BUILD_RATIO = 1
const MP_BUILD_STEP = 0.25
const MP_BUILD_GAIN_FLOOR = 0.3

function mpBuildNeed(cfg) {
	let need = new Decimal(cfg.req).times(MP_BUILD_RATIO)
		.times(cfg.arch.time)
		.times(mpTraitMult(cfg, "wall"))
		.times(mpCoreMult(cfg, "wall"))
	if (hasUpgrade(cfg.id, 25)) need = need.times(0.8)
	if (cfg.mech.key === "explore") {
		if (player[cfg.id].route === 0) need = need.times(1 - 0.4 * (hasMilestone(cfg.id, 5) ? 1.5 : 1))
		else if (player[cfg.id].route === 2) need = need.times(1.4)
	}
	if (hasMilestone(cfg.id, 8) && cfg.trait.core === "wall") need = need.times(0.95)
	need = need.times(mpMech2Mods(cfg).wall)
	const reduction = Math.min(0.5, mpBuy(cfg, 14).toNumber() * 0.04)
	need = need.times(1 - reduction)
	// 转生后本轮施工重做，首通过的层按熟路减半
	if (typeof rebirthWallPending === "function" && rebirthWallPending(cfg.id)) need = need.times(rebirthWallMult())
	return need.max(1)
}

function mpBuildSpent(cfg) {
	const data = player[cfg.id]
	const spent = data && data.construct instanceof Decimal ? data.construct : new Decimal((data && data.construct) || 0)
	return spent.max(0)
}

function mpBuildRemain(cfg) {
	return mpBuildNeed(cfg).sub(mpBuildSpent(cfg)).max(0)
}

// 进度 0–1：首通且本轮已完成施工视为完成；转生后本轮重新施工
function mpBuildProgress(cfg) {
	const data = player[cfg.id]
	const pending = typeof rebirthWallPending === "function" && rebirthWallPending(cfg.id)
	if (data.prestiged && !pending) return 1
	const need = mpBuildNeed(cfg)
	// Decimal 相除可能得到 0.9999999999999999，满额要按比较判定，避免永远差最后一点
	if (mpBuildSpent(cfg).gte(need)) return 1
	return Math.max(0, Math.min(1, mpBuildSpent(cfg).div(need).toNumber()))
}

// 施工未满时提前声望按 30% → 100% 折算
function mpBuildGainMult(cfg) {
	return Math.min(1, MP_BUILD_GAIN_FLOOR + (1 - MP_BUILD_GAIN_FLOOR) * mpBuildProgress(cfg))
}

function mpBuildDone(cfg) {
	return mpBuildProgress(cfg) >= 1
}

// 实际入账的声望收益：施工未满时按进度折算，满额至少 1 时保底 1
function mpBuildGain(cfg) {
	const full = tmp[cfg.id].resetGain
	// 首次 updateTemp 的函数预处理阶段 resetGain 还是占位对象，先原样返回
	if (!full || typeof full.times !== "function") return full
	let gain = full.times(mpBuildGainMult(cfg)).floor()
	if (full.gte(1)) gain = gain.max(1)
	return gain
}

// 本次投入：按 25% 一段，最后一段补足剩余；材料来自上一层资源
function mpBuildStepCost(cfg) {
	const remain = mpBuildRemain(cfg)
	if (remain.lte(0)) return new Decimal(0)
	return remain.min(mpBuildNeed(cfg).times(MP_BUILD_STEP))
}

function mpBuildInvest(cfg, amount) {
	if (!amount || amount.lte(0)) return false
	if (player[cfg.prev].points.lt(amount)) return false
	player[cfg.prev].points = player[cfg.prev].points.sub(amount)
	Vue.set(player[cfg.id], "construct", mpBuildSpent(cfg).add(amount))
	return true
}

// 施工券直接把本轮施工补满
function mpBuildComplete(cfg) {
	Vue.set(player[cfg.id], "construct", mpBuildNeed(cfg))
}

function mpUpgradeCost(cfg, factor) {
	return new Decimal(cfg.req).times(factor).times(cfg.arch.cost).times(mpTraitMult(cfg, "upgrade")).ceil()
}

function mpFacilityCost(cfg, base, ratio, x) {
	return Decimal.pow(ratio, x).times(base).times(mpTraitMult(cfg, "facility")).floor()
}

function mpMsReq(cfg, factor) {
	return cfg.req * factor * mpTraitMult(cfg, "ms")
}

// 6 号里程碑把主题特性翻倍
function mpTraitBoost(cfg) {
	// 层配置在 player 初始化前就会构建，这里必须容错
	let data = (typeof player !== "undefined" && player) ? player[cfg.id] : null
	if (!data || !data.milestones) return 1
	return data.milestones.includes(6) || data.milestones.includes("6") ? 2 : 1
}

function mpTraitMult(cfg, key) {
	if (cfg.trait[key] === undefined) return 1
	if (mpActiveChallenge(cfg) === "trait") return 1
	return Math.pow(cfg.trait[key], mpTraitBoost(cfg))
}

// 全局产量特性是加法加成，6 号里程碑线性翻倍；失谐挑战期间失效
function mpTraitGlobal(cfg) {
	if (cfg.trait.global === undefined) return 0
	if (mpActiveChallenge(cfg) === "trait") return 0
	return cfg.trait.global * mpTraitBoost(cfg)
}

function mpTraitDesc(cfg) {
	const keys = ["gain", "soft", "wall", "facility", "upgrade", "ms", "passive", "global"]
	const key = keys.find(k => cfg.trait[k] !== undefined)
	if (!key) return cfg.trait.desc
	const value = mpTraitMult(cfg, key)
	if (key === "global") return "全局产量 +" + format(mpTraitGlobal(cfg) * 100) + "%"
	const names = {
		gain: "本层产量", soft: "软上限", wall: "施工需求",
		facility: "设施造价", upgrade: "升级造价", ms: "里程碑需求", passive: "自动产出",
	}
	return names[key] + " ×" + format(value)
}

// 18 号主题核心：效果跟随主题特性
function mpCore(cfg) {
	return mpBuy(cfg, 18).min(10)
}

function mpCoreMult(cfg, type) {
	if (cfg.trait.core !== type) return 1
	if (mpActiveChallenge(cfg) === "core") return 1
	let lv = mpCore(cfg).toNumber()
	if (type === "wall") return Math.pow(0.985, lv)
	return Math.pow(type === "soft" ? 1.06 : 1.08, lv)
}

function mpCoreGlobal(cfg) {
	if (cfg.trait.core !== "global") return 0
	if (mpActiveChallenge(cfg) === "core") return 0
	let out = 0.005 * mpCore(cfg).toNumber()
	// 全局乘区可能在 tmp 构建完成前调用，这里直接读存档
	const data = (typeof player !== "undefined" && player) ? player[cfg.id] : null
	if (data && data.milestones && (data.milestones.includes(8) || data.milestones.includes("8"))) out += 0.02
	return out
}

// 挑战从零开始：进入时存档当前点数，退出或完成时取较大值恢复
function mpChallengeStart(cfg) {
	let d = player[cfg.id]
	d.chSavedPoints = d.points
	d.chSavedBest = d.best
	d.points = new Decimal(0)
	d.best = new Decimal(0)
	d.resetTime = 0
}

function mpChallengeEnd(cfg) {
	let d = player[cfg.id]
	if (d.chSavedPoints) d.points = d.points.max(d.chSavedPoints)
	if (d.chSavedBest) d.best = d.best.max(d.chSavedBest)
	d.chSavedPoints = new Decimal(0)
	d.chSavedBest = new Decimal(0)
}

function addModLayer(cfg) {
	const id = cfg.id
	const names = cfg.arch.names
	const buys = cfg.arch.buys
	const upgradeIds = [11, 12, 13, 14, 15, 21, 22, 23, 24, 25]
	const costs = [0.002, 0.004, 0.008, 0.015, 0.03, 0.05, 0.09, 0.14, 0.22, 0.34]

	const upgrades = {}
	for (let j = 0; j < 10; j++) {
		const uid = upgradeIds[j]
		upgrades[uid] = {
			title: cfg.short + "·" + (j === 4 ? cfg.sig.name : names[(j + cfg.index) % names.length]),
			description: [
				cfg.resource + "产量 ×" + cfg.arch.upg2 + "。",
				"解锁「" + buys[0] + "」，购买设施后开始自动产出" + cfg.resource + "。",
				cfg.resource + "产量 ×" + cfg.arch.upg3 + "。",
				"生产设施产出 ×1.5。",
				cfg.sig.text + "<br>" + cfg.resource + "产量 ×" + cfg.sig.mult + "。",
				"全局产量 +10%。",
				"解锁「" + buys[1] + "」，每级使声望收益 ×" + cfg.arch.gain + "。",
				"软上限 ×1.5。",
				"本层产量 ×1.5，解锁「" + buys[2] + "」。",
				"施工需求 -20%，解锁「" + buys[3] + "」。",
			][j],
			cost() { return mpUpgradeCost(cfg, costs[j]) },
			unlocked() { return j === 0 || hasUpgrade(id, upgradeIds[j - 1]) },
		}
	}

	const buyableData = {
		11: {
			title: cfg.short + "·" + buys[0],
			cost(x) { return mpFacilityCost(cfg, cfg.req * 0.01, 1.8, x) },
			effect(x) { return x.times(cfg.arch.passive) },
			display() {
				let amount = getBuyableAmount(this.layer, this.id)
				let data = tmp[this.layer].buyables[this.id]
				return "等级 " + formatWhole(amount) +
					"<br>成本：" + format(data.cost) + " " + cfg.resource +
					"<br>自动产出 +" + format(tmp[this.layer].passiveGeneration.times(tmp[this.layer].resetGain)) + "/秒"
			},
			unlocked() { return hasUpgrade(id, 12) },
			canAfford() { return player[id].points.gte(tmp[id].buyables[11].cost) },
			buy() {
				let cost = tmp[this.layer].buyables[this.id].cost
				player[this.layer].points = player[this.layer].points.sub(cost)
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			style: { "height": "190px", "width": "230px" },
		},
		12: {
			title: cfg.short + "·" + buys[1],
			cost(x) { return mpFacilityCost(cfg, cfg.req * 0.02, 1.9, x) },
			effect(x) { return Decimal.pow(cfg.arch.gain, x.min(20)) },
			display() {
				let amount = getBuyableAmount(this.layer, this.id)
				let data = tmp[this.layer].buyables[this.id]
				return "等级 " + formatWhole(amount) + (amount.gte(20) ? "（已满级）" : " / 20") +
					"<br>成本：" + format(data.cost) + " " + cfg.resource +
					"<br>声望收益 ×" + format(this.effect())
			},
			unlocked() { return hasUpgrade(id, 22) },
			canAfford() {
				return getBuyableAmount(this.layer, this.id).lt(20) &&
					player[id].points.gte(tmp[id].buyables[12].cost)
			},
			buy() {
				let cost = tmp[this.layer].buyables[this.id].cost
				player[this.layer].points = player[this.layer].points.sub(cost)
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			style: { "height": "190px", "width": "230px" },
		},
		13: {
			title: cfg.short + "·" + buys[2],
			cost(x) { return mpFacilityCost(cfg, cfg.req * 0.03, 2.0, x) },
			effect(x) { return x.times(0.15) },
			display() {
				let amount = getBuyableAmount(this.layer, this.id)
				let data = tmp[this.layer].buyables[this.id]
				return "等级 " + formatWhole(amount) +
					"<br>成本：" + format(data.cost) + " " + cfg.resource +
					"<br>软上限 +" + format(this.effect().times(100)) + "%"
			},
			unlocked() { return hasUpgrade(id, 24) },
			canAfford() { return player[id].points.gte(tmp[id].buyables[13].cost) },
			buy() {
				let cost = tmp[this.layer].buyables[this.id].cost
				player[this.layer].points = player[this.layer].points.sub(cost)
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			style: { "height": "190px", "width": "230px" },
		},
		15: {
			title: cfg.short + "·算力研究",
			cost(x) { return new Decimal(x).add(1) },
			display() {
				let amount = getBuyableAmount(this.layer, this.id)
				let data = tmp[this.layer].buyables[this.id]
				return "等级 " + formatWhole(amount) + " / 5" +
					"<br>成本：" + formatWhole(data.cost) + " 研究点" +
					"<br>研究点：" + formatWhole(player[id].research) +
					"<br>声望收益 +" + format(amount.times(10)) + "%"
			},
			unlocked() { return cfg.mech.key === "tech" },
			// 研究点需要手动分配，商店自动化不代买
			autobuy: false,
			canAfford() {
				return getBuyableAmount(this.layer, this.id).lt(5) &&
					player[id].research.gte(tmp[id].buyables[this.id].cost)
			},
			buy() {
				let cost = tmp[this.layer].buyables[this.id].cost
				player[this.layer].research = player[this.layer].research.sub(cost)
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			style: { "height": "190px", "width": "230px" },
		},
		16: {
			title: cfg.short + "·存储研究",
			cost(x) { return new Decimal(x).add(1) },
			display() {
				let amount = getBuyableAmount(this.layer, this.id)
				let data = tmp[this.layer].buyables[this.id]
				return "等级 " + formatWhole(amount) + " / 5" +
					"<br>成本：" + formatWhole(data.cost) + " 研究点" +
					"<br>研究点：" + formatWhole(player[id].research) +
					"<br>软上限 +" + format(amount.times(10)) + "%"
			},
			unlocked() { return cfg.mech.key === "tech" },
			// 研究点需要手动分配，商店自动化不代买
			autobuy: false,
			canAfford() {
				return getBuyableAmount(this.layer, this.id).lt(5) &&
					player[id].research.gte(tmp[id].buyables[this.id].cost)
			},
			buy() {
				let cost = tmp[this.layer].buyables[this.id].cost
				player[this.layer].research = player[this.layer].research.sub(cost)
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			style: { "height": "190px", "width": "230px" },
		},
		17: {
			title: cfg.short + "·散热研究",
			cost(x) { return new Decimal(x).add(1) },
			display() {
				let amount = getBuyableAmount(this.layer, this.id)
				let data = tmp[this.layer].buyables[this.id]
				return "等级 " + formatWhole(amount) + " / 5" +
					"<br>成本：" + formatWhole(data.cost) + " 研究点" +
					"<br>研究点：" + formatWhole(player[id].research) +
					"<br>自动产出 +" + format(amount.times(15)) + "%"
			},
			unlocked() { return cfg.mech.key === "tech" },
			// 研究点需要手动分配，商店自动化不代买
			autobuy: false,
			canAfford() {
				return getBuyableAmount(this.layer, this.id).lt(5) &&
					player[id].research.gte(tmp[id].buyables[this.id].cost)
			},
			buy() {
				let cost = tmp[this.layer].buyables[this.id].cost
				player[this.layer].research = player[this.layer].research.sub(cost)
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			style: { "height": "190px", "width": "230px" },
		},
		14: {
			title: cfg.short + "·" + buys[3],
			cost(x) { return mpFacilityCost(cfg, cfg.req * 0.04, 2.1, x) },
			effect(x) { return x.times(0.04) },
			display() {
				let amount = getBuyableAmount(this.layer, this.id)
				let data = tmp[this.layer].buyables[this.id]
				return "等级 " + formatWhole(amount) + (amount.gte(13) ? "（已满级）" : " / 13") +
					"<br>成本：" + format(data.cost) + " " + cfg.resource +
					"<br>施工需求 -" + format(this.effect().min(0.5).times(100)) + "%"
			},
			unlocked() { return hasUpgrade(id, 25) },
			canAfford() {
				return getBuyableAmount(this.layer, this.id).lt(13) &&
					player[id].points.gte(tmp[id].buyables[14].cost)
			},
			buy() {
				let cost = tmp[this.layer].buyables[this.id].cost
				player[this.layer].points = player[this.layer].points.sub(cost)
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			style: { "height": "190px", "width": "230px" },
		},
		18: {
			title: cfg.short + "·" + CORE_NAMES[cfg.mech.key],
			cost(x) { return mpFacilityCost(cfg, cfg.req * 0.05, 2.2, x) },
			effect(x) { return x },
			display() {
				let amount = getBuyableAmount(this.layer, this.id)
				let data = tmp[this.layer].buyables[this.id]
				let effectText = ""
				if (cfg.trait.core === "gain") effectText = "本层产量 ×" + format(Decimal.pow(1.08, amount))
				else if (cfg.trait.core === "soft") effectText = "软上限 ×" + format(Decimal.pow(1.06, amount))
				else if (cfg.trait.core === "wall") effectText = "施工需求 ×" + format(Decimal.pow(0.985, amount))
				else if (cfg.trait.core === "passive") effectText = "自动产出 ×" + format(Decimal.pow(1.08, amount))
				else effectText = "全局产量 +" + format(amount.times(0.5)) + "%"
				return "等级 " + formatWhole(amount) + (amount.gte(10) ? "（已满级）" : " / 10") +
					"<br>成本：" + format(data.cost) + " " + cfg.resource +
					"<br>" + effectText
			},
			unlocked() { return hasMilestone(id, 4) },
			canAfford() {
				return getBuyableAmount(this.layer, this.id).lt(10) &&
					player[id].points.gte(tmp[id].buyables[this.id].cost)
			},
			buy() {
				let cost = tmp[this.layer].buyables[this.id].cost
				player[this.layer].points = player[this.layer].points.sub(cost)
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
			},
			style: { "height": "190px", "width": "230px" },
		},
	}

	// 每层三个挑战：条件按层轮换，进入后从零累积，完成奖励固定
	const challengeData = {}
	for (let slot = 11; slot <= 13; slot++) {
		const key = mpChallengeKey(cfg, slot)
		const rule = MP_CHALLENGES[key]
		challengeData[slot] = {
			name: cfg.symbol + "·" + rule.name,
			challengeDescription() {
				return rule.rule + "。<br>当前：" + format(player[id].points) + " / " +
					format(mpChallengeGoal(cfg, slot))
			},
			goalDescription() { return format(mpChallengeGoal(cfg, slot)) + " " + cfg.resource },
			rewardDescription: [cfg.resource + "产量 ×1.5", "软上限 ×1.25", "自动产出 ×1.5"][slot - 11],
			unlocked() {
				if (slot > 11 && challengeCompletions(id, slot - 1) < 1) return false
				if (key === "sig" && !hasUpgrade(id, 15)) return false
				if (key === "core" && !hasMilestone(id, 4)) return false
				return true
			},
			canComplete() { return player[id].points.gte(mpChallengeGoal(cfg, slot)) },
			canEnter() { return challengeCompletions(id, slot) < 1 },
			onEnter() { mpChallengeStart(cfg) },
			onExit() { mpChallengeEnd(cfg) },
			style: { "height": "220px", "width": "220px" },
		}
	}

	// 魔法与探索的机制操作入口
	const clickableData = {}
	if (cfg.mech.key === "magic") {
		clickableData[11] = {
			title: cfg.short + "·咒语",
			display() {
				let now = Date.now()
				if (now < player[id].spellUntil)
					return "咒语生效：声望收益 ×5<br>剩余 " + Math.ceil((player[id].spellUntil - now) / 1000) + " 秒"
				if (now < player[id].spellReadyAt)
					return "冷却中<br>还需 " + Math.ceil((player[id].spellReadyAt - now) / 1000) + " 秒"
				return "点击施放：消耗 10% 资源<br>60 秒内声望收益 ×5"
			},
			canClick() { return Date.now() >= player[id].spellReadyAt && player[id].points.gt(0) },
			onClick() {
				let now = Date.now()
				if (now < player[id].spellReadyAt) return
				player[id].points = player[id].points.times(0.9)
				player[id].spellUntil = now + 60000
				player[id].spellReadyAt = now + (hasMilestone(id, 5) ? 360000 : 480000)
			},
			style: { "height": "120px", "width": "260px" },
		}
	}
	if (cfg.mech.key === "explore") {
		clickableData[11] = {
			title: cfg.short + "·远征路线",
			display() {
				let boost = hasMilestone(id, 5)
				let routes = [
					{ name: "快", desc: "施工需求 ×" + (boost ? "0.4" : "0.6") + "，声望收益 ×0.8" },
					{ name: "稳", desc: "软上限 ×" + (boost ? "1.375" : "1.25") },
					{ name: "丰", desc: "施工需求 ×1.4，声望收益 ×" + (boost ? "1.45" : "1.3") },
				]
				let r = routes[player[id].route] || routes[0]
				return "当前：" + r.name + " — " + r.desc + "<br>点击切换路线"
			},
			canClick() { return true },
			onClick() { player[id].route = (player[id].route + 1) % 3 },
			style: { "height": "110px", "width": "300px" },
		}
	}

	// 层机制的操作入口（原型咒语/路线占用 11，施工投入占用 12，施工券占用 14）
	if (cfg.mech2 && cfg.mech2.click) clickableData[13] = cfg.mech2.click(cfg)

	// 首通与转生后的本轮施工：用上一层资源投入材料，施工券可直接补满
	clickableData[12] = {
		title: cfg.short + "·投入材料",
		display() {
			let prevRes = layers[cfg.prev] ? layers[cfg.prev].resource : cfg.prev
			let need = mpBuildNeed(cfg)
			let spent = mpBuildSpent(cfg)
			let step = mpBuildStepCost(cfg)
			let pct = Math.round(mpBuildProgress(cfg) * 100)
			let lines = ["施工进度 " + pct + "% · 已投入 " + format(spent) + " / " + format(need) + " " + prevRes]
			if (mpBuildDone(cfg)) {
				lines.push("本轮施工已完成，声望拿满额收益")
				return lines.join("<br>")
			}
			if (typeof rebirthWallPending === "function" && rebirthWallPending(id)) {
				lines.push("本轮转生施工，需求减半")
			}
			lines.push("点击投入 " + format(step) + " " + prevRes + "（现有 " + format(player[cfg.prev].points) + "）")
			lines.push("声望仍需 " + format(dReq(cfg.requires)) + " " + prevRes + "；材料从这份资源里扣")
			return lines.join("<br>")
		},
		unlocked() {
			return !player[id].prestiged ||
				(typeof rebirthWallPending === "function" && rebirthWallPending(id))
		},
		canClick() {
			return !mpBuildDone(cfg) && player[cfg.prev].points.gte(mpBuildStepCost(cfg))
		},
		onClick() {
			if (mpBuildDone(cfg)) return
			if (!mpBuildInvest(cfg, mpBuildStepCost(cfg))) return
			updateTemp()
			needCanvasUpdate = true
		},
		style: { "min-height": "190px", "height": "auto", "width": "330px" },
	}

	// 施工券：免材料直接补满本轮施工，有券时才出现
	clickableData[14] = {
		title: cfg.short + "·施工券",
		display() {
			let pct = Math.round(mpBuildProgress(cfg) * 100)
			return "施工进度 " + pct + "%<br>消耗施工券 ×1（现有 " + wallSkipLeft() + " 张）<br>直接补满本轮施工，不扣材料"
		},
		unlocked() {
			return wallSkipLeft() > 0 && !mpBuildDone(cfg) &&
				(!player[id].prestiged ||
					(typeof rebirthWallPending === "function" && rebirthWallPending(id)))
		},
		canClick() { return wallSkipLeft() > 0 && !mpBuildDone(cfg) },
		onClick() {
			if (mpBuildDone(cfg) || wallSkipLeft() <= 0) return
			player.a.wallSkipUsed = (player.a.wallSkipUsed || 0) + 1
			mpBuildComplete(cfg)
			updateTemp()
			needCanvasUpdate = true
		},
		style: { "min-height": "150px", "height": "auto", "width": "260px" },
	}

	const mechStatus = function() {
		const lines = []
		if (cfg.mech.key === "gather") {
			let t = mpBuildProgress(cfg)
			lines.push("当前连续加成：×" + format(1 + (hasMilestone(id, 5) ? 3 : 2) * t))
		}
		if (cfg.mech.key === "tech") {
			lines.push("研究点：" + formatWhole(player[id].research) +
				" · 算力 " + formatWhole(mpBuy(cfg, 15)) + "/5" +
				" · 存储 " + formatWhole(mpBuy(cfg, 16)) + "/5" +
				" · 散热 " + formatWhole(mpBuy(cfg, 17)) + "/5")
		}
		if (cfg.mech.key === "magic") {
			const now = Date.now()
			if (now < player[id].spellUntil) lines.push("咒语生效中：剩余 " + Math.ceil((player[id].spellUntil - now) / 1000) + " 秒")
			else if (now < player[id].spellReadyAt) lines.push("咒语冷却中：还需 " + Math.ceil((player[id].spellReadyAt - now) / 1000) + " 秒")
			else lines.push("咒语可施放：点击下方咒语卡")
		}
		if (cfg.mech.key === "industry") {
			let industryBoost = hasMilestone(id, 5) ? 1.5 : 1
			let gainB = 0.01 * industryBoost * mpBuy(cfg, 11).add(mpBuy(cfg, 13)).toNumber()
			let passB = 0.02 * industryBoost * mpBuy(cfg, 12).toNumber()
			lines.push("设施联动：声望 +" + format(gainB * 100) + "%，自动 +" + format(passB * 100) + "%")
		}
		if (cfg.mech.key === "explore") {
			const routes = ["快（材料少、收益低）", "稳（软上限高）", "丰（材料多、收益高）"]
			lines.push("当前路线：" + (routes[player[id].route] || routes[0]) + " · 点击下方路线卡切换")
		}
		return lines
	}

	const ruleCard = function() {
		const cleared = [11, 12, 13].filter(x => challengeCompletions(id, x) > 0).length
		const core = mpBuy(cfg, 18)
		const challengeNames = [11, 12, 13].map(x => mpChallengeRule(cfg, x).name).join(" / ")
		const pendingWall = typeof rebirthWallPending === "function" && rebirthWallPending(id)
		const remainBuild = mpBuildRemain(cfg)
		const lines = [
			"<b style='color:#9adf75'>本层机制 · " + cfg.mech.label + "</b>",
			cfg.mech.desc,
			...mechStatus(),
			"<b style='color:#9adf75'>层机制 · " + mpMechLabel(cfg) + "</b>：" + mpMechDesc(cfg),
			...cfg.mech2.status(cfg),
			"<b style='color:#e8d38a'>主题特性 · " + cfg.trait.label + "</b>：" + mpTraitDesc(cfg) +
				(mpTraitBoost(cfg) > 1 ? "（6 号里程碑已翻倍）" : ""),
			"<b>本层挑战</b>：" + challengeNames + " · 已完成 " + cleared + "/3",
			"<b>主题目标</b>：核心 5 级（" + formatWhole(core.min(5)) + "/5） · " +
				(hasMilestone(id, 9) ? "全部挑战已完成" : "全部挑战 " + cleared + "/3"),
			"<b>首通</b>：" + (player[id].prestiged
				? "<span style='padding:1px 7px; border-radius:999px; background:#3f6f3f; color:#e3f7d6;'>已首通</span> 本层自动化商店已解锁" +
					(pendingWall
						? " · 本轮施工 " + Math.round(mpBuildProgress(cfg) * 100) + "%" +
							(remainBuild.gt(0) ? "，还差 " + format(remainBuild) + " 材料" : "，已完成")
						: " · 本轮施工已完成")
				: "未通过，完成后解锁本层自动化商店"),
		]
		return "<span style='display:block; text-align:left; max-width:560px; margin:6px auto; padding:10px 14px; border:1px solid rgba(255,255,255,0.16); border-radius:10px; background:rgba(0,0,0,0.16); line-height:1.55;'>" +
			lines.join("<br>") + "</span>"
	}

	const tabFormat = [
		["infobox", "intro"],
		"main-display",
		"prestige-button",
		"resource-display",
		["display-text", function() {
			let pending = typeof rebirthWallPending === "function" && rebirthWallPending(id)
			let pct = Math.round(mpBuildProgress(cfg) * 100)
			let text
			if (player[id].prestiged && !pending) text = "施工：首通后不再检查"
			else if (mpBuildDone(cfg)) text = "施工：已完成（收益 100%）"
			else text = "施工：" + pct + "% · 还差 " + format(mpBuildRemain(cfg)) + " 材料 · 收益 " + Math.round(mpBuildGainMult(cfg) * 100) + "%"
			return text + "<br>软上限：" + format(tmp[id].softcap)
		}, {"font-size": "15px", "color": "#cfcfcf"}],
		["display-text", ruleCard, {"font-size": "14px", "color": "#cfd8c3"}],
	]
	tabFormat.push("clickables")
	tabFormat.push("blank", "challenges", "milestones", "buyables", "upgrades")

	addLayer(id, {
		name: cfg.name,
		symbol: cfg.symbol,
		image: cfg.image,
		position: cfg.position,
		row: cfg.row,
		displayRow: cfg.displayRow,
		branches: [[cfg.prev, cfg.color, 10, "elbow"]],

		startData() { return {
			unlocked: false,
			points: new Decimal(0),
			best: new Decimal(0),
			total: new Decimal(0),
			research: new Decimal(0),
			route: 0,
			spellUntil: 0,
			spellReadyAt: 0,
			mechMode: cfg.mech2.default || 0,
			mechOn: false,
			mechAt: cfg.mech2.autoStart ? Date.now() : 0,
			mechCount: 0,
			mechDepth: 0,
			chSavedPoints: new Decimal(0),
			chSavedBest: new Decimal(0),
			construct: new Decimal(0),
			prestiged: false,
			runCleared: false,
		}},

		color: cfg.color,
		resource: cfg.resource,
		baseResource: cfg.baseResource,
		baseAmount() { return player[cfg.prev].points },
		requires: dReq(cfg.requires),
		type: "normal",
		exponent: cfg.exponent,
		softcap() { return mpSoftcap(cfg) },
		softcapPower: 0.5,

		getResetGain() {
			// gainMult/gainExp 由 updateTempData 在本轮 updateTemp 中先算好，直接复用
			let gain = player[cfg.prev].points.div(new Decimal(cfg.requires).times(DIFFICULTY))
				.pow(cfg.exponent)
				.times(tmp[id].gainMult)
				.pow(tmp[id].gainExp)
			let sc = mpSoftcap(cfg)
			if (gain.gte(sc)) gain = gain.pow(0.5).times(sc.pow(0.5))
			// resetGain 同时驱动层内自动产出，保持满额；施工折扣只在声望结算时生效
			return gain.floor().max(0)
		},

		// 施工系数只作用于声望入账，不压低自动产出
		prestigeGainMult() {
			return new Decimal(mpBuildGainMult(cfg))
		},

		gainMult() {
			const challengeKey = mpActiveChallenge(cfg)
			let mult = new Decimal(1)
			if (hasUpgrade(id, 11)) mult = mult.times(cfg.arch.upg2)
			if (hasUpgrade(id, 13)) mult = mult.times(cfg.arch.upg3)
			if (hasUpgrade(id, 15) && challengeKey !== "sig") mult = mult.times(cfg.sig.mult)
			if (hasUpgrade(id, 24)) mult = mult.times(1.5)
			if (hasMilestone(id, 0)) mult = mult.times(1.5)
			if (hasMilestone(id, 3)) mult = mult.times(1.5)
			if (hasMilestone(id, 4)) mult = mult.times(1.5)
			if (hasMilestone(id, 7)) mult = mult.times(2)
			if (hasMilestone(id, 9)) mult = mult.times(1.5)
			mult = mult.times(Decimal.pow(cfg.arch.gain, mpBuy(cfg, 12).min(20)))
			if (cfg.trait.gain) mult = mult.times(mpTraitMult(cfg, "gain"))
			mult = mult.times(mpCoreMult(cfg, "gain"))
			if (hasMilestone(id, 8) && cfg.trait.core === "gain") mult = mult.times(1.25)
			if (challengeCompletions(id, 11) > 0) mult = mult.times(1.5)

			// 原型机制
			if (cfg.mech.key === "tech") mult = mult.times(1 + 0.1 * mpBuy(cfg, 15).toNumber())
			if (cfg.mech.key === "industry") {
				let industryBoost = hasMilestone(id, 5) ? 1.5 : 1
				mult = mult.times(1 + 0.01 * industryBoost * mpBuy(cfg, 11).add(mpBuy(cfg, 13)).toNumber())
			}
			if (cfg.mech.key === "magic" && Date.now() < player[id].spellUntil) mult = mult.times(5)
			if (cfg.mech.key === "explore") {
				if (player[id].route === 0) mult = mult.times(0.8)
				else if (player[id].route === 2) mult = mult.times(1 + 0.3 * (hasMilestone(id, 5) ? 1.5 : 1))
			}
			mult = mult.times(mpMech2Mods(cfg).gain)
			if (challengeKey === "gain") mult = mult.times(0.6)

			mult = mult.times(globalProductionMult())
			if (cfg.next) mult = mult.times(layers[cfg.next].effect())
			return mult
		},
		gainExp() { return new Decimal(1) },

		effect() {
			return player[id].points.add(1).pow(cfg.effectExp)
		},
		effectDescription() {
			return "，每份" + cfg.resource + "让" + cfg.baseResource + "产量 ×" + format(this.effect())
		},

		passiveGeneration() {
			if (!hasUpgrade(id, 12)) return new Decimal(0)
			const challengeKey = mpActiveChallenge(cfg)
			let rate = mpBuy(cfg, 11).times(cfg.arch.passive)
			if (hasUpgrade(id, 14)) rate = rate.times(1.5)
			if (hasMilestone(id, 1)) rate = rate.times(2)
			if (cfg.trait.passive) rate = rate.times(mpTraitMult(cfg, "passive"))
			rate = rate.times(mpCoreMult(cfg, "passive"))
			if (hasMilestone(id, 8) && cfg.trait.core === "passive") rate = rate.times(1.2)
			if (challengeCompletions(id, 13) > 0) rate = rate.times(1.5)

			// 原型机制
			if (cfg.mech.key === "gather") {
				let t = mpBuildProgress(cfg)
				rate = rate.times(1 + (hasMilestone(id, 5) ? 3 : 2) * t)
			}
			if (cfg.mech.key === "industry") {
				let industryBoost = hasMilestone(id, 5) ? 1.5 : 1
				rate = rate.times(1 + 0.02 * industryBoost * mpBuy(cfg, 12).toNumber())
			}
			if (cfg.mech.key === "tech") rate = rate.times(1 + 0.15 * mpBuy(cfg, 17).toNumber())
			rate = rate.times(mpMech2Mods(cfg).passive)
			if (challengeKey === "passive") rate = rate.times(0.25)
			return rate
		},

		canReset() {
			if (!player[cfg.prev].points.gte(dReq(cfg.requires))) return false
			// 首次 updateTemp 的函数预处理阶段 resetGain 还是占位对象，等引擎算完再看收益
			if (!tmp[id].resetGain || typeof tmp[id].resetGain.gte !== "function") return true
			return tmp[id].resetGain.gte(1)
		},

		// 自动声望不做亏本选择：等本轮施工完成再触发
		autoPrestigeReady() {
			return mpBuildDone(cfg)
		},

		prestigeButtonText() {
			const data = player[id]
			const pending = typeof rebirthWallPending === "function" && rebirthWallPending(id)
			const pct = Math.round(mpBuildProgress(cfg) * 100)
			const gainPct = Math.round(mpBuildGainMult(cfg) * 100)
			const remain = mpBuildRemain(cfg)
			const head = "+<b>" + formatWhole(mpBuildGain(cfg)) + "</b> " + cfg.resource
			if (data.prestiged && !pending) return head + "<br><br>首通后不再检查施工，满额收益"
			if (mpBuildDone(cfg)) return head + "<br><br>本轮施工已完成，满额收益"
			return head + "（施工 " + pct + "% · 收益 " + gainPct + "%）<br><br>再投入 <b>" + format(remain) + "</b> 材料拿满额收益"
		},

		infoboxes: {
			intro: {
				title: "模组档案 · " + cfg.name,
				body: cfg.intro + "<br><br><span style='color:#9adf75'>原型：" + cfg.arch.label +
					" · 首通施工：用上一层资源投入材料，投入满额后声望拿满收益；也可以提前声望，按施工进度 30%–100% 折算 · 没有存储上限，超过软上限后收益按平方根递减</span>",
			},
		},

		tabFormat,
		...(Object.keys(clickableData).length ? { clickables: clickableData } : {}),

		milestones: {
			0: {
				requirementDescription() { return formatWhole(mpMsReq(cfg, 0.1)) + " " + cfg.resource },
				effectDescription: cfg.resource + "产量 ×1.5",
				done() { return player[id].best.gte(mpMsReq(cfg, 0.1)) },
			},
			1: {
				requirementDescription() { return formatWhole(mpMsReq(cfg, 0.5)) + " " + cfg.resource },
				effectDescription: "自动设施产出 ×2",
				done() { return player[id].best.gte(mpMsReq(cfg, 0.5)) },
			},
			2: {
				requirementDescription() { return formatWhole(mpMsReq(cfg, 1)) + " " + cfg.resource },
				effectDescription: "软上限 ×2",
				done() { return player[id].best.gte(mpMsReq(cfg, 1)) },
			},
			3: {
				requirementDescription() { return formatWhole(mpMsReq(cfg, 2)) + " " + cfg.resource },
				effectDescription: "本层产量 ×1.5",
				done() { return player[id].best.gte(mpMsReq(cfg, 2)) },
			},
			4: {
				requirementDescription() { return formatWhole(mpMsReq(cfg, 5)) + " " + cfg.resource },
				effectDescription: "本层产量 ×1.5，解锁主题核心",
				done() { return player[id].best.gte(mpMsReq(cfg, 5)) },
			},
			5: {
				requirementDescription() { return formatWhole(mpMsReq(cfg, 10)) + " " + cfg.resource },
				effectDescription() {
					return {
						gather: "连续采掘加成上限 ×4",
						tech: "每次声望研究点 +1",
						magic: "咒语冷却 -2 分钟",
						industry: "设施联动效果 +50%",
						explore: "远征路线效果 +50%",
					}[cfg.mech.key]
				},
				done() { return player[id].best.gte(mpMsReq(cfg, 10)) },
			},
			6: {
				requirementDescription() { return formatWhole(mpMsReq(cfg, 25)) + " " + cfg.resource },
				effectDescription: "主题特性效果 ×2",
				done() { return player[id].best.gte(mpMsReq(cfg, 25)) },
			},
			7: {
				requirementDescription() { return formatWhole(mpMsReq(cfg, 60)) + " " + cfg.resource },
				effectDescription: "本层产量 ×2",
				done() { return player[id].best.gte(mpMsReq(cfg, 60)) },
			},
			8: {
				requirementDescription() { return "主题核心 5 级" },
				effectDescription() {
					return {
						gain: cfg.resource + "产量 ×1.25",
						soft: "软上限 ×1.2",
						wall: "施工需求 -5%",
						passive: "自动产出 ×1.2",
						global: "全局产量 +2%",
					}[cfg.trait.core]
				},
				done() { return mpBuy(cfg, 18).gte(5) },
			},
			9: {
				requirementDescription() { return "完成本层全部挑战" },
				effectDescription: "本层产量 ×1.5",
				done() { return [11, 12, 13].every(x => challengeCompletions(id, x) > 0) },
			},
		},

		buyables: buyableData,
		challenges: challengeData,
		upgrades: upgrades,
		challengeResetsNothing: true,

		doReset(resettingLayer) {
			if (layers[resettingLayer].row > this.row) retainStartKit(this.layer, ["challenges", "prestiged", "mechCount", "runCleared"])
			if (resettingLayer === id) {
				player[id].mechCount = (player[id].mechCount || 0) + 1
				player[id].prestiged = true
				Vue.set(player[id], "runCleared", true)
				if (cfg.mech.key === "tech") {
					// 以「前置资源超出需求的比例」计点，避免拿本层货币和上一层需求直接相除
					let ratio = player[cfg.prev].points.div(cfg.req).sub(1).max(0).min(1)
					player[id].research = player[id].research
						.add(hasMilestone(id, 5) ? 2 : 1)
						.add(ratio.times(5).floor())
				}
				if (cfg.next && !player[cfg.next].unlocked) {
					player[cfg.next].unlocked = true
					player[cfg.next].resetTime = 0
					needCanvasUpdate = true
				}
			}
		},

		onPrestige() {
			if (typeof questCountPrestige === "function") questCountPrestige()
		},

		layerShown() { return true },
		tooltip() {
			let pending = typeof rebirthWallPending === "function" && rebirthWallPending(id)
			let pct = Math.round(mpBuildProgress(cfg) * 100)
			let text
			if (player[id].prestiged && !pending) text = "首通后不再检查施工"
			else if (mpBuildDone(cfg)) text = "施工已完成（收益 100%）"
			else text = "施工 " + pct + "% · 收益 " + Math.round(mpBuildGainMult(cfg) * 100) + "% · 还差 " + format(mpBuildRemain(cfg)) + " 材料"
			return cfg.resource + " ×" + formatWhole(player[id].points) +
				"<br>" + text +
				"<br>软上限 " + format(mpSoftcap(cfg))
		},
		tooltipLocked() {
			return "完成上一阶段的声望后解锁<br>前置资源：" + cfg.baseResource
		},
	})
}

for (const cfg of MODPACK) {
	addModLayer(cfg)
}
