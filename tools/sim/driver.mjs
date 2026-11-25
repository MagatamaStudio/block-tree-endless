// 自动玩法：尽量用游戏自带的自动化（商店买断 → 自动购买 + 自动声望），
// 脚本只补游戏不自动做的部分：点树、投施工、押注、真转生、花记忆。
export function makeDriver(ctx, opts = {}) {
	const useWager = opts.wager !== false
	const pct = opts.pct === undefined ? 0.6 : opts.pct
	const stats = { prestiges: 0, wagers: 0, wagerWins: 0 }
	const evalIn = (code) => ctx.__eval(code)
	const MODPACK = evalIn("MODPACK")
	const order = ["p", "s", "i", "d", "n", "e"].concat(MODPACK.map((c) => c.id))
	const modIds = new Set(MODPACK.map((c) => c.id))
	// 一次 tick 是 1 秒真实时间；canClick 的冷却也是真实时间 150ms，所以每个 tick
	// 最多 6 下点击（≈持续点满的人）。只点 1 下的话，200× 加速下原木收入会被
	// 压低三个数量级，开局会假卡死。
	const CLICKS_PER_TICK = opts.clicksPerTick === undefined ? 6 : opts.clicksPerTick
	// 世界词条默认不抽：随机词条（静默＝自动购买全失效 / 贫瘠＝需求 ×1.3）
	// 单局就能把仿真打到 0 层或 1.10 倍卡死，对照实验必须先关掉。要模拟抽词条传 world: true。
	const useWorld = opts.world === true
	function clickGather() {
		try {
			if (!ctx.player.p.unlocked) return
			// 直接调 onClick：canClick 用的是游戏内虚拟时钟，而 tick 里灌进去的
			// 是宿主时钟，两者差 3 年，走 canClick 只会在第一下之后永久锁死。
			for (let n = 0; n < CLICKS_PER_TICK; n++) ctx.layers.p.clickables[11].onClick()
		} catch (e) {}
	}

	function shopStep() {
		const shop = ctx.player.shop
		if (!shop.owns) ctx.Vue.set(shop, "owns", {})
		if (!shop.autoBuy) ctx.Vue.set(shop, "autoBuy", {})
		if (!shop.autoPrestigeLayer) ctx.Vue.set(shop, "autoPrestigeLayer", {})
		for (const id of order) {
			const data = ctx.player[id]
			if (!data || !data.prestiged) continue
			if (!shop.owns[id]) {
				try { ctx.shopBuy(id) } catch (e) {}
			}
			if (shop.owns[id]) {
				if (!shop.autoBuy[id]) ctx.Vue.set(shop.autoBuy, id, true)
				if (!shop.autoPrestigeLayer[id]) ctx.Vue.set(shop.autoPrestigeLayer, id, true)
			}
		}
		if (shop.autoPrestige !== true) shop.autoPrestige = true
	}

	// 手动过渡期：每层先攒够 2× 需求买自动化，买完交给游戏自己跑。
	// 关键约束：声望高层会把低层资源清零，所以低层还没买自动化时不许动高层。
	function shopCostOf(id) {
		try { return ctx.shopCost({ target: id, currency: id }) } catch (e) { return null }
	}
	function canTouch(id) {
		const row = ctx.tmp[id] ? ctx.tmp[id].row : NaN
		if (isNaN(row)) return true
		for (const low of order) {
			if (low === id) continue
			const t = ctx.tmp[low]
			if (!t || isNaN(t.row) || t.row >= row) continue
			if (ctx.player.shop.owns && ctx.player.shop.owns[low]) continue
			const cost = shopCostOf(low)
			if (cost && ctx.player[low].points.lt(cost)) return false
		}
		return true
	}
	function bootstrapPrestige() {
		// 只重置「最高的那一层」：高层声望收益更大，且 doReset 只清本层及以下，
		// 不会动更高层（旧版按 LAYERS[id].row 取行号，MODPACK 层全是 0，
		// top 永远选中 vanilla 层，首通被拖到 churn 停顿才发生，已改用 tmp 行号）。
		let top = null
		for (const id of order) {
			if (!ctx.player[id] || !ctx.player[id].unlocked || !ctx.tmp[id]) continue
			const t = ctx.tmp[id]
			if (t.type === "none") continue
			if (!t.canReset || !t.resetGain || t.resetGain.lt(1)) continue
			const row = t.row
			if (isNaN(row)) continue
			if (!top || row > top.row) top = { id, row }
		}
		if (!top) return
		const id = top.id
		// 游戏自己的自动声望能处理就不插手
		let autoOk = false
		try { autoOk = ctx.shopAutoPrestigeReady(id) } catch (e) { autoOk = false }
		if (autoOk) return
		// 真人玩家：按钮亮了就点，不做任何「攒池让位」（旧 gateHold 要求池子攒到
		// 3×下一层需求才放行，而池子只能靠这次被扣住的声望增长 → 自锁 50 分钟，
		// b/te/wi 的 51 分钟卡死全是它，已删）。
		if (!canTouch(id)) return
		try { ctx.doReset(id); stats.prestiges++ } catch (e) {}
	}

	function investStep() {
		if (!ctx.player.shop) return
		for (const cfg of MODPACK) {
			const data = ctx.player[cfg.id]
			if (!data || !data.unlocked || data.prestiged) continue
			let remain
			try { remain = ctx.mpBuildRemain(cfg) } catch (e) { continue }
			if (!remain || remain.lte(0)) continue
			const prev = ctx.player[cfg.prev]
			if (!prev) continue
			// 留住 2 倍需求：自动声望阈值是 1.5 倍，投干净会把上一层卡在门槛下
			// （改成只留 1 倍会让全程都变慢，早段尤其明显，别动）
			const keep = ctx.dReq(cfg.requires).times(2)
			const spare = prev.points.sub(keep).max(0)
			if (spare.lte(0)) continue
			try { ctx.mpBuildInvest(cfg, remain.min(spare)) } catch (e) {}
		}
	}

	function wagerStep() {
		if (!useWager) return
		for (const cfg of MODPACK) {
			const data = ctx.player[cfg.id]
			if (!data || !data.unlocked || data.prestiged) continue
			let avail = false
			try { avail = ctx.mpWagerAvailable(cfg) } catch (e) { continue }
			if (!avail) continue
			const stake = ctx.mpWagerStake(cfg, pct)
			if (!stake || stake.lte(0)) continue
			let win = false
			try { win = ctx.mpWager(cfg, pct) } catch (e) {}
			stats.wagers++
			if (win) stats.wagerWins++
		}
	}

	const TRACK_ORDER = ["flow", "passive", "yield", "wall", "auto", "kit", "soft", "depth"]

	function memoryStep() {
		if (!ctx.player.rebirth) return
		let claimable = 0
		try { claimable = ctx.rebirthClaimable() } catch (e) { return }
		let guard = 0
		while (guard++ < 200) {
			const avail = evalIn("rebirthAvailable()")
			if (!avail || avail <= 0) break
			let best = null
			let bestCost = Infinity
			for (const key of TRACK_ORDER) {
				let ok = false
				try { ok = evalIn("rebirthBuy && REBIRTH_TRACKS." + key + ".cost(rebirthLevel('" + key + "')) <= rebirthAvailable() && rebirthLevel('" + key + "') < REBIRTH_TRACKS." + key + ".max") } catch (e) { ok = false }
				if (!ok) continue
				const cost = evalIn("REBIRTH_TRACKS." + key + ".cost(rebirthLevel('" + key + "'))")
				if (cost < bestCost) { bestCost = cost; best = key }
			}
			if (!best) break
			try { ctx.rebirthBuy(best) } catch (e) { break }
		}
	}

	function worldModStep() {
		if (!useWorld) return
		if (typeof ctx.worldModPending !== "function") return
		let pending = false
		try { pending = ctx.worldModPending() } catch (e) { return }
		if (!pending) return
		try { ctx.worldModChoose(0) } catch (e) {}
	}

	// 满 30 层首通即可真转生
	function rebirthStep() {
		let cleared = 0
		try { cleared = ctx.rebirthClearedCount() } catch (e) { return false }
		if (cleared < 30) return false
		let claimable = 0
		try { claimable = ctx.rebirthClaimable() } catch (e) { return false }
		if (!claimable || claimable <= 0) return false
		try { ctx.rebirthClaim() } catch (e) { return false }
		worldModStep()
		memoryStep()
		return true
	}

	// 模组层挑战：首通并买到自动化后再打，避免把升级期的资源清零。
	// 进挑战会把本层 points/best 清零（mpChallengeStart），期间全局自动声望冻结，
	// 点数只靠本层自动产出涨。自动产出在 2 个游戏小时内刷不到目标就开挑战
	// ＝永久卡死（wi 层事故：passive 0 进挑战，best 清零，an 永远断粮）。
	// 真人只在「挂机刷得完」时才开挑战，模拟同此门槛。
	function challengeStep() {
		if (opts.challenges === false) return
		for (const cfg of MODPACK) {
			const data = ctx.player[cfg.id]
			if (!data || !data.unlocked) continue
			const active = ctx.mpActiveChallenge(cfg)
			if (active) {
				const slot = Number(data.activeChallenge)
				const goal = ctx.mpChallengeGoal(cfg, slot)
				if (data.points.gte(goal)) {
					// 真人完成路径：再点一次挑战按钮（canExit → completeChallenge
					// 记数 + onExit 恢复点数/best），不靠 doReset 顺带完成
					try { ctx.startChallenge(cfg.id, slot) } catch (e) {}
				}
				continue
			}
			if (!data.prestiged) continue
			if (!ctx.player.shop.owns || !ctx.player.shop.owns[cfg.id]) continue
			const slot = [11, 12, 13].find((s) => {
				try { return ctx.challengeCompletions(cfg.id, s) < 1 } catch (e) { return false }
			})
			if (!slot) continue
			const goal = ctx.mpChallengeGoal(cfg, slot)
			if (!goal || goal.lte(0)) continue
			const rate = ctx.tmp[cfg.id] ? ctx.tmp[cfg.id].passiveGeneration : null
			if (!rate || !rate.gt(0)) continue
			if (goal.div(rate).gt(7200)) continue
			if (!data.best || data.best.lt(goal.times(3))) continue
			try { ctx.startChallenge(cfg.id, slot) } catch (e) {}
		}
	}

	// 替玩家点升级和设施：见啥买啥（reserve = null）。
	// 游戏自带的自动购买会「预留下一层声望所需的资源」，那条规则会把基层卡死：
	// p 的升级只要 5 木板，而 reserve 是 s 层的 300 木板，于是自动化一开就再也不买。
	// 真人玩家不会盯着 300 木板不花，所以模拟里一律按手动买。
	function manualBuy() {
		for (const id of order) {
			if (!ctx.player[id] || !ctx.player[id].unlocked || !ctx.tmp[id]) continue
			if (ctx.tmp[id].type === "none") continue
			const reserve = null
			try { ctx.autobuyUpgrades(id, reserve) } catch (e) {}
			try { ctx.autobuyBuyables(id, reserve) } catch (e) {}
		}
	}

	// 节奏层：命中窗口只占一圈的 18–22%，挂机永远敲不中，真人基本每圈都中。
	// 模拟按「每圈必中」处理：把相位摆到窗口中心再敲，直到敲满这一档。
	function rhythmStep() {
		if (typeof ctx.mpRhythmTap !== "function") return
		for (const cfg of MODPACK) {
			if (cfg.struct !== "rhythm") continue
			const data = ctx.player[cfg.id]
			if (!data || (!data.unlocked && !data.prestiged)) continue
			let tune
			try { tune = ctx.mpRhythmTune(cfg) } catch (e) { continue }
			let hits = Math.max(0, Math.floor(Number(data.rhyHits) || 0))
			let guard = 0
			while (hits < tune.hits && guard++ < 40) {
			const period = tune.period
				const cyc = Math.floor((Number(data.rhyT) || 0) / period) + 1
				ctx.Vue.set(data, "rhyT", (cyc + 0.5) * period)
				ctx.Vue.set(data, "rhyLast", -1e9)
				try { if (!ctx.mpRhythmTap(cfg)) break } catch (e) { break }
				hits = Math.max(0, Math.floor(Number(data.rhyHits) || 0))
			}
		}
	}

	// 各结构层的「操作」。游戏不替玩家做这些，模拟里按最优玩法补上：
	// blueprint/grid 贪心点亮邻格最多的格子，market 低买高卖，recipe 开自动合成，
	// alloc 把份额推到成品上限。不补的话这些层产量恒为 ×1，会假性卡死。
	function neighborScore(edges, cells, i) {
		let n = 0
		for (const e of edges) {
			if (e[0] === i && cells[e[1]]) n++
			else if (e[1] === i && cells[e[0]]) n++
		}
		return n
	}

	function structStep() {
		const defs = typeof ctx.MODPACK !== "undefined" ? ctx.MODPACK : MODPACK
		for (const cfg of defs) {
			const data = ctx.player[cfg.id]
			if (!data || (!data.unlocked && !data.prestiged)) continue
			try { playStruct(cfg, data) } catch (e) {}
		}
	}

	function playStruct(cfg, data) {
		if (cfg.struct === "blueprint") {
			const edges = evalIn("MP_BLUE_EDGES")
			const cells = ctx.mpBlueCells(cfg)
			let guard = 0
			while (!ctx.mpBlueDone(cfg) && guard++ < 12) {
				let pick = -1, best = -1
				for (let i = 0; i < 9; i++) {
					if (cells[i]) continue
					const s = neighborScore(edges, cells, i)
					if (s > best) { best = s; pick = i }
				}
				if (pick < 0 || !ctx.mpBluePlace(cfg, pick)) break
			}
			return
		}
		if (cfg.struct === "grid") {
			const edges = evalIn("MP_GRID_EDGES")
			const cells = ctx.mpGridCells(cfg)
			const tune = ctx.mpGridTune(cfg)
			let guard = 0
			while (ctx.mpGridLit(cfg) < tune.limit && guard++ < 40) {
				let pick = -1, best = -1
				for (let i = 0; i < cells.length; i++) {
					if (cells[i]) continue
					const s = neighborScore(edges, cells, i)
					if (s > best) { best = s; pick = i }
				}
				if (pick < 0 || !ctx.mpGridPlace(cfg, pick)) break
			}
			return
		}
		if (cfg.struct === "recipe") {
			if (Number(data.recipeAuto) !== 1) ctx.Vue.set(data, "recipeAuto", 1)
			return
		}
		if (cfg.struct === "market") {
			const tune = ctx.mpMarketTune(cfg)
			const unit = cfg.req * tune.spread
			// 套利进度封顶后不再进货：非点数线的本金不退（设计上的「点数黑洞」），
			// 一直买卖等于把下一层首通要用的本层点数烧掉，末段会自己锁死。
			const capped = ctx.mpMarketProgress(cfg) >= 0.999
			let guard = 0
			while (guard++ < 30) {
				const st = ctx.mpMarketState(cfg)
				let did = false
				for (let i = 0; i < 3; i++) {
					const price = ctx.mpMarketPrice(cfg, i)
					if (st.hands[i] > 0) {
						const avg = st.basis[i] / (st.hands[i] * unit)
						if (price > avg * 1.02) { ctx.mpMarketSell(cfg, i); did = true }
					} else if (!capped && price < 0.9) {
						if (ctx.mpMarketBuy(cfg, i)) did = true
					}
				}
				if (!did) break
			}
			return
		}
		if (cfg.struct === "alloc") {
			const caps = ctx.mpAllocCaps(cfg)
			const cap2 = caps[2]
			if (cap2 <= 1 / 3 + 0.01) return
			const s2 = Math.round(Math.min(cap2, 0.8) * 100)
			let s0 = Math.floor((100 - s2) / 2)
			const s1 = 100 - s2 - s0
			const shares = [s0, s1, s2]
			const cur = ctx.mpAllocShares(cfg)
			if (Math.abs(cur[2] - s2) < 1) return
			ctx.Vue.set(data, "allocMode", 1)
			ctx.Vue.set(data, "allocShares", shares)
			return
		}
	}

	// 专精：v11.9 起它是每层一次的真实选择，代理也按默认档选（opts.spec 可改：0 不选、1 产能、2 施工、3 声望）
	const specChoice = opts.spec === undefined ? 1 : Number(opts.spec)
	function specStep() {
		if (!specChoice) return
		for (const id of modIds) {
			const d = ctx.player[id]
			if (d && d.unlocked && !d.spec) {
				try { ctx.setSpecialization(id, specChoice) } catch (e) {}
			}
		}
	}

	function tick() {
		clickGather()
		shopStep()
		specStep()
		rhythmStep()
		structStep()
		manualBuy()
		bootstrapPrestige()
		investStep()
		wagerStep()
		challengeStep()
		if (rebirthStep()) return "rebirth"
		return null
	}

	return { tick, stats, evalIn, order, modIds }
}
