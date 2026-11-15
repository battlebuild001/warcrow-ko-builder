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
const state={faction:'northern-tribes',mode:'wts',limit:250,quantities:{},joins:[],commander:'',query:'',sort:'points',type:'all',availableOnly:false,listName:''};
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
function unitType(u){if(typeof joinIsCharacter==='function'&&joinIsCharacter(u))return 'Character';if(u.characteristics?.includes('Companion')||u.type==='Companion')return 'Companion';if(u.characteristics?.includes('Character')||u.type?.includes('Character'))return 'Character';return 'Troop'}
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
  $('#unitCount').textContent=language==='en'?String(units.length):`${units.length}개`;
  $('#modelCoverage').textContent=ui('이미지를 누르면 모델을, 이름을 누르면 능력을 볼 수 있습니다.','Tap an image to view the model, or a name to read its abilities.');
  $('#unitList').innerHTML=units.length?units.map(u=>{
    const blocked=isBlocked(u),reason=canAdd(u);
    const category=unitType(u)==='Character'?ui('캐릭터','Character'):unitType(u)==='Companion'?ui('동반자','Companion'):ui('일반 유닛','Troop');
    const cardLabel=language==='en'?'Card':language==='bi'?'카드':'카드';
    return `<article class="unit-card unit-row ${count(u)?'is-selected':''}" data-rule-unit="${escapeHtml(u.id)}"><div class="unit-art ${modelImages[u.id]?.kind==='portrait'?'is-illustration':''}">${modelPhoto(u)}</div><div class="unit-main"><button type="button" class="unit-name" data-card="${escapeHtml(u.id)}" title="${escapeHtml(unitName(u))}"><span class="unit-name-ko">${escapeHtml(localizedName(u))}</span><span class="unit-name-en">${escapeHtml(u.name)}</span></button><div class="unit-category">${ruleText(category)}${u.highCommand?` · ${ruleTerm('high-command',language==='en'?'High Command':'최고 지휘부')}`:''}${blocked?` <span class="unit-blocked">${language==='en'?'WTS excluded':'WTS 제외'}</span>`:''}</div></div><button type="button" class="unit-cost" data-rule="points" aria-label="${escapeHtml(ui(`편성 점수 ${u.pointsCost} 설명`,`${u.pointsCost} points: rules`))}"><span>${u.pointsCost}</span><small>PT</small></button><button type="button" class="unit-card-link" data-card="${escapeHtml(u.id)}" aria-label="${escapeHtml(unitName(u))} ${escapeHtml(ui('카드 보기','View card'))}">${cardLabel}</button><div class="stepper" title="${escapeHtml(reason||ui(`최대 ${u.availability}개 편성`,`Up to ${u.availability} units`))}"><button type="button" data-remove="${escapeHtml(u.id)}" aria-label="${escapeHtml(unitName(u))} ${escapeHtml(ui('제거','remove'))}" ${count(u)?'':'disabled'}>−</button><b aria-label="${escapeHtml(ui(`선택 ${count(u)}개`,`Selected ${count(u)}`))}">${count(u)}</b><button type="button" data-add="${escapeHtml(u.id)}" aria-label="${escapeHtml(unitName(u))} ${escapeHtml(ui('추가','add'))}" title="${escapeHtml(reason||ui('추가','Add'))}" ${reason?'disabled':''}>+</button></div></article>`;
  }).join(''):`<div class="empty"><strong>${ui('검색 결과가 없습니다.','No units found.')}</strong><p>${ui('다른 이름을 검색하거나 필터를 바꿔 보세요.','Try another name or change the filters.')}</p><button type="button" class="button button-ghost" data-clear-filters>${ui('검색·필터 초기화','Clear filters')}</button></div>`;
}
function renderCommander(){
  const candidates=selectedUnits().filter(u=>unitType(u)==='Character'&&joinRole(u)==='officer');
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
    else if(joinRole(selected.find(u=>u.id===state.commander))!=='officer')issues.push(ui('지휘관은 장교 캐릭터 중에서 선택해야 합니다.','The commander must be an Officer Character.'));
    if(totalPoints()>state.limit)issues.push(ui(`점수 상한을 ${totalPoints()-state.limit}점 초과했습니다.`,`Points limit exceeded by ${totalPoints()-state.limit}.`));
    if(state.mode==='wts'&&selected.some(isBlocked))issues.push(ui('WTS 시즌 2 출전 불가 유닛이 포함되어 있습니다.','The army includes a unit ineligible for WTS Season 2.'));
    if(state.mode==='wts'&&mercenaries()>1)issues.push(ui('WTS에서는 용병이 최대 1개입니다.','WTS allows at most one mercenary.'));
    if(selected.filter(u=>u.highCommand).length>1)issues.push(ui('High Command는 최대 1명입니다.','Only one High Command unit is allowed.'));
  }
  $('#validation').innerHTML=issues.length?issues.map(x=>`<p class="warn">${escapeHtml(x)}</p>`).join(''):`<p class="good">${ui('기본 편성 조건을 충족했습니다. 최신 프로필은 공식 자료에서 확인하세요.','Current army conditions are met. Check Officer types and current profiles against official sources.')}</p>`;
}
function renderArmy(){
  state.joins=validateJoins(state,data).validJoins;
  const units=selectedUnits(),points=totalPoints(),number=units.reduce((sum,u)=>sum+count(u),0);
  $('#armyCount').textContent=ui(`${number}개 유닛`,`${number} units`);
  $('#scoreValue').innerHTML=`${points} <small>/ ${state.limit} ${ui('점','pts')}</small>`;
  $('#scoreMeter').style.width=`${Math.min(100,points/state.limit*100)}%`;
  $('#scoreRemaining').textContent=points<=state.limit?ui(`${state.limit-points}점 남음`,`${state.limit-points} points remaining`):ui(`${points-state.limit}점 초과`,`${points-state.limit} points over`);
  $('#commandValue').textContent=totalCommand();
  $('#mercenaryValue').textContent=`${mercenaries()} / ${state.mode==='wts'?'1':'—'}`;
  renderCommander();renderValidation();
  $('#selectedList').innerHTML=units.length?units.map(u=>`<div class="selected-entry" data-rule-unit="${escapeHtml(u.id)}"><span class="number">${count(u)}×</span>${modelPhoto(u,true)}<div class="summary"><strong>${escapeHtml(unitName(u))}</strong><small>${u.pointsCost*count(u)} ${ui('점','pts')} · ${ruleTerm('command-token','COM')} ${(u.command||0)*count(u)}${data.wtsFogIds.includes(u.id)&&state.mode==='wts'?` · ${ui('출전 불가','ineligible')}`:''}</small></div><button type="button" data-remove="${escapeHtml(u.id)}" aria-label="${escapeHtml(unitName(u))} ${ui('제거','remove')}">−</button></div>`).join(''):`<div class="empty">${ui('아직 추가한 유닛이 없습니다.','No units added yet.')}<br />${ui('왼쪽 목록에서 부대를 구성하세요.','Build your army from the catalog.')}</div>`;
  $('#dockCount').textContent=language==='en'?`${number} units`:`${number} 유닛`;
  $('#dockPoints').textContent=`${points} / ${state.limit} PT`;
  $('[data-play-now]').disabled=!number;
  $('#confirmRosterButton').disabled=!number;
  $('#joinPlanner').innerHTML=renderJoinPlanner(state,data);
  $('#rulesSummary').textContent=`${state.mode==='wts'?'WTS':ui('일반전','Standard')} · ${state.limit}${ui('점',' pts')}`;

}
function confirmRoster(){
  const units=selectedUnits().map(u=>({...JSON.parse(JSON.stringify(u)),quantity:count(u)}));
  if(!units.length)return toast(ui('플레이할 유닛을 먼저 골라 주세요.','Add a unit first.'));
  const joins=validateJoins(state,data).validJoins;
  const game={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,name:$('#listName').value.trim()||ui('내 유닛 카드','My unit cards'),faction:state.faction,confirmedAt:new Date().toISOString(),units,joins:JSON.parse(JSON.stringify(joins)),instances:[],cardIndex:0};
  setArmyDrawer(false);gameSessions.unshift(game);activeGameId=game.id;persistGames();screen='game';render();window.scrollTo(0,0);
}
function playDisplayUnits(game){return game?gameJoinGroups(game):[]}
function playCardMarkup(display,game){return `${renderJoinedGroup(display)}${renderPlayJoinControls(display,game)}`}
function movePlayCard(delta){
  const game=activeGame(),units=playDisplayUnits(game);if(!units.length)return;
  const focusedTab=document.activeElement?.classList.contains('play-unit-tab');
  const focusedStep=document.activeElement?.dataset.playStep;
  game.cardIndex=((Number(game.cardIndex)||0)+delta+units.length)%units.length;
  persistGames();renderGame();
  if(focusedTab)$('#playUnitTabs .play-unit-tab[aria-selected="true"]')?.focus({preventScroll:true});
  else if(focusedStep)document.querySelector(`#gameView [data-play-step="${focusedStep}"]`)?.focus({preventScroll:true});
  $('#gameView .play-unit-navigation')?.scrollIntoView({block:'start',behavior:'instant'});
}
function renderGame(){
  const game=activeGame(),view=$('#gameView'),units=playDisplayUnits(game);
  $('.hero').hidden=screen==='game';$('.setup-panel').hidden=screen==='game';$('.builder-grid').hidden=screen==='game';view.hidden=screen!=='game';
  $('#resumeGameButton').hidden=!units.length;
  $('#mobileDock').hidden=screen==='game';
  if(screen!=='game'||!units.length){view.innerHTML='';return}
  const index=Math.max(0,Math.min(units.length-1,Number(game.cardIndex)||0));game.cardIndex=index;
  const display=units[index],unit=display.unit||display;
  const card=playCardMarkup(display,game);
  const searchIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg>';
  const scenarioIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 5 5-2 6 3 5-2v15l-5 2-6-3-5 2Z"/><path d="M9 3v15m6-12v15"/></svg>';
  const backIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 5-7 7 7 7m-7-7h18"/></svg>';
  const playTools=`<div class="play-tools"><button type="button" class="play-search" data-open-rules data-rule-unit="${escapeHtml(unit.id)}" aria-haspopup="dialog">${searchIcon}<span>${language==='en'?'Search':language==='bi'?'검색 · Search':'키워드 검색'}</span></button><button type="button" data-open-scenarios aria-haspopup="dialog">${scenarioIcon}<span>${language==='en'?'Scenarios':language==='bi'?'모험 · Scenarios':'시나리오'}</span></button><button type="button" class="play-builder-back" data-game-action="builder" aria-label="${ui('편성으로 돌아가기','Back to army')}">${backIcon}<span>${language==='en'?'Army':language==='bi'?'편성 · Army':'편성'}</span></button></div>`;
  const tabs=units.map((entry,i)=>{
    const u=entry.unit||entry,photo=modelImages[u.id]?.image,label=entry.label||unitName(u),quantity=entry.quantity??u.quantity??1;
    const badge=quantity>1?`×${quantity}`:'';
    return `<button type="button" role="tab" class="play-unit-tab${i===index?' is-active':''}" id="playUnitTab${i}" data-play-index="${i}" aria-selected="${i===index}" aria-controls="playCardStage" tabindex="${i===index?'0':'-1'}"><span class="play-tab-thumb" aria-hidden="true">${photo?`<img src="${escapeHtml(photo)}" alt="" loading="lazy" />`:'<span>NO IMAGE</span>'}</span><span class="play-tab-copy"><span class="play-tab-name">${escapeHtml(label)}</span>${badge?`<small class="play-tab-quantity">${badge}</small>`:''}</span></button>`;
  }).join('');
  const chevron='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 6 6-6 6"/></svg>';
  view.innerHTML=`<header class="game-heading play-header"><div class="play-roster-title"><span class="section-kicker">${ui('플레이 모드','PLAY MODE')}</span><h2>${escapeHtml(game.name)}</h2><p>${ui(`${units.length}개 유닛`,`${units.length} units`)}<span aria-hidden="true">·</span>${ui('카드를 좌우로 넘겨 보세요.','Swipe to browse cards.')}</p></div>${playTools}</header>${typeof scenarioPlaySummary==='function'?scenarioPlaySummary(game):''}<nav class="play-navigation play-unit-navigation" aria-label="${ui('유닛 카드 이동','Unit card navigation')}"><button type="button" class="play-page-arrow play-page-previous" data-play-step="-1" aria-label="${ui('이전 유닛 카드','Previous unit card')}" ${units.length===1?'disabled':''}>${chevron}</button><div class="play-tabs" id="playUnitTabs" role="tablist" aria-label="${ui('선택한 유닛','Selected units')}" aria-orientation="horizontal">${tabs}</div><button type="button" class="play-page-arrow" data-play-step="1" aria-label="${ui('다음 유닛 카드','Next unit card')}" ${units.length===1?'disabled':''}>${chevron}</button><select id="playUnitSelect" hidden aria-hidden="true" tabindex="-1">${units.map((entry,i)=>`<option value="${i}" ${i===index?'selected':''}>${escapeHtml(entry.label||unitName(entry.unit||entry))}</option>`).join('')}</select><span class="sr-only" role="status" aria-live="polite">${index+1} / ${units.length} · ${escapeHtml(display.label||unitName(unit))}</span></nav><div id="playCardStage" class="play-card-stage" role="tabpanel" aria-labelledby="playUnitTab${index}" tabindex="0" data-rule-unit="${escapeHtml(unit.id)}">${card}</div>`;
  requestAnimationFrame(()=>{
    const rail=$('#playUnitTabs'),tab=rail?.querySelector('[aria-selected="true"]');
    if(rail&&tab)rail.scrollTo({left:Math.max(0,tab.offsetLeft-(rail.clientWidth-tab.offsetWidth)/2),behavior:'instant'});
  });
}
function resolveDisplayUnit(id){
  return (openCardUnit?.id===id?openCardUnit:null)||activeGame()?.units.find(u=>u.id===id)||data.units.find(u=>u.id===id);
}
function openKoreanCard(u){
  const changed=openCardId!==u.id;
  openCardId=u.id;openCardUnit=u;
  $('#cardDialog').classList.add('showcase-open');
  $('#cardDialog').classList.remove('english-original');
  $('#dialogShowcase').dataset.ruleUnit=u.id;
  $('#dialogShowcase').hidden=false;
  $('#dialogShowcase').innerHTML=nativeUnitCard(u);
  $('#dialogEnglish').textContent=(cardAbilities[u.cardKey]||[]).map(box=>box.english).join('\n\n')||ui('원문 상세 카드 미제공','Detailed source card unavailable');
  const link=$('#cardOriginalLink'),source=localCardUrl(u)||u.cardUrl;
  link.hidden=!source;if(source)link.href=source;else link.removeAttribute('href');
  link.textContent=ui('변경하지 않은 영문 원본 카드 열기 ↗','Open unmodified official English card ↗');
  $('.card-source summary').textContent=ui('영문 원문과 공식 카드','English text and official card');
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
  $('#searchInput').placeholder=language==='bi'?'검색 / Search':language==='en'?'Search units or rules':'유닛·능력·규칙 검색';
  for(const [selector,koText,enText,biText] of [['#sortSelect option[value="points"]','점수 ↑','Points ↑','점수 / PT ↑'],['#sortSelect option[value="points-desc"]','점수 ↓','Points ↓','점수 / PT ↓'],['#sortSelect option[value="name"]','이름순','Name','이름 / Name'],['#typeFilter option[value="all"]','모든 종류','All types','전체 / All'],['#typeFilter option[value="Character"]','캐릭터','Characters','캐릭터 / Char.'],['#typeFilter option[value="Troop"]','일반 유닛','Troops','일반 / Troop'],['#typeFilter option[value="Companion"]','동반자','Companions','동반 / Comp.']]){const el=$(selector);if(el)el.textContent=language==='bi'?biText:language==='en'?enText:koText;}
  $('.check-filter span').textContent=language==='bi'?'추가 가능 / Available':language==='en'?'Available only':'추가 가능한 유닛만';
  leaf('.army .section-kicker','YOUR COMPANY','YOUR COMPANY');leaf('#armyTitle','편성표','Army list');leaf('.score-card>div:first-child>span','총 편성 점수','Total points');
  lead('.command-strip>span:first-child','지휘 토큰 ','Command tokens ');lead('.command-strip>span:last-child','용병 ','Mercenaries ');
  lead('.commander-select','지휘관 ','Commander ');leaf('.commander-select>span','장교 캐릭터에서 선택','Choose an Officer character');
  lead('.list-name','목록 이름','List name');$('#listName').placeholder=ui('내 부대의 이름','Name your company');
  leaf('#saveButton','목록 저장','Save list');leaf('#exportButton','JSON 내보내기','Export JSON');leaf('#loadButton','저장 목록 불러오기','Load saved list');leaf('#resetButton','새 목록','New list');
  leaf('#confirmRosterButton','플레이 시작','Start playing');leaf('#resumeGameButton','플레이 모드로 돌아가기','Return to play mode');
  leaf('.roster-confirm-note','선택한 유닛의 카드를 좌우로 넘겨 봅니다.','Browse the selected unit cards left and right.');
  leaf('.guide-strip>span','게임 가이드','Game guide');leaf('.guide-strip a[href="./rules.html"]','룰북 전문','Full rulebook');leaf('.guide-strip a[href="./quick-sheet.html"]','퀵시트','Quick sheet');leaf('.guide-strip a[href="./tutorial.html"]','입문 튜토리얼','Tutorial');
  leaf('.guide-strip a[href="./scenarios.html"]','시나리오','Scenarios');leaf('.hero-load','저장한 편성 ↗','Saved armies ↗');$('.dock-roster>span').textContent=language==='bi'?'편성 · Army':language==='en'?'My army':'내 편성';$('.dock-play').textContent=language==='bi'?'플레이 · Play':language==='en'?'Play →':'플레이 시작 →';
  $('#gameView').setAttribute('aria-label',ui('플레이 모드 유닛 카드','Play mode unit cards'));
  leaf('.data-note','최신 프로필과 세부 판정은 공식 코르부스피어에서 확인하세요. 원본 카드가 없는 4종은 확보된 정보만 제공합니다.','Korean card text is a review draft. The official builder does not provide full card images for four units. Check Officer/Support types and current profiles against CorvuSphere.');
  leaf('.page-shell>footer>span:first-child','비공식 한국어 빌더 초안','Unofficial Warcrow builder draft');
  leaf('#loadDialog h2','저장한 목록','Saved lists');leaf('.card-source summary','영문 원문과 카드 이미지 대조','Original English text and card image');
  $('.card-dialog .dialog-close').setAttribute('aria-label',ui('닫기','Close'));$('.load-dialog .dialog-close').setAttribute('aria-label',ui('닫기','Close'));
  $('#sourceVersion').textContent=data.units.length?ui(`유닛 자료 v${data.version} · 한국어 카드 초안`,`Unit data v${data.version} · Card draft`):ui('자료 불러오는 중','Loading data');
}
function render(){applyStaticLanguage();renderFactions();renderCatalog();renderArmy();renderGame();$('#modeNote').textContent=state.mode==='wts'?ui('대회 규칙 적용 · 출전 불가 유닛 제외 · 용병 최대 1개','Tournament rules · Ineligible units excluded · Up to 1 mercenary'):ui('기본 편성 규칙 적용 · 출전 불가와 용병 제한은 대회 모드에서 검사','Standard army rules · Tournament eligibility and mercenary limits apply in WTS mode');}
function restoreUnitFocus(id,action,inArmy){const scope=inArmy?$('#armyPanel'):$('#unitList');const button=scope.querySelector(`[data-${action}="${CSS.escape(id)}"]:not([disabled])`)||scope.querySelector(`[data-${action==='add'?'remove':'add'}="${CSS.escape(id)}"]:not([disabled])`)||(inArmy?$('#listName'):null);button?.focus({preventScroll:true})}
function addUnit(id){const inArmy=Boolean(document.activeElement?.closest('#armyPanel'));const u=currentUnits().find(x=>x.id===id);if(!u)return;const reason=canAdd(u);if(reason)return toast(reason);state.quantities[id]=count(u)+1;render();restoreUnitFocus(id,'add',inArmy)}
function removeUnit(id){const inArmy=Boolean(document.activeElement?.closest('#armyPanel'));if(!state.quantities[id])return;state.quantities[id]--;if(!state.quantities[id])delete state.quantities[id];render();restoreUnitFocus(id,'remove',inArmy)}
function getSaved(){try{return JSON.parse(localStorage.getItem(storageKey)||'[]')}catch{return []}}
function saveList(){if(!selectedUnits().length)return toast(ui('플레이할 유닛을 먼저 골라 주세요.','Add a unit first.'));const name=$('#listName').value.trim();if(!name)return toast(ui('목록 이름을 입력하세요.','Enter a list name.'));const saved=getSaved();saved.unshift({name,faction:state.faction,mode:state.mode,limit:state.limit,quantities:{...state.quantities},joins:validateJoins(state,data).validJoins,commander:state.commander,createdAt:new Date().toISOString()});localStorage.setItem(storageKey,JSON.stringify(saved.slice(0,30)));toast(ui('이 브라우저에 목록을 저장했습니다.','List saved in this browser.'))}
function exportList(){if(!selectedUnits().length)return toast(ui('내보낼 유닛이 없습니다.','There are no units to export.'));const payload={format:'warcrow-ko-draft-v1',sourceVersion:data.version,name:$('#listName').value.trim()||ui('새 편성표','New army list'),faction:state.faction,mode:state.mode,limit:state.limit,commander:state.commander,joins:validateJoins(state,data).validJoins,units:selectedUnits().map(u=>({id:u.id,name:u.name,quantity:count(u),pointsCost:u.pointsCost,command:u.command}))};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`warcrow-${state.faction}-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(ui('JSON 파일을 내보냈습니다.','JSON file exported.'))}
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
function reset(){state.quantities={};state.joins=[];state.commander='';$('#listName').value='';render();toast(ui('새 편성표를 시작합니다.','New army list started.'))}
document.addEventListener('click',(event)=>{
  if(event.target.closest('[data-open-army]')){setArmyDrawer(true);return}
  if(event.target.closest('[data-close-army]')){setArmyDrawer(false);return}
  if(event.target.closest('[data-play-now]')){confirmRoster();return}
  if(event.target.closest('[data-action="load"]')){showSaved();return}
  if(event.target.closest('[data-clear-filters]')){state.query='';state.type='all';state.availableOnly=false;$('#searchInput').value='';$('#typeFilter').value='all';$('#availableOnly').checked=false;renderCatalog();return}
  const languageButton=event.target.closest('button[data-language]');if(languageButton){language=languageButton.dataset.language;localStorage.setItem(languageStorageKey,language);render();if($('#cardDialog').open&&openCardUnit)openKoreanCard(openCardUnit);return}
  const playTab=event.target.closest('[data-play-index]');if(playTab){const game=activeGame();if(game){movePlayCard(Number(playTab.dataset.playIndex)-(Number(game.cardIndex)||0));$('#playUnitTabs .play-unit-tab[aria-selected="true"]')?.focus({preventScroll:true})}return}
  const playStep=event.target.closest('[data-play-step]');if(playStep){movePlayCard(Number(playStep.dataset.playStep));return}
  const gameAction=event.target.closest('[data-game-action]');if(gameAction){screen='builder';render();window.scrollTo(0,0);return}
  const faction=event.target.closest('[data-faction]');if(faction){if(state.faction!==faction.dataset.faction){state.faction=faction.dataset.faction;state.quantities={};state.joins=[];state.commander='';$('#listName').value='';render()}return}
  const add=event.target.closest('[data-add]');if(add){addUnit(add.dataset.add);return}
  const remove=event.target.closest('[data-remove]');if(remove){removeUnit(remove.dataset.remove);return}
  const model=event.target.closest('[data-model]');if(model){const u=resolveDisplayUnit(model.dataset.model);if(u)openModel(u);return}
  const card=event.target.closest('[data-card]');if(card){const u=currentUnits().find(x=>x.id===card.dataset.card);if(u)openKoreanCard(u);return}
  const load=event.target.closest('[data-load]');if(load){const item=getSaved()[Number(load.dataset.load)];if(!item)return;state.faction=item.faction;state.mode=item.mode;state.limit=item.limit;state.quantities=item.quantities||{};state.joins=item.joins||[];state.commander=item.commander||'';$('#listName').value=item.name;$('#pointsLimit').value=item.limit;document.querySelector(`input[name="mode"][value="${item.mode}"]`).checked=true;$('#loadDialog').close();render();toast(ui('저장 목록을 불러왔습니다.','Saved list loaded.'))}
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
document.addEventListener('change',event=>{if(event.target.id==='playUnitSelect'){const game=activeGame();if(game)movePlayCard(Number(event.target.value)-(Number(game.cardIndex)||0))}});
let playSwipe=null;
document.addEventListener('pointerdown',event=>{if(screen==='game'&&event.isPrimary&&event.button===0&&event.target.closest('#playCardStage')&&(!event.target.closest('button,a,select,input,textarea,summary')||event.target.closest('[data-rule]')))playSwipe={x:event.clientX,y:event.clientY,id:event.pointerId}});
document.addEventListener('pointerup',event=>{if(!playSwipe||event.pointerId!==playSwipe.id)return;const dx=event.clientX-playSwipe.x,dy=event.clientY-playSwipe.y;playSwipe=null;if(screen==='game'&&!document.querySelector('dialog[open]')&&Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5){window.warcrowSkipRuleClickUntil=Date.now()+250;movePlayCard(dx<0?1:-1)}});
document.addEventListener('pointercancel',()=>{playSwipe=null});
document.addEventListener('keydown',event=>{
  if(screen!=='game'||document.querySelector('dialog[open]')||event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,select,textarea,[contenteditable]'))return;
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();movePlayCard(event.key==='ArrowLeft'?-1:1)}
  else if(event.target.closest('.play-unit-tab')&&(event.key==='Home'||event.key==='End')){const game=activeGame(),units=playDisplayUnits(game);if(units.length){event.preventDefault();movePlayCard((event.key==='Home'?0:units.length-1)-(Number(game.cardIndex)||0))}}
});
applyStaticLanguage();
Promise.all(['./app-data.json','./card-ko.json','./card-abilities.json','./card-effects.json','./model-images.json','./rules-glossary.json','./native-cards.json','./join-metadata.json'].map(url=>fetch(`${url}?v=28`).then(response=>{if(!response.ok)throw Error(`${url} request failed`);return response.json()}))).then(([units,translated,abilities,effects,models,glossary,native,joins])=>{data=units;translations=translated;cardProfiles=native;nativeCards=native;cardAbilities=abilities;cardEffects=effects;modelImages=models.units||{};configureRules(glossary);configureJoins(joins);render()}).catch(()=>{toast(ui('유닛 자료를 불러오지 못했습니다.','Could not load unit data.'));$('#unitList').innerHTML=`<div class="empty">${ui('자료를 불러올 수 없습니다. 페이지를 새로고침하세요.','Could not load data. Refresh the page.')}</div>`});
