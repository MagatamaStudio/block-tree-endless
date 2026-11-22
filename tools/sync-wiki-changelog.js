// 从 js/mod.js 的 changelog 生成 GitHub Wiki 的「更新日志」页并推送。
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

function buildMarkdown() {
	const src = fs.readFileSync(path.join(ROOT, "js/mod.js"), "utf8");
	const match = src.match(/let changelog = `([\s\S]*?)`\n/);
	if (!match) throw new Error("在 js/mod.js 中找不到 changelog");

	const body = match[1].replace(/^<h1>更新日志<\/h1><br>\s*/, "");
	const noteMatch = body.match(/<p[^>]*>([\s\S]*?)<\/p>/);
	const parts = body.split(/<h3>(.*?)<\/h3>/).slice(1);
	const out = [
		"# 更新日志",
		"",
		"本文与游戏内「更新日志」同步，按版本倒序。v4.0 是「无尽模组海」的起点，更早的版本记录也一并保留。",
		"",
	];
	if (noteMatch) out.push("> " + noteMatch[1].trim(), "");
	for (let i = 0; i < parts.length; i += 2) {
		const title = parts[i].trim();
		const items = [...parts[i + 1].matchAll(/<li([^>]*)>([\s\S]*?)<\/li>/g)];
		out.push("## " + title, "");
		for (const item of items) {
			const text = item[2].trim();
			// 分组标题（无项目符号）输出为加粗行，其余保持列表
			if (/list-style\s*:\s*none/.test(item[1])) {
				if (out[out.length - 1] !== "") out.push("");
				out.push("**" + text.replace(/<[^>]+>/g, "") + "**", "");
			}
			else out.push("- " + text);
		}
		out.push("");
	}
	return out.join("\n");
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
