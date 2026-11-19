# 数值与平衡

本文记录 v4.5 的关键公式，方便后续调整。所有数值都可以在 `js/mod.js`、`js/layers/modpack.js` 中修改。

## 全局难度

```js
const DIFFICULTY = new Decimal(5.0)
```

- 原版层需求与升级价格使用 `dReq()` / `upgCost()`，全部 ×5.0。
- 模组层的 `cfg.req = cfg.requires * 5.0`，升级、设施造价都基于这个值。
- 如果想让整体更难，把 `DIFFICULTY` 调到 6 或 10；如果只想改模组层，调整 `cfg.req` 的生成方式。

## 模组层需求

第 `i` 层（从 0 开始）：

```text
rawRequires = 128 * 3^i
requires    = rawRequires * 5.0
exponent    = max(0.2, 0.45 - i * 0.008)
effectExp   = max(0.3, 0.62 - i * 0.01)
```

- 第 0 层需求 640。
- 第 29 层原始需求约 8.7e15，乘难度后约 4.4e16。
- 声望指数逐层下降，后期单次声望增长更慢。

## 时间墙

```text
baseWall = min(12h, 900 * 1.22^i)
wall     = baseWall * arch.time
```

- 原型时间倍率：采集 0.9、科技 1.1、魔法 0.9、工业 1.0、探索 1.2。
- 25 号升级：`wall *= 0.8`。
- 时间设施每级减少 4%，最多减少 50%。

## 软上限与硬上限

```text
softcap = requires * arch.soft
hardcap = requires * arch.hard
```

| 原型 | soft 倍率 | hard 倍率 |
| --- | --- | --- |
| 采集 | 5 | 14 |
| 科技 | 4 | 10 |
| 魔法 | 7 | 18 |
| 工业 | 6 | 16 |
| 探索 | 9 | 25 |

再乘：

- 2 号里程碑：softcap ×2。
- 23 号升级：softcap ×1.5。
- 3 号里程碑：hardcap ×2。
- 24 号升级：hardcap ×1.5。
- 上限设施：每级 softcap/hardcap +15%。

硬上限会同时截断 `points` 与 `best`。达到硬上限后 `canReset` 为 false，`getResetGain` 返回 0。

## 声望收益

```text
gain = (前置资源 / requires)^exponent
     * gainMult^gainExp
```

随后：

```text
if (gain >= softcap) gain = sqrt(gain) * sqrt(softcap)
gain = floor(gain)
gain = min(gain, hardcap - 当前本层资源)
```

`gainMult` 的来源：

- 11 号升级：×arch.upg2（2 / 2.5 / 3）。
- 13 号升级：×arch.upg3（3 / 4）。
- 15 号升级：×arch.upg5（5 / 6 / 7）。
- 0/4 号里程碑：各 ×1.5。
- 增益设施：每级 ×arch.gain（1.08–1.15）。
- 21 号升级：全局 ×1.5。
- 下一层的 `effect()`：`(下一层资源 + 1)^effectExp`。
- 全局成就与旧层加成。

## 升级与设施造价

升级造价：

```text
cost = requires * factor * arch.cost
factor = [0.002, 0.004, 0.008, 0.015, 0.03, 0.05, 0.09, 0.14, 0.22, 0.34]
```

设施造价：

| 设施 | 基础系数 | 增长 |
| --- | --- | --- |
| 生产 | 0.01 × requires | 1.8^level |
| 增益 | 0.02 × requires | 1.9^level |
| 上限 | 0.03 × requires | 2.0^level |
| 时间 | 0.04 × requires | 2.1^level |

## 自动化产出

```text
passive = 生产设施等级 * arch.passive
        * (14 号升级 ? 1.5 : 1)
        * (1 号里程碑 ? 2 : 1)
```

原型的 `passive`：采集 0.06、科技 0.04、魔法 0.06、工业 0.05、探索 0.04。

## 调整建议

- **想更快**：降低 `requires` 的底数 128，或提高 `arch.passive` / `arch.gain`。
- **想更慢**：提高 `DIFFICULTY`、降低 `exponent`、提高时间墙指数 1.22。
- **想更强调软上限**：降低 `arch.soft` 或 `softcapPower`（当前固定 0.5）。
- **想更强调硬上限**：降低 `arch.hard`，或减少 `上限设施` 的 +15% 系数。
- **想压缩层数**：减少 `MOD_THEMES` 条目即可，工厂与成就会自动适配。

修改后建议至少验证：

1. 第一层能否在时间墙后正常声望。
2. 硬上限是否阻止 `best` 超过上限。
3. 下一层是否自动解锁。
4. 成就墙数量是否仍与 `ACH_TOTAL` 一致。
