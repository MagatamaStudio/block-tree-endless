# 开发指南

## 目录

```text
js/
  mod.js                   游戏信息、版本、全局倍率
  layers/
    overworld.js           原版四层：p / s / i / d
    nether_end.js          下界 n、末地 e
    modpack.js             30 个模组层的配置与工厂
    modpack-structs.js     层结构扩展点（当前一种：配比型），被 modpack.js 调用
    achievements.js        52 个成就
    shop.js                自动化商店（侧边层）
    story.js               剧情手记（侧边层，纯阅读）
    quests.js              层间任务（侧边层）
    rebirth.js             模组记忆（转生侧边层）
    rifts.js               裂隙事件页（侧边层）
  tree.js                  科技树入口
  features.js              主动玩法数据：专精、连击、裂隙、世界词条
  technical/
    systemComponents.js    Vue 组件模板，含关于页的 10 节游戏内攻略
    loader.js              动态层脚本加载（版本缓存串）
css/
  minecraft.css            像素方块界面、字体、颜色
  system-style.css         卡片、按钮、记忆页等新版样式
img/                       原创像素贴图
tools/
  generate_textures.py     贴图生成脚本
docs/
  !general-info.md         文档入口
  guide.md                 攻略（面向玩家）
  gameplay.md              玩法
  balance.md               数值
  development.md           本页
  achievements.md          成就
  shop.md                  自动化商店
  easter-egg.md            彩蛋
```

## 模组层是怎么生成的

`js/layers/modpack.js` 里有两层数据：

1. `MOD_THEMES`：每个模组层的主题数据。
2. `MODPACK`：在主题数据上补齐 `row`、`prev`、`baseResource`、需求、指数、施工需求、原型等字段。

然后 `addModLayer(cfg)` 为每个配置生成：

- 10 个升级（ID `11–15`、`21–25`）
- 5 个设施（ID `11–14`、`18`）
- 10 个里程碑（ID `0–9`）
- 3 个挑战（ID `11–13`，从 6 类挑战模板中按层轮换）+ 挑战总览（`challengeClearedTotal()` / `challengeGlobalBonus()`，全 90 个折算成全局产量）
- 1 套层机制（`mech2`：前 6 层专属，其余按 8 套模板轮换，每套模板 3 个变体）
- 首通施工、软上限、声望收益递减
- 下一层解锁逻辑

这意味着新增一个模组层通常**不需要写新的 `addLayer`**，只需要加一条主题配置，并补齐该层的主题特性与签名升级。

## 新增一个模组层

### 1. 在 `MOD_THEMES` 里追加一条

```js
{
    id: "xx",                 // 唯一 id，不能和已有层重复
    name: "模组名",
    symbol: "符",             // 科技树方块上的短标记
    resource: "模组资源",
    color: "#8f6f4f",         // 层颜色
    image: "img/xx.png",      // 方块贴图
    arch: "tech",             // gather / tech / magic / industry / explore
    intro: "一句话介绍这个模组。",
}
```

位置决定它在树中的顺序：数组越靠后，层越高、需求越大，并自动接在上一层之后。

同时要在 `THEME_TRAITS` 里给该 id 指定 8 类主题特性之一，并在 `THEME_SIGS` 里写入 15 号签名升级的名称、文案与倍率；缺少任一条目会在构建层配置时报错。

### 2. 准备贴图

把 16×16 或更大的 PNG 放进 `img/`。如果是批量新层，可以在 `tools/generate_textures.py` 的 `mega_palettes` 里加颜色，然后运行：

```bash
python tools/generate_textures.py
```

贴图使用最近邻放大，保持像素边缘。

### 3. 成就会自动补齐吗？

不会完全自动。`layers/achievements.js` 里有静态的 `MOD_ACH` 列表；新增模组层时，需要在列表末尾加：

```js
{ id: "xx", name: "模组名", image: "img/xx.png", resource: "模组资源" },
```

它会在 51 号之后自动获得一个「投产」成就。`ACH_TOTAL` 会根据 `MOD_ACH.length` 自动更新。

新增层还要把 id 追加到 `js/layers/shop.js` 的 `CHAIN_IDS`（顺序与层链一致），否则自动化商店不会出现该层；`SHOP_ITEMS`、价格与旧存档迁移都从它生成。

> 注意：`js/mod.js` 里有两处按编号遍历成就的循环（41–50 与 51–80）。如果总成就超过 80，需要同步扩大循环范围。

### 4. 验证

1. 刷新页面，确认没有控制台报错。
2. 在树中看到新层为锁定状态。
3. 完成上一层声望，确认新层解锁。
4. 检查新层的 10 个升级、5 个设施、10 个里程碑、3 个挑战是否显示。
5. 检查施工进度与软上限文本是否正常。

## 自定义某一层

工厂默认给所有层同一套 10 个升级效果。要做出更明显的差异，可以改：

- `ARCHETYPES`：原型倍率、名字池、设施名字池、施工需求倍率（`arch.time`）。
- `ARCH_MECH`：五套原型机制；改这里会同时影响该原型的所有层。
- 科技层的 15–17 号设施是研究分支：始终定义，仅在 `cfg.mech.key === "tech"` 时 `unlocked`，并带 `autobuy: false` 让商店自动化跳过。
- `TRAITS` / `THEME_TRAITS`：8 类主题特性与 30 个主题的分派。
- `THEME_SIGS`：每层 15 号签名升级的名称、文案与倍率。
- `MP_CHALLENGES` / `MP_CHALLENGE_SETS`：6 类挑战模板（薄雾、断供、迟滞、封存、失谐、熄核）与 10 组轮换；每层 11–13 号挑战按 `cfg.index % 10` 取一组，改模板即同时改所有层。进入/退出用 `mpChallengeStart` / `mpChallengeEnd` 暂存并恢复 `points` 与 `best`。
- `MP_TEMPLATE_MECHS` / `MP_UNIQUE_MECHS` / `MP_TEMPLATE_ORDER`：层机制。`MP_UNIQUE_MECHS` 按层 id 覆盖前 6 层；其余层按 `(index - 6) % 8` 取模板，并由 `cfg.mechV = floor((index - 6) / 8)` 取该模板的第 1–3 个变体。模板用 `variants` 数组存变体数值与文案，`status` / `mods` / `click` 通过 `mpMechVar(cfg)` 读取当前变体。每套机制提供 `label`、`desc`、`status(cfg)`、可选 `click(cfg)` 与 `mods(cfg, data, out)`；`out` 是 `{ gain, passive, softcap, wall }` 倍率对象，由 `mpMech2Mods(cfg)` 汇总。规则卡标题用 `mpMechLabel(cfg)` / `mpMechDesc(cfg)`，会自动带上变体名。
- 层机制的操作卡占用 clickables 13 号（原型咒语/路线为 11，投入材料为 12 / 14 / 15，押注为 16 / 17 / 18）；状态字段 `mechMode` / `mechOn` / `mechAt` / `mechDepth` / `mechCount` 在 `startData` 中给默认值，`retainStartKit` 只额外保留 `mechCount`。
- `buyableData[18]`：主题核心，10 级，效果由 `cfg.trait.core` 决定；4 号里程碑解锁。
- 里程碑 5–9：5 号按 `cfg.mech.key` 强化机制，6 号通过 `mpTraitBoost` 把特性翻倍，7 号给产量 ×2，8 号在主题核心 5 级时按 `cfg.trait.core` 加强，9 号在三个挑战全部完成后给产量 ×1.5。
- `mpTraitBoost` 在层配置构建阶段也会被调用，必须容忍 `player` 尚未初始化。
- `addModLayer(cfg)` 里的 `gainMult`、`getResetGain`、`passiveGeneration`、`canReset`。
- `cfg` 上新增字段，再在工厂里读取，例如 `cfg.special`。

升级与设施的标题使用 `cfg.short + "·"` 前缀；里程碑没有标题前缀，只显示需求与效果。

## 结构扩展点（`modpack-structs.js`）

骨架共享是为了少写代码，但 30 层张得一模一样就不好玩了。v11.0 把「这一层怎么玩」抽成**结构**，放在 `js/layers/modpack-structs.js`，由 `modpack.js` 调用。加一种结构只需要改三处：

1. **写结构**：往 `MP_STRUCTS` 里加一项，按需实现下面任意方法（都是可选的）：

```js
MP_STRUCTS.alloc = {
  key: "alloc",
  label: "配比",
  startData(cfg) { return { allocShares: [34, 33, 33], allocMode: 0 } }, // 只加自己需要的字段
  passiveMult(cfg) { return 1 },      // 乘进 passiveGeneration()，影响自动产出
  prestigeMult(cfg) { return 1 },     // 乘进 prestigeGainMult()，只影响声望结算
  card(cfg) { return "<span>…</span>" },  // 层页多一张卡（HTML 字符串）
  clickables(cfg, bag) { bag[31] = { … } },  // 往 clickableData 里塞按钮
}
```

2. **给层挂上**：在 `MOD_THEMES` 对应条目写 `struct: "alloc"`，可选 `alloc: { gain, step, capMax }` 之类的调参字段，工厂原样传给结构。
3. **接进出厂口**（已经在 `addModLayer` 里，写新结构时不用再改）：`startData` 里 `...mpStructStartData(cfg)`、`passiveGeneration()` 末尾 `× mpStructPassive(cfg)`、`prestigeGainMult()` 末尾 `× mpStructPrestige(cfg)`、`tabFormat` 里按 `cfg.struct` 插结构卡、`clickableData` 里调 `mpStructClickables(cfg, bag)`。

注意事项：

- **别用 `gainMult()` 做结构加成**。`gainMult` 同时乘进 `resetGain`，而自动产出是 `passiveGeneration × resetGain`，会形成反馈放大；产量类的走 `passiveMult`，结算类的走 `prestigeMult`。
- 结构只能调**乘数**，不要去改 `mpBuildNeed` / `mpSoftcap` / 挑战，那几处被挑战、成就、任务、转生引用着。
- 新字段对老档是 opt-in：`fixSave` 的 `fixData(defaultData, player)` 只补缺失字段，默认值要写成「等于没有这个结构」的行为（配比型默认自动配平 → 利用率 1、溢价 1），这样老存档、挂机与不操作的情况下数值不变。
- 结构自己产生的数组/对象字段，写入时用 `Vue.set` 换引用，别原地改（`fixData` 补出来的默认值是共享引用）。
- 结构的 clickable id 从 **31** 起（11–18 已被原型机制、投入材料、押注占用），补间不连续也没关系，`clickables` 行按 key 顺序渲染。
- 验证：`node --check js/layers/modpack-structs.js`、`node tools/sim/smoke.mjs`（46 层能加载）、再写一个探针断言默认参数下 `util = 1`、`mult = 1`（等价于「没装结构」）。

## 首通施工与软上限的实现位置

在 `addModLayer` 中：

- `mpBuildNeed(cfg)`：`cfg.req` × `MP_BUILD_RATIO` × 原型倍率 × 升级/设施/特性/路线减免 × 记忆熟路减免（`rebirthWallCut()`）。
- `mpBuildProgress(cfg)`：`construct / need` 截到 0–1；`prestiged` 为真时直接返回 1。真转生会清掉 `prestiged`，下一轮自然重做。
- `mpBuildGainMult(cfg)`：施工收益系数，`0.3 + 0.7 × 进度`（`MP_BUILD_GAIN_FLOOR = 0.3`）。
- `mpBuildStepCost(cfg)`：一次投入 25% 需求（`MP_BUILD_STEP = 0.25`），最后一段自动补足；`mpBuildInvest` 从上一层 `points` 扣除并写入 `construct`。
- `mpBuildComplete(cfg)`：调试指令 `build` 使用，直接把 `construct` 补到 `need`（玩家侧没有捷径，v8.6 已删除施工券）。
- `mpBuildDone(cfg)`：进度是否满 100%，供自动声望与卡片显隐使用。
- `mpSoftcap(cfg)`：基础倍率 + 里程碑 + 升级 + 上限设施。
- `getResetGain()`：手动实现声望公式；收益超过软上限后按平方根折算，不做存储截断。它同时驱动层内自动产出（`generatePoints` 与设施卡片的「自动产出 /秒」），因此保持满额，不乘施工系数。
- `prestigeGainMult()`：只在 `js/game.js` 的 `doReset` 结算声望时乘到入账收益上，返回施工系数；`mpBuildGain(cfg)` 是同一折扣的展示版（向下取整，满额 ≥1 时保底 1），供声望按钮与文案使用。
- `canReset()`：只看前置资源 ≥ `req` 且满额收益 ≥1（首通时前置资源取 `mpPrevPool(cfg)`，即 `best` 与当前点数的较大者，`baseAmount()` 与 `getResetGain()` 同口径，避免点数被更深一层声望清零后首通永远差一点；首通不再要求收益 ≥1，池够即可，收益门槛只约束首通之后的声望），施工没完成也能手动声望（拿折算收益）；首次 updateTemp 的函数预处理阶段 `resetGain` 还是占位对象，这里做了类型守卫。首次声望后在 `doReset` 置 `prestiged = true`，之后不再检查施工（`layerDataReset` 的保留列表包含它）。
- `autoPrestigeReady()`：供 `shopAutoPrestigeReady` 调用，要求本轮施工完成才允许自动声望。
- 12 / 14 / 15 号 clickable「投入材料」：首通前显示，分别投入 25% 需求、50% 需求与全部剩余；施工只能靠这三张卡推进。16 / 17 / 18 号是押注（30% / 60% / 100% 上一层资源），每层每轮只能下一次，状态字段 `wagerUsed` / `wagerResult`，与 `buildBonus` 一样放在 `startData` 里随轮次清零。
- 深层反哺由 `js/mod.js` 的 `depthBaseMult()` 计算：第三层起每层读取 `everBest`，按 `(everBest + 1)^(effectExp × 0.15) - 1` 线性相加；`everBest` 在 `js/technical/temp.js` 的 `updateTempLayerStats()` 中参考当前 `points` 与持续记录的 `best` 维护，只增不减，`layerDataReset` 不会清空。`depthBaseMult()` 返回每帧由 `refreshDepthBaseMult()` 刷新的缓存，坏档中的非有限值会被跳过。
- 商店自动购买由 `js/game.js` 的 `autobuyUpgrades` / `autobuyBuyables` 执行；购买项可用 `autobuy: false` 排除（科技层 15–17 号研究分支即如此）。
- 自动声望由 `shopAutoPrestigeReady` 判定，阈值走 `autoPrestigeMult()`：固定 `AUTO_PRESTIGE_MULT = 1.5`（转生「记忆捷径」改为在 `doReset` 里给自动声望乘收益）；层通过 `autoPrestigeReady()` 可以额外加条件（模组层要求本轮施工完成）；每个 tick 最多执行一次。
- 单次声望的回退深度由 `js/game.js` 的 `RESET_DEPTH = 3` 控制：`doReset(layer, force, auto)` 只回退本层及下面 2 层，本层只清 `resetTime`，较低层才清数据；当回退下限为第 0 层时，`player.points` 会重置为 `getStartPoints()`（第 0 层声望时归零）。
- `player.resetFloor` 记录上次声望的回退下限；自动声望调用 `doReset(layer, false, true)`，由 `autoResetFloor` 把窗口下限抬到该值，避免保留层被逐 tick 连锁重置。`row 0` 是例外：`autoResetFloor` 直接返回 0，`doReset` 里的 `floorExempt` 让豁免层的自动声望照常回退到第 0 层，并且不写 `player.resetFloor`——否则一次木板转换就会把深层刚抬起来的下限抹平。
- 启动套件由 `retainStartKit` 在回退时保留 12 号升级与 1 级生产设施（仅当该层已首通且重置前拥有 12 号升级）；原版层也使用同一函数，并在 `doReset` 中维护 `prestiged` 标记。

本层 `points` 与 `best` 没有上限，不要重新引入 `update()` 夹值或 `min(gain, cap - points)`。如果要调整节奏，优先改 `mpSoftcap`、`getResetGain` 与 `cfg.requires`，而不是只改 UI 文本。

科技树节点显示的是层的 `symbol`。模组层现在把 `symbol` 覆盖为完整的层名（如「暮色森林」「应用能源」），不再使用单字缩写；如果要改回短标记，修改 `MODPACK` 生成时的 `symbol` 字段即可。

科技树不会一次画完：节点是否出现只看 `layerShown()`，模组层在 `modpack.js` 里写成「`player[id].unlocked || player[id].prestiged`，或索引 ≤ `mpTreeFrontier() + MP_TREE_PREVIEW`（默认 3）」。要改露出几层就改 `MP_TREE_PREVIEW`；`prestiged` 参与判断是为了让走过的层不会因为真转生清掉 `unlocked` 而消失。**不要**去筛 `TREE_LAYERS`：它是 `updateLayers()` 按 `displayRow` 建好的行结构，过滤它会影响热键与回退；行级隐藏交给 `components.js` 里 `tree` 组件的 `visibleRows`，它把「整行没有可见节点」的行整行去掉，树尾才不会拖空行。连线由节点自己画（`canvas.js` 找不到 DOM 就跳过），藏掉的节点不会留下悬空线。

## 临时数据刷新节奏（性能）

`js/technical/temp.js` 不再每帧整份重算 `tmp`，而是分三档：

- `updateTempSliced()`：主循环每 2 帧（10Hz）调用一次，空闲时的常规刷新。每次都做「便宜且必须新鲜」的部分——`refreshGlobalProductionMult()`、全层的 `updateTempLayerStats()`（声望收益、下一级门槛、能否重置、`baseAmount`、`requires`、`everBest`、通知标记）与 `updateTempGlobals()`（`pointGen`、背景、`displayThings`）；「贵」的部分（购买项、升级、里程碑的整棵函数树）只刷当前打开层、标脏层、以及轮转到的几层。
- `updateTempPartial(ids)`：`doReset` 结束时调用，只重算回退窗口内的层，`markTempSweep(row)` 让下一帧补刷 `row` 以上的层。
- `updateTempAfterAction(id)`：点击卡片、投入施工、押注、控制台指令等「只动一层」的操作调用，只重算这一层（约 1ms）；上层靠分帧轮转在 0.6 秒内跟上，不在这里补刷。
- `updateTemp()`：全量重算，只在初始化、读档、真转生、切换页签等全局变化时调用。

参数：`TEMP_FULL_BELOW = 10`（解锁层不超过 10 时每帧全刷，前期与旧行为一致）、`TEMP_FRAME_TURNS = 6`（多于此数则按 6 帧轮一遍）、`TEMP_MIN_LAYERS = 4`、`TEMP_LOCKED_PER_FRAME = 1`（未解锁层每帧顺带算一个）。

新增/修改层时注意两条约束：

- 任何决定「能不能声望 / 什么时候自动声望」的量必须放进 `updateTempLayerStats()`，否则会跟着分帧轮转变慢，自动声望会晚半秒、一次吃掉更多资源。
- 购买、加购买项数量后要 `markTempDirty(layer)`（`buyUpg`、`setBuyableAmount`、`addBuyables` 已经内置），否则界面上的价格要等下一次轮转才更新。
- 点击类处理器（`onClick`、`onPurchase`）里不要再写 `updateTemp()`，改用 `updateTempAfterAction(id)`；只有改动跨层全局状态的（转生、读档、世界词条、裂隙刷新）才保留全量调用。

## 层间任务

`js/layers/quests.js` 是一个侧边层（`row: "side"`），不参与科技树解锁，也不占用资源链。结构很薄：

- `MAIN_QUESTS`：12 个任务，每项有 `id`、`name`、`desc`、`goal`、`reward`、`unit` 与 `progress()`。`QUEST_ALL` 是第 13 个「全部完成」任务，`QUESTS = MAIN_QUESTS + [QUEST_ALL]`。
- `progress()` 全部从只增不减的存档状态推导：`player[层].prestiged`、`challenges[11..13]`、`player.shop.owns`、`depthBaseMult()`、`player.quests.stats.prestiges`。
- `questGlobalBonus()` 把已完成任务的 `reward` 线性相加，`js/mod.js` 的 `globalProductionMult()` 末尾乘以 `1 + questGlobalBonus()`。该函数用 `typeof` 保护，任务层未加载时按 0 处理。
- 任务层自身只存 `points`（未使用）、`stats.prestiges` 与 `migrated`。声望计数由模组层的 `onPrestige` 调用 `questCountPrestige()`，只有真实声望会 +1；`migrated` 用于旧存档一次性按已首通层数回填计数。
- 任务没有领取状态：完成即生效，进度回退不需要处理，因为所有数据源都是单调的。

新增任务时，在 `MAIN_QUESTS` 里追加一项并提供一个单调的 `progress()` 即可，卡片、进度条与总加成会自动更新；如果新增了独立计数的数据源，记得在 `startData` 里给默认值，并在 `fixSave` 的默认值覆盖范围内。

## 模组记忆（转生）

`js/layers/rebirth.js` 是侧边层（`row: "side"`），`layerShown()` 在「首通 20 个模组层（`REBIRTH_STAGE_LAYERS`）」或「已领过记忆（`claimed > 0`）」时为真 —— 后者是真转生的必要补丁，否则转生清掉首通标记后记忆页会消失；30 层全通才允许真转生：

- 记忆公式（v10.1 起分两笔）：`rebirthTotalMemory() = floor(player.rebirth.rounds) × 10 + 本轮已赚`，本轮已赚 = 30 层全首通 ? 10 :（期中达标 ? 5 : 0）。`rebirthRound() = player.rebirth.rounds + (当前是否 30 层全首通 ? 1 : 0)` 只用于展示与冻结，轮数在 `rebirthClaim()` 里冻结，所以记忆只跟打通几轮有关，挂机时长与自动声望次数都不再影响总额。`rebirthPrestigeCount() = player.rebirth.basePrestige + player.quests.stats.prestiges` 仍保留，只用于页面展示与统计；本轮声望数直接读 `player.quests.stats.prestiges`（`rebirthRunPrestigeCount()`），因为真转生会把层间任务一起清空。`player.rebirth.claimed` 记录已领取，可用记忆 = `claimed - 已投入`，投入按 `REBIRTH_TRACKS` 的当前等级回算。
- 期中档：`rebirthStageMet()` = 本轮首通 ≥ `REBIRTH_STAGE_LAYERS`（20）且本轮声望 ≥ `REBIRTH_STAGE_PRESTIGES`（50）。达标后 `rebirthStageClaimable()` 给出 `min(rebirthClaimable(), 5)`，`rebirthCollectStage()` 只把 `claimed` 加上去、**不重置**，玩家可以继续打；打通 30 层后 `rebirthClaim()` 结清剩下的 5 点并重置。总额上限被锁在 `rounds × 10 + 10`，`claimed` 只增不减，所以「领期中 → 转生 → 再领期中」不会多出点数。
- 期中为什么绑 20 层：只绑声望的话，开局自动声望刷 50 次只要几分钟，领 5 点 → 转生 → 再刷，一小时能刷满 736 点。绑 20 层后兑换率 `0.25 点/层` 低于全通的 `0.33 点/层`，没有刷半轮的动力（15 层是 `0.33`，与全通相同，会鼓励「打一半就重置」，所以取 20）。
- 封顶折扣（v10.2）：`rebirthDiscountAt(prestiges) = min(0.10, floor(prestiges / 100) × 0.01)`，`rebirthDiscount()` 读 `player.rebirth.discount` —— 这个值在 `rebirthClaim()` 里按**刚打完这一轮**的声望冻结（同一处写入 `discountPrestige` 供显示），因为购买发生在转生之后，那时 `quests.stats.prestiges` 已经清零，实时算永远是 0%。价格按**整条轨道的累计价**取整：`rebirthBaseCum(key, level)` 累加原价，`rebirthDiscountedCum(key, level) = ceil(rebirthBaseCum(...) × (1 - discount))`，下一级实付 = 两者之差（至少 1），逐级取整会把 −10% 削成 −5.6%，累计取整才是 −9.4%。
- 记账：`rebirthBuy()` 把实付加进 `player.rebirth.spent`，`rebirthSpent()` 优先读这个字段；没有字段（v10.1 及更早的存档）就退回 `rebirthSpentByLevels()` 按原价回算 —— 当年没折扣，两者相等。别改回「永远按等级回算」：打折买的等级会在折扣变化后抬高「已投入」，可用记忆凭空缩水。
- `rebirthClaim()` 先 `confirm`，然后冻结 `rounds`、`claimed = max(rebirthClaimed(), rebirthTotalMemory())`（取 max 是为了保住期中先领的 5 点）、`basePrestige`、`discount` / `discountPrestige`，再调用 `rebirthResetAll()`；按钮只在 30 层全通且 `claimable > 0` 时可用。重置后首通清零，下一轮重新数。
- 老档迁移：`load()` 里调用 `rebirthMigrateRounds()`，把 v9.8 及更早存档的 `claimed` 按 10 点/轮折算成 `rounds`（向下取整），已买到的等级与 `claimed` 都保留，不会因为有新公式而丢升级。
- `rebirthResetAll()` 遍历 `layers` 中除 `rebirth` 以外的每一层，全部调用 `layerDataReset(id, [])` —— 成就、层间任务、商店、`prestiged`、`challenges`、`mechCount` 都随 `startData` 归零；随后手动清 `everBest`（不在 `startData` 里）、`activeChallenge`、`runCleared`、`resetTime`，并显式清空 `player.shop` 的 `owns` / `auto` / `autoBuy` / `autoPrestigeLayer`（`layOver` 只覆盖 `startData` 里出现的键，动态 map 不会自动变空），最后把 `player.points` 设为 `getStartPoints()`、`player.resetFloor` 设为 0。因为 `layerDataReset` 会保留 `unlocked`，这里再按 `startData().unlocked` 把各层锁回去，并把界面复位到 `layoutInfo.startTab` / `startNavTab`（`none` / `tree-tab`）。
- `rebirthWallPending()` / `rebirthWallMult()` 已随真转生删除：`prestiged` 在转生时被清空，不再存在「已首通但本轮未施工」的状态。`mpBuildDone()` 仍统一供 `canReset()`、12 号 clickable 与层内文本使用；模组层 `doReset()` 在自身声望时把 `runCleared` 置 `true`（该字段仅作记录，施工进度已不看它）。
- `construct` 随 `startData` 归零，转生时由 `layerDataReset` 自动重置；施工不依赖 `resetTime`，`gameLoop` 的计时累加只保留给潮汐、咒语等按秒机制。
- 「记忆起手」等级大于 0 时，重置后给每层保留 12 号升级与对应等级的生产设施（buyable 11）。
- 八项加成分别接入：`rebirthGlobalBonus()` → `js/mod.js` 的 `globalProductionMult()`；`rebirthSoftcapMult()` → `js/layers/modpack.js` 的 `mpSoftcap()`；`rebirthAutoThreshold()` → `js/game.js` 的 `autoPrestigeMult()`；`rebirthWallCut()` → `mpBuildNeed()`；`rebirthYieldMult()` → 模组层 `gainMult()`；`rebirthPassiveMult()` → 模组层 `passiveGeneration()`；`rebirthDepthBonus()` → `computeDepthBaseMult()` 的指数；`rebirthKitLevel()` → `rebirthResetAll()`。
- 存档只有 `player.rebirth.claimed`、`basePrestige` 与 `levels`；旧档缺少该层时由 `getStartPlayer()` / `fixSave()` 按 `startData` 补齐（旧档的 `basePrestige` 缺省为 0，等价于从当前任务计数起算）。
- 转生只保留侧边层 `rebirth` 本身，其余层（数值层 + `a` / `quests` / `shop` / `p` 等）全部重来。

## 原版层

`overworld.js` 与 `nether_end.js` 使用传统 TMT 层的写法，每层 5 个升级、1 个设施、2 个里程碑，不需要施工，也没有软上限。它们的解锁链在各自 `doReset` 中通过设置下一层的 `unlocked` 完成。

## 调试

```bash
python -m http.server 8000
```

打开浏览器控制台可以查看 `player`、`tmp`、`MODPACK`。本地存档 id 是 `blocktree`；需要彻底重开时可清空站点 localStorage。

常用检查：

```js
player.t.construct       // 当前层本轮已投入材料
mpBuildNeed(MODPACK[0])  // 第 0 个模组层施工需求
mpBuildProgress(MODPACK[0]) // 第 0 个模组层施工进度（0–1）
tmp.t.softcap            // 当前软上限
tmp.t.resetGain          // 当前声望收益（超过软上限后按平方根折算）
player.t.everBest        // 历史最高资源（深层反哺用，只增不减）
depthBaseMult()          // 当前深层反哺倍率
questGlobalBonus()       // 已完成的层间任务加成（0.92 = +92%）
challengeClearedTotal()  // 90 个挑战里通关了几个
challengeGlobalBonus()   // 挑战总览的全局加成（0.9 = +90%，走加法乘进产量）
player.quests.stats.prestiges  // 本轮（自上次转生起）累计的模组声望次数
player.rebirth.basePrestige    // 往次转生存下的声望基线
player.rebirth.rounds          // 已冻结的通关轮数（每次真转生 +1）
rebirthRound()           // 轮数 + 当前是否又打通 30 层（展示/冻结用）
rebirthTotalMemory()     // 轮数 × 10 + 本轮已赚（期中 5 / 全通再 5）
rebirthStageMet()        // 本轮期中是否达标（20 层 + 50 次声望）
rebirthStageClaimable()  // 期中可单独领的 5 点（不重置进度）
rebirthClaimable()       // 本次转生可领取的记忆
player.rebirth.claimed   // 已领取（只增不减，期中领取也写这里）
player.rebirth.spent     // 已投入（按实付累计；缺失时按等级回算原价）
player.rebirth.discount  // 封顶折扣（真转生时按本轮声望冻结，0–0.10）
rebirthDiscountAt(n)     // n 次声望能拿到多少折扣（每 100 次 −1%，封顶 −10%）
rebirthBuyCost(key, lv)  // 下一级实付价（整条轨道累计价取整后作差）
player.rebirth.levels    // 八项永久记忆升级的等级
player.t.runCleared      // 本层本轮施工是否已完成
rebirthRunClearedCount() // 本轮已完工的模组层数
```

## 版本与更新日志

- 版本号在 `js/mod.js` 的 `VERSION`（`num` 与 `name`）。`num` 同时是 `index.html` 静态资源与 `js/technical/loader.js` 动态层脚本的缓存串，发版时两处必须一起改，否则浏览器会继续用旧脚本。
- 编号规则：对外发版每版 +0.1（8.0 → 8.1 → 8.2）。6.2–6.4、5.1–5.4、3.x、1.x 是跳过的内部版本，从未对外发布；不要为了「好看」重排历史编号，老玩家的版本记忆和 `versionGreater` 判断都会乱。
- 更新日志是 `js/mod.js` 里的 `changelog` 模板字符串：`<h3>vX.Y — 四字名</h3>` 后跟一个 `<ul><li>…</li></ul>`。`<h3>` 里的名字要与 `VERSION.name` 一致，版本号要与 `VERSION.num` 一致。
- 条目里**不写**「更新缓存串至 vX.Y」——这条规则在日志开头的说明里已经写过一次，逐条重复只会淹没真正的改动。同理，一次发版只对应一个版本号，不要为了换缓存串单独发一版。
- 单条改动多于一屏时，可按「修复 / 内容 / 数值」分组：用 `<li style="list-style:none"><b>修复</b></li>` 当分组标题，正文字号与列表样式沿用全局样式，别新加 `<h4>`（主题没有对应样式）。
- 模板字符串里不能出现反引号，否则整个 `js/mod.js` 解析失败。
- `node tools/sync-wiki-changelog.js` 把日志同步到 GitHub Wiki；如果改了日志结构，记得同步改它的 `buildMarkdown()`（`require` 该脚本可只取 `buildMarkdown()` 干跑预览，不会推送）。

## 游戏内教程

关于页（右上角「i」）的 10 节攻略是硬编码在 `js/technical/systemComponents.js` 的 `'info-tab'` 模板里的，**不在** `docs/`，也不从 `docs/` 生成。改规则时三处要一起改：

- 模板里的数值（解锁层数、每轮点数、折扣、挑战总览、全局加成清单）；
- `docs/guide.md`（面向玩家的完整攻略）与 `docs/gameplay.md` / `docs/balance.md`（机制与数值）；
- `js/mod.js` 的更新日志。

模板结构是 `<details><summary>标题</summary><div>正文</div></details><br>`，中途加 `<b>` 之类行内标签没问题，但不要在里面放反引号，也不要写成 Vue 插值（`{{ }}` 只用于 `modInfo`、`VERSION` 这类模板变量）。改完用 `node tools/sim/probe-guide.mjs`（工具目录不入库）统计 `<details>`/`<div>`/`<summary>` 开闭是否配对 —— 少一个 `</div>` 会让整页后续内容全塌进折叠块里。

## 上游文档

上游 The Modding Tree 的引擎 API 文档（层、升级、设施、成就、自定义标签页等）未随仓库附带，可到其官方仓库的 `docs/` 目录查看。本项目只改了数值、层配置、CSS 与少量本地化，引擎 API 仍以上游文档为准。
