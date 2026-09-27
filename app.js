const main = document.querySelector("main");
const header = document.querySelector("#site-header");
const footer = document.querySelector("#site-footer");
const edgeIndex = document.querySelector("#edge-index");

const zhInitials = {
  "dynamic-zero":"D", "spatiotemporal-contact":"S", "static-management":"J", "three-zones":"S", "closed-loop":"B", "fangcang":"F", "nucleic-acid":"H", "travel-card":"X", "venue-code":"C", "health-code":"J", "covid":"X", "antigen":"K", "asymptomatic":"W", "close-contact":"M", "aerosol":"Q", "long-covid":"C", "vaccination":"Y", "chosen-worker":"T", "malicious-return":"E", "runology":"R", "cement-nose":"S", "lie-flat":"T", "phantom-positive":"H", "yellow-code-hospital":"H", "fight-epidemic":"Z", "retrograde":"N", "big-white":"D", "nonessential":"F", "zero-circuit":"R", "positive-sheep":"Y", "yang-heroes":"Y"
};

const editorialMarks = {
  "nucleic-acid": { zh:"词条编号 017　校订于 2022.11", en:"Entry 017 · revised 2022.11" },
  "spatiotemporal-contact": { zh:"初稿　释义暂定", en:"First draft · provisional sense" },
  "malicious-return": { zh:"文学释义　致敬欧·亨利《二十年后》", en:"" },
  "fangcang": { zh:"文学释义　使用说明书", en:"Literary entry · user manual" },
  "static-management": { zh:"旧义已停用", en:"This sense later fell out of use" },
  "positive-sheep": { zh:"增补　网络语料", en:"Supplement · network usage" },
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function getRecord(id) { return entryRecords.find((entry) => entry.id === id); }
function getLocale(record, language) { return record?.[language] || null; }
function storedLanguage() { return localStorage.getItem("epidemic-dictionary-language") || "zh"; }
function localRecords(language) { return entryRecords.filter((record) => Boolean(getLocale(record, language))); }

function routeState() {
  const raw = location.hash.slice(1).split("?")[0] || "";
  const parts = raw.split("/").filter(Boolean);
  if (parts[0] === "entry") return { language: storedLanguage(), page: "entry", id: parts[1] || null, legacy: true };
  if (parts[0] === "dictionary") return { language: storedLanguage(), page: "index", id: null, legacy: true };
  if (parts[0] === "articles") return { language: storedLanguage(), page: "entry", id: "nucleic-acid", legacy: true };
  if (!['zh', 'en'].includes(parts[0])) return { language: storedLanguage(), page: "home", id: null, legacy: raw };
  return { language: parts[0], page: parts[1] || "home", id: parts[2] || null, legacy: null };
}

function href(language, page = "home", id = "") {
  return `#/${language}${page === "home" ? "" : `/${page}`}${id ? `/${id}` : ""}`;
}

function switchLanguage(language) {
  const state = routeState();
  location.hash = href(language, state.legacy ? "home" : state.page, state.legacy ? "" : state.id || "");
}

function matchRecord(record, language, query) {
  const locale = getLocale(record, language);
  const needle = query.trim().toLowerCase();
  return !needle || [locale.title, ...(locale.aliases || []), ...record.keywords, ...(locale.definitions || [])].join(" ").toLowerCase().includes(needle);
}

function initialFor(record, language) {
  const locale = getLocale(record, language);
  return language === "zh" ? (zhInitials[record.id] || locale.title[0]) : locale.title.charAt(0).toUpperCase();
}

function termLink(record, language, className = "term-link") {
  const locale = getLocale(record, language);
  return `<a class="${className}" href="${href(language, "entry", record.id)}">${escapeHtml(locale.title)}</a>`;
}

function entryRange(record, language) {
  const ordered = localRecords(language).slice().sort((a, b) => getLocale(a, language).title.localeCompare(getLocale(b, language).title, language === "zh" ? "zh" : "en"));
  const position = ordered.findIndex((item) => item.id === record.id);
  const following = ordered[Math.min(position + 1, ordered.length - 1)];
  return `${getLocale(record, language).title} — ${getLocale(following, language).title}`;
}

function renderEdgeIndex(language) {
  const groups = localRecords(language).reduce((result, record) => {
    const initial = initialFor(record, language);
    (result[initial] ||= []).push(record);
    return result;
  }, {});
  const initials = Object.keys(groups).sort((a, b) => a.localeCompare(b));
  edgeIndex.setAttribute("aria-label", language === "zh" ? "词典边缘索引" : "Dictionary edge index");
  edgeIndex.innerHTML = `<button class="edge-trigger" type="button" aria-expanded="false">${language === "zh" ? "索引" : "Index"}</button><div class="edge-letters">${initials.map((initial) => `<button class="edge-letter" type="button" data-initial="${escapeHtml(initial)}" aria-expanded="false">${escapeHtml(initial)}</button>`).join("")}</div><section class="edge-popover" hidden aria-live="polite"></section>`;
  const trigger = edgeIndex.querySelector(".edge-trigger");
  const popover = edgeIndex.querySelector(".edge-popover");
  const buttons = [...edgeIndex.querySelectorAll(".edge-letter")];
  let openInitial = null;

  const closePopover = () => {
    openInitial = null;
    popover.hidden = true;
    popover.innerHTML = "";
    buttons.forEach((button) => button.setAttribute("aria-expanded", "false"));
  };

  const positionPopover = (button) => {
    if (matchMedia("(max-width: 760px)").matches) return;
    const indexBox = edgeIndex.getBoundingClientRect();
    const buttonBox = button.getBoundingClientRect();
    const preferredTop = buttonBox.top - indexBox.top - 4;
    const maximumTop = Math.max(0, window.innerHeight - indexBox.top - popover.offsetHeight - 12);
    popover.style.top = `${Math.min(Math.max(0, preferredTop), maximumTop)}px`;
  };

  buttons.forEach((button) => button.addEventListener("click", () => {
    const initial = button.dataset.initial;
    if (openInitial === initial) {
      closePopover();
      return;
    }
    openInitial = initial;
    buttons.forEach((item) => item.setAttribute("aria-expanded", String(item === button)));
    const words = groups[initial]
      .sort((a, b) => getLocale(a, language).title.localeCompare(getLocale(b, language).title))
      .map((record) => termLink(record, language, "edge-word-link"))
      .join("");
    popover.innerHTML = `<header><span>${escapeHtml(initial)}</span><button type="button" data-close-index aria-label="${language === "zh" ? "关闭索引" : "Close index"}">×</button></header><div class="edge-words">${words}</div>`;
    popover.hidden = false;
    requestAnimationFrame(() => positionPopover(button));
  }));

  popover.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-index]")) closePopover();
  });

  trigger.addEventListener("click", () => {
    const isOpen = edgeIndex.classList.toggle("index-open");
    trigger.setAttribute("aria-expanded", String(isOpen));
    if (!isOpen) closePopover();
  });
}

function renderChrome(language) {
  const copy = ui[language];
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  document.title = `${copy.projectTitle}｜${copy.titleSuffix}`;
  header.innerHTML = `<div class="masthead"><a class="brand" href="${href(language)}"><span>${escapeHtml(copy.projectTitle)}</span></a><span class="edition-mark">${language === "zh" ? "试行本" : "working edition"}</span></div><nav aria-label="${language === "zh" ? "词典导航" : "Dictionary navigation"}"><a href="${href(language, "index")}">${language === "zh" ? "词条索引" : "Index"}</a><a href="${href(language, "about")}">${copy.about}</a></nav><div class="language-switch" aria-label="${language === "zh" ? "语言切换" : "Language switch"}"><button class="${language === "zh" ? "active" : ""}" type="button" data-language="zh">中文</button><span>/</span><button class="${language === "en" ? "active" : ""}" type="button" data-language="en">EN</button></div>`;
  header.querySelectorAll("[data-language]").forEach((button) => button.addEventListener("click", () => switchLanguage(button.dataset.language)));
  footer.innerHTML = `<p>${escapeHtml(copy.projectTitle)}　${copy.archiveLine}</p><p>${language === "zh" ? "文本仍在校订。" : "Texts remain under editorial revision."}</p>`;
  renderEdgeIndex(language);
}

function searchRow(record, language) {
  const locale = getLocale(record, language);
  const definition = locale.definitions?.[0] || "";
  return `<a class="dictionary-row" href="${href(language, "entry", record.id)}"><span class="row-headword">${escapeHtml(locale.title)}</span><span class="row-meta">${escapeHtml(locale.pinyin || locale.partOfSpeech || "")}</span><span class="row-definition">① ${escapeHtml(definition)}</span></a>`;
}

function renderHome(language) {
  const copy = ui[language];
  const essays = localRecords(language).filter((record) => getLocale(record, language).essay);
  main.innerHTML = `<section class="page home-page"><p class="front-matter">${copy.archiveLine}　／　${language === "zh" ? "未竟词典" : "an unfinished dictionary"}</p><h1>${escapeHtml(copy.projectTitle)}</h1><p class="home-subtitle">${escapeHtml(copy.titleSuffix)}</p><div class="home-search"><label for="home-search">${language === "zh" ? "请输入词语" : "Look up a word"}</label><input id="home-search" type="search" autocomplete="off" placeholder="${escapeHtml(copy.searchHint)}" /><div id="instant-results" class="instant-results" aria-live="polite"></div></div><section class="available-entries"><p class="editorial-label">${language === "zh" ? "已收入长释义" : "Long definitions on file"}</p>${essays.length ? `<ol>${essays.map((record, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span>${termLink(record, language, "essay-index-link")}</li>`).join("")}</ol>` : `<p class="quiet-note">${copy.missingLanguage}</p>`}</section></section>`;
  const input = document.querySelector("#home-search");
  const results = document.querySelector("#instant-results");
  input.addEventListener("input", () => {
    const value = input.value.trim();
    if (!value) { results.innerHTML = ""; results.classList.remove("open"); return; }
    const found = localRecords(language).filter((record) => matchRecord(record, language, value)).slice(0, 5);
    results.innerHTML = found.length ? found.map((record) => searchRow(record, language)).join("") : `<p>${copy.noResults}</p>`;
    results.classList.add("open");
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") location.hash = `${href(language, "index")}?q=${encodeURIComponent(input.value)}`;
    if (event.key === "Escape") results.classList.remove("open");
  });
}

function renderIndex(language) {
  const copy = ui[language];
  const initialQuery = new URLSearchParams(location.hash.split("?")[1] || "").get("q") || "";
  main.innerHTML = `<section class="page index-page"><div class="running-header"><span>${escapeHtml(copy.projectTitle)}</span><span>${language === "zh" ? "词条索引" : "ENTRY INDEX"}</span></div><h1>${language === "zh" ? "检字表" : "Index of headwords"}</h1><div class="index-search"><label for="index-search">${language === "zh" ? "查找" : "Search"}</label><input id="index-search" type="search" value="${escapeHtml(initialQuery)}" placeholder="${escapeHtml(copy.searchHint)}" /></div><p id="result-count" class="quiet-note"></p><div id="entry-list" class="entry-list"></div></section>`;
  const input = document.querySelector("#index-search");
  const list = document.querySelector("#entry-list");
  const count = document.querySelector("#result-count");
  const update = () => {
    const found = localRecords(language).filter((record) => matchRecord(record, language, input.value));
    count.textContent = language === "zh" ? `共 ${found.length} 条` : `${found.length} entries`;
    list.innerHTML = found.length ? found.map((record) => searchRow(record, language)).join("") : `<p class="quiet-note">${copy.noResults}</p>`;
  };
  input.addEventListener("input", update); update();
}

function referenceMarkup(word, record, language) {
  const locale = getLocale(record, language);
  if (!locale) return escapeHtml(word);
  const shortDefinition = (locale.definitions?.[0] || "").slice(0, language === "zh" ? 38 : 64);
  return `<a class="cross-reference" href="${href(language, "entry", record.id)}"><span>${escapeHtml(word)}</span><span class="cross-note"><b>${escapeHtml(locale.title)}</b><i>${escapeHtml(locale.pinyin || locale.partOfSpeech || "")}</i><em>${escapeHtml(shortDefinition)}${shortDefinition.length < (locale.definitions?.[0] || "").length ? "…" : ""}</em><small>${language === "zh" ? "参见词条 →" : "See entry →"}</small></span></a>`;
}

function linkedEssayParagraph(text, language, currentId) {
  const candidates = language === "zh"
    ? [["时空伴随者", "spatiotemporal-contact"], ["健康码", "health-code"], ["行程码", "travel-card"], ["场所码", "venue-code"], ["核酸亭", "nucleic-acid"], ["气溶胶", "aerosol"], ["核酸", "nucleic-acid"], ["转运", "spatiotemporal-contact"], ["隔离", "close-contact"], ["白色它们", "big-white"], ["白蘑菇", "nucleic-acid"], ["大白", "big-white"]]
    : [["spatiotemporal companion", "spatiotemporal-contact"], ["Nucleic Acid", "nucleic-acid"], ["nucleic acid", "nucleic-acid"]];
  const sorted = candidates.slice().sort((a, b) => b[0].length - a[0].length);
  const pattern = new RegExp(sorted.map(([word]) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), language === "zh" ? "g" : "gi");
  let used = new Set();
  return escapeHtml(text).replace(pattern, (word) => {
    const matched = sorted.find(([candidate]) => candidate.toLowerCase() === word.toLowerCase());
    if (!matched || matched[1] === currentId || used.has(matched[0])) return word;
    used.add(matched[0]);
    return referenceMarkup(word, getRecord(matched[1]), language);
  });
}

function essayParagraphMarkup(paragraph, language, currentId) {
  const content = linkedEssayParagraph(paragraph, language, currentId);
  return /^(?:\d+\.\s|\d+(?:\.\d+)+\s)/.test(paragraph)
    ? `<h3 class="essay-section">${content}</h3>`
    : `<p>${content}</p>`;
}

function renderEntry(language, id) {
  const copy = ui[language];
  const record = getRecord(id);
  const locale = getLocale(record, language);
  if (!record) { renderNotFound(language); return; }
  if (!locale) { main.innerHTML = `<section class="page unavailable-page"><p class="running-header"><span>${copy.projectTitle}</span><span>${copy.missingLanguage}</span></p><h1>${copy.unavailableTitle}</h1><p class="reading-lede">${copy.unavailableBody}</p></section>`; return; }
  const related = record.relatedEntries.map(getRecord).filter((item) => getLocale(item, language));
  const mark = editorialMarks[record.id]?.[language];
  const essay = locale.essay;
  main.innerHTML = `<section class="page entry-page"><div class="running-header"><span>${escapeHtml(copy.projectTitle)}</span><span>${escapeHtml(entryRange(record, language))}</span></div><article class="entry-sheet"><header class="entry-head"><p class="entry-number">${mark ? escapeHtml(mark) : language === "zh" ? "词条校订中" : "entry under revision"}</p><h1>${escapeHtml(locale.title)}</h1><p class="lexical-line">${locale.pinyin ? `<i>${escapeHtml(locale.pinyin)}</i>` : ""}<span>${escapeHtml(locale.partOfSpeech || "")}</span></p></header><section class="definition-flow"><div class="dictionary-sense"><p class="sense"><sup>①</sup>${escapeHtml(locale.definitions?.[0] || "")}</p>${locale.background ? `<p class="editorial-gloss">${escapeHtml(locale.background)}</p>` : ""}</div>${essay ? `<div class="essay-divider" aria-hidden="true"><span>${language === "zh" ? "长释义" : "Extended reading"}</span></div><div class="essay-body">${essay.title ? `<h2 class="essay-title">${escapeHtml(essay.title)}</h2>` : ""}${essay.paragraphs.map((paragraph) => essayParagraphMarkup(paragraph, language, record.id)).join("")}</div>${essay.translationNote ? `<p class="translation-note">${escapeHtml(essay.translationNote)}</p>` : ""}` : `<p class="editorial-gloss">${copy.unavailableBody}</p>`}</section>${related.length ? `<footer class="related"><span>${copy.seeAlso}</span>${related.map((item) => termLink(item, language)).join("<b>／</b>")}</footer>` : ""}</article></section>`;
}

function renderAbout(language) {
  const copy = ui[language];
  main.innerHTML = `<section class="page about-page"><div class="running-header"><span>${escapeHtml(copy.projectTitle)}</span><span>${copy.about}</span></div><h1>${copy.aboutTitle}</h1><p class="reading-lede">${copy.aboutBody}</p><p class="editorial-gloss">${language === "zh" ? "文本以作者提供的中文与英文版本为准；缺失译文不会被自动补写。" : "Chinese and English literary texts appear only when supplied by the author; missing translations are never generated automatically."}</p></section>`;
}

function renderNotFound(language) {
  main.innerHTML = `<section class="page unavailable-page"><h1>${ui[language].noResults}</h1><a class="term-link" href="${href(language)}">${ui[language].home}</a></section>`;
}

function router() {
  const state = routeState();
  if (state.legacy) { location.hash = href(state.language, state.page, state.id || ""); return; }
  localStorage.setItem("epidemic-dictionary-language", state.language);
  document.body.classList.toggle("is-entry", state.page === "entry");
  renderChrome(state.language);
  if (state.page === "home") renderHome(state.language);
  else if (state.page === "index") renderIndex(state.language);
  else if (state.page === "entry") renderEntry(state.language, state.id);
  else if (state.page === "about") renderAbout(state.language);
  else renderNotFound(state.language);
  main.focus({ preventScroll: true });
}

window.addEventListener("hashchange", router);
router();
