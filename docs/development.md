# 开发指南

## 目录

```text
js/
  mod.js                   游戏信息、版本、全局倍率、难度、无尽模式
  layers/
    overworld.js           原版四层：p / s / i / d
    nether_end.js          下界 n、末地 e
    modpack.js             30 个模组层的配置与工厂
    achievements.js        52 个成就
    shop.js                自动化商店（侧边层）
    quests.js              层间任务（侧边层）
  tree.js                  科技树入口
css/
  minecraft.css            像素方块界面、字体、颜色
img/                       原创像素贴图
tools/
  generate_textures.py     贴图生成脚本
docs/
  !general-info.md         文档入口
  gameplay.md              玩法
  balance.md               数值
  development.md           本页
  achievements.md          成就
```

## 模组层是怎么生成的

`js/layers/modpack.js` 里有两层数据：

1. `MOD_THEMES`：每个模组层的主题数据。
2. `MODPACK`：在主题数据上补齐 `row`、`prev`、`baseResource`、需求、指数、时间墙、原型等字段。

然后 `addModLayer(cfg)` 为每个配置生成：

- 10 个升级（ID `11–15`、`21–25`）
- 5 个设施（ID `11–14`、`18`）
- 10 个里程碑（ID `0–9`）
- 3 个挑战（ID `11–13`，从 6 类挑战模板中按层轮换）
- 1 套层机制（`mech2`：前 6 层专属，其余按 8 套模板轮换，每套模板 3 个变体）
- 时间墙、软上限、声望收益递减
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
5. 检查时间墙与软上限文本是否正常。

## 自定义某一层

工厂默认给所有层同一套 10 个升级效果。要做出更明显的差异，可以改：

- `ARCHETYPES`：原型倍率、名字池、设施名字池、时间墙倍率。
- `ARCH_MECH`：五套原型机制；改这里会同时影响该原型的所有层。
- 科技层的 15–17 号设施是研究分支：始终定义，仅在 `cfg.mech.key === "tech"` 时 `unlocked`，并带 `autobuy: false` 让商店自动化跳过。
- `TRAITS` / `THEME_TRAITS`：8 类主题特性与 30 个主题的分派。
- `THEME_SIGS`：每层 15 号签名升级的名称、文案与倍率。
- `MP_CHALLENGES` / `MP_CHALLENGE_SETS`：6 类挑战模板（薄雾、断供、迟滞、封存、失谐、熄核）与 10 组轮换；每层 11–13 号挑战按 `cfg.index % 10` 取一组，改模板即同时改所有层。进入/退出用 `mpChallengeStart` / `mpChallengeEnd` 暂存并恢复 `points` 与 `best`。
- `MP_TEMPLATE_MECHS` / `MP_UNIQUE_MECHS` / `MP_TEMPLATE_ORDER`：层机制。`MP_UNIQUE_MECHS` 按层 id 覆盖前 6 层；其余层按 `(index - 6) % 8` 取模板，并由 `cfg.mechV = floor((index - 6) / 8)` 取该模板的第 1–3 个变体。模板用 `variants` 数组存变体数值与文案，`status` / `mods` / `click` 通过 `mpMechVar(cfg)` 读取当前变体。每套机制提供 `label`、`desc`、`status(cfg)`、可选 `click(cfg)` 与 `mods(cfg, data, out)`；`out` 是 `{ gain, passive, softcap, wall }` 倍率对象，由 `mpMech2Mods(cfg)` 汇总。规则卡标题用 `mpMechLabel(cfg)` / `mpMechDesc(cfg)`，会自动带上变体名。
- 层机制的操作卡占用 clickables 13 号（原型咒语/路线为 11，跳墙为 12）；状态字段 `mechMode` / `mechOn` / `mechAt` / `mechDepth` / `mechCount` 在 `startData` 中给默认值，`retainStartKit` 只额外保留 `mechCount`。
- `buyableData[18]`：主题核心，10 级，效果由 `cfg.trait.core` 决定；4 号里程碑解锁。
- 里程碑 5–9：5 号按 `cfg.mech.key` 强化机制，6 号通过 `mpTraitBoost` 把特性翻倍，7 号给产量 ×2，8 号在主题核心 5 级时按 `cfg.trait.core` 加强，9 号在三个挑战全部完成后给产量 ×1.5。
- `mpTraitBoost` 在层配置构建阶段也会被调用，必须容忍 `player` 尚未初始化。
- `addModLayer(cfg)` 里的 `gainMult`、`getResetGain`、`passiveGeneration`、`canReset`。
- `cfg` 上新增字段，再在工厂里读取，例如 `cfg.special`。

升级与设施的标题使用 `cfg.short + "·"` 前缀；里程碑没有标题前缀，只显示需求与效果。

## 时间墙与软上限的实现位置

在 `addModLayer` 中：

- `mpTimeWall(cfg)`：基础时间 × 原型倍率 × 升级/设施减免。
- `mpSoftcap(cfg)`：基础倍率 + 里程碑 + 升级 + 上限设施。
- `getResetGain()`：手动实现声望公式；收益超过软上限后按平方根折算，不做存储截断。
- `canReset()`：时间墙 + 前置资源；首次声望后在 `doReset` 置 `prestiged = true`，之后跳过时间墙（`layerDataReset` 的保留列表包含它）。
- `mpWallSkipCost(cfg)` 与 12 号 clickable：首通前优先消耗 1 张跳墙券（`wallSkipLeft()`），没有券时花费上一层 3 × `req` 的资源，把 `resetTime` 直接设为时间墙；有券时卡片会显示没有券需要的资源，首通后卡片隐藏。
- 深层反哺由 `js/mod.js` 的 `depthBaseMult()` 计算：第三层起每层读取 `everBest`，按 `(everBest + 1)^(effectExp × 0.15) - 1` 线性相加；`everBest` 在 `js/technical/temp.js` 的 `updateTemp()` 中参考当前 `points` 与持续记录的 `best` 维护，只增不减，`layerDataReset` 不会清空。`depthBaseMult()` 返回每帧由 `refreshDepthBaseMult()` 刷新的缓存，坏档中的非有限值会被跳过。
- 商店自动购买由 `js/game.js` 的 `autobuyUpgrades` / `autobuyBuyables` 执行；购买项可用 `autobuy: false` 排除（科技层 15–17 号研究分支即如此）。
- 自动声望由 `shopAutoPrestigeReady` 判定，阈值是 `AUTO_PRESTIGE_MULT = 1.5`，每个 tick 最多执行一次。
- 单次声望的回退深度由 `js/game.js` 的 `RESET_DEPTH = 5` 控制：`doReset(layer, force, auto)` 只回退本层及下面 4 层，本层只清 `resetTime`，较低层才清数据；当回退下限为第 0 层时，`player.points` 会重置为 `getStartPoints()`（第 0 层声望时归零）。
- `player.resetFloor` 记录上次声望的回退下限；自动声望调用 `doReset(layer, false, true)`，由 `autoResetFloor` 把窗口下限抬到该值，避免保留层被逐 tick 连锁重置。
- 启动套件由 `retainStartKit` 在回退时保留 12 号升级与 1 级生产设施（仅当该层已首通且重置前拥有 12 号升级）；原版层也使用同一函数，并在 `doReset` 中维护 `prestiged` 标记。

本层 `points` 与 `best` 没有上限，不要重新引入 `update()` 夹值或 `min(gain, cap - points)`。如果要调整节奏，优先改 `mpSoftcap`、`getResetGain` 与 `cfg.requires`，而不是只改 UI 文本。

科技树节点显示的是层的 `symbol`。模组层现在把 `symbol` 覆盖为完整的层名（如「暮色森林」「应用能源」），不再使用单字缩写；如果要改回短标记，修改 `MODPACK` 生成时的 `symbol` 字段即可。

## 层间任务

`js/layers/quests.js` 是一个侧边层（`row: "side"`），不参与科技树解锁，也不占用资源链。结构很薄：

- `MAIN_QUESTS`：12 个任务，每项有 `id`、`name`、`desc`、`goal`、`reward`、`unit` 与 `progress()`。`QUEST_ALL` 是第 13 个「全部完成」任务，`QUESTS = MAIN_QUESTS + [QUEST_ALL]`。
- `progress()` 全部从只增不减的存档状态推导：`player[层].prestiged`、`challenges[11..13]`、`player.shop.owns`、`depthBaseMult()`、`player.quests.stats.prestiges`。
- `questGlobalBonus()` 把已完成任务的 `reward` 线性相加，`js/mod.js` 的 `globalProductionMult()` 末尾乘以 `1 + questGlobalBonus()`。该函数用 `typeof` 保护，任务层未加载时按 0 处理。
- 任务层自身只存 `points`（未使用）、`stats.prestiges` 与 `migrated`。声望计数由模组层的 `onPrestige` 调用 `questCountPrestige()`，只有真实声望会 +1；`migrated` 用于旧存档一次性按已首通层数回填计数。
- 任务没有领取状态：完成即生效，进度回退不需要处理，因为所有数据源都是单调的。

新增任务时，在 `MAIN_QUESTS` 里追加一项并提供一个单调的 `progress()` 即可，卡片、进度条与总加成会自动更新；如果新增了独立计数的数据源，记得在 `startData` 里给默认值，并在 `fixSave` 的默认值覆盖范围内。

## 原版层

`overworld.js` 与 `nether_end.js` 使用传统 TMT 层的写法，每层 5 个升级、1 个设施、2 个里程碑，没有时间墙与软上限。它们的解锁链在各自 `doReset` 中通过设置下一层的 `unlocked` 完成。

## 调试

```bash
python -m http.server 8000
```

打开浏览器控制台可以查看 `player`、`tmp`、`MODPACK`。本地存档 id 是 `blocktree`；需要彻底重开时可清空站点 localStorage。

常用检查：

```js
player.t.resetTime       // 当前层已等待时间
mpTimeWall(MODPACK[0])   // 第 0 个模组层时间墙（秒）
tmp.t.softcap            // 当前软上限
tmp.t.resetGain          // 当前声望收益（超过软上限后按平方根折算）
player.t.everBest        // 历史最高资源（深层反哺用，只增不减）
depthBaseMult()          // 当前深层反哺倍率
questGlobalBonus()       // 已完成的层间任务加成（0.92 = +92%）
player.quests.stats.prestiges  // 累计模组声望次数
```

## 上游文档

上游 The Modding Tree 的引擎 API 文档（层、升级、设施、成就、自定义标签页等）未随仓库附带，可到其官方仓库的 `docs/` 目录查看。本项目只改了数值、层配置、CSS 与少量本地化，引擎 API 仍以上游文档为准。
