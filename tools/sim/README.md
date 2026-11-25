# 仿真工具

这几个脚本用 `node:vm` 把游戏真正跑起来（加载 `index.html` 里那串 js，喂一套最小 DOM 存根，接管主循环，用虚拟时钟推进），用来量数值，不用开浏览器。

| 文件 | 用途 | 用法 |
| --- | --- | --- |
| `env.mjs` | 搭沙箱、加载脚本、虚拟时钟 | 被其它脚本 import |
| `driver.mjs` | 自动玩法代理：点树、买东西、施工、挑战、结构、专精、自动声望 | `makeDriver(ctx, { spec: 1 })` |
| `smoke.mjs` | 冒烟测试：能启动 / 36 层都在 / 能推进 / 没有 NaN / 资源串对得上 | `node tools/sim/smoke.mjs`（CI 跑这条） |
| `full.mjs` | 36 层全通要多久（关掉代理主动转生） | `node tools/sim/full.mjs --hours=13 --speed=10 [--spec=0]` |
| `monitor.mjs` | 数值监测：需求 / 声望收益 / 峰值 / 门槛 / 升级设施，带体检 | `node tools/sim/monitor.mjs --hours=9 --speed=10` |
| `curve.mjs` | 带主动转生的轮次收益曲线 | `node tools/sim/curve.mjs` |
| `sweep.mjs` | 参数扫掠：自动产出倍率 × 专精，量全链时长（标定用） | `node tools/sim/sweep.mjs --scales=0.85,1,1.15 --specs=0,1` |

约定：

- `--speed=N` 是游戏内加速（`player.devSpeed`），`--hours` 是**游戏内**小时数；墙钟大约是它的 1/20–1/40。
- 随机数按 `seed 20260101` 固定，同一参数两次跑出同样的结果；改随机行为要显式传 seed。
- 基准口径：不选专精 8.70 小时 / 选产能 6.99 小时（v11.9）。代理默认选产能，量不选的口径传 `--spec=0`。
- 一次性探针不要留在仓库里：要临时量什么，写到系统临时目录，量完就删。
