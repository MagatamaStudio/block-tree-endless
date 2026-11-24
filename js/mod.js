let modInfo = {
	name: "方块树：无尽模组海",
	id: "blocktree",
	author: "q(eˣ)qe308",
	pointsName: "原木",
	modFiles: ["features.js", "layers/overworld.js", "layers/nether_end.js", "layers/modpack-structs.js", "layers/modpack.js", "layers/achievements.js", "layers/shop.js", "layers/story.js", "layers/quests.js", "layers/rifts.js", "layers/rebirth.js", "tree.js"],

	discordName: "",
	discordLink: "",
	initialStartPoints: new Decimal(10), // 新世界开始时手里的第一捧原木
	offlineLimit: 12,  // 离线收益上限（小时）
}

// 版本号与副标题
let VERSION = {
	num: "11.5",
	name: "数量级门槛",
	// 资源串：改过任何 js 就 +1，让 index.html 与 loader 注入的脚本一起失效，
	// 否则旧 mod.js 配新层文件（或反过来）会直接白屏
	asset: "11.5.0",
}

let changelog = `<h1>更新日志</h1>
<p style="opacity:.7;max-width:760px;margin:0 auto 12px">版本号规则：8.x 起每版 +0.1。发版时 index.html 与脚本资源串同步成版本号。</p>
<br>
<details class="cl-box"><summary>v11.5 · 声望封顶与层深减速</summary>
<ul>
<li><b>声望封顶</b>：单次声望最多把点数推到需求的 6 倍（<code>MP_GAIN_CAP</code>）。</li>
<li><b>层深减速</b>：自动产出 ÷ (1.15 + 0.78 × 层序)，末层约 ÷24。</li>
<li><b>需求曲线</b>：全几何 <code>128 × 1.42^min(i,5) × 50^(i-5)</code>，末层约 4.4e43。</li>
<li><b>层内造价</b>：十级 ×2.05，合计 41.2 个需求，末级 21 个需求。</li>
<li><b>原版六层造价</b>：升级价改成本层门槛的 0.33 / 0.6 / 1 / 1.9 / 3.4 倍（<code>vUpg()</code>），木斧 1→5 木板。</li>
</ul></details>
<details class="cl-box"><summary>v11.4 · 数量级门槛</summary>
<ul>
<li><b>点数池</b>：产量读 <code>mpGainPool</code>（<code>max(点数, 峰值)</code>），门槛读 <code>mpPrevPool</code>（只认本轮点数）。原先两处都读 <code>max(点数, 峰值)</code>，首通后产量归零、门槛又吃历史峰值，两头都不对。让位判定同步只看点数。</li>
<li><b>需求改档</b>：1–5 层 ×1.42，6–13 层 ×3，14–21 层 ×6，22 层起 ×12，27–30 同档在 e18.31。参考点数树：每层跨 1–3 个数量级（1e13 → 1e111 → 1e150 → e78250），门槛靠量级差成立，不靠小倍率累乘。</li>
<li><b>资源加成降权</b>：层 <code>effect()</code> 的折算指数 0.62→0.25（末层 0.06），并统一过 <code>chainEffect()</code>。原先资源到 e18 时这一项单独给 ×250000 产量，门槛全被它吃掉。</li>
</ul></details>
<details class="cl-box"><summary>v11.3 · 末段同档</summary>
<ul>
<li><b>末段同档</b>：27–30 层共用一档需求 e6.07（原逐层 ×1.42，累到 e6.51），声望指数下限 0.22 → 0.30。27 层产能 e3.3/min，扛不动 1.42 倍门槛。实用存储满进度给本层产量 ×1.5、施工需求 −20%。</li>
<li><b>自动声望让位</b>：下一层没首通、本层池没到门槛、重置后比现在少，三条同时成立就暂停。手动不受限，首通后自己恢复。</li>
<li><b>难度可调</b>：设置页 1.0×–5.0× 五档，默认 1.0×（原写死 5.0×）。低于 1.0× 的删了，需求会被压到个位数。老档保持 5.0×。</li>
<li><b>节奏</b>：命中上限 7–8 下（原 14–16），窗口占圈长 22%–26%，点空 −1。按钮以前满命中时点不动，现在常可点；进度条缩到 16 格。徒手撸树冷却 0.15 → 0.08 秒（6.7 次/秒 → 12.5 次/秒）。</li>
<li><b>连击</b>：<code>clickPower()</code> 也吃连击倍率（3 下 ×1.15 … 5 层 ×1.75）。原来只加全局产量，橡木林开局看不出来。</li>
<li><b>原木爆炸</b>：树场每级 ×1.15，是全游戏唯一的指数项，级数又用原木无限买，原木能滚到 e11000000。现在 50 级以内照旧，之后按级数开方。层间效果另加 <code>chainEffect()</code>，1e12 以上按 log10 开方。</li>
<li><b>峰值入账池</b>：各层点数峰值另存 <code>player.mpPeak</code>，转生时清空。层自己的 <code>best</code> 会被重置打回 0，前置层的池读到 0，链就断了。<code>dReq()</code> 同时改成向下取整、最低 1。</li>
<li><b>界面与缓存</b>：右下角提示补底色；层页与侧栏互切时内容区回顶，左面板同层不动；资源串改由 <code>VERSION.asset</code> 提供。</li>
</ul></details>
<details class="cl-box"><summary>v11.2 · 市场、网格与节奏</summary>
<ul>
<li>补三种结构，30 层全带结构：市场（等价交换 / 林业 / 神秘农业 / 实用存储 / 末影接口）、网格（应用能源 / 龙之研究 / 超能物质 / 环境科技 / 铁路）、节奏（冰与火 / 虚无世界 / 匠魂 / 热力膨胀 / 创造模式）。</li>
<li><b>市场</b>：三种货价格按 72–120 秒正弦波动，低价买高价卖，差价换进度，满进度 0.35 倍需求。<b>网格</b>：4×4 摆模块，一格 1 分，相邻一对加 2 分。<b>节奏</b>：循环条抓窗口，点中 +1、点空 −2，间隔至少 0.3 秒。</li>
<li>三种结构分别给产量 / 入账 / 软上限 / 自动产出 / 施工需求 / 三档设施。一手没买、一格没摆、一次没敲时乘区全 1，老档由 <code>fixData</code> 补齐。</li>
<li>层页对齐：蓝图 3×3、配比 2×2、配方 3+2 按行排；市场 6 张买卖卡、网格 16 格、节奏单按钮各用固定尺寸；六种结构卡统一 560px 居中盒子。</li>
<li>结构卡文案：配方线显示实际点数与「解锁线 x/4 次」；施工需求按真实方向报「−35%」；市场、节奏的百分比不再被 ×100 叠算；节奏倒计时改「距窗口 X 秒 / 窗口还剩 X 秒」。</li>
</ul></details>
<details class="cl-box"><summary>v11.1 · 配方与蓝图两套结构</summary>
<ul>
<li>加两种结构，合计 15 层带结构：配方（植物魔法 / 神秘时代 / 血魔法 / 巫术 / 新生魔艺）、蓝图（暮色森林 / 星系 / 天境 / 深渊国度 / 无尽贪婪）。</li>
<li><b>配方</b>：一池材料，三条配方抢同一池，全满 98 权重 = 该层上限；每层只给一条渠道（产量 / 点数 / 解锁 / 自动 / 施工）。<b>蓝图</b>：3×3 逐格花点数点亮，相邻连成线，按连线数给加成，全图约 1.5–2.4 倍需求。</li>
<li>默认状态乘区全 1，与 v10.2 一致；老档由 <code>fixData</code> 补字段。进度跟点数同命：本层声望保留，更深的层声望时才归零。</li>
</ul></details>
<details class="cl-box"><summary>v11.0 · 抽出「结构」，先上配比</summary>
<ul>
<li>「这一层怎么玩」抽成可插拔的结构（<code>modpack-structs.js</code>），先上配比型：工业时代 / 格雷科技 / 沉浸工程 / 核科技 / 反应堆。</li>
<li>产能分原料 / 加工 / 成品三道，合计 100%，每道上限 1/3 + 设施加成，利用率 = 3 × 最窄那道。</li>
<li>成品份额超 1/3 折成声望溢价 ×1.2–2.0：均衡产量最高，压成品声望最快。</li>
<li>默认 33 / 33 / 33，不做操作时与 v10.2 一致。</li>
</ul></details>
<details class="cl-box"><summary>v10.2 · 记忆价格的封顶折扣</summary>
<ul>
<li>真转生时按上轮声望结算，每 100 次 −1%，上限 −10%，下一轮有效。</li>
<li>折扣按整条轨道累计价取整，逐级取整会被 ceil 吃光。折扣冻结在真转生那一刻，否则购买时本轮声望已清零，永远是 0%。</li>
<li>记账改按实付累计，打折买下的等级不会让「已投入」按原价回涨。八条轨道全满从 736 点降到 667 点。</li>
</ul></details>
<details class="cl-box"><summary>v10.1 · 记忆拆成期中与全通</summary>
<ul>
<li>每轮 10 点拆两笔：期中 5 点（首通 20 层 + 本轮声望 50 次）、全通 5 点（30 层全首通后随真转生结清）。</li>
<li>期中两条同时满足才可领，否则刷 50 次声望就能反复领。门槛取 20 层：15 层与全通兑换率相同，玩家会算出「打一半就重置」更划算。</li>
<li>总额锁在「轮数 ×10 + 10」，已领只增不减。首通 20 层露出记忆页，打通 30 层才能真转生。</li>
</ul></details>
<details class="cl-box"><summary>v10.0 · 90 个挑战的总览加成</summary>
<ul>
<li>30 层共 90 个挑战，每通一个全局产量 +0.5%，每满 10 个再 +5%，全清 +90%（30 个 ×1.3、60 个 ×1.6、90 个 ×1.9）。</li>
<li>层内奖励一个没动（11 号 ×1.5、12 号 ×1.25、13 号 ×1.5、9 号 ×1.5），新加成是额外叠的。每轮真转生清零，是「本轮进度」不是永久乘区。</li>
<li>科技树页底部加一行「挑战 n / 90 · 全局产量 +x%」，提示还差几个到下一个 +5%。</li>
<li>加这条的原因：90 个 ×1.5 散在 30 层，单看都小，打完感觉不到总量，后期干脆跳过挑战。</li>
</ul></details>
<details class="cl-box"><summary>v9.9 · 记忆改按打通轮数</summary>
<ul>
<li>每打通一轮 +10 点，八条线全满 736 点 = 74 轮。第 1 轮 10 点（5 级）、第 10 轮 100 点（26 级）、第 30 轮 300 点（47 级）。</li>
<li>旧公式「累计声望 ^0.6 ×2」把自动声望也计入，全自动挂 5–10 小时就能刷满 736 点，记忆变成挂机时长。现在挂多久都不再加。</li>
<li>老档按 10 点/轮折算轮数（向下取整），已买等级与点数一分不少。记忆页顶栏改显示「已真转生几轮 / 总记忆（每轮 +10）」。</li>
</ul></details>
<details class="cl-box"><summary>v9.8 · 橡木林豁免回退下限</summary>
<ul>
<li>深层把下限抬到 1 以上后，橡木林只要买过自动声望、原木够 1.5 倍需求，木板照样自动转换，不用手动点一次把下限压回来。</li>
<li>豁免层不改 <code>player.resetFloor</code>：石矿洞及以下仍按原规则被下限暂停。</li>
</ul></details>
<details class="cl-box"><summary>v9.7 · 科技树只画前沿三层</summary>
<ul>
<li>不再一次画完 30 层，改成「前沿 + 3 层」。新档只有暮色森林、植物魔法、神秘时代三个模组节点。</li>
<li>已首通的层永久留在树上，只有真转生才回到树根。整行没可见节点就整行拿掉，树尾不留空行。</li>
<li>树末加提示：共 30 层、已首通几层、还有几层没露面。老档停在已藏起来的层页时，读档退回树根。</li>
</ul></details>
<details class="cl-box"><summary>v9.6 · 新增剧情页</summary>
<ul>
<li>侧栏加「剧情」页，37 章第一人称手记（序章 + 原版六层 + 30 个模组层），按层首通解锁，未解锁只显示编号与「???」。</li>
<li>上半正文、下半目录，上一章 / 下一章会跳过未解锁章节，翻到即算读过。纯阅读，不接数值，转生也不清已读。</li>
<li>侧栏按钮顺序改成显式 position：成就 10 / 商店 20 / 剧情 25 / 任务 30 / 裂隙 40 / 记忆 50。</li>
</ul></details>
<details class="cl-box"><summary>v9.5 · 攻略扩到八节</summary>
<ul>
<li>关于页攻略从 5 节扩到 8 节，补「主动玩法」「转生 · 记忆 · 世界词条」「卡住了？常见问题」。</li>
<li>校正过时说法：级联回退 3 层、施工分档 25% / 50% / 全部与首满 +25%、首通只看前置层池 ≥ 需求、自动声望 1.5 倍需求。</li>
</ul></details>
<details class="cl-box"><summary>v9.4 · 临时数据分帧重算</summary>
<ul>
<li>临时数据不再每帧整份重算，摊到几帧里轮着做；45 层全解锁时单帧从约 40ms 降到约 5ms。</li>
<li>决定「什么时候能声望」的量仍每帧全算，自动声望判定时机不变。一次声望从约 90ms 降到约 2ms。</li>
<li>只动一层的操作（点击、投料、押注、指令）改成就地刷新，不足 1ms。全存档 NaN 扫描从 2Hz 降到 1Hz。</li>
</ul></details>
<details class="cl-box"><summary>v9.3 · 首通不再要求收益 ≥1</summary>
<ul>
<li>模组首通只要求前置层点数池 ≥ 需求，不再要求本次收益 ≥1：gainMult 与指数会把有效门槛抬到约 1.7×，首通常白等。</li>
<li>首通之后的声望仍要收益 ≥1，不做零收益空转。</li>
</ul></details>
<details class="cl-box"><summary>v9.2 · 声望回退窗口收到 3 层</summary>
<ul>
<li>回退窗口从 5 层收到 3 层（<code>RESET_DEPTH = 3</code>），更低层的累计点数、资源与升级全保留。</li>
<li>模组首通门槛改看前置层本轮峰值 <code>best</code>，与 <code>getResetGain</code> / <code>canReset</code> 同口径取 max(best, points)。</li>
<li>记忆捷径从「阈值 −0.05×/级」改为「自动声望收益 ×1.10/级」（满级 ×2.0）：旧效果把收益压到 1 点，越升越慢。</li>
</ul></details>
<details class="cl-box"><summary>v9.1 · 记忆总额改为 ^0.6</summary>
<ul>
<li>总记忆改「累计声望 ^0.6 ×2」（原平方根 ×1.5）：第 1 轮 15 点、第 10 轮 68 点、第 30 轮 198 点，同轮次能买到的等级从 32% 提到 61%。</li>
<li>价格曲线 1.55 → 1.45，八条线全满从 1089 降到 736。</li>
<li>押注加保底：押注额压到「本金 − req」，本金没超过 req 时按钮不可点，卡片写明还差多少。</li>
</ul></details>
<details class="cl-box"><summary>v9.0 · 专精、连击、裂隙与押注</summary>
<ul>
<li>30 层各一张专精卡（产能 / 施工 / 声望），每轮免费选一次。</li>
<li>连击：每 3 下一次，每层 +15%，最多 +75%，30 秒不点清零。</li>
<li>裂隙页：每 150–420 秒刷一个事件，90 秒内完成拿 10 分钟全局增益。</li>
<li>首通投料改分档 25% / 50% / 全部，第一次投满额外 +25% 声望收益。每层每轮押注一次，赢了拿回 1.2 / 胜率 倍；真转生抽 3 选 1 世界词条。</li>
</ul></details>
<details class="cl-box"><summary>v8.7 · 开局不再自动产原木</summary>
<ul>
<li>基础产量从 0.5/秒 归 0，第一根原木必须点「徒手撸树」，之后靠木斧、工作台、树场与里程碑挣。</li>
</ul></details>
<details class="cl-box"><summary>v8.6 · 修自动声望与存档编码</summary>
<ul>
<li>修自动声望买了不生效（判定字段从未赋值）。修导出 / 导入与自动存档编码不一致，含中文的存档导出即报错。</li>
<li>删「施工券」，首通施工只能靠投上一层资源推进。转生改真转生：除记忆等级与点数外全部清零。</li>
<li>施工设施每级 −4% 改 −3.85%（13 级正好 −50%）；记忆 4 条扩到 8 条并整体加强。</li>
</ul></details>
<details class="cl-box"><summary>v8.5 · 时间墙改为施工投入</summary>
<ul>
<li>首通的时间墙改施工：投入上一层资源，每次 25% 需求，投满拿满收益。未满也能提前声望，收益按进度 30% → 100%。</li>
<li>跳墙券更名施工券，主动使用直接补满本轮施工、不扣材料。</li>
<li>自动声望要等本轮施工完成；转生后重做，已首通层需求减半。</li>
<li>修成就弹窗盖住侧栏节点、点击被吞：弹窗移到右下角，容器不再拦截点击。</li>
</ul></details>
<details class="cl-box"><summary>v8.4 · 时间墙改软墙</summary>
<ul>
<li>未走满也能提前声望，收益按进度 30% → 100%，走满恢复满额；只折算声望入账，层内产出不受影响。</li>
<li>封顶 2 小时 → 1 小时。自动声望仍等墙走满；跳墙券与资源跳过改为把墙直接走满。</li>
</ul></details>
<details class="cl-box"><summary>v8.3 · Vue 改为本地加载</summary>
<ul>
<li>Vue 随游戏本地加载，不再依赖 unpkg；部分网络环境会卡在未渲染的模板页。</li>
</ul></details>
<details class="cl-box"><summary>v8.2 · 分屏 HUD 居中</summary>
<ul>
<li>分屏时顶部 HUD 在左栏居中，侧栏小节点排在 HUD 下方随高度让位，不再重叠。</li>
</ul></details>
<details class="cl-box"><summary>v8.1 · HUD 显示上一层资源</summary>
<ul>
<li>科技树页 HUD 加第二行：跟随最后打开的层，显示该层主资源的数量与自动产出。</li>
<li>「深层反哺」与「模组层进度」收进第二行小标签，省一行高度。</li>
</ul></details>
<details class="cl-box"><summary>v8.0 · 科技树每行三个节点</summary>
<ul>
<li>模组层改每行 3 个节点，整棵树从 36 行压到 16 行，原版六层仍单列。</li>
<li>换行处走行间折线（下 → 横 → 下），不再斜穿整排节点。</li>
</ul></details>
<details class="cl-box"><summary>v7.9 · 全局产量每帧只算一次</summary>
<ul>
<li>全局产量倍率每帧只算一次，各层 <code>gainMult</code> 共用结果。</li>
<li>全存档 NaN 扫描 10Hz → 2Hz。自动购买购买项改同一层每 tick 只刷一次成本，避免 10Hz 下按旧价连扣。</li>
</ul></details>
<details class="cl-box"><summary>v7.8 · 商店与成就墙改卡片</summary>
<ul>
<li>自动化商店改卡片：卡片头、状态徽章、价格与按钮，顶部汇总。已购卡拆成「自动购买」「自动声望」两个开关，旧档回填。</li>
<li>成就墙改分组卡片，三组进度条。首页资源区收进 HUD 卡片，去掉重复的「每秒采集」。</li>
</ul></details>
<details class="cl-box"><summary>v7.7 · 新增模组记忆（转生）</summary>
<ul>
<li>30 层全首通后解锁「模组记忆」：转生清空数值进度，把累计模组声望换成永久记忆，每次领「总 − 已领」。</li>
<li>四项永久升级：洪流（全局产量 +4%/级）、扩容（软上限 ×1.04/级）、起手（保留生产设施）、捷径（自动声望阈值 1.35×）。</li>
<li>转生保留首通、挑战、成就、任务、商店与深层反哺。首通标记保留，本轮墙重新计时，已首通层减半。</li>
</ul></details>
<details class="cl-box"><summary>v7.6 · 速查改名「游戏攻略」</summary>
<ul>
<li>关于页「玩法速查」改「游戏攻略」，拆成 5 个可折叠小节。</li>
</ul></details>
<details class="cl-box"><summary>v7.5 · 新增层间任务</summary>
<ul>
<li>新增层间任务：13 个跨层目标，合计 +92% 全局产量，进度只增不减。声望次数单独计数，旧档按已首通层数回填。</li>
<li>修主题特性的全局产量与核心加成没进产量；修 50 号成就不渲染、商店未首通即可购买。</li>
<li>修离线上限截断丢时间、关页仍存档、任务进度条错位、侧边提示被裁。</li>
</ul></details>
<details class="cl-box"><summary>v7.4 · 模板机制拆成三个变体</summary>
<ul>
<li>8 套模板各拆 3 个变体：潮汐（缓 / 快 / 长）、轮转（三相 / 双相 / 深耕）、回响（常响 / 深响 / 共振）。</li>
<li>矩阵（常阵 / 密阵 / 重阵）、赌局（小赌 / 稳局 / 豪赌）、储备（常备 / 活期 / 定期）、过载（常载 / 微载 / 暴力）、共鸣（常律 / 战律 / 稳律）。</li>
<li>变体按层批次轮换，规则卡与操作卡显示变体名。每套平均强度接近，不改挑战、时间墙与自动化规则。</li>
</ul></details>
<details class="cl-box"><summary>v7.3 · 前六层专属机制</summary>
<ul>
<li>前 6 层专属：暮色森林「迷宫探索」、植物魔法「魔力花圃」、工业时代「电压档位」、神秘时代「虚空凝视」、应用能源「网络优先级」、龙之研究「混沌风险」。</li>
<li>其余 24 层从 8 套模板轮换：潮汐、轮转、回响、矩阵、赌局、储备、过载、共鸣。</li>
<li>机制与原型机制、主题特性、挑战、里程碑叠加，规则卡与操作卡实时显示状态与倍率。「回响」的声望次数跨级联重置保留。</li>
</ul></details>
<details class="cl-box"><summary>v7.2 · 层页新增本层规则卡</summary>
<ul>
<li>层页顶加「本层规则」卡：机制、主题特性、三个挑战与主题目标集中显示，首通后标徽章。</li>
<li>30 层挑战条件改按层轮换：薄雾、断供、迟滞、封存、失谐、熄核，名称随主题。</li>
<li>封存要求已买签名升级、熄核要求已解锁主题核心，避免无效条件。新增 8 / 9 号里程碑：主题核心 5 级、完成本层全部挑战。</li>
</ul></details>
<details class="cl-box"><summary>v7.1 · 研究点改为按超出比例</summary>
<ul>
<li>研究点改按「前置资源超出需求的比例」算：每超 20% 多 1 点，每次声望 1–6 点，5 号里程碑 +1。旧公式混用本层货币与上一层需求，额外点数几乎永远 0。</li>
<li>深层反哺的历史最高资源同时参考 <code>best</code>，采样间隙消费后不再低估。</li>
<li>没券且资源不够同时付跳过费与声望需求时，点跳过要先确认，避免静默扣到需求以下。</li>
</ul></details>
<details class="cl-box"><summary>v7.0 · 深层反哺原木产量</summary>
<ul>
<li>第三层起，每层历史最高资源永久提升原木基础产量，不再只加成上一层声望收益。</li>
<li>历史最高单独记录，级联重置、挑战与声望都不清零。</li>
<li>平衡前后期：原版六层需求提高，声望指数与 effect 指数下调，模组需求增长放缓到 1.42^i，声望指数下限提到 0.22。移除里程碑达成弹窗。</li>
</ul></details>
<details class="cl-box"><summary>v6.9 · 声望回退上限 5 层</summary>
<ul>
<li>单次声望最多回退本层及下面 4 层，更低层与资源保留。</li>
<li>自动声望不会回退到上次声望的下限以下；想重置更低层只能手动。</li>
</ul></details>
<details class="cl-box"><summary>v6.8 · 自动购买每次刷新成本</summary>
<ul>
<li>自动购买设施每次买完刷成本，不再隔次按旧价扣费。一键买满改逐级购买，遵守下一层资源保留额。</li>
<li>自动声望说明统一为「前置资源达到 1.5 倍需求」。</li>
</ul></details>
<details class="cl-box"><summary>v6.7 · 时间墙公式与 2 小时封顶</summary>
<ul>
<li>时间墙改 min(2 小时, 540 × 1.14^i)：首层 9 分钟，第 21 层起基础值封顶。</li>
<li>跳墙券改每 3 个成就 +1 张、上限 16 张，按成就数自动重算。</li>
<li>临时数值改 10Hz，主循环保持 20Hz。画布尺寸没变就不重建缓冲区，后台标签页暂停重绘。</li>
</ul></details>
<details class="cl-box"><summary>v6.6 · 自动化商店改本层资源</summary>
<ul>
<li>商店改「本层首通后，用本层资源买本层自动化」，价格为本层声望需求的 2 倍，覆盖升级、购买项与自动声望。</li>
<li>加自动声望总开关：前置资源到 1.5 倍需求自动声望，挑战中暂停，每 tick 最多重置一次。</li>
<li>已首通层在级联重置后保留 12 号升级与 1 级生产设施，不用每次手动重启。原版六层补上首通标记。</li>
</ul></details>
<details class="cl-box"><summary>v6.5 · 新增跳墙券</summary>
<ul>
<li>成就奖励跳墙券：每 5 个成就 +1 张，最多 10 张，首通前免费跳过时间墙。</li>
<li>有券自动优先消耗，不再扣上一层资源；没券仍可花 3 倍需求的资源跳过。</li>
</ul></details>
<details class="cl-box"><summary>v6.1 · 新增玩法速查</summary>
<ul>
<li>关于页加「玩法速查」：起步流程、时间墙 / 软上限、商店规则，可折叠。</li>
<li>时间设施最多 13 级，满级后标记「已满级」。</li>
</ul></details>
<details class="cl-box"><summary>v6.0 · 首通免等时间墙</summary>
<ul>
<li>每层首通后不再等时间墙；首通前可花上一层 3 倍需求的资源跳过。</li>
<li>商店扩到购买项，并为下一层声望保留所需资源；挑战中暂停代买。</li>
<li>需求曲线改 1.45^i，声望指数与软上限收紧。初始原木产出 0.5/秒。</li>
</ul></details>
<details class="cl-box"><summary>v5.5 · 挑战、主题核心与里程碑</summary>
<ul>
<li>每层加 3 个挑战、主题核心与 5–7 号里程碑，挑战记录与奖励永久保留。</li>
<li>挑战进出不再级联重置低层，挑战内恢复正常产出，不再顺带解锁下一层或刷研究点。</li>
<li>核对采集 / 工业 / 探索的 5 号里程碑与挑战目标数值，与显示对齐。</li>
</ul></details>
<details class="cl-box"><summary>v5.0 · 文案与真实速率校准</summary>
<ul>
<li>修正各层产量、设施、里程碑与时间墙说明，每秒产出改显示真实速率。</li>
<li>修 21 号升级与 4 号里程碑的重复乘算，恢复说明里的 ×1.5；石镐现在真给圆石 ×2。</li>
<li>成就 41–50 改对应层第一个里程碑的条件，避免与 51–80 双倍触发。</li>
<li>修永不出现的新手提示、p22 与 d12 重名「附魔台」、n12 缺「锭」。</li>
</ul></details>
<details class="cl-box"><summary>v4.5 · 树场一键买满</summary>
<ul>
<li>树场加「一键买满」。商店商品买后解锁自动购买开关。</li>
</ul></details>
<details class="cl-box"><summary>v4.4 · 新增自动化商店</summary>
<ul>
<li>侧栏加自动化商店：用下一层资源买上一层的自动购买升级，价格昂贵。</li>
</ul></details>
<details class="cl-box"><summary>v4.3 · 彩蛋补丁（不告诉你）</summary>
<ul>
<li>不告诉你哦~</li>
<li>就是不告诉你哦~</li>
</ul></details>
<details class="cl-box"><summary>v4.2 · 全局难度提到 ×5</summary>
<ul>
<li>全局难度 ×2.0 → ×5.0，需求与造价大幅提高。</li>
</ul></details>
<details class="cl-box"><summary>v4.1 · 全局难度提到 ×2</summary>
<ul>
<li>全局难度 ×1.5 → ×2.0。科技树节点显示完整层名，不再只显示单字。</li>
<li>修未解锁提示框竖排、设置页英文、字体过粗。</li>
</ul></details>
<details class="cl-box"><summary>v4.0 · 模组层扩到 30 个</summary>
<ul>
<li>模组层 10 → 30，科技树共 36 层。每层 10 个升级、4 座自动化设施、5 个里程碑。</li>
<li>每层独立时间墙 + 软上限 + 硬上限，硬上限由设施与里程碑抬高。层间改声望自动解锁。</li>
<li>成就墙扩到 52 个。</li>
</ul></details>
<details class="cl-box"><summary>v2.0 · 整合包任务书与 10 个维度</summary>
<ul>
<li>加入整合包任务书与 10 个模组维度。</li>
</ul></details>
<details class="cl-box"><summary>v0.1 · 从一棵橡树开始</summary>
<ul>
<li>从一棵橡树开始，砍原木、合木板。</li>
</ul></details>
`

let winText = `你已经把整片模组海堆到了极限。<br><br>
	这里没有终点，只有越来越慢的收益。`

// 全局难度：所有需求、升级与自动化造价按此倍率放大
// 玩家可在设置页调整（默认 1.0×），存在 player.difficulty 里，读档时由 fixOldSave 应用
// 只保留 1.0× 及以上：低于 1.0 的档位会把需求压到 1 位数，整条链一路平推，没有游戏可言
const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5]
let DIFFICULTY = new Decimal(1)

function difficultyNow() {
	const raw = (typeof player !== "undefined" && player) ? Number(player.difficulty) : 1
	return DIFFICULTY_LEVELS.includes(raw) ? raw : 1
}

function setDifficulty(v) {
	const next = DIFFICULTY_LEVELS.includes(Number(v)) ? Number(v) : 1
	if (typeof player !== "undefined" && player) player.difficulty = next
	DIFFICULTY = new Decimal(next)
	// 模组层的 req / 门槛 / 层需求都是按难度算出来的，改完就地重算一遍
	if (typeof refreshModpackReq === "function") refreshModpackReq()
	if (typeof updateTemp === "function") updateTemp()
	if (typeof needCanvasUpdate !== "undefined") needCanvasUpdate = true
}

function adjustDifficulty() {
	const i = DIFFICULTY_LEVELS.indexOf(difficultyNow())
	setDifficulty(DIFFICULTY_LEVELS[(i + 1) % DIFFICULTY_LEVELS.length])
}

function difficultyLabel() {
	const v = difficultyNow()
	return v.toFixed(1) + "×"
}

// 层间回馈：原版六层的产量都乘「下一层的效果」，而效果本身是点数^指数。
// 六层串成一条链、再叠上模组层对末影珍珠的放大，闭环里会有限时间爆炸（原木能刷到 e11000000）。
// 这里把单链路效果压住：1e12 以下原样，以上按 log10 开方，闭环的指数就封顶了。
function chainEffect(e) {
	const v = new Decimal(e)
	// 坏档里的 Infinity / NaN 别指望开方能救回来，直接按上限处理
	if (!v.isFinite()) return new Decimal("1e100")
	if (v.lte(1e12)) return v
	return v.log10().sub(12).times(0.5).pow10().times(1e12)
}

function dReq(n) {
	// 需求取整：难度倍率一乘就会出现 25.81 这种尾巴，而上一层的结算产出是整数，
	// 差这 0.3 就永远跨不过去（低难度整条链卡在「差一点点」）。
	return new Decimal(n).times(DIFFICULTY).floor().max(1)
}

function upgCost(n) {
	return new Decimal(n).times(DIFFICULTY).ceil()
}

// 原版层的升级价格 = 本层门槛的固定比例（0.33 / 0.6 / 1 / 1.9 / 3.4 倍）。
// 以前写死 1/2/5/15/40 这种绝对值，门槛一涨、产量一高就变成零钱；改成跟门槛一起缩放，
// 第一档吃掉三成门槛，最后一档要攒够三个多门槛，升级才和「过不过这一层」抢钱。
function vUpg(id, frac) {
	const req = layers[id].requires
	return new Decimal(req).times(frac).ceil().max(1)
}

function mcBuyCost(base, ratio, x) {
	// 低难度下 floor 会算出 0，白送等于送产量，至少收 1
	return Decimal.pow(ratio, x).times(base).times(DIFFICULTY).floor().max(1)
}

// 各层 21 号升级提供的全局产量倍率（原版六层为乘算，模组层另按 +10% 线性叠加，见 globalProductionMult）
const GLOBAL_UPGRADE_BOOSTS = {
	s: 1.5,
	i: 2,
	d: 3,
	n: 2,
	e: 2,
}

// 如果有函数副作用，不要每帧调用它们（这里沿用模板示例）
var doNotCallTheseFunctionsEveryTick = ["blowUpEverything"]

function getStartPoints(){
    return new Decimal(modInfo.initialStartPoints)
}

// 原木始终可以自然增长
function canGenPoints(){
	return true
}

// 所有维度共享的全局产量倍率
// updateTemp 内各层 gainMult 会重复调用，按次缓存结果，避免 O(层数²) 扫描
let globalProductionMultCache = null

function refreshGlobalProductionMult() {
	globalProductionMultCache = computeGlobalProductionMult()
}

function globalProductionMult() {
	if (globalProductionMultCache !== null) return globalProductionMultCache
	return computeGlobalProductionMult()
}

// 仅成就提供的产量加成，成就页摘要直接复用
function achievementProductionMult() {
	let mult = new Decimal(1)
	if (hasAchievement("a", 13)) mult = mult.times(1.1)
	if (hasAchievement("a", 14)) mult = mult.times(1.1)
	if (hasAchievement("a", 21)) mult = mult.times(1.15)
	if (hasAchievement("a", 22)) mult = mult.times(1.2)
	if (hasAchievement("a", 24)) mult = mult.times(1.25)
	if (hasAchievement("a", 31)) mult = mult.times(1.3)
	if (hasAchievement("a", 32)) mult = mult.times(1.5)

	// 模组成就：每个 +5%
	for (let i = 41; i <= 50; i++) {
		if (hasAchievement("a", i)) mult = mult.times(1.05)
	}
	// 无尽模组层成就：每个 +1.5%
	for (let i = 51; i <= 80; i++) {
		if (hasAchievement("a", i)) mult = mult.times(1.015)
	}
	return mult
}

function computeGlobalProductionMult() {
	let mult = new Decimal(1)

	for (const layer in GLOBAL_UPGRADE_BOOSTS) {
		if (hasUpgrade(layer, 21))
			mult = mult.times(GLOBAL_UPGRADE_BOOSTS[layer])
	}

	if (hasMilestone("e", 0)) mult = mult.times(2)

	if (typeof MODPACK !== "undefined") {
		// 模组 21 号升级改为线性叠加：每层 +10%，不再乘法爆炸
		let modBoost = 0
		for (const cfg of MODPACK) {
			let data = player[cfg.id]
			if (!data) continue
			// 直接读存档，避免 updateTemp 尚未构建 tmp[层] 时读取 tmp
			if (data.upgrades.includes(21) || data.upgrades.includes("21")) modBoost += 0.1
			if (cfg.trait.global && data.unlocked) {
				modBoost += typeof mpTraitGlobal === "function" ? mpTraitGlobal(cfg) : 0
			}
			if (cfg.trait.core === "global" && data.unlocked) {
				modBoost += typeof mpCoreGlobal === "function" ? mpCoreGlobal(cfg) : 0
			}
		}
		mult = mult.times(1 + modBoost)
	}

	mult = mult.times(achievementProductionMult())
	// 层间任务：已完成任务的奖励线性叠加，避免连乘
	if (typeof questGlobalBonus === "function") mult = mult.times(1 + questGlobalBonus())
	// 挑战总览：每通关一个挑战 +0.5% 全局产量，每满 10 个再 +5%（满 90 个 +90%）
	if (typeof challengeGlobalBonus === "function") {
		const chBonus = challengeGlobalBonus()
		if (chBonus > 0) mult = mult.times(1 + chBonus)
	}
	// 转生记忆：每级 +10%，最多 10 级，同样走加法
	if (typeof rebirthGlobalBonus === "function") {
		const bonus = rebirthGlobalBonus()
		if (bonus > 0) mult = mult.times(1 + bonus)
	}
	// 点击连击：每层 +15%，最多 5 层，30 秒不点就断
	if (typeof clickComboMult === "function") mult = mult.times(clickComboMult())
	// 裂隙增益：限时全局加成
	if (typeof riftBuffMult === "function") mult = mult.times(riftBuffMult())
	// 世界词条：全局产量倍率
	if (typeof worldModProd === "function") mult = mult.times(worldModProd())
	return mult
}

// 深层反哺：第三层起的每层历史最高资源永久提升原木基础产量，重置不会清零
// 各层按 effectExp 折算后线性相加，避免 30 多个模组层连乘把基础产量推到失控
const DEPTH_BASE_EXP = 0.15
const VANILLA_EFFECT_EXP = { i: 0.5, d: 0.6, n: 0.6, e: 0.7 }

function computeDepthBaseMult() {
	let bonus = new Decimal(0)
	for (const layer in layers) {
		const row = layers[layer].row
		if (typeof row !== "number" || row < 2) continue
		const data = player[layer]
		if (!data || !data.unlocked || !data.everBest) continue
		let ever = data.everBest instanceof Decimal ? data.everBest : new Decimal(data.everBest || 0)
		if (!ever.isFinite()) continue
		let exp = VANILLA_EFFECT_EXP[layer]
		if (exp === undefined && typeof MODPACK !== "undefined") {
			for (const cfg of MODPACK) if (cfg.id === layer) exp = cfg.effectExp
		}
		if (exp === undefined) continue
		// 模组记忆「记忆深潜」：每级把反哺指数再加 0.02
		let expBonus = typeof rebirthDepthBonus === "function" ? rebirthDepthBonus() : 0
		bonus = bonus.add(ever.add(1).pow((exp + expBonus) * DEPTH_BASE_EXP).sub(1))
	}
	return bonus.add(1)
}

// 每帧刷新一次，避免产量计算与界面反复遍历 36 层
let depthBaseCache = null
function refreshDepthBaseMult() {
	depthBaseCache = computeDepthBaseMult()
}
function depthBaseMult() {
	if (depthBaseCache === null) refreshDepthBaseMult()
	return depthBaseCache
}

// 点击撸树的收益
function clickPower() {
	let power = new Decimal(1)
	if (hasUpgrade("p", 11)) power = power.times(2)
	if (hasUpgrade("p", 21)) power = power.times(5)
	power = power.times(player.p.points.add(1).pow(0.2))
	// 点击是真实时间操作：随加速开方放大（封顶 10×），否则高加速下点击等于没有
	if (typeof clickSpeedMult === "function") power = power.times(clickSpeedMult())
	// 世界词条：点击收益倍率
	if (typeof worldModClick === "function") power = power.times(worldModClick())
	// 连点叠层要真的加到点击上：只加「全局产量」的话，橡木林开局没有被动产出，连击等于看不见
	if (typeof clickComboMult === "function") power = power.times(clickComboMult())
	return power
}

// 每秒原木产量
function getPointGen() {
	if(!canGenPoints())
		return new Decimal(0)

	// 开局没有自动产出：原木只能靠「徒手撸树」点出来，产量要靠升级与树场挣
	let gain = new Decimal(0)
	if (hasMilestone("p", 0)) gain = gain.add(2)
	if (hasUpgrade("p", 11)) gain = gain.times(2)
	if (hasUpgrade("p", 12)) gain = gain.times(1.5)
	if (hasUpgrade("p", 22)) gain = gain.times(5)

	// 树场：每级 +2 原木/秒，并乘 1.15 倍。1.15^级数是指数加成，而级数能用原木无限买，
	// 于是原木自己把自己推成 e11000000（全游戏只有这一处指数加成）。
	// 50 级以内照旧，之后再涨按级数开方：仍然越买越强，但不再是纯指数。
	// 老档里 buyables 可能存成 number / 字符串 / 干脆没有这个键，直接 .times 会抛错，
	// 而 getPointGen 每帧都跑，一抛就是整页白屏。先裹成 Decimal。
	const groveLv = new Decimal(player.p.buyables[11] === undefined ? 0 : player.p.buyables[11])
	gain = gain.add(groveLv.times(2))
	gain = gain.times(Decimal.pow(1.15, groveLv.min(50)))
	if (groveLv.gt(50)) gain = gain.times(groveLv.sub(50).add(1).pow(0.5))

	// 木板本身会反哺森林
	gain = gain.times(tmp.p.effect)
	if (hasMilestone("p", 1)) gain = gain.times(2)

	gain = gain.times(depthBaseMult())
	gain = gain.times(globalProductionMult())
	return gain
}

// 顶部 HUD 第二行跟随最后打开的非侧栏层；没有记录时退回橡木林
function hudFocusLayer() {
	let tab = player.tab
	if (tab && layers[tab] && player[tab] && player[tab].unlocked && tmp[tab] &&
		tmp[tab].row !== "side" && tmp[tab].row !== "otherside") return tab
	let last = player.lastSafeTab
	if (last && layers[last] && player[last] && player[last].unlocked) return last
	return layers.p ? "p" : null
}

function hudFocusRate(layer) {
	let gen = tmp[layer].passiveGeneration
	if (!gen || !tmp[layer].resetGain) return new Decimal(0)
	return new Decimal(gen).times(tmp[layer].resetGain)
}

function hudSubText() {
	let layer = hudFocusLayer()
	if (!layer) return ""
	let rate = hudFocusRate(layer)
	let html = "<b>" + formatWhole(player[layer].points) + "</b> " + (layers[layer].resource || "")
	if (rate.gt(0)) html += ' <span class="hud-sub-rate">+' + formatSmall(rate) + "/秒</span>"
	return html
}

function hudDepthText() {
	let mult = depthBaseMult()
	if (mult.lte(1.0001)) return ""
	return "深层反哺 ×" + format(mult)
}

function hudModText() {
	if (typeof MODPACK === "undefined") return ""
	let unlocked = MODPACK.filter(c => player[c.id] && player[c.id].unlocked).length
	return "模组 " + unlocked + " / " + MODPACK.length
}

// 用于顶部提示的动态文本
var displayThings = [
	function() { if (!player.s.unlocked && player.points.lt(tmp.p.requires)) return "提示：点击「橡木林」中的「徒手撸树」开始这个世界。" },
	function() { if (!player.s.unlocked && player.points.gte(tmp.p.requires)) return "原木已经够了——点击「转化为」合成木板并进入石矿洞。" },
]

function addedPlayerData() { return {
	difficulty: 1,
	// 各层点数峰值。层自己的 best 会被级联重置、首通清零反复打回 0，
	// 放在这里当跨重置高水位，模组层的入账池（mpPrevPool）只认它。
	mpPeak: {},
}}

// 无尽模式：完成所有模组层后仍可继续堆叠
function isEndgame() {
	return false
}

// 背景交给 CSS 处理，这里不额外叠加
var backgroundStyle = {
}

function maxTickLength() {
	return(3600)
}

function fixOldSave(oldVersion){
	// 难度存在存档里（player.difficulty），层定义却是在还没有存档的时候建的，
	// 所以读档后按存档值把需求重算一遍。
	// 11.3 之前所有存档都跑在 ×5 的难度上，直接按新的 1.0 读档等于把门槛砍掉 5 倍，
	// 进度会瞬间对不上号，所以老档按 ×5 保留；新档从 1.0 起。
	if (typeof player !== "undefined" && player && typeof refreshModpackReq !== "undefined") {
		const legacy = !(parseFloat(oldVersion) >= 11.3)
		const progressed = player.points && player.points.gt(1e3)
		if (legacy && progressed) setDifficulty(5)
		else setDifficulty(difficultyNow())
	}
	// 老档没有跨重置峰值：用现有 best / 点数兜个底，免得模组链的入账池从 0 重新攒
	// fixOldSave 是在读档路径上跑的，这里抛一个错就是整页打不开，所以一律裹成 Decimal 再兜 try
	if (typeof player !== "undefined" && player && !player.mpPeak) {
		const peak = {}
		try {
			for (const id in player) {
				const d = player[id]
				if (!d || typeof d !== "object" || d.points === undefined || d.points === null) continue
				const pts = new Decimal(d.points)
				const best = d.best === undefined || d.best === null ? new Decimal(0) : new Decimal(d.best)
				if (!pts.isFinite() || !best.isFinite()) continue
				peak[id] = pts.max(best)
			}
		} catch (e) {
			console.warn("mpPeak 兜底失败，按空表处理", e)
		}
		if (typeof Vue !== "undefined" && Vue.set) Vue.set(player, "mpPeak", peak)
		else player.mpPeak = peak
	}
}
