(function () {
	const _k = ["\u6211\u6c38\u8fdc\u559c\u6b22", "\u5e84\u65b9\u5b9c"].join("")
	const _e = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x !== undefined) n.textContent = x; return n }
	const _o = () => document.getElementById("_egg_o")
	const _i = () => document.getElementById("_egg_in")
	const _w = (t, c) => { const o = _o(); if (!o) return; o.appendChild(_e("div", "eggline " + (c || ""), t)); o.scrollTop = o.scrollHeight }
	const _ls = () => Object.keys(layers).filter(l => player[l] && player[l].points !== undefined)
	const _num = (s, d) => { let n = new Decimal(s === undefined ? d : s); if (n.toString() === "NaN") throw new Error(); return n }
	const _show = () => {
		let b = document.getElementById("_egg_box")
		if (!b) {
			b = _e("div", "eggbox")
			b.id = "_egg_box"
			b.innerHTML = '<div class="egghead"><span>系统控制台</span><button onclick="eggClose()">×</button></div><div class="eggo" id="_egg_o"></div><div class="eggrow"><span>&gt;</span><input id="_egg_in" autocomplete="off" spellcheck="false" placeholder="输入 help"></div>'
			document.body.appendChild(b)
			_i().addEventListener("keydown", e => { if (e.key === "Enter") eggRun() })
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
		"time <小时>              推进时间墙",
		"unlock <层>              解锁某层",
		"unlockall                解锁全部层",
		"cap <层>                 查看软/硬上限",
		"reset <层>               执行一次声望",
		"god                      给所有层加资源",
		"save                     立即保存",
		"clear                    清空输出",
		"reload                   重新加载",
		"close                    关闭控制台"
	].join("\n")
	const _give = a => {
		const l = a[0], n = _num(a[1], "1e9")
		if (!player[l] || player[l].points === undefined) return "未知层：" + (l || "")
		player[l].points = player[l].points.add(n)
		if (player[l].best) player[l].best = player[l].best.max(player[l].points)
		updateTemp()
		return l + " +" + n.toString()
	}
	const _log = a => {
		const n = _num(a[0], "1e9")
		player.points = player.points.add(n)
		updateTemp()
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
		return l + " 软上限 " + (tmp[l].softcap ? format(tmp[l].softcap) : "无") + " / 硬上限 " + (tmp[l].hardcap ? format(tmp[l].hardcap) : "无")
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
	const _save = () => { save(true); return "已保存" }
	const _clear = () => { _o().innerHTML = ""; return "" }
	const _reload = () => { location.reload(); return "" }
	const _c = { help: _help, "?": _help, give: _give, log: _log, time: _time, unlock: _unlock, unlockall: _all, cap: _cap, reset: _reset, god: _god, save: _save, clear: _clear, reload: _reload, close: _hide }
	window.eggGate = function () {
		const v = prompt("访问口令")
		if (v === null) return
		if (v.trim() !== _k) { alert("口令错误"); return }
		_show()
	}
	window.eggClose = _hide
	window.eggRun = function () {
		const s = _i().value.trim()
		if (!s) return
		_i().value = ""
		_w("> " + s, "eggcmd")
		const p = s.split(/\s+/)
		const f = _c[p[0].toLowerCase()]
		if (!f) { _w("未知指令。输入 help 查看。", "eggerr"); return }
		try { const r = f(p.slice(1)); if (r) _w(r) } catch (e) { _w("执行失败。", "eggerr") }
	}
})()
