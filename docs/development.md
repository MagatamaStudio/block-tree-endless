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
- 8 个里程碑（ID `0–7`）
- 3 个挑战（ID `11–13`）
- 时间墙、软上限、声望收益递减
- 下一层解锁逻辑

这意味着新增一个模组层通常**不需要写新的 `addLayer`**，只需要加一条主题配置。

## 新增一个模组层

### 1. 在 `MOD_THEMES` 里追加一条

```js
{
    id: "xx",                 // 唯一 id，不能和已有层重复
    name: "模组名",
    symbol: "符",             // 科技树方块上的短标记
    resource: "模组资源",
    color: "#8f6f4f",         // 层颜色
    image: "img/mega_21.png", // 方块贴图
    arch: "tech",             // gather / tech / magic / industry / explore
    intro: "一句话介绍这个模组。",
}
```

位置决定它在树中的顺序：数组越靠后，层越高、需求越大，并自动接在上一层之后。

### 2. 准备贴图

把 16×16 或更大的 PNG 放进 `img/`。如果是批量新层，可以在 `tools/generate_textures.py` 的 `mega_palettes` 里加颜色，然后运行：

```bash
python tools/generate_textures.py
```

贴图使用最近邻放大，保持像素边缘。

### 3. 成就会自动补齐吗？

不会完全自动。`layers/achievements.js` 里有静态的 `MOD_ACH` 列表；新增模组层时，需要在列表末尾加：

```js
{ id: "xx", name: "模组名", image: "img/mega_21.png", resource: "模组资源" },
```

它会在 51 号之后自动获得一个「投产」成就。`ACH_TOTAL` 会根据 `MOD_ACH.length` 自动更新。

> 注意：`js/mod.js` 里有两处按编号遍历成就的循环（41–50 与 51–80）。如果总成就超过 80，需要同步扩大循环范围。

### 4. 验证

1. 刷新页面，确认没有控制台报错。
2. 在树中看到新层为锁定状态。
3. 完成上一层声望，确认新层解锁。
4. 检查新层的 10 个升级、5 个设施、8 个里程碑、3 个挑战是否显示。
5. 检查时间墙与软上限文本是否正常。

## 自定义某一层

工厂默认给所有层同一套 10 个升级效果。要做出更明显的差异，可以改：

- `ARCHETYPES`：原型倍率、名字池、设施名字池、时间墙倍率。
- `ARCH_MECH`：五套原型机制；改这里会同时影响该原型的所有层。
- 科技层的 15–17 号设施是研究分支：始终定义，仅在 `cfg.mech.key === "tech"` 时 `unlocked`，并带 `autobuy: false` 让商店自动化跳过。
- `TRAITS` / `THEME_TRAITS`：8 类主题特性与 30 个主题的分派。
- `THEME_SIGS`：每层 15 号签名升级的名称、文案与倍率。
- `challengeData`：每层 11–13 号挑战；进入/退出用 `mpChallengeStart` / `mpChallengeEnd` 暂存并恢复 `points` 与 `best`。
- `buyableData[18]`：主题核心，10 级，效果由 `cfg.trait.core` 决定；4 号里程碑解锁。
- 里程碑 5–7：5 号按 `cfg.mech.key` 强化机制，6 号通过 `mpTraitBoost` 把特性翻倍，7 号给产量 ×2。
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
- `mpWallSkipCost(cfg)` 与 12 号 clickable：首通前优先消耗 1 张跳墙券（`wallSkipLeft()`），没有券时花费上一层 3 × `req` 的资源，把 `resetTime` 直接设为时间墙；首通后卡片隐藏。
- 商店自动购买由 `js/game.js` 的 `autobuyUpgrades` / `autobuyBuyables` 执行；购买项可用 `autobuy: false` 排除（科技层 15–17 号研究分支即如此）。

本层 `points` 与 `best` 没有上限，不要重新引入 `update()` 夹值或 `min(gain, cap - points)`。如果要调整节奏，优先改 `mpSoftcap`、`getResetGain` 与 `cfg.requires`，而不是只改 UI 文本。

科技树节点显示的是层的 `symbol`。模组层现在把 `symbol` 覆盖为完整的层名（如「暮色森林」「应用能源」），不再使用单字缩写；如果要改回短标记，修改 `MODPACK` 生成时的 `symbol` 字段即可。

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
```

## 上游文档

上游 The Modding Tree 的引擎 API 文档（层、升级、设施、成就、自定义标签页等）未随仓库附带，可到其官方仓库的 `docs/` 目录查看。本项目只改了数值、层配置、CSS 与少量本地化，引擎 API 仍以上游文档为准。
