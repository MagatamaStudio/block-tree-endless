# 方块树：无尽模组海

一个基于 [The Modding Tree](https://github.com/Acamaeda/The-Modding-Tree) 的 Minecraft 整合包放置游戏。

从徒手撸树开始，推进 6 个原版维度与 30 个模组维度。每个模组层都有独立的资源、升级、自动化设施、时间墙与软上限，原版六层没有时间墙与上限；本层资源没有存储上限，越往后收益递减越明显，没有固定通关时长。

## 快速开始

```bash
cd block-tree-endless
python -m http.server 8000
```

打开 <http://127.0.0.1:8000/>。

原木初始产出 0.5/秒，点击「橡木林」中的「徒手撸树」可以加速；随后通过「转化为」进入石矿洞，逐层推进。

## 当前版本

- 版本：**v6.0「首通与自动化」**
- 科技树：**36 层**（6 原版 + 30 模组）
- 每个模组层：10 个升级（含主题签名升级）、4 座自动化设施 + 主题核心、8 个里程碑、3 个挑战
- 5 套原型机制、8 类主题特性，30 层与 30 个主题一一对应
- 成就：**52 个**
- 全局难度：需求、升级价格、设施造价 ×5.0
- 无尽模式：没有固定终点

## 文档索引

- [玩法与进度](gameplay.md)：层解锁、资源链、时间墙与软上限的实际玩法。
- [数值与平衡](balance.md)：声望公式、难度系数、软上限、时间墙的计算方式。
- [开发指南](development.md)：目录结构、如何新增模组层、升级、设施、成就与贴图。
- [成就系统](achievements.md)：52 个成就的编号、奖励与扩展方式。
- [彩蛋控制台](easter-egg.md)：设置页隐藏入口、口令与本地作弊码。
- [自动化商店](shop.md)：用下一层资源购买上一层自动购买权（升级与购买项）的价格与规则。
- 上游引擎文档：The Modding Tree 原文档未随本仓库附带，可参考项目页（见开头链接）的 `docs/` 目录。

## 代码入口

- `js/mod.js`：游戏名、版本、原木产量、全局倍率、难度、无尽模式。
- `js/layers/overworld.js`：橡木林、石矿洞、铁矿脉、钻石层。
- `js/layers/nether_end.js`：下界、末地。
- `js/layers/modpack.js`：30 个模组层的配置与工厂。
- `js/layers/achievements.js`：52 个成就。
- `js/tree.js`：科技树入口。
- `css/minecraft.css`：Minecraft 风格界面与字体。
- `img/`：原创像素贴图。
- `tools/generate_textures.py`：贴图生成脚本。

## 说明

本项目是非商业同人作品，与 Mojang Studios / Microsoft 无关。所有贴图均为原创像素画；模组名称仅用于致敬。引擎版权归 The Modding Tree 作者所有，详见根目录 `LICENSE` 与 `Prestige-tree-license`。
