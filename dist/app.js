const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const factionNames = {
  'northern-tribes':['북방 부족','N'], 'feudom':['봉건령','F'],
  'hegemony-of-embersig':['엠버시그 패권국','H'], 'mounthaven':['마운트헤이븐','M'],
  'scions-of-yaldabaoth':['얄다바오트의 자손','S'], 'syenann':['시예난','S']
};
const terms = {
  'Character':'캐릭터','Infantry':'보병','Cavalry':'기병','Companion':'동반자',
  'High Command':'최고 지휘부','High Commander':'최고 지휘관','Mercenary':'용병',
  'Human':'인간','Orc':'오크','Dwarf':'드워프','Elf':'엘프','Knight':'기사',
  'Noble':'귀족','Varank':'바랑크','Red Cap':'레드 캡','Colossal Company':'거대 중대',
  'Projectile':'투사체','Construct':'구조체','Beast':'야수','Spirit':'영혼',
  'Scout':'정찰','Ambusher':'매복','Fearless':'공포 무시','Elite':'정예',
  'Raging':'격노','Bloodlust':'피의 갈증','Spellcaster':'주문 시전자',
  'Join':'합류','Preferred Terrain':'선호 지형','Intimidating':'위압',
  'Large':'대형','Dispel':'주문 해제','Golem':'골렘','Immovable':'이동 불가',
  'Aim':'조준','Manned':'탑승','Tinge':'마법 오염','Cover':'엄폐',
  'Slowed':'둔화','Vulnerable':'취약','Disarmed':'무장 해제',
  'Frightened':'공포','Shove':'밀어내기','Attract':'끌어당기기',
  'Place':'배치','Displace':'강제 이동','Fix a Die':'주사위 고정',
  'Repeat a Die':'주사위 다시 굴리기','Repeat Die':'주사위 다시 굴리기',
  'Flee':'도주','Heal':'치유','Rugged':'험지','Forest':'숲','or':'또는','Trap':'함정'
};
function ko(value){
  const raw=String(value||'');
  return raw.replace(/\b[A-Za-z][A-Za-z ]+\b/g, (part)=>{
    const trimmed=part.trim();
    return (terms[trimmed]||trimmed.split(' ').map(word=>terms[word]||word).join(' '))+(part.endsWith(' ')?' ':'');
  });
}
let data={units:[],factions:[],wtsFogIds:[],version:''};
let translations={names:{},cards:{}};
let cardProfiles={};
let cardAbilities={};
let cardEffects={};
function localizedName(u){return translations.names[u.name]||u.name}
function localCardUrl(u){return translations.cards[u.cardKey]?`./card-art/${encodeURIComponent(u.cardKey)}_card_en.webp`:''}
const state={faction:'northern-tribes',mode:'wts',limit:250,quantities:{},commander:'',query:'',sort:'points',type:'all',availableOnly:false,listName:''};
const storageKey='warcrow-ko-draft-lists-v1';
let toastTimer;
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3200)}
function currentUnits(){return data.units.filter(u=>u.faction===state.faction)}
function selectedUnits(){return currentUnits().filter(u=>(state.quantities[u.id]||0)>0)}
function count(u){return state.quantities[u.id]||0}
function totalPoints(){return selectedUnits().reduce((sum,u)=>sum+u.pointsCost*count(u),0)}
function totalCommand(){return selectedUnits().reduce((sum,u)=>sum+(u.command||0)*count(u),0)}
function mercenaries(){return selectedUnits().reduce((sum,u)=>sum+(u.characteristics?.includes('Mercenary')?count(u):0),0)}
function isBlocked(u){return state.mode==='wts'&&data.wtsFogIds.includes(u.id)}
function canAdd(u){
  if(isBlocked(u))return 'WTS 시즌 2 출전 불가';
  if(count(u)>=u.availability)return 'AVB 상한 도달';
  if(totalPoints()+u.pointsCost>state.limit)return '점수 상한 초과';
  if(u.highCommand&&selectedUnits().some(x=>x.highCommand&&x.id!==u.id))return '최고 지휘부는 1명까지';
  if(state.mode==='wts'&&u.characteristics?.includes('Mercenary')&&mercenaries()>=1)return '용병은 1개까지';
  return '';
}
function unitType(u){if(u.characteristics?.includes('Companion')||u.type==='Companion')return 'Companion';if(u.characteristics?.includes('Character')||u.type?.includes('Character'))return 'Character';return 'Troop'}
function renderFactions(){
  $('#factionGrid').innerHTML=data.factions.map(f=>{
    const [name,symbol]=factionNames[f.id]||[f.name,f.name[0]];
    return `<button type="button" class="faction-button ${state.faction===f.id?'active':''}" data-faction="${escapeHtml(f.id)}" aria-pressed="${state.faction===f.id}"><span class="faction-symbol">${escapeHtml(symbol)}</span><span class="faction-ko">${escapeHtml(name)}</span><span class="faction-en">${escapeHtml(f.name)}</span></button>`;
  }).join('');
  $('#currentFactionName').textContent=factionNames[state.faction]?.[0]||state.faction;
}
function renderCatalog(){
  const query=state.query.toLocaleLowerCase().trim();
  let units=currentUnits().filter(u=>{
    if(state.type!=='all'&&unitType(u)!==state.type)return false;
    if(state.availableOnly&&canAdd(u))return false;
    if(!query)return true;
    return [u.name,localizedName(u),u.name_es,...(u.characteristics||[]),...(u.keywords||[]).map(k=>k.name),...(u.specialRules||[])].some(x=>String(x).toLocaleLowerCase().includes(query));
  });
  units.sort((a,b)=>state.sort==='name'?a.name.localeCompare(b.name):state.sort==='points-desc'?b.pointsCost-a.pointsCost||a.name.localeCompare(b.name):a.pointsCost-b.pointsCost||a.name.localeCompare(b.name));
  $('#unitCount').textContent=`${units.length}개`;
  $('#unitList').innerHTML=units.length?units.map(u=>{
    const blocked=isBlocked(u),reason=canAdd(u),traits=(u.characteristics||[]).slice(0,4),special=(u.specialRules||[]).slice(0,3).map(ko).join(' · ');
    const category=unitType(u)==='Character'?'캐릭터':unitType(u)==='Companion'?'동반자':'일반 유닛';
    return `<article class="unit-card"><div class="unit-icon">${escapeHtml(localizedName(u).slice(0,1))}</div><div class="unit-main"><div class="unit-top"><div><div class="unit-name"><span class="unit-name-ko">${escapeHtml(localizedName(u))}</span><span class="unit-name-en">${escapeHtml(u.name)}</span></div><div class="unit-category">${category}${u.highCommand?' · 최고 지휘부':''}</div></div><div class="unit-cost">${u.pointsCost}<small> 점</small></div></div><div class="tags">${traits.map(t=>`<span class="tag">${escapeHtml(terms[t]||t)}</span>`).join('')}${blocked?'<span class="tag warning">WTS 출전 불가</span>':''}</div>${special?`<p class="rule-line" title="${escapeHtml(special)}">규칙 · ${escapeHtml(special)}</p>`:''}<div class="unit-bottom"><button class="mini-link" data-card="${escapeHtml(u.id)}">한글 카드 보기 ↗</button><div class="stepper"><button type="button" data-remove="${escapeHtml(u.id)}" aria-label="${escapeHtml(u.name)} 제거" ${count(u)?'':'disabled'}>−</button><b>${count(u)} <small>/ ${u.availability}</small></b><button type="button" data-add="${escapeHtml(u.id)}" aria-label="${escapeHtml(u.name)} 추가" title="${escapeHtml(reason||'추가')}" ${reason?'disabled':''}>+</button></div></div></div></article>`;
  }).join(''):'<div class="empty">조건에 맞는 유닛이 없습니다.<br />검색어나 필터를 바꿔보세요.</div>';
}
function renderCommander(){
  const candidates=selectedUnits().filter(u=>unitType(u)==='Character');
  const high=candidates.find(u=>u.highCommand);
  if(high)state.commander=high.id;
  if(state.commander&&!candidates.some(u=>u.id===state.commander))state.commander='';
  $('#commanderSelect').innerHTML='<option value="">지휘관 선택</option>'+candidates.map(u=>`<option value="${escapeHtml(u.id)}" ${u.id===state.commander?'selected':''}>${escapeHtml(localizedName(u))}${u.highCommand?' · 최고 지휘부':''}</option>`).join('');
  $('#commanderSelect').disabled=!!high;
}
function renderValidation(){
  const selected=selectedUnits(),issues=[];
  if(!selected.length)issues.push('유닛을 추가하면 편성 검사를 시작합니다.');
  else{
    if(!state.commander)issues.push('지휘관을 지정해야 합니다.');
    else if(!selected.find(u=>u.id===state.commander)?.highCommand)issues.push('선택한 지휘관의 Officer 타입을 공식 카드에서 확인하세요.');
    if(totalPoints()>state.limit)issues.push(`점수 상한을 ${totalPoints()-state.limit}점 초과했습니다.`);
    if(state.mode==='wts'&&selected.some(isBlocked))issues.push('WTS 시즌 2 출전 불가 유닛이 포함되어 있습니다.');
    if(state.mode==='wts'&&mercenaries()>1)issues.push('WTS에서는 용병이 최대 1개입니다.');
    if(selected.filter(u=>u.highCommand).length>1)issues.push('High Command는 최대 1명입니다.');
  }
  $('#validation').innerHTML=issues.length?issues.map(x=>`<p class="warn">${escapeHtml(x)}</p>`).join(''):'<p class="good">현재 입력된 편성 조건을 충족합니다. 공식 Officer 타입과 최신 프로필은 추가 확인이 필요합니다.</p>';
}
function renderArmy(){
  const units=selectedUnits(),points=totalPoints(),number=units.reduce((sum,u)=>sum+count(u),0);
  $('#armyCount').textContent=`${number}개 유닛`;
  $('#scoreValue').innerHTML=`${points} <small>/ ${state.limit}점</small>`;
  $('#scoreMeter').style.width=`${Math.min(100,points/state.limit*100)}%`;
  $('#scoreRemaining').textContent=points<=state.limit?`${state.limit-points}점 남음`:`${points-state.limit}점 초과`;
  $('#commandValue').textContent=totalCommand();
  $('#mercenaryValue').textContent=`${mercenaries()} / ${state.mode==='wts'?'1':'—'}`;
  renderCommander();renderValidation();
  $('#selectedList').innerHTML=units.length?units.map(u=>`<div class="selected-entry"><span class="number">${count(u)}×</span><div class="summary"><strong>${escapeHtml(localizedName(u))}</strong><small>${u.pointsCost*count(u)}점 · COM ${(u.command||0)*count(u)}${data.wtsFogIds.includes(u.id)&&state.mode==='wts'?' · 출전 불가':''}</small></div><button type="button" data-remove="${escapeHtml(u.id)}" aria-label="${escapeHtml(u.name)} 제거">−</button></div>`).join(''):'<div class="empty">아직 추가한 유닛이 없습니다.<br />왼쪽 목록에서 부대를 구성하세요.</div>';
}
function cardIcon(name,kind,label){
  return `<svg class="card-icon ${kind}" viewBox="0 0 40 40" role="img" aria-label="${escapeHtml(label)}"><use href="./icons.svg?v=9#${name}" /></svg>`;
}
function tattooistShowcase(){
  return `<article class="showcase-card" aria-label="타투이스트 한국어 카드 예시">
    <div class="showcase-top"><div class="showcase-portrait" role="img" aria-label="타투이스트 인물 그림"></div><div class="showcase-identity"><span class="showcase-eyebrow">북방 부족 · 캐릭터 / 바랑크</span><h2>타투이스트</h2><span class="showcase-original">TATTOOIST</span><div class="showcase-badges"><span>정찰</span><span>바랑크 보병 합류</span></div></div><div class="showcase-cost"><strong>15</strong><span>포인트</span></div></div>
    <div class="showcase-content"><div class="showcase-section-label">기본 능력치 <span>UNIT PROFILE</span></div><div class="showcase-stats"><div><small>이동 · MOV</small><strong>4–3 <em>[10]</em></strong></div><div><small>체력 · W</small><strong>2</strong></div><div><small>의지 · WP</small><strong class="showcase-dice">${cardIcon('die-yellow','icon-die','원본을 참고한 노란 주사위 1')}${cardIcon('die-yellow','icon-die','원본을 참고한 노란 주사위 2')}</strong></div><div><small>사기 · MOR</small><strong>1</strong></div><div><small>편성 · AVB</small><strong>1</strong></div></div>
    <div class="showcase-section-label">전투 주사위 <span>COMBAT ICONS</span></div><div class="showcase-combat"><div>${cardIcon('bow','icon-combat','원본을 참고한 원거리 공격 기호')}<span class="combat-label">사거리 <b>12</b></span><span class="showcase-dice">${cardIcon('die-red','icon-die','원본을 참고한 빨간 주사위')}${cardIcon('die-yellow','icon-die','원본을 참고한 노란 주사위 1')}${cardIcon('die-yellow','icon-die','원본을 참고한 노란 주사위 2')}</span></div><div>${cardIcon('sword','icon-combat','원본을 참고한 근접 공격 기호')}<span class="combat-label">근접 공격</span><span class="showcase-dice">${cardIcon('die-orange','icon-die','원본을 참고한 주황 주사위 1')}${cardIcon('die-orange','icon-die','원본을 참고한 주황 주사위 2')}</span></div><div>${cardIcon('armor','icon-combat','원본을 참고한 방어 기호')}<span class="combat-label">방어</span><span class="showcase-dice">${cardIcon('die-green','icon-die','원본을 참고한 초록 주사위')}</span></div></div><div class="showcase-status"><span class="status-icons">${cardIcon('crit','icon-status','원본을 참고한 느낌표 기호 1')}${cardIcon('crit','icon-status','원본을 참고한 느낌표 기호 2')}</span><div><strong>공격 효과 · 둔화</strong><small>대상에게 둔화 상태를 부여합니다.</small></div></div>
    <div class="showcase-section-label">능력과 효과 <span>ABILITIES</span></div><div class="showcase-skills"><section class="showcase-skill">${cardIcon('heal','icon-skill','원본을 참고한 약초와 연고 기호')}<div><div class="skill-heading"><h3>약초와 연고</h3><span class="skill-chip">치유 · 12보폭</span></div><p class="skill-target">대상 · 12보폭 이내의 모든 아군 유닛</p><p>원하는 상태를 제거하고 피해 1을 회복합니다. 의지 판정에서 <b>성공 기호 ${cardIcon('crit','icon-inline','원본을 참고한 성공 기호')}</b> 하나마다 대상별로 피해 1을 추가 회복합니다.</p></div></section><section class="showcase-skill">${cardIcon('magic','icon-skill','원본을 참고한 환각 버섯 기호')}<div><div class="skill-heading"><h3>환각 버섯</h3><span class="skill-chip">지속 · 시야 불필요</span></div><p class="skill-target">대상 · 모든 아군 주문 시전자</p><p>마법 오염·주문 방어 판정에서 주사위를 원하는 만큼 다시 굴릴 수 있습니다. 두 판정에 아래 표시된 추가 기호를 적용합니다. ${cardIcon('spell','icon-inline','원본을 참고한 마법 기호')}${cardIcon('shield','icon-inline','원본을 참고한 방어 기호')}${cardIcon('crit','icon-inline','원본을 참고한 성공 기호')}</p></div></section><section class="showcase-skill">${cardIcon('magic','icon-skill','원본을 참고한 토템의 숨결 기호')}<div><div class="skill-heading"><h3>토템의 숨결</h3><span class="skill-chip">지속 · 시야 불필요</span></div><p class="skill-target">대상 · 모든 아군 바랑크 유닛</p><p>대상이 <b>주문 해제 ${cardIcon('die-blue','icon-inline','원본을 참고한 파란 주문 해제 주사위')}</b>를 얻습니다.</p></div></section><section class="showcase-skill">${cardIcon('magic','icon-skill','원본을 참고한 치유 문신 기호')}<div><div class="skill-heading"><h3>치유 문신</h3><span class="skill-chip">활성화당 1회</span></div><p class="skill-target">발동 · 피해를 받기 직전</p><p>의지 판정에 성공하면 피해 1을 무시할 수 있습니다.</p></div></section><section class="showcase-skill">${cardIcon('magic','icon-skill','원본을 참고한 고래 바늘 기호')}<div><div class="skill-heading"><h3>고래 바늘</h3><span class="skill-chip">상시</span></div><p><b>무장 해제 · 둔화 · 취약</b> 상태에 면역입니다.</p></div></section></div><div class="showcase-footer"><span>카드 도식화 예시</span><span>기호는 원본 카드 문양을 참고해 벡터로 다시 그렸습니다.</span></div></div></article>`;
}
function cardAbilityParagraphs(translated){
  const paragraphs=translated?.korean?.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean)||[];
  const first=paragraphs[0]?.split('\n')[0]||'';
  const looksLikeTraits=first.length<100&&first.includes(',')&&/캐릭터|보병|기병|드워프|엘프|오크|인간|바랑크|Character|Infantry|Cavalry/i.test(first)&&!/대상|Target|When/i.test(first);
  if(looksLikeTraits||/^\s*(?:MOV|MoU|W\s+WP|W\s+우리)/i.test(first))paragraphs.shift();
  return paragraphs.reduce((acc,part)=>{
    if(acc.length&&/^(?:당신은|대상은|아군은|적은|이 유닛은)/.test(part)&&part.split('\n')[0].length>35)acc[acc.length-1]+='\n'+part;
    else acc.push(part);
    return acc;
  },[]);
}
function visualAbility(paragraph,index){
  const lines=paragraph.split('\n').map(x=>x.trim()).filter(Boolean);
  const first=lines.shift()||'';
  const split=first.indexOf(' · ');
  const period=first.indexOf('. ');
  const candidate=split>0&&split<65?first.slice(0,split):period>0&&period<65?first.slice(0,period):first.length<45?first:`능력 ${index+1}`;
  const unreadable=/[A-Za-z]{2}|[§®°<>]/.test(candidate);
  const title=unreadable?`능력 ${index+1}`:candidate;
  const detail=split>0&&split<65?first.slice(split+3):period>0&&period<65?first.slice(period+2):first.length<45&&!unreadable?'':first;
  const body=[detail,...lines].filter(Boolean).join('\n').replace(/LoS가 없습니다/gi,'시야선 불필요').replace(/LoS/gi,'시야선');
  const kind=/치유|회복|약초|heal/i.test(paragraph)?'heal':'magic';
  return `<section class="showcase-skill">${cardIcon(kind,'icon-skill',`${title} 능력 기호`)}<div><div class="skill-heading"><h3>${escapeHtml(title)}</h3></div>${body?`<p>${escapeHtml(body)}</p>`:''}</div></section>`;
}
const flamecobsRows=[
  {range:'2+',ranged:['red','orange','yellow','yellow'],melee:['orange','yellow','black-star'],defense:['blue','black-shield']},
  {range:'1',ranged:['orange','orange','yellow'],melee:['orange'],defense:['black-shield']}
];
const flamecobsEnglish=`Infantry, Projectile, Red Cap

Inflict 1 damage to your target.

EXPLOSION. When a troop from your unit is about to be taken out of combat, all other units within 5 strides suffer 1 stress and 2 damage.

EMOTION: RAGE. Only if Nuada chooses the Rage emotion. You may inflict yourself 1 damage to add two black stars to your attack rolls (melee and ranged). You cannot inflict yourself the damage if this destroys the unit. This damage is not accounted for in the resolution of a combat.`;
function flamecobsCard(u){
  const dice=(items)=>items.map(color=>cardIcon(color.startsWith('black-')?color:`die-${color}`,'icon-die',`${color} 주사위 기호`)).join('');
  const combat=flamecobsRows.map((row,index)=>`<section class="auth-combat-row" aria-label="전투 방식 ${index+1}"><div class="auth-combat-bar"><span class="auth-range">${row.range}</span><span class="auth-bar-icon">${cardIcon('ranged-mark','icon-combat','원거리 공격 기호')}<b>8</b></span><span class="auth-bar-icon">${cardIcon('melee-mark','icon-combat','근접 공격 기호')}</span><span class="auth-bar-icon">${cardIcon('armor','icon-combat','방어 기호')}</span><span class="auth-stress">${cardIcon('stress-seal','icon-combat','스트레스 수치')}<b>0</b></span></div><div class="auth-combat-dice"><span></span><span>${dice(row.ranged)}</span><span>${dice(row.melee)}</span><span>${dice(row.defense)}</span><span></span></div><div class="auth-combat-effect">${cardIcon('crit','icon-status','공격 효과 기호 1')}${cardIcon('crit','icon-status','공격 효과 기호 2')}<span>대상에게 피해 ${cardIcon('damage','icon-inline','피해 기호')} 1을 입힙니다.</span></div></section>`).join('');
  const art=localCardUrl(u);
  return `<article class="showcase-card showcase-authentic showcase-flamecobs" aria-label="플레임콥스 한국어 카드"><header class="auth-profile"><div class="auth-ribbon"><strong>20</strong></div><div class="auth-portrait" role="img" aria-label="플레임콥스 인물 그림" style="background-image:url('${escapeHtml(art)}')"></div><div class="auth-profile-main"><div class="auth-titlebar"><h2>플레임콥스</h2><span>FLAMECOBS</span></div><div class="auth-stat-head"><span>MOV</span><span>W</span><span>WP</span><span>MOR</span><span>AVB</span></div><div class="auth-stat-values"><strong>3-2 [9]</strong><strong>2</strong><strong>${cardIcon('die-orange','icon-die','주황 의지 주사위')}</strong><strong>1</strong><strong>1</strong></div><p>보병 · 투사체 · 레드 캡</p></div></header><div class="auth-content"><div class="auth-heading">전투 <span>COMBAT</span></div><div class="auth-combat">${combat}</div><div class="auth-heading">능력 <span>ABILITIES</span></div><div class="auth-abilities"><section>${cardIcon('magic','icon-skill','폭발 능력 기호')}<div><h3>폭발</h3><p><em>이 유닛의 병력 하나가 전투에서 제거되기 직전.</em> 5보폭 이내의 다른 모든 유닛은 스트레스 1과 피해 ${cardIcon('damage','icon-inline','피해 기호')} 2를 받습니다.</p></div></section><section>${cardIcon('magic','icon-skill','감정 능력 기호')}<div><h3>감정: 격노</h3><p><em>누아다가 격노 감정을 선택한 경우에만.</em> 자신에게 피해 ${cardIcon('damage','icon-inline','피해 기호')} 1을 가해 근접·원거리 공격 굴림에 ${cardIcon('black-star','icon-inline','검은 별 기호')}${cardIcon('black-star','icon-inline','검은 별 기호')}를 추가할 수 있습니다. 이 피해로 유닛이 파괴된다면 사용할 수 없습니다. 이 피해는 전투 결과 계산에 포함되지 않습니다.</p></div></section></div><div class="auth-footer">영문 원본 카드의 수치·주사위·효과를 대조한 한글 카드</div></div></article>`;
}
const ribbonColors={'northern-tribes':'#988d78','feudom':'#1149a3','hegemony-of-embersig':'#b68b24','mounthaven':'#7a5a42','scions-of-yaldabaoth':'#b52123','syenann':'#37765c'};
function sourceDice(colors){
  return colors?.length?colors.map(color=>cardIcon(color.startsWith('black-')?color:`die-${color}`,'icon-die',`${color} 주사위 기호`)).join(''):'<span class="auth-unread">원본 대조</span>';
}
function sourceProfile(u,profile){
  const name=localizedName(u),art=localCardUrl(u);
  const portrait=art?`<div class="auth-portrait" role="img" aria-label="${escapeHtml(name)} 인물 그림" style="background-image:url('${escapeHtml(art)}')"></div>`:`<div class="auth-portrait auth-portrait-empty" aria-hidden="true">${escapeHtml(name.slice(0,1))}</div>`;
  const tags=[...(u.characteristics||[]).map(x=>terms[x]||x),...(u.keywords||[]).map(x=>ko(x.name))];
  const hasStats=profile&&[profile.mov,profile.w,profile.mor].some(value=>value!==null&&value!==undefined);
  const stats=hasStats?`<div class="auth-stat-head"><span>MOV</span><span>W</span><span>WP</span><span>MOR</span><span>AVB</span></div><div class="auth-stat-values"><strong>${escapeHtml(profile.mov||'—')}</strong><strong>${escapeHtml(profile.w??'—')}</strong><strong>${profile.wpDice?.length?sourceDice(profile.wpDice):'—'}</strong><strong>${escapeHtml(profile.mor??'—')}</strong><strong>${escapeHtml(u.availability)}</strong></div>`:'';
  return `<header class="auth-profile ${hasStats?'':'auth-profile-simple'}" style="--ribbon-color:${ribbonColors[u.faction]||'#988d78'}"><div class="auth-ribbon"><strong>${escapeHtml(u.pointsCost)}</strong></div>${portrait}<div class="auth-profile-main"><div class="auth-titlebar"><h2>${escapeHtml(name)}</h2></div>${stats}<p>${escapeHtml(tags.join(' · ')||u.name)}</p></div></header>`;
}
function sourceCombat(rows){
  return rows.map((row,index)=>`<section class="auth-combat-row" aria-label="전투 방식 ${index+1}"><div class="auth-combat-bar"><span class="${row.badge?'auth-range':'auth-range-empty'}">${row.badge?escapeHtml(row.badge):''}</span><span class="auth-bar-icon">${row.barFirst||`${row.first?.length?cardIcon('ranged-mark','icon-combat','첫 공격 방식 기호'):''}${row.distance?`<b>${escapeHtml(row.distance)}</b>`:''}`}</span><span class="auth-bar-icon">${row.second?.length?cardIcon('melee-mark','icon-combat','두 번째 공격 방식 기호'):''}</span><span class="auth-bar-icon">${row.barDefense||`${row.defense?.length?cardIcon('armor','icon-combat','방어 기호'):''}`}</span><span class="auth-stress">${cardIcon('stress-seal','icon-combat','스트레스 수치')}${row.stress!==null&&row.stress!==undefined?`<b>${escapeHtml(row.stress)}</b>`:'<b class="auth-stress-unknown">·</b>'}</span></div>${row.hideDice?'':`<div class="auth-combat-dice"><span></span><span>${row.first?.length?sourceDice(row.first):''}</span><span>${row.second?.length?sourceDice(row.second):''}</span><span>${row.defense?.length?sourceDice(row.defense):''}</span><span></span></div>`}${row.effect?`<div class="auth-combat-effect">${row.effect}</div>`:''}</section>`).join('');
}
function sourceAbility(paragraph,index,iconOverride){
  const lines=paragraph.split('\n').map(x=>x.trim()).filter(Boolean);
  const first=lines.shift()||'';
  const split=first.indexOf(' · '),period=first.indexOf('. ');
  const rawTitle=split>0&&split<65?first.slice(0,split):period>0&&period<65?first.slice(0,period):first.length<45?first:`능력 ${index+1}`;
  const unreadable=/[A-Za-z]{2}|[§®°<>]/.test(rawTitle);
  const title=unreadable?`능력 ${index+1}`:rawTitle;
  const detail=split>0&&split<65?first.slice(split+3):period>0&&period<65?first.slice(period+2):first.length<45&&!unreadable?'':first;
  const body=[detail,...lines].filter(Boolean).join('\n').replace(/LoS가 없습니다/gi,'시야선 불필요').replace(/LoS/gi,'시야선').replace(/당신은 두려움을 얻습니다/g,'공포 무시 특성을 얻습니다');
  const kind=iconOverride||(/치유|회복|약초|heal/i.test(paragraph)?'heal':'magic');
  return `<section>${cardIcon(kind,'icon-skill',`${title} 능력 기호`)}<div><h3>${escapeHtml(title)}</h3>${body?`<p>${escapeHtml(body)}</p>`:''}</div></section>`;
}
function sourceEnhancement(u,enhancement,rows,abilities){
  const name=localizedName(u),art=localCardUrl(u);
  const stats=enhancement.stats||[];
  const statHead=stats.length?`<div class="auth-enhancement-stat-head">${stats.map(stat=>`<span>${escapeHtml(stat.label)}</span>`).join('')}</div>`:'';
  const statValues=stats.length?`<div class="auth-enhancement-stat-values">${stats.map(stat=>`<span>${stat.dice?.length?`+${sourceDice(stat.dice)}`:stat.value?escapeHtml(stat.value):'—'}</span>`).join('')}</div>`:'';
  return `<section class="auth-enhancement" aria-label="${escapeHtml(name)} 강화 카드"><header class="auth-enhancement-profile"><div class="auth-enhancement-portrait" role="img" aria-label="${escapeHtml(name)} 인물 그림" style="background-image:url('${escapeHtml(art)}')"></div><div class="auth-enhancement-title">${escapeHtml(name)}</div>${statHead}${statValues}</header><div class="auth-enhancement-body">${rows.length?`<div class="auth-combat">${sourceCombat(rows)}</div>`:''}${abilities?`<div class="auth-abilities">${abilities}</div>`:''}</div></section>`;
}
function tattooistSourceCard(u){
  const effect=`${cardIcon('crit','icon-status','공격 효과 기호 1')}${cardIcon('crit','icon-status','공격 효과 기호 2')}<span>대상에게 둔화 상태를 부여합니다.</span>`;
  const combat=sourceCombat([{distance:12,first:['red','yellow','yellow'],second:['orange','orange'],defense:['green'],stress:0,effect}]);
  const front=[['약초와 연고','12보폭 이내 모든 아군 유닛을 대상으로, 원하는 상태를 제거하고 피해 1을 회복합니다. 의지 판정의 성공 기호 하나마다 대상별로 피해 1을 추가 회복합니다.','heal'],['환각 버섯','지속 · 시야 불필요 · 모든 아군 주문 시전자. 마법 오염·주문 방어 판정에서 주사위를 원하는 만큼 다시 굴릴 수 있습니다. 두 판정에 원본 카드에 표시된 추가 기호를 적용합니다.','magic'],['토템의 숨결','지속 · 시야 불필요 · 모든 아군 바랑크 유닛이 파란 주문 해제 주사위를 얻습니다.','magic']];
  const back=[['치유 문신','활성화당 1회, 피해를 받기 직전 의지 판정에 성공하면 피해 1을 무시할 수 있습니다.','magic'],['고래 바늘','무장 해제·둔화·취약 상태에 면역입니다.','magic']];
  const abilities=(items)=>items.map(([title,body,icon])=>`<section>${cardIcon(icon,'icon-skill',`${title} 능력 기호`)}<div><h3>${title}</h3><p>${body}</p></div></section>`).join('');
  const enhanced=sourceEnhancement(u,{stats:[{label:'MOR',value:'+1'}]},[{first:[],defense:[],stress:0,hideDice:true}],abilities(back));
  return `<article class="showcase-card showcase-authentic showcase-authentic-draft" aria-label="타투이스트 한국어 카드">${sourceProfile(u,{mov:'4-3[10]',w:2,wpDice:['yellow','yellow'],mor:1})}<div class="auth-content auth-front-content"><div class="auth-combat">${combat}</div><div class="auth-abilities">${abilities(front)}</div></div>${enhanced}<div class="auth-footer">영문 원본 카드의 수치·주사위·효과를 대조한 한글 카드</div></article>`;
}
function draftSourceCard(u,translated,profile){
  const name=localizedName(u);
  const asRows=(items)=>(items||[]).map(row=>({first:row.attacks?.[0]||[],second:row.attacks?.slice(1).flat()||[],defense:row.defense||[],stress:null}));
  let rows=asRows(profile?.combat),enhancement=profile?.enhancement,enhancementRows=asRows(enhancement?.combat).map(row=>row.first.length||row.second.length||row.defense.length?row:{...row,hideDice:true,barFirst:cardIcon('ranged-mark','icon-combat','공격 기호'),barDefense:cardIcon('armor','icon-combat','방어 기호')});
  const paragraphs=cardAbilityParagraphs(translated);
  const boxes=cardAbilities[u.cardKey]||[];
  const cutoff=enhancement?.top;
  const frontBoxes=cutoff?boxes.filter(box=>box.top<cutoff):boxes;
  const backBoxes=cutoff?boxes.filter(box=>box.top>=cutoff):[];
  if(u.cardKey==='wisemane'){
    const bolt=cardIcon('surge','icon-combat','원본의 번개 기호'),red=cardIcon('rune-red','icon-combat','빨간 기호');
    const attack=`${cardIcon('ranged-mark','icon-combat','원거리 공격 기호')}${bolt}<b>4+</b>${red}${cardIcon('white-crit','icon-combat','추가 효과 기호')}`;
    const defense=`${cardIcon('armor','icon-combat','방어 기호')}${bolt}<b>4+</b>${red}`;
    rows=[{first:['red','orange','orange','yellow'],defense:['blue','blue','black-shield'],stress:0,barFirst:attack,barDefense:defense,effect:`${cardIcon('crit','icon-status','취약 효과 기호')}${cardIcon('crit','icon-status','취약 효과 기호')}<span>대상에게 취약 상태를 부여합니다.</span>`}];
    enhancement={...enhancement,stats:[{label:'WP',dice:['yellow']},{label:'MOR',value:'+1'}]};
    enhancementRows=[{first:[],defense:[],stress:'+0',barFirst:attack,barDefense:defense,hideDice:true}];
  }
  const renderBoxes=(items,offset=0)=>items.map((box,i)=>sourceAbility(box.korean||box.english,i+offset,u.cardKey==='wisemane'&&i===0&&offset===0&&items===backBoxes?'experience':undefined)).join('');
  const missing=`<section>${cardIcon('magic','icon-skill','정보 기호')}<div><h3>${Object.hasOwn(cardAbilities,u.cardKey)?'인쇄된 능력 없음':'상세 능력 미확보'}</h3><p>${Object.hasOwn(cardAbilities,u.cardKey)?'원본 카드에 별도의 능력 상자가 없습니다.':'원본 카드 이미지가 제공되지 않아 편성 정보만 표시합니다.'}</p></div></section>`;
  const frontAbilities=frontBoxes.length?renderBoxes(frontBoxes):!cutoff?(boxes.length?'':Object.hasOwn(cardAbilities,u.cardKey)?missing:paragraphs.length?paragraphs.map(sourceAbility).join(''):missing):'';
  const backAbilities=backBoxes.length?renderBoxes(backBoxes,frontBoxes.length):'';
  const frontCombat=rows.length?`<div class="auth-combat">${sourceCombat(rows)}</div>`:!cutoff?'<p class="auth-empty">전투 수치가 없는 카드이거나 원본 판독이 필요합니다.</p>':'';
  return `<article class="showcase-card showcase-authentic showcase-authentic-draft ${u.cardKey==='wisemane'?'auth-wisemane':''}" aria-label="${escapeHtml(name)} 한국어 카드">${sourceProfile(u,profile)}<div class="auth-content auth-front-content">${frontCombat}${frontAbilities?`<div class="auth-abilities">${frontAbilities}</div>`:''}</div>${cutoff?sourceEnhancement(u,enhancement,enhancementRows,backAbilities):''}<div class="auth-footer">자동 변환 초안 · 주사위 기호와 문구는 아래 영문 원본에서 대조하세요.</div></article>`;
}
function exactAbilityParts(text,index){
  const lines=(text||'').split('\n').map(line=>line.trim()).filter(Boolean);
  const first=lines.shift()||'';
  const divider=first.indexOf(' · '),period=first.indexOf('. ');
  const position=divider>0&&divider<65?divider:period>0&&period<65?period:-1;
  const title=position>=0?first.slice(0,position):first.length<45?first:`능력 ${index+1}`;
  const beginning=position>=0?first.slice(position+(position===divider?3:2)):first.length<45?'':first;
  const body=[beginning,...lines].filter(Boolean).join(' ').replace(/LoS가 없습니다/gi,'시야선 불필요').replace(/LoS/gi,'시야선').replace(/당신은 두려움을 얻습니다/g,'공포 무시 특성을 얻습니다');
  return {title:/[A-Za-z]{2}|[§®°<>]/.test(title)?`능력 ${index+1}`:title,body};
}
function exactSourceCard(u){
  const name=localizedName(u),imageUrl=localCardUrl(u),boxes=cardAbilities[u.cardKey]||[],effects=cardEffects[u.cardKey]||[];
  const enhancement=cardProfiles[u.cardKey]?.enhancement;
  const percent=value=>`${(value*100).toFixed(3)}%`;
  const titleSize=Math.min(2.6,65/Math.max(name.length,10)).toFixed(2);
  const title=(top,lower=false)=>`<div class="exact-title ${lower?'exact-title-lower':''}" style="top:${percent(top)};font-size:${titleSize}cqw">${escapeHtml(name)}</div>`;
  const traits=[...(u.characteristics||[]).map(x=>terms[x]||x),...(u.keywords||[]).map(x=>ko(x.name))];
  const abilityOverlays=boxes.map((box,index)=>{
    const part=exactAbilityParts(box.korean||box.english,index);
    const y=box.top+.002,h=Math.max(.012,box.bottom-box.top-.004);
    return `<div class="exact-ability exact-fit" style="left:8%;top:${percent(y)};width:88.5%;height:${percent(h)}"><strong>${escapeHtml(part.title)}</strong>${part.body?` <span>${escapeHtml(part.body)}</span>`:''}</div>`;
  }).join('');
  const effectOverlays=effects.filter(effect=>effect.korean?.trim()).map(effect=>{
    const x=effect.left+.001,y=effect.top+.001,w=effect.right-effect.left-.002,h=effect.bottom-effect.top-.002;
    return `<div class="exact-effect exact-fit" style="left:${percent(x)};top:${percent(y)};width:${percent(w)};height:${percent(h)}">${escapeHtml(effect.korean||effect.english)}</div>`;
  }).join('');
  const readable=boxes.map((box,index)=>{const part=exactAbilityParts(box.korean||box.english,index);return `<section><h3>${escapeHtml(part.title)}</h3><p>${escapeHtml(part.body)}</p></section>`}).join('');
  const readableEffects=effects.filter(effect=>effect.korean?.trim()).map(effect=>`<section><h3>전투 효과</h3><p>${escapeHtml(effect.korean)}</p></section>`).join('');
  return `<article class="exact-card" aria-label="${escapeHtml(name)} 원본 배치 한국어 카드"><div class="exact-canvas"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)} 원본 카드 도식과 기호" loading="eager" />${title(.024)}${enhancement?title(enhancement.top+.002,true):''}<div class="exact-traits">${escapeHtml(traits.join(' · '))}</div>${abilityOverlays}${effectOverlays}</div><details class="exact-readable"><summary>한국어 능력과 전투 효과 크게 보기</summary>${readable}${readableEffects}${readable||readableEffects?'':'<p>원본 카드에 별도 능력 상자가 없습니다.</p>'}</details></article>`;
}
function fitExactText(){
  const canvas=$('#dialogShowcase .exact-canvas');
  if(!canvas)return;
  for(const element of canvas.querySelectorAll('.exact-fit')){
    const initial=parseFloat(getComputedStyle(element).fontSize);
    let size=initial;
    while(size>8&&(element.scrollHeight>element.clientHeight+1||element.scrollWidth>element.clientWidth+1)){
      size-=.5;element.style.fontSize=`${size}px`;
    }
    if(element.scrollHeight>element.clientHeight+1||element.scrollWidth>element.clientWidth+1)element.title=element.textContent;
  }
}
function visualCard(u,translated,profile){
  const name=localizedName(u),faction=factionNames[u.faction]?.[0]||u.faction;
  const tags=[...(u.characteristics||[]).map(x=>terms[x]||x),...(u.keywords||[]).map(x=>ko(x.name)),...(u.specialRules||[]).map(ko)];
  const artUrl=localCardUrl(u);
  const portrait=artUrl?`<div class="showcase-portrait visual-portrait" role="img" aria-label="${escapeHtml(name)} 원본 카드의 인물 그림" style="background-image:url('${escapeHtml(artUrl)}')"></div>`:`<div class="showcase-portrait visual-portrait portrait-fallback" aria-hidden="true">${escapeHtml(name.slice(0,1))}</div>`;
  const dice=(colors)=>colors?.length?colors.map(c=>cardIcon(`die-${c}`,'icon-die',`${c} 주사위`)).join(''):'<span class="stat-unknown">원본 확인</span>';
  const stats=[['이동 · MOV',profile?.mov||'—'],['체력 · W',profile?.w??'—'],['의지 · WP',`<span class="showcase-dice">${dice(profile?.wpDice)}</span>`],['사기 · MOR',profile?.mor??'—'],['편성 · AVB',u.availability]];
  const combat=profile?.combat?.length?profile.combat.map((row,i)=>`<div class="visual-combat-row"><span class="combat-number">${i+1}</span><div>${cardIcon('sword','icon-combat','공격 기호')}<span>공격 색상</span><span class="showcase-dice">${row.attacks?.length?row.attacks.map((group,j)=>`<span class="attack-dice-group" title="공격 주사위 묶음 ${j+1}">${dice(group)}</span>`).join(''):'<span class="stat-unknown">원본 확인</span>'}</span></div><div>${cardIcon('armor','icon-combat','방어 기호')}<span>방어 색상</span><span class="showcase-dice">${dice(row.defense)}</span></div></div>`).join(''):'<p class="visual-empty">전투 주사위 조합은 아래 원본 카드에서 확인하세요.</p>';
  const paragraphs=cardAbilityParagraphs(translated);
  const abilities=paragraphs.length?paragraphs.map(visualAbility).join(''):'<section class="showcase-skill">'+cardIcon('ability','icon-skill','정보 기호')+'<div><div class="skill-heading"><h3>상세 능력 미확보</h3></div><p>원본 카드 이미지가 제공되지 않아 편성 정보만 표시합니다.</p></div></section>';
  return `<article class="showcase-card showcase-generic" aria-label="${escapeHtml(name)} 한국어 카드"><div class="showcase-top">${portrait}<div class="showcase-identity"><span class="showcase-eyebrow">${escapeHtml(faction)} · 한국어 카드</span><h2>${escapeHtml(name)}</h2><span class="showcase-original">${escapeHtml(u.name)}</span><div class="showcase-badges">${tags.slice(0,5).map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div></div><div class="showcase-cost"><strong>${u.pointsCost}</strong><span>포인트</span></div></div><div class="showcase-content"><div class="showcase-section-label">기본 능력치 <span>UNIT PROFILE</span></div><div class="showcase-stats">${stats.map(([label,value])=>`<div><small>${label}</small><strong>${value}</strong></div>`).join('')}</div><div class="showcase-section-label">색상별 전투 주사위 <span>COMBAT DICE</span></div><div class="visual-combat">${combat}</div><div class="showcase-section-label">능력과 효과 <span>ABILITIES</span></div><div class="showcase-skills">${abilities}</div><div class="showcase-footer"><span>한국어 카드 초안</span><span>검은색·흰색 주사위와 규칙 기호, OCR 수치는 아래 원본에서 대조하세요.</span></div></div></article>`;
}
function openKoreanCard(u){
  const translated=translations.cards[u.cardKey];
  $('#cardDialog').classList.add('showcase-open');
  $('#dialogShowcase').hidden=false;
  $('#dialogGeneric').hidden=true;
  $('#dialogShowcase').innerHTML=localCardUrl(u)?exactSourceCard(u):draftSourceCard(u,translated,cardProfiles[u.cardKey]);
  $('#dialogTitle').textContent=localizedName(u);
  $('#dialogOriginalName').textContent=u.name;
  $('#dialogMeta').innerHTML=`<span>포인트<strong>${u.pointsCost}</strong></span><span>지휘 토큰<strong>${u.command||0}</strong></span><span>최대 편성 · AVB<strong>${u.availability}</strong></span>`;
  const traits=[...(u.characteristics||[]).map(x=>terms[x]||x),...(u.keywords||[]).map(x=>ko(x.name)),...(u.specialRules||[]).map(ko)];
  $('#dialogTags').innerHTML=traits.map(x=>`<span>${escapeHtml(x)}</span>`).join('');
  const paragraphs=translated?.korean?.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean)||[];
  $('#dialogAbilities').innerHTML=paragraphs.length?paragraphs.map(x=>`<div class="ability-block">${escapeHtml(x)}</div>`).join(''):'<div class="ability-block">원문 카드의 상세 능력 문구를 확보하지 못했습니다. 위의 편성 정보와 특성·규칙은 수집된 유닛 데이터를 바탕으로 표시했습니다.</div>';
  $('#dialogNote').textContent=translated?'이 번역은 카드 문자 인식을 바탕으로 만든 검토용 초안입니다. 수치, 주사위 기호, 상태 효과는 아래 원본 카드와 대조하세요.':'원본 사이트의 카드 이미지가 제공되지 않아 상세 문구는 아직 번역할 수 없습니다.';
  $('#dialogEnglish').textContent=u.cardKey==='flamecobs'?flamecobsEnglish:cardAbilities[u.cardKey]?.map(box=>box.english).join('\n\n')||translated?.english||'원본 카드 텍스트 미확보';
  const image=$('#dialogImage');
  if(localCardUrl(u)){image.hidden=false;image.src=localCardUrl(u);image.alt=`${u.name} 영문 원본 카드`}
  else{image.hidden=true;image.removeAttribute('src');image.alt=''}
  $('#cardDialog').showModal();
  const sourceImage=$('#dialogShowcase .exact-canvas img');
  if(sourceImage){if(sourceImage.complete)requestAnimationFrame(fitExactText);else sourceImage.addEventListener('load',fitExactText,{once:true})}
}
function render(){renderFactions();renderCatalog();renderArmy();$('#modeNote').textContent=state.mode==='wts'?'대회 규칙 적용 · 출전 불가 유닛 제외 · 용병 최대 1개':'기본 편성 규칙 적용 · 출전 불가와 용병 제한은 대회 모드에서 검사';}
function addUnit(id){const u=currentUnits().find(x=>x.id===id);if(!u)return;const reason=canAdd(u);if(reason)return toast(reason);state.quantities[id]=count(u)+1;render()}
function removeUnit(id){if(!state.quantities[id])return;state.quantities[id]--;if(!state.quantities[id])delete state.quantities[id];render()}
function getSaved(){try{return JSON.parse(localStorage.getItem(storageKey)||'[]')}catch{return []}}
function saveList(){if(!selectedUnits().length)return toast('유닛을 먼저 추가하세요.');const name=$('#listName').value.trim();if(!name)return toast('목록 이름을 입력하세요.');const saved=getSaved();saved.unshift({name,faction:state.faction,mode:state.mode,limit:state.limit,quantities:{...state.quantities},commander:state.commander,createdAt:new Date().toISOString()});localStorage.setItem(storageKey,JSON.stringify(saved.slice(0,30)));toast('이 브라우저에 목록을 저장했습니다.')}
function exportList(){if(!selectedUnits().length)return toast('내보낼 유닛이 없습니다.');const payload={format:'warcrow-ko-draft-v1',sourceVersion:data.version,name:$('#listName').value.trim()||'새 편성표',faction:state.faction,mode:state.mode,limit:state.limit,commander:state.commander,units:selectedUnits().map(u=>({id:u.id,name:u.name,quantity:count(u),pointsCost:u.pointsCost,command:u.command}))};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`warcrow-${state.faction}-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('JSON 파일을 내보냈습니다.')}
function showSaved(){const saved=getSaved();$('#savedList').innerHTML=saved.length?saved.map((item,i)=>`<div class="saved-entry"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(factionNames[item.faction]?.[0]||item.faction)} · ${item.mode==='wts'?'WTS 시즌 2':'일반전'} · ${new Date(item.createdAt).toLocaleDateString('ko-KR')}</small></div><button type="button" data-load="${i}">불러오기</button></div>`).join(''):'<div class="empty">저장한 목록이 없습니다.</div>';$('#loadDialog').showModal()}
function reset(){state.quantities={};state.commander='';$('#listName').value='';render();toast('새 편성표를 시작합니다.')}
document.addEventListener('click',(event)=>{
  const faction=event.target.closest('[data-faction]');if(faction){if(state.faction!==faction.dataset.faction){state.faction=faction.dataset.faction;state.quantities={};state.commander='';$('#listName').value='';render()}return}
  const add=event.target.closest('[data-add]');if(add){addUnit(add.dataset.add);return}
  const remove=event.target.closest('[data-remove]');if(remove){removeUnit(remove.dataset.remove);return}
  const card=event.target.closest('[data-card]');if(card){const u=currentUnits().find(x=>x.id===card.dataset.card);if(u)openKoreanCard(u);return}
  const load=event.target.closest('[data-load]');if(load){const item=getSaved()[Number(load.dataset.load)];if(!item)return;state.faction=item.faction;state.mode=item.mode;state.limit=item.limit;state.quantities=item.quantities||{};state.commander=item.commander||'';$('#listName').value=item.name;$('#pointsLimit').value=item.limit;document.querySelector(`input[name="mode"][value="${item.mode}"]`).checked=true;$('#loadDialog').close();render();toast('저장 목록을 불러왔습니다.')}
});
document.querySelectorAll('input[name="mode"]').forEach(input=>input.addEventListener('change',()=>{state.mode=input.value;render()}));
$('#pointsLimit').addEventListener('change',e=>{state.limit=Math.max(50,Math.min(1000,Number(e.target.value)||250));e.target.value=state.limit;render()});
$('#searchInput').addEventListener('input',e=>{state.query=e.target.value;renderCatalog()});
$('#sortSelect').addEventListener('change',e=>{state.sort=e.target.value;renderCatalog()});
$('#typeFilter').addEventListener('change',e=>{state.type=e.target.value;renderCatalog()});
$('#availableOnly').addEventListener('change',e=>{state.availableOnly=e.target.checked;renderCatalog()});
$('#commanderSelect').addEventListener('change',e=>{state.commander=e.target.value;renderValidation()});
$('#saveButton').addEventListener('click',saveList);$('#exportButton').addEventListener('click',exportList);
$('#loadButton').addEventListener('click',showSaved);$('#resetButton').addEventListener('click',reset);
Promise.all(['./app-data.json','./card-ko.json','./card-profiles.json','./card-abilities.json','./card-effects.json'].map(url=>fetch(`${url}?v=10`).then(response=>{if(!response.ok)throw Error(`${url} 요청 실패`);return response.json()}))).then(([units,translated,profiles,abilities,effects])=>{data=units;translations=translated;cardProfiles=profiles;cardAbilities=abilities;cardEffects=effects;$('#sourceVersion').textContent=`유닛 자료 v${data.version} · 한국어 카드 초안`;render()}).catch(()=>{toast('유닛 자료를 불러오지 못했습니다.');$('#unitList').innerHTML='<div class="empty">자료를 불러올 수 없습니다. 페이지를 새로고침하세요.</div>'});
