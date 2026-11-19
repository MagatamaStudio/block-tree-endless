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
- 4 个设施（ID `11–14`）
- 5 个里程碑（ID `0–4`）
- 时间墙、软上限、硬上限、声望收益限制
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
4. 检查新层的 10 个升级、4 个设施、5 个里程碑是否显示。
5. 检查时间墙、软上限、硬上限文本是否正常。

## 自定义某一层

工厂默认给所有层同一套 10 个升级效果。要做出更明显的差异，可以改：

- `ARCHETYPES`：原型倍率、名字池、设施名字池、时间墙倍率。
- `addModLayer(cfg)` 里的 `gainMult`、`getResetGain`、`passiveGeneration`、`canReset`。
- `cfg` 上新增字段，再在工厂里读取，例如 `cfg.special`。

升级、设施、里程碑的标题都会带上 `cfg.symbol + "·"` 前缀，因此每一层的 UI 至少能一眼区分。

## 时间墙与上限的实现位置

在 `addModLayer` 中：

- `mpTimeWall(cfg)`：基础时间 × 原型倍率 × 升级/设施减免。
- `mpSoftcap(cfg)` / `mpHardcap(cfg)`：基础倍率 + 里程碑 + 升级 + 上限设施。
- `getResetGain()`：手动实现声望公式，最后用 `min(gain, hardcap - points)` 截断。
- `update()`：把 `points` 与 `best` 都夹到硬上限。
- `canReset()`：时间墙 + 前置资源 + 未达到硬上限。

如果要调整上限行为，优先改这几个函数，不要只改 UI 文本。

科技树节点显示的是层的 `symbol`。模组层现在把 `symbol` 覆盖为完整的层名（如「暮色森林」「应用能源」），不再使用单字缩写；如果要改回短标记，修改 `MODPACK` 生成时的 `symbol` 字段即可。

## 原版层

`overworld.js` 与 `nether_end.js` 使用传统 TMT 层的写法，每层 5 个升级、1 个设施、2 个里程碑，没有时间墙与硬上限。它们的解锁链在各自 `doReset` 中通过设置下一层的 `unlocked` 完成。

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
mpHardcap(MODPACK[0])    // 当前硬上限
tmp.t.resetGain          // 当前声望收益（已被硬上限截断）
```

## 上游文档

上游 The Modding Tree 的引擎 API 文档（层、升级、设施、成就、自定义标签页等）未随仓库附带，可到其官方仓库的 `docs/` 目录查看。本项目只改了数值、层配置、CSS 与少量本地化，引擎 API 仍以上游文档为准。
