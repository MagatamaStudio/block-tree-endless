// 每层首通耗时表：跑真实游戏逻辑（100× 加速），记录每层第一次 prestige 的模拟分钟。
// 同时抓首通瞬间的产量快照，用来反推「需求该给多大」。
// 用法：node tools/sim/curve.mjs --hours=6 [--speed=100] [--seed=file] [--verbose=1]
import { buildEnv } from "./env.mjs"
import { makeDriver } from "./driver.mjs"
import fs from "node:fs"

const argv = Object.fromEntries(
	process.argv.slice(2).map((a) => {
		const m = a.match(/^--([^=]+)=?(.*)$/)
		return m ? [m[1], m[2] || "true"] : [a, "true"]
	})
)
const hours = Number(argv.hours || 6)
const speed = Number(argv.speed || 100)
const seedFile = argv.seed || null
const verbose = argv.verbose === "1"

const env = buildEnv({})
const ctx = env.sandbox
ctx.__eval = env.eval
if (seedFile) {
	const key = ctx.__eval("getModID()")
	ctx.localStorage.setItem(key, fs.readFileSync(seedFile, "utf8").trim())
}
ctx.load()
env.flushTimeouts()
ctx.makeParticles = () => {}
ctx.player.devSpeed = speed

const tick = env.getTick()
const driver = makeDriver(ctx, {})
const order = ctx.__eval('["p","s","i","d","n","e"].concat(MODPACK.map(c=>c.id))')
const N = order.length

const cleared = new Array(N).fill(null)
const snap = new Array(N).fill(null)
const rebirths = []
let lastClaimed = 0
const maxTicks = Math.round((hours * 3600) / speed)
const t0 = Date.now()

// 首通检查必须放在 driver.tick() 之前：打通全部 30 个模组层（cr 首通）的同一
// 个 tick 里 driver 就会点「真转生」把全部首通标记清掉，放在后面会漏掉 cr。
function checkCleared(t) {
	for (let k = 0; k < N; k++) {
		if (cleared[k] !== null) continue
		const id = order[k]
		const d = ctx.player[id]
		if (!d || !d.prestiged) continue
		cleared[k] = t
		let info
		try {
			info = ctx.__eval(`(function(){
				const id = ${JSON.stringify(id)}
				const T = tmp[id] || {}
				const g = T.resetGain && T.resetGain.log10 ? T.resetGain : null
				const p = T.passiveGeneration && T.passiveGeneration.log10 ? T.passiveGeneration : null
				const pg = player[id].points && player[id].points.log10 ? player[id].points : null
				const req = T.requires && T.requires.log10 ? T.requires : null
				return {
					req: req ? req.log10().toNumber() : null,
					gain: g ? g.log10().toNumber() : null,
					passive: p ? p.log10().toNumber() : null,
					points: pg ? pg.log10().toNumber() : null,
				}
			})()`)
		} catch (e) {
			info = { err: String(e).slice(0, 40) }
		}
		snap[k] = info
	}
}

for (let i = 1; i <= maxTicks; i++) {
	env.advance(1000)
	tick()
	const t = (i * speed) / 60
	checkCleared(t)
	// 真转生事件：driver 打通 30 层后会自动点确认（env 里 confirm 恒 true），
	// 记录每次转生的时刻，作为「整链打通」的判定
	const claimed = ctx.__eval("(player.rebirth && player.rebirth.claimed) || 0")
	if (claimed !== lastClaimed) {
		if (claimed > lastClaimed) {
			const done = cleared.filter((x) => x !== null).length
			rebirths.push({ atMin: Number(t.toFixed(1)), tick: i, done })
		}
		lastClaimed = claimed
	}
	driver.tick()
	if (verbose && i % 60 === 0) {
		const done = cleared.filter((x) => x !== null).length
		console.log("t=" + t.toFixed(0) + "m 已首通 " + done + "/" + N + " 转生 " + rebirths.length)
	}
}

const rows = []
let prev = 0
for (let k = 0; k < N; k++) {
	const c = cleared[k]
	const dt = c === null ? null : c - prev
	if (c !== null) prev = c
	const s = snap[k] || {}
	rows.push({
		layer: order[k],
		atMin: c === null ? null : Number(c.toFixed(1)),
		dtMin: dt === null ? null : Number(dt.toFixed(1)),
		reqLog: s.req == null ? null : Number(s.req.toFixed(2)),
		passiveLog: s.passive == null ? null : Number(s.passive.toFixed(2)),
		pointsLog: s.points == null ? null : Number(s.points.toFixed(2)),
	})
}

console.log("层       首通(分)  本层耗时(分)  需求 e     产出 e/秒   点数 e")
for (const r of rows) {
	console.log(
		String(r.layer).padEnd(8) +
		String(r.atMin === null ? "—" : r.atMin.toFixed(1)).padStart(9) +
		String(r.dtMin === null ? "—" : r.dtMin.toFixed(1)).padStart(13) +
		String(r.reqLog === null ? "—" : r.reqLog.toFixed(2)).padStart(10) +
		String(r.passiveLog === null ? "—" : r.passiveLog.toFixed(2)).padStart(12) +
		String(r.pointsLog === null ? "—" : r.pointsLog.toFixed(2)).padStart(10)
	)
}
const done = cleared.filter((x) => x !== null).length
// 卡住诊断：列出第一个没首通的层，以及它前置层的产量快照
const stuckIdx = cleared.indexOf(null)
if (stuckIdx >= 0) {
	const sid = order[stuckIdx]
	const pid = stuckIdx > 0 ? order[stuckIdx - 1] : null
	try {
	console.log("\n卡在 " + sid + "（第 " + stuckIdx + " 层）。前置层 " + pid + " 快照：")
	console.log(ctx.__eval(`(function(){
		const pid = ${JSON.stringify(pid)}, sid = ${JSON.stringify(sid)}
		const pT = tmp[pid] || {}, sT = tmp[sid] || {}
		const pl = player[pid] || {}, sl = player[sid] || {}
		const f = (d) => d && d.log10 ? (d.isFinite && d.isFinite() ? d.log10().toNumber().toFixed(2) : "inf") : "none"
		const raw = (d) => d && d.toString ? String(d) : "none"
		return JSON.stringify({
		prevPoints: f(pl.points), prevBest: f(pl.best),
		rawPoints: raw(pl.points), rawPassive: raw(pT.passiveGeneration),
		prevGain: f(pT.resetGain), prevPassive: f(pT.passiveGeneration),
		prevBuy11: (pl.buyables && pl.buyables[11] ? pl.buyables[11].toString() : "-"),
		prevUpg12: !!(pl.upgrades && pl.upgrades.includes(12)),
		ownReq: f(sT.requires), ownUnlocked: !!sl.unlocked, ownPrestiged: !!sl.prestiged,
		ownGain: f(sT.resetGain), ownPassive: f(sT.passiveGeneration),
		dlReq: (typeof MP_REQ_TABLE !== "undefined" ? "table" : "formula")
		}, null, 1)
	})()`))
	} catch (e) { console.log("诊断失败 " + e) }
}
const times = rows.filter((r) => r.dtMin !== null).map((r) => r.dtMin)
const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0
if (rebirths.length) {
	console.log("\n真转生 " + rebirths.length + " 次：" + rebirths.map((r) => "t=" + r.atMin + "m(首通" + r.done + "/" + N + ")").join("  "))
}
const finalState = ctx.__eval(`(function(){
	const f = (d) => d && d.log10 ? (d.isFinite && d.isFinite() ? d.log10().toNumber().toFixed(2) : "inf") : "none"
	const mp = MODPACK
	return JSON.stringify({
		rounds: (player.rebirth && player.rebirth.rounds) || 0,
		claimed: (player.rebirth && player.rebirth.claimed) || 0,
		cr: { unlocked: !!player.cr.unlocked, prest: !!player.cr.prestiged, best: f(player.cr.best) },
		ig: { unlocked: !!player.ig.unlocked, prest: !!player.ig.prestiged, pts: f(player.ig.points) }
	})
})()`)
console.log("终态 " + finalState)
console.log("\n首通 " + done + "/" + N + "  总耗时 " + (prev / 60).toFixed(2) + " 小时  均每层 " + avg.toFixed(1) + " 分钟  wall " + ((Date.now() - t0) / 1000).toFixed(0) + "s")
