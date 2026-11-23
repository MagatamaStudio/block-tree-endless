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
	num: "11.2",
	name: "市场、网格与节奏",
}

let changelog = `<h1>更新日志</h1>
<p style="opacity:.7;max-width:760px;margin:0 auto 12px">版本号规则：8.x 起每版 +0.1。发版时 index.html 与脚本资源串同步成版本号，不再逐条列出。</p>
<br>
<details class="cl-box"><summary>v11.2 · 市场、网格与节奏</summary>
<ul>
<li>再补三种结构，<b>30 层全部带结构</b>：<b>市场型</b>（等价交换 / 林业 / 神秘农业 / 实用存储 / 末影接口）、<b>网格型</b>（应用能源 / 龙之研究 / 超能物质 / 环境科技 / 铁路）、<b>节奏型</b>（冰与火 / 虚无世界 / 匠魂 / 热力膨胀 / 创造模式）。</li>
<li><b>市场型</b>：三种货价格按 72–120 秒周期正弦波动，低价买高价卖，赚到的差价换进度，满进度 0.35 倍需求；<b>网格型</b>：4×4 板子摆模块，一格 1 分、相邻一对再加 2 分；<b>节奏型</b>：循环条上抓命中窗口，点中 +1、点空 −2，两次点击至少隔 0.3 秒。</li>
<li>三种新结构分别给产量 / 声望入账 / 软上限 / 自动产出 / 施工需求 / 解锁三档设施；一手没买、一格没摆、一次没敲时乘区全是 ×1，老档由 <code>fixData</code> 补齐，数值与 v11.1 一致。</li>
<li>层页对齐：蓝图 3×3、配比 2×2、配方 3+2 按行排，卡片不再锯齿；市场 6 张买卖卡、网格 16 格、节奏单按钮各用一套固定尺寸；六种结构卡换成和「本层专精」卡同一套盒子（560px 居中、同边框同底色），左右边对齐。</li>
<li>更新日志压成每版 3–6 条要点加一行折叠，完整长文移到仓库 <code>wiki/更新日志.md</code>；版本名改成描述性小标题，攻略扩到 15 节，docs 五份同步。</li>
<li>结构卡文案订正：配方 <b>点数 / 解锁</b> 线不再一律显示「+0%」，改成实际点数与「解锁线 x/4 次」；<b>施工需求</b> 线按真实方向报「需求 −35%」而不是「满档 ×1.35」；市场与节奏的进度、振幅、窗口宽度不再被 ×100 叠算（之前会显示成 3500% / 2400% / 2000%）；节奏倒计时改成「距窗口 X 秒 / 窗口还剩 X 秒」。</li>
</ul></details>
<details class="cl-box"><summary>v11.1 · 配方与蓝图两套结构</summary>
<ul>
<li>新增两种结构，合计 15 层带结构：<b>配方型</b>（植物魔法 / 神秘时代 / 血魔法 / 巫术 / 新生魔艺）、<b>蓝图型</b>（暮色森林 / 星系 / 天境 / 深渊国度 / 无尽贪婪）。</li>
<li><b>配方型</b>：一池材料自动攒，三条配方抢同一池，全满 98 权重 = 该层上限；每层只给一条渠道（产量 / 点数 / 解锁 / 自动 / 施工）。</li>
<li><b>蓝图型</b>：3×3 九格逐格花点数点亮，相邻两格连成线，按新连线数给加成；全图约 1.5–2.4 倍需求。</li>
<li>默认状态（0 次合成、只有基座格）乘区全是 1，与 v10.2 完全一致；老档由 <code>fixData</code> 补齐字段。</li>
<li>进度跟点数同命：本层声望保留，<b>更深的层</b>声望时才归零。</li>
<li>层页多两张结构卡与 5 / 9 张操作卡片；攻略扩到 12 节，docs 四份同步。</li>
</ul></details>
<details class="cl-box"><summary>v11.0 · 抽出「结构」，先上配比</summary>
<ul>
<li>把「这一层怎么玩」抽成可插拔的<b>结构</b>（<code>js/layers/modpack-structs.js</code>），先上线配比型，用在工业时代 / 格雷科技 / 沉浸工程 / 核科技 / 反应堆。</li>
<li>产能分给原料 / 加工 / 成品三道，份额合计 100%，每道有上限（1/3 + 设施加成），利用率 = 3 × 最窄那道。</li>
<li>成品份额超出 1/3 折算成声望溢价 ×1.2–2.0：均衡产量最高，压成品声望最快。</li>
<li>默认自动配平 33 / 33 / 33，不做操作时数值与 v10.2 一致；层页多一张结构卡与 4 张调份额的卡片。</li>
<li>另外 25 层仍是原骨架，后续按配方 / 蓝图 / 市场 / 网格 / 节奏逐批替换。</li>
</ul></details>
<details class="cl-box"><summary>v10.2 · 记忆价格的封顶折扣</summary>
<ul>
<li>记忆价格加封顶折扣：真转生时按上轮声望结算，每 100 次 −1%，上限 −10%，下一轮有效。</li>
<li>折扣按整条轨道的累计价取整（逐级取整会被 ceil 吃掉大部分折扣）。</li>
<li>折扣冻结在真转生那一刻，否则购买时本轮声望已清零、永远是 0%。</li>
<li>记账改按实付累计，打折买下的等级不会让「已投入」按原价回涨；老档按等级回算。</li>
<li>记忆页顶栏与卡片显示「本轮折扣 −10%：原价 Z」；八条轨道全满从 736 点降到 667 点。</li>
</ul></details>
<details class="cl-box"><summary>v10.1 · 记忆拆成期中与全通</summary>
<ul>
<li>每轮 10 点记忆拆两笔：<b>期中 5 点</b>（首通 20 层 + 本轮声望 50 次，可单独领、不重置）、<b>全通 5 点</b>（30 层全首通后随真转生结清）。</li>
<li>期中两个条件必须同时满足，否则刷 50 次声望就能反复领。</li>
<li>门槛取 20 层：15 层与全通的兑换率相同，玩家会算出「打一半就重置」更划算。</li>
<li>总额锁在「轮数 ×10 + 10」，已领取只增不减，兑换循环不会多出点数。</li>
<li>记忆页首通 20 层就露出来（此时只能领期中），打通 30 层才能真转生。</li>
</ul></details>
<details class="cl-box"><summary>v10.0 · 90 个挑战的总览加成</summary>
<ul>
<li>挑战加一条汇总进度：30 层共 90 个挑战，每通关一个额外给全局产量 +0.5%，每满 10 个再 +5%，全清共 +90%（30 个时 ×1.3、60 个时 ×1.6、90 个时 ×1.9）。走加法乘进全局产量，与层间任务、记忆洪流同口径。</li>
<li>层内奖励一个都没动：11 号产量 ×1.5、12 号软上限 ×1.25、13 号自动 ×1.5、9 号里程碑 ×1.5、共鸣与押注胜率照旧，新加成是额外叠上去的。</li>
<li>进度每轮真转生后清零（挑战完成状态本来就跟层一起重置），是「本轮进度」不是永久乘区；老存档按已完成的挑战数直接生效，不需要迁移。</li>
<li>科技树页底部多一行「挑战 n / 90 · 全局产量 +x%」，并提示还差几个到下一个 +5%；全清后改成「全部通关 · 层内奖励与全局加成吃满」。</li>
<li>加这条的原因：90 个 ×1.5 散在 30 层里，单看每一层都只是个小乘数，玩家打完感觉不到总量，后期干脆跳过挑战。</li>
<li>挑战的解锁顺序、进入时清空本层点数、退出恢复快照、挑战期间暂停自动声望、目标值（本层需求 ×0.9–1.5）全部没改。</li>
</ul></details>
<details class="cl-box"><summary>v9.9 · 记忆改按打通轮数</summary>
<ul>
<li>记忆点改按「打通轮数」算：每打通一轮（30 个模组层全部首通一次）+10 点，八条线全满 736 点 = 74 轮。第 1 轮 10 点（5 级）、第 10 轮 100 点（26 级）、第 30 轮 300 点（47 级）。</li>
<li>旧公式是「累计模组声望次数 ^0.6 ×2」，而自动声望也计入累计次数 —— 全自动挂 5–10 小时就能刷满 736 点，记忆变成了挂机时长而不是通关进度。现在挂多久、自动声望刷多少次都不再加记忆。</li>
<li>老存档自动迁移：已领取的记忆按 10 点/轮折算成轮数（向下取整），已经买到的等级与记忆点一分不少，只是之后每轮固定 +10。</li>
<li>记忆页顶栏改成显示「已真转生几轮 / 总记忆（每轮 +10）」，规则卡补一句记忆只看轮数；转生确认框会写明这是第几轮。</li>
<li>八条轨道的等级上限、价格曲线、每级效果全部没改；真转生该清的照清，重置链与首通判定也不动。</li>
</ul></details>
<details class="cl-box"><summary>v9.8 · 橡木林豁免回退下限</summary>
<ul>
<li>第一层「橡木林」豁免回退下限：深层的声望把下限抬到 1 以上之后，只要买了它的自动声望、原木够 1.5 倍需求，木板照样会自动转换，不再需要手动点一次「转化为」把下限压回来。</li>
<li>豁免层不改写 <code>player.resetFloor</code>：深层抬起来的下限保持原样，第二层「石矿洞」及以下仍然按原来的规则被下限暂停。</li>
<li>手动的「转化为」按钮、1.5 倍自动阈值、挑战进行中全部暂停、每 tick 只自动声望一次，这些都没改。</li>
</ul></details>
<details class="cl-box"><summary>v9.7 · 科技树只画前沿三层</summary>
<ul>
<li>科技树不再一次画完 30 个模组层，改成只显示「前沿 + 3 层」：前沿是最近一个已解开或已首通的层。新档只有暮色森林、植物魔法、神秘时代三个模组节点，之后每往下一层就多露出一点。</li>
<li>已首通的层永久留在树上：不看当前有没有解锁，走过的路不会消失；只有真转生才会回到树根。</li>
<li>整行都没有可见节点时，连这一行一起从树上拿掉，树尾不会拖一串空行；树的连线由节点自己画，藏掉的节点不会留下悬空线。</li>
<li>树末尾加一行提示：模组海共 30 层、已首通几层、还有几层没露面；30 层全通后改成「再往下是模组记忆」。</li>
<li>老存档如果正停在已被藏起来的层页，读档时退回树根，不会卡在一个点不动的页面。</li>
<li>成就墙、自动化商店、层间任务的层名单照旧全部显示：那是目标感，不是剧透。</li>
</ul></details>
<details class="cl-box"><summary>v9.6 · 新增剧情页：37 章手记</summary>
<ul>
<li>侧栏新增「剧情」页，排在商店下方：37 章第一人称手记——序章、原版六层各一章、30 个模组层各一章，按该层首通解锁。未解锁的章节只显示编号与「???」，解锁后标题才露出来。</li>
<li>页面上半是正文（章节号、层名、段落），下半是目录；下面一排按钮直接跳章，「上一章／下一章」会跳过还没解锁的章节。已读进度按「翻到即算读过」累计。</li>
<li>纯阅读内容，不接任何数值、不发奖励，也不进重置链：转生、真转生都不会清掉已读记录。</li>
<li>侧栏按钮顺序从「跟着脚本加载顺序」改成显式 position（成就 10 / 商店 20 / 剧情 25 / 任务 30 / 裂隙 40 / 记忆 50），当前观感不变，以后要再插一个按钮不用再赌文件顺序。</li>
</ul></details>
<details class="cl-box"><summary>v9.5 · 攻略扩到八节</summary>
<ul>
<li>关于页「游戏攻略」从 5 节扩到 8 节：新增「主动玩法：专精 · 连击 · 裂隙 · 押注」「转生 · 记忆 · 世界词条」「卡住了？常见问题」，把 9.0 加进来却一直没写进攻略的几套系统补齐。</li>
<li>顺手校正过时说法：级联回退改成「本层及下面 2 层（共 3 层）」、施工分档 25%／50%／全部与首满 +25%、首通判定只看前置层点数池 ≥ 需求、自动声望 1.5 倍需求且需本轮施工完成、商店价格 2 倍需求。</li>
<li>docs/guide.md 同步：新增「4.5 主动玩法」「世界词条（转生后）」，施工分档与首满奖励并进第 4 节。</li>
</ul></details>
<details class="cl-box"><summary>v9.4 · 临时数据分帧重算</summary>
<ul>
<li>临时数据不再每帧整份重算，改成把工作摊到几帧里轮着做：每个刷新帧只重算当前打开的层、刚操作过的层和轮到的那几层，未解锁的层基本不参与。45 层全解锁时，单帧开销从约 40ms 降到约 5ms。</li>
<li>声望收益、下一级门槛、能否重置、产量池与需求这些决定「什么时候能声望」的量仍然每帧全算，自动声望的判定时机与之前一致。</li>
<li>一次声望原本要把整份临时数据算两遍（约 90ms），现在只当场重算回退窗口内的层，上层下一帧补刷一次，单次声望从约 90ms 降到约 2ms。</li>
<li>购买升级、改动购买项数量会标记该层，下一帧立刻补算：点完看到的价格与数量不会晚半秒。</li>
<li>点击卡片、投入施工、押注、控制台指令这类「只动一层」的操作不再整份重算（约 48ms），改成就地只刷新动过的那一层（不足 1ms）；决定自动声望的量本来就每帧全算，触发时机不变。</li>
<li>全存档 NaN 扫描从 2Hz 降到 1Hz。</li>
</ul></details>
<details class="cl-box"><summary>v9.3 · 首通不再要求收益 ≥1</summary>
<ul>
<li>模组层首通只要求前置层点数池 ≥ 需求（1×），不再要求本次收益 ≥1：gainMult 与指数会把有效门槛抬到约 1.7× 需求，首通常因此白等；首通之后的声望仍然要收益 ≥1，不做零收益空转。</li>
</ul></details>
<details class="cl-box"><summary>v9.2 · 声望回退窗口收到 3 层</summary>
<ul>
<li>声望回退窗口从 5 层收到 3 层（RESET_DEPTH = 3）：高层声望只回退本层及下面 2 层，更低层的累计点数、资源与升级全部保留，链条不用每次从零重建。</li>
<li>模组层首通门槛改看前置层本轮峰值（best）：baseAmount、getResetGain 与 canReset 同口径取 max(best, points)，首通后回落到当前点数——不会再出现「点数刚好被更深一层清掉、差一点就能首通」的白等。</li>
<li>记忆「捷径」从「自动声望阈值 −0.05×/级」改为「自动声望收益 ×1.10/级」（满级 ×2.0）：旧效果把阈值压到 1.0×，等于把每次声望收益压到刚好 1 点，是负收益，越升越慢。</li>
</ul></details>
<details class="cl-box"><summary>v9.1 · 记忆总额改为 ^0.6</summary>
<ul>
<li>记忆总额改为「累计声望 ^0.6 ×2」（原为平方根 ×1.5）：第 1 轮 15 点、第 10 轮 68 点、第 30 轮 198 点，同样轮次能买到的等级从 32% 提到 61%。</li>
<li>记忆升级价格曲线从 1.55 放缓到 1.45，八条线全满从 1089 记忆降到 736。</li>
<li>押注加了保底：押注额压到「本金 − req」，押完一定还够声望；本金没超过 req 时三个按钮不可点，卡片直接写明还差多少。</li>
</ul></details>
<details class="cl-box"><summary>v9.0 · 专精、连击、裂隙与押注</summary>
<ul>
<li>30 层各加一张专精卡（产能 / 施工 / 声望），每轮免费选一次。</li>
<li>点击叠连击：每 3 下一次、每层 +15%（最多 +75%），30 秒不点清零。</li>
<li>新增「裂隙」页：每 150–420 秒刷一个事件，90 秒内完成拿 10 分钟全局增益。</li>
<li>首通投料改成分档按钮 25% / 50% / 全部，第一次投满额外 +25% 声望收益。</li>
<li>每层每轮可押注一次，赢了拿回 1.2 / 胜率 倍；真转生后从 8 条世界词条里抽 3 选 1。</li>
</ul></details>
<details class="cl-box"><summary>v8.7 · 开局不再自动产原木</summary>
<ul>
<li>开局不再自动产出原木：基础产量从 0.5/秒 归 0，第一根原木必须点「徒手撸树」拿到，之后的产量靠木斧、工作台、树场与里程碑挣。</li>
</ul></details>
<details class="cl-box"><summary>v8.6 · 修自动声望与存档编码</summary>
<ul>
<li>修复自动化商店「自动声望」买了不生效（判定字段从未赋值）。</li>
<li>修复导出 / 导入与自动存档编码不一致，含中文的存档导出即报错。</li>
<li>删除「施工券」，首通施工只能靠投入上一层资源推进。</li>
<li>转生改为「真转生」：除记忆等级与记忆点外全部清零。</li>
<li>施工设施每级 −4% 改 −3.85%（13 级正好 −50%）；记忆从 4 条扩到 8 条并整体加强。</li>
</ul></details>
<details class="cl-box"><summary>v8.5 · 时间墙改为施工投入</summary>
<ul>
<li>首通的时间墙改为施工：在层页投入上一层资源推进施工，每次投入 25% 需求的材料，投入满额后声望拿满收益。</li>
<li>施工未满也能提前声望，收益按施工进度从 30% 线性涨到 100%；层内自动产出不受影响，首通后不再检查施工。</li>
<li>跳墙券更名施工券，改为在施工券卡上主动使用，直接补满本轮施工、不扣材料；成就获取数量不变。</li>
<li>自动声望要等本轮施工完成才触发；转生后本轮施工重做，已首通层需求减半。</li>
<li>修复成就弹窗盖住侧栏小节点、点击被吞掉只能关弹窗的问题：弹窗移到右下角，容器不再拦截点击。</li>
<li>层页、声望按钮、成就页、关于页与文档同步施工说明。</li>
</ul></details>
<details class="cl-box"><summary>v8.4 · 时间墙改软墙</summary>
<ul>
<li>时间墙改为软墙：未走满也能提前声望，收益按墙进度从 30% 线性涨到 100%；走满后恢复满额。软墙只折算声望入账，层内自动产出不受影响。</li>
<li>时间墙封顶从 2 小时降到 1 小时，首通与转生后的本轮墙同样适用。</li>
<li>自动声望仍等本轮墙走满才触发；跳墙券与资源跳过改为把墙直接走满。</li>
<li>层页、声望按钮、提示与跳墙卡显示当前收益百分比和拿满剩余时间。</li>
</ul></details>
<details class="cl-box"><summary>v8.3 · Vue 改为本地加载</summary>
<ul>
<li>Vue 运行库改为随游戏本地加载，不再依赖 unpkg 公共 CDN；部分网络环境下会卡在未渲染的模板页，此问题已修复。</li>
</ul></details>
<details class="cl-box"><summary>v8.2 · 分屏 HUD 居中</summary>
<ul>
<li>分屏时顶部 HUD 改为在左栏居中显示，不再贴左。</li>
<li>侧栏小节点改为排在 HUD 下方，随 HUD 高度自动让位，不再与 HUD 重叠。</li>
</ul></details>
<details class="cl-box"><summary>v8.1 · HUD 显示上一层资源</summary>
<ul>
<li>科技树页顶部 HUD 增加第二行：跟随最后打开的层，显示该层主资源（如木板、鳞片、末影珍珠）的数量与自动产出。</li>
<li>「深层反哺」与「模组层进度」从独立提示行收进第二行的小标签，省下一行高度；新手提示仍然单独显示。</li>
</ul></details>
<details class="cl-box"><summary>v8.0 · 科技树每行三个节点</summary>
<ul>
<li>科技树模组层改为每行 3 个节点，整棵树从 36 行压缩到 16 行；原版六层仍是单列主干。</li>
<li>换行处的新连线走行间空隙的折线（下 → 横 → 下），不再斜穿整排节点。</li>
<li>关于页底部新增「鸣谢」段落。</li>
<li>关于页攻略小节的标题改为居中，展开后的正文保持左对齐。</li>
</ul></details>
<details class="cl-box"><summary>v7.9 · 全局产量每帧只算一次</summary>
<ul>
<li>全局产量倍率每帧只计算一次，各层 gainMult 共用结果，消除每帧按层数重复遍历的开销。</li>
<li>全存档 NaN 扫描从 10Hz 降到 2Hz。</li>
<li>自动购买购买项改为同一层每 tick 只刷新一次成本，避免 10Hz 下按旧价连续扣费。</li>
</ul></details>
<details class="cl-box"><summary>v7.8 · 商店与成就墙改卡片</summary>
<ul>
<li>自动化商店改卡片布局：卡片头、状态徽章、价格与购买按钮，顶部汇总。</li>
<li>每张已购卡拆成「自动购买」「自动声望」两个开关，旧档读取时自动回填。</li>
<li>成就墙改分组卡片：完成度与跳墙券摘要，三组进度条。</li>
<li>首页资源区收进 HUD 卡片，侧栏节点加统一导轨底。</li>
<li>移除 HUD 与顶部提示里重复的「每秒采集」。</li>
</ul></details>
<details class="cl-box"><summary>v7.7 · 新增模组记忆（转生）</summary>
<ul>
<li>30 个模组层全部首通后，侧栏解锁「模组记忆」：转生清空数值进度，把累计模组声望换成永久记忆。</li>
<li>总记忆 = 累计声望次数的平方根；每次转生领取「总记忆 − 已领取」。</li>
<li>四项永久升级：记忆洪流（全局产量 +4%/级）、记忆扩容（模组软上限 ×1.04/级）、记忆起手（转生后保留生产设施）、记忆捷径（自动声望阈值降到 1.35×）。</li>
<li>转生保留首通、挑战、成就、层间任务、商店与深层反哺；记忆与升级只增不减。</li>
<li>首通标记保留，但本轮时间墙重新计时：已首通层按熟路减半，本轮重新声望后当轮墙再次永久跳过。</li>
<li>更新玩法、平衡、攻略与开发文档。</li>
</ul></details>
<details class="cl-box"><summary>v7.6 · 速查改名「游戏攻略」</summary>
<ul>
<li>关于页「玩法速查」改为「游戏攻略」，拆成 5 个可折叠小节：原版起步、模组层首通与建设、时间墙与自动化、挑战与层机制、全局成长与挂机。</li>
</ul></details>
<details class="cl-box"><summary>v7.5 · 新增层间任务</summary>
<ul>
<li>新增「层间任务」：13 个跨层目标，合计 +92% 全局产量，进度只增不减。</li>
<li>声望次数单独计数，旧档按已首通层数回填。</li>
<li>修复主题特性的全局产量与核心加成没进产量。</li>
<li>修复 50 号成就不渲染、自动化商店未首通即可购买。</li>
<li>修复离线上限截断丢时间、关页仍存档、任务进度条错位、侧边提示被裁。</li>
<li>删除未加载的 Demo 层与失效占位 UI，同步 README 与文档。</li>
</ul></details>
<details class="cl-box"><summary>v7.4 · 模板机制拆成三个变体</summary>
<ul>
<li>8 套模板机制各拆成 3 个变体：同一模板的 3 层不再共用一套数值与节奏。</li>
<li>潮汐分缓潮 / 快潮 / 长潮，轮转分三相 / 双相 / 深耕，回响分常响 / 深响 / 共振。</li>
<li>矩阵分常阵 / 密阵 / 重阵，赌局分小赌 / 稳局 / 豪赌，储备分常备 / 活期 / 定期。</li>
<li>过载分常载 / 微载 / 暴力过载，共鸣分常律 / 战律 / 稳律；变体按层批次轮换，规则卡与操作卡显示变体名。</li>
<li>每套变体的平均强度保持接近，不改变挑战、时间墙与自动化规则。</li>
<li>更新 README、玩法、平衡与开发文档。</li>
</ul></details>
<details class="cl-box"><summary>v7.3 · 前六层专属机制</summary>
<ul>
<li>前 6 层获得专属机制：暮色森林「迷宫探索」、植物魔法「魔力花圃」、工业时代「电压档位」、神秘时代「虚空凝视」、应用能源「网络优先级」、龙之研究「混沌风险」。</li>
<li>其余 24 层从 8 套模板机制轮换：潮汐、轮转、回响、矩阵、赌局、储备、过载、共鸣。</li>
<li>层机制与原型机制、主题特性、挑战、里程碑叠加；规则卡与操作卡实时显示状态与倍率。</li>
<li>「回响」的声望次数跨级联重置保留，其余机制状态随本层数据重置。</li>
<li>新增机制均可在本层点击卡操作或切换，不改变挑战与时间墙的既有规则。</li>
<li>更新 README、玩法、平衡与开发文档。</li>
</ul></details>
<details class="cl-box"><summary>v7.2 · 层页新增本层规则卡</summary>
<ul>
<li>每层页顶新增「本层规则」卡：机制、主题特性、三个挑战与主题目标集中显示，首通后标记徽章。</li>
<li>30 层的挑战条件改为按层轮换：薄雾、断供、迟滞、封存、失谐、熄核，名称随主题；完成奖励不变。</li>
<li>封存与熄核挑战分别要求已购买签名升级、已解锁主题核心，避免出现无效条件。</li>
<li>新增 8/9 号里程碑：主题核心 5 级、完成本层全部挑战，奖励随主题核心类型或给本层产量加成。</li>
<li>迟滞挑战改为声望收益 ×0.6（原时间墙 ×1.5 不影响资源累积），挑战目标同步调整。</li>
<li>更新 README、玩法、平衡与开发文档。</li>
</ul></details>
<details class="cl-box"><summary>v7.1 · 研究点改为按超出比例</summary>
<ul>
<li>科技层研究点改为按「前置资源超出需求的比例」计算：每超出 20% 多 1 点，每次声望 1–6 点，5 号里程碑再 +1；此前公式混用了本层货币与上一层需求，额外点数几乎永远为 0。</li>
<li>深层反哺的历史最高资源改为同时参考持续记录的 best，采样间隙消费点数或声望清空后不再低估；倍率改为每帧刷新缓存，并跳过坏档中的非有限值。</li>
<li>没有跳墙券时，若资源不足以同时支付跳过费用与声望需求，点击跳过会先确认，避免静默扣到需求以下。</li>
<li>文案修正：README 的 21 号升级说明、v6.7 时间墙封顶口径、平衡文档的需求与难度说明、开发文档的深层反哺、归零与启动套件条件。</li>
<li>删除未被页面加载的 demo 层文件 js/layers.js。</li>
</ul></details>
<details class="cl-box"><summary>v7.0 · 深层反哺原木产量</summary>
<ul>
<li>第三层起，每层历史最高资源会永久提升原木基础产量（深层反哺），不再只加成上一层声望收益。</li>
<li>历史最高资源单独记录，级联重置、挑战与声望都不会清零，深层加成不会一重置就失效。</li>
<li>跳墙券仍自动优先消耗；有券时额外显示「没有券需要多少资源」，没券时照旧用资源跳过。</li>
<li>平衡前后期：原版六层需求提高、部分声望指数与全部 effect 指数下调，模组需求增长放缓到 1.42^i、声望指数下限提高到 0.22。</li>
<li>移除里程碑达成时的右侧弹窗与对应开关，成就弹窗保留。</li>
</ul></details>
<details class="cl-box"><summary>v6.9 · 声望回退上限 5 层</summary>
<ul>
<li>单次声望最多回退本层及下面 4 层，更低层与原木、木板、圆石等资源保留。</li>
<li>自动声望不会回退到上次声望的下限以下，保留层不会被逐 tick 连锁重置；想重置更低层可手动声望。</li>
<li>商店单层开关的说明改为同时控制自动购买与自动声望。</li>
<li>修正「本层点数与升级会被清空」的文案，本层只重置计时。</li>
</ul></details>
<details class="cl-box"><summary>v6.8 · 自动购买每次刷新成本</summary>
<ul>
<li>自动购买设施改为每次购买后刷新成本，不再隔次按旧价扣费。</li>
<li>自动购买使用「一键买满」时遵守下一层资源保留额，改为逐级购买。</li>
<li>自动声望说明统一为「前置资源（上一层资源）达到 1.5 倍需求」。</li>
<li>修正时间墙封顶层数与首层基础时长的说明。</li>
</ul></details>
<details class="cl-box"><summary>v6.7 · 时间墙公式与 2 小时封顶</summary>
<ul>
<li>模组层时间墙改为 min(2 小时, 540 × 1.14^i)：首层基础 9 分钟（按原型 8.1–10.8 分钟），第 21 层起基础值 2 小时封顶（原型与路线倍率另计）。</li>
<li>跳墙券改为每完成 3 个成就 +1 张、上限 16 张；已获得的券数按成就数自动重算。</li>
<li>画布尺寸未变化时不再重建缓冲区，后台标签页暂停重绘。</li>
<li>临时数值改为 10Hz 更新，主循环保持 20Hz，减少低配机器的周期性卡顿。</li>
</ul></details>
<details class="cl-box"><summary>v6.6 · 自动化商店改本层资源</summary>
<ul>
<li>自动化商店改为「本层首通后，用本层资源购买本层自动化」，价格为本层声望需求的 2 倍；覆盖升级、购买项与自动声望。</li>
<li>新增自动声望总开关：已购自动化的层在前置资源达到 1.5 倍需求时自动声望；挑战中暂停，每 tick 最多重置一次。</li>
<li>已首通层在级联重置后保留 12 号升级与 1 级生产设施，自动产出不再需要每次手动重启。</li>
<li>原版六层补上首通标记；旧存档按「下一层已解锁」自动回填，已有商店解锁记录全部保留。</li>
</ul></details>
<details class="cl-box"><summary>v6.5 · 新增跳墙券</summary>
<ul>
<li>新增成就奖励「跳墙券」：每完成 5 个成就 +1 张，最多 10 张，首通前可免费跳过时间墙。</li>
<li>有券时自动优先消耗，不再扣上一层资源；没有券时仍可花 3 倍需求的资源跳过。</li>
<li>跳墙卡片区分「暂无」与「已用完」，并显示券会自动优先使用；声望条件不足时点击需确认，避免误耗后被挑战重置。</li>
</ul></details>
<details class="cl-box"><summary>v6.1 · 新增玩法速查</summary>
<ul>
<li>关于页新增「玩法速查」：起步流程、时间墙 / 软上限、自动化商店规则，可折叠展开。</li>
<li>时间设施最多 13 级，满级后在卡片标记「已满级」，不再能继续购买。</li>
<li>文档同步时间设施上限说明。</li>
</ul></details>
<details class="cl-box"><summary>v6.0 · 首通免等时间墙</summary>
<ul>
<li>每层首次声望通过后不再等待时间墙；首通前可花上一层 3 倍需求的资源直接跳过时间墙。</li>
<li>自动化商店扩展到购买项（设施与主题核心），并为下一层声望保留所需资源；挑战进行中暂停代买，科技层研究分支仍需手动分配。</li>
<li>模组需求曲线调整为 1.45^i，声望指数与软上限同步收紧。</li>
<li>初始原木产出改为 0.5/秒；旧存档自动回填「已首通」标记。</li>
<li>移除主界面的 Discord 按钮，文档与预览图同步更新。</li>
</ul></details>
<details class="cl-box"><summary>v5.5 · 挑战、主题核心与里程碑</summary>
<ul>
<li>每层新增 3 个挑战、主题核心与 5–7 号里程碑；挑战完成记录与奖励永久保留。</li>
<li>挑战进入/退出不再级联重置低层，挑战内恢复正常产出；不再顺带解锁下一层或刷研究点。</li>
<li>采集/工业/探索的 5 号里程碑与挑战目标显示对齐实际数值。</li>
<li>文档同步：设施计数、主题核心公式、标题规则与挑战持久化说明。</li>
</ul></details>
<details class="cl-box"><summary>v5.0 · 文案与真实速率校准</summary>
<ul>
<li>修正各层产量、设施、里程碑与时间墙说明，使显示数值与实际效果一致；每秒自动产出改为显示真实速率。</li>
<li>修正模组 21 号升级与 4 号里程碑的重复乘算，恢复说明中的 ×1.5。</li>
<li>修正基础层 11 号升级与 d/n 里程碑的资源对象，石镐现在真正提供圆石 ×2。</li>
<li>成就 41–50 改为对应层第一个里程碑的条件，避免与 51–80 重复触发和双倍奖励。</li>
<li>修正永远不会出现的新手提示、p22 与 d12 重名「附魔台」、n12 缺少「锭」等问题。</li>
<li>文档同步：级联重置、14.4 小时时间墙上限、商店价格单位与被动产出公式。</li>
</ul></details>
<details class="cl-box"><summary>v4.5 · 树场一键买满</summary>
<ul>
<li>树场新增「一键买满」按钮。</li>
<li>商店商品购买后解锁自动购买开关，可随时开关。</li>
</ul></details>
<details class="cl-box"><summary>v4.4 · 新增自动化商店</summary>
<ul>
<li>侧边新增自动化商店。</li>
<li>可用下一层资源购买上一层自动购买升级，价格昂贵。</li>
</ul></details>
<details class="cl-box"><summary>v4.3 · 彩蛋补丁（不告诉你）</summary>
<ul>
<li>不告诉你哦~</li>
<li>就是不告诉你哦~</li>
</ul></details>
<details class="cl-box"><summary>v4.2 · 全局难度提到 ×5</summary>
<ul>
<li>全局难度从 ×2.0 提高到 ×5.0，需求与造价大幅提高。</li>
<li>节点继续显示完整层名，升级/设施保留短前缀。</li>
</ul></details>
<details class="cl-box"><summary>v4.1 · 全局难度提到 ×2</summary>
<ul>
<li>全局难度从 ×1.5 提高到 ×2.0，需求与造价更高。</li>
<li>科技树节点改为显示完整层名，不再只显示单字。</li>
<li>修复未解锁提示框竖排、设置页英文、字体过粗的问题。</li>
</ul></details>
<details class="cl-box"><summary>v4.0 · 模组层扩到 30 个</summary>
<ul>
<li>模组层从 10 个扩展到 30 个，科技树共 36 层。</li>
<li>每个模组层 10 个升级、4 座自动化设施、5 个里程碑。</li>
<li>每层独立时间墙＋软上限＋硬上限；硬上限由设施与里程碑继续抬高。</li>
<li>层与层之间改为声望自动解锁。</li>
<li>新增 30 个模组成就，成就墙扩展到 52 个。</li>
</ul></details>
<details class="cl-box"><summary>v2.0 · 整合包任务书与 10 个维度</summary>
<ul>
<li>加入整合包任务书与 10 个模组维度。</li>
</ul></details>
<details class="cl-box"><summary>v0.1 · 从一棵橡树开始</summary>
<ul>
<li>从一棵橡树开始，砍伐原木、合成木板。</li>
</ul></details>
`

let winText = `你已经把整片模组海堆到了极限。<br><br>
	这里没有终点，只有越来越慢的收益。`

// 全局难度：所有需求、升级与自动化造价再乘 5.0
const DIFFICULTY = new Decimal(5.0)

function dReq(n) {
	return new Decimal(n).times(DIFFICULTY)
}

function upgCost(n) {
	return new Decimal(n).times(DIFFICULTY).ceil()
}

function mcBuyCost(base, ratio, x) {
	return Decimal.pow(ratio, x).times(base).times(DIFFICULTY).floor()
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

	// 树场：每级 +2 原木/秒，并乘 1.15 倍
	gain = gain.add(player.p.buyables[11].times(2))
	gain = gain.times(Decimal.pow(1.15, player.p.buyables[11]))

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
}
