const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const factionNames = {
  'northern-tribes':['노던 트라이브스','N'], 'feudom':['퓨덤','F'],
  'hegemony-of-embersig':['헤게모니 오브 엠버시그','H'], 'mounthaven':['마운트헤이븐','M'],
  'scions-of-yaldabaoth':['사이언즈 오브 얄다바오트','S'], 'syenann':['시예난','S']
};
const terms = {
  'Character':'캐릭터','Infantry':'보병','Cavalry':'기병','Companion':'동반자',
  'High Command':'최고 지휘부','High Commander':'최고 지휘관','Mercenary':'용병',
  'Human':'인간','Orc':'오크','Dwarf':'드워프','Elf':'엘프','Knight':'기사',
  'Noble':'귀족','Varank':'바랑크','Red Cap':'레드 캡','Colossal Company':'콜로설 컴퍼니',
  'Projectile':'투사체','Construct':'구조체','Beast':'야수','Spirit':'영혼',
  'Scout':'정찰','Ambusher':'매복','Fearless':'공포 무시','Elite':'정예',
  'Raging':'격노','Bloodlust':'피의 갈증','Spellcaster':'주문 시전자',
  'Join':'합류','Preferred Terrain':'선호 지형','Intimidating':'위압',
  'Large':'대형','Dispel':'주문 해제','Golem':'골렘','Immovable':'이동 불가',
  'Aim':'조준','Manned':'탑승','Tinge':'팅지','Cover':'엄폐',
  'Slowed':'둔화','Vulnerable':'취약','Disarmed':'무장 해제',
  'Frightened':'공포','Shove':'밀어내기','Attract':'끌어당기기',
  'Place':'배치','Displace':'강제 이동','Fix a Die':'주사위 고정',
  'Beserker Rage':'광전사의 분노','Berserker Rage':'광전사의 분노',
  'Aestari':'에스타리','Alven':'알벤','Ashen':'애셴','Centaur':'켄타우로스',
  'Darkminded':'다크마인디드','Dead Flesh':'죽은 육신','Ghent':'겐트',
  'Living Flesh':'살아 있는 육신','Nemorous':'네모러스','Nemourous':'네모러스',
  'Priestess':'여사제','Risen':'라이즌','Shadow':'그림자','Syenann':'시예난','Virtuoso':'비르투오소',
  'Cancel a symbol':'기호 취소','Immune to State':'상태 면역','Impassable':'통과 불가',
  'Displaced':'강제 이동','Placed':'배치','Vunerable':'취약','dismared':'무장 해제',
  'Sinister':'불길한 지형','BLK':'검정','BLU':'파랑','GRN':'초록',
  'Repeat a Die':'주사위 다시 굴리기','Repeat Die':'주사위 다시 굴리기',
  'Flee':'도주','Heal':'치유','Rugged':'험지','Forest':'숲','or':'또는','Trap':'함정'
};
let termDictionary,termPattern,termNames;
function ko(value){
  const raw=String(value||'');
  if(/<span\b/.test(raw))return raw.startsWith('Dispel')?'주문 해제 (카드 기호 참조)':raw.replace(/<[^>]*>/g,'');
  if(termNames!==translations.names){
    termNames=translations.names;
    termDictionary=new Map(Object.entries({...translations.names,...terms}).map(([key,text])=>[key.toLowerCase(),text]));
    const phrases=[...termDictionary.keys()].sort((a,b)=>b.length-a.length).map(text=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
    termPattern=new RegExp(`\\b(?:${phrases.join('|')})\\b`,'gi');
  }
  return raw.replace(termPattern,part=>termDictionary.get(part.toLowerCase()));
}
let data={units:[],factions:[],wtsFogIds:[],version:''};
let translations={names:{},cards:{}};
let cardProfiles={};
let cardAbilities={};
let cardEffects={};
let modelImages={};
const languageStorageKey='warcrow-builder-language-v1';
let language=['ko','en','bi'].includes(localStorage.getItem(languageStorageKey))?localStorage.getItem(languageStorageKey):'ko';
let openCardId='';
let openCardUnit=null;
function ui(koText,enText){return language==='en'?enText:language==='bi'?`${koText} / ${enText}`:koText}
function unitName(u){return language==='en'?u.name:language==='bi'?`${localizedName(u)} / ${u.name}`:localizedName(u)}
function traitName(value){const translated=terms[value]||ko(value);return ui(translated,value)}
function localizedName(u){return translations.names[u.name]||u.name}
function factionDisplay(id){const english=data.factions.find(f=>f.id===id)?.name||id;return ui(factionNames[id]?.[0]||english,english)}
function localCardUrl(u){return translations.cards[u.cardKey]?`./card-art/${encodeURIComponent(u.cardKey)}_card_en.webp`:''}
function modelPhoto(u,small=false){
  const model=modelImages[u.id];
  if(!model)return `<div class="unit-model-missing${small?' unit-model-missing-small':''}" role="img" aria-label="${escapeHtml(unitName(u))} NO IMAGE">NO IMAGE</div>`;
  return `<button type="button" class="unit-model-thumb${small?' unit-model-thumb-small':''}" data-model="${escapeHtml(u.id)}" aria-label="${escapeHtml(unitName(u))} ${ui('유닛 이미지 보기','View unit image')}"><img src="${escapeHtml(model.image)}" alt="" loading="lazy"></button>`;
}
function openModel(u){
  const model=modelImages[u.id];if(!model)return;
  $('#modelDialogTitle').textContent=unitName(u);
  const illustration=model.kind==='portrait';
  const kind=illustration?ui('공식 유닛 일러스트','Official unit illustration'):model.kind==='pack'?ui('여러 유닛이 포함된 공식 패키지 사진','Official pack photo with multiple units'):ui('모델 사진','Miniature photo');
  const img=$('#modelDialogImage');img.src=model.image;img.alt=`${unitName(u)} · ${kind}`;
  $('#modelDialog .section-kicker').textContent=illustration?'UNIT ILLUSTRATION':'MINIATURE GALLERY';
  $('#modelDialogKind').textContent=kind;
  $('#modelDialogProduct').textContent=ui('제품명(원문): ','Source product: ')+model.productName;
  $('#modelDialogSource').href=model.productUrl;
  $('#modelDialogSource').textContent=illustration?ui('공식 이미지 출처 보기 ↗','View official image source ↗'):ui('모델 사진 출처 보기 ↗','View miniature photo source ↗');
  $('#modelDialog').showModal();
}
const state={faction:'northern-tribes',mode:'wts',limit:250,quantities:{},commander:'',query:'',sort:'points',type:'all',availableOnly:false,listName:''};
const storageKey='warcrow-ko-draft-lists-v1';
const gameStorageKey='warcrow-ko-game-sessions-v1',activeGameStorageKey='warcrow-ko-active-game-v1';
function loadGameSessions(){try{const value=JSON.parse(localStorage.getItem(gameStorageKey)||'[]');return Array.isArray(value)?value.filter(game=>game&&Array.isArray(game.units)&&Array.isArray(game.instances)):[]}catch{return []}}
let gameSessions=loadGameSessions();
let activeGameId=localStorage.getItem(activeGameStorageKey)||'';
let screen=gameSessions.some(game=>game.id===activeGameId)?'game':'builder';
function activeGame(){return gameSessions.find(game=>game.id===activeGameId)}
function persistGames(){localStorage.setItem(gameStorageKey,JSON.stringify(gameSessions));localStorage.setItem(activeGameStorageKey,activeGameId)}
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
  if(isBlocked(u))return ui('WTS 시즌 2 출전 불가','Not eligible for WTS Season 2');
  if(count(u)>=u.availability)return ui('AVB 상한 도달','Availability limit reached');
  if(totalPoints()+u.pointsCost>state.limit)return ui('점수 상한 초과','Points limit exceeded');
  if(u.highCommand&&selectedUnits().some(x=>x.highCommand&&x.id!==u.id))return ui('최고 지휘부는 1명까지','Only one High Command unit allowed');
  if(state.mode==='wts'&&u.characteristics?.includes('Mercenary')&&mercenaries()>=1)return ui('용병은 1개까지','Only one mercenary allowed');
  return '';
}
function unitType(u){if(u.characteristics?.includes('Companion')||u.type==='Companion')return 'Companion';if(u.characteristics?.includes('Character')||u.type?.includes('Character'))return 'Character';return 'Troop'}
function renderFactions(){
  const factionScroll=$('#factionGrid').scrollLeft;
  $('#factionGrid').innerHTML=data.factions.map(f=>{
    const [name,symbol]=factionNames[f.id]||[f.name,f.name[0]];
    return `<button type="button" class="faction-button ${state.faction===f.id?'active':''}" data-faction="${escapeHtml(f.id)}" aria-pressed="${state.faction===f.id}"><img class="faction-portrait" src="./faction-art/${escapeHtml(f.id)}.webp" alt="" /><span class="faction-copy"><span class="faction-ko">${escapeHtml(name)}</span><span class="faction-en">${escapeHtml(f.name)}</span></span><span class="faction-tick" aria-hidden="true">✓</span></button>`;
  }).join('');
  $('#factionGrid').scrollLeft=factionScroll;
  $('#currentFactionName').textContent=factionDisplay(state.faction);
}
function renderCatalog(){
  const query=state.query.toLocaleLowerCase().trim();
  let units=currentUnits().filter(u=>{
    if(state.type!=='all'&&unitType(u)!==state.type)return false;
    if(state.availableOnly&&canAdd(u))return false;
    if(!query)return true;
    return [u.name,localizedName(u),u.name_es,...(u.characteristics||[]),...(u.characteristics||[]).map(traitName),...(u.keywords||[]).map(k=>`${k.name} ${traitName(k.name)}`),...(u.specialRules||[]).map(x=>`${x} ${traitName(x)}`),...(cardAbilities[u.cardKey]||[]).map(b=>b.titleKo||'')].some(x=>String(x).toLocaleLowerCase().includes(query));
  });
  units.sort((a,b)=>state.sort==='name'?(language==='en'?a.name.localeCompare(b.name):localizedName(a).localeCompare(localizedName(b),'ko')):state.sort==='points-desc'?b.pointsCost-a.pointsCost||a.name.localeCompare(b.name):a.pointsCost-b.pointsCost||a.name.localeCompare(b.name));
  $('#unitCount').textContent=ui(`${units.length}개`,`${units.length}`);
  const factionUnits=currentUnits(),matched=factionUnits.filter(u=>modelImages[u.id]).length;
  $('#modelCoverage').textContent=ui('이미지를 누르면 모델을, 이름을 누르면 능력을 볼 수 있습니다.','Tap an image to view the model, or a name to read its abilities.');
  $('#unitList').innerHTML=units.length?units.map(u=>{
    const blocked=isBlocked(u),reason=canAdd(u),traits=(u.characteristics||[]).filter(x=>!['Character','Infantry','High Command','High Commander'].includes(x)).slice(0,2);
    const category=unitType(u)==='Character'?ui('캐릭터','Character'):unitType(u)==='Companion'?ui('동반자','Companion'):ui('일반 유닛','Troop');
    return `<article class="unit-card ${count(u)?'is-selected':''}" data-rule-unit="${escapeHtml(u.id)}"><div class="unit-art ${modelImages[u.id]?.kind==='portrait'?'is-illustration':''}">${modelPhoto(u)}<button type="button" class="unit-cost" data-rule="points" aria-label="편성 점수 ${u.pointsCost} 설명">${u.pointsCost}<small>PT</small></button>${count(u)?`<span class="unit-chosen" aria-label="${ui('선택됨','Selected')}">✓ ${count(u)}</span>`:''}<span class="image-kind">${modelImages[u.id]?.kind==='portrait'?ui('공식 일러스트','Illustration'):ui('미니어처','Miniature')}</span></div><div class="unit-main"><button type="button" class="unit-name" data-card="${escapeHtml(u.id)}"><span class="unit-name-ko">${escapeHtml(localizedName(u))}</span><span class="unit-name-en">${escapeHtml(u.name)}</span></button><div class="unit-category">${ruleText(category)}${u.highCommand?` · ${ruleTerm('high-command',ui('최고 지휘부','High Command'))}`:''}</div><div class="tags">${traits.map(t=>`<span class="tag">${ruleKeyword(t)}</span>`).join('')}${blocked?`<span class="tag warning">${ui('WTS 제외','WTS ineligible')}</span>`:''}</div><div class="unit-bottom"><button class="unit-card-link" data-card="${escapeHtml(u.id)}">${ui('능력 보기','Abilities')} ↗</button><div class="stepper"><button type="button" data-remove="${escapeHtml(u.id)}" aria-label="${escapeHtml(unitName(u))} ${ui('제거','remove')}" ${count(u)?'':'disabled'}>−</button><b>${count(u)}</b><button type="button" data-add="${escapeHtml(u.id)}" aria-label="${escapeHtml(unitName(u))} ${ui('추가','add')}" title="${escapeHtml(reason||ui('추가','Add'))}" ${reason?'disabled':''}>+</button></div></div><p class="unit-restriction">${escapeHtml(reason||ui(`최대 ${u.availability}개 편성`,`Up to ${u.availability} units`))}</p></div></article>`;
  }).join(''):`<div class="empty"><strong>${ui('검색 결과가 없습니다.','No units found.')}</strong><p>${ui('다른 이름을 검색하거나 필터를 바꿔 보세요.','Try another name or change the filters.')}</p><button type="button" class="button button-ghost" data-clear-filters>${ui('검색·필터 초기화','Clear filters')}</button></div>`;

}
function renderCommander(){
  const candidates=selectedUnits().filter(u=>unitType(u)==='Character');
  const high=candidates.find(u=>u.highCommand);
  if(high)state.commander=high.id;
  if(state.commander&&!candidates.some(u=>u.id===state.commander))state.commander='';
  $('#commanderSelect').innerHTML=`<option value="">${ui('지휘관 선택','Select commander')}</option>`+candidates.map(u=>`<option value="${escapeHtml(u.id)}" ${u.id===state.commander?'selected':''}>${escapeHtml(unitName(u))}${u.highCommand?` · ${ui('최고 지휘부','High Command')}`:''}</option>`).join('');
  $('#commanderSelect').disabled=!!high;
}
function renderValidation(){
  const selected=selectedUnits(),issues=[];
  if(!selected.length)issues.push(ui('원하는 유닛을 추가해 부대를 구성하세요.','Add a unit to begin army validation.'));
  else{
    if(!state.commander)issues.push(ui('지휘관을 지정해야 합니다.','Choose a commander.'));
    else if(!selected.find(u=>u.id===state.commander)?.highCommand)issues.push(ui('선택한 캐릭터가 장교인지 공식 카드에서 확인하세요.','Check the selected commander’s Officer type on the official card.'));
    if(totalPoints()>state.limit)issues.push(ui(`점수 상한을 ${totalPoints()-state.limit}점 초과했습니다.`,`Points limit exceeded by ${totalPoints()-state.limit}.`));
    if(state.mode==='wts'&&selected.some(isBlocked))issues.push(ui('WTS 시즌 2 출전 불가 유닛이 포함되어 있습니다.','The army includes a unit ineligible for WTS Season 2.'));
    if(state.mode==='wts'&&mercenaries()>1)issues.push(ui('WTS에서는 용병이 최대 1개입니다.','WTS allows at most one mercenary.'));
    if(selected.filter(u=>u.highCommand).length>1)issues.push(ui('High Command는 최대 1명입니다.','Only one High Command unit is allowed.'));
  }
  $('#validation').innerHTML=issues.length?issues.map(x=>`<p class="warn">${escapeHtml(x)}</p>`).join(''):`<p class="good">${ui('기본 편성 조건을 충족했습니다. 최신 프로필은 공식 자료에서 확인하세요.','Current army conditions are met. Check Officer types and current profiles against official sources.')}</p>`;
}
function renderArmy(){
  const units=selectedUnits(),points=totalPoints(),number=units.reduce((sum,u)=>sum+count(u),0);
  $('#armyCount').textContent=ui(`${number}개 유닛`,`${number} units`);
  $('#scoreValue').innerHTML=`${points} <small>/ ${state.limit} ${ui('점','pts')}</small>`;
  $('#scoreMeter').style.width=`${Math.min(100,points/state.limit*100)}%`;
  $('#scoreRemaining').textContent=points<=state.limit?ui(`${state.limit-points}점 남음`,`${state.limit-points} points remaining`):ui(`${points-state.limit}점 초과`,`${points-state.limit} points over`);
  $('#commandValue').textContent=totalCommand();
  $('#mercenaryValue').textContent=`${mercenaries()} / ${state.mode==='wts'?'1':'—'}`;
  renderCommander();renderValidation();
  $('#selectedList').innerHTML=units.length?units.map(u=>`<div class="selected-entry" data-rule-unit="${escapeHtml(u.id)}"><span class="number">${count(u)}×</span>${modelPhoto(u,true)}<div class="summary"><strong>${escapeHtml(unitName(u))}</strong><small>${u.pointsCost*count(u)} ${ui('점','pts')} · ${ruleTerm('command-token','COM')} ${(u.command||0)*count(u)}${data.wtsFogIds.includes(u.id)&&state.mode==='wts'?` · ${ui('출전 불가','ineligible')}`:''}</small></div><button type="button" data-remove="${escapeHtml(u.id)}" aria-label="${escapeHtml(unitName(u))} ${ui('제거','remove')}">−</button></div>`).join(''):`<div class="empty">${ui('아직 추가한 유닛이 없습니다.','No units added yet.')}<br />${ui('왼쪽 목록에서 부대를 구성하세요.','Build your army from the catalog.')}</div>`;
  $('#dockCount').textContent=ui(`${number} 유닛`,`${number} units`);
  $('#dockPoints').textContent=ui(`${points} / ${state.limit}점`,`${points} / ${state.limit} pts`);
  $('[data-play-now]').disabled=!number;
  $('#confirmRosterButton').disabled=!number;
  $('#rulesSummary').textContent=`${state.mode==='wts'?'WTS':ui('일반전','Standard')} · ${state.limit}${ui('점',' pts')}`;

}
function confirmRoster(){
  const units=selectedUnits().map(u=>({...JSON.parse(JSON.stringify(u)),quantity:count(u)}));
  if(!units.length)return toast(ui('플레이할 유닛을 먼저 골라 주세요.','Add a unit first.'));
  const game={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,name:$('#listName').value.trim()||ui('내 유닛 카드','My unit cards'),faction:state.faction,confirmedAt:new Date().toISOString(),units,instances:[],cardIndex:0};
  setArmyDrawer(false);gameSessions.unshift(game);activeGameId=game.id;persistGames();screen='game';render();window.scrollTo(0,0);
}
function movePlayCard(delta){
  const game=activeGame();if(!game?.units.length)return;
  game.cardIndex=((Number(game.cardIndex)||0)+delta+game.units.length)%game.units.length;
  persistGames();renderGame();
  $('#gameView .play-navigation')?.scrollIntoView({block:'start',behavior:'instant'});
}
function renderGame(){
  const game=activeGame(),view=$('#gameView');
  $('.hero').hidden=screen==='game';$('.setup-panel').hidden=screen==='game';$('.builder-grid').hidden=screen==='game';view.hidden=screen!=='game';
  $('#resumeGameButton').hidden=!game?.units.length;
  $('#mobileDock').hidden=screen==='game';
  if(screen!=='game'||!game?.units.length){view.innerHTML='';return}
  const index=Math.max(0,Math.min(game.units.length-1,Number(game.cardIndex)||0));game.cardIndex=index;
  const unit=game.units[index];
  const card=localCardUrl(unit)?exactSourceCard(unit):language==='en'?englishFallbackCard(unit,cardProfiles[unit.cardKey]):draftSourceCard(unit,translations.cards[unit.cardKey],cardProfiles[unit.cardKey]);
  view.innerHTML=`<div class="game-heading"><div><span class="section-kicker">${ui('플레이 모드 · 유닛 카드','Play mode · Unit cards')}</span><h2>${escapeHtml(game.name)}</h2><p>${ui('좌우로 넘겨 선택한 유닛의 카드를 확인하세요.','Swipe left or right to browse your selected unit cards.')}</p></div><button type="button" class="button button-ghost" data-game-action="builder">${ui('편성으로 돌아가기','Back to builder')}</button></div><nav class="play-navigation" aria-label="${ui('유닛 카드 이동','Unit card navigation')}"><button type="button" data-play-step="-1" aria-label="${ui('이전 유닛 카드','Previous unit card')}" ${game.units.length===1?'disabled':''}>‹</button><div><label class="sr-only" for="playUnitSelect">${ui('유닛 선택','Select unit')}</label><select id="playUnitSelect">${game.units.map((u,i)=>`<option value="${i}" ${i===index?'selected':''}>${escapeHtml(unitName(u))}${u.quantity>1?` ×${u.quantity}`:''}</option>`).join('')}</select><span aria-live="polite">${index+1} / ${game.units.length}</span></div><button type="button" data-play-step="1" aria-label="${ui('다음 유닛 카드','Next unit card')}" ${game.units.length===1?'disabled':''}>›</button></nav><div id="playCardStage" class="play-card-stage" data-rule-unit="${escapeHtml(unit.id)}" aria-label="${escapeHtml(unitName(unit))}">${card}</div>`;

}
function cardIcon(name,kind,label){
  return `<svg class="card-icon ${kind}" viewBox="0 0 40 40" role="img" aria-label="${escapeHtml(label)}"><use href="./icons.svg?v=9#${name}" /></svg>`;
}
function tattooistShowcase(){
  return `<article class="showcase-card" aria-label="타투이스트 한국어 카드 예시">
    <div class="showcase-top"><div class="showcase-portrait" role="img" aria-label="타투이스트 인물 그림"></div><div class="showcase-identity"><span class="showcase-eyebrow">북방 부족 · 캐릭터 / 바랑크</span><h2>타투이스트</h2><span class="showcase-original">TATTOOIST</span><div class="showcase-badges"><span>정찰</span><span>바랑크 보병 합류</span></div></div><div class="showcase-cost"><strong>15</strong><span>포인트</span></div></div>
    <div class="showcase-content"><div class="showcase-section-label">기본 능력치 <span>UNIT PROFILE</span></div><div class="showcase-stats"><div><small>이동 · MOV</small><strong>4–3 <em>[10]</em></strong></div><div><small>체력 · W</small><strong>2</strong></div><div><small>의지 · WP</small><strong class="showcase-dice">${cardIcon('die-yellow','icon-die','원본을 참고한 노란 주사위 1')}${cardIcon('die-yellow','icon-die','원본을 참고한 노란 주사위 2')}</strong></div><div><small>사기 · MOR</small><strong>1</strong></div><div><small>편성 · AVB</small><strong>1</strong></div></div>
    <div class="showcase-section-label">전투 주사위 <span>COMBAT ICONS</span></div><div class="showcase-combat"><div>${cardIcon('bow','icon-combat','원본을 참고한 원거리 공격 기호')}<span class="combat-label">사거리 <b>12</b></span><span class="showcase-dice">${cardIcon('die-red','icon-die','원본을 참고한 빨간 주사위')}${cardIcon('die-yellow','icon-die','원본을 참고한 노란 주사위 1')}${cardIcon('die-yellow','icon-die','원본을 참고한 노란 주사위 2')}</span></div><div>${cardIcon('sword','icon-combat','원본을 참고한 근접 공격 기호')}<span class="combat-label">근접 공격</span><span class="showcase-dice">${cardIcon('die-orange','icon-die','원본을 참고한 주황 주사위 1')}${cardIcon('die-orange','icon-die','원본을 참고한 주황 주사위 2')}</span></div><div>${cardIcon('armor','icon-combat','원본을 참고한 방어 기호')}<span class="combat-label">방어</span><span class="showcase-dice">${cardIcon('die-green','icon-die','원본을 참고한 초록 주사위')}</span></div></div><div class="showcase-status"><span class="status-icons">${cardIcon('crit','icon-status','원본을 참고한 느낌표 기호 1')}${cardIcon('crit','icon-status','원본을 참고한 느낌표 기호 2')}</span><div><strong>공격 효과 · 둔화</strong><small>대상에게 둔화 상태를 부여합니다.</small></div></div>
    <div class="showcase-section-label">능력과 효과 <span>ABILITIES</span></div><div class="showcase-skills"><section class="showcase-skill">${cardIcon('heal','icon-skill','원본을 참고한 약초와 연고 기호')}<div><div class="skill-heading"><h3>약초와 연고</h3><span class="skill-chip">치유 · 12보폭</span></div><p class="skill-target">대상 · 12보폭 이내의 모든 아군 유닛</p><p>원하는 상태를 제거하고 피해 1을 회복합니다. 의지 판정에서 <b>성공 기호 ${cardIcon('crit','icon-inline','원본을 참고한 성공 기호')}</b> 하나마다 대상별로 피해 1을 추가 회복합니다.</p></div></section><section class="showcase-skill">${cardIcon('magic','icon-skill','원본을 참고한 환각 버섯 기호')}<div><div class="skill-heading"><h3>환각 버섯</h3><span class="skill-chip">지속 · 시야 불필요</span></div><p class="skill-target">대상 · 모든 아군 주문 시전자</p><p>팅지·주문 방어 판정에서 주사위를 원하는 만큼 다시 굴릴 수 있습니다. 두 판정에 아래 표시된 추가 기호를 적용합니다. ${cardIcon('spell','icon-inline','원본을 참고한 마법 기호')}${cardIcon('shield','icon-inline','원본을 참고한 방어 기호')}${cardIcon('crit','icon-inline','원본을 참고한 성공 기호')}</p></div></section><section class="showcase-skill">${cardIcon('magic','icon-skill','원본을 참고한 토템의 숨결 기호')}<div><div class="skill-heading"><h3>토템의 숨결</h3><span class="skill-chip">지속 · 시야 불필요</span></div><p class="skill-target">대상 · 모든 아군 바랑크 유닛</p><p>대상이 <b>주문 해제 ${cardIcon('die-blue','icon-inline','원본을 참고한 파란 주문 해제 주사위')}</b>를 얻습니다.</p></div></section><section class="showcase-skill">${cardIcon('magic','icon-skill','원본을 참고한 치유 문신 기호')}<div><div class="skill-heading"><h3>치유 문신</h3><span class="skill-chip">활성화당 1회</span></div><p class="skill-target">발동 · 피해를 받기 직전</p><p>의지 판정에 성공하면 피해 1을 무시할 수 있습니다.</p></div></section><section class="showcase-skill">${cardIcon('magic','icon-skill','원본을 참고한 고래 바늘 기호')}<div><div class="skill-heading"><h3>고래 바늘</h3><span class="skill-chip">상시</span></div><p><b>무장 해제 · 둔화 · 취약</b> 상태에 면역입니다.</p></div></section></div><div class="showcase-footer"><span>카드 도식화 예시</span><span>기호는 원본 카드 문양을 참고해 벡터로 다시 그렸습니다.</span></div></div></article>`;
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
  return `<article class="showcase-card showcase-authentic showcase-flamecobs" aria-label="플레임콥스 한국어 카드"><header class="auth-profile"><div class="auth-ribbon"><strong>20</strong></div><div class="auth-portrait" role="img" aria-label="플레임콥스 인물 그림" style="background-image:url('${escapeHtml(art)}')"></div><div class="auth-profile-main"><div class="auth-titlebar"><h2>플레임콥스</h2><span>FLAMECOBS</span></div><div class="auth-stat-head"><button type="button" data-rule="movement">MOV</button><button type="button" data-rule="wounds">W</button><button type="button" data-rule="wp">WP</button><button type="button" data-rule="mor">MOR</button><button type="button" data-rule="availability">AVB</button></div><div class="auth-stat-values"><strong>3-2 [9]</strong><strong>2</strong><strong>${cardIcon('die-orange','icon-die','주황 의지 주사위')}</strong><strong>1</strong><strong>1</strong></div><p>보병 · 투사체 · 레드 캡</p></div></header><div class="auth-content"><div class="auth-heading">전투 <span>COMBAT</span></div><div class="auth-combat">${combat}</div><div class="auth-heading">능력 <span>ABILITIES</span></div><div class="auth-abilities"><section>${cardIcon('magic','icon-skill','폭발 능력 기호')}<div><h3>폭발</h3><p><em>이 유닛의 병력 하나가 전투에서 제거되기 직전.</em> 5보폭 이내의 다른 모든 유닛은 스트레스 1과 피해 ${cardIcon('damage','icon-inline','피해 기호')} 2를 받습니다.</p></div></section><section>${cardIcon('magic','icon-skill','감정 능력 기호')}<div><h3>감정: 격노</h3><p><em>누아다가 격노 감정을 선택한 경우에만.</em> 자신에게 피해 ${cardIcon('damage','icon-inline','피해 기호')} 1을 가해 근접·원거리 공격 굴림에 ${cardIcon('black-star','icon-inline','검은 별 기호')}${cardIcon('black-star','icon-inline','검은 별 기호')}를 추가할 수 있습니다. 이 피해로 유닛이 파괴된다면 사용할 수 없습니다. 이 피해는 전투 결과 계산에 포함되지 않습니다.</p></div></section></div><div class="auth-footer">영문 원본 카드의 수치·주사위·효과를 대조한 한글 카드</div></div></article>`;
}
const ribbonColors={'northern-tribes':'#988d78','feudom':'#1149a3','hegemony-of-embersig':'#b68b24','mounthaven':'#7a5a42','scions-of-yaldabaoth':'#b52123','syenann':'#37765c'};
function sourceDice(colors){
  return colors?.length?colors.map(color=>cardIcon(color.startsWith('black-')?color:`die-${color}`,'icon-die',`${color} 주사위 기호`)).join(''):'<span class="auth-unread">원본 대조</span>';
}
function sourceProfile(u,profile){
  const name=unitName(u),art=localCardUrl(u);
  const portrait=art?`<div class="auth-portrait" role="img" aria-label="${escapeHtml(name)} 인물 그림" style="background-image:url('${escapeHtml(art)}')"></div>`:`<div class="auth-portrait auth-portrait-empty" aria-hidden="true">${escapeHtml(name.slice(0,1))}</div>`;
  const tags=[...(u.characteristics||[]).map(traitName),...(u.keywords||[]).map(x=>traitName(x.name))];
  const hasStats=profile&&[profile.mov,profile.w,profile.mor].some(value=>value!==null&&value!==undefined);
  const stats=hasStats?`<div class="auth-stat-head"><button type="button" data-rule="movement">MOV</button><button type="button" data-rule="wounds">W</button><button type="button" data-rule="wp">WP</button><button type="button" data-rule="mor">MOR</button><button type="button" data-rule="availability">AVB</button></div><div class="auth-stat-values"><strong>${escapeHtml(profile.mov||'—')}</strong><strong>${escapeHtml(profile.w??'—')}</strong><strong>${profile.wpDice?.length?sourceDice(profile.wpDice):'—'}</strong><strong>${escapeHtml(profile.mor??'—')}</strong><strong>${escapeHtml(u.availability)}</strong></div>`:'';
  return `<header class="auth-profile ${hasStats?'':'auth-profile-simple'}" style="--ribbon-color:${ribbonColors[u.faction]||'#988d78'}"><div class="auth-ribbon"><strong>${escapeHtml(u.pointsCost)}</strong></div>${portrait}<div class="auth-profile-main"><div class="auth-titlebar"><h2>${escapeHtml(name)}</h2></div>${stats}<p>${ruleText(tags.join(' · ')||u.name)}</p></div></header>`;
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
  return `<section>${cardIcon(kind,'icon-skill',`${title} 능력 기호`)}<div><h3>${escapeHtml(title)}</h3>${body?`<p>${ruleText(body)}</p>`:''}</div></section>`;
}
function sourceEnhancement(u,enhancement,rows,abilities){
  const name=unitName(u),art=localCardUrl(u);
  const stats=enhancement.stats||[];
  const statHead=stats.length?`<div class="auth-enhancement-stat-head">${stats.map(stat=>`<span>${escapeHtml(stat.label)}</span>`).join('')}</div>`:'';
  const statValues=stats.length?`<div class="auth-enhancement-stat-values">${stats.map(stat=>`<span>${stat.dice?.length?`+${sourceDice(stat.dice)}`:stat.value?escapeHtml(stat.value):'—'}</span>`).join('')}</div>`:'';
  return `<section class="auth-enhancement" aria-label="${escapeHtml(name)} 강화 카드"><header class="auth-enhancement-profile"><div class="auth-enhancement-portrait" role="img" aria-label="${escapeHtml(name)} 인물 그림" style="background-image:url('${escapeHtml(art)}')"></div><div class="auth-enhancement-title">${escapeHtml(name)}</div>${statHead}${statValues}</header><div class="auth-enhancement-body">${rows.length?`<div class="auth-combat">${sourceCombat(rows)}</div>`:''}${abilities?`<div class="auth-abilities">${abilities}</div>`:''}</div></section>`;
}
function tattooistSourceCard(u){
  const effect=`${cardIcon('crit','icon-status','공격 효과 기호 1')}${cardIcon('crit','icon-status','공격 효과 기호 2')}<span>대상에게 둔화 상태를 부여합니다.</span>`;
  const combat=sourceCombat([{distance:12,first:['red','yellow','yellow'],second:['orange','orange'],defense:['green'],stress:0,effect}]);
  const front=[['약초와 연고','12보폭 이내 모든 아군 유닛을 대상으로, 원하는 상태를 제거하고 피해 1을 회복합니다. 의지 판정의 성공 기호 하나마다 대상별로 피해 1을 추가 회복합니다.','heal'],['환각 버섯','지속 · 시야 불필요 · 모든 아군 주문 시전자. 팅지·주문 방어 판정에서 주사위를 원하는 만큼 다시 굴릴 수 있습니다. 두 판정에 원본 카드에 표시된 추가 기호를 적용합니다.','magic'],['토템의 숨결','지속 · 시야 불필요 · 모든 아군 바랑크 유닛이 파란 주문 해제 주사위를 얻습니다.','magic']];
  const back=[['치유 문신','활성화당 1회, 피해를 받기 직전 의지 판정에 성공하면 피해 1을 무시할 수 있습니다.','magic'],['고래 바늘','무장 해제·둔화·취약 상태에 면역입니다.','magic']];
  const abilities=(items)=>items.map(([title,body,icon])=>`<section>${cardIcon(icon,'icon-skill',`${title} 능력 기호`)}<div><h3>${title}</h3><p>${body}</p></div></section>`).join('');
  const enhanced=sourceEnhancement(u,{stats:[{label:'MOR',value:'+1'}]},[{first:[],defense:[],stress:0,hideDice:true}],abilities(back));
  return `<article class="showcase-card showcase-authentic showcase-authentic-draft" aria-label="타투이스트 한국어 카드">${sourceProfile(u,{mov:'4-3[10]',w:2,wpDice:['yellow','yellow'],mor:1})}<div class="auth-content auth-front-content"><div class="auth-combat">${combat}</div><div class="auth-abilities">${abilities(front)}</div></div>${enhanced}<div class="auth-footer">영문 원본 카드의 수치·주사위·효과를 대조한 한글 카드</div></article>`;
}
function draftSourceCard(u,translated,profile){
  const name=unitName(u);
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
  const missing=`<section>${cardIcon('magic','icon-skill',ui('정보 기호','Information icon'))}<div><h3>${Object.hasOwn(cardAbilities,u.cardKey)?ui('인쇄된 능력 없음','No printed abilities'):ui('상세 능력 미확보','Ability details unavailable')}</h3><p>${Object.hasOwn(cardAbilities,u.cardKey)?ui('원본 카드에 별도의 능력 상자가 없습니다.','The source card has no separate ability box.'):ui('원본 카드 이미지가 제공되지 않아 편성 정보만 표시합니다.','The source card image is unavailable; only army data is shown.')}</p></div></section>`;
  const frontAbilities=frontBoxes.length?renderBoxes(frontBoxes):!cutoff?(boxes.length?'':Object.hasOwn(cardAbilities,u.cardKey)?missing:paragraphs.length?paragraphs.map(sourceAbility).join(''):missing):'';
  const backAbilities=backBoxes.length?renderBoxes(backBoxes,frontBoxes.length):'';
  const frontCombat=rows.length?`<div class="auth-combat">${sourceCombat(rows)}</div>`:!cutoff?`<p class="auth-empty">${ui('전투 수치가 없는 카드이거나 원본 판독이 필요합니다.','Combat data is unavailable or requires checking against the source.')}</p>`:'';
  return `<article class="showcase-card showcase-authentic showcase-authentic-draft ${u.cardKey==='wisemane'?'auth-wisemane':''}" aria-label="${escapeHtml(name)} ${ui('한국어 카드','card')}">${sourceProfile(u,profile)}<div class="auth-content auth-front-content">${frontCombat}${frontAbilities?`<div class="auth-abilities">${frontAbilities}</div>`:''}</div>${cutoff?sourceEnhancement(u,enhancement,enhancementRows,backAbilities):''}<div class="auth-footer">${ui('자동 변환 초안 · 주사위 기호와 문구는 아래 영문 원본에서 대조하세요.','Draft data · Check dice symbols and wording against the official source.')}</div></article>`;
}
function englishFallbackCard(u,profile){
  return `<article class="showcase-card showcase-authentic showcase-authentic-draft" aria-label="${escapeHtml(u.name)} card">${sourceProfile(u,profile)}<div class="auth-content auth-front-content"><p class="auth-empty">The official builder does not provide a full card image or ability text for this unit.</p></div><div class="auth-footer">Army data is shown from the official builder.</div></article>`;
}
function exactAbilityParts(text,index=0){
  const lines=String(text??'').trim().split(/\r?\n/);
  const first=(lines.shift()||'').trim();
  let title=first,beginning='';
  // Quoted ability names may contain sentence punctuation and spaces.
  const lead=first.match(/^(?:[»›>]+\s*)?([“"「『])/u);
  const closing={'“':'”','"':'"','「':'」','『':'』'};
  const quoteEnd=lead?first.indexOf(closing[lead[1]],lead[0].length):-1;
  if(quoteEnd>=0){
    title=first.slice(0,quoteEnd+1).trim();
    beginning=first.slice(quoteEnd+1).replace(/^[.!?。！？]?\s*/, '');
  }else{
    // Use the earliest separator, including ! names, with no length threshold.
    const separator=/[.!?。！？](?=\s|$)|\s+·\s+/u.exec(first);
    if(separator){title=first.slice(0,separator.index).trim();beginning=first.slice(separator.index+separator[0].length).trim();}
  }
  const body=[beginning,...lines].join('\n').trim();
  return {title:title||'능력',body};
}
function exactSourceCard(u){
  const name=localizedName(u),imageUrl=localCardUrl(u),boxes=cardAbilities[u.cardKey]||[],effects=(cardEffects[u.cardKey]||[]).filter(e=>e.korean?.trim());
  const profile=cardProfiles[u.cardKey]||{},[width,height]=profile.imageSize||[943,1418],ratio=width/height;
  if(language==='en')return `<article class="exact-card" data-rule-unit="${escapeHtml(u.id)}">${cardRulesTools()}<div class="original-card-canvas"><img class="source-original" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(u.name)} original card" />${cardStatButtons(profile)}</div></article>`;
  const percent=value=>`${(value*100).toFixed(4)}%`;
  const effectLocation=box=>{
    const enhanced=profile.enhancement&&box.top>=profile.enhancement.top;
    const rows=(enhanced?profile.enhancement.combat:profile.combat)||[];
    const row=rows.filter(row=>row.top<=box.top).at(-1);
    const attacks=Math.max(1,row?.attacks?.length||0),crop=box.triggerCrop;
    const x=crop?(crop[0]+crop[2])/2:box.left;
    const column=Math.max(0,Math.min(attacks,Math.floor((x-.035)/(.94/(attacks+1)))));
    const label=column===attacks?'방어':attacks===1?'공격':`공격 ${column+1}`;
    return `${enhanced?'강화 · ':''}${label} 효과`;
  };
  const fragment=(crop,kind,label)=>{
    const [left,top,right,bottom]=crop,cw=Math.max(.001,right-left),ch=Math.max(.001,bottom-top),aspect=cw*width/(ch*height);
    return `<button type="button" class="source-fragment ${kind}" style="aspect-ratio:${aspect};width:${kind==='flow-badge'?32:Math.max(28,Math.min(90,32*aspect))}px" data-rule="${kind==='flow-badge'?'skills':'switches'}" aria-haspopup="dialog" aria-label="${escapeHtml(label)} 설명"><img src="${escapeHtml(imageUrl)}" alt="" style="width:${100/cw}%;transform:translate(${percent(-left)},${percent(-top)})" /></button>`;
  };
  const slice=(start,end)=>{
    if(end-start<.002)return '';
    const span=end-start;
    const title=(top,lower=false)=>top>=start&&top<end?`<div class="exact-title ${lower?'exact-title-lower':''}" style="top:${percent((top-start)/span)};height:${percent((lower ? .0235 : .035)/span)};font-size:${Math.min(lower?2:2.6,65/Math.max(name.length,10))}cqw">${escapeHtml(name)}</div>`:'';
    const traits=start<=.1365&&end>=.1875?`<div class="exact-traits" style="top:${percent((.1365-start)/span)};height:${percent(.051/span)}">${[...(u.characteristics||[]),...(u.keywords||[]).map(x=>x.name)].map(ruleKeyword).join(' · ')}</div>`:'';
    return `<div class="source-slice" style="aspect-ratio:${width}/${height*span}"><img src="${escapeHtml(imageUrl)}" alt="" style="transform:translateY(${percent(-start)})" />${title(.024)}${profile.enhancement?title(profile.enhancement.top+.002,true):''}${traits}${cardStatButtons(profile,start,end)}</div>`;
  };
  const records=[...boxes.map((box,index)=>{
    const crop=[.026,Math.max(0,box.top+.001),.081,Math.min(1,box.top+.001+.055*ratio)];
    return {kind:'ability',box,index,crop,start:Math.max(0,box.top-.005),end:Math.min(1,Math.max(box.bottom+.005,crop[3]))};
  }),...effects.map((box,index)=>({kind:'effect',box,index,crop:box.triggerCrop||[Math.max(.018,box.left-.13),box.top-.004,box.left-.005,box.bottom+.004],start:Math.max(0,Math.min(box.top-.004,box.triggerCrop?.[1]??box.top-.008)),end:Math.min(1,Math.max(box.bottom+.004,box.triggerCrop?.[3]??box.bottom+.008))}))].sort((a,b)=>a.start-b.start||(a.box.left||0)-(b.box.left||0));
  const groups=[];
  for(const record of records){const last=groups.at(-1);if(last&&record.start<=last.end+.002){last.end=Math.max(last.end,record.end);last.items.push(record)}else groups.push({start:record.start,end:record.end,items:[record]})}
  const rule=record=>{
    const {box,index,kind,crop}=record;
    if(kind==='ability'){
      const parsed=exactAbilityParts(box.korean,index);const part={title:box.titleKo||parsed.title,body:box.rulesKo??parsed.body};
      return `<section class="flow-rule flow-ability" data-ability-index="${index}">${fragment(crop,'flow-badge','능력 종류 문양')}<div><h3>${escapeHtml(part.title)}</h3>${part.body?`<p>${ruleText(part.body)}</p>`:''}${language==='bi'?`<p class="flow-english" lang="en">${ruleText(box.english)}</p>`:''}</div></section>`;
    }
    return `<section class="flow-rule flow-effect" data-effect-index="${index}">${fragment(crop,'flow-trigger','이 효과의 발동 기호')}<div><span class="flow-effect-kind">${effectLocation(box)}</span><p>${ruleText(box.korean)}</p>${language==='bi'?`<p class="flow-english" lang="en">${ruleText(box.english)}</p>`:''}</div></section>`;
  };
  let cursor=0,content='';
  for(const group of groups){content+=slice(cursor,group.start);if(cursor===0)content+=cardKeywordButtons(u);content+=`<div class="flow-rule-group">${group.items.sort((a,b)=>a.box.top-b.box.top||(a.box.left||0)-(b.box.left||0)).map(rule).join('')}</div>`;cursor=group.end}
  if(groups.length){content+=slice(cursor,Math.min(.965,cursor+.012));content+=slice(Math.max(cursor,.965),1)}else content=slice(0,1)+cardKeywordButtons(u);
  return `<article class="exact-card flow-card" data-rule-unit="${escapeHtml(u.id)}" aria-label="${escapeHtml(name)} 한국어 카드">${cardRulesTools()}${content}</article>`;
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
  const changed=openCardId!==u.id;
  openCardId=u.id;
  openCardUnit=u;
  const translated=translations.cards[u.cardKey];
  $('#cardDialog').classList.add('showcase-open');
  $('#cardDialog').classList.toggle('english-original',language==='en'&&Boolean(localCardUrl(u)));
  $('#dialogShowcase').dataset.ruleUnit=u.id;
  $('#dialogShowcase').hidden=false;
  $('#dialogGeneric').hidden=true;
  $('#dialogShowcase').innerHTML=localCardUrl(u)?exactSourceCard(u):language==='en'?englishFallbackCard(u,cardProfiles[u.cardKey]):draftSourceCard(u,translated,cardProfiles[u.cardKey]);
  $('#dialogTitle').textContent=unitName(u);
  $('#dialogOriginalName').textContent=u.name;
  $('#dialogMeta').innerHTML=`<span>${ui('포인트','Points')}<strong>${u.pointsCost}</strong></span><span>${ui('지휘 토큰','Command tokens')}<strong>${u.command||0}</strong></span><span>${ui('최대 편성','Availability')} · AVB<strong>${u.availability}</strong></span>`;
  const traits=[...(u.characteristics||[]).map(traitName),...(u.keywords||[]).map(x=>traitName(x.name)),...(u.specialRules||[]).map(traitName)];
  $('#dialogTags').innerHTML=traits.map(x=>`<span>${escapeHtml(x)}</span>`).join('');
  const paragraphs=translated?.korean?.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean)||[];
  $('#dialogAbilities').innerHTML=paragraphs.length?paragraphs.map(x=>`<div class="ability-block">${escapeHtml(x)}</div>`).join(''):'<div class="ability-block">원문 카드의 상세 능력 문구를 확보하지 못했습니다. 위의 편성 정보와 특성·규칙은 수집된 유닛 데이터를 바탕으로 표시했습니다.</div>';
  $('#dialogNote').textContent=translated?ui('이 번역은 카드 문자 인식을 바탕으로 만든 검토용 초안입니다. 수치, 주사위 기호, 상태 효과는 아래 원본 카드와 대조하세요.','This translation is an OCR draft. Check values, dice symbols, and effects against the original card.'):ui('원본 사이트의 카드 이미지가 제공되지 않아 상세 문구는 아직 번역할 수 없습니다.','The official builder does not provide this full card image or ability text.');
  $('#dialogEnglish').textContent=u.cardKey==='flamecobs'?flamecobsEnglish:cardAbilities[u.cardKey]?.map(box=>box.english).join('\n\n')||translated?.english||ui('원본 카드 텍스트 미확보','Original card text unavailable');
  const image=$('#dialogImage');
  if(localCardUrl(u)){image.hidden=false;image.src=localCardUrl(u);image.alt=`${u.name} ${ui('영문 원본 카드','original English card')}`}
  else{image.hidden=true;image.removeAttribute('src');image.alt=''}
  if(!$('#cardDialog').open)$('#cardDialog').showModal();
  if(changed)$('#cardDialog').scrollTop=0;

}
function applyStaticLanguage(){
  document.documentElement.lang=language==='en'?'en':'ko';
  document.body.dataset.language=language;
  document.querySelectorAll('button[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));
  document.title=ui('워크로우 아미 빌더','Warcrow Army Builder');
  const leaf=(selector,koText,enText)=>{const element=$(selector);if(element)element.textContent=ui(koText,enText)};
  const lead=(selector,koText,enText)=>{const element=$(selector);if(element?.firstChild?.nodeType===Node.TEXT_NODE)element.firstChild.textContent=ui(koText,enText)};
  $('.brand small').innerHTML=language==='en'?'Army Builder <span>Draft</span>':language==='bi'?'한국어 Army Builder <span>초안 / Draft</span>':'한국어 아미 빌더';
  $('#pageTitle').textContent=ui('나의 부대, 나의 전장.','Your company. Your battlefield.');
  leaf('.top-actions>a','공식 자료 ↗','Official resources ↗');
  leaf('.hero-copy','진영을 고르고, 마음에 드는 유닛을 모으세요.','Choose a faction and bring your company together.');
  leaf('.setup-heading .section-kicker','FACTIONS','FACTIONS');leaf('.setup-heading h2','진영 선택','Choose a faction');leaf('.draft-tag','검토용 초안','Review draft');
  leaf('.mode-control legend','게임 방식','Game mode');leaf('input[name="mode"][value="standard"]+span','일반전','Standard');leaf('input[name="mode"][value="wts"]+span','WTS 시즌 2','WTS Season 2');
  lead('.points-control','점수 상한','Points limit');leaf('.points-control b','점','pts');
  leaf('.faction-heading .section-kicker','02 / 소속 선택','02 / Faction');leaf('.faction-heading>span:last-child','진영을 선택하세요','Choose a faction');
  leaf('.catalog .section-kicker','RECRUIT YOUR COMPANY','RECRUIT YOUR COMPANY');lead('#catalogTitle','유닛 목록 ','Unit catalog ');
  $('#searchInput').setAttribute('aria-label',ui('유닛·능력·규칙 검색','Search units, abilities, rules'));
  $('#searchInput').placeholder=ui('유닛·능력·규칙 검색','Search units, abilities, rules');
  for(const [selector,koText,enText] of [['#sortSelect option[value="points"]','낮은 점수순','Lowest points'],['#sortSelect option[value="points-desc"]','높은 점수순','Highest points'],['#sortSelect option[value="name"]','이름순','Name'],['#typeFilter option[value="all"]','모든 종류','All types'],['#typeFilter option[value="Character"]','캐릭터','Characters'],['#typeFilter option[value="Troop"]','일반 유닛','Troops'],['#typeFilter option[value="Companion"]','동반자','Companions']])leaf(selector,koText,enText);
  leaf('.check-filter span','추가 가능한 유닛만','Available units only');
  leaf('.army .section-kicker','YOUR COMPANY','YOUR COMPANY');leaf('#armyTitle','편성표','Army list');leaf('.score-card>div:first-child>span','총 편성 점수','Total points');
  lead('.command-strip>span:first-child','지휘 토큰 ','Command tokens ');lead('.command-strip>span:last-child','용병 ','Mercenaries ');
  lead('.commander-select','지휘관 ','Commander ');leaf('.commander-select>span','장교 캐릭터에서 선택','Choose an Officer character');
  lead('.list-name','목록 이름','List name');$('#listName').placeholder=ui('내 부대의 이름','Name your company');
  leaf('#saveButton','목록 저장','Save list');leaf('#exportButton','JSON 내보내기','Export JSON');leaf('#loadButton','저장 목록 불러오기','Load saved list');leaf('#resetButton','새 목록','New list');
  leaf('#confirmRosterButton','플레이 시작','Start playing');leaf('#resumeGameButton','플레이 모드로 돌아가기','Return to play mode');
  leaf('.roster-confirm-note','선택한 유닛의 카드를 좌우로 넘겨 봅니다.','Browse the selected unit cards left and right.');
  leaf('.guide-strip>span','게임 가이드','Game guide');leaf('.guide-strip a[href="./rules.html"]','공식 룰북 정리','Rule guide');leaf('.guide-strip a[href="./quick-sheet.html"]','퀵시트','Quick sheet');leaf('.guide-strip a[href="./tutorial.html"]','입문 튜토리얼','Tutorial');
  leaf('.hero-load','저장한 편성 ↗','Saved armies ↗');leaf('.dock-roster>span','내 편성','My army');leaf('.dock-play','플레이 시작 →','Start playing →');
  $('#gameView').setAttribute('aria-label',ui('플레이 모드 유닛 카드','Play mode unit cards'));
  leaf('.data-note','최신 프로필과 세부 판정은 공식 코르부스피어에서 확인하세요. 원본 카드가 없는 4종은 확보된 정보만 제공합니다.','Korean card text is a review draft. The official builder does not provide full card images for four units. Check Officer/Support types and current profiles against CorvuSphere.');
  leaf('footer>span:first-child','비공식 한국어 빌더 초안','Unofficial Warcrow builder draft');
  leaf('#loadDialog h2','저장한 목록','Saved lists');leaf('.card-source summary','영문 원문과 카드 이미지 대조','Original English text and card image');
  $('.card-dialog .dialog-close').setAttribute('aria-label',ui('닫기','Close'));$('.load-dialog .dialog-close').setAttribute('aria-label',ui('닫기','Close'));
  $('#sourceVersion').textContent=data.units.length?ui(`유닛 자료 v${data.version} · 한국어 카드 초안`,`Unit data v${data.version} · Card draft`):ui('자료 불러오는 중','Loading data');
}
function render(){applyStaticLanguage();renderFactions();renderCatalog();renderArmy();renderGame();$('#modeNote').textContent=state.mode==='wts'?ui('대회 규칙 적용 · 출전 불가 유닛 제외 · 용병 최대 1개','Tournament rules · Ineligible units excluded · Up to 1 mercenary'):ui('기본 편성 규칙 적용 · 출전 불가와 용병 제한은 대회 모드에서 검사','Standard army rules · Tournament eligibility and mercenary limits apply in WTS mode');}
function restoreUnitFocus(id,action,inArmy){const scope=inArmy?$('#armyPanel'):$('#unitList');const button=scope.querySelector(`[data-${action}="${CSS.escape(id)}"]:not([disabled])`)||scope.querySelector(`[data-${action==='add'?'remove':'add'}="${CSS.escape(id)}"]:not([disabled])`)||(inArmy?$('#listName'):null);button?.focus({preventScroll:true})}
function addUnit(id){const inArmy=Boolean(document.activeElement?.closest('#armyPanel'));const u=currentUnits().find(x=>x.id===id);if(!u)return;const reason=canAdd(u);if(reason)return toast(reason);state.quantities[id]=count(u)+1;render();restoreUnitFocus(id,'add',inArmy)}
function removeUnit(id){const inArmy=Boolean(document.activeElement?.closest('#armyPanel'));if(!state.quantities[id])return;state.quantities[id]--;if(!state.quantities[id])delete state.quantities[id];render();restoreUnitFocus(id,'remove',inArmy)}
function getSaved(){try{return JSON.parse(localStorage.getItem(storageKey)||'[]')}catch{return []}}
function saveList(){if(!selectedUnits().length)return toast(ui('플레이할 유닛을 먼저 골라 주세요.','Add a unit first.'));const name=$('#listName').value.trim();if(!name)return toast(ui('목록 이름을 입력하세요.','Enter a list name.'));const saved=getSaved();saved.unshift({name,faction:state.faction,mode:state.mode,limit:state.limit,quantities:{...state.quantities},commander:state.commander,createdAt:new Date().toISOString()});localStorage.setItem(storageKey,JSON.stringify(saved.slice(0,30)));toast(ui('이 브라우저에 목록을 저장했습니다.','List saved in this browser.'))}
function exportList(){if(!selectedUnits().length)return toast(ui('내보낼 유닛이 없습니다.','There are no units to export.'));const payload={format:'warcrow-ko-draft-v1',sourceVersion:data.version,name:$('#listName').value.trim()||ui('새 편성표','New army list'),faction:state.faction,mode:state.mode,limit:state.limit,commander:state.commander,units:selectedUnits().map(u=>({id:u.id,name:u.name,quantity:count(u),pointsCost:u.pointsCost,command:u.command}))};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`warcrow-${state.faction}-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(ui('JSON 파일을 내보냈습니다.','JSON file exported.'))}
function showSaved(){const saved=getSaved();$('#savedList').innerHTML=saved.length?saved.map((item,i)=>`<div class="saved-entry"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(factionDisplay(item.faction))} · ${item.mode==='wts'?'WTS Season 2':ui('일반전','Standard')} · ${new Date(item.createdAt).toLocaleDateString(language==='en'?'en-US':'ko-KR')}</small></div><button type="button" data-load="${i}">${ui('불러오기','Load')}</button></div>`).join(''):`<div class="empty">${ui('저장한 목록이 없습니다.','No saved lists.')}</div>`;$('#loadDialog').showModal()}
let drawerReturnFocus=null;
function setArmyDrawer(open){
  const army=$('#armyPanel');
  document.body.classList.toggle('roster-open',Boolean(open));
  $('#rosterBackdrop').hidden=!open;
  if(open){drawerReturnFocus=document.activeElement;army.setAttribute('role','dialog');army.setAttribute('aria-modal','true');(()=>{const focusDrawer=()=>{if(document.body.classList.contains('roster-open')&&!document.querySelector('dialog[open]')&&!army.contains(document.activeElement))$('#armyPanel [data-close-army]').focus({preventScroll:true})};army.getBoundingClientRect();requestAnimationFrame(()=>requestAnimationFrame(focusDrawer));setTimeout(focusDrawer,240)})()}
  else{army.removeAttribute('role');army.removeAttribute('aria-modal');drawerReturnFocus?.focus?.()}
}
window.addEventListener('resize',()=>{if(innerWidth>900&&document.body.classList.contains('roster-open'))setArmyDrawer(false)});
document.addEventListener('keydown',event=>{
  if(!document.body.classList.contains('roster-open')||document.querySelector('dialog[open]'))return;
  if(event.key==='Escape'){event.preventDefault();setArmyDrawer(false);return}
  if(event.key==='Tab'){
    const focusable=[...$('#armyPanel').querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]')].filter(x=>!x.hidden&&x.getClientRects().length);
    const first=focusable[0],last=focusable.at(-1);
    if(!$('#armyPanel').contains(document.activeElement)){event.preventDefault();first?.focus();return}
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
  }
});
function reset(){state.quantities={};state.commander='';$('#listName').value='';render();toast(ui('새 편성표를 시작합니다.','New army list started.'))}
document.addEventListener('click',(event)=>{
  if(event.target.closest('[data-open-army]')){setArmyDrawer(true);return}
  if(event.target.closest('[data-close-army]')){setArmyDrawer(false);return}
  if(event.target.closest('[data-play-now]')){confirmRoster();return}
  if(event.target.closest('[data-action="load"]')){showSaved();return}
  if(event.target.closest('[data-clear-filters]')){state.query='';state.type='all';state.availableOnly=false;$('#searchInput').value='';$('#typeFilter').value='all';$('#availableOnly').checked=false;renderCatalog();return}
  const languageButton=event.target.closest('button[data-language]');if(languageButton){language=languageButton.dataset.language;localStorage.setItem(languageStorageKey,language);render();if($('#cardDialog').open&&openCardUnit)openKoreanCard(openCardUnit);return}
  const playStep=event.target.closest('[data-play-step]');if(playStep){movePlayCard(Number(playStep.dataset.playStep));return}
  const gameAction=event.target.closest('[data-game-action]');if(gameAction){screen='builder';render();window.scrollTo(0,0);return}
  const faction=event.target.closest('[data-faction]');if(faction){if(state.faction!==faction.dataset.faction){state.faction=faction.dataset.faction;state.quantities={};state.commander='';$('#listName').value='';render()}return}
  const add=event.target.closest('[data-add]');if(add){addUnit(add.dataset.add);return}
  const remove=event.target.closest('[data-remove]');if(remove){removeUnit(remove.dataset.remove);return}
  const model=event.target.closest('[data-model]');if(model){const u=currentUnits().find(x=>x.id===model.dataset.model);if(u)openModel(u);return}
  const card=event.target.closest('[data-card]');if(card){const u=currentUnits().find(x=>x.id===card.dataset.card);if(u)openKoreanCard(u);return}
  const load=event.target.closest('[data-load]');if(load){const item=getSaved()[Number(load.dataset.load)];if(!item)return;state.faction=item.faction;state.mode=item.mode;state.limit=item.limit;state.quantities=item.quantities||{};state.commander=item.commander||'';$('#listName').value=item.name;$('#pointsLimit').value=item.limit;document.querySelector(`input[name="mode"][value="${item.mode}"]`).checked=true;$('#loadDialog').close();render();toast(ui('저장 목록을 불러왔습니다.','Saved list loaded.'))}
});
document.querySelectorAll('input[name="mode"]').forEach(input=>input.addEventListener('change',()=>{state.mode=input.value;render()}));
$('#pointsLimit').addEventListener('change',e=>{state.limit=Math.max(50,Math.min(1000,Number(e.target.value)||250));e.target.value=state.limit;render()});
$('#searchInput').addEventListener('input',e=>{state.query=e.target.value;renderCatalog()});
$('#sortSelect').addEventListener('change',e=>{state.sort=e.target.value;renderCatalog()});
$('#typeFilter').addEventListener('change',e=>{state.type=e.target.value;renderCatalog()});
$('#availableOnly').addEventListener('change',e=>{state.availableOnly=e.target.checked;renderCatalog()});
$('#commanderSelect').addEventListener('change',e=>{state.commander=e.target.value;renderValidation()});
$('#confirmRosterButton').addEventListener('click',confirmRoster);
$('#resumeGameButton').addEventListener('click',()=>{if(activeGame()){screen='game';render();window.scrollTo(0,0)}});
$('#saveButton').addEventListener('click',saveList);$('#exportButton').addEventListener('click',exportList);
$('#loadButton').addEventListener('click',showSaved);$('#resetButton').addEventListener('click',reset);
document.addEventListener('change',event=>{if(event.target.id==='playUnitSelect'){const game=activeGame();if(game){game.cardIndex=Number(event.target.value);persistGames();renderGame()}}});
let playSwipe=null;
document.addEventListener('pointerdown',event=>{if(screen==='game'&&event.isPrimary&&event.target.closest('#playCardStage')&&(!event.target.closest('button,a,select,input,summary')||event.target.closest('[data-rule]')))playSwipe={x:event.clientX,y:event.clientY,id:event.pointerId}});
document.addEventListener('pointerup',event=>{if(!playSwipe||event.pointerId!==playSwipe.id)return;const dx=event.clientX-playSwipe.x,dy=event.clientY-playSwipe.y;playSwipe=null;if(screen==='game'&&!document.querySelector('dialog[open]')&&Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5){window.warcrowSkipRuleClickUntil=Date.now()+250;movePlayCard(dx<0?1:-1)}});
document.addEventListener('pointercancel',()=>{playSwipe=null});
document.addEventListener('keydown',event=>{if(screen!=='game'||document.querySelector('dialog[open]')||event.target.closest('input,select,textarea,[contenteditable]'))return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();movePlayCard(event.key==='ArrowLeft'?-1:1)}});
applyStaticLanguage();
Promise.all(['./app-data.json','./card-ko.json','./card-profiles.json','./card-abilities.json','./card-effects.json','./model-images.json','./rules-glossary.json'].map(url=>fetch(`${url}?v=26`).then(response=>{if(!response.ok)throw Error(`${url} request failed`);return response.json()}))).then(([units,translated,profiles,abilities,effects,models,glossary])=>{data=units;translations=translated;cardProfiles=profiles;cardAbilities=abilities;cardEffects=effects;modelImages=models.units||{};configureRules(glossary);render()}).catch(()=>{toast(ui('유닛 자료를 불러오지 못했습니다.','Could not load unit data.'));$('#unitList').innerHTML=`<div class="empty">${ui('자료를 불러올 수 없습니다. 페이지를 새로고침하세요.','Could not load data. Refresh the page.')}</div>`});
