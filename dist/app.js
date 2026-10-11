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
  'Flee':'도주','Heal':'치유','Rugged':'험지','Trap':'함정'
};
function ko(value){
  const raw=String(value||'');
  return raw.replace(/\b[A-Za-z][A-Za-z ]+\b/g, (part)=>{
    const trimmed=part.trim();
    return (terms[trimmed]||trimmed)+(part.endsWith(' ')?' ':'');
  });
}
let data={units:[],factions:[],wtsFogIds:[],version:''};
let translations={names:{},cards:{}};
function localizedName(u){return translations.names[u.name]||u.name}
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
function sourceGlyph(x,y,w,h,kind,label){
  return `<svg class="source-glyph ${kind}" viewBox="${x} ${y} ${w} ${h}" role="img" aria-label="${escapeHtml(label)}"><image href="./tattooist-card.webp" width="943" height="1414" /></svg>`;
}
function tattooistShowcase(){
  return `<article class="showcase-card" aria-label="타투이스트 한국어 카드 예시">
    <div class="showcase-top"><div class="showcase-portrait" role="img" aria-label="타투이스트 인물 그림"></div><div class="showcase-identity"><span class="showcase-eyebrow">북방 부족 · 캐릭터 / 바랑크</span><h2>타투이스트</h2><span class="showcase-original">TATTOOIST</span><div class="showcase-badges"><span>정찰</span><span>바랑크 보병 합류</span></div></div><div class="showcase-cost"><strong>15</strong><span>포인트</span></div></div>
    <div class="showcase-content"><div class="showcase-section-label">기본 능력치 <span>UNIT PROFILE</span></div><div class="showcase-stats"><div><small>이동 · MOV</small><strong>4–3 <em>[10]</em></strong></div><div><small>체력 · W</small><strong>2</strong></div><div><small>의지 · WP</small><strong class="showcase-dice">${sourceGlyph(581,146,36,38,'source-die','원본 노란 주사위 1')}${sourceGlyph(618,146,37,38,'source-die','원본 노란 주사위 2')}</strong></div><div><small>사기 · MOR</small><strong>1</strong></div><div><small>편성 · AVB</small><strong>1</strong></div></div>
    <div class="showcase-section-label">전투 주사위 <span>COMBAT ICONS</span></div><div class="showcase-combat"><div>${sourceGlyph(43,279,47,48,'source-combat-icon','원본 원거리 공격 기호')}<span class="combat-label">사거리 <b>12</b></span><span class="showcase-dice">${sourceGlyph(64,327,42,43,'source-die','원본 빨간 주사위')}${sourceGlyph(106,327,42,43,'source-die','원본 노란 주사위 1')}${sourceGlyph(148,327,42,43,'source-die','원본 노란 주사위 2')}</span></div><div>${sourceGlyph(347,282,43,39,'source-combat-icon','원본 근접 공격 기호')}<span class="combat-label">근접 공격</span><span class="showcase-dice">${sourceGlyph(352,327,43,43,'source-die','원본 주황 주사위 1')}${sourceGlyph(396,327,43,43,'source-die','원본 주황 주사위 2')}</span></div><div>${sourceGlyph(637,279,36,44,'source-combat-icon','원본 방어 기호')}<span class="combat-label">방어</span><span class="showcase-dice">${sourceGlyph(648,327,43,43,'source-die','원본 초록 주사위')}</span></div></div><div class="showcase-status">${sourceGlyph(43,385,77,54,'source-status-icon','원본 느낌표 기호 두 개')}<div><strong>공격 효과 · 둔화</strong><small>대상에게 둔화 상태를 부여합니다.</small></div></div>
    <div class="showcase-section-label">능력과 효과 <span>ABILITIES</span></div><div class="showcase-skills"><section class="showcase-skill">${sourceGlyph(30,476,48,53,'source-skill-icon','원본 약초와 연고 기호')}<div><div class="skill-heading"><h3>약초와 연고</h3><span class="skill-chip">치유 · 12보폭</span></div><p class="skill-target">대상 · 12보폭 이내의 모든 아군 유닛</p><p>원하는 상태를 제거하고 피해 1을 회복합니다. 의지 판정에서 <b>성공 기호 ${sourceGlyph(514,538,21,30,'source-inline-icon','원본 성공 기호')}</b> 하나마다 대상별로 피해 1을 추가 회복합니다.</p></div></section><section class="showcase-skill">${sourceGlyph(27,592,53,58,'source-skill-icon','원본 환각 버섯 기호')}<div><div class="skill-heading"><h3>환각 버섯</h3><span class="skill-chip">지속 · 시야 불필요</span></div><p class="skill-target">대상 · 모든 아군 주문 시전자</p><p>마법 오염·주문 방어 판정에서 주사위를 원하는 만큼 다시 굴릴 수 있습니다. 두 판정에 원본에 표시된 추가 기호를 적용합니다. ${sourceGlyph(278,657,26,32,'source-inline-icon','원본 마법 기호')}${sourceGlyph(348,657,26,32,'source-inline-icon','원본 방어 기호')}${sourceGlyph(412,657,22,32,'source-inline-icon','원본 성공 기호')}</p></div></section><section class="showcase-skill">${sourceGlyph(27,741,53,58,'source-skill-icon','원본 토템의 숨결 기호')}<div><div class="skill-heading"><h3>토템의 숨결</h3><span class="skill-chip">지속 · 시야 불필요</span></div><p class="skill-target">대상 · 모든 아군 바랑크 유닛</p><p>대상이 <b>주문 해제 ${sourceGlyph(298,774,32,31,'source-inline-icon','원본 파란 주문 해제 주사위')}</b>를 얻습니다.</p></div></section><section class="showcase-skill">${sourceGlyph(27,1100,53,58,'source-skill-icon','원본 치유 문신 기호')}<div><div class="skill-heading"><h3>치유 문신</h3><span class="skill-chip">활성화당 1회</span></div><p class="skill-target">발동 · 피해를 받기 직전</p><p>의지 판정에 성공하면 피해 1을 무시할 수 있습니다.</p></div></section><section class="showcase-skill">${sourceGlyph(27,1190,53,58,'source-skill-icon','원본 고래 바늘 기호')}<div><div class="skill-heading"><h3>고래 바늘</h3><span class="skill-chip">상시</span></div><p><b>무장 해제 · 둔화 · 취약</b> 상태에 면역입니다.</p></div></section></div><div class="showcase-footer"><span>카드 도식화 예시</span><span>기호는 원본 카드 이미지의 해당 위치에서 가져왔습니다.</span></div></div></article>`;
}
function openKoreanCard(u){
  const translated=translations.cards[u.cardKey];
  const isShowcase=u.cardKey==='tattooist';
  $('#cardDialog').classList.toggle('showcase-open',isShowcase);
  $('#dialogShowcase').hidden=!isShowcase;
  $('#dialogGeneric').hidden=isShowcase;
  $('#dialogShowcase').innerHTML=isShowcase?tattooistShowcase():'';
  $('#dialogTitle').textContent=localizedName(u);
  $('#dialogOriginalName').textContent=u.name;
  $('#dialogMeta').innerHTML=`<span>포인트<strong>${u.pointsCost}</strong></span><span>지휘 토큰<strong>${u.command||0}</strong></span><span>최대 편성 · AVB<strong>${u.availability}</strong></span>`;
  const traits=[...(u.characteristics||[]).map(x=>terms[x]||x),...(u.keywords||[]).map(x=>ko(x.name)),...(u.specialRules||[]).map(ko)];
  $('#dialogTags').innerHTML=traits.map(x=>`<span>${escapeHtml(x)}</span>`).join('');
  const paragraphs=translated?.korean?.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean)||[];
  $('#dialogAbilities').innerHTML=paragraphs.length?paragraphs.map(x=>`<div class="ability-block">${escapeHtml(x)}</div>`).join(''):'<div class="ability-block">원문 카드의 상세 능력 문구를 확보하지 못했습니다. 위의 편성 정보와 특성·규칙은 수집된 유닛 데이터를 바탕으로 표시했습니다.</div>';
  $('#dialogNote').textContent=translated?'이 번역은 카드 문자 인식을 바탕으로 만든 검토용 초안입니다. 수치, 주사위 기호, 상태 효과는 아래 원본 카드와 대조하세요.':'원본 사이트의 카드 이미지가 제공되지 않아 상세 문구는 아직 번역할 수 없습니다.';
  $('#dialogEnglish').textContent=translated?.english||'원본 카드 텍스트 미확보';
  const image=$('#dialogImage');
  if(translated&&u.cardUrl){image.hidden=false;image.src=u.cardUrl;image.alt=`${u.name} 영문 원본 카드`}
  else{image.hidden=true;image.removeAttribute('src');image.alt=''}
  $('#cardDialog').showModal();
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
  const demo=event.target.closest('[data-demo-card]');if(demo){const u=data.units.find(x=>x.cardKey==='tattooist');if(u)openKoreanCard(u);else toast('카드 자료를 불러오는 중입니다.');return}
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
Promise.all(['./app-data.json','./card-ko.json'].map(url=>fetch(url).then(response=>{if(!response.ok)throw Error(`${url} 요청 실패`);return response.json()}))).then(([units,translated])=>{data=units;translations=translated;$('#sourceVersion').textContent=`유닛 자료 v${data.version} · 한국어 카드 초안`;render()}).catch(()=>{toast('유닛 자료를 불러오지 못했습니다.');$('#unitList').innerHTML='<div class="empty">자료를 불러올 수 없습니다. 페이지를 새로고침하세요.</div>'});
