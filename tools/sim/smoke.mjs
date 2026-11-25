// 冒烟测试：把游戏真正跑起来，跑几十格，检查「能启动、36 层都在、能推进、没有 NaN」。
// 用法：node tools/sim/smoke.mjs        （CI 与本地都用这一条，失败退出码 1）
import { buildEnv } from "./env.mjs"
import { makeDriver } from "./driver.mjs"

const CHAIN = ["p", "s", "i", "d", "n", "e"]
const fails = []
function check(ok, label, detail) {
	if (ok) {
		console.log("  ✓ " + label)
	} else {
		fails.push(label + (detail ? "：" + detail : ""))
		console.log("  ✗ " + label + (detail ? "：" + detail : ""))
	}
}

const env = buildEnv({ log: () => {} })
const ctx = env.sandbox
ctx.__eval = env.eval
ctx.load()
env.flushTimeouts()
ctx.makeParticles = () => {}
ctx.player.devSpeed = 10

console.log("1) 启动")
check(!!ctx.player, "player 已创建")
check(Object.keys(ctx.layers || {}).length >= 40, "层已注册", Object.keys(ctx.layers || {}).length + " 层")

console.log("2) 36 层链路完整")
const chain = ctx.__eval('["p","s","i","d","n","e"].concat(MODPACK.map(c => c.id))')
check(chain.length === 36, "链路 36 层", chain.length + " 层")
let missingLayer = []
let missingTmp = []
for (const id of chain) {
	if (!ctx.layers[id] || !ctx.player[id]) missingLayer.push(id)
	if (!ctx.tmp[id]) missingTmp.push(id)
}
check(missingLayer.length === 0, "每层都有定义", missingLayer.join(","))
check(missingTmp.length === 0, "每层都有 tmp", missingTmp.join(","))
const noStart = chain.filter((id) => !ctx.layers[id] || typeof ctx.layers[id].startData !== "function")
check(noStart.length === 0, "每层都有 startData", noStart.join(","))

console.log("3) 跑 60 分钟（约 360 格，带自动玩法代理）")
// 关掉主动转生、专精只测「不选」口径，避免冒烟被随机事件影响
ctx.rebirthClearedCount = () => 0
const driver = makeDriver(ctx, { spec: 0 })
const tick = env.getTick()
for (let i = 0; i < 360; i++) {
	env.advance(1000)
	tick()
	driver.tick()
}
const nan = ctx.__eval(`(function(){
	const bad = []
	const isBad = (x) => x && (isNaN(x.sign) || isNaN(x.mag) || isNaN(x.layer))
	if (isBad(player.points)) bad.push("player.points")
	for (const cfg of MODPACK) {
		const d = player[cfg.id]
		if (!d) continue
		if (isBad(d.points) || isBad(d.best)) bad.push(cfg.id)
	}
	return bad
})()`)
check(nan.length === 0, "没有 NaN", nan.join(","))

const vanillaDone = ctx.__eval('["p","s","i","d","n","e"].filter(function(id){ return player[id].prestiged }).length')
check(vanillaDone === 6, "原版六层全通", vanillaDone + "/6")

const modUnlocked = ctx.__eval('MODPACK.filter(function(c){ return player[c.id].unlocked }).length')
check(modUnlocked >= 1, "至少解开一层模组层", modUnlocked + " 层")

const modCleared = ctx.__eval('MODPACK.filter(function(c){ return player[c.id].prestiged }).length')
check(modCleared >= 1, "至少首通一层模组层", modCleared + " 层")

console.log("4) 资源串与版本一致")
const asset = ctx.__eval("VERSION.asset")
const fs = await import("node:fs")
const html = fs.readFileSync(new URL("../../index.html", import.meta.url), "utf8")
check(html.indexOf("?v=" + asset) >= 0, "index.html 引用了 VERSION.asset", "asset=" + asset)
check(html.indexOf("?v=" + asset) >= 0 && html.indexOf("?v=11.7") < 0, "没有残留旧版本号")

const t = ctx.__eval("format(player.points)")
console.log("\n末态：原木 " + t + " · 模组层 " + modCleared + "/30 首通")
if (fails.length) {
	console.log("\n冒烟失败 " + fails.length + " 项：")
	for (const f of fails) console.log("  - " + f)
	process.exit(1)
}
console.log("\n冒烟通过。")
process.exit(0)
