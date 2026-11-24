// Load files

var mpLoaded = 0
for (file in modInfo.modFiles) {
    let script = document.createElement("script");
    script.setAttribute("src", "js/" + modInfo.modFiles[file] + "?v=" + (VERSION.asset || VERSION.num));
    // setAttribute("async", "false") 在 HTML 里等于「异步」，写属性才是真的顺序加载；
    // 之前用字符串写法，冷缓存下层的执行顺序没了保证（硬刷新黑屏的根源之一）。
    script.async = false;
    // 全部到齐后通知 boot()：load() 必须等到这一刻再跑，否则 player / tmp 会缺层。
    script.addEventListener("load", function () {
        if (++mpLoaded < modInfo.modFiles.length) return
        window.mpAllLayersLoaded = true
        if (typeof window.mpAfterLayers === "function") window.mpAfterLayers()
    })
    document.head.insertBefore(script, document.getElementById("temp"));
}
