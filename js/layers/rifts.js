/* 裂隙：真实时间的限时事件，加速不会跳过窗口 */

function riftCardHTML() {
	const s = riftState()
	if (!s) return ""
	// 读一下 player.time，让倒计时每秒跟着主循环重绘（它本身不是响应式字段）
	if (typeof player !== "undefined") void player.time
	const now = Date.now()
	const parts = []

	if (s.type) {
		const type = RIFT_TYPES[s.type]
		const pct = Math.min(100, Math.round((s.progress / Math.max(1, s.goal)) * 100))
		const left = Math.max(0, Math.ceil((s.until - now) / 1000))
		parts.push(
			'<div class="rift-card" style="border-color:' + type.color + ';">' +
				'<div style="font-size:15px; margin-bottom:4px;"><b style="color:' + type.color + ';">' + type.name + '</b>' +
					'<span style="float:right;">剩余 <b>' + left + '</b> 秒</span></div>' +
				'<div style="font-size:13px; opacity:0.85; margin-bottom:6px;">' + type.desc + '</div>' +
				'<div class="rift-bar"><span style="width:' + pct + '%; background:' + type.color + ';"></span></div>' +
				'<div style="font-size:13px; margin-top:4px;">进度 ' + s.progress + " / " + s.goal + '</div>' +
				'<div style="font-size:13px; opacity:0.85; margin-top:2px;">奖励：' + type.reward + '</div>' +
			'</div>'
		)
	} else {
		const next = Math.max(0, Math.ceil((s.nextAt - now) / 1000))
		parts.push(
			'<div class="rift-card" style="border-color:rgba(255,255,255,0.16);">' +
				'<div style="font-size:14px;">附近暂时平静</div>' +
				'<div style="font-size:13px; opacity:0.85; margin-top:4px;">下一个裂隙约 <b>' + next + '</b> 秒后出现</div>' +
			'</div>'
		)
	}

	if (s.buffUntil > now) {
		const left = Math.ceil((s.buffUntil - now) / 1000)
		parts.push(
			'<div class="rift-card" style="border-color:#9adf75;">' +
				'<div style="font-size:14px;">当前增益：<b style="color:#9adf75;">全局产量 ×' + format(s.buffMult) + '</b></div>' +
				'<div style="font-size:13px; opacity:0.85; margin-top:2px;">来自「' + s.buffName + '」，剩余 <b>' + left + '</b> 秒</div>' +
			'</div>'
		)
	}

	parts.push(
		'<div style="font-size:13px; opacity:0.75; margin-top:6px;">完成 ' + s.won + ' 次 · 错过 ' + s.missed + ' 次' +
			'　（计时走真实时间，加速不会跳过窗口）</div>'
	)

	return '<div style="text-align:left; max-width:560px; margin:10px auto;">' + parts.join("") + '</div>'
}

function riftLayerShown() {
	return true
}

addLayer("rifts", {
	name: "裂隙",
	symbol: "裂隙",
	image: "img/chaos_shard.png",
	row: "side",
	position: 40,
	color: "#b06bff",

	startData() {
		return {
			unlocked: true,
			points: new Decimal(0),
		}
	},

	resource: "裂隙",
	type: "none",

	tooltip() {
		return riftSummaryText()
	},

	tabFormat: [
		["display-text", "<h1>裂隙</h1>"],
		["display-text", "<div style='max-width:560px; margin:0 auto; opacity:.8; font-size:13px;'>每隔几分钟，世界的裂缝会短暂打开一次。窗口只有 90 秒，完成就能拿到增益，错过什么都不会发生。</div>"],
		["blank", ["10px", "10px"]],
		["raw-html", function() { return riftCardHTML() }],
	],

	update() {
		// 状态推进由主循环里的 updateRifts() 按真实时间驱动，这里只补字段
		riftState()
	},
})
