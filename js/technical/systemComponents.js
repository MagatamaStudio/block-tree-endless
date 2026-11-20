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
		template: `<div v-bind:style="[tmp[layer].style ? tmp[layer].style : {}, (tmp[layer].tabFormat && !Array.isArray(tmp[layer].tabFormat)) ? tmp[layer].tabFormat[player.subtabs[layer].mainTabs].style : {}]" class="noBackground">
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
		<div class="overlayThing" style="padding-bottom:7px; width: 90%; z-index: 1000; position: relative">
		<span v-if="player.devSpeed && player.devSpeed != 1" class="overlayThing">
			<br>加速：{{format(player.devSpeed)}}x<br>
		</span>
		<span v-if="player.offTime !== undefined"  class="overlayThing">
			<br>离线时间：{{formatTime(player.offTime.remain)}}<br>
		</span>
		<br>
		<span v-if="player.points.lt('1e1000')"  class="overlayThing">拥有 </span>
		<h2  class="overlayThing" id="points">{{format(player.points)}}</h2>
		<span v-if="player.points.lt('1e1e6')"  class="overlayThing"> {{modInfo.pointsName}}</span>
		<br>
		<span v-if="canGenPoints()"  class="overlayThing">({{tmp.other.oompsMag != 0 ? format(tmp.other.oomps) + " OOM" + (tmp.other.oompsMag < 0 ? "^OOM" : tmp.other.oompsMag > 1 ? "^" + tmp.other.oompsMag : "") + "s" : formatSmall(getPointGen())}}/秒)</span>
		<div v-for="thing in tmp.displayThings" class="overlayThing"><span v-if="thing" v-html="thing"></span></div>
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
            <summary style="cursor: pointer; color: #f5c542; font-size: 16px; text-align: left;">起步与原版六层</summary>
            <div style="margin: 6px 0 10px 18px; text-align: left;">
                点「徒手撸树」攒原木，点「转化为」合成木板；按住升级按钮可以连买。<br>
                橡木林先买木斧、工作台、树场，再补木镐、骨粉与效率 V；木板越多，原木产量越高。<br>
                之后逐层推进：石矿洞 → 铁矿脉 → 钻石层 → 下界 → 末地。每层优先 11 号产量、12 号自动设施、13 号产量，再买 21 号全局加成（原版 21 号是乘算，性价比最高）。<br>
                原版层没有时间墙，攒够前置资源随时声望；末地首通后进入暮色森林。
            </div>
        </details><br>
        <details style="margin: 4px 0; text-align: left; line-height: 1.7; font-size: 15px;">
            <summary style="cursor: pointer; color: #f5c542; font-size: 16px; text-align: left;">模组层：首通与建设顺序</summary>
            <div style="margin: 6px 0 10px 18px; text-align: left;">
                每层固定 10 升级、4 设施 + 主题核心、10 里程碑、3 挑战。<br>
                首通路线：攒到 5 倍需求解锁主题核心 → 10/25/60 倍拿 5、6、7 号里程碑（6 号把主题特性翻倍）→ 等墙或跳墙 → 首通后在商店用本层资源买自动化（2 倍需求）。<br>
                升级顺序：11 产量 → 12 自动 → 13 产量 → 15 签名升级（7–10 倍）→ 21 全局 +10% → 22 增益设施 → 23 软上限 → 24 产量与上限设施 → 25 时间设施。<br>
                设施：生产先跑起来，增益最值（20 级封顶），软上限开始压缩收益时再买上限设施，时间设施只在首通等墙时买（13 级封顶）。
            </div>
        </details><br>
        <details style="margin: 4px 0; text-align: left; line-height: 1.7; font-size: 15px;">
            <summary style="cursor: pointer; color: #f5c542; font-size: 16px; text-align: left;">时间墙 / 软上限 / 自动化</summary>
            <div style="margin: 6px 0 10px 18px; text-align: left;">
                模组层需要等满时间墙才能声望；升级与设施会缩短时间墙，原版六层没有时间墙。<br>
                每层首通后不再计时；首通前优先用跳墙券免费跳过，没有券时再花上一层 3 倍需求的资源。<br>
                跳墙券是成就奖励：每完成 3 个成就 +1 张，最多 16 张；有券时自动优先消耗，不再扣上一层资源。<br>
                跳过只满足时间墙，声望仍要求上一层资源达到需求，因此用资源跳过时实际需准备约 4 倍，且会削弱本次收益。<br>
                单次声望收益超过软上限后按平方根折算；本层资源、历史最高与累计总量没有存储上限。<br>
                声望会级联重置：每次最多回退本层及下面 4 层，更低层的点数与资源（原木、木板、圆石等）保留；被回退的更低层保留已首通的 12 号升级与 1 级生产设施，本层点数与升级不重置。挑战完成记录与首通标记永久保留。<br>
                自动化覆盖普通升级、购买项与自动声望：前置资源（上一层资源）达到 1.5 倍需求时自动声望，可在商店顶部关闭；任意挑战进行中暂停。自动声望不会回退到上次声望的下限以下；想重置更低层时手动声望该层。自动购买会为下一层声望保留所需资源；科技层 15–17 号研究分支仍需手动分配。
            </div>
        </details><br>
        <details style="margin: 4px 0; text-align: left; line-height: 1.7; font-size: 15px;">
            <summary style="cursor: pointer; color: #f5c542; font-size: 16px; text-align: left;">挑战与层机制</summary>
            <div style="margin: 6px 0 10px 18px; text-align: left;">
                挑战按 11 → 12 → 13 打：奖励依次是产量 ×1.5、软上限 ×1.25、自动 ×1.5；进入时本层点数清零，退出或完成时按较大值恢复；挑战中自动化暂停。<br>
                原型机制：采集等墙越久自动越快，别急着声望；科技每次声望给研究点，需手动分配；魔法先点咒语再声望；工业多买设施；探索按需要切换快、稳、丰路线。<br>
                前 6 层专属机制是迷宫、花圃、电压档位、虚空凝视、网络优先级与混沌风险；其余层轮换潮汐、轮转、回响、矩阵、赌局、储备、过载、共鸣。状态都显示在「本层规则」卡里，可操作的机制在点击卡 13。<br>
                潮汐与轮转的倍率在声望瞬间结算，等产量相位再点声望；回响的累计次数跨重置保留。
            </div>
        </details><br>
        <details style="margin: 4px 0; text-align: left; line-height: 1.7; font-size: 15px;">
            <summary style="cursor: pointer; color: #f5c542; font-size: 16px; text-align: left;">全局成长与挂机</summary>
            <div style="margin: 6px 0 10px 18px; text-align: left;">
                深层反哺：第三层起，每层历史最高资源永久提升原木基础产量，声望、级联重置与挑战都不会清零，各层加成线性相加。<br>
                全局加成来源：原版 21 号乘算、模组 21 号每层 +10%、共鸣特性、52 个成就与 13 个层间任务（全部完成 +92%）。<br>
                挂机：首通后买自动化并打开自动声望；自动购买会保留下一层需求，研究点仍需手动；离线收益上限 12 小时，按约 10 倍速度回填。<br>
                跳墙券留给新的模组层首通；任务进度只增不减，不用手动领取。
            </div>
        </details><br>
        <h3>快捷键</h3><br>
        <span v-for="key in hotkeys" v-if="player[key.layer].unlocked && tmp[key.layer].hotkeys[key.id].unlocked"><br>{{key.description}}</span></div>
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

