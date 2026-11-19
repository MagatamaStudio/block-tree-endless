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
        <h3>玩法速查</h3><br>
        <details style="margin: 4px 0; text-align: left; line-height: 1.7; font-size: 15px;">
            <summary style="cursor: pointer; color: #f5c542; font-size: 16px; text-align: left;">起步流程</summary>
            <div style="margin: 6px 0 10px 18px; text-align: left;">
                点击「橡木林」里的「徒手撸树」获取原木，攒够后点「转化为」合成木板，逐层向下推进。<br>
                每层的声望会自动解锁下一层；原版六层之后是 30 个模组层，没有固定终点，时间墙与需求逐层提高。
            </div>
        </details><br>
        <details style="margin: 4px 0; text-align: left; line-height: 1.7; font-size: 15px;">
            <summary style="cursor: pointer; color: #f5c542; font-size: 16px; text-align: left;">时间墙 / 软上限</summary>
            <div style="margin: 6px 0 10px 18px; text-align: left;">
                模组层需要等满时间墙才能声望；升级与设施会缩短时间墙，原版六层没有时间墙。<br>
                每层首通后不再计时；首通前优先用跳墙券免费跳过，没有券时再花上一层 3 倍需求的资源。<br>
                跳墙券是成就奖励：每完成 5 个成就 +1 张，最多 10 张；有券时自动优先消耗，不再扣上一层资源。<br>
                跳过只满足时间墙，声望仍要求上一层资源达到需求，因此用资源跳过时实际需准备约 4 倍。<br>
                单次声望收益超过软上限后按平方根折算；本层资源、历史最高与累计总量没有存储上限。<br>
                声望会级联重置：重置高层会清空所有低层的点数、升级、设施与里程碑，挑战完成记录与首通标记永久保留。
            </div>
        </details><br>
        <details style="margin: 4px 0; text-align: left; line-height: 1.7; font-size: 15px;">
            <summary style="cursor: pointer; color: #f5c542; font-size: 16px; text-align: left;">自动化商店</summary>
            <div style="margin: 6px 0 10px 18px; text-align: left;">
                用下一层资源购买上一层的自动购买权，价格是下一层声望需求的 8 倍。<br>
                自动购买覆盖普通升级与购买项（4 座设施与主题核心），会为下一层声望保留所需资源，挑战进行中暂停。<br>
                科技层 15–17 号研究分支不会被自动购买，研究点需要手动分配；自动购买不会自动声望。
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
                <td><button class="opt" onclick="toggleOpt('hideMilestonePopups')">显示里程碑弹窗：{{ formatOption(!options.hideMilestonePopups) }}</button></td>
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

