// 把 wiki/更新日志.md 推到 GitHub Wiki 的「更新日志」页。
// 用法：node tools/sync-wiki-changelog.js
// CI 中设置 WIKI_TOKEN（带 repo 权限的 PAT）即可推送；本地运行使用现有 git 凭据。
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const REPO = process.env.GITHUB_REPOSITORY || "MagatamaStudio/block-tree-endless";
const TOKEN = process.env.WIKI_TOKEN;
const REMOTE = TOKEN
	? `https://x-access-token:${TOKEN}@github.com/${REPO}.wiki.git`
	: `https://github.com/${REPO}.wiki.git`;
const PAGE = "更新日志.md";

// 游戏内「更新日志」每版只留一句话，完整记录放在本仓库的 wiki/更新日志.md，
// 这里不再从 js/mod.js 反推全文，直接把这篇文章推上去。
function buildMarkdown() {
	const file = path.join(ROOT, "wiki", "更新日志.md");
	const text = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
	if (!/^# 更新日志/m.test(text)) throw new Error("wiki/更新日志.md 缺少标题");
	return text;
}
function git(cwd, args, options = {}) {
	return execFileSync("git", args, { cwd, stdio: "pipe", encoding: "utf8", ...options });
}

module.exports = { buildMarkdown };

function main() {
	const markdown = buildMarkdown();
	const workdir = fs.mkdtempSync(path.join(os.tmpdir(), "bt-wiki-"));

try {
	git(null, ["clone", "--depth", "1", REMOTE, workdir], { stdio: "ignore" });
	fs.writeFileSync(path.join(workdir, PAGE), markdown, "utf8");
	git(workdir, ["add", PAGE]);

	let changed = true;
	try {
		git(workdir, ["diff", "--cached", "--quiet"]);
		changed = false;
	} catch (err) {
		if (err.status !== 1) throw err;
	}

	if (!changed) {
		console.log("wiki 更新日志已是最新");
	} else {
		let name = "github-actions[bot]";
		let email = "41898282+github-actions[bot]@users.noreply.github.com";
		try {
			name = git(null, ["config", "user.name"]).trim() || name;
			email = git(null, ["config", "user.email"]).trim() || email;
		} catch (err) {}

		git(workdir, [
			"-c", `user.name=${name}`,
			"-c", `user.email=${email}`,
			"commit", "-m", "同步更新日志",
		], { stdio: "inherit" });
		git(workdir, ["push", "origin", "HEAD:master"], { stdio: "inherit" });
		console.log("wiki 更新日志已推送");
	}
} finally {
	fs.rmSync(workdir, { recursive: true, force: true });
	}
}

if (require.main === module) main();
