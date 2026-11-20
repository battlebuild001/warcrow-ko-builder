/* Official scenario reference; choosing one never modifies the army or tracks points. */
let scenarioData=null,scenarioLoading=null,scenarioCategory='all',scenarioActive='';
const scenarioLabels={all:'전체',patrol:'순찰',scenario:'시나리오',feat:'업적'};
const scenarioTypeDescriptions={
  patrol:{title:'순찰',choice:'1개로 바로 플레이',text:'하나로 완성되는 기본 모험입니다. 군사 점수(MP)와 비전 점수(AP)의 획득 방법이 모두 들어 있어 업적을 추가하지 않습니다.'},
  scenario:{title:'시나리오',choice:'업적 1개와 조합',text:'표준 모험의 배치·진행 방식과 군사 점수(MP)의 획득 방법을 정합니다. 업적 1개를 함께 선택하세요.'},
  feat:{title:'업적',choice:'시나리오 1개와 조합',text:'이번 경기의 추가 득점 목표로, 비전 점수(AP)의 획득 방법을 정합니다. 단독으로 사용하거나 순찰에 붙이지 않습니다. 게임 기간은 함께 선택한 시나리오를 따릅니다.'}
};
function mountScenarioTypeGuide(){
  const browser=document.querySelector('#scenarioBrowser');if(!browser||document.querySelector('#scenarioTypeGuide'))return;
  const guide=document.createElement('details');guide.id='scenarioTypeGuide';guide.className='scenario-type-guide';guide.open=true;
  guide.innerHTML='<summary>순찰·시나리오·업적은 어떻게 다른가요?</summary><dl>'+Object.entries(scenarioTypeDescriptions).map(([type,item])=>`<div data-scenario-type-row="${type}"><dt>${item.title}<small>${item.choice}</small></dt><dd>${item.text}</dd></div>`).join('')+'</dl><p class="scenario-type-score"><strong>승점(VP) = 군사 점수(MP) + 비전 점수(AP)</strong><span>처음이라면 규칙 수가 상대적으로 적은 순찰 1개로 시작해 보세요.</span><span id="scenarioDurationNote"></span></p><a class="scenario-type-source" href="./rules.html#wts-10" target="_blank" rel="noopener noreferrer">WTS 시즌 2 · 모험 구성과 점수 규정 10쪽 ↗</a>';
  browser.before(guide);
}
function scenarioEsc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function scenarioText(html){const el=document.createElement('div');el.innerHTML=html||'';return el.textContent||''}
function scenarioGame(){return typeof activeGame==='function'&&typeof screen!=='undefined'&&screen==='game'?activeGame():null}
async function loadScenarios(){
  if(scenarioData)return scenarioData;
  if(!scenarioLoading)scenarioLoading=fetch('./scenarios-data.json?v=52').then(r=>{if(!r.ok)throw Error('scenario data');return r.json()}).then(d=>{scenarioData=d;for(const e of d.entries)e.searchText=[e.nameKo,e.nameEn,e.summary,scenarioText(e.html)].join(' ').toLocaleLowerCase().replace(/\s/g,'');return d}).catch(e=>{scenarioLoading=null;throw e});
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
function focusScenarioCategory(){document.querySelector(`[data-scenario-category="${scenarioCategory}"]`)?.focus({preventScroll:true})}
function renderScenarioList(){
  const list=document.querySelector('#scenarioList');if(!list||!scenarioData)return;
  const entries=filteredScenarios();
  const durationNote=document.querySelector('#scenarioDurationNote');if(durationNote)durationNote.textContent=scenarioData.durationNote||'';
  list.innerHTML=`<p class="scenario-result-count">${entries.length}개 · WTS 시즌 2 · ${scenarioEsc(scenarioData.version)}</p>${entries.map(e=>`<button type="button" class="scenario-entry${scenarioActive===e.id?' is-active':''}" data-scenario-entry="${scenarioEsc(e.id)}" aria-pressed="${scenarioActive===e.id}"><span>${scenarioLabels[e.type]}</span><strong>${scenarioEsc(e.nameKo)}</strong><small lang="en">${scenarioEsc(e.nameEn)}</small><p>${scenarioEsc(e.summary||'')}</p></button>`).join('')||'<p class="scenario-empty">검색 결과가 없습니다. 이름이나 규칙 용어로 검색해 보세요.</p>'}`;
  document.querySelectorAll('[data-scenario-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scenarioCategory===scenarioCategory)));
  document.querySelectorAll('[data-scenario-type-row]').forEach(row=>row.classList.toggle('is-current',row.dataset.scenarioTypeRow===scenarioCategory));
}
function renderScenarioDetail(id,focus=false){
  const entry=scenarioData?.entries.find(e=>e.id===id),detail=document.querySelector('#scenarioDetail');if(!entry||!detail)return;
  scenarioActive=id;const game=scenarioGame(),chosen=game&&(game.scenarioId===id||game.featId===id);
  const maps=entry.mapImages||[];
  detail.hidden=false;
  detail.innerHTML=`<button type="button" class="scenario-back" data-scenario-back>← 목록</button><header class="scenario-detail-head"><span>${scenarioLabels[entry.type]} · 공식 ${entry.pages.join('·')}쪽</span><h2 tabindex="-1" id="scenarioEntryTitle">${scenarioEsc(entry.nameKo)}</h2><p lang="en">${scenarioEsc(entry.nameEn)}</p>${game?`<button type="button" class="scenario-use" data-scenario-use="${scenarioEsc(id)}" ${chosen?'disabled':''}>${chosen?'현재 선택됨':entry.type==='feat'?'이 업적 선택':'이 모험 선택'}</button>`:''}</header>${scenarioTypeDescriptions[entry.type]?`<p class="scenario-note"><strong>${scenarioTypeDescriptions[entry.type].title} · ${scenarioTypeDescriptions[entry.type].choice}</strong><br>${scenarioTypeDescriptions[entry.type].text}</p>`:''}<div class="scenario-rules">${entry.html}</div>${maps.length?`<section class="scenario-maps"><h3>공식 배치도</h3><p>배치 구역·목표물·거리 표시는 아래 공식 도해를 기준으로 확인하세요.</p>${maps.map(m=>`<figure><a href="${scenarioEsc(m.src)}" target="_blank" rel="noopener noreferrer" aria-label="${scenarioEsc(m.alt||'공식 배치도')} 원본 크기 열기"><img src="${scenarioEsc(m.src)}" alt="${scenarioEsc(m.alt||entry.nameKo+' 공식 배치도')}" loading="lazy"></a><figcaption>${scenarioEsc(m.alt||'공식 원문 배치도')} · 누르면 원본 크기로 열립니다.</figcaption></figure>`).join('')}</section>`:''}<p class="scenario-citation">WTS 시즌 2 · ${scenarioEsc(scenarioData.version)} · 영문 ${entry.pages.join(', ')}쪽${entry.spanishPages?` · 스페인어 ${entry.spanishPages.join(', ')}쪽`:''}<br>${entry.languageVerificationNote?`${scenarioEsc(entry.languageVerificationNote)}<br>`:''}<a href="${scenarioEsc(entry.downloadUrl||entry.sourceUrl||scenarioData.sourceUrl)}" target="_blank" rel="noopener noreferrer">공식 영문 PDF ↗</a>${entry.spanishDownloadUrl?` · <a href="${scenarioEsc(entry.spanishDownloadUrl)}" target="_blank" rel="noopener noreferrer">우선 적용 스페인어 PDF ↗</a>`:''}</p>`;
  document.querySelector('#scenarioBrowser')?.classList.add('has-detail');renderScenarioList();
  if(focus)document.querySelector('#scenarioEntryTitle').focus({preventScroll:true});
  if(document.querySelector('#scenarioDialog')?.open)document.querySelector('#scenarioDialog').scrollTop=0;
}
async function openScenarios(){
  const dialog=document.querySelector('#scenarioDialog');if(!dialog)return;
  if(!dialog.open){dialog.showModal();document.querySelector('#scenarioDialogTitle')?.focus({preventScroll:true})}

  try{await loadScenarios();renderScenarioList();const game=scenarioGame();if(game?.scenarioId)renderScenarioDetail(game.scenarioId);else document.querySelector('#scenarioBrowser').classList.remove('has-detail')}catch{document.querySelector('#scenarioList').innerHTML='<p class="scenario-empty">시나리오 자료를 불러오지 못했습니다. <button type="button" data-scenario-retry>다시 시도</button></p>'}
}
function chooseScenarioEntry(entry,focus=false){
  const game=scenarioGame();if(!game)return false;
  if(entry.type==='feat'){game.featId=entry.id;if(scenarioData.entries.find(e=>e.id===game.scenarioId)?.type==='patrol')game.scenarioId=''}else{game.scenarioId=entry.id;if(entry.type==='patrol')game.featId=''}
  game.scenarioVersion=scenarioData.version;game.scenarioNames=Object.fromEntries(scenarioData.entries.filter(e=>[game.scenarioId,game.featId].includes(e.id)).map(e=>[e.id,e.nameKo]));
  persistGames();renderGame();renderScenarioDetail(entry.id,focus);toast(entry.type==='feat'&&!game.scenarioId?'업적을 선택했습니다. 함께 사용할 시나리오도 선택하세요.':entry.type==='scenario'&&!game.featId?'시나리오를 선택했습니다. 함께 사용할 업적도 선택하세요.':'모험을 선택했습니다.');
  return true;
}
document.addEventListener('click',async event=>{
  if(event.target.closest('[data-open-scenarios],[data-scenario-retry]')){event.preventDefault();await openScenarios();return}
  const category=event.target.closest('[data-scenario-category]');if(category){scenarioCategory=category.dataset.scenarioCategory;document.querySelector('#scenarioBrowser').classList.remove('has-detail');renderScenarioList();focusScenarioCategory();return}
  const entry=event.target.closest('[data-scenario-entry]');if(entry){renderScenarioDetail(entry.dataset.scenarioEntry,true);return}
  if(event.target.closest('[data-scenario-back]')){document.querySelector('#scenarioBrowser').classList.remove('has-detail');focusScenarioCategory();return}
  const use=event.target.closest('[data-scenario-use]');if(use){
    const entry=scenarioData?.entries.find(e=>e.id===use.dataset.scenarioUse);if(entry){chooseScenarioEntry(entry)}
  }
});
document.addEventListener('input',event=>{if(event.target.id==='scenarioSearch'){document.querySelector('#scenarioBrowser')?.classList.remove('has-detail');renderScenarioList()}});
document.addEventListener('DOMContentLoaded',async()=>{
  if(!document.querySelector('#scenarioBrowser[data-inline]'))return;
  try{await loadScenarios();renderScenarioList();const id=location.hash.slice(1);if(id)renderScenarioDetail(id)}catch{document.querySelector('#scenarioList').textContent='시나리오 자료를 불러오지 못했습니다. 페이지를 새로 고침하세요.'}
});

mountScenarioTypeGuide();
