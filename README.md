# 疫情词典 / Glossario de pandemia

这是一个零依赖的双语、阅读优先词典原型。`sources/` 保持只读；站点数据被整理在 `data.js`，页面与交互位于 `index.html`、`styles.css`、`app.js`。

## 添加一篇新的中英文文章

在 `article-texts.js` 的作者文本载荷中，以同一个词条 ID 放入 `zh` 与 `en` 的对应文本；`data.js` 的 `authorTexts` 将它们连接到词条。文学正文只放在 `paragraphs` 数组中，每个数组项对应原文的一段；请不要把正文内容放进自动翻译或格式化流程。

```js
"new-entry": {
  zh: { title: "文章标题", subtitle: "可选副标题", paragraphs: ["第一段原文", "第二段原文"] },
  en: { title: "English essay title", subtitle: "Optional subtitle", paragraphs: ["First supplied paragraph", "Second supplied paragraph"] }
}
```

新词条仍需先在 `entries` 中补上基本词典信息；`entryRecords` 会为它生成双语阅读外壳。随后在 `authorTexts` 以同一 ID 放入作者提供的中文、英文正文。若 `en` 或 `zh` 为空，站点会停留在相应语言的对应词条路由并显示“文本尚未提供”，不会显示另一种语言的文学正文或自动生成译文。

`enhancement` 是日后为单一词条接入特殊交互的预留字段；当前不启用任何特殊交互。

可直接用浏览器打开 `index.html`，或从此目录启动任意静态文件服务进行预览。

# 自动发布到 Netlify

本目录是纯静态网站。将它推送到 GitHub 后，可在 Netlify 的 **Add new site → Import an existing project** 中选择该仓库；发布目录设为 `.`，无需构建命令。之后，每次推送到 `main` 分支，Netlify 会自动重新发布网站。
