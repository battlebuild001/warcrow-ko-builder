/* Cards are rendered from reviewed game data. No source-card image is used here. */
let nativeCards={};
const nativeGlyphs={red:'w',orange:'q',yellow:'0',green:'9',blue:'8',black:'7',success:'1','hollow-success':'2',block:'3','hollow-block':'4',special:'5','hollow-special':'6',tinge:'[',lightning:'f',damage:'L'};
const nativeGlyphLabels={red:['빨강 주사위','Red die'],orange:['주황 주사위','Orange die'],yellow:['노랑 주사위','Yellow die'],green:['초록 주사위','Green die'],blue:['파랑 주사위','Blue die'],black:['검정 주사위','Black die'],success:['성공 기호','Success'],block:['방어 기호','Block'],special:['특수 기호','Special'],'hollow-success':['빈 성공 기호','Hollow success'],'hollow-block':['빈 방어 기호','Hollow block'],'hollow-special':['빈 특수 기호','Hollow special'],tinge:['팅지','Tinge'],lightning:['수정치','Modifier'],damage:['피해','Damage']};
function nativeGlyph(kind,trigger=false){
  const label=nativeGlyphLabels[kind]||[kind,kind],isDie=['red','orange','yellow','green','blue','black'].includes(kind);
  const rule=isDie?'dice':kind==='tinge'?'tinge':kind.startsWith('hollow-')?'hollow-symbols':kind==='success'?'success-symbol':kind==='block'?'block-symbol':kind==='special'?'special-symbol':kind==='lightning'?'modifier':kind==='damage'?'damage':'switches';
  return `<button type="button" class="native-glyph ${isDie?'die-':'symbol-'}${escapeHtml(kind)}${trigger?' native-cost':''}" data-rule="${rule}" aria-label="${escapeHtml(ui(...label))}" title="${escapeHtml(ui(...label))}"><span aria-hidden="true">${nativeGlyphs[kind]||'?'}</span></button>`;
}
function nativePoolSymbols(pool,add=false){
  const dice=(pool?.dice||[]).map(c=>nativeGlyph(c)).join(''),symbols=(pool?.symbols||[]).map(c=>nativeGlyph(c)).join('');
  return `${add&&(dice||symbols)?'<span class="native-plus" aria-label="add">+</span>':''}${dice}${symbols?`${dice?'<span class="native-pool-divider" aria-hidden="true"></span>':''}${symbols}`:''}`;
}
function nativeStat(label,value,scope='base',html=false){
  return `<button type="button" class="native-stat" data-rule="${ruleStatIds[label]}" data-rule-stat-scope="${scope}" aria-haspopup="dialog"><small>${label}</small><strong>${html?value:escapeHtml(value??'—')}</strong></button>`;
}
function nativeModifier(modifier){
  if(!modifier||(!(modifier.dice||[]).length&&!(modifier.symbols||[]).length))return '';
  return `<div class="native-modifier">${nativeGlyph('lightning')}${modifier.label?`<small>${escapeHtml(modifier.label)}</small>`:''}<span>${modifier.mode==='replace'?ui('교체','Replace'):ui('추가','Add')}</span>${nativePoolSymbols(modifier)}<small class="native-modifier-cost">${ruleTerm('stress',language==='en'?'1 stress':'스트레스 1')}</small></div>`;
}
function nativeModifiers(pool){return pool?.modifierOptions?pool.modifierOptions.map(nativeModifier).join(''):nativeModifier(pool?.modifier)}
function nativeRuleCopy(koText,enText){
  return language==='en'?`<div class="native-rule-copy" lang="en">${ruleText(enText)}</div>`:`<div class="native-rule-copy" lang="ko">${ruleText(koText)}</div>${language==='bi'?`<div class="native-rule-copy native-english" lang="en">${ruleText(enText)}</div>`:''}`;
}
function nativeEffect(effect,index,row){
  const attack=row.attacks[effect.columnRole==='attack-2'?1:0],column=effect.columnRole==='defense'?ui('방어 스위치','Defense switch'):attack?.kind==='ranged'?ui('원거리 공격 스위치','Ranged attack switch'):attack?.kind==='melee'?ui('근접 공격 스위치','Melee attack switch'):ui('공격 스위치','Attack switch');
  return `<section class="native-effect" data-effect-index="${index}" data-column-role="${escapeHtml(effect.columnRole)}"><div class="native-trigger" aria-label="${ui('발동에 소비하는 기호','Symbols spent to activate')}">${(effect.triggerCost||effect.trigger||[]).map(s=>nativeGlyph(s,true)).join('')}</div><div><small>${column}</small><span class="native-switch-timing">${ui('기호 소비 · 스위치 단계','Spend symbols · Switches step')}</span>${nativeRuleCopy(effect.korean,effect.english)}</div></section>`;
}
function nativeCombat(row,effects){
  const attacks=row.attacks||[],scope=row.section==='enhancement'?'enhancement':'base';
  const pools=attacks.map((attack,index)=>{
    const ranged=attack.kind==='ranged',all=attack.kind==='all',label=all?ui('모든 공격','All attacks'):ranged?ui('원거리 공격','Ranged attack'):ui('근접 공격','Melee attack');
    const rule=all?'attack':ranged?'ranged-attack':'melee-attack';
    return `<div class="native-pool" data-pool="attack-${index+1}"><div class="native-pool-title">${ruleTerm(rule,label)}${attack.range!==null&&attack.range!==undefined?`<span class="native-range">${ruleTerm('range',String(attack.range))}</span>`:''}</div><div class="native-dice">${nativePoolSymbols(attack,row.mode==='add')||'<span class="native-empty-pool">—</span>'}</div>${nativeModifiers(attack)}</div>`;
  });
  if(row.defense&&!row.defense.hidden)pools.push(`<div class="native-pool" data-pool="defense"><div class="native-pool-title">${ruleTerm('defense',ui('방어','Defense'))}</div><div class="native-dice">${nativePoolSymbols(row.defense,row.mode==='add')||'<span class="native-empty-pool">—</span>'}</div>${nativeModifiers(row.defense)}</div>`);
  return `<article class="native-combat" data-combat-key="${escapeHtml(row.key)}" data-section="${scope}"><div class="native-combat-heading">${row.members?`<span class="native-members">${ruleTerm('troop',`${row.members} ${language==='en'?'troops':'병력'}`)}</span>`:`<span>${ui('전투 프로필','Combat profile')}</span>`}${row.conquest!==null&&row.conquest!==undefined?`<button type="button" data-rule="conquest" class="native-conquest" aria-label="${ui('점령값','Conquest')} ${row.conquestMode==='add'?'+':''}${row.conquest}"><span>${ui('점령','Conquest')}</span><strong>${row.conquestMode==='add'?'+':''}${row.conquest}</strong></button>`:''}</div><div class="native-combat-grid" style="--pool-count:${Math.max(1,pools.length)}">${pools.join('')}</div>${effects.length?`<div class="native-effects">${effects.map(({effect,index})=>nativeEffect(effect,index,row)).join('')}</div>`:''}</article>`;
}
function nativeAbility(box,index){
  const type=box.iconType||'passive',typeNames={spell:['마법 능력','Magic skill'],action:['전투 능력','Combat skill'],command:['지휘 능력','Command skill'],passive:['패시브 능력','Passive skill'],tinge:['팅지 능력','Tinge skill']},glyph={spell:'?',action:'2',command:'@',automatic:'@',passive:'%',tinge:'['}[type]||'%';
  const title=box.titleKo||'',body=box.rulesKo??box.korean??'';
  return `<section class="native-ability" data-ability-index="${index}" data-section="${box.section||'base'}"><button type="button" class="native-ability-mark native-ability-${type}" data-rule="skills" aria-label="${escapeHtml(ui(...(typeNames[type]||['능력 종류','Skill types'])))}" title="${escapeHtml(ui(...(typeNames[type]||['능력 종류','Skill types'])))}"><span aria-hidden="true">${glyph}</span></button><div><p class="native-ability-kind">${ui(...(typeNames[type]||['능력','Skill']))} · ${type==='command'?ui('지휘 토큰 1개','1 Command token'):type==='passive'?ui('조건 충족 시 적용','Apply at the printed condition'):type==='tinge'?ui('행동 + 팅지 1개','Action + 1 Tinge'):ui('행동 사용','Uses an action')}</p>${language!=='en'?`<h3 class="native-ability-title">${escapeHtml(title)}</h3>`:''}${nativeRuleCopy(body,box.english)}</div></section>`;
}
function nativeUnitCard(u,options={}){
  const profile=options.profile||nativeCards[u.cardKey]||{},abilities=options.abilities||cardAbilities[u.cardKey]||[],effects=options.effects||cardEffects[u.cardKey]||[];
  const dice=profile.wpDice||[],stats=[nativeStat('MOV',profile.mov),nativeStat('W',profile.w),nativeStat('WP',dice.length?dice.map(c=>`<span class="native-glyph die-${escapeHtml(c)}" aria-label="${escapeHtml(ui(...nativeGlyphLabels[c]))}"><span aria-hidden="true">${nativeGlyphs[c]}</span></span>`).join(''):'—','base',true),nativeStat('MOR',profile.mor),nativeStat('AVB',u.availability)].join('');
  const renderSection=section=>{
    let rowIndex=0;
    const rows=(profile.combat||[]).filter(r=>(r.section||'base')===section);
    const combat=rows.map(row=>{const index=rowIndex++;return nativeCombat(row,effects.map((effect,i)=>({effect,index:i})).filter(({effect})=>(effect.section||'base')===section&&effect.row===index))}).join('');
    const skills=abilities.map((box,index)=>({box,index})).filter(({box})=>(box.section||'base')===section).map(({box,index})=>nativeAbility(box,index)).join('');
    if(section==='base')return `${combat}${skills?`<div class="native-abilities">${skills}</div>`:''}`;
    const extraStats=profile.enhancement?.stats||[];
    if(!combat&&!skills&&!extraStats.length)return '';
    const joined=(u.keywords||[]).some(k=>/^Join\b/.test(k.name));
    return `<section class="native-enhancement"><h3 class="native-section">${joined?ui('합류 시 프로필','Joined profile'):ui('추가 프로필','Additional profile')}</h3>${extraStats.length?`<div class="native-enhancement-stats">${extraStats.map(stat=>nativeStat(stat.label,stat.dice?.length?`${stat.mode==='add'?'+ ':''}${stat.dice.map(c=>`<span class="native-glyph die-${c}"><span>${nativeGlyphs[c]}</span></span>`).join('')}`:escapeHtml(stat.value??'—'),'enhancement',true)).join('')}</div>`:''}${combat}${skills?`<div class="native-abilities">${skills}</div>`:''}</section>`;
  };
  const name=language==='en'?u.name:localizedName(u);
  const traits=(u.characteristics||[]).map(t=>`<span>${ruleKeyword(t)}</span>`).join('');
  return `<article class="native-card" data-rule-profile="${escapeHtml(JSON.stringify({mov:profile.mov,w:profile.w,wpDice:profile.wpDice,mor:profile.mor}))}" data-card-key="${escapeHtml(u.cardKey)}" data-rule-unit="${escapeHtml(u.id)}" aria-label="${escapeHtml(unitName(u))}">${cardRulesTools()}${options.headingNote?`<p class="native-heading-note">${escapeHtml(options.headingNote)}</p>`:''}<header class="native-card-head"><div class="native-portrait">${modelPhoto(u,true)}</div><div class="native-title"><h2>${escapeHtml(name)}</h2>${language==='bi'?`<small lang="en">${escapeHtml(u.name)}</small>`:''}</div><button type="button" class="native-points" data-rule="points"><strong>${u.pointsCost}</strong><small>PT</small></button></header><div class="native-stats">${stats}</div><div class="native-traits">${traits}</div>${cardKeywordGuide(u,{profile,abilities,effects})}${profile.sourceAvailable===false?`<p class="native-missing">${ui('공식 빌더에 상세 카드가 제공되지 않아 확인된 편성 정보만 표시합니다.','The official builder does not provide a detailed card. Only verified army data is shown.')}</p>`:''}<div class="native-card-content">${renderSection('base')}${renderSection('enhancement')}</div><footer class="native-footer">${profile.initialTroops!==null&&profile.initialTroops!==undefined?ruleTerm('troop',`${ui('병력','Troops')} ${profile.initialTroops}`):'<span></span>'}<span>${ruleTerm('command-token','COM')} ${u.command||0}</span></footer></article>`;
}
