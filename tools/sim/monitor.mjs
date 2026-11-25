// 数值监测：不测速度，只看数值是否在正常区间。每 5 tick 全量采一次样，记录历史最大值。
// 列：耗时 | 需求(e) | 声望收益/需求 | 层内峰值/需求 | 上层池子峰值/需求 | 升级级数 | 设施级数
// 体检：声望收益是否被 MP_GAIN_CAP 封住；门槛（上层池子 ≥ 50 倍需求）是否真成立；
//       层内升级是否真的被买。
// 用法：node tools/sim/monitor.mjs --hours=6 --speed=10
import { buildEnv } from "./env.mjs"
import { makeDriver } from "./driver.mjs"

const argv = Object.fromEntries(
	process.argv.slice(2).map((a) => {
		const m = a.match(/^--([^=]+)=?(.*)$/)
		return m ? [m[1], m[2] || "true"] : [a, "true"]
	})
)
const hours = Number(argv.hours || 6)
const speed = Number(argv.speed || 10)

const env = buildEnv({})
const ctx = env.sandbox
ctx.__eval = env.eval
ctx.load()
env.flushTimeouts()
ctx.makeParticles = () => {}
ctx.player.devSpeed = speed
const gTick = env.getTick()
const driver = makeDriver(ctx, {})
const MODPACK = ctx.__eval("MODPACK")
const order = ctx.__eval('["p","s","i","d","n","e"].concat(MODPACK.map(c=>c.id))')

const SAMPLE = `(function(){
	const out = {}
	for (const cfg of MODPACK) {
		const id = cfg.id
		const T = tmp[id] || {}
		const d = player[id]
		const prev = player[cfg.prev]
		const lg = (x) => (x && x.log10 ? x.log10().toNumber() : null)
		out[id] = {
			p10: lg(d && d.points),
			b10: lg(d && d.best),
			r10: lg(T.requires),
			g10: lg(T.resetGain),
			v10: lg(T.passiveGeneration),
			c10: lg(mpGainCapMult(cfg)),
			prev10: lg(prev && prev.points),
			u: d && Array.isArray(d.upgrades) ? d.upgrades.length : 0,
			f: d && d.buyables && d.buyables[11] ? Number(d.buyables[11].toString()) : 0,
		}
	}
	return out
})()`

const st = {}
for (const cfg of MODPACK) st[cfg.id] = { u: 0, f: 0, p: -Infinity, b: -Infinity, g: -Infinity, prev: -Infinity, v: null, over: -Infinity }

const cleared = new Array(order.length).fill(null)
const clearInfo = {}
let last = 0
const rebirths = []
const maxTicks = Math.round((hours * 3600) / speed)

for (let i = 1; i <= maxTicks; i++) {
	env.advance(1000)
	gTick()
	if (i % 5 === 0) {
		let s = null
		try {
			s = ctx.__eval(SAMPLE)
		} catch (e) {}
		if (s) {
			for (const id of Object.keys(s)) {
				const o = s[id]
				const t = st[id]
				if (!t) continue
				if (o.u > t.u) t.u = o.u
				if (o.f > t.f) t.f = o.f
				if (o.p10 !== null && o.p10 > t.p) t.p = o.p10
				if (o.b10 !== null && o.b10 > t.b) t.b = o.b10
				if (o.g10 !== null && o.g10 > t.g) t.g = o.g10
				if (o.v10 !== null) t.v = o.v10
				// 天花板侧：收益相对需求的倍数是否越过了本层自己的上限（v11.8 起上限是可购买的）
				if (o.g10 !== null && o.r10 !== null && o.c10 !== null && (o.g10 - o.r10 - o.c10) > t.over) t.over = o.g10 - o.r10 - o.c10
				// 门槛侧：上一层点数相对本层需求的倍数（要能到 50 倍才谈得上门槛）
				if (o.prev10 !== null && o.r10 !== null && o.prev10 - o.r10 > t.prev) t.prev = o.prev10 - o.r10
			}
		}
	}
	const t = (i * speed) / 60
	for (let k = 0; k < order.length; k++) {
		if (cleared[k] !== null) continue
		const d = ctx.player[order[k]]
		if (!d || !d.prestiged) continue
		cleared[k] = t
		try {
			clearInfo[order[k]] = ctx.__eval(`(function(){
				const cfg = MODPACK.find(c => c.id === ${JSON.stringify(order[k])})
				const T = tmp[cfg.id] || {}
				return { req10: T.requires && T.requires.log10 ? T.requires.log10().toNumber() : Math.log10(cfg.req) }
			})()`)
		} catch (e) {}
	}
	const claimed = ctx.__eval("(player.rebirth && player.rebirth.claimed) || 0")
	if (claimed !== last) {
		if (claimed > last) rebirths.push({ atMin: Number(t.toFixed(1)), claimed })
		last = claimed
	}
	driver.tick()
}

const f = (x, n = 2) => (x === null || x === undefined || !isFinite(x) ? "—" : Number(x).toFixed(n))
const ratio = (a, b) => (a === -Infinity || b === null || b === undefined ? null : Math.pow(10, a - b))
const issues = []
let prevT = 0
console.log("层\t序\t耗时\t需求e\t声望/需求\t峰值/需求\t门槛达成\t升级\t设施")
for (let k = 0; k < order.length; k++) {
	const id = order[k]
	const t = st[id] || { u: 0, f: 0, p: -Infinity, b: -Infinity, g: -Infinity, prev: -Infinity, v: null }
	const ci = clearInfo[id] || {}
	const req10 = ci.req10 === undefined ? null : ci.req10
	const dt = cleared[k] === null ? null : cleared[k] - prevT
	if (cleared[k] !== null) prevT = cleared[k]
	const index = k < 6 ? k : k - 6
	const gainRatio = ratio(t.g, req10)
	const peakRatio = ratio(t.b, req10)
	const gateRatio = ratio(t.prev, 0)
	console.log([
		id,
		index,
		f(dt, 1),
		f(req10, 2),
		f(gainRatio, 1),
		f(peakRatio, 1),
		f(gateRatio, 1),
		t.u,
		t.f,
	].join("\t"))
	if (k >= 6) {
		// 天花板是 v11.8 的可购买上限：只看收益有没有越界，不再写死 4 或者 6
		if (t.over !== undefined && t.over > 0.15) issues.push(id + " 声望收益超出本层上限 " + f(t.over, 2) + " 个数量级")
		// 每 5 tick 采样一次，门槛达标后很快就会被上层声望清掉，偶尔会漏采；只报明显不达标的层
		if (gateRatio !== null && gateRatio < 0.5) issues.push(id + " 门槛没达成：上层池子峰值只有门槛的 " + f(gateRatio, 2) + " 倍")
		if (t.u < 3) issues.push(id + " 全程最多只买了 " + t.u + " 级升级")
	}
}
console.log("\n体检 " + (issues.length ? issues.length + " 条：" : "无异常"))
for (const s of issues) console.log("  - " + s)
console.log("\n转生 " + JSON.stringify(rebirths))
