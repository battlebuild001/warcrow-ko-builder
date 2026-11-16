/* Keyword references never grant an action. All usage links come from the displayed card. */
let keywordTiming={rules:{}};
function configureKeywordTiming(value){keywordTiming=value&&value.rules?value:{rules:{}};}
const keywordClassifications=new Set(['aestari','cavalry','character','elf','infantry','syenann']);
const keywordRuleAliases={'beserker rage':'berserker-rage','vunerable':'vulnerable','dismared':'disarmed','displaced':'displace','placed':'place','repeat a die':'repeat-die','repeat die':'repeat-die','immune to state':'immunity','cancel a symbol':'cancel-symbol','preferred terrain':'preferred-terrain'};
function keywordRuleId(raw){
  const clean=String(raw||'').replace(/<[^>]*>/g,'').trim(),base=clean.replace(/\s*\(.*$/,'').trim().toLowerCase();
  return ruleByAlias.get(clean.toLowerCase())||keywordRuleAliases[base]||ruleByAlias.get(base)||'';
}
function keywordCopy(koText,enText,plain=false){
  const copy=plain?escapeHtml:ruleText;
  return language==='en'?'<span lang="en">'+copy(enText)+'</span>':'<span lang="ko">'+copy(koText)+'</span>'+(language==='bi'?'<span class="keyword-english" lang="en">'+copy(enText)+'</span>':'');
}
function keywordOwnedTerms(unit){
  const names=typeof joinUnitMetadata==='function'?joinUnitMetadata(unit)?.keywords:null;
  return [...new Set(names||(unit.keywords||[]).map(k=>k.name))].map(raw=>({raw,id:keywordRuleId(raw),owned:true}));
}
function keywordScanTerms(text){
  const result=[],raw=String(text||'');
  for(const id of Object.keys(keywordTiming.rules)){
    const entry=ruleById.get(id);if(!entry)continue;
    const parameterized=['place','displace','shove','attract','intimidating'].includes(id);
    const extra={place:['배치'],displace:['강제 이동'],shove:['밀어내기'],attract:['끌어당기기']};
    const aliases=[entry.english.replace(/\s*\(.*$/,''),...entry.aliases,...(extra[id]||[])]
      .map(s=>s.replace(/\s*\(.*$/,'').trim()).filter(Boolean);
    for(const alias of new Set(aliases)){
      const escaped=alias.replace(/[.*+?^{}()|[\]\\$]/g,'\\$&');
      const pattern=new RegExp((/^[a-z]/i.test(alias)?'(?<![a-z])':'')+escaped+(parameterized?'(?:d)?(?:\\s*\\(\\s*(\\d+|X)\\s*\\))?(?![a-z])':(/^[a-z]/i.test(alias)?'(?![a-z])':'')),'gi');
      for(const match of raw.matchAll(pattern)){
        const value=parameterized?match[1]:null;if(parameterized&&alias==='배치'&&!value)continue;
        result.push({id,value,start:match.index,end:match.index+match[0].length,raw:parameterized?entry.english.replace(/\(.*\)/,'('+value+')'):entry.english});
      }
    }
  }
  const selected=[];for(const term of result.sort((a,b)=>a.start-b.start||(b.end-b.start)-(a.end-a.start))){if(!selected.some(t=>term.start<t.end&&term.end>t.start))selected.push(term);}return selected;
}
function keywordSourceTerms(item){const koTerms=keywordScanTerms(item.rulesKo??item.korean??''),enTerms=keywordScanTerms(item.english||''),terms=[...koTerms,...enTerms.filter(e=>!koTerms.some(k=>k.id===e.id))];return terms.filter(t=>t.value||!terms.some(other=>other.id===t.id&&other.value));}
function keywordSources(unit,abilities,effects,profile){
  const sources=[];
  abilities.forEach((item,index)=>{const terms=keywordSourceTerms(item),ids=item.iconType==='tinge'?['tinge','tinge-skill']:item.iconType==='spell'?['spellcaster','cast-spell']:[];for(const id of ids)if(!terms.some(t=>t.id===id))terms.push({id,raw:ruleById.get(id)?.english||id});sources.push({kind:'ability',index,item,terms});});
  effects.forEach((item,index)=>{
    const rows=(profile.combat||[]).filter(r=>(r.section||'base')===(item.section||'base')),row=rows[item.row];if(!row)return;
    const terms=keywordSourceTerms(item);if((item.triggerCost||item.trigger||[]).includes('tinge')&&!terms.some(t=>t.id==='tinge'))terms.push({id:'tinge',raw:'Tinge'});sources.push({kind:'effect',index,item,row,terms});
  });
  return sources;
}
function keywordGuideModel(unit,options={}){
  const abilities=options.abilities||cardAbilities[unit.cardKey]||[],effects=options.effects||cardEffects[unit.cardKey]||[],profile=options.profile||nativeCards[unit.cardKey]||{};
  const sources=keywordSources(unit,abilities,effects,profile),owned=keywordOwnedTerms(unit),byKey=new Map();
  const add=term=>{
    if(!term.id||keywordClassifications.has(term.id))return;
    const value=term.value||(['place','displace','shove','attract','intimidating'].includes(term.id)?String(term.raw).match(/\((\d+|X)\)/i)?.[1]:null);
    const key=term.id+(value?'-'+value:'');
    if(!byKey.has(key))byKey.set(key,{...term,value,key,sources:[]});else if(term.owned)byKey.get(key).owned=true;
    return byKey.get(key);
  };
  owned.forEach(add);
  for(const source of sources)for(const term of source.terms){const entry=add(term);if(entry&&!entry.sources.some(s=>s.kind===source.kind&&s.index===source.index))entry.sources.push(source);}
  return {unit,terms:[...byKey.values()],owned,sources};
}
function keywordTermLabel(term,unit=null){
  if(term.owned&&unit&&term.id==='join'){const targets=joinGroups(unit).map(group=>group.map(t=>keywordJoinName(t,unit)).join(' + ')).join(' | ');return ui('합류','Join')+' ('+targets+')';}
  if(['dispel','cover'].includes(term.id)&&keywordParameterText(term.raw))return ui(term.id==='dispel'?'주문 해제':'엄폐',term.id==='dispel'?'Dispel':'Cover')+' ('+keywordParameterText(term.raw)+')';
  if(['place','displace','shove','attract','intimidating'].includes(term.id)){const base={place:'배치',displace:'강제 이동',shove:'밀어내기',attract:'끌어당기기',intimidating:'위압'}[term.id];return ui(base+(term.value?'('+term.value+')':''),ruleById.get(term.id).english.replace(/\(.*\)/,term.value?'('+term.value+')':'').trim());}
  const entry=ruleById.get(term.id);if(language!=='en'&&ko(term.raw)===term.raw&&entry)return ui(entry.label,entry.english);
  return traitName(term.raw);
}
function keywordSkillTiming(item){
  const type=item.iconType||'passive',long=/^\s*긴 행동[.\n·]/.test(item.rulesKo??item.korean??'');
  const action=long?['긴 행동','a long action']:['능력 수행 단순 행동 1개','one simple skill action'];
  const copy={
    action:['자신의 활성화 중 '+action[0]+'으로 사용합니다. 아래에 적힌 대상·조건을 충족해야 합니다.','During your activation, use '+action[1]+' and meet the printed target and conditions.'],
    spell:['자신의 활성화 중 마법 능력 수행 행동으로 시전합니다. 주문 시전자 요건과 아래 주문의 대상·조건을 따릅니다.','During your activation, perform a Magic skill action. Follow Spellcaster requirements and the printed target and conditions.'],
    tinge:['자신의 활성화 중 팅지 1개를 소비하고 팅지 능력 수행 행동으로 사용합니다. 아래 조건도 충족해야 합니다.','During your activation, spend 1 Tinge and perform a Tinge skill action, meeting the printed conditions.'],
    command:['아래에 적힌 시점·조건에 지휘 토큰 1개를 소비해 사용합니다. 행동은 소비하지 않습니다.','At the printed timing and conditions, spend 1 Command token. No action is spent.'],
    passive:['아래에 적힌 시점·조건을 충족하면 적용합니다. 별도의 능력 수행 행동이나 지휘 토큰은 필요하지 않습니다.','Apply at the printed timing and conditions. No skill action or Command token is required.']
  };return copy[type]||copy.passive;
}
function keywordSourceLabel(source){
  const item=source.item,scope=item.joinedFrom?ui('합류 캐릭터에게서 적용','From joined Character'):item.section==='enhancement'?ui('합류·추가 프로필','Joined / additional profile'):ui('일반 프로필','Base profile');
  if(source.kind==='ability'){
    const types={action:['전투 능력','Combat skill'],spell:['마법 능력','Magic skill'],command:['지휘 능력','Command skill'],passive:['패시브 능력','Passive skill'],tinge:['팅지 능력','Tinge skill']};
    const title=language==='en'?(item.english||'').split('.')[0]:item.titleKo;
    return scope+' · '+ui(...(types[item.iconType]||types.passive))+(title?' · '+title:'');
  }
  const attack=source.row.attacks?.[item.columnRole==='attack-2'?1:0],role=item.columnRole==='defense'?ui('방어 스위치','Defense switch'):attack?.kind==='ranged'?ui('원거리 공격 스위치','Ranged attack switch'):ui('근접 공격 스위치','Melee attack switch');
  return scope+' · '+(source.row.members?source.row.members+' '+ui('병력 행','troop row')+' · ':'')+role;
}
function keywordSourceMarkup(source){
  const item=source.item,cost=item.triggerCost||item.trigger||[];
  const timing=source.kind==='ability'?keywordSkillTiming(item):[
    '해당 전투 행의 굴림에서, 다시 굴림을 마친 뒤 스위치 단계에 표시된 기호를 소비합니다. 소비한 기호는 결과 계산이나 다른 효과에 다시 쓰지 않습니다. 원거리 공격의 방어자와 기회 공격에서는 스위치를 사용할 수 없습니다.',
    'In the matching combat row, after rerolls, spend the shown symbols during the Switches step. Spent symbols cannot be reused. Ranged defenders and both sides of opportunity attacks cannot use switches.'
  ];
  return '<li class="keyword-source"><strong>'+escapeHtml(keywordSourceLabel(source))+'</strong><p>'+keywordCopy(...timing)+'</p>'+(source.kind==='effect'?'<div class="keyword-source-cost"><span>'+ui('소비 기호','Spend')+'</span>'+cost.map(s=>nativeGlyph(s,true)).join('')+'</div>':'')+'<blockquote>'+nativeRuleCopy(item.rulesKo??item.korean??'',item.english||'')+'</blockquote><button type="button" class="keyword-jump" data-keyword-jump="'+source.kind+':'+source.index+'">'+ui('카드의 해당 효과로 이동','Go to this effect on the card')+' ↓</button></li>';
}
function keywordTermMarkup(term,unit){
  const entry=ruleById.get(term.id),definition=keywordTiming.rules[term.id],timing=definition?[definition.timingKo,definition.timingEn]:['키워드의 조건을 충족하는 시점에 적용합니다.','Apply when the keyword’s conditions are met.'];
  const usage=definition?[definition.useKo,definition.useEn]:[entry?.summary||'카드와 공식 규칙의 조건을 따릅니다.',entry?.english||'Follow the printed rule.'];
  const status=term.owned?ui('보유 키워드','Printed keyword'):ui('효과에서 참조','Referenced by effects');
  const intro=term.owned?[
    '이 유닛이 보유한 키워드입니다. 별도의 이름이 붙은 능력과 구분하며, 아래 규칙의 발동 조건에 따라 적용합니다.',
    'This is a printed keyword of the unit. Apply its own timing and conditions, separately from named skills.'
  ]:[
    '이 용어는 아래 능력·스위치가 사용하는 규칙입니다. 참조 목록에 있다는 이유만으로 별도 행동을 얻거나 해당 상태가 되는 것은 아닙니다.',
    'This rule is referenced by the skills or switches below. Listing it grants neither a separate action nor the state itself.'
  ];
  const scions=term.id==='tinge'&&unit.faction==='scions-of-yaldabaoth'?'<p class="keyword-faction-note">'+keywordCopy('이 진영은 사이언즈 오브 얄다바오트의 팅지 전용 표를 사용합니다. 토큰을 받을 때마다 판정하지 않고, 규칙이 지정한 확인 시점에 처리합니다.','This faction uses the Scions of Yaldabaoth Tinge table. Check effects only at specified checkpoints, not whenever a token is gained.')+'</p>':'';
  return '<article class="keyword-popup-entry" data-keyword-entry="'+escapeHtml(term.key)+'" data-keyword-rule="'+term.id+'"><p class="keyword-popup-status">'+status+'</p><section class="keyword-popup-timing"><h3>'+ui('사용 시점','When to use')+'</h3><p>'+keywordCopy(...timing)+'</p></section><div class="keyword-explanation-body"><p class="keyword-source-type">'+keywordCopy(...intro)+'</p><h4>'+ui('처리 방법','How to resolve')+'</h4><p>'+keywordCopy(...usage)+'</p>'+keywordParameterNote(term,unit)+scions+(term.sources.length?'<h4>'+ui('이 카드에서 사용하는 시점·조건','Timing and conditions on this card')+'</h4><ul class="keyword-sources">'+term.sources.map(keywordSourceMarkup).join('')+'</ul>':'')+'<button type="button" class="keyword-full-rule" data-rule="'+term.id+'">'+ui('전체 규칙·예외 보기','Full rule and exceptions')+' ↗</button><small class="keyword-citation">'+(entry?.pages?.length?ui('공식 룰북 1.6.1 · ','Official rulebook 1.6.1 · p. ')+entry.pages.join(', '):ui('카드의 지시를 따릅니다.','Follow the card instruction.'))+'</small></div></article>';
}
function cardKeywordGuide(unit,options={}){
  const model=keywordGuideModel(unit,options),owned=model.terms.filter(t=>t.owned),references=model.terms.filter(t=>!t.owned);
  const chips=(terms,caption)=>terms.length?'<div class="keyword-chip-group"><span class="card-keyword-caption">'+caption+'</span>'+terms.map(term=>'<button type="button" class="card-keyword-chip" data-keyword-open="'+escapeHtml(term.key)+'" aria-haspopup="dialog" aria-label="'+escapeHtml(keywordTermLabel(term,unit))+' '+ui('설명 보기','explanation')+'">'+escapeHtml(keywordTermLabel(term,unit))+'</button>').join('')+'</div>':'';
  return owned.length||references.length?'<section class="card-keyword-guide"><div class="card-keyword-chips">'+chips(owned,ui('보유 키워드','Printed keywords'))+chips(references,ui('능력·스위치에서 참조하는 규칙','Rules referenced by skills and switches'))+'</div></section>':'';
}
const keywordCardContexts=new WeakMap();
let keywordPopupContext=null;
function bindKeywordCard(card,unit,options={}){
  if(!card||!unit)return null;
  const context={card,unit,profile:options.profile||nativeCards[unit.cardKey]||{},model:keywordGuideModel(unit,options)};
  keywordCardContexts.set(card,context);return context;
}
function keywordPopupRuleContext(target){
  return keywordPopupContext&&target?.closest('#keywordDialog')?{unit:keywordPopupContext.unit,profile:keywordPopupContext.profile}:null;
}
function openKeywordPopup(opener){
  const card=opener.closest('.native-card'),context=card&&keywordCardContexts.get(card);
  if(!context)return;
  const term=context.model.terms.find(t=>t.key===opener.dataset.keywordOpen);if(!term)return;
  let dialog=document.getElementById('keywordDialog');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='keywordDialog';dialog.className='keyword-dialog';dialog.setAttribute('aria-labelledby','keywordPopupTitle');document.body.append(dialog);}
  if(dialog.open)return;
  const current={...context,opener,restoreFocus:true};keywordPopupContext=current;
  dialog.dataset.ruleUnit=context.unit.id;
  dialog.innerHTML='<header class="keyword-popup-head"><div><p>'+escapeHtml(unitName(context.unit))+'</p><h2 id="keywordPopupTitle" tabindex="-1">'+escapeHtml(keywordTermLabel(term,context.unit))+'</h2></div><button type="button" class="keyword-popup-close" data-close-keyword aria-label="'+ui('키워드 설명 닫기','Close keyword explanation')+'">×</button></header><div class="keyword-popup-body">'+keywordTermMarkup(term,context.unit)+'</div>';
  dialog.querySelector('[data-close-keyword]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{
    if(keywordPopupContext===current)keywordPopupContext=null;
    if(current.restoreFocus&&current.opener.isConnected)current.opener.focus({preventScroll:true});
  },{once:true});
  dialog.showModal();dialog.scrollTop=0;dialog.querySelector('#keywordPopupTitle').focus({preventScroll:true});
}
document.addEventListener('click',event=>{
  const opener=event.target.closest('[data-keyword-open]');
  if(opener){
    if(opener.closest('#playCardStage')&&Date.now()<(window.warcrowSkipRuleClickUntil||0)){event.preventDefault();return;}
    event.preventDefault();openKeywordPopup(opener);return;
  }
  const jump=event.target.closest('[data-keyword-jump]');if(!jump||!jump.closest('#keywordDialog')||!keywordPopupContext)return;
  event.preventDefault();const context=keywordPopupContext,[kind,index]=jump.dataset.keywordJump.split(':');
  const target=context.card.isConnected?context.card.querySelector('[data-'+kind+'-index="'+index+'"]'):null;
  if(!target)return;
  context.restoreFocus=false;document.getElementById('keywordDialog').close();
  target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'center',behavior:'auto'});target.classList.add('keyword-effect-focus');setTimeout(()=>target.classList.remove('keyword-effect-focus'),1600);
});

function keywordParameterText(raw,lang=language){
  const glyphColors={7:['검정','Black'],8:['파랑','Blue'],9:['초록','Green']};
  const glyphs=[...String(raw).matchAll(/WC_(\d+)/g)].map(m=>glyphColors[m[1]]).filter(Boolean);
  if(glyphs.length)return glyphs.map(c=>lang==='en'?c[1]:c[0]).join(' · ');
  const match=String(raw).match(/\(([^)]+)\)/);if(!match)return '';
  const colors={BLK:['검정','Black'],BLU:['파랑','Blue'],GRN:['초록','Green'],G:['초록','Green']};
  const parts=match[1].trim().split(/\s+/);return parts.every(p=>colors[p])?parts.map(p=>lang==='en'?colors[p][1]:colors[p][0]).join(' · '):'';
}
function keywordJoinName(token,unit){
  if(terms[token])return language==='en'?token:terms[token];
  const ids=joinMetadata.unitNameAliases?.[joinNormalize(token)]||[];
  const target=data.units.find(u=>ids.includes(u.id)&&u.faction===unit.faction)||data.units.find(u=>ids.includes(u.id));
  return target?(language==='en'?target.name:localizedName(target)):(language==='en'?token:ko(token));
}
function keywordParameterNote(term,unit){
  let content='';
  if(term.owned&&term.id==='join'){
    const groups=joinGroups(unit).map(group=>group.map(t=>keywordJoinName(t,unit)).join(ui('이면서 ',' AND ')));
    content=keywordCopy('허용 대상: '+groups.join(' 또는 '),'Eligible targets: '+joinGroups(unit).map(group=>group.join(' AND ')).join(' OR '));
  }else if(['dispel','cover'].includes(term.id)&&keywordParameterText(term.raw)){
    content=keywordCopy('이 카드의 D: '+keywordParameterText(term.raw,'ko')+' 주사위.','This card’s D: '+keywordParameterText(term.raw,'en')+' dice.');
  }else if(term.value&&/^\d+$/.test(term.value)){
    content=keywordCopy('이 문구의 '+(term.id==='intimidating'?'N':'X')+' 값은 '+term.value+(term.id==='intimidating'?'입니다.':'보폭입니다.'),'In this instruction, '+(term.id==='intimidating'?'N':'X')+' = '+term.value+(term.id==='intimidating'?'.':' strides.'));
  }else if(term.id==='displace'){
    content=keywordCopy('거리 숫자가 없는 강제 이동은 원래 문구가 정한 목적지·조건을 따릅니다. 다른 효과에 적힌 거리를 가져오지 않습니다.','If no distance is printed, follow this instruction’s destination and conditions; do not borrow a distance from another effect.');
  }
  return content?'<p class="keyword-parameter-note">'+content+'</p>':'';
}

