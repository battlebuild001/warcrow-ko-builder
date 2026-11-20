/* Keep the original wording in the document for assistive tech and text search. */
const diceProse = (() => {
  const colors = {
    red: ['w', '빨강', '빨간색', '빨간', '붉은색', '붉은', '적색'],
    orange: ['q', '주황', '주황색'],
    yellow: ['0', '노랑', '노란색', '노란', '황색'],
    green: ['9', '초록', '초록색', '녹색', '녹색의'],
    blue: ['8', '파랑', '파란색', '파란', '청색'],
    black: ['7', '검정', '검정색', '검은색', '검은', '흑색'],
  };
  const glyphs = Object.fromEntries(Object.entries(colors).map(([color, [glyph]]) => [color, glyph]));
  const colorByName = new Map(Object.entries(colors).flatMap(([color, [, ...ko]]) => [color, ...ko].map(name => [name, color])));
  const choice = names => `(?:${[...names].sort((a, b) => b.length - a.length).join('|')})`;
  const koColor = choice([...colorByName.keys()].filter(name => /^[가-힣]/.test(name)));
  const enColor = choice(Object.keys(colors));
  const koSeparator = String.raw`(?:[ \t]*[·ㆍ,+][ \t]*|[ \t]+(?:또는|및)[ \t]+)`;
  const enSeparator = String.raw`(?:[ \t]*[·,+/][ \t]*|[ \t]+(?:or|and)[ \t]+)`;
  const koAmount = String.raw`(?:\d+\s*개(?!의)|하나(?!하나)|두\s*개|세\s*개|네\s*개|한\s*개)`;
  const enAmount = String.raw`(?:\d+|one|two|three|four|an?)`;
  const ko = String.raw`(?<ko>(?:(?<koBefore>\d+)\s*개의\s+)?(?<koColors>${koColor}(?:${koSeparator}${koColor})*)\s*(?<koNoun>(?:(?:방어|공격|8면체)\s+)?주사위)(?:[ \t]*(?<koAfter>${koAmount}))?)`;
  const en = String.raw`(?<en>(?<![\w-])(?:(?<enBefore>${enAmount})\s+)?(?<enColors>${enColor}(?:${enSeparator}${enColor})*)(?:[ \t]+|-)(?<enNoun>die|dice)\b)`;
  const pattern = new RegExp(`${ko}|${en}`, 'gi');
  const quantities = {하나: 1, 한개: 1, 두개: 2, 세개: 3, 네개: 4, a: 1, an: 1, one: 1, two: 2, three: 3, four: 4};
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);

  function amount(value) {
    const normalized = (value || '').toLowerCase().replace(/\s/g, '');
    return quantities[normalized] ?? (normalized ? Number.parseInt(normalized, 10) : null);
  }

  function caption(text) {
    return `<span class="prose-dice-caption" data-caption="${escape(text)}"></span>`;
  }

  function die(name) {
    const color = colorByName.get(name.toLowerCase());
    return `<span class="prose-die die-${color}" data-die="${color}" data-glyph="${glyphs[color]}"></span>`;
  }

  function group(original, names, noun = '', count = null) {
    const namePattern = new RegExp(`${koColor}|${enColor}`, 'gi');
    const matches = [...names.matchAll(namePattern)];
    const oneColor = matches.length === 1;
    let art = '';
    let cursor = 0;
    for (const match of matches) {
      const joiner = names.slice(cursor, match.index).trim();
      if (joiner) art += caption(joiner);
      art += die(match[0]).repeat(oneColor && count >= 1 && count <= 3 ? count : 1);
      cursor = match.index + match[0].length;
    }
    if (count === null && noun) art += caption(noun);
    if (count !== null && (count === 0 || count > 3 || (!oneColor && count > 1))) art += caption(`×${count}`);
    return `<span class="prose-dice" title="${escape(original)}"><span class="prose-dice-original">${escape(original)}</span><span class="prose-dice-art" aria-hidden="true">${art}</span></span>`;
  }

  function inline(value, renderText = escape, renderDice = html => html) {
    const text = String(value ?? '');
    let html = '';
    let cursor = 0;
    for (const match of text.matchAll(pattern)) {
      const parts = match.groups;
      const names = parts.koColors || parts.enColors;
      const noun = parts.koNoun || parts.enNoun;
      const count = amount(parts.koBefore || parts.koAfter || parts.enBefore);
      const end = match.index + match[0].length;
      const after = text.slice(end);
      // Preserve the full glossary link for phrases such as 검은색 주사위 강화.
      const alteration = /^\s*(?:강화|변형|alterations?\b)/i.exec(after)?.[0] || '';
      const original = match[0];
      html += renderText(text.slice(cursor, match.index));
      html += renderDice(group(original, names, noun, count) + escape(alteration), original + alteration, !!alteration);
      cursor = end + alteration.length;
    }
    return html + renderText(text.slice(cursor));
  }

  function parameter(names) {
    const list = String(names).split(/\s*·\s*/);
    return list.every(name => colorByName.has(name.toLowerCase())) ? group(names, names) : escape(names);
  }

  function enhance(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const replacements = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement?.closest('.prose-dice, pre, code, script, style, textarea, select')) continue;
      if (!pattern.test(node.data)) continue;
      pattern.lastIndex = 0;
      const template = document.createElement('template');
      template.innerHTML = inline(node.data);
      replacements.push([node, template.content]);
    }
    for (const [node, content] of replacements) node.replaceWith(content);
  }

  return {glyphs, inline, parameter, enhance};
})();

// The tutorial and quick sheet also contain statically authored instructions.
diceProse.enhance(document.querySelector('.guide-content'));
