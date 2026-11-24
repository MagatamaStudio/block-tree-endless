var canvas;
var ctx;

window.addEventListener("resize", (_=>resizeCanvas()));

function retrieveCanvasData() {
	let treeCanv = document.getElementById("treeCanvas")
	let treeTab = document.getElementById("treeTab")
	if (treeCanv===undefined||treeCanv===null) return false;
	canvas = treeCanv;
	ctx = canvas.getContext("2d");
	return true;
}

function resizeCanvas() {
	if (!retrieveCanvasData()) return
	if (document.hidden) return
	// 尺寸没变时不要重设 width/height，否则每次都会重建整块画布缓冲
	if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
		canvas.width  = window.innerWidth;
		canvas.height = window.innerHeight;
	}
	// 分层脚本是异步加载的：冷缓存下加载窗口很宽，途中一次 resize 就会让 drawTree
	// 撞上还没进 tmp 的层，抛错直接打断 boot（硬刷新黑屏就是这么来的）。
	// 连线只是装饰，出错吞掉，别拖死启动。
	try { drawTree() } catch (e) { if (window.console) console.warn("drawTree 跳过:", e.message) }
}


var colors_theme

function drawTree() {
	if (!retrieveCanvasData()) return;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (layer in layers){
		if (!tmp[layer]) continue
		if (tmp[layer].layerShown == true && tmp[layer].branches){
			for (branch in tmp[layer].branches)
				{
					drawTreeBranch(layer, tmp[layer].branches[branch])
				}
		}
		drawComponentBranches(layer, tmp[layer].upgrades, "upgrade-")
		drawComponentBranches(layer, tmp[layer].buyables, "buyable-")
		drawComponentBranches(layer, tmp[layer].clickables, "clickable-")

	}
}

function drawComponentBranches(layer, data, prefix) {
	for(id in data) {
		if (data[id].branches) {
			for (branch in data[id].branches)
			{
				drawTreeBranch(id, data[id].branches[branch], prefix + layer + "-")
			}

		}
	}

}

function drawTreeBranch(num1, data, prefix) { // taken from Antimatter Dimensions & adjusted slightly
	let num2 = data
	let color_id = 1
	let width = 15
	let elbow = false
	if (Array.isArray(data)){
		num2 = data[0]
		color_id = data[1]
		width = data[2] || width
		elbow = data[3] === "elbow"
	}

	if(typeof(color_id) == "number")
		color_id = colors_theme[color_id]
	if (prefix) {
		num1 = prefix + num1
		num2 = prefix + num2
	}
	if (document.getElementById(num1) == null || document.getElementById(num2) == null)
		return

	let start = document.getElementById(num1).getBoundingClientRect();
    let end = document.getElementById(num2).getBoundingClientRect();
    let x1 = start.left + (start.width / 2) + document.body.scrollLeft;
    let y1 = start.top + (start.height / 2) + document.body.scrollTop;
    let x2 = end.left + (end.width / 2) + document.body.scrollLeft;
    let y2 = end.top + (end.height / 2) + document.body.scrollTop;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.strokeStyle = color_id
    ctx.moveTo(x1, y1);
    if (elbow && Math.abs(y2 - y1) > 4) {
        let midY = (y1 + y2) / 2
        ctx.lineTo(x1, midY)
        ctx.lineTo(x2, midY)
    }
    ctx.lineTo(x2, y2);
    ctx.stroke();
}
