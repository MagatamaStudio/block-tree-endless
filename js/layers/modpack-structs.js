// 模组层的「结构」扩展点
//
// 30 个模组层原先共用一套骨架（10 升级 + 4 设施 + 10 里程碑 + 3 挑战 + 同一套 tabFormat），
// 差异只在参数上。结构（struct）决定这一层怎么玩，参数只决定数字。
//
// 现有结构：
//   - 不写 struct：classic，和其他层一样，买升级 → 升设施 → 施工 → 声望
//   - alloc：配比型，把产能分给三道工序，短板决定产量、成品份额决定声望入账
//
// 加新结构：往 MP_STRUCTS 里加一项，按需实现下面的方法，再在 MOD_THEMES 对应层写 struct: "<key>"
//   startData()          新层的存档字段（老档由 fixSave 的 fixData 自动补上默认值）
//   passiveMult(cfg)     本层自动产出的乘数，默认 1
//   prestigeMult(cfg)    本层声望入账的乘数，默认 1（只影响结算，不影响自动产出）
//   card(cfg)            层页多出来的一张说明卡（HTML 字符串）
//   clickables(cfg,bag)  往 clickableData 里塞操作按钮

const MP_STRUCTS = {}

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
			bag[31 + i] = {
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
		bag[34] = {
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
