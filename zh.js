/*
 * Ferrite Console —— 中文界面层（本地构建专用）
 *
 * 做法：只替换“显示出来的文字”，不碰任何数据、协议、存储格式。
 *   1. zh-dict.js 里是一张 英文原文 → 中文 的对照表（553 条，逐条手写）。
 *   2. 本文件在页面渲染后遍历文本节点与 placeholder/title/aria-label/alt，
 *      命中对照表就换掉；随后用 MutationObserver 跟着 Svelte 的重新渲染继续换。
 *   3. 值、频率、呼号、文件名、代码块一律不碰：只做“整串完全匹配”。
 *
 * 切换：右下角小按钮，或地址栏加 ?lang=en / ?lang=zh；选择记在 localStorage。
 * 想改词：直接编辑同目录的 zh-dict.js（一行一条），刷新即可，不需要重新编译。
 */
(() => {
  'use strict';
  const DICT = window.FERRITE_ZH || {};
  const KEY = 'ferrite.zh';
  const qs = new URLSearchParams(location.search);
  if (qs.has('lang')) {
    try { localStorage.setItem(KEY, qs.get('lang') === 'en' ? 'en' : 'zh'); } catch (e) {}
  }
  let on = true;
  try { on = localStorage.getItem(KEY) !== 'en'; } catch (e) {}

  // ---- 切换按钮 ----
  function button() {
    const b = document.createElement('button');
    b.textContent = on ? 'EN' : '中';
    b.title = on ? 'Switch to English' : '切换到中文';
    b.setAttribute('data-zh-skip', '');
    b.style.cssText = [
      'position:fixed', 'right:10px', 'bottom:10px', 'z-index:2147483000',
      'width:34px', 'height:26px', 'border-radius:6px', 'cursor:pointer',
      'border:1px solid rgba(128,160,200,.45)', 'background:rgba(20,28,38,.72)',
      'color:#cfe3ff', 'font:600 12px/1 ui-monospace,monospace', 'opacity:.65',
    ].join(';');
    b.onmouseenter = () => { b.style.opacity = '1'; };
    b.onmouseleave = () => { b.style.opacity = '.65'; };
    b.onclick = () => {
      try { localStorage.setItem(KEY, on ? 'en' : 'zh'); } catch (e) {}
      location.reload();
    };
    document.body.appendChild(b);
  }

  if (!on) {
    addEventListener('DOMContentLoaded', button);
    return;
  }

  const SKIP = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'SELECT', 'KBD', 'SVG', 'PATH']);
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];

  // 带变量的句子：整串匹配后再套模板（$1 是第一个捕获组）
  const PATTERNS = [
    [/^Theme: (.+)$/, '主题：$1'],
    [/^Download Console (.+), install it and restart$/, '下载 Console $1，安装后重启'],
    [/^Forget (.+)$/, '忘记 $1'],
    [/^Name of (.+)$/, '“$1”的名称'],
    [/^Tune (.+?) (\d[\d.]*) (.*)$/, '调整 $1 $2 $3'],
    [/^Listen health: (.+)$/, '收听状态：$1'],
    [/^(.+) reached (\d+)%$/, '$1 已完成 $2%'],
  ];

  function lookup(raw) {
    const key = raw.replace(/\s+/g, ' ').trim();
    if (!key || !/[A-Za-z]/.test(key)) return null;
    const hit = DICT[key];
    if (typeof hit === 'string') return hit;
    for (let i = 0; i < PATTERNS.length; i++) {
      const m = key.match(PATTERNS[i][0]);
      if (m) return PATTERNS[i][1].replace(/\$(\d)/g, (_, n) => m[n] || '');
    }
    return null;
  }

  function withSpace(orig, repl) {
    const a = orig.match(/^\s*/)[0];
    const b = orig.match(/\s*$/)[0];
    return a + repl + b;
  }

  function textNode(n) {
    const p = n.parentElement;
    if (!p || SKIP.has(p.tagName) || p.isContentEditable) return;
    if (p.closest('[data-zh-skip]')) return;
    const out = lookup(n.nodeValue || '');
    if (out === null) return;
    const next = withSpace(n.nodeValue, out);
    if (next !== n.nodeValue) n.nodeValue = next; // 幂等：中文不会再命中英表
  }

  function attrs(el) {
    if (SKIP.has(el.tagName) && el.tagName !== 'INPUT') return;
    if (el.isContentEditable) return;
    for (let i = 0; i < ATTRS.length; i++) {
      const v = el.getAttribute(ATTRS[i]);
      if (!v) continue;
      const out = lookup(v);
      if (out !== null && out !== v) el.setAttribute(ATTRS[i], out);
    }
  }

  function scan(root) {
    if (!root) return;
    if (root.nodeType === 3) return textNode(root);
    if (root.nodeType !== 1) return;
    attrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) textNode(n);
      else attrs(n);
    }
  }

  let pending = null;
  const mo = new MutationObserver((list) => {
    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      if (m.type === 'characterData') textNode(m.target);
      else if (m.type === 'attributes') attrs(m.target);
      else for (let j = 0; j < m.addedNodes.length; j++) scan(m.addedNodes[j]);
    }
    // 一次渲染可能分几批：下一帧再整体补一遍，避免漏掉先挂载后填字的节点
    if (pending) return;
    pending = requestAnimationFrame(() => { pending = null; scan(document.body); });
  });

  function start() {
    scan(document.body);
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    button();
    // Svelte 首次挂载与 wasm 初始化后还会有几批更新，补几次
    [120, 400, 1200, 3000].forEach((ms) => setTimeout(() => scan(document.body), ms));
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start);
  else start();
})();
