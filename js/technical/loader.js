// Load files

var mpLoaded = 0
for (file in modInfo.modFiles) {
    let script = document.createElement("script");
    script.setAttribute("src", "js/" + modInfo.modFiles[file] + "?v=" + (VERSION.asset || VERSION.num));
    // setAttribute("async", "false") 在 HTML 里等于「异步」，写属性才是真的顺序加载；
    // 之前用字符串写法，冷缓存下层的执行顺序没了保证（硬刷新黑屏的根源之一）。
    script.async = false;
    // 全部层脚本到齐后重建一次 tmp，把 setupTemp 之后的缺口补齐再刷一帧画面；
    // player 还没初始化（load() 尚未跑）时什么都不做，交给 load() 自己建。
    script.addEventListener("load", function () {
        if (++mpLoaded < modInfo.modFiles.length) return
        try {
            if (typeof player === "undefined" || !player || typeof setupTemp !== "function") return
            setupTemp(); updateTemp()
            if (window.app) window.app.$forceUpdate()
            if (typeof resizeCanvas === "function") resizeCanvas()
        } catch (e) { if (window.console) console.warn("层脚本到齐后重建失败:", e.message) }
    })
    document.head.insertBefore(script, document.getElementById("temp"));
}
