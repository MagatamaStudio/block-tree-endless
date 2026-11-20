# 成就系统

## 总览

当前共有 **52 个成就**：

- **22 个基础/旧模组成就**：ID `11–14`、`21–24`、`31–34` 与 `41–50`。
- **30 个模组层「投产」成就**：ID `51–80`，每个模组层一个。

成就属于侧边层 `a`，在科技树右侧的「成就」节点打开。

## 奖励

| 成就范围 | 奖励 |
| --- | --- |
| 13 / 14 | 所有产量 ×1.1 |
| 21 / 22 / 24 / 31 / 32 | ×1.15 / ×1.2 / ×1.25 / ×1.3 / ×1.5 |
| 41–50 | 每个 ×1.05 |
| 51–80 | 每个 ×1.015 |

**跳墙券**：每完成 3 个成就获得 1 张（最多 16 张），可在首通前免费跳过当前层的时间墙。已用数量记在 `player.a.wallSkipUsed`，`wallSkipEarned()` / `wallSkipLeft()` 位于 `js/layers/achievements.js`。有券时「跳过时间墙」卡片自动优先消耗 1 张、不扣上层资源，并显示没有券时需要多少资源；没有券时回退为消耗上一层 3 × `req` 资源。声望条件不足时点击会弹出确认，避免误耗券或资源后再被挑战重置。

产量奖励在 `js/mod.js` 的 `globalProductionMult()` 中汇总：

```js
for (let i = 41; i <= 50; i++) {
    if (hasAchievement("a", i)) mult = mult.times(1.05)
}
for (let i = 51; i <= 80; i++) {
    if (hasAchievement("a", i)) mult = mult.times(1.015)
}
```

## 模组成就

`js/layers/achievements.js` 中的静态 `MOD_ACH` 列表与 `js/layers/modpack.js` 的 `MOD_THEMES` 顺序一一对应：

```js
const MOD_ACH = [
    { id: "t", name: "暮色森林", image: "img/twilight_moss.png", resource: "娜迦鳞片" },
    // ...
]
```

生成逻辑：

```js
for (let i = 0; i < MOD_ACH.length; i++) {
    const cfg = MOD_ACH[i]
    layers.a.achievements[51 + i] = {
        name: cfg.name + "·投产",
        image: cfg.image,
        done() { return player[cfg.id] && player[cfg.id].points.gte(1) },
        tooltip: "让「" + cfg.name + "」产出第一份" + cfg.resource + "。" +
                 "<br><br><b>奖励：所有产量 ×1.015</b>",
    }
}
```

`ACH_TOTAL` 根据 `22 + MOD_ACH.length` 自动更新，成就墙标题会显示正确的总数。

## 新增一个模组成就

1. 在 `MOD_ACH` 末尾加入对应层的数据。
2. 确保 `id` 与 `MOD_THEMES` 中的层 id 一致。
3. 确保贴图路径存在。
4. 刷新页面，确认成就墙总数增加，且新成就在产出第一份资源后自动完成。

如果成就总数超过 80，需要同时扩大 `globalProductionMult()` 中 `51–80` 的循环范围。

## 成就墙布局

成就 ID 按首位决定行、末位决定列：

- `11–34`：基础成就。
- `41–50`：第一批模组成就。
- `51–80`：30 个模组层投产成就。

新增成就时，尽量按现有编号规律追加，避免打乱网格布局。

## 说明

成就 `done()` 在每帧检查，完成时会触发弹窗「成就达成！」。成就本身不会被声望重置，属于跨周目永久进度。
