// 模组层的「结构」扩展点
//
// 30 个模组层原先共用一套骨架（10 升级 + 4 设施 + 10 里程碑 + 3 挑战 + 同一套 tabFormat），
// 差异只在参数上。结构（struct）决定这一层怎么玩，参数只决定数字。
//
// 现有结构：
//   - 不写 struct：classic，和其他层一样，买升级 → 升设施 → 施工 → 声望
//   - alloc：配比型，把产能分给三道工序，短板决定产量、成品份额决定声望入账
//   - recipe：配方型，材料随时间攒，三条配方抢同一池材料，各自给不同渠道的永久加成
//   - blueprint：蓝图型，3×3 蓝图逐格点亮，相邻点亮连成线给加成，点亮全图给完成奖励
//   - market：市场型，三种货的价格按正弦波动，低买高卖赚差价，差价折成这一层的永久加成
//   - grid：网格型，4×4 格子上摆模块，相邻模块连成对给加成，摆得越密越赚
//   - rhythm：节奏型，一条循环进度条，在窗口里点中才算一次，累计命中给加成
//
// 加新结构：往 MP_STRUCTS 里加一项，按需实现下面的方法，再在 MOD_THEMES 对应层写 struct: "<key>"
//   startData()          新层的存档字段（老档由 fixSave 的 fixData 自动补上默认值）
//   gainMult(cfg)        本层产量的乘数，默认 1（走 gainMult，与升级/里程碑同一条渠道）
//   passiveMult(cfg)     本层自动产出的乘数，默认 1
//   prestigeMult(cfg)    本层声望入账的乘数，默认 1（只影响结算，不影响自动产出）
//   softcapMult(cfg)     本层软上限的乘数，默认 1
//   buildNeedMult(cfg)   本层施工需求的乘数，默认 1（小于 1 是减免）
//   unlock(cfg, kind)    额外的解锁条件（"buy12" / "buy13" / "core"），默认 false
//   update(cfg, diff)    每帧回调，用来推进结构自己的资源（材料、自动合成等）
//   card(cfg)            层页多出来的一张说明卡（HTML 字符串）
//   clickables(cfg,bag)  往 clickableData 里塞操作按钮

const MP_STRUCTS = {}

// 结构按钮统一套同一套网格（id = 30 + 行 × 10 + 列，行 3–6 / 列 1–4，工厂占用 11–18 即行 1）：
// 工厂自带的 11–18 占第一行，结构按钮从第二行接着往下排，层页里所有格子就都在同一套列线上。
const MP_STRUCT_IDS = {
	alloc:     [31, 32, 41, 42],                      // 2×2：三道工序 + 自动配平
	recipe:    [31, 32, 33, 41, 42],                  // 3+2：三档配方 + 自动合成 + 优先档
	blueprint: [31, 32, 33, 41, 42, 43, 51, 52, 53],  // 3×3：九格
	market:    [31, 32, 33, 41, 42, 43],              // 3+3：三种货各一张买、各一张卖
	grid:      [31, 32, 33, 34, 41, 42, 43, 44,       // 4×4：十六格
		            51, 52, 53, 54, 61, 62, 63, 64],
	rhythm:    [31],                                  // 单击：一条循环条
}

function mpStructDef(cfg) {
	return (cfg && cfg.struct && MP_STRUCTS[cfg.struct]) || null
}

function mpStructStartData(cfg) {
	const s = mpStructDef(cfg)
	return s && s.startData ? s.startData(cfg) : {}
}

function mpStructPassive(cfg) {
	const s = mpStructDef(cfg)
	return s && s.passiveMult ? s.passiveMult(cfg) : 1
}

function mpStructGain(cfg) {
	const s = mpStructDef(cfg)
	return s && s.gainMult ? s.gainMult(cfg) : 1
}

function mpStructSoftcap(cfg) {
	const s = mpStructDef(cfg)
	return s && s.softcapMult ? s.softcapMult(cfg) : 1
}

function mpStructBuildNeed(cfg) {
	const s = mpStructDef(cfg)
	return s && s.buildNeedMult ? s.buildNeedMult(cfg) : 1
}

function mpStructUnlock(cfg, kind) {
	const s = mpStructDef(cfg)
	return !!(s && s.unlock && s.unlock(cfg, kind))
}

function mpStructUpdate(cfg, diff) {
	const s = mpStructDef(cfg)
	if (s && s.update) s.update(cfg, diff)
}

function mpStructPrestige(cfg) {
	const s = mpStructDef(cfg)
	return s && s.prestigeMult ? s.prestigeMult(cfg) : 1
}

function mpStructCard(cfg) {
	const s = mpStructDef(cfg)
	return s && s.card ? s.card(cfg) : ""
}

function mpStructClickables(cfg, bag) {
	const s = mpStructDef(cfg)
	if (s && s.clickables) s.clickables(cfg, bag)
}

// ---------------- 配比型 ----------------
//
// 三道工序，份额加起来 100%。每道能吃下的份额有上限，上限由对应设施的等级抬高。
// 实际通过 = min(份额, 上限)；产量利用率 = 3 × 最小通过份额（均衡 1/3 时正好 100%）。
// 成品份额超过 1/3 的部分折算成声望入账，代价是另外两道变窄、利用率下降。
// 所以均衡 = 产量最高，压成品 = 声望快，中间怎么取是玩家自己的选择。
const MP_ALLOC_STAGES = [
	{ name: "原料", buyable: 11, color: "#9adf75" },
	{ name: "加工", buyable: 13, color: "#e8d38a" },
	{ name: "成品", buyable: 12, color: "#e8a4a4" },
]
const MP_ALLOC_DEFAULT = { gain: 1.5, step: 0.02, capMax: 0.8 }
// 整数百分比凑不出精确的 1/3，接近均衡时这点误差按满产处理
const MP_ALLOC_SNAP = 0.985
// 再怎么偏配也留一点底，免得把两道压到 0 之后本层彻底不产出
const MP_ALLOC_FLOOR = 0.05

function mpAllocTune(cfg) {
	const t = (cfg && cfg.alloc) || {}
	return {
		gain: t.gain === undefined ? MP_ALLOC_DEFAULT.gain : t.gain,
		step: t.step === undefined ? MP_ALLOC_DEFAULT.step : t.step,
		capMax: t.capMax === undefined ? MP_ALLOC_DEFAULT.capMax : t.capMax,
	}
}

// 自动配平返回精确的 1/3；手动份额按整数百分比记账，读的时候再归一化
function mpAllocShares(cfg) {
	const d = player[cfg.id]
	if (d && d.allocMode === 1 && Array.isArray(d.allocShares)) {
		const s = d.allocShares.map(x => Math.max(0, Number(x) || 0))
		const sum = s[0] + s[1] + s[2]
		if (sum > 0) return s.map(x => x * 100 / sum)
	}
	return [100 / 3, 100 / 3, 100 / 3]
}

function mpAllocCaps(cfg) {
	const t = mpAllocTune(cfg)
	return MP_ALLOC_STAGES.map(st =>
		Math.min(t.capMax, 1 / 3 + t.step * mpBuy(cfg, st.buyable).toNumber()))
}

function mpAllocFlow(cfg) {
	const t = mpAllocTune(cfg)
	const shares = mpAllocShares(cfg)                 // 百分比
	const caps = mpAllocCaps(cfg)                     // 份额上限（0–1）
	const passed = shares.map((s, i) => Math.min(s / 100, caps[i]))
	const minPassed = Math.min(passed[0], passed[1], passed[2])
	let util = minPassed * 3
	const balanced = util > MP_ALLOC_SNAP
	if (balanced) util = 1
	if (util < MP_ALLOC_FLOOR) util = MP_ALLOC_FLOOR
	// 均衡时那点取整误差不显示成浪费，否则卡片上会出现「利用率 100% · 浪费 0.7%」的自相矛盾
	const waste = shares.map((s, i) => balanced ? 0 : Math.max(0, s / 100 - caps[i]))
	const gain = 1 + t.gain * Math.max(0, passed[2] - 1 / 3)
	return { shares, caps, passed, waste, util, gain, balanced, bottleneck: passed.indexOf(minPassed) }
}

function mpAllocPct(x) {
	return Math.round(x * 1000) / 10
}

// 把 amount 点份额转给第 idx 道，从另外两道按现有比例扣，再凑成整数 100
function mpAllocShift(cfg, idx, amount) {
	const d = player[cfg.id]
	if (!d) return
	const s = mpAllocShares(cfg).slice()
	s[idx] += amount
	const others = [0, 1, 2].filter(i => i !== idx)
	const rest = s[others[0]] + s[others[1]]
	if (rest > 0) {
		s[others[0]] = Math.max(0, s[others[0]] - amount * s[others[0]] / rest)
		s[others[1]] = Math.max(0, s[others[1]] - amount * s[others[1]] / rest)
	}
	Vue.set(d, "allocMode", 1)
	Vue.set(d, "allocShares", mpAllocNormalize(s))
}

function mpAllocNormalize(s) {
	const a = s.map(x => Math.max(0, Math.round(x)))
	const sum = a[0] + a[1] + a[2]
	if (sum !== 100) {
		let big = 0
		for (let i = 1; i < 3; i++) if (a[i] > a[big]) big = i
		a[big] = Math.max(0, a[big] + 100 - sum)
	}
	return a
}

MP_STRUCTS.alloc = {
	key: "alloc",
	label: "配比",

	startData() {
		return { allocShares: [34, 33, 33], allocMode: 0 }
	},

	passiveMult(cfg) {
		return mpAllocFlow(cfg).util
	},

	prestigeMult(cfg) {
		return mpAllocFlow(cfg).gain
	},

	card(cfg) {
		const t = mpAllocTune(cfg)
		const f = mpAllocFlow(cfg)
		const d = player[cfg.id] || {}
		const auto = d.allocMode !== 1
		const buys = cfg.arch.buys
		const rows = MP_ALLOC_STAGES.map((st, i) => {
			const waste = f.waste[i] > 0.005
				? " · <span style='color:#e88a8a'>浪费 " + mpAllocPct(f.waste[i]) + "%</span>"
				: ""
			return "<span style='color:" + st.color + "'>" + st.name + "</span> " +
				Math.round(f.shares[i]) + "% / 上限 " + mpAllocPct(f.caps[i]) + "%" + waste +
				" <span style='opacity:.6'>（" + buys[(st.buyable === 11 ? 0 : st.buyable === 12 ? 1 : 2)] + "）</span>"
		})
		const bn = MP_ALLOC_STAGES[f.bottleneck]
		const wasted = f.waste.some(w => w > 0.005)
		const hint = wasted
			? "有工序的份额超过了上限，多出来的部分是白扔的 —— 去升它标着的设施，或者把份额挪回来。"
			: (f.util === 1
				? "三道刚好均衡，产量吃满；想换收益就把产能压到成品上，代价是产量下降。"
				: "当前瓶颈：<span style='color:" + bn.color + "'>" + bn.name + "</span> —— 想抬上限就去升它后面标着的设施。")
		const lines = [
			"<b style='color:#9adf75'>结构 · 配比</b> —— 这一层不是「谁贵买谁」，而是分配产能：" +
				"三道工序的短板决定产量，成品份额决定声望入账。",
			"产量利用率 <b>×" + (Math.round(f.util * 1000) / 1000) + "</b>" +
				" · 声望入账 <b>×" + (Math.round(f.gain * 1000) / 1000) + "</b>" +
				" · " + (auto ? "自动配平：开（均衡 33 / 33 / 33）" : "手动配比中"),
			...rows,
			hint,
			"<span style='opacity:.75'>设施每级给对应工序 +" + mpAllocPct(t.step) + "% 上限，封顶 " +
				mpAllocPct(t.capMax) + "%；成品份额每超出 1/3 一档，声望入账 ×(1 + " + t.gain +
				" × 超出量)。均衡产量最高，压成品声望最快，中间自己取。</span>",
		]
		return "<span style='display:block; text-align:left; max-width:560px; margin:6px auto; padding:10px 14px; border:1px solid rgba(255,255,255,0.16); border-radius:10px; background:rgba(0,0,0,0.16); line-height:1.55;'>" +
			lines.join("<br>") + "</span>"
	},

	clickables(cfg, bag) {
		MP_ALLOC_STAGES.forEach((st, i) => {
			bag[MP_STRUCT_IDS.alloc[i]] = {
				title: "配比·" + st.name + " +10%",
				display() {
					const f = mpAllocFlow(cfg)
					return "<span style='color:" + st.color + "'>" + st.name + "</span>：" +
						Math.round(f.shares[i]) + "%" +
						"<br>上限 " + mpAllocPct(f.caps[i]) + "%" +
						"<br><span style='opacity:.7'>点击：从另外两道各挪一点过来</span>"
				},
				unlocked() { return true },
				canClick() { return true },
				onClick() {
					mpAllocShift(cfg, i, 10)
					updateTempAfterAction(cfg.id)
					needCanvasUpdate = true
				},
				style: { "height": "120px", "width": "190px" },
			}
		})
		bag[MP_STRUCT_IDS.alloc[3]] = {
			title: "配比·自动配平",
			display() {
				const d = player[cfg.id] || {}
				if (d.allocMode === 1) return "手动配比<br><span style='opacity:.7'>点击恢复自动配平</span>"
				return "自动配平：开<br><span style='opacity:.7'>点击改为手动分配</span>"
			},
			unlocked() { return true },
			canClick() { return true },
			onClick() {
				const d = player[cfg.id]
				if (!d) return
				if (d.allocMode === 1) {
					Vue.set(d, "allocMode", 0)
					Vue.set(d, "allocShares", [34, 33, 33])
				} else {
					Vue.set(d, "allocMode", 1)
				}
				updateTempAfterAction(cfg.id)
				needCanvasUpdate = true
			},
			style: { "height": "120px", "width": "190px" },
		}
	},
}

// ---------------- 配方型 ----------------
//
// 材料随时间自动攒（每秒速率由生产线等级抬高），三条配方抢同一池材料：
// 每条的成本按「已合成次数」在基础价上线性上涨，合成次数永久叠加、分别 20 / 12 / 8 次封顶。
// 三档都是同一条渠道，每份权重 1 / 2.5 / 6：三档全满共 98 权重，正好把 max 的加成拿满；
// 单份材料效率三档基本齐平（初级 3 份 1 权重、高级 18 份 6 权重），所以「先喂哪条」只影响拿到的节奏。
// role 决定成品加到哪个渠道：
//   gain 产量 / passive 自动产出 / prestige 声望入账 / softcap 软上限 / build 施工需求
//   points 把材料直接炼成本层点数 / unlock 合成到一定次数就解锁设施
const MP_RECIPE_TIERS = [
	{ name: "初级配方", base: 3, cap: 20, w: 1, color: "#9adf75" },
	{ name: "中级配方", base: 8, cap: 12, w: 2.5, color: "#e8d38a" },
	{ name: "高级配方", base: 18, cap: 8, w: 6, color: "#e8a4a4" },
]
const MP_RECIPE_DEFAULT = { role: "gain", name: "材料", rate: 0.6, step: 0.2, costStep: 0.5 }
// 三档全满的权重和 = 20×1 + 12×2.5 + 8×6
const MP_RECIPE_FULL = 98
// 全满时这一层的加成上限（按渠道）；points 是「折算成多少倍需求的本层点数」
const MP_RECIPE_MAX = { gain: 0.40, passive: 0.40, prestige: 0.40, softcap: 0.50, build: 0.35, points: 0.35 }
const MP_RECIPE_ROLE = {
	gain: "本层产量", passive: "自动产出", prestige: "声望入账", softcap: "软上限",
	build: "施工需求", points: "本层点数", unlock: "设施解锁",
}

function mpRecipeTune(cfg) {
	const t = (cfg && cfg.recipe) || {}
	const out = {}
	for (const k in MP_RECIPE_DEFAULT) out[k] = t[k] === undefined ? MP_RECIPE_DEFAULT[k] : t[k]
	const role = t.role || "gain"
	out.role = (MP_RECIPE_MAX[role] !== undefined || role === "points" || role === "unlock") ? role : "gain"
	return out
}

function mpRecipeState(cfg) {
	const d = player[cfg.id]
	return (d && d.recipeCrafts) || [0, 0, 0]
}

function mpRecipeCrafts(cfg) {
	const raw = mpRecipeState(cfg)
	return MP_RECIPE_TIERS.map((t, i) => Math.max(0, Math.min(t.cap, Math.floor(Number(raw[i]) || 0))))
}

function mpRecipeMats(cfg) {
	const d = player[cfg.id]
	return (d && Number(d.recipeMats)) || 0
}

function mpRecipeRate(cfg) {
	const t = mpRecipeTune(cfg)
	return t.rate * (1 + t.step * mpBuy(cfg, 11).toNumber())
}

// 第 i 条配方的下一份成本（材料）
function mpRecipeCost(cfg, i) {
	const t = mpRecipeTune(cfg)
	const tier = MP_RECIPE_TIERS[i]
	return tier.base * (1 + t.costStep * mpRecipeCrafts(cfg)[i])
}

// 三档加起来的总权重（0 → 98）
function mpRecipeWeight(cfg) {
	const c = mpRecipeCrafts(cfg)
	return c[0] * MP_RECIPE_TIERS[0].w + c[1] * MP_RECIPE_TIERS[1].w + c[2] * MP_RECIPE_TIERS[2].w
}

function mpRecipeCarry(cfg) {
	const t = mpRecipeTune(cfg)
	const max = MP_RECIPE_MAX[t.role]
	if (max === undefined) return 0
	return max * mpRecipeWeight(cfg) / MP_RECIPE_FULL
}

function mpRecipePoints(cfg) {
	return new Decimal(cfg.req).times(MP_RECIPE_MAX.points).times(mpRecipeWeight(cfg) / MP_RECIPE_FULL)
}

function mpRecipeEffects(cfg) {
	const t = mpRecipeTune(cfg)
	const carry = mpRecipeCarry(cfg)
	const out = { carry, gain: 1, passive: 1, prestige: 1, softcap: 1, build: 1 }
	if (t.role === "gain") out.gain = 1 + carry
	else if (t.role === "passive") out.passive = 1 + carry
	else if (t.role === "prestige") out.prestige = 1 + carry
	else if (t.role === "softcap") out.softcap = 1 + carry
	else if (t.role === "build") out.build = Math.max(0.5, 1 - carry)
	return out
}

// 合成一份：次数 +1，材料的扣减由调用方处理（自动合成批量时只在最后写一次）
function mpRecipeCraft(cfg, i, pay) {
	const d = player[cfg.id]
	const tier = MP_RECIPE_TIERS[i]
	if (!d || !tier) return false
	const c = mpRecipeCrafts(cfg)
	if (c[i] >= tier.cap) return false
	const cost = mpRecipeCost(cfg, i)
	if (pay !== false) {
		if (mpRecipeMats(cfg) < cost) return false
		Vue.set(d, "recipeMats", mpRecipeMats(cfg) - cost)
	}
	const next = c.slice()
	next[i] = c[i] + 1
	Vue.set(d, "recipeCrafts", next)
	const t = mpRecipeTune(cfg)
	if (t.role === "points") {
		// 转化：材料直接炼成本层点数，全满约 0.35 倍需求
		d.points = new Decimal(d.points).add(new Decimal(cfg.req)
			.times(MP_RECIPE_MAX.points).times(tier.w / MP_RECIPE_FULL))
	}
	return true
}

function mpRecipeAuto(cfg, diff) {
	const d = player[cfg.id]
	if (!d) return
	// 层还没解出来就不攒材料，免得一解锁就白送一堆成品
	if (!d.unlocked && !d.prestiged) return
	const gain = mpRecipeRate(cfg) * diff
	if (gain > 0) Vue.set(d, "recipeMats", Math.min(1e9, mpRecipeMats(cfg) + gain))
	if (Number(d.recipeAuto) !== 1) return
	const t = mpRecipeTune(cfg)
	const focus = Math.floor(Number(d.recipeFocus))
	let mats = mpRecipeMats(cfg)
	const crafts = mpRecipeCrafts(cfg)
	let made = 0
	for (let guard = 0; guard < 60; guard++) {
		const open = [0, 1, 2].filter(i => crafts[i] < MP_RECIPE_TIERS[i].cap)
		if (!open.length) break
		open.sort((a, b) => MP_RECIPE_TIERS[a].base - MP_RECIPE_TIERS[b].base)
		if (focus >= 0 && focus < 3 && open.indexOf(focus) > 0) {
			open.splice(open.indexOf(focus), 1)
			open.unshift(focus)
		}
		const i = open[0]
		const cost = MP_RECIPE_TIERS[i].base * (1 + t.costStep * crafts[i])
		if (mats < cost) break
		mats -= cost
		crafts[i] += 1
		made++
		if (t.role === "points") {
			d.points = new Decimal(d.points).add(new Decimal(cfg.req)
				.times(MP_RECIPE_MAX.points).times(MP_RECIPE_TIERS[i].w / MP_RECIPE_FULL))
		}
	}
	if (!made) return
	Vue.set(d, "recipeMats", mats)
	Vue.set(d, "recipeCrafts", crafts)
}

function mpRecipePct(x) {
	return Math.round(x * 1000) / 10
}

MP_STRUCTS.recipe = {
	startData() { return { recipeMats: 0, recipeCrafts: [0, 0, 0], recipeAuto: 1, recipeFocus: -1 } },
	gainMult(cfg) { return mpRecipeEffects(cfg).gain },
	passiveMult(cfg) { return mpRecipeEffects(cfg).passive },
	prestigeMult(cfg) { return mpRecipeEffects(cfg).prestige },
	softcapMult(cfg) { return mpRecipeEffects(cfg).softcap },
	buildNeedMult(cfg) { return mpRecipeEffects(cfg).build },
	unlock(cfg, kind) {
		const t = mpRecipeTune(cfg)
		if (t.role !== "unlock") return false
		const c = mpRecipeCrafts(cfg)
		if (kind === "buy12") return c[0] >= 4
		if (kind === "buy13") return c[1] >= 4
		if (kind === "core") return c[2] >= 6
		return false
	},
	update(cfg, diff) { mpRecipeAuto(cfg, diff) },
	card(cfg) {
		const t = mpRecipeTune(cfg)
		const c = mpRecipeCrafts(cfg)
		const fx = mpRecipeEffects(cfg)
		const auto = Number((player[cfg.id] || {}).recipeAuto) === 1
		const focus = Math.floor(Number((player[cfg.id] || {}).recipeFocus))
		const focusText = focus >= 0 && focus < 3 ? MP_RECIPE_TIERS[focus].name : "最便宜"
		const rows = MP_RECIPE_TIERS.map((tier, i) => {
			const full = c[i] >= tier.cap
			const cost = full ? "已满" : format(mpRecipeCost(cfg, i)) + " 材料"
			const own = mpRecipeCarryFor(cfg, i)
			const ownText = t.role === "unlock" ? "解锁进度" : mpRecipeEffectText(cfg) + " +" + mpRecipePct(own) + "%"
			return "<span style='color:" + tier.color + "'>" + tier.name + "</span>　" +
				c[i] + " / " + tier.cap + "　<span style='opacity:.8'>下一条 " + cost + "</span>　" + ownText
		})
		let total
		if (t.role === "points") {
			total = "已炼入 " + format(mpRecipePoints(cfg)) + " 点数"
		} else if (t.role === "unlock") {
			total = "初级 " + c[0] + "/4 · 中级 " + c[1] + "/4 · 高级 " + c[2] + "/6"
		} else {
			total = mpRecipeEffectText(cfg) + " ×" + (Math.round((fx[t.role] || 1) * 1000) / 1000) +
				"（满档 ×" + (1 + MP_RECIPE_MAX[t.role]) + "）"
		}
		const hint = t.role === "unlock"
			? "解锁线：初级 4 次开增益设施（12 号）、中级 4 次开上限设施（13 号）、高级 6 次开主题核心（18 号）。"
			: "材料自己攒，三条配方抢同一池 —— 先喂哪条，就先把哪一档的收益拿到手。"
		return "<span style='display:block; text-align:left; max-width:560px; line-height:1.7'>" + [
			"<b style='color:#9adf75'>结构 · 配方</b> —— " + hint,
			"<span style='color:#9adf75'>" + t.name + "</span> <b>" + format(mpRecipeMats(cfg)) + "</b>（+" + (Math.round(mpRecipeRate(cfg) * 100) / 100) +
				"/秒） · 自动合成：" + (auto ? "开" : "关") + " · 优先：" + focusText,
			...rows,
			"合计：<b>" + total + "</b>",
			"<span style='opacity:.75'>每合成一次，下一条的成本在基础价上 +" + mpRecipePct(t.costStep) + "（初级" + MP_RECIPE_TIERS[0].cap + " / 中级" + MP_RECIPE_TIERS[1].cap + " / 高级" + MP_RECIPE_TIERS[2].cap + " 次封顶）；材料速率 = " + t.rate + " ×（1 + 生产线每级 " + mpRecipePct(t.step) + "％）。自动合成按「优先」顺序花材料，手动合成就点下面三张卡。</span>",
		].join("<br>") + "</span>"
	},
	clickables(cfg, bag) {
		MP_RECIPE_TIERS.forEach((tier, i) => {
			bag[MP_STRUCT_IDS.recipe[i]] = {
				title: "配方·" + tier.name,
				display() {
					const c = mpRecipeCrafts(cfg)[i]
					const full = c >= tier.cap
					return tier.name + " " + c + "/" + tier.cap + "<br>" +
						(full ? "已满" : "成本 " + format(mpRecipeCost(cfg, i)) + " " + mpRecipeTune(cfg).name) + "<br>" +
						"<span style='opacity:.7'>" + mpRecipeEffectText(cfg) + " +" + mpRecipePct(mpRecipeCarryFor(cfg, i)) + "%</span>"
				},
				unlocked() { return true },
				canClick() {
					const c = mpRecipeCrafts(cfg)[i]
					return c < tier.cap && mpRecipeMats(cfg) >= mpRecipeCost(cfg, i)
				},
				onClick() {
					if (mpRecipeCraft(cfg, i)) {
						updateTempAfterAction(cfg.id)
						needCanvasUpdate = true
					}
				},
				style: { "height": "150px", "width": "170px" },
			}
		})
		bag[MP_STRUCT_IDS.recipe[3]] = {
			title: "配方·自动合成",
			display() {
				const auto = Number((player[cfg.id] || {}).recipeAuto) === 1
				return "自动合成：" + (auto ? "开" : "关") + "<br><span style='opacity:.7'>" +
					(auto ? "点击关闭，材料先攒着" : "点击开启，按优先顺序花材料") + "</span>"
			},
			unlocked() { return true },
			canClick() { return true },
			onClick() {
				const d = player[cfg.id]
				if (!d) return
				Vue.set(d, "recipeAuto", Number(d.recipeAuto) === 1 ? 0 : 1)
				updateTempAfterAction(cfg.id)
				needCanvasUpdate = true
			},
			style: { "height": "150px", "width": "170px" },
		}
		bag[MP_STRUCT_IDS.recipe[4]] = {
			title: "配方·优先顺序",
			display() {
				const focus = Math.floor(Number((player[cfg.id] || {}).recipeFocus))
				const name = focus >= 0 && focus < 3 ? MP_RECIPE_TIERS[focus].name : "最便宜"
				return "优先：" + name + "<br><span style='opacity:.7'>点击切换 最便宜 → 初级 → 中级 → 高级</span>"
			},
			unlocked() { return true },
			canClick() { return true },
			onClick() {
				const d = player[cfg.id]
				if (!d) return
				const focus = Math.floor(Number(d.recipeFocus))
				Vue.set(d, "recipeFocus", focus >= 2 ? -1 : focus + 1)
				updateTempAfterAction(cfg.id)
				needCanvasUpdate = true
			},
			style: { "height": "150px", "width": "170px" },
		}
	},
}

function mpRecipeEffectText(cfg) {
	return MP_RECIPE_ROLE[mpRecipeTune(cfg).role] || "加成"
}

// 单档自己贡献了多少（按该档权重），用于卡片逐行显示
function mpRecipeCarryFor(cfg, i) {
	const t = mpRecipeTune(cfg)
	const max = MP_RECIPE_MAX[t.role]
	if (max === undefined) return 0
	return max * mpRecipeCrafts(cfg)[i] * MP_RECIPE_TIERS[i].w / MP_RECIPE_FULL
}

// ---------------- 蓝图型 ----------------
//
// 每层一张 3×3 蓝图：点亮一格花本层点数（成本随已点亮格数指数上涨），
// 相邻两格都点亮就成一条「连线」，连线数决定加成；九格全亮给完成奖励。
// 每层预置几格「基座」（seed），形状不同 —— 同样的连线数，能拿到的加成起点不一样。
const MP_BLUE_EDGES = [
	[0, 1], [1, 2], [3, 4], [4, 5], [6, 7], [7, 8],
	[0, 3], [3, 6], [1, 4], [4, 7], [2, 5], [5, 8],
]
const MP_BLUE_DEFAULT = { role: "gain", seed: [4], cost: 0.05, growth: 1.35 }
const MP_BLUE_UNIT = { gain: 0.018, passive: 0.018, prestige: 0.018, softcap: 0.015, build: 0.02 }
const MP_BLUE_ROLE = {
	gain: "本层产量", passive: "自动产出", prestige: "声望入账",
	softcap: "软上限", build: "施工需求", unlock: "设施解锁",
}
// 点亮全图的完成奖励（按渠道）；施工需求是减法，其余是乘法
const MP_BLUE_DONE = { gain: 1.15, passive: 1.2, prestige: 1.12, softcap: 1.2, build: -0.1 }

function mpBlueTune(cfg) {
	const t = (cfg && cfg.blueprint) || {}
	const role = t.role || MP_BLUE_DEFAULT.role
	return {
		role: MP_BLUE_UNIT[role] !== undefined || role === "unlock" ? role : "gain",
		seed: Array.isArray(t.seed) ? t.seed.filter(i => i >= 0 && i < 9) : MP_BLUE_DEFAULT.seed,
		cost: t.cost === undefined ? MP_BLUE_DEFAULT.cost : t.cost,
		growth: t.growth === undefined ? MP_BLUE_DEFAULT.growth : t.growth,
	}
}

function mpBlueCells(cfg) {
	const d = player[cfg.id]
	const raw = (d && d.blueCells) || []
	const seed = mpBlueTune(cfg).seed
	const out = []
	for (let i = 0; i < 9; i++) out.push(seed.indexOf(i) >= 0 || Number(raw[i]) === 1 ? 1 : 0)
	return out
}

function mpBlueLit(cfg) {
	return mpBlueCells(cfg).reduce((a, b) => a + b, 0)
}

function mpBlueEdgeCount(cfg) {
	const cells = mpBlueCells(cfg)
	return MP_BLUE_EDGES.reduce((n, e) => n + (cells[e[0]] && cells[e[1]] ? 1 : 0), 0)
}

function mpBlueDone(cfg) {
	return mpBlueLit(cfg) >= 9
}

// 下一格的价格（所有空格同一个价，价格只跟已点亮格数有关）
function mpBlueNextCost(cfg) {
	const t = mpBlueTune(cfg)
	return new Decimal(cfg.req).times(t.cost).times(Math.pow(t.growth, mpBlueLit(cfg)))
}

function mpBluePlace(cfg, i) {
	const d = player[cfg.id]
	if (!d || i < 0 || i > 8) return false
	const cells = mpBlueCells(cfg)
	if (cells[i]) return false
	const cost = mpBlueNextCost(cfg)
	if (!player[cfg.id].points.gte(cost)) return false
	d.points = player[cfg.id].points.sub(cost)
	cells[i] = 1
	Vue.set(d, "blueCells", cells)
	return true
}

// 基座格自带的格数 / 连线数：算作 0 收益的起点，免得默认就白送加成
function mpBlueBase(cfg) {
	const seed = mpBlueTune(cfg).seed
	const cells = []
	for (let i = 0; i < 9; i++) cells.push(seed.indexOf(i) >= 0 ? 1 : 0)
	return {
		lit: cells.reduce((a, b) => a + b, 0),
		edges: MP_BLUE_EDGES.reduce((n, e) => n + (cells[e[0]] && cells[e[1]] ? 1 : 0), 0),
	}
}

function mpBlueEffects(cfg) {
	const t = mpBlueTune(cfg)
	const base = mpBlueBase(cfg)
	const lit = Math.max(0, mpBlueLit(cfg) - base.lit)
	const edges = Math.max(0, mpBlueEdgeCount(cfg) - base.edges)
	const done = mpBlueLit(cfg) >= 9
	const u = MP_BLUE_UNIT[t.role] || 0
	const out = { lit, edges, done, gain: 1, passive: 1, prestige: 1, softcap: 1, build: 1 }
	if (t.role === "unlock") {
		// 解锁线不直接给乘区，但每多点亮一格都把施工需求压低一点，免得前期白点
		out.build = Math.max(0.5, 1 - MP_BLUE_UNIT.build * lit)
	} else if (t.role === "build") {
		out.build = Math.max(0.4, 1 - u * lit + (done ? MP_BLUE_DONE.build : 0))
	} else {
		out[t.role] = (1 + u * edges) * (done ? MP_BLUE_DONE[t.role] : 1)
	}
	return out
}

function mpBluePct(x) {
	return Math.round(x * 1000) / 10
}

function mpBlueCellName(i) {
	return "第 " + (i + 1) + " 格"
}

MP_STRUCTS.blueprint = {
	startData(cfg) {
		const cells = []
		for (let i = 0; i < 9; i++) cells.push(0)
		return { blueCells: cells }
	},
	gainMult(cfg) { return mpBlueEffects(cfg).gain },
	passiveMult(cfg) { return mpBlueEffects(cfg).passive },
	prestigeMult(cfg) { return mpBlueEffects(cfg).prestige },
	softcapMult(cfg) { return mpBlueEffects(cfg).softcap },
	buildNeedMult(cfg) { return mpBlueEffects(cfg).build },
	unlock(cfg, kind) {
		if (mpBlueTune(cfg).role !== "unlock") return false
		const lit = mpBlueLit(cfg)
		if (kind === "buy12") return lit >= 5
		if (kind === "buy13") return lit >= 7
		if (kind === "core") return mpBlueDone(cfg)
		return false
	},
	card(cfg) {
		const t = mpBlueTune(cfg)
		const cells = mpBlueCells(cfg)
		const fx = mpBlueEffects(cfg)
		const cost = mpBlueDone(cfg) ? "已点亮全图" : format(mpBlueNextCost(cfg)) + " " + cfg.resource
		const grid = [0, 1, 2].map(r => "<span style='display:inline-block; width:34px; text-align:center; font-size:20px; color:" +
			(cells[r * 3] ? "#e8d38a" : "#4a4f45") + "'>" + (cells[r * 3] ? "●" : "○") + "</span>" +
			"<span style='display:inline-block; width:34px; text-align:center; font-size:20px; color:" +
			(cells[r * 3 + 1] ? "#e8d38a" : "#4a4f45") + "'>" + (cells[r * 3 + 1] ? "●" : "○") + "</span>" +
			"<span style='display:inline-block; width:34px; text-align:center; font-size:20px; color:" +
			(cells[r * 3 + 2] ? "#e8d38a" : "#4a4f45") + "'>" + (cells[r * 3 + 2] ? "●" : "○") + "</span>").join("<br>")
		const totalLit = mpBlueLit(cfg)
		const totalEdges = mpBlueEdgeCount(cfg)
		const base = mpBlueBase(cfg)
		let eff
		if (t.role === "unlock") {
			eff = "解锁：5 格开增益设施（12 号）、7 格开上限设施（13 号）、全亮开主题核心（18 号）；施工需求 −" +
				mpBluePct(1 - fx.build) + "%"
		} else if (t.role === "build") {
			eff = "施工需求 −" + mpBluePct(1 - fx.build) + "%"
		} else {
			eff = MP_BLUE_ROLE[t.role] + " ×" + (Math.round(fx[t.role] * 1000) / 1000) +
				"（新连线 " + fx.edges + "/" + (12 - base.edges) + " 条" + (fx.done ? " · 已完成 ×" + MP_BLUE_DONE[t.role].toFixed(2) : "") + "）"
		}
		return "<span style='display:block; text-align:left; max-width:560px; line-height:1.7'>" + [
			"<b style='color:#9adf75'>结构 · 蓝图</b> —— 逐格点亮，相邻两格都亮了就连成一条线，连线越多加成越高。",
			grid,
			"已点亮 <b>" + totalLit + " / 9</b> · 连线 <b>" + totalEdges + " / 12</b>（基座 " + base.lit + " 格 / " + base.edges + " 条不算收益） · 下一格 <b>" + cost + "</b>",
			"当前：" + eff,
			"<span style='opacity:.75'>空格点一下花一份" + cfg.resource + "，成本每点一格 ×" + t.growth +
				"（初始 " + mpBluePct(t.cost) + "% 需求）。点亮后一直有效：本层声望不清空，更深的层声望时才归零。深色 ● 是这一层自带的基座格，不花钱也算连线。</span>",
		].join("<br>") + "</span>"
	},
	clickables(cfg, bag) {
		const t = mpBlueTune(cfg)
		for (let i = 0; i < 9; i++) {
			bag[MP_STRUCT_IDS.blueprint[i]] = {
				title: "蓝图·" + mpBlueCellName(i),
				display() {
					const cells = mpBlueCells(cfg)
					if (cells[i]) return mpBlueCellName(i) + "<br>● 已点亮"
					return mpBlueCellName(i) + "<br>○ 空<br><span style='opacity:.8'>" + format(mpBlueNextCost(cfg)) + " " + cfg.resource + "</span>"
				},
				unlocked() { return true },
				canClick() {
					if (mpBlueCells(cfg)[i]) return false
					return player[cfg.id].points.gte(mpBlueNextCost(cfg))
				},
				onClick() {
					if (mpBluePlace(cfg, i)) {
						updateTempAfterAction(cfg.id)
						needCanvasUpdate = true
					}
				},
				style: { "height": "120px", "width": "150px" },
			}
		}
	},
}

// 进度换解锁：市场 / 网格 / 节奏共用（三种结构里带 unlock 的那些层）
const MP_UNLOCK_STEPS = [[0.40, "buy12"], [0.70, "buy13"], [1.00, "core"]]
function mpProgressUnlock(prog, kind) {
	for (const [at, k] of MP_UNLOCK_STEPS) {
		if (k === kind) return prog >= at - 1e-9
	}
	return false
}

// ---------------- 市场型 ----------------
//
// 三种货的价格按正弦波动（相位各差 120°），买入按现价花本层点数，卖出按现价结算。
// 赚到的差价记成「套利进度」，进度满了就封顶 —— 市场型不是印钞机，是把点数换成渠道加成。
// 一手都没买的时候进度是 0、乘区全是 1，和没装结构完全一样。
const MP_MARKET_DEFAULT = {
	role: "gain",
	names: ["甲货", "乙货", "丙货"],
	period: 96,
	amp: 0.30,
	spread: 0.05,
	cap: 0.35,
	phase: 0,
}
const MP_MARKET_MAX = { gain: 0.40, passive: 0.40, prestige: 0.40, softcap: 0.50, build: 0.35, points: 0.35, unlock: 0.20 }
const MP_MARKET_ROLE = {
	gain: "本层产量", passive: "自动产出", prestige: "声望入账",
	softcap: "软上限", build: "施工需求", points: "套利点数", unlock: "施工与解锁",
}

function mpMarketTune(cfg) {
	const t = (cfg && cfg.market) || {}
	const out = {}
	for (const k in MP_MARKET_DEFAULT) out[k] = t[k] === undefined ? MP_MARKET_DEFAULT[k] : t[k]
	out.names = Array.isArray(t.names) && t.names.length === 3 ? t.names : MP_MARKET_DEFAULT.names
	out.role = MP_MARKET_MAX[t.role] !== undefined ? t.role : MP_MARKET_DEFAULT.role
	return out
}

function mpMarketState(cfg) {
	const d = player[cfg.id] || {}
	const hands = Array.isArray(d.mktHands) ? d.mktHands : [0, 0, 0]
	const basis = Array.isArray(d.mktBasis) ? d.mktBasis : [0, 0, 0]
	return {
		t: Number(d.mktT) || 0,
		hands: [0, 1, 2].map(i => Math.max(0, Math.floor(Number(hands[i]) || 0))),
		basis: [0, 1, 2].map(i => Math.max(0, Number(basis[i]) || 0)),
		profit: Math.max(0, Number(d.mktProfit) || 0),
	}
}

// 价格系数：1.0 是平价，上下浮动 amp
function mpMarketPrice(cfg, i) {
	const tune = mpMarketTune(cfg)
	const t = mpMarketState(cfg).t
	return 1 + tune.amp * Math.sin(2 * Math.PI * (t / tune.period) + i * 2 * Math.PI / 3 + tune.phase)
}

function mpMarketCap(cfg) {
	return cfg.req * mpMarketTune(cfg).cap
}

function mpMarketProgress(cfg) {
	const cap = mpMarketCap(cfg)
	return cap > 0 ? Math.min(1, mpMarketState(cfg).profit / cap) : 0
}

function mpMarketHandCost(cfg, i) {
	return cfg.req * mpMarketTune(cfg).spread * mpMarketPrice(cfg, i)
}

function mpMarketBuy(cfg, i) {
	const d = player[cfg.id]
	if (!d || i < 0 || i > 2) return false
	if (!d.unlocked && !d.prestiged) return false
	const cost = new Decimal(mpMarketHandCost(cfg, i))
	if (!d.points || !d.points.gte(cost)) return false
	const st = mpMarketState(cfg)
	d.points = d.points.sub(cost)
	const hands = st.hands.slice()
	const basis = st.basis.slice()
	hands[i] += 1
	basis[i] += cost.toNumber()
	Vue.set(d, "mktHands", hands)
	Vue.set(d, "mktBasis", basis)
	return true
}

// 卖出手里这一种货的全部持仓：按现价与均价之差结算，只有赚到的那部分才计入进度
function mpMarketSell(cfg, i) {
	const d = player[cfg.id]
	if (!d || i < 0 || i > 2) return false
	const tune = mpMarketTune(cfg)
	const st = mpMarketState(cfg)
	const n = st.hands[i]
	if (n <= 0) return false
	const p = mpMarketPrice(cfg, i)
	const unit = cfg.req * tune.spread
	const avgPrice = st.basis[i] / (n * unit)
	const gain = Math.max(0, (p - avgPrice) * unit * n)
	const left = Math.max(0, mpMarketCap(cfg) - st.profit)
	const earned = Math.min(gain, left)
	const hands = st.hands.slice()
	const basis = st.basis.slice()
	hands[i] = 0
	basis[i] = 0
	Vue.set(d, "mktHands", hands)
	Vue.set(d, "mktBasis", basis)
	Vue.set(d, "mktProfit", st.profit + earned)
	if (tune.role === "points") {
		// 点数线：本金退回，赚到的差价按点数入账（同样受上限约束）
		d.points = new Decimal(d.points || 0).add(new Decimal(st.basis[i] + earned))
	}
	return true
}

function mpMarketEffects(cfg) {
	const tune = mpMarketTune(cfg)
	const out = { prog: mpMarketProgress(cfg), gain: 1, passive: 1, prestige: 1, softcap: 1, build: 1 }
	const max = MP_MARKET_MAX[tune.role]
	if (max === undefined || tune.role === "points") return out
	const carry = max * out.prog
	if (tune.role === "unlock") out.build = Math.max(0.6, 1 - carry)
	else if (tune.role === "build") out.build = Math.max(0.5, 1 - carry)
	else out[tune.role] = 1 + carry
	return out
}

function mpMarketPct(x) {
	return Math.round(x * 1000) / 10
}

MP_STRUCTS.market = {
	startData() { return { mktT: 0, mktHands: [0, 0, 0], mktBasis: [0, 0, 0], mktProfit: 0 } },
	gainMult(cfg) { return mpMarketEffects(cfg).gain },
	passiveMult(cfg) { return mpMarketEffects(cfg).passive },
	prestigeMult(cfg) { return mpMarketEffects(cfg).prestige },
	softcapMult(cfg) { return mpMarketEffects(cfg).softcap },
	buildNeedMult(cfg) { return mpMarketEffects(cfg).build },
	unlock(cfg, kind) {
		return mpMarketTune(cfg).role === "unlock" && mpProgressUnlock(mpMarketProgress(cfg), kind)
	},
	update(cfg, diff) {
		const d = player[cfg.id]
		if (!d || !(diff > 0)) return
		if (!d.unlocked && !d.prestiged) return
		Vue.set(d, "mktT", (Number(d.mktT) || 0) + diff)
	},
	card(cfg) {
		const tune = mpMarketTune(cfg)
		const st = mpMarketState(cfg)
		const fx = mpMarketEffects(cfg)
		const unit = cfg.req * tune.spread
		const rows = [0, 1, 2].map(i => {
			const p = mpMarketPrice(cfg, i)
			const arrow = p >= 1 ? "<span style='color:#9adf75'>↑</span>" : "<span style='color:#e8a4a4'>↓</span>"
			const avg = st.hands[i] > 0 ? (st.basis[i] / (st.hands[i] * unit)).toFixed(2) : "—"
			return tune.names[i] + "　价 <b>" + p.toFixed(2) + "</b> " + arrow +
				"　持仓 " + st.hands[i] + " 手　均价 " + avg +
				"　<span style='opacity:.75'>一手 " + format(new Decimal(mpMarketHandCost(cfg, i))) + " " + cfg.resource + "</span>"
		})
		let eff
		if (tune.role === "points") {
			eff = "套利点数 " + format(new Decimal(st.profit)) + " / " + format(new Decimal(mpMarketCap(cfg)))
		} else if (tune.role === "unlock") {
			eff = "施工需求 −" + mpMarketPct(1 - fx.build) + "%（上限 −" + mpMarketPct(MP_MARKET_MAX.unlock) + "%）· 进度 40% / 70% / 100% 依次解锁中间设施、第三座设施与主题核心"
		} else if (tune.role === "build") {
			eff = "施工需求 −" + mpMarketPct(1 - fx.build) + "%（上限 −" + mpMarketPct(MP_MARKET_MAX.build) + "%）"
		} else {
			eff = MP_MARKET_ROLE[tune.role] + " ×" + (Math.round(fx[tune.role] * 1000) / 1000) +
				"（上限 ×" + (1 + MP_MARKET_MAX[tune.role]) + "）"
		}
		return "<span style='display:block; text-align:left; max-width:560px; line-height:1.7'>" + [
			"<b style='color:#9adf75'>结构 · 市场</b> —— 三种货的价格一直在动：低价买入，高价卖出，赚到的差价换成这一层的加成。",
			...rows,
			"套利进度 <b>" + mpMarketPct(fx.prog * 100) + "%</b> · " + eff,
			"<span style='opacity:.75'>买入花的是本层点数，卖出的点数不退回（差价才是收益）；一轮最多赚到需求的 " +
				mpMarketPct(tune.cap * 100) + "%。价格周期 " + tune.period + " 秒，振幅 ±" + mpMarketPct(tune.amp * 100) +
				"%。本层声望不清空持仓与进度，更深的层声望时才归零。</span>",
		].join("<br>") + "</span>"
	},
	clickables(cfg, bag) {
		const tune = mpMarketTune(cfg)
		const style = { "height": "110px", "width": "150px" }
		for (let i = 0; i < 3; i++) {
			bag[MP_STRUCT_IDS.market[i]] = {
				title: "市场·买入" + tune.names[i],
				display() {
					const st = mpMarketState(cfg)
					return "买入 " + tune.names[i] + "<br>价 " + mpMarketPrice(cfg, i).toFixed(2) +
						"<br><span style='opacity:.7'>" + format(new Decimal(mpMarketHandCost(cfg, i))) + " " + cfg.resource +
						"　持仓 " + st.hands[i] + "</span>"
				},
				unlocked() { return true },
				canClick() {
					const d = player[cfg.id]
					if (!d || (!d.unlocked && !d.prestiged)) return false
					return !!d.points && d.points.gte(new Decimal(mpMarketHandCost(cfg, i)))
				},
				onClick() {
					if (mpMarketBuy(cfg, i)) {
						updateTempAfterAction(cfg.id)
						needCanvasUpdate = true
					}
				},
				style,
			}
			bag[MP_STRUCT_IDS.market[i + 3]] = {
				title: "市场·卖出" + tune.names[i],
				display() {
					const st = mpMarketState(cfg)
					if (st.hands[i] <= 0) return "卖出 " + tune.names[i] + "<br><span style='opacity:.6'>空仓</span>"
					return "卖出 " + tune.names[i] + "<br>持仓 " + st.hands[i] + " 手<br><span style='opacity:.7'>全部按现价结算</span>"
				},
				unlocked() { return true },
				canClick() { return mpMarketState(cfg).hands[i] > 0 },
				onClick() {
					if (mpMarketSell(cfg, i)) {
						updateTempAfterAction(cfg.id)
						needCanvasUpdate = true
					}
				},
				style,
			}
		}
	},
}

// ---------------- 网格型 ----------------
//
// 4×4 的格子上摆模块：每摆一个花本层点数（价格随已摆数量指数上涨），
// 模块自己算 1 分，相邻（上下左右）两个模块连成一对算 2 分，分数换渠道加成。
// 摆得密、连得多就赚 —— 摆哪里是玩家自己的规划；空格子默认 0 分，乘区全是 1。
const MP_GRID_SIZE = 4
const MP_GRID_CELLS = MP_GRID_SIZE * MP_GRID_SIZE
const MP_GRID_DEFAULT = { role: "gain", seed: [], limit: 8, cost: 0.05, growth: 1.22, node: 1, edge: 2, target: 14 }
const MP_GRID_MAX = { gain: 0.40, passive: 0.40, prestige: 0.40, softcap: 0.50, build: 0.35, unlock: 0.20 }
const MP_GRID_ROLE = {
	gain: "本层产量", passive: "自动产出", prestige: "声望入账", softcap: "软上限", build: "施工需求", unlock: "施工与解锁",
}

function mpGridTune(cfg) {
	const t = (cfg && cfg.grid) || {}
	const out = {}
	for (const k in MP_GRID_DEFAULT) out[k] = t[k] === undefined ? MP_GRID_DEFAULT[k] : t[k]
	out.seed = Array.isArray(t.seed) ? t.seed.filter(i => i >= 0 && i < MP_GRID_CELLS) : []
	out.role = MP_GRID_MAX[t.role] !== undefined ? t.role : "gain"
	return out
}

function mpGridCells(cfg) {
	const d = player[cfg.id]
	const raw = (d && d.gridCells) || []
	const seed = mpGridTune(cfg).seed
	const out = []
	for (let i = 0; i < MP_GRID_CELLS; i++) out.push(seed.indexOf(i) >= 0 || Number(raw[i]) === 1 ? 1 : 0)
	return out
}

function mpGridLit(cfg) {
	return mpGridCells(cfg).reduce((a, b) => a + b, 0)
}

function mpGridEdgeCount(cfg) {
	const cells = mpGridCells(cfg)
	let n = 0
	for (let r = 0; r < MP_GRID_SIZE; r++) {
		for (let c = 0; c < MP_GRID_SIZE; c++) {
			const i = r * MP_GRID_SIZE + c
			if (!cells[i]) continue
			if (c + 1 < MP_GRID_SIZE && cells[i + 1]) n++
			if (r + 1 < MP_GRID_SIZE && cells[i + MP_GRID_SIZE]) n++
		}
	}
	return n
}

// 基座格自带的分数不算收益
function mpGridBase(cfg) {
	const seed = mpGridTune(cfg).seed
	const cells = []
	for (let i = 0; i < MP_GRID_CELLS; i++) cells.push(seed.indexOf(i) >= 0 ? 1 : 0)
	let edges = 0
	for (let r = 0; r < MP_GRID_SIZE; r++) {
		for (let c = 0; c < MP_GRID_SIZE; c++) {
			const i = r * MP_GRID_SIZE + c
			if (!cells[i]) continue
			if (c + 1 < MP_GRID_SIZE && cells[i + 1]) edges++
			if (r + 1 < MP_GRID_SIZE && cells[i + MP_GRID_SIZE]) edges++
		}
	}
	return { lit: cells.reduce((a, b) => a + b, 0), edges }
}

function mpGridNextCost(cfg) {
	const t = mpGridTune(cfg)
	const placed = Math.max(0, mpGridLit(cfg) - mpGridBase(cfg).lit)
	return new Decimal(cfg.req).times(t.cost).times(Math.pow(t.growth, placed))
}

function mpGridPlace(cfg, i) {
	const d = player[cfg.id]
	if (!d || i < 0 || i >= MP_GRID_CELLS) return false
	if (!d.unlocked && !d.prestiged) return false
	const cells = mpGridCells(cfg)
	if (cells[i]) return false
	const t = mpGridTune(cfg)
	if (mpGridLit(cfg) >= t.limit) return false
	const cost = mpGridNextCost(cfg)
	if (!d.points || !d.points.gte(cost)) return false
	d.points = d.points.sub(cost)
	cells[i] = 1
	Vue.set(d, "gridCells", cells)
	return true
}

function mpGridProgress(cfg) {
	const t = mpGridTune(cfg)
	const base = mpGridBase(cfg)
	const lit = Math.max(0, mpGridLit(cfg) - base.lit)
	const edges = Math.max(0, mpGridEdgeCount(cfg) - base.edges)
	const score = t.node * lit + t.edge * edges
	return { lit, edges, score, prog: t.target > 0 ? Math.min(1, score / t.target) : 0 }
}

function mpGridEffects(cfg) {
	const t = mpGridTune(cfg)
	const p = mpGridProgress(cfg)
	const out = { lit: p.lit, edges: p.edges, score: p.score, prog: p.prog, gain: 1, passive: 1, prestige: 1, softcap: 1, build: 1 }
	const max = MP_GRID_MAX[t.role]
	if (max === undefined) return out
	const carry = max * p.prog
	if (t.role === "unlock") out.build = Math.max(0.6, 1 - carry)
	else if (t.role === "build") out.build = Math.max(0.5, 1 - carry)
	else out[t.role] = 1 + carry
	return out
}

function mpGridPct(x) {
	return Math.round(x * 1000) / 10
}

MP_STRUCTS.grid = {
	startData() {
		const cells = []
		for (let i = 0; i < MP_GRID_CELLS; i++) cells.push(0)
		return { gridCells: cells }
	},
	gainMult(cfg) { return mpGridEffects(cfg).gain },
	passiveMult(cfg) { return mpGridEffects(cfg).passive },
	prestigeMult(cfg) { return mpGridEffects(cfg).prestige },
	softcapMult(cfg) { return mpGridEffects(cfg).softcap },
	buildNeedMult(cfg) { return mpGridEffects(cfg).build },
	unlock(cfg, kind) {
		return mpGridTune(cfg).role === "unlock" && mpProgressUnlock(mpGridProgress(cfg).prog, kind)
	},
	card(cfg) {
		const t = mpGridTune(cfg)
		const cells = mpGridCells(cfg)
		const fx = mpGridEffects(cfg)
		const rows = []
		for (let r = 0; r < MP_GRID_SIZE; r++) {
			const line = []
			for (let c = 0; c < MP_GRID_SIZE; c++) {
				const i = r * MP_GRID_SIZE + c
				line.push("<span style='display:inline-block; width:34px; text-align:center; font-size:20px; color:" +
					(cells[i] ? "#e8d38a" : "#4a4f45") + "'>" + (cells[i] ? "▣" : "▢") + "</span>")
			}
			rows.push(line.join(""))
		}
		let eff
		if (t.role === "unlock") {
			eff = "施工需求 −" + mpGridPct(1 - fx.build) + "%（上限 −" + mpGridPct(MP_GRID_MAX.unlock) + "%）· 进度 40% / 70% / 100% 依次解锁中间设施、第三座设施与主题核心"
		} else if (t.role === "build") {
			eff = "施工需求 −" + mpGridPct(1 - fx.build) + "%（上限 −" + mpGridPct(MP_GRID_MAX.build) + "%）"
		} else {
			eff = MP_GRID_ROLE[t.role] + " ×" + (Math.round(fx[t.role] * 1000) / 1000) +
				"（上限 ×" + (1 + MP_GRID_MAX[t.role]) + "）"
		}
		const full = mpGridLit(cfg) >= t.limit
		return "<span style='display:block; text-align:left; max-width:560px; line-height:1.7'>" + [
			"<b style='color:#9adf75'>结构 · 网格</b> —— 在 4×4 的格子上摆模块：一个模块 1 分，相邻的一对 2 分，分数换成这一层的加成。",
			...rows,
			"模块 <b>" + mpGridLit(cfg) + " / " + t.limit + "</b> · 连线 <b>" + fx.edges + " 对</b> · 得分 <b>" + fx.score +
				" / " + t.target + "</b> · 下一格 <b>" + (full ? "已摆满" : format(mpGridNextCost(cfg)) + " " + cfg.resource) + "</b>",
			"当前：" + eff,
			"<span style='opacity:.75'>每摆一格，下一格的价格 ×" + t.growth + "（第一格 " + mpGridPct(t.cost) +
				"% 需求）。摆成一片比零散摆多一倍分，但摆满之前也能只挑关键格。本层声望不清空布局，更深的层声望时才归零。</span>",
		].join("<br>") + "</span>"
	},
	clickables(cfg, bag) {
		const t = mpGridTune(cfg)
		for (let i = 0; i < MP_GRID_CELLS; i++) {
			bag[MP_STRUCT_IDS.grid[i]] = {
				title: "网格·第 " + (i + 1) + " 格",
				display() {
					const cells = mpGridCells(cfg)
					if (cells[i]) return "▣<br><span style='opacity:.8'>已摆模块</span>"
					const full = mpGridLit(cfg) >= t.limit
					return "▢<br><span style='opacity:.75'>" + (full ? "已摆满" : format(mpGridNextCost(cfg))) + "</span>"
				},
				unlocked() { return true },
				canClick() {
					const d = player[cfg.id]
					if (!d || (!d.unlocked && !d.prestiged)) return false
					if (mpGridCells(cfg)[i]) return false
					if (mpGridLit(cfg) >= mpGridTune(cfg).limit) return false
					return !!d.points && d.points.gte(mpGridNextCost(cfg))
				},
				onClick() {
					if (mpGridPlace(cfg, i)) {
						updateTempAfterAction(cfg.id)
						needCanvasUpdate = true
					}
				},
				style: { "height": "92px", "width": "110px" },
			}
		}
	},
}

// ---------------- 节奏型 ----------------
//
// 一条按 period 秒循环的进度条，条中间有一段「命中窗口」。
// 在窗口里点一次算一次命中，命中累到 hits 上限就拿满加成；点早了算失误，命中数掉 2。
// 一下都没敲中的时候加成是 1，和没装结构完全一样。
const MP_RHY_DEFAULT = { role: "gain", period: 6, window: 0.20, hits: 15, lock: 0.30 }
const MP_RHY_MAX = { gain: 0.40, passive: 0.40, prestige: 0.40, softcap: 0.50, build: 0.35, unlock: 0.20 }
const MP_RHY_ROLE = {
	gain: "本层产量", passive: "自动产出", prestige: "声望入账", softcap: "软上限", build: "施工需求", unlock: "施工与解锁",
}

function mpRhythmTune(cfg) {
	const t = (cfg && cfg.rhythm) || {}
	const out = {}
	for (const k in MP_RHY_DEFAULT) out[k] = t[k] === undefined ? MP_RHY_DEFAULT[k] : t[k]
	out.role = MP_RHY_MAX[t.role] !== undefined ? t.role : "gain"
	return out
}

function mpRhythmState(cfg) {
	const d = player[cfg.id] || {}
	return {
		t: Number(d.rhyT) || 0,
		hits: Math.max(0, Math.floor(Number(d.rhyHits) || 0)),
		last: Number(d.rhyLast) || 0,
	}
}

// 0..1 的循环位置
function mpRhythmPhase(cfg) {
	const t = mpRhythmTune(cfg)
	const st = mpRhythmState(cfg)
	if (!(t.period > 0)) return 0
	return (st.t % t.period) / t.period
}

function mpRhythmInWindow(cfg) {
	const t = mpRhythmTune(cfg)
	const p = mpRhythmPhase(cfg)
	return Math.abs(p - 0.5) <= t.window / 2
}

function mpRhythmProgress(cfg) {
	const t = mpRhythmTune(cfg)
	return t.hits > 0 ? Math.min(1, mpRhythmState(cfg).hits / t.hits) : 0
}

function mpRhythmEffects(cfg) {
	const t = mpRhythmTune(cfg)
	const prog = mpRhythmProgress(cfg)
	const out = { prog, hits: mpRhythmState(cfg).hits, gain: 1, passive: 1, prestige: 1, softcap: 1, build: 1 }
	const max = MP_RHY_MAX[t.role]
	if (max === undefined) return out
	const carry = max * prog
	if (t.role === "unlock") out.build = Math.max(0.6, 1 - carry)
	else if (t.role === "build") out.build = Math.max(0.5, 1 - carry)
	else out[t.role] = 1 + carry
	return out
}

// 敲一下：命中 +1，失误 −2；lock 秒内重复点击不算
function mpRhythmTap(cfg) {
	const d = player[cfg.id]
	if (!d || (!d.unlocked && !d.prestiged)) return false
	const t = mpRhythmTune(cfg)
	const st = mpRhythmState(cfg)
	if (st.t - st.last < t.lock) return false
	const hit = mpRhythmInWindow(cfg)
	const next = hit ? Math.min(t.hits, st.hits + 1) : Math.max(0, st.hits - 2)
	Vue.set(d, "rhyLast", st.t)
	Vue.set(d, "rhyHits", next)
	return hit
}

function mpRhythmPct(x) {
	return Math.round(x * 1000) / 10
}

// 二十四格的进度条：▒ 是命中窗口，▼ 是当前位置
function mpRhythmBar(cfg) {
	const N = 24
	const t = mpRhythmTune(cfg)
	const p = mpRhythmPhase(cfg)
	const marker = Math.min(N - 1, Math.max(0, Math.floor(p * N)))
	const lo = Math.floor((0.5 - t.window / 2) * N)
	const hi = Math.max(lo, Math.ceil((0.5 + t.window / 2) * N) - 1)
	let out = ""
	for (let i = 0; i < N; i++) {
		if (i === marker) out += "<span style='color:#f5c542'>▼</span>"
		else if (i >= lo && i <= hi) out += "<span style='color:#9adf75'>▒</span>"
		else out += "<span style='opacity:.35'>─</span>"
	}
	return out
}

MP_STRUCTS.rhythm = {
	startData() { return { rhyT: 0, rhyHits: 0, rhyLast: 0 } },
	gainMult(cfg) { return mpRhythmEffects(cfg).gain },
	passiveMult(cfg) { return mpRhythmEffects(cfg).passive },
	prestigeMult(cfg) { return mpRhythmEffects(cfg).prestige },
	softcapMult(cfg) { return mpRhythmEffects(cfg).softcap },
	buildNeedMult(cfg) { return mpRhythmEffects(cfg).build },
	unlock(cfg, kind) {
		return mpRhythmTune(cfg).role === "unlock" && mpProgressUnlock(mpRhythmProgress(cfg), kind)
	},
	update(cfg, diff) {
		const d = player[cfg.id]
		if (!d || !(diff > 0)) return
		if (!d.unlocked && !d.prestiged) return
		Vue.set(d, "rhyT", (Number(d.rhyT) || 0) + diff)
	},
	card(cfg) {
		const t = mpRhythmTune(cfg)
		const st = mpRhythmState(cfg)
		const fx = mpRhythmEffects(cfg)
		let eff
		if (t.role === "unlock") {
			eff = "施工需求 −" + mpRhythmPct(1 - fx.build) + "%（上限 −" + mpRhythmPct(MP_RHY_MAX.unlock) + "%）· 进度 40% / 70% / 100% 依次解锁中间设施、第三座设施与主题核心"
		} else if (t.role === "build") {
			eff = "施工需求 −" + mpRhythmPct(1 - fx.build) + "%（上限 −" + mpRhythmPct(MP_RHY_MAX.build) + "%）"
		} else {
			eff = MP_RHY_ROLE[t.role] + " ×" + (Math.round(fx[t.role] * 1000) / 1000) +
				"（上限 ×" + (1 + MP_RHY_MAX[t.role]) + "）"
		}
		const next = t.period - (st.t % t.period)
		return "<span style='display:block; text-align:left; max-width:560px; line-height:1.7'>" + [
			"<b style='color:#9adf75'>结构 · 节奏</b> —— 进度条转一圈 " + t.period + " 秒，条中间那段 <span style='color:#9adf75'>▒</span> 是命中窗口，在窗口里点中才算一次。",
			"<span style='font-size:15px; letter-spacing:1px'>" + mpRhythmBar(cfg) + "</span>",
			"命中 <b>" + st.hits + " / " + t.hits + "</b> · 进度 <b>" + mpRhythmPct(fx.prog * 100) + "%</b> · 下一圈还有 " +
				(Math.round(next * 10) / 10) + " 秒",
			"当前：" + eff,
			"<span style='opacity:.75'>点早了算失误，命中数掉 2；两次点击至少隔 " + t.lock + " 秒。窗口宽度 " +
				mpRhythmPct(t.window * 100) + "% 圈长。本层声望不清空命中，更深的层声望时才归零。</span>",
		].join("<br>") + "</span>"
	},
	clickables(cfg, bag) {
		const t = mpRhythmTune(cfg)
		bag[MP_STRUCT_IDS.rhythm[0]] = {
			title: "节奏·敲一下",
			display() {
				const st = mpRhythmState(cfg)
				const inWin = mpRhythmInWindow(cfg)
				return (inWin ? "<span style='color:#9adf75'>▣ 就在窗口里</span>" : "敲一下") +
					"<br><span style='letter-spacing:1px; font-size:13px'>" + mpRhythmBar(cfg) + "</span>" +
					"<br><span style='opacity:.75'>命中 " + st.hits + " / " + t.hits + "</span>"
			},
			unlocked() { return true },
			canClick() {
				const d = player[cfg.id]
				return !!d && (d.unlocked || d.prestiged) && !(mpRhythmState(cfg).hits >= t.hits && mpRhythmInWindow(cfg))
			},
			onClick() {
				if (mpRhythmTap(cfg)) {
					updateTempAfterAction(cfg.id)
					needCanvasUpdate = true
				}
			},
			style: { "height": "110px", "width": "210px" },
		}
	},
}