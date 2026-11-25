// 用 node:vm 把游戏真正跑起来：加载 index.html 里那串 js，喂一套最小 DOM 存根，
// 然后接管 setInterval 拿到主循环，用虚拟时钟一格=1 秒地推进。
// 目的：量「一轮真转生要多少模拟分钟」，不是重写数值。
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")

// 可复现的伪随机：同一 seed 下两次运行走同一串随机数
function mulberry32(seed) {
	let a = seed >>> 0
	return function () {
		a = (a + 0x6d2b79f5) >>> 0
		let t = a
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

const SCRIPTS = [
	"js/technical/break_eternity.js",
	"js/technical/layerSupport.js",
	"js/balance-spec.js",
	"js/mod.js",
	"js/technical/loader.js",
	"js/technical/temp.js",
	"js/technical/displays.js",
	"js/game.js",
	"js/utils.js",
	"js/utils/easyAccess.js",
	"js/technical/systemComponents.js",
	"js/components.js",
	"js/technical/canvas.js",
	"js/technical/particleSystem.js",
	"js/utils/NumberFormating.js",
	"js/utils/options.js",
	"js/utils/save.js",
	"js/utils/themes.js",
	"js/easter-egg.js",
]

let virtualNow = 1700000000000

function makeElement(tag = "div") {
	const el = {
		tagName: tag.toUpperCase(),
		style: { setProperty() {}, removeProperty() {}, getPropertyValue: () => "" },
		dataset: {},
		children: [],
		childNodes: [],
		classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
		attributes: {},
		scrollTop: 0,
		scrollLeft: 0,
		scrollHeight: 0,
		clientWidth: 1920,
		clientHeight: 1080,
		innerHTML: "",
		textContent: "",
		value: "",
		checked: false,
		offsetWidth: 0,
		offsetHeight: 0,
		setAttribute(k, v) { this.attributes[k] = v },
		getAttribute(k) { return this.attributes[k] ?? null },
		removeAttribute(k) { delete this.attributes[k] },
		appendChild(c) { this.children.push(c); this.childNodes.push(c); return c },
		insertBefore(c, ref) {
			const i = this.children.indexOf(ref)
			if (i < 0) this.children.push(c); else this.children.splice(i, 0, c)
			this.childNodes = this.children
			return c
		},
		removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c },
		addEventListener() {}, removeEventListener() {}, focus() {}, blur() {}, click() {},
		getBoundingClientRect() { return { top: 0, left: 0, width: 1920, height: 1080, bottom: 1080, right: 1920 } },
		getContext() { return ctx2d },
		querySelector: () => null,
		querySelectorAll: () => [],
	}
	return el
}

const ctx2d = new Proxy({}, { get: () => () => ({}) })

export function buildEnv({ log, transform, seed } = {}) {
	const opts = { seed }
	virtualNow = 1700000000000

	const sandbox = {}
	const context = vm.createContext(sandbox)

	const head = makeElement("head")
	const body = makeElement("body")

	const RealDate = Date
	const VDate = class extends RealDate {
		constructor(...a) { if (a.length === 0) super(virtualNow); else super(...a) }
		static now() { return virtualNow }
	}

	const timers = { intervals: [], timeouts: [] }

	const document = {
		hidden: false,
		body, head,
		documentElement: makeElement("html"),
		createElement: (t) => makeElement(t),
		createTextNode: (t) => ({ textContent: t }),
		getElementById: () => makeElement("div"),
		getElementsByTagName: () => [],
		getElementsByClassName: () => [],
		querySelector: () => null,
		querySelectorAll: () => [],
		addEventListener() {}, removeEventListener() {},
		createEvent: () => ({ initEvent() {} }),
	}

	const store = new Map()
	const localStorage = {
		getItem: (k) => (store.has(k) ? store.get(k) : null),
		setItem: (k, v) => { store.set(k, String(v)) },
		removeItem: (k) => { store.delete(k) },
		clear: () => store.clear(),
		key: (i) => [...store.keys()][i] ?? null,
		get length() { return store.size },
	}

	sandbox.console = log ? { log, warn() {}, error(...a) { log("[err] " + a.join(" ")) }, info() {} } : console
	// 固定种子：游戏里的暴击、押注、世界词条都用 Math.random，不锁种子的话
	// 同样的参数两次跑出 0 层和 25 层，对照实验没有意义。
	sandbox.Math = Object.create(Math)
	sandbox.Math.random = mulberry32(typeof opts.seed === "number" ? opts.seed : 20260101)
	sandbox.Date = VDate
	sandbox.document = document
	sandbox.localStorage = localStorage
	sandbox.navigator = { language: "zh-CN", userAgent: "node-sim", clipboard: { writeText() {} } }
	sandbox.location = { reload() {}, href: "http://sim/", search: "", hash: "" }
	sandbox.performance = { now: () => virtualNow }
	sandbox.innerWidth = 1920
	sandbox.innerHeight = 1080
	sandbox.devicePixelRatio = 1
	sandbox.alert = () => {}
	sandbox.confirm = () => true
	sandbox.btoa = (s) => Buffer.from(String(s), "binary").toString("base64")
	sandbox.atob = (s) => Buffer.from(String(s), "base64").toString("binary")
	sandbox.prompt = () => null
	sandbox.requestAnimationFrame = () => 0
	sandbox.cancelAnimationFrame = () => {}
	sandbox.getComputedStyle = () => ({ getPropertyValue: () => "" })
	sandbox.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} })
	sandbox.MutationObserver = class { observe() {} disconnect() {} }
	sandbox.addEventListener = () => {}
	sandbox.removeEventListener = () => {}
	sandbox.setTimeout = (fn, ms) => { timers.timeouts.push({ fn, ms }); return timers.timeouts.length }
	sandbox.clearTimeout = () => {}
	sandbox.setInterval = (fn, ms) => { timers.intervals.push({ fn, ms }); return timers.intervals.length }
	sandbox.clearInterval = () => {}
	sandbox.HTMLCanvasElement = class {}
	sandbox.Image = class { constructor() { this.style = {} } }
	sandbox.Audio = class { play() {} }
	sandbox.Decimal = undefined
	sandbox.window = sandbox
	sandbox.globalThis = sandbox
	sandbox.self = sandbox

	// Vue 存根：不渲染，只提供 TMT 用到的静态方法
	function Vue() { return { $mount() {}, $set() {}, $watch() {}, $forceUpdate() {}, $nextTick() {} } }
	Vue.set = (o, k, v) => { if (o) o[k] = v; return v }
	Vue.delete = (o, k) => { if (o) delete o[k] }
	Vue.nextTick = (cb) => { if (typeof cb === "function") timers.timeouts.push({ fn: cb, ms: 0 }) }
	Vue.component = () => {}
	Vue.mixin = () => {}
	Vue.filter = () => {}
	Vue.directive = () => {}
	Vue.use = () => {}
	sandbox.Vue = Vue

	// 让 loader.js 里的 createElement("script") + head.insertBefore 变成同步读盘
	const scriptQueue = []
	const origCreate = document.createElement
	document.createElement = (t) => {
		const el = origCreate(t)
		if (String(t).toLowerCase() === "script") {
			el.setAttribute = (k, v) => { el.attributes[k] = v; if (k === "src") scriptQueue.push(v) }
		}
		return el
	}
	head.insertBefore = (el, ref) => {
		if (el.tagName === "SCRIPT") {
			const src = el.attributes.src
			if (!src) return el
			loadFile(src.split("?")[0])
		}
		return el
	}

	function run(rel) {
		const file = path.join(ROOT, rel)
		let code = fs.readFileSync(file, "utf8")
		if (transform) code = transform(rel, code)
		vm.runInContext(code, context, { filename: file })
	}

	function loadFile(rel) { run(rel) }

	// 浏览器里 vue.min.js 有自己的作用域；这里用存根替代，其余按 index.html 顺序加载
	for (const f of SCRIPTS) {
		if (f.endsWith("vue.min.js")) continue
		try {
			run(f)
		} catch (e) {
			throw new Error("加载失败 " + f + "：" + e.message)
		}
	}

	return {
		context, sandbox, timers, document, head, body,
		eval: (code) => vm.runInContext(code, context),
		now: () => virtualNow,
		advance(ms) { virtualNow += ms },
		getTick() {
			const t = timers.intervals.find((i) => i.ms === 50)
			if (!t) throw new Error("没抓到 50ms 主循环")
			return t.fn
		},
		flushTimeouts(limit = 5) {
			for (let i = 0; i < limit && timers.timeouts.length; i++) {
				const job = timers.timeouts.shift()
				try { job.fn() } catch (e) { /* 弹窗之类，忽略 */ }
			}
		},
	}
}
