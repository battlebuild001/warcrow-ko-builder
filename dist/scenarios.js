/* Official scenario reference; choosing one never modifies the army or tracks points. */
let scenarioData=null,scenarioLoading=null,scenarioCategory='all',scenarioActive='';
const scenarioLabels={all:'전체',patrol:'순찰',scenario:'시나리오',feat:'업적'};
function scenarioEsc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function scenarioText(html){const el=document.createElement('div');el.innerHTML=html||'';return el.textContent||''}
function scenarioGame(){return typeof activeGame==='function'&&typeof screen!=='undefined'&&screen==='game'?activeGame():null}
async function loadScenarios(){
  if(scenarioData)return scenarioData;
  if(!scenarioLoading)scenarioLoading=fetch('./scenarios-data.json?v=28').then(r=>{if(!r.ok)throw Error('scenario data');return r.json()}).then(d=>{scenarioData=d;for(const e of d.entries)e.searchText=[e.nameKo,e.nameEn,e.summary,scenarioText(e.html)].join(' ').toLocaleLowerCase().replace(/\s/g,'');return d}).catch(e=>{scenarioLoading=null;throw e});
  return scenarioLoading;
}
function scenarioPlaySummary(game){
  if(!game?.scenarioId&&!game?.featId)return '';
  const entries=scenarioData?.entries||[],ids=[game.scenarioId,game.featId].filter(Boolean);
  const labels=ids.map(id=>entries.find(e=>e.id===id)?.nameKo||game.scenarioNames?.[id]||id);
  return `<button type="button" class="play-scenario-summary" data-open-scenarios><small>선택한 모험</small><span>${labels.map(scenarioEsc).join(' + ')}</span><span aria-hidden="true">↗</span></button>`;
}
function filteredScenarios(){
  const query=(document.querySelector('#scenarioSearch')?.value||'').toLocaleLowerCase().replace(/\s/g,'');
  return (scenarioData?.entries||[]).filter(e=>(scenarioCategory==='all'||e.type===scenarioCategory)&&(!query||e.searchText.includes(query)));
}
function clearScenarioRandomStatus(){const status=document.querySelector('#scenarioRandomStatus');if(status){status.hidden=true;status.textContent=''}}
function focusScenarioCategory(){document.querySelector(`[data-scenario-category="${scenarioCategory}"]`)?.focus({preventScroll:true})}
function renderScenarioList(){
  const list=document.querySelector('#scenarioList');if(!list||!scenarioData)return;
  const entries=filteredScenarios();
  list.innerHTML=`<p class="scenario-result-count">${entries.length}개 · WTS 시즌 2 · ${scenarioEsc(scenarioData.version)}</p>${entries.map(e=>`<button type="button" class="scenario-entry${scenarioActive===e.id?' is-active':''}" data-scenario-entry="${scenarioEsc(e.id)}" aria-pressed="${scenarioActive===e.id}"><span>${scenarioLabels[e.type]}</span><strong>${scenarioEsc(e.nameKo)}</strong><small lang="en">${scenarioEsc(e.nameEn)}</small><p>${scenarioEsc(e.summary||'')}</p></button>`).join('')||'<p class="scenario-empty">검색 결과가 없습니다. 이름이나 규칙 용어로 검색해 보세요.</p>'}`;
  document.querySelectorAll('[data-scenario-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scenarioCategory===scenarioCategory)));
  const random=document.querySelector('[data-scenario-random]');if(random){
    random.disabled=!entries.length;
    random.querySelector('span').textContent=scenarioCategory==='all'?'랜덤 선택':`${scenarioLabels[scenarioCategory]} 랜덤`;
    random.setAttribute('aria-label',`${scenarioLabels[scenarioCategory]} ${entries.length}개 중 랜덤 선택`);
    random.title=`현재 목록 ${entries.length}개 중 하나를 무작위로 선택합니다.`;
  }
}
function renderScenarioDetail(id,focus=false){
  const entry=scenarioData?.entries.find(e=>e.id===id),detail=document.querySelector('#scenarioDetail');if(!entry||!detail)return;
  scenarioActive=id;const game=scenarioGame(),chosen=game&&(game.scenarioId===id||game.featId===id);
  const maps=entry.mapImages||[];
  detail.hidden=false;
  detail.innerHTML=`<button type="button" class="scenario-back" data-scenario-back>← 목록</button><header class="scenario-detail-head"><span>${scenarioLabels[entry.type]} · 공식 ${entry.pages.join('·')}쪽</span><h2 tabindex="-1" id="scenarioEntryTitle">${scenarioEsc(entry.nameKo)}</h2><p lang="en">${scenarioEsc(entry.nameEn)}</p>${game?`<button type="button" class="scenario-use" data-scenario-use="${scenarioEsc(id)}" ${chosen?'disabled':''}>${chosen?'현재 선택됨':entry.type==='feat'?'이 업적 선택':'이 모험 선택'}</button>`:''}</header>${entry.type==='scenario'?'<p class="scenario-note">표준 모험은 시나리오 1개와 업적 1개를 함께 사용합니다. 시나리오의 군사 점수(MP)와 업적의 비전 점수(AP)를 합산합니다.</p>':entry.type==='patrol'?'<p class="scenario-note">순찰은 그 자체로 완성된 기본 모험입니다. 별도의 업적을 추가하지 않습니다.</p>':'<p class="scenario-note">업적은 일반 시나리오와 함께 사용합니다. 순찰에는 적용하지 않습니다.</p>'}<div class="scenario-rules">${entry.html}</div>${maps.length?`<section class="scenario-maps"><h3>공식 배치도</h3><p>배치 구역·목표물·거리 표시는 아래 공식 도해를 기준으로 확인하세요.</p>${maps.map(m=>`<figure><a href="${scenarioEsc(m.src)}" target="_blank" rel="noopener noreferrer" aria-label="${scenarioEsc(m.alt||'공식 배치도')} 원본 크기 열기"><img src="${scenarioEsc(m.src)}" alt="${scenarioEsc(m.alt||entry.nameKo+' 공식 배치도')}" loading="lazy"></a><figcaption>${scenarioEsc(m.alt||'공식 원문 배치도')} · 누르면 원본 크기로 열립니다.</figcaption></figure>`).join('')}</section>`:''}<p class="scenario-citation">WTS 시즌 2 · ${scenarioEsc(scenarioData.version)} · 영문 ${entry.pages.join(', ')}쪽${entry.spanishPages?` · 스페인어 ${entry.spanishPages.join(', ')}쪽`:''}<br>${entry.languageVerificationNote?`${scenarioEsc(entry.languageVerificationNote)}<br>`:''}<a href="${scenarioEsc(entry.downloadUrl||entry.sourceUrl||scenarioData.sourceUrl)}" target="_blank" rel="noopener noreferrer">공식 영문 PDF ↗</a>${entry.spanishDownloadUrl?` · <a href="${scenarioEsc(entry.spanishDownloadUrl)}" target="_blank" rel="noopener noreferrer">우선 적용 스페인어 PDF ↗</a>`:''}</p>`;
  document.querySelector('#scenarioBrowser')?.classList.add('has-detail');renderScenarioList();
  if(focus)document.querySelector('#scenarioEntryTitle').focus({preventScroll:true});
  if(document.querySelector('#scenarioDialog')?.open)document.querySelector('#scenarioDialog').scrollTop=0;
}
async function openScenarios(){
  const dialog=document.querySelector('#scenarioDialog');if(!dialog)return;
  if(!dialog.open){dialog.showModal();document.querySelector('#scenarioDialogTitle')?.focus({preventScroll:true})}
  clearScenarioRandomStatus();
  try{await loadScenarios();renderScenarioList();const game=scenarioGame();if(game?.scenarioId)renderScenarioDetail(game.scenarioId);else document.querySelector('#scenarioBrowser').classList.remove('has-detail')}catch{document.querySelector('#scenarioList').innerHTML='<p class="scenario-empty">시나리오 자료를 불러오지 못했습니다. <button type="button" data-scenario-retry>다시 시도</button></p>'}
}
function chooseScenarioEntry(entry,focus=false){
  const game=scenarioGame();if(!game)return false;
  if(entry.type==='feat'){game.featId=entry.id;if(scenarioData.entries.find(e=>e.id===game.scenarioId)?.type==='patrol')game.scenarioId=''}else{game.scenarioId=entry.id;if(entry.type==='patrol')game.featId=''}
  game.scenarioVersion=scenarioData.version;game.scenarioNames=Object.fromEntries(scenarioData.entries.filter(e=>[game.scenarioId,game.featId].includes(e.id)).map(e=>[e.id,e.nameKo]));
  persistGames();renderGame();renderScenarioDetail(entry.id,focus);toast(entry.type==='feat'&&!game.scenarioId?'업적을 선택했습니다. 함께 사용할 시나리오도 선택하세요.':entry.type==='scenario'&&!game.featId?'시나리오를 선택했습니다. 함께 사용할 업적도 선택하세요.':'모험을 선택했습니다.');
  return true;
}
function pickRandomScenario(){
  const entries=filteredScenarios();if(!entries.length)return;
  const pool=entries.length>1?entries.filter(e=>e.id!==scenarioActive):entries;
  const entry=pool[Math.floor(Math.random()*pool.length)];
  if(!chooseScenarioEntry(entry,true))renderScenarioDetail(entry.id,true);
  const status=document.querySelector('#scenarioRandomStatus');if(status){status.hidden=false;status.textContent=`${scenarioLabels[entry.type]} 랜덤 선택: ${entry.nameKo}${scenarioGame()?' · 플레이에 적용됨':''}`}
}
document.addEventListener('click',async event=>{
  if(event.target.closest('[data-open-scenarios],[data-scenario-retry]')){event.preventDefault();await openScenarios();return}
  if(event.target.closest('[data-scenario-random]')){event.preventDefault();pickRandomScenario();return}
  const category=event.target.closest('[data-scenario-category]');if(category){scenarioCategory=category.dataset.scenarioCategory;clearScenarioRandomStatus();document.querySelector('#scenarioBrowser').classList.remove('has-detail');renderScenarioList();focusScenarioCategory();return}
  const entry=event.target.closest('[data-scenario-entry]');if(entry){clearScenarioRandomStatus();renderScenarioDetail(entry.dataset.scenarioEntry,true);return}
  if(event.target.closest('[data-scenario-back]')){document.querySelector('#scenarioBrowser').classList.remove('has-detail');focusScenarioCategory();return}
  const use=event.target.closest('[data-scenario-use]');if(use){
    const entry=scenarioData?.entries.find(e=>e.id===use.dataset.scenarioUse);if(entry){clearScenarioRandomStatus();chooseScenarioEntry(entry)}
  }
});
document.addEventListener('input',event=>{if(event.target.id==='scenarioSearch'){clearScenarioRandomStatus();document.querySelector('#scenarioBrowser')?.classList.remove('has-detail');renderScenarioList()}});
document.addEventListener('DOMContentLoaded',async()=>{
  if(!document.querySelector('#scenarioBrowser[data-inline]'))return;
  try{await loadScenarios();renderScenarioList();const id=location.hash.slice(1);if(id)renderScenarioDetail(id)}catch{document.querySelector('#scenarioList').textContent='시나리오 자료를 불러오지 못했습니다. 페이지를 새로 고침하세요.'}
});
