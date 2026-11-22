var systemComponents = {
	'tab-buttons': {
		props: ['layer', 'data', 'name'],
		template: `
			<div class="upgRow">
				<div v-for="tab in Object.keys(data)">
					<button v-if="data[tab].unlocked == undefined || data[tab].unlocked" v-bind:class="{tabButton: true, notify: subtabShouldNotify(layer, name, tab), resetNotify: subtabResetNotify(layer, name, tab)}"
					v-bind:style="[{'border-color': tmp[layer].color}, (subtabShouldNotify(layer, name, tab) ? {'box-shadow': 'var(--hqProperty2a), 0 0 20px '  + (data[tab].glowColor || defaultGlow)} : {}), tmp[layer].componentStyles['tab-button'], data[tab].buttonStyle]"
						v-on:click="function(){player.subtabs[layer][name] = tab; updateTabFormats(); needCanvasUpdate = true;}">{{tab}}</button>
				</div>
			</div>
		`
	},

	'tree-node': {
		props: ['layer', 'abb', 'size', 'prev'],
		template: `
		<button v-if="nodeShown(layer)"
			v-bind:id="layer"
			v-on:click="function() {
				if (shiftDown && options.forceTooltips) player[layer].forceTooltip = !player[layer].forceTooltip
				else if(tmp[layer].isLayer) {
					if (tmp[layer].leftTab) {
						showNavTab(layer, prev)
						showTab('none')
					}
					else
						showTab(layer, prev)
				}
				else {run(layers[layer].onClick, layers[layer])}
			}"


			v-bind:class="{
				treeNode: tmp[layer].isLayer,
				treeButton: !tmp[layer].isLayer,
				smallNode: size == 'small',
				[layer]: true,
				tooltipBox: true,
				forceTooltip: player[layer].forceTooltip,
				ghost: tmp[layer].layerShown == 'ghost',
				hidden: !tmp[layer].layerShown,
				locked: tmp[layer].isLayer ? !(player[layer].unlocked || tmp[layer].canReset) : !(tmp[layer].canClick),
				notify: tmp[layer].notify && player[layer].unlocked,
				resetNotify: tmp[layer].prestigeNotify,
				can: ((player[layer].unlocked || tmp[layer].canReset) && tmp[layer].isLayer) || (!tmp[layer].isLayer && tmp[layer].canClick),
				front: !tmp.scrolled,
			}"
			v-bind:style="constructNodeStyle(layer)">
			<span class="nodeLabel" v-html="abb !== '' ? abb : '&nbsp;'"></span>
			<tooltip
      v-if="tmp[layer].tooltip != ''"
			:text="(tmp[layer].isLayer) ? (
				player[layer].unlocked ? (tmp[layer].tooltip ? tmp[layer].tooltip : formatWhole(player[layer].points) + ' ' + tmp[layer].resource)
				: (tmp[layer].tooltipLocked ? tmp[layer].tooltipLocked : 'Reach ' + formatWhole(tmp[layer].requires) + ' ' + tmp[layer].baseResource + ' to unlock (You have ' + formatWhole(tmp[layer].baseAmount) + ' ' + tmp[layer].baseResource + ')')
			)
			: (
				tmp[layer].canClick ? (tmp[layer].tooltip ? tmp[layer].tooltip : 'I am a button!')
				: (tmp[layer].tooltipLocked ? tmp[layer].tooltipLocked : 'I am a button!')
			)"></tooltip>
			<node-mark :layer='layer' :data='tmp[layer].marked'></node-mark></span>
		</button>
		`
	},

	
	'layer-tab': {
		props: ['layer', 'back', 'spacing', 'embedded'],
		template: `<div v-bind:id="'layer-' + layer" v-bind:style="[tmp[layer].style ? tmp[layer].style : {}, (tmp[layer].tabFormat && !Array.isArray(tmp[layer].tabFormat)) ? tmp[layer].tabFormat[player.subtabs[layer].mainTabs].style : {}]" class="noBackground">
		<div v-if="back"><button v-bind:class="back == 'big' ? 'other-back' : 'back'" v-on:click="goBack(layer)">←</button></div>
		<div v-if="!tmp[layer].tabFormat">
			<div v-if="spacing" v-bind:style="{'height': spacing}" :key="this.$vnode.key + '-spacing'"></div>
			<infobox v-if="tmp[layer].infoboxes" :layer="layer" :data="Object.keys(tmp[layer].infoboxes)[0]":key="this.$vnode.key + '-info'"></infobox>
			<main-display v-bind:style="tmp[layer].componentStyles['main-display']" :layer="layer"></main-display>
			<div v-if="tmp[layer].type !== 'none'">
				<prestige-button v-bind:style="tmp[layer].componentStyles['prestige-button']" :layer="layer"></prestige-button>
			</div>
			<resource-display v-bind:style="tmp[layer].componentStyles['resource-display']" :layer="layer"></resource-display>
			<milestones v-bind:style="tmp[layer].componentStyles.milestones" :layer="layer"></milestones>
			<div v-if="Array.isArray(tmp[layer].midsection)">
				<column :layer="layer" :data="tmp[layer].midsection" :key="this.$vnode.key + '-mid'"></column>
			</div>
			<clickables v-bind:style="tmp[layer].componentStyles['clickables']" :layer="layer"></clickables>
			<buyables v-bind:style="tmp[layer].componentStyles.buyables" :layer="layer"></buyables>
			<upgrades v-bind:style="tmp[layer].componentStyles['upgrades']" :layer="layer"></upgrades>
			<challenges v-bind:style="tmp[layer].componentStyles['challenges']" :layer="layer"></challenges>
			<achievements v-bind:style="tmp[layer].componentStyles.achievements" :layer="layer"></achievements>
			<br><br>
		</div>
		<div v-if="tmp[layer].tabFormat">
			<div v-if="Array.isArray(tmp[layer].tabFormat)"><div v-if="spacing" v-bind:style="{'height': spacing}"></div>
				<column :layer="layer" :data="tmp[layer].tabFormat" :key="this.$vnode.key + '-col'"></column>
			</div>
			<div v-else>
				<div class="upgTable" v-bind:style="{'padding-top': (embedded ? '0' : '25px'), 'margin-top': (embedded ? '-10px' : '0'), 'margin-bottom': '24px'}">
					<tab-buttons v-bind:style="tmp[layer].componentStyles['tab-buttons']" :layer="layer" :data="tmp[layer].tabFormat" :name="'mainTabs'"></tab-buttons>
				</div>
				<layer-tab v-if="tmp[layer].tabFormat[player.subtabs[layer].mainTabs].embedLayer" :layer="tmp[layer].tabFormat[player.subtabs[layer].mainTabs].embedLayer" :embedded="true" :key="this.$vnode.key + '-' + layer"></layer-tab>
				<column v-else :layer="layer" :data="tmp[layer].tabFormat[player.subtabs[layer].mainTabs].content" :key="this.$vnode.key + '-col'"></column>
			</div>
		</div></div>
			`
	},

	'overlay-head': {
		template: `			
		<div class="overlayThing head-hud" v-bind:class="{ 'head-hud-home': player.tab === 'none' }" style="z-index: 1000; position: relative">
		<div class="hud-meta" v-if="(player.devSpeed && player.devSpeed != 1) || player.offTime !== undefined">
			<span v-if="player.devSpeed && player.devSpeed != 1">加速：{{format(player.devSpeed)}}x</span>
			<span v-if="player.offTime !== undefined">离线时间：{{formatTime(player.offTime.remain)}}</span>
		</div>
		<div class="hud-main">
			<span v-if="player.points.lt('1e1000')" class="hud-label">拥有</span>
			<h2 id="points">{{format(player.points)}}</h2>
			<span v-if="player.points.lt('1e1e6')" class="hud-label">{{modInfo.pointsName}}</span>
		</div>
		<div v-if="canGenPoints()" class="hud-rate">每秒 +{{tmp.other.oompsMag != 0 ? format(tmp.other.oomps) + " OOM" + (tmp.other.oompsMag < 0 ? "^OOM" : tmp.other.oompsMag > 1 ? "^" + tmp.other.oompsMag : "") + "s" : formatSmall(getPointGen())}} {{modInfo.pointsName}}</div>
		<div v-if="hudSubText()" class="hud-sub">
			<span class="hud-sub-res" v-html="hudSubText()"></span>
			<span v-if="hudDepthText()" class="hud-chip" v-html="hudDepthText()"></span>
			<span v-if="hudModText()" class="hud-chip" v-html="hudModText()"></span>
		</div>
		<div v-for="thing in tmp.displayThings" class="hud-line"><span v-if="thing" v-html="thing"></span></div>
	</div>
	`
    },

    'info-tab': {
        template: `
        <div>
        <h2>{{modInfo.name}}</h2>
        <br>
        <h3>{{VERSION.withName}}</h3>
        <span v-if="modInfo.author">
            <br>
            作者：{{modInfo.author}}	
        </span>
        <br>
        引擎：The Modding Tree <a v-bind:href="'https://github.com/Acamaeda/The-Modding-Tree/blob/master/changelog.md'" target="_blank" class="link" v-bind:style = "{'font-size': '14px', 'display': 'inline'}" >{{TMT_VERSION.tmtNum}}</a>（Acamaeda / FlamemasterNXF）
        <br>
        原版 Prestige Tree：Jacorb / Aarex
		<br><br>
		<div class="link" onclick="showTab('changelog-tab')">更新日志</div><br>
        <span v-if="modInfo.discordLink"><a class="link" v-bind:href="modInfo.discordLink" target="_blank">{{modInfo.discordName}}</a><br></span>
		<br><br>
        游玩时间：{{ formatTime(player.timePlayed) }}<br><br>
        <h3>游戏攻略</h3><br>
<details style="margin: 4px 0; text-align: left; line-height: 1.7; font-size: 15px;">
<summary style="cursor: pointer; color: #f5c542; font-size: 16px; list-style-position: inside;">起步与原版六层</summary>
<div style="margin: 6px 0 10px 18px; text-align: left;">
点「徒手撸树」攒原木，点「转化为」合成木板；按住升级按钮可以连买，连点也会累积连击（+15%/层，最多 5 层）。<br>
橡木林先买木斧、工作台、树场，再补木镐、骨粉与效率 V；木板越多，原木产量越高。<br>
之后逐层推进：石矿洞 → 铁矿脉 → 钻石层 → 下界 → 末地。每层优先 11 号产量、12 号自动设施、13 号产量，再买 21 号全局加成（原版 21 号是乘算，性价比最高）。<br>
原版层不需要施工，前置层点数池到界面显示的需求就能声望；末地首通后进入暮色森林，也就是 30 个模组层的第一层。
</div>
</details><br>
<details style="margin: 4px 0; text-align: left; line-height: 1.7; font-size: 15px;">
<summary style="cursor: pointer; color: #f5c542; font-size: 16px; list-style-position: inside;">模组层：首通与建设顺序</summary>
<div style="margin: 6px 0 10px 18px; text-align: left;">
每层固定 10 升级、4 设施 + 主题核心、10 里程碑、3 挑战。<br>
声望门槛只有一条：前置层点数池 ≥ 本层显示的需求（首通后还要求单次收益 ≥ 1）。首通不计施工，但施工越满收益越高。<br>
首通路线：攒到 5 倍需求解锁主题核心 → 10／25／60 倍拿 5、6、7 号里程碑（6 号把主题特性翻倍）→ 投入上一层资源完成施工 → 首通后用本层资源在商店买自动化（2 倍需求）。<br>
施工分三档投入：25%（卡片 12）、50%（卡片 14）、全部投入（卡片 15），材料从上一层点数扣。第一次「施工完成后声望」额外 +25% 收益，每层只有一次。<br>
升级顺序：11 产量 → 12 自动 → 13 产量 → 15 签名升级（7–10 倍）→ 21 全局 +10% → 22 增益设施 → 23 软上限 → 24 产量与上限设施 → 25 施工设施。<br>
设施：生产先跑起来，增益最值（20 级封顶），软上限开始压缩收益时再买上限设施，施工设施只在首通投入阶段买（13 级封顶）。<br>
首通前还能押一次注（卡片 16–18），见「主动玩法」；每层每轮只有一次，押完就没了。
</div>
</details><br>
<details style="margin: 4px 0; text-align: left; line-height: 1.7; font-size: 15px;">
<summary style="cursor: pointer; color: #f5c542; font-size: 16px; list-style-position: inside;">主动玩法：专精 · 连击 · 裂隙 · 押注</summary>
<div style="margin: 6px 0 10px 18px; text-align: left;">
层专精：每层页面中段有一张专精卡，产能（本层产量与自动产出 ×2.5）、施工（施工需求 −45%）、声望（收益 ×1.8、产量 ×0.9）三选一，免费，选定后本轮不能再改，挑战进行中也选不了，转生才重置。前几层建议产能，卡在施工上就选施工，需要快速滚声望时选声望。<br>
点击连击：任意点击每 3 次叠一层，每层全局产量 +15%，最多 5 层（+75%），30 秒不点清零。挂机前点几下不算浪费体力，但别指望它顶上产量。<br>
裂隙：侧栏「裂隙」每 4–7 分钟开一次，限时 90 秒完成，完成后给 10 分钟增益。坍缩＝点 15 次徒手撸树（全局产量 ×2）；过载＝买 8 次升级或设施（全局产量 ×1.5，自动购买不计入）；商队＝投入 3 次施工材料（该层施工 +25%）。顺手做掉，收益相当于白送的 10 分钟。<br>
押注：首通前（且本轮还没押过）可押上一层点数的 30%／60%／100%。胜率 50%，本层每完成一个挑战 +5%（最高 65%）；赢＝拿回 1.2 ÷ 胜率倍数的押注额并补 10% 施工，输＝押注归零、扣 15% 施工。押注上限会强制留下 1 倍需求，声望按钮不会被押灰，但本金见底时别全押。
</div>
</details><br>
<details style="margin: 4px 0; text-align: left; line-height: 1.7; font-size: 15px;">
<summary style="cursor: pointer; color: #f5c542; font-size: 16px; list-style-position: inside;">施工 / 软上限 / 自动化</summary>
<div style="margin: 6px 0 10px 18px; text-align: left;">
首通前要投入上一层资源推进施工：投入满额拿 100% 声望收益，投入一部分也能声望，收益按施工进度从 30% 线性爬升；升级、设施与「施工」专精会降低施工需求，原版六层不需要施工。<br>
每层首通后不再检查施工、收益固定 100%。投入的材料从上一层资源扣除，声望本身仍要求点到需求，记得给声望留足本金。<br>
单次声望收益超过软上限后按平方根折算；本层资源、历史最高与累计总量没有存储上限。<br>
声望会级联重置：每次最多回退本层及下面 2 层（共 3 层），更低层的点数与资源（原木、木板、圆石等）保留；被回退的更低层保留已首通的 12 号升级与 1 级生产设施，本层点数与升级不重置。挑战完成记录与首通标记永久保留。<br>
自动化覆盖普通升级、购买项与自动声望：每张商品卡片内有自动购买与自动声望两个开关，商店顶部的总开关可一次性关闭所有自动声望；任意挑战进行中暂停，世界词条「静默」下自动购买全部失效。<br>
前置资源达到 1.5 倍需求、且本轮施工完成时自动声望，但不会回退到上次声望的下限以下；商店顶部会显示下限与被暂停的层数，想重置更低层时手动声望该层。自动购买会为下一层声望保留所需资源；科技层 15–17 号研究分支仍需手动分配。
</div>
</details><br>
<details style="margin: 4px 0; text-align: left; line-height: 1.7; font-size: 15px;">
<summary style="cursor: pointer; color: #f5c542; font-size: 16px; list-style-position: inside;">挑战与层机制</summary>
<div style="margin: 6px 0 10px 18px; text-align: left;">
挑战按 11 → 12 → 13 打：奖励依次是产量 ×1.5、软上限 ×1.25、自动 ×1.5；进入时本层点数清零，退出或完成时按较大值恢复；挑战中自动化暂停、不能改专精。<br>
挑战总览：30 层共 90 个挑战，每通过一个额外 +0.5% 全局产量，每满 10 个再 +5%，全清共 +90%，科技树页底部实时显示「挑战 n / 90」。后期别跳过挑战，它是纯靠手打就能换来的全局乘区。<br>
原型机制：采集施工越满自动越快，别急着声望；科技每次声望给研究点，需手动分配；魔法先点咒语再声望；工业多买设施；探索按需要切换快、稳、丰路线。<br>
前 6 层专属机制是迷宫、花圃、电压档位、虚空凝视、网络优先级与混沌风险；其余层轮换潮汐、轮转、回响、矩阵、赌局、储备、过载、共鸣。状态都显示在「本层规则」卡里，可操作的机制在点击卡 13。<br>
潮汐与轮转的倍率在声望瞬间结算，等产量相位再点声望；回响的累计次数跨重置保留。
</div>
</details><br>
<details style="margin: 4px 0; text-align: left; line-height: 1.7; font-size: 15px;">
<summary style="cursor: pointer; color: #f5c542; font-size: 16px; list-style-position: inside;">转生 · 记忆 · 世界词条</summary>
<div style="margin: 6px 0 10px 18px; text-align: left;">
20 层首通后侧栏就出现「模组记忆」，这时只能领期中 5 点；30 层全部首通才能真转生。真转生除记忆等级与记忆点外全部清零：资源、升级、设施、首通标记、挑战、成就、层间任务、商店自动化与深层反哺都要重来。<br>
每轮固定 10 点，分两笔：期中 5 点（本轮首通 20 层 <b>且</b> 本轮声望满 50 次，点「领取期中」就能拿，不重置进度、可以接着打）+ 全通 5 点（30 层全通后转生时一起结清，轮数 +1）。总额 = 已冻结轮数 × 10 + 本轮已赚，挂机多久、自动声望刷了多少次都不会超过这条线（旧公式按累计声望算，挂几小时就能刷满 736 点）。<br>
封顶折扣：转生那一刻按这一轮的声望结算，每 100 次 −1%，上限 −10%，下一轮一直有效 —— 一轮跑得越透，下轮买记忆越便宜，八条线全满因此从 736 点降到 667 点（约 67 轮）。折扣按整条轨道的累计价取整，最便宜的一两级本来只有 2–3 点，抹零后可能看不出变化。<br>
记忆有 8 条线，升级价格一样（2 × 1.45^等级）：洪流（全局产量 +10%／级）、扩容（软上限 ×1.06）、起手（转生后直接给生产设施）、捷径（自动声望收益 ×1.10）、熟路（施工需求 −6%）、丰产（模组声望收益 ×1.15）、自动（模组自动产出 ×1.25）、深潜（深层反哺指数 +0.02）。前期洪流与捷径最实在，起手能让每轮开局直接跳过手动积累。<br>
买法：转生后先看折扣价，把便宜的 1–3 级在几条线上铺开，比把一条点深划算；下一级的价格是整条轨道累计价的差，所以同一档折扣下越深的等级省得越多。<br>
世界词条：每次转生后从 8 条里抽 3 条选 1 条，持续一整轮，有得有失——贫瘠（施工 ×1.3、收益 ×1.25）、丰饶（施工 ×0.8、产量 ×0.85）、静默（自动购买失效、产量 ×2）、疾行（施工 ×0.75、收益 ×0.9）、潮汐（软上限 ×1.3、产量 ×0.9）、回响（收益 ×1.15、点击 ×0.5）、徒手（点击 ×3、产量 ×0.6）、失衡（收益 ×1.5、软上限 ×0.75）。挂机选丰饶或疾行，手动滚收益选失衡或贫瘠，别在靠自动购买的轮次选静默。
</div>
</details><br>
<details style="margin: 4px 0; text-align: left; line-height: 1.7; font-size: 15px;">
<summary style="cursor: pointer; color: #f5c542; font-size: 16px; list-style-position: inside;">转生循环：一轮怎么打</summary>
<div style="margin: 6px 0 10px 18px; text-align: left;">
① 开轮：转生后先在「模组记忆」把新记忆花掉（折扣只在转生那一刻结算，越早买越清楚这一轮的价格），再选世界词条 —— 词条三选一，整轮有效，抽完不选不生效。<br>
② 铺层：从徒手撸树重刷，原版六层用 10 分钟过渡，然后按 30 层顺序推首通。专精按处境换：前几层产能，卡施工换施工，只差一点声望才换声望。<br>
③ 期中：本轮首通满 20 层、本轮声望满 50 次后，回记忆页点「领取期中 5 记忆」—— 不重置进度，领完继续打这 30 层，别浪费后面的进度。<br>
④ 全通：把 30 层全部首通（挑战能做就做，它也是全局乘区）；记忆页顶部显示「已首通 30 / 30」才允许真转生。<br>
⑤ 转生并领取：点「转生并领取 N 记忆」，这一轮的声望会折算成下一轮折扣，然后回到 ①。<br>
节奏感：第 1 轮大约是一次完整的 30 层通关，之后每轮靠记忆起手、熟路与自动声望加速重建；全满 62 级 = 667 点，封顶折扣下大约 67 轮。<br>
别做的事：只刷到 20 层领了期中就转 —— 少拿 5 点，还把这一轮的声望（也就是下轮折扣）压得很低；反过来，明明能全通却先转，等于白送一轮进度。
</div>
</details><br>
<details style="margin: 4px 0; text-align: left; line-height: 1.7; font-size: 15px;">
<summary style="cursor: pointer; color: #f5c542; font-size: 16px; list-style-position: inside;">全局成长与挂机</summary>
<div style="margin: 6px 0 10px 18px; text-align: left;">
深层反哺：第三层起，每层历史最高资源永久提升原木基础产量，声望、级联重置与挑战都不会清零，各层加成线性相加。<br>
全局加成来源：原版 21 号乘算、模组 21 号每层 +10%、专精与连击、共鸣特性、裂隙增益、52 个成就与 13 个层间任务（全部完成 +92%）、90 个挑战的总览加成（全清 +90%）、记忆洪流（每级 +10%）。<br>
挂机：首通后买自动化并打开本层自动声望（或交给总开关）；自动购买会保留下一层需求，研究点仍需手动；离线收益上限 12 小时，按约 10 倍速度回填。<br>
模组记忆是唯一的跨转生进度：转生只保留记忆等级与记忆点，其余全部重来；任务进度只增不减，不用手动领取。
</div>
</details><br>
<details style="margin: 4px 0; text-align: left; line-height: 1.7; font-size: 15px;">
<summary style="cursor: pointer; color: #f5c542; font-size: 16px; list-style-position: inside;">卡住了？常见问题</summary>
<div style="margin: 6px 0 10px 18px; text-align: left;">
声望按钮是灰的：先看前置层点数池够不够本层显示的需求；首通后还要单次收益 ≥ 1，收益太小就先补产量或买 21 号。<br>
收益只有 +1：收益被软上限压平了，去补上限设施（24 号）或完成 12 号挑战（软上限 ×1.25），也可以换「声望」专精。<br>
自动声望不触发：检查商店里该层的开关、总开关、是否处于挑战中、世界词条是否「静默」，以及本轮施工有没有完成。<br>
首通后卡在同一层：模组层靠累计历史最高推进里程碑，先做 3 个挑战（+产量／+上限／+自动），再考虑押注和裂隙增益，最后才转生。<br>记忆页没出现：要首通 20 个模组层；真转生会清空首通标记，之后靠「已领过记忆」继续显示。<br>这一轮买记忆没便宜：折扣是转生时按上一轮声望结算的，转生后声望清零不会实时变；另外最便宜的 1–2 级只有 2–3 点，抹零后看不出差别。<br>转生后重建太慢：先补记忆起手与熟路，起手直接给每层的生产设施，熟路把施工需求压下去；第一轮重建慢是正常的。<br>
想重开：设置页有硬重置，导出存档再动手。
</div>
</details><br>
<h3>快捷键</h3><br>
        <span v-for="key in hotkeys" v-if="player[key.layer].unlocked && tmp[key.layer].hotkeys[key.id].unlocked"><br>{{key.description}}</span>
        <br><br>
        <h3>鸣谢</h3><br>
        <div style="font-size: 15px; line-height: 1.7; padding: 0 18px;">给出建议的各位友友们</div></div>
    `
    },

    'options-tab': {
        template: `
        <table>
            <tr>
                <td><button class="opt" onclick="save()">保存游戏</button></td>
                <td><button class="opt" onclick="toggleOpt('autosave')">自动保存：{{ options.autosave?"开启":"关闭" }}</button></td>
                <td><button class="opt" onclick="hardReset()">硬重置</button></td>
            </tr>
            <tr>
                <td><button class="opt" onclick="exportSave()">导出存档</button></td>
                <td><button class="opt" onclick="importSave()">导入存档</button></td>
                <td><button class="opt" onclick="toggleOpt('offlineProd')">离线收益：{{ options.offlineProd?"开启":"关闭" }}</button></td>
            </tr>
            <tr>
                <td><button class="opt" onclick="switchTheme()">主题：{{ getThemeName() }}</button></td>
                <td><button class="opt" onclick="adjustMSDisp()">里程碑显示：{{ MS_DISPLAYS[MS_SETTINGS.indexOf(options.msDisplay)]}}</button></td>
                <td><button class="opt" onclick="toggleOpt('hqTree')">高质量科技树：{{ options.hqTree?"开启":"关闭" }}</button></td>
            </tr>
            <tr>
                <td><button class="opt" onclick="toggleOpt('hideChallenges')">已完成挑战：{{ options.hideChallenges?"隐藏":"显示" }}</button></td>
                <td><button class="opt" onclick="toggleOpt('forceOneTab'); needsCanvasUpdate = true">单页模式：{{ options.forceOneTab?"始终":"自动" }}</button></td>
				<td><button class="opt" onclick="toggleOpt('forceTooltips'); needsCanvasUpdate = true">Shift 点击切换提示：{{ options.forceTooltips?"开启":"关闭" }}</button></td>
				</tr> 
			<tr>
                <td colspan="3"><button class="opt" onclick="eggGate()">系统诊断</button></td>
            </tr>
        </table>`
    },

    'back-button': {
        template: `
        <button v-bind:class="back" onclick="goBack()">←</button>
        `
    },


	'tooltip' : {
		props: ['text'],
		template: `<div class="tooltip" v-html="text"></div>
		`
	},

	'node-mark': {
		props: {'layer': {}, data: {}, offset: {default: 0}, scale: {default: 1}},
		template: `<div v-if='data'>
			<div v-if='data === true' class='star' v-bind:style='{position: "absolute", left: (offset-10) + "px", top: (offset-10) + "px", transform: "scale( " + scale||1 + ", " + scale||1 + ")"}'></div>
			<img v-else class='mark' v-bind:style='{position: "absolute", left: (offset-22) + "px", top: (offset-15) + "px", transform: "scale( " + scale||1 + ", " + scale||1 + ")"}' v-bind:src="data"></div>
		</div>
		`
	},

	'particle': {
		props: ['data', 'index'],
		template: `<div><div class='particle instant' v-bind:style="[constructParticleStyle(data), data.style]" 
			v-on:click="run(data.onClick, data)"  v-on:mouseenter="run(data.onMouseEnter, data)" v-on:mouseleave="run(data.onMouseLeave, data)" ><span v-html="data.text"></span>
		</div>
		<svg version="2" v-if="data.color">
		<mask v-bind:id="'pmask' + data.id">
        <image id="img" v-bind:href="data.image" x="0" y="0" :height="data.width" :width="data.height" />
    	</mask>
    	</svg>
		</div>
		`
	},

	'bg': {
		props: ['layer'],
		template: `<div class ="bg" v-bind:style="[tmp[layer].style ? tmp[layer].style : {}, (tmp[layer].tabFormat && !Array.isArray(tmp[layer].tabFormat)) ? tmp[layer].tabFormat[player.subtabs[layer].mainTabs].style : {}]"></div>
		`
	}

}

