(function () {
	const _k = ["\u6211\u6c38\u8fdc\u559c\u6b22", "\u5e84\u65b9\u5b9c"].join("")
	const _e = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x !== undefined) n.textContent = x; return n }
	const _o = () => document.getElementById("_egg_o")
	const _i = () => document.getElementById("_egg_in")
	const _w = (t, c) => { const o = _o(); if (!o) return; o.appendChild(_e("div", "eggline " + (c || ""), t)); o.scrollTop = o.scrollHeight }
	const _ls = () => Object.keys(layers).filter(l => player[l] && player[l].points !== undefined)
	const _ids = () => _ls().filter(l => l !== "shop")
	const _cfg = l => (typeof MODPACK !== "undefined" ? MODPACK.find(c => c.id === l) : null)
	let _ok = false
	const _hist = []
	let _hi = -1
	const _num = (s, d) => { let n = new Decimal(s === undefined ? d : s); if (n.toString() === "NaN") throw new Error(); return n }
	const _show = () => {
		let b = document.getElementById("_egg_box")
		if (!b) {
			b = _e("div", "eggbox")
			b.id = "_egg_box"
			b.innerHTML = '<div class="egghead"><span>系统控制台</span><button onclick="eggClose()">×</button></div><div class="eggo" id="_egg_o"></div><div class="eggrow"><span>&gt;</span><input id="_egg_in" autocomplete="off" spellcheck="false" placeholder="输入 help"></div>'
			document.body.appendChild(b)
			_i().addEventListener("keydown", e => {
				if (e.key === "Enter") eggRun()
				else if (e.key === "ArrowUp") { e.preventDefault(); if (!_hist.length) return; _hi = Math.min(_hi + 1, _hist.length - 1); _i().value = _hist[_hist.length - 1 - _hi] }
				else if (e.key === "ArrowDown") { e.preventDefault(); if (_hi <= 0) { _hi = 0; _i().value = ""; return } _hi--; _i().value = _hist[_hist.length - 1 - _hi] }
				else if (e.key === "Tab") { e.preventDefault(); _complete() }
				else if (e.ctrlKey && (e.key === "l" || e.key === "L")) { e.preventDefault(); _clear() }
			})
			_o().addEventListener("click", e => {
				const t = e.target && e.target.closest ? e.target.closest(".eggcmd") : null
				if (!t) return
				_i().value = t.textContent.replace(/^>\s*/, "")
				_i().focus()
			})
			_w("控制台已连接。输入 help 查看指令。", "eggok")
		}
		b.style.display = "block"
		setTimeout(() => _i().focus(), 30)
	}
	const _hide = () => { const b = document.getElementById("_egg_box"); if (b) b.style.display = "none"; return "" }
	const _help = () => [
		"help / ?                 查看指令",
		"give <层> <数量>         增加某层资源",
		"log <数量>               增加原木",
		"rp <层> <数量>           增加研究点",
		"time <小时>              推进游戏时间",
		"skip <层>                直接补满该层施工",
		"unlock <层>              解锁某层",
		"unlockall                解锁全部层",
		"auto <层>                解锁该层自动化",
		"deep [层] [数量]         查看深层反哺 / 提升 everBest",
		"reset <层>               执行一次声望",
		"god                      给所有层加资源",
		"cap <层>                 查看软上限",
		"build <层>               查看该层施工进度",
		"best <层>                查看资源 / best / everBest",
		"ls [前缀]                列出层",
		"stat                     查看全局状态",
		"save                     立即保存",
		"clear                    清空输出",
		"reload                   重新加载",
		"close                    关闭控制台",
		"↑/↓ 历史 · Tab 补全 · Ctrl+L 清屏"
	].join("\n")
	const _give = a => {
		const l = a[0], n = _num(a[1], "1e9")
		if (!player[l] || player[l].points === undefined) return "未知层：" + (l || "")
		player[l].points = player[l].points.add(n)
		if (player[l].best) player[l].best = player[l].best.max(player[l].points)
		updateTempAfterAction(l)
		return l + " +" + n.toString()
	}
	const _log = a => {
		const n = _num(a[0], "1e9")
		player.points = player.points.add(n)
		updateTempAfterAction("p")
		return "原木 +" + n.toString()
	}
	const _time = a => {
		const h = Number(a[0])
		if (!isFinite(h) || h < 0) return "时间必须是正数"
		const s = h * 3600
		player.timePlayed += s
		for (const l of _ls()) if (player[l].resetTime !== undefined) player[l].resetTime += s
		updateTemp()
		return "推进 " + h + " 小时"
	}
	const _unlock = a => {
		const l = a[0]
		if (!player[l]) return "未知层"
		player[l].unlocked = true
		if (player[l].resetTime !== undefined) player[l].resetTime = 0
		needCanvasUpdate = true
		return "已解锁：" + l
	}
	const _all = () => { for (const l of _ls()) { player[l].unlocked = true; if (player[l].resetTime !== undefined) player[l].resetTime = 0 } needCanvasUpdate = true; return "已解锁全部层" }
	const _cap = a => {
		const l = a[0]
		if (!tmp[l]) return "未知层"
		return l + " 软上限 " + (tmp[l].softcap ? format(tmp[l].softcap) : "无")
	}
	const _reset = a => {
		const l = a[0]
		if (!layers[l]) return "未知层"
		if (!canReset(l)) return "当前条件不足"
		doReset(l)
		return "已执行声望：" + l
	}
	const _god = () => {
		for (const l of _ls()) {
			player[l].points = player[l].points.add("1e12")
			if (player[l].best) player[l].best = player[l].best.max(player[l].points)
		}
		player.points = player.points.add("1e12")
		updateTemp()
		return "已为所有层注入资源"
	}
	const _rp = a => {
		const l = a[0], n = _num(a[1], "1e3")
		if (!player[l] || player[l].research === undefined) return "该层没有研究点"
		player[l].research = player[l].research.add(n).max(0)
		updateTempAfterAction(l)
		return l + " 研究点 +" + n.toString()
	}
	const _skip = a => {
		const l = a[0]
		const c = _cfg(l)
		if (!player[l] || player[l].resetTime === undefined) return "未知层"
		if (!c) return "该层没有施工"
		if (!player[l].unlocked) return "该层尚未解锁"
		mpBuildComplete(c)
		updateTempAfterAction(l)
		needCanvasUpdate = true
		return "已补满施工：" + l
	}
	const _auto = a => {
		const l = a[0]
		if (!_ids().includes(l) || !player.shop) return "未知层"
		Vue.set(player.shop.owns, l, true)
		Vue.set(player.shop.autoBuy, l, true)
		Vue.set(player.shop.autoPrestigeLayer, l, true)
		updateTempPartial(["shop"])
		needCanvasUpdate = true
		return "已解锁自动化：" + l
	}
	const _deep = a => {
		if (!a[0]) return "深层反哺 ×" + format(depthBaseMult())
		const l = a[0], n = _num(a[1], "1e6")
		if (!player[l] || player[l].everBest === undefined) return "未知层"
		player[l].everBest = player[l].everBest.max(n)
		refreshDepthBaseMult()
		updateTemp()
		return l + " everBest = " + format(player[l].everBest) + " · 深层反哺 ×" + format(depthBaseMult())
	}
	const _list = a => {
		const p = (a[0] || "").toLowerCase()
		const list = _ids().filter(l => !p || l.toLowerCase().indexOf(p) === 0)
		if (!list.length) return "没有匹配的层"
		return list.map(l => l + " · " + (layers[l].name || "") + " · " + (player[l].unlocked ? "已解锁" : "锁定") + (player[l].prestiged ? " · 已首通" : "") + " · " + format(player[l].points)).join("\n")
	}
	const _stat = () => {
		const raw = (typeof getModID === "function" && localStorage.getItem(getModID())) || ""
		const chain = (typeof CHAIN_IDS !== "undefined" ? CHAIN_IDS : _ids())
		const unlocked = chain.filter(l => player[l] && player[l].unlocked).length
		const ach = (player.a && player.a.achievements) ? player.a.achievements.length : 0
		return [
			"版本 " + VERSION.num + "「" + VERSION.name + "」",
			"层 " + unlocked + " / " + chain.length + " · 成就 " + ach + " / " + ACH_TOTAL,
			"原木 " + format(player.points) + " · 每秒 " + format(tmp.pointGen),
			"深层反哺 ×" + format(depthBaseMult()),
			"回退下限 " + (player.resetFloor || 0),
			"游玩 " + formatTime(player.timePlayed),
			"存档 " + raw.length + " 字节 · 自动保存 " + (options.autosave ? "开" : "关")
		].join("\n")
	}
	const _best = a => {
		const l = a[0]
		if (!player[l] || player[l].points === undefined) return "未知层"
		const d = player[l]
		const out = [
			l + " " + (layers[l].name || ""),
			"资源 " + format(d.points) + " · best " + format(d.best || 0) + " · everBest " + format(d.everBest || 0)
		]
		if (d.resetTime !== undefined) out.push("已等待 " + formatTime(d.resetTime))
		if (d.research !== undefined) out.push("研究点 " + formatWhole(d.research))
		return out.join("\n")
	}
	const _build = a => {
		const l = a[0]
		if (!player[l] || player[l].resetTime === undefined) return "该层没有施工"
		const c = _cfg(l)
		if (!c) return "该层没有施工"
		const need = mpBuildNeed(c)
		const spent = mpBuildSpent(c)
		const pct = Math.round(mpBuildProgress(c) * 100)
		return l + " 施工 " + pct + "% · 已投入 " + format(spent) + " / " + format(need) +
			" · 收益 " + Math.round(mpBuildGainMult(c) * 100) + "%" +
			(player[l].prestiged ? " · 已首通" : "")
	}
	const _save = () => { save(true); return "已保存" }
	const _clear = () => { _o().innerHTML = ""; return "" }
	const _reload = () => { location.reload(); return "" }
	const _complete = () => {
		const v = _i().value
		const p = v.split(/\s+/)
		if (p.length < 2) {
			const hits = Object.keys(_c).filter(k => k.indexOf(v.toLowerCase()) === 0)
			if (hits.length === 1) _i().value = hits[0] + " "
			else if (hits.length > 1) _w(hits.join("  "), "eggok")
			return
		}
		const cmd = p[0].toLowerCase()
		if (["give", "unlock", "reset", "cap", "best", "build", "wall", "rp", "research", "skip", "auto", "deep", "depth"].indexOf(cmd) < 0) return
		const q = (p[1] || "").toLowerCase()
		const hits = _ids().filter(l => l.toLowerCase().indexOf(q) === 0)
		if (hits.length === 1) { p[1] = hits[0]; _i().value = p.join(" ") + " " }
		else if (hits.length > 1) _w(hits.join("  "), "eggok")
	}
	const _c = { help: _help, "?": _help, give: _give, log: _log, rp: _rp, research: _rp, time: _time, skip: _skip, unlock: _unlock, unlockall: _all, auto: _auto, deep: _deep, depth: _deep, reset: _reset, god: _god, cap: _cap, build: _build, wall: _build, best: _best, ls: _list, stat: _stat, save: _save, clear: _clear, reload: _reload, close: _hide }
	window.eggGate = function () {
		if (_ok) { _show(); return }
		const v = prompt("访问口令")
		if (v === null) return
		if (v.trim() !== _k) { alert("口令错误"); return }
		_ok = true
		_mark()
		_show()
	}
	// 解锁后把菜单里那个按钮的字换掉，免得还像没开过
	const _mark = () => {
		const bs = document.querySelectorAll('button[onclick="eggGate()"]')
		for (const b of bs) b.textContent = "系统控制台"
	}
	window.eggUnlocked = () => _ok
	if (_ok) _mark()
	window.eggClose = _hide
	window.eggRun = function () {
		const s = _i().value.trim()
		if (!s) return
		_i().value = ""
		_hist.push(s)
		_hi = -1
		_w("> " + s, "eggcmd")
		const p = s.split(/\s+/)
		const f = _c[p[0].toLowerCase()]
		if (!f) { _w("未知指令。输入 help 查看。", "eggerr"); return }
		try { const r = f(p.slice(1)); if (r) _w(r) } catch (e) { _w("执行失败。", "eggerr") }
	}
})()
