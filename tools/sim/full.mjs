// 跑满 36 层：关掉仿真代理自己的主动转生，量出「真正打完最后一层」要多久。
// 代理在 30 层满时会主动转生（rebirthStep），那一版能测轮次收益，但会把还差几分钟的
// 最后一层一起清掉，所以首通时长要用这个脚本量。
// 用法：node tools/sim/full.mjs --hours=7 --speed=10
import { buildEnv } from "./env.mjs"
import { makeDriver } from "./driver.mjs"

const argv = Object.fromEntries(
	process.argv.slice(2).map((a) => {
		const m = a.match(/^--([^=]+)=?(.*)$/)
		return m ? [m[1], m[2] || "true"] : [a, "true"]
	})
)
const hours = Number(argv.hours || 7)
const speed = Number(argv.speed || 10)

const env = buildEnv({})
const ctx = env.sandbox
ctx.__eval = env.eval
ctx.load()
env.flushTimeouts()
ctx.makeParticles = () => {}
ctx.player.devSpeed = speed
const gTick = env.getTick()
const driver = makeDriver(ctx, { spec: argv.spec === undefined ? 1 : Number(argv.spec) })
// 只屏蔽转生这一步，其余自动化照跑
ctx.rebirthClearedCount = () => 0

const order = ctx.__eval('["p","s","i","d","n","e"].concat(MODPACK.map(c => c.id))')
const cleared = new Array(order.length).fill(null)
const maxTicks = Math.round((hours * 3600) / speed)
for (let i = 1; i <= maxTicks; i++) {
	env.advance(1000)
	gTick()
	for (let k = 0; k < order.length; k++) {
		if (cleared[k] !== null) continue
		const d = ctx.player[order[k]]
		if (d && d.prestiged) cleared[k] = (i * speed) / 60
	}
	driver.tick()
}

let prev = 0
const rows = []
for (let k = 0; k < order.length; k++) {
	if (cleared[k] === null) {
		rows.push([order[k], "—", "—"])
		continue
	}
	const dt = cleared[k] - prev
	prev = cleared[k]
	rows.push([order[k], cleared[k].toFixed(1), "+" + dt.toFixed(1)])
}
for (const r of rows) console.log(r.join("\t"))
const done = cleared.filter((x) => x !== null)
const last = Math.max(...done)
console.log("末层完成 " + (last / 60).toFixed(2) + " 小时，共 " + done.length + "/" + order.length + " 层，均 " + (last / done.length).toFixed(1) + " 分钟")
