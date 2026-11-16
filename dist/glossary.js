/* Official rules are data-backed; inline terms and native stats share one reader. */
let ruleData={entries:[]},ruleById=new Map(),ruleByAlias=new Map(),rulePattern=null;
let currentRuleId='',ruleHistory=[],ruleContextUnit=null,ruleContextEnhanced=false,ruleContextProfile=null;
const ruleStatIds={MOV:'movement',W:'wounds',WP:'wp',MOR:'mor',AVB:'availability',COM:'command-token',PT:'points'};
function configureRules(data){
  ruleData=data;ruleById=new Map(data.entries.map(e=>[e.id,e]));ruleByAlias=new Map();
  for(const e of data.entries)for(const alias of [...e.aliases,e.label,e.english])if(alias)ruleByAlias.set(alias.toLocaleLowerCase(),e.id);
  for(const alias of ['지휘 능력','지휘능력'])ruleByAlias.set(alias,'skills');
  const aliases=[...ruleByAlias.keys()].sort((a,b)=>b.length-a.length).map(a=>{
    const escaped=a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    return /^[A-Za-z]/.test(a)?`(?<![A-Za-z])${escaped}(?![A-Za-z])`:escaped;
  });
  rulePattern=new RegExp(`(?:피해\\s*\\d+\\s*(?:을|를)?\\s*회복|병력\\s*\\d+\\s*(?:명|개)?\\s*(?:을|를)?\\s*회복|${aliases.join('|')})`,'gi');
}
function ruleTerm(id,text){
  return `<button type="button" class="rule-term" data-rule="${escapeHtml(id)}" aria-haspopup="dialog" aria-label="${escapeHtml(text)} 규칙 설명">${escapeHtml(text)}</button>`;
}
function ruleText(value,excludeId=''){
  const raw=String(value??'');if(!rulePattern)return escapeHtml(raw);
  rulePattern.lastIndex=0;let cursor=0,result='',match;
  while((match=rulePattern.exec(raw))){
    const word=match[0],offset=match.index;let id=ruleByAlias.get(word.toLocaleLowerCase());
    if(/^피해\s*\d+.*회복$/.test(word))id='heal';
    if(/^병력\s*\d+.*회복$/.test(word))id='recover';
    if(word==='배치'&&/^\s*\(/.test(raw.slice(offset+word.length)))id='place';
    result+=escapeHtml(raw.slice(cursor,offset));result+=id&&id!==excludeId?ruleTerm(id,word):escapeHtml(word);cursor=offset+word.length;
  }
  return result+escapeHtml(raw.slice(cursor));
}
function ruleKeyword(raw){
  const label=traitName(raw),id=ruleByAlias.get(String(raw).toLocaleLowerCase());
  return id?ruleTerm(id,label):ruleText(label);
}
function cardRulesTools(){return `<div class="card-rules-tools"><span>${ui('스탯·밑줄 용어를 누르면 규칙 설명','Tap stats or underlined terms for rules')}</span><button type="button" data-open-rules>${ui('규칙 사전','Rules')} ↗</button></div>`}
function inferRuleUnit(target){
  const id=target?.closest('[data-rule-unit]')?.dataset.ruleUnit;
  if($('#cardDialog').open&&openCardUnit&&(!id||openCardUnit.id===id))return openCardUnit;
  if(screen==='game'){
    const game=activeGame(),unit=id?game?.units.find(u=>u.id===id):game?.units[game?.cardIndex||0];
    if(unit)return unit;
  }
  return id?currentUnits().find(u=>u.id===id)||data.units.find(u=>u.id===id)||null:null;
}

function openRule(id,options={}){
  const dialog=$('#ruleDialog');
  if(!dialog.open||options.resetContext){ruleHistory=[];ruleContextUnit=options.unit||null;ruleContextEnhanced=options.enhanced||false;ruleContextProfile=options.profile||null;currentRuleId=''}
  if(!options.raw&&id==='tinge'&&ruleContextUnit?.faction==='scions-of-yaldabaoth')id='tinge-scions';
  if(!ruleById.has(id))return openRuleBrowser(options.unit);
  if(dialog.open&&currentRuleId&&currentRuleId!==id&&!options.back)ruleHistory.push({id:currentRuleId,scroll:dialog.scrollTop});
  currentRuleId=id;$('#ruleSearch').value='';$('#ruleSearchResults').hidden=true;$('#ruleDetail').hidden=false;renderRuleDetail();
  if(!dialog.open)dialog.showModal();dialog.scrollTop=options.scroll||0;
  $('#ruleDetailTitle').focus({preventScroll:true});
}
function openRuleBrowser(unit=null){
  const dialog=$('#ruleDialog');if(!dialog.open){ruleContextUnit=unit;ruleContextEnhanced=false;ruleContextProfile=null;ruleHistory=[];currentRuleId=''}
  $('#ruleSearch').value='';$('#ruleDetail').hidden=true;$('#ruleSearchResults').hidden=false;
  $('#ruleBack').hidden=true;renderRuleSearch('');if(!dialog.open)dialog.showModal();dialog.scrollTop=0;$('#ruleSearch').focus();
}
function currentRuleStat(entry){
  const unit=ruleContextUnit;if(!unit||ruleContextEnhanced)return null;
  const p=ruleContextProfile||cardProfiles[unit.cardKey]||{},colors={red:'빨강',orange:'주황',yellow:'노랑',green:'초록',blue:'파랑',black:'검정'};
  const dice=Object.entries((p.wpDice||[]).reduce((a,c)=>(a[c]=(a[c]||0)+1,a),{})).map(([c,n])=>`${colors[c]||c} 주사위 ${n}개`).join(' · ');
  const stats={movement:['MOV',p.mov],wounds:['W',p.w],wp:['WP',dice],mor:['MOR',p.mor],availability:['AVB',unit.availability],points:['PT',unit.pointsCost],'command-token':['COM',unit.command]};
  const stat=stats[entry.id];return stat&&stat[1]!==undefined&&stat[1]!==null&&stat[1]!==''?{label:stat[0],value:String(stat[1]),movement:entry.id==='movement'?String(p.mov).match(/(\d+)\s*[-–]\s*(\d+)\s*\[\s*(\d+)\s*\]/):null}:null;
}
function renderRuleDetail(){
  const entry=ruleById.get(currentRuleId);if(!entry)return;
  $('#ruleBack').hidden=!ruleHistory.length;
  const table=(value,heading='')=>`${heading?`<h3>${escapeHtml(heading)}</h3>`:''}<div class="rule-table-wrap"><table><thead><tr>${value.headers.map(h=>`<th scope="col">${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${value.rows.map(row=>`<tr>${row.map((cell,i)=>i===0?`<th scope="row">${ruleText(cell,entry.id)}</th>`:`<td>${ruleText(cell,entry.id)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const stat=currentRuleStat(entry);
  const statInfo=stat?`<div class="rule-current-stat"><span>현재 카드의 수치</span><strong>${stat.label} · ${escapeHtml(stat.value)}</strong></div>`:'';
  const context=ruleContextUnit?`<p class="rule-card-context">${ui('현재 카드','Current card')} · ${escapeHtml(unitName(ruleContextUnit))}</p>`:'';
  $('#ruleDetail').innerHTML=`${context}<div class="rule-detail-heading"><span>${escapeHtml(entry.english)}</span><h2 id="ruleDetailTitle" tabindex="-1">${escapeHtml(entry.label)}</h2></div>${statInfo}<p class="rule-summary">${ruleText(entry.summary,entry.id)}</p>${entry.table?table(entry.table):''}${(entry.tables||[]).map(t=>table(t,t.heading)).join('')}${entry.sections.map(section=>{let text=section.text;if(stat?.movement&&section.heading==='수치 읽기'){const [,a,b,c]=stat.movement;text=`이 카드의 MOV는 ${stat.value}입니다. 한 번의 일반 이동 행동에서 최대 ${a}보폭 구간과 최대 ${b}보폭 구간을 모두 사용할 수 있으며, 두 구간의 순서는 선택합니다. 앞 구간에서 남긴 거리를 다음 구간에 더할 수는 없습니다. 괄호 안 ${c}는 별도로 사용하는 돌격 거리입니다.`}return `<section><h3>${escapeHtml(section.heading)}</h3><p>${ruleText(text,entry.id)}</p></section>`}).join('')}<nav class="rule-related" aria-label="관련 규칙">${entry.related.filter(id=>ruleById.has(id)).map(id=>`<button type="button" data-rule="${id}" data-rule-raw>${escapeHtml(ruleById.get(id).label)} →</button>`).join('')}</nav><p class="rule-source">${entry.pages.length?`공식 룰북 1.6.1 · ${entry.pages.join(', ')}쪽 (인쇄 쪽수)`:'공식 1.6.1의 독립 정의 없음 · 해당 카드·모험의 문구를 확인하세요.'}<br><a href="${escapeHtml(ruleData.sourceUrl)}" target="_blank" rel="noopener noreferrer">${ui('공식 원문 열기','Open official rules')} ↗</a> · <a href="./rules.html#core-${entry.pages[0]||2}" target="_blank" rel="noopener noreferrer">${ui('한국어 룰북 전문','Full Korean rulebook')} ↗</a></p>`;
}
function renderRuleSearch(query){
  const q=String(query).toLocaleLowerCase().replace(/\s/g,'');
  const entries=ruleData.entries.filter(e=>!q||[e.label,e.english,...e.aliases,e.summary,...e.sections.map(s=>s.heading+' '+s.text),...(e.table?.rows||[]).flat(),...(e.tables||[]).flatMap(t=>t.rows.flat())].some(v=>String(v).toLocaleLowerCase().replace(/\s/g,'').includes(q)));
  $('#ruleSearchResults').innerHTML=`<p class="rule-result-count">${entries.length}개 규칙</p>${entries.length?entries.map(e=>`<button type="button" class="rule-search-result" data-rule="${e.id}"><strong>${escapeHtml(e.label)}</strong><span>${escapeHtml(e.english)}</span><small>${escapeHtml(e.summary)}</small></button>`).join(''):'<p class="rule-empty">검색 결과가 없습니다. 한국어 용어나 영문 이름으로 검색해 보세요.</p>'}`;
}
document.addEventListener('click',event=>{
  const term=event.target.closest('[data-rule]');
  if(term){if(term.closest('#playCardStage')&&Date.now()<(window.warcrowSkipRuleClickUntil||0)){event.preventDefault();return}event.preventDefault();event.stopPropagation();const inside=$('#ruleDialog').open&&$('#ruleDialog').contains(term),popup=typeof keywordPopupRuleContext==='function'?keywordPopupRuleContext(term):null;openRule(term.dataset.rule,{unit:popup?popup.unit:inside?ruleContextUnit:inferRuleUnit(term),profile:popup?popup.profile:inside?ruleContextProfile:JSON.parse(term.closest('[data-rule-profile]')?.dataset.ruleProfile||'null'),raw:term.hasAttribute('data-rule-raw'),enhanced:term.dataset.ruleStatScope==='enhancement',resetContext:!!popup});return}
  const browser=event.target.closest('[data-open-rules]');if(browser){event.preventDefault();openRuleBrowser(inferRuleUnit(browser))}
});
document.addEventListener('input',event=>{if(event.target.id==='ruleSearch'){$('#ruleDetail').hidden=true;$('#ruleSearchResults').hidden=false;renderRuleSearch(event.target.value)}});
document.addEventListener('click',event=>{if(event.target.closest('#ruleBack')){const previous=ruleHistory.pop();if(previous)openRule(previous.id,{back:true,raw:true,scroll:previous.scroll})}});
