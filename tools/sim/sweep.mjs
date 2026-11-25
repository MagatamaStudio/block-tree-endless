// 参数扫掠：把某个全局旋钮乘上不同倍率，量全链时长，用来标定而不是盲试。
// 用法: node tools/sim/sweep.mjs --scales=0.85,1,1.15 --specs=0,1 --hours=13
//       （一组要跑 3–4 分钟，多组建议在后台开跑；16 核可以并行开几组）
import { buildEnv } from "./env.mjs"
import { makeDriver } from "./driver.mjs"

const argv = Object.fromEntries(
	process.argv.slice(2).map((a) => {
		const m = a.match(/^--([^=]+)=?(.*)$/)
		return m ? [m[1], m[2] || "true"] : [a, "true"]
	})
)
const scales = String(argv.scales === undefined ? "1" : argv.scales).split(",").map(Number)
const specs = String(argv.specs === undefined ? "0,1" : argv.specs).split(",").map(Number)
const hours = Number(argv.hours || 13)
const speed = Number(argv.speed || 10)

function runOne(scale, spec) {
	const env = buildEnv({})
	const ctx = env.sandbox
	ctx.__eval = env.eval
	ctx.load()
	env.flushTimeouts()
	ctx.makeParticles = () => {}
	ctx.player.devSpeed = speed
	// 唯一的旋钮：全模组层自动产出的底数（ARCHETYPES[*].passive）
	if (scale !== 1) env.eval(`for (const k in ARCHETYPES) ARCHETYPES[k].passive = ARCHETYPES[k].passive * ${scale}`)
	const gTick = env.getTick()
	const driver = makeDriver(ctx, { spec })
	ctx.rebirthClearedCount = () => 0
	const modIds = ctx.__eval('MODPACK.map(c => c.id)')
	const cleared = {}
	const maxTicks = Math.round((hours * 3600) / speed)
	for (let i = 1; i <= maxTicks; i++) {
		env.advance(1000)
		gTick()
		const t = (i * speed) / 60
		for (const id of modIds) {
			if (cleared[id] !== undefined) continue
			const d = ctx.player[id]
			if (d && d.prestiged) cleared[id] = t
		}
		driver.tick()
	}
	const done = Object.keys(cleared)
	const last = done.length ? Math.max(...done.map((k) => cleared[k])) : 0
	return { done: done.length, hours: last / 60, capped: done.length < modIds.length }
}

console.log("倍率 \\ spec\t" + specs.map((s) => "spec=" + s).join("\t"))
for (const scale of scales) {
	const cells = []
	for (const spec of specs) {
		const r = runOne(scale, spec)
		cells.push((r.capped ? "≥" : "") + r.hours.toFixed(2) + "h (" + r.done + ")")
	}
	console.log(scale.toFixed(2) + "\t" + cells.join("\t"))
}
process.exit(0)
