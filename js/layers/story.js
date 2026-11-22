/* ============================================================
剧情手记（侧边层）
纯阅读内容：每通过一层解锁一章，不参与任何数值结算。
语气走向：原版六层轻快 → 模组中段变成手记 → 深层转神话腔。
============================================================ */

const STORY_CHAPTERS = [
	{
		id: "prologue", num: "序章", title: "第一根原木", sub: "世界的开头", need: null,
		body: [
			"我醒来时，手里什么都没有。地上有一棵树，树皮粗糙得像谁在打草稿。",
			"我伸出手，它掉了一块木头下来。这大概就是这个世界全部的物理法则了：伸手，然后有东西掉下来。剩下的事，都是我自己给自己找的麻烦。",
		],
	},
	{
		id: "p", num: "01", title: "木头的味道", sub: "橡木林", need: "p",
		body: [
			"六块木板能换一张工作台，四块木板能换一根木棍。我把这句话写在石头背面，怕自己忘。",
			"黄色的树在风里晃，每晃一下，伐木场就多一块木头。我第一次觉得自己不是在砍，是在种。种的不是树，是以后。",
		],
	},
	{
		id: "s", num: "02", title: "第一块圆石", sub: "石矿洞", need: "s",
		body: [
			"洞穴比我想的深。圆石堆在脚边，冷得发白。我沿着矿道一路往下，脚步声越来越像回声。",
			"手推车来回跑，把石头运上去，把木头运下来。这是一个很小很小的循环，但它开始自己转动了，不需要我盯着。",
		],
	},
	{
		id: "i", num: "03", title: "铁的体温", sub: "铁矿脉", need: "i",
		body: [
			"铁锭从炉子里出来的时候是红的，摸上去却凉得吓人。我用它做了第一把真正意义上的工具，然后发现工具本身也能量产。",
			"机器学会了替我做机器。我站在矿洞口，第一次不确定这算不算自由。",
		],
	},
	{
		id: "d", num: "04", title: "硬度这件事", sub: "钻石层", need: "d",
		body: [
			"钻石层的水是热的，钻石是冷的。挖到深处，矿灯照见的全是自己的倒影。",
			"有人说钻石是最硬的东西，我想他们没试过一直往下挖——真正硬的不是钻石，是这一层的耐心。",
		],
	},
	{
		id: "n", num: "05", title: "门开在墙里", sub: "下界", need: "n",
		body: [
			"黑曜石框上点火，紫色的东西就不讲道理地撑开了一个洞。对面的空气有铁锈味，吊桥下全是岩浆。",
			"我穿着借来的装备走过去，脚底发烫。这里的一切都在燃烧，包括时间，包括我攒了这么久的进度。",
		],
	},
	{
		id: "e", num: "06", title: "尽头是个空岛", sub: "末地", need: "e",
		body: [
			"末地没有地平线，只有灰色的石头漂在虚无里。末影珍珠一颗颗落进背包，声音很轻。",
			"我以为走到这里就算到头了，可岛边还有更远的地方，一片一片地悬着。原来「末地」不是终点，是第一块踏脚石的名字。",
		],
	},
	{
		id: "t", num: "07", title: "黄昏契约", sub: "暮色森林", need: "t",
		body: [
			"这里的太阳不落，永远是下午四点。娜迦从树影里滑过，鳞片刮在地上，像有人在磨刀。",
			"我在石砌的小屋里点灯，灯芯里烧的是鳞片磨的粉。迷宫入口在森林中心，一层一层往下，每下一层，产量就多一点。",
		],
	},
	{
		id: "b", num: "08", title: "花圃要人照看", sub: "植物魔法", need: "b",
		body: [
			"魔力钢从花海里长出来，需要干净的水、干净的土和一点点耐心。",
			"我播下第一颗种子的时候，花圃空得能听见风。四十秒后它亮了一下——像有人在地里点起了一盏很小的灯。",
		],
	},
	{
		id: "m", num: "09", title: "电压档", sub: "工业时代", need: "m",
		body: [
			"电缆从头顶过去，整座基地在嗡嗡响。我掰了一下开关：高压，机器跑得快，线也会烧；低压，什么都不会坏，什么都不会多。",
			"电力一格格涨起来，我盯着那排数字，忽然觉得自己像个值班员。",
		],
	},
	{
		id: "th", num: "10", title: "看进虚空", sub: "神秘时代", need: "th",
		body: [
			"虚空金属是黑色的，但反光。邪术台上一圈蜡烛，我照书上说的往里看，看了很久什么也没有。",
			"刚要移开眼，它动了。我的进度条也动了，涨得比预想的快。有些便宜就是这样：先给你，再说价钱。",
		],
	},
	{
		id: "ae", num: "11", title: "优先级", sub: "应用能源", need: "ae",
		body: [
			"赛特斯石英在终端里亮成一片蓝。网络满了，东西就卡在路上。我把优先级调来调去，像在给一群不太聪明的搬运工排班。",
			"它们不说话，只是按我给的顺序走。秩序感这东西，在方块堆里居然也能上瘾。",
		],
	},
	{
		id: "dr", num: "12", title: "混沌风险", sub: "龙之研究", need: "dr",
		body: [
			"混沌碎片在容器里轻轻震。风险条一格一格往上爬，收益也跟着爬。",
			"我在心里算：再推一格，还是收手？这套系统很了解人，它知道我会想「再来一次」。我推了。命令行滚出一行字，说混沌收敛了。",
		],
	},
	{
		id: "gc", num: "13", title: "月球尘埃", sub: "星系", need: "gc",
		body: [
			"火箭升空的时候没有声音，只有屏幕上的高度在跳。月面很安静，尘埃踩下去不留脚印，因为没有风也没有水。",
			"我在环形山边插了面旗，然后开始挖。这里的东西运回去要很久，但运回来的每一样都比地面上的贵。",
		],
	},
	{
		id: "gt", num: "14", title: "等离子", sub: "格雷科技", need: "gt",
		body: [
			"格雷的机器不爱说话，只爱停机。我把管道接了一百遍，终于看到等离子顺着管壁流过去，颜色像被烧红的糖。",
			"它一分钟能做的事，够我徒手撸一整天树。效率的尽头是一种很安静的恐怖。",
		],
	},
	{
		id: "pe", num: "15", title: "一切都有价", sub: "等价交换", need: "pe",
		body: [
			"能量凝聚器把垃圾变成 EMC，再把 EMC 变成我想要的东西。我第一次觉得自己掌握了世界的汇率。",
			"可汇率是别人定的：我换得越多，越发现手里那点「等价」其实一直在贬值。",
		],
	},
	{
		id: "if", num: "16", title: "龙鳞", sub: "冰与火", need: "if",
		body: [
			"冰原上的龙比传说里小，脾气比传说里大。龙鳞落下来的时候是蓝的，捡起来会烫手。",
			"我在山洞里养了一头，喂它吃肉，看它把火喷在石壁上。驯龙这件事，本质上是用耐心换一点不讲理的产量。",
		],
	},
	{
		id: "bl", num: "17", title: "沼泽泥", sub: "虚无世界", need: "bl",
		body: [
			"沼泽的泥会动。我踩下去，脚陷到小腿，拔出来的时候带出一片气泡。",
			"这里的世界名字里带「虚无」，实际却丰饶得过分：虫子、蘑菇、会咬人的草。加起来就是一条稳定的产出线。",
		],
	},
	{
		id: "ab", num: "18", title: "深渊碎片", sub: "深渊国度", need: "ab",
		body: [
			"深渊的墙是活的，靠近会听见呼吸。碎片从裂缝里掉出来，边缘不整齐，像被谁咬过。",
			"我不敢在这里久留，每次只挖够就走。可它给的东西太好了，好到我知道自己还会回来。",
		],
	},
	{
		id: "ie", num: "19", title: "钢锭", sub: "沉浸工程", need: "ie",
		body: [
			"沉浸的线缆比谁都粗，接口比谁都讲究。钢锭一块块码进仓里，铁皮屋顶被风掀过一角，我用铆钉补上。",
			"这套工业美学很朴素：能修就修，能用就一直用。它不快，但它从不坏。",
		],
	},
	{
		id: "tc", num: "20", title: "钴锭", sub: "匠魂", need: "tc",
		body: [
			"钴蓝得发紫，熔进模具里像凝固的天空。匠魂的规矩是：工具自己会长，用得越多越强。",
			"我把镐子递进熔炉，等它添上第二层。这大概是我做过最像「养」的一件事。",
		],
	},
	{
		id: "fo", num: "21", title: "蜂王浆", sub: "林业", need: "fo",
		body: [
			"蜂箱一排排摆在林子里，蜂群进进出出，腿上带着金黄的粉。我戴上面罩打开一格，里面全是温热的蜂王浆。",
			"蜜蜂不关心我在建什么，它们只是重复同一件小事，重复到它变成一条生产线。",
		],
	},
	{
		id: "te", num: "22", title: "红石通量", sub: "热力膨胀", need: "te",
		body: [
			"红石通量在管道里跑得比什么都快，管道烫手。我把机器叠了三层，噪音大到要戴耳塞。",
			"热力膨胀的哲学很简单：同样的电，换更猛的火。我承认我喜欢这个。",
		],
	},
	{
		id: "ei", num: "23", title: "脉冲合金", sub: "末影接口", need: "ei",
		body: [
			"末影接口把一切都连起来：箱子、机器、我。脉冲合金的蓝光在暗处一闪一闪，像这座基地的神经。",
			"我坐在终端前，从上面调下面，手不用动。距离第一次变得不重要。",
		],
	},
	{
		id: "me", num: "24", title: "反物质", sub: "超能物质", need: "me",
		body: [
			"反物质不会自己出现，得先有能量，再有一点点疯。",
			"容器亮起的那一下，我知道自己在玩火，而且这火不认人。收益跳了一大截。我把手从按钮上拿开，又放回去。",
		],
	},
	{
		id: "nc", num: "25", title: "铀燃料", sub: "核科技", need: "nc",
		body: [
			"铀在罐子里是暗绿色的，看不出脾气。我按图纸搭好冷却，围了三圈，才敢启动。指针稳稳地停在绿区。",
			"核科技教我的事是：真正的强大必须配一套安全规程。",
		],
	},
	{
		id: "br", num: "26", title: "黄铀锭", sub: "反应堆", need: "br",
		body: [
			"反应堆的轰鸣是低频的，震得牙根发麻。黄铀锭堆在仓库里，像一排沉默的砖。",
			"我开始习惯用「兆瓦」而不是「块」来衡量东西。单位变了，人也会跟着变。",
		],
	},
	{
		id: "ma", num: "27", title: "精华", sub: "神秘农业", need: "ma",
		body: [
			"神秘农业把作物种成了资源。精华是紫色的小颗粒，一把一把地收进漏斗。",
			"我在地里种的不是种子，是流程：光、水、肥料、等待。它教会我，产出可以从土里长出来。",
		],
	},
	{
		id: "bm", num: "28", title: "生命源质", sub: "血魔法", need: "bm",
		body: [
			"血魔法要用血当燃料，我用的是自己的。生命源质在祭坛上泛着红光，味道像铁。",
			"这里没有免费的东西，每一滴都要从身上取。我第一次觉得这一层是诚实的，诚实得让人不舒服。",
		],
	},
	{
		id: "wi", num: "29", title: "咒术粉尘", sub: "巫术", need: "wi",
		body: [
			"巫术的树林里全是眼睛。咒术粉尘落在袖口，抹不掉。",
			"我照着图鉴做了一只草人，它替我去做那些我不想做的事。粉尘在指缝里亮了一下。我不确定它替我记住了什么。",
		],
	},
	{
		id: "an", num: "30", title: "源质", sub: "新生魔艺", need: "an",
		body: [
			"源质是液态的光，从法阵里缓缓浮起来，碰到空气就散。",
			"新生魔艺没有祭品也没有代价，只有一套非常干净的循环。我在这里待了很久，久到忘了自己是在挖资源，还是在看它发光。",
		],
	},
	{
		id: "at", num: "31", title: "神能", sub: "天境", need: "at",
		body: [
			"天境在云上。台阶一块块浮着，踩上去会往下沉一点。神能是金色的，摸起来像晒过的石头。",
			"这里的天很蓝，蓝得不像一个可以开采的地方。可它确实能开采，而且给得很多。",
		],
	},
	{
		id: "et", num: "32", title: "纳米蜂群", sub: "环境科技", need: "et",
		body: [
			"纳米蜂群看不见，只能听见，像一大群极小的蚊子在干活。",
			"环境科技把整片天空都改写成可计算的东西：温度、湿度、颗粒数。我在屏幕上把一片荒野划成绿色，然后它真的变绿了。",
		],
	},
	{
		id: "sd", num: "33", title: "存储升级", sub: "实用存储", need: "sd",
		body: [
			"仓库终于不再爆了。存储升级一块块插进去，容量往上翻，翻到我数不清位数。",
			"可我还是记得第一箱圆石的样子：木板拼的，盖子合不严。那时候我以为「够用」是个终点。",
		],
	},
	{
		id: "rc", num: "34", title: "强化铁轨", sub: "铁路", need: "rc",
		body: [
			"铁轨一路铺出去，拐弯的地方要垫一点坡度。矿车装满就跑，跑到尽头自动卸货。",
			"铁路不快，但它把远方变成了「几站地」。我站在站台上看车尾灯消失，忽然有点舍不得这一段路程。",
		],
	},
	{
		id: "ig", num: "35", title: "无尽催化剂", sub: "无尽贪婪", need: "ig",
		body: [
			"无尽贪婪的配方长得像一首诗，读到最后一行你会发现，每一行都要你先把前面九层重做一遍。",
			"无尽催化剂在合成台上安静地发亮。我知道它代表什么：不是更强，是「再也不用为材料发愁」。",
		],
	},
	{
		id: "cr", num: "36", title: "创造能量", sub: "创造模式", need: "cr",
		body: [
			"最后一层的名字叫创造。这里没有矿脉，也没有蜂箱，只有一块空地和一个念头。创造能量从念头里流出来，源源不断。",
			"我站在空地上，忽然明白这个世界从头到尾只问一件事：你还想不想再搭一块？",
		],
	},
]

const STORY_TOTAL = STORY_CHAPTERS.length

function storyChapterById(id) {
	for (let i = 0; i < STORY_CHAPTERS.length; i++)
		if (STORY_CHAPTERS[i].id === id) return STORY_CHAPTERS[i]
	return null
}

function storyIndexById(id) {
	for (let i = 0; i < STORY_CHAPTERS.length; i++)
		if (STORY_CHAPTERS[i].id === id) return i
	return -1
}

// 解锁条件：need 为空表示开局可读，否则要求该层已经首通
function storyUnlocked(ch) {
	if (!ch) return false
	if (!ch.need) return true
	const d = player[ch.need]
	return !!(d && d.prestiged)
}

function storyReadCount() {
	let n = 0
	for (let i = 0; i < STORY_CHAPTERS.length; i++)
		if (player.story && player.story.read && player.story.read[STORY_CHAPTERS[i].id]) n++
	return n
}

// 默认停靠：第一段已解锁但没读过的；全读完了就停在最后一个已解锁的
function storyDefaultChapter() {
	let last = STORY_CHAPTERS[0].id
	for (let i = 0; i < STORY_CHAPTERS.length; i++) {
		const ch = STORY_CHAPTERS[i]
		if (!storyUnlocked(ch)) continue
		last = ch.id
		if (!(player.story && player.story.read && player.story.read[ch.id])) return ch.id
	}
	return last
}

function storyOpen(id) {
	const ch = storyChapterById(id)
	if (!ch || !storyUnlocked(ch)) return
	if (!player.story) player.story = { read: {} }
	if (!player.story.read) player.story.read = {}
	player.story.at = id
	player.story.read[id] = true
	if (typeof updateTempPartial === "function") updateTempPartial(["story"])
}

function storyStep(dir) {
	const cur = storyIndexById((player.story && player.story.at) || "prologue")
	if (cur < 0) return
	let i = cur + dir
	while (i >= 0 && i < STORY_CHAPTERS.length && !storyUnlocked(STORY_CHAPTERS[i])) i += dir
	if (i < 0 || i >= STORY_CHAPTERS.length) return
	storyOpen(STORY_CHAPTERS[i].id)
}

function storyTabHTML() {
	if (!player.story) player.story = { read: {}, at: "prologue" }
	if (!player.story.read) player.story.read = {}
	let at = storyChapterById(player.story.at)
	if (!at || !storyUnlocked(at)) at = storyChapterById(storyDefaultChapter())
	if (!at) at = STORY_CHAPTERS[0]
	player.story.at = at.id
	player.story.read[at.id] = true

	const read = storyReadCount()
	const pct = Math.round(read / STORY_TOTAL * 100)

	let h = '<div class="story-wrap">'
	h += '<h1 class="story-h1">剧情手记</h1>'
	h += '<div class="story-note">每通过一层解锁一章。全书 ' + STORY_TOTAL + ' 章，纯阅读，不加属性。</div>'
	h += '<div class="story-progress"><span class="story-count">已读 ' + read + " / " + STORY_TOTAL + '</span>'
	h += '<div class="story-bar"><div class="story-fill" style="width:' + pct + '%"></div></div></div>'

	h += '<div class="story-pane">'
	h += '<div class="story-meta">' + at.num + (at.sub ? " · " + at.sub : "") + '</div>'
	h += '<div class="story-title">' + at.title + '</div>'
	h += '<div class="story-text">'
	for (let i = 0; i < at.body.length; i++) h += "<p>" + at.body[i] + "</p>"
	h += '</div>'
	h += '<div class="story-nav">'
	h += '<button class="story-btn" onclick="storyStep(-1)">上一章</button>'
	h += '<button class="story-btn" onclick="storyStep(1)">下一章</button>'
	h += '</div>'
	h += '</div>'

	h += '<div class="story-list">'
	for (let i = 0; i < STORY_CHAPTERS.length; i++) {
		const ch = STORY_CHAPTERS[i]
		const unlocked = storyUnlocked(ch)
		const done = !!player.story.read[ch.id]
		const cls = "story-chip" + (unlocked ? "" : " locked") + (done ? " done" : "") + (ch.id === at.id ? " active" : "")
		if (!unlocked) {
			h += '<span class="' + cls + '" title="尚未抵达">' + ch.num + ' ???</span>'
		} else {
			h += '<button class="' + cls + '" onclick="storyOpen(\'' + ch.id + '\')">' + ch.num + " " + ch.title + "</button>"
		}
	}
	h += '</div>'
	h += '</div>'
	return h
}

addLayer("story", {
	name: "剧情手记",
	symbol: "剧情",
	image: "img/dragon_egg.png",
	row: "side",
	position: 25,
	color: "#c9a227",

	startData() { return {
		unlocked: true,
		read: {},
		at: "prologue",
	}},

	resource: "已读章节",
	type: "none",

	tabFormat: [
		["raw-html", function() { return storyTabHTML() }],
	],

	update() {
		if (!player.story) Vue.set(player, "story", { read: {}, at: "prologue" })
		if (!player.story.read) Vue.set(player.story, "read", {})
		if (!player.story.at) Vue.set(player.story, "at", "prologue")
	},
})
