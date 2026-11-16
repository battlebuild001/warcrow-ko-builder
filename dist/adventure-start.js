/* A game is committed only after a Patrol or a Scenario + Feat is complete. */
let adventureSetup=null;
const adventureStartDialog=document.getElementById('adventureStartDialog');
const adventureIcons={patrol:'<path d="m12 3 8 4v5c0 4-3 7-8 9-5-2-8-5-8-9V7Z"/><path d="m8 12 3 3 5-6"/>',scenario:'<path d="m3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2Z"/><path d="M9 3v15m6-12v15"/>',random:'<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01"/>'};
function adventureIcon(name){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+adventureIcons[name]+'</svg>';}
function adventureName(entry){return language==='en'?entry.nameEn:language==='bi'?entry.nameKo+' / '+entry.nameEn:entry.nameKo;}
function adventureEntries(){return (scenarioData?.entries||[]).filter(e=>e.type===adventureSetup?.stage);}
function adventureHeading(){
  const stage=adventureSetup?.stage;
  return stage==='patrol'?ui('순찰 선택','Choose a Patrol'):stage==='scenario'?ui('시나리오 선택','Choose a Scenario'):stage==='feat'?ui('업적 선택','Choose a Feat'):ui('모험 선택','Choose an adventure');
}
function renderAdventureSetup(focus=true){
  const flow=adventureSetup;if(!flow)return;
  const stage=flow.stage,scenario=scenarioData?.entries.find(e=>e.id===flow.scenarioId),entries=adventureEntries(),isType=stage==='type';
  const steps=[ui('방식','Format'),ui('모험','Adventure'),ui('업적','Feat')],step=isType?0:stage==='feat'?2:1;
  const progress='<ol class="adventure-steps" aria-label="'+escapeHtml(ui('모험 선택 단계','Adventure setup steps'))+'">'+steps.slice(0,flow.type==='patrol'?2:3).map((label,i)=>'<li'+(i===step?' aria-current="step"':'')+'><span>'+(i+1)+'</span>'+escapeHtml(label)+'</li>').join('')+'</ol>';
  let body='';
  if(flow.loading)body='<p class="adventure-state" role="status">'+escapeHtml(ui('공식 모험을 불러오는 중입니다…','Loading official adventures…'))+'</p>';
  else if(flow.error)body='<div class="adventure-state" role="alert"><p>'+escapeHtml(flow.error)+'</p><button type="button" data-adventure-retry>'+escapeHtml(ui('다시 불러오기','Retry'))+'</button></div>';
  else if(isType){
    const choices=[['patrol',ui('순찰','Patrol'),ui('1개를 고르면 바로 시작','Choose one and start'),ui('MP·AP 목표가 모두 포함된 완성형 모험입니다.','A complete adventure with both MP and AP objectives.')],['scenario',ui('시나리오 + 업적','Scenario + Feat'),ui('시나리오 다음에 업적 선택','Choose a Scenario, then a Feat'),ui('시나리오의 MP 목표와 업적의 AP 목표를 조합합니다.','Combine a Scenario for MP with a Feat for AP.')]];
    body='<p class="adventure-instruction">'+escapeHtml(ui('어떤 모험으로 플레이할까요? 다음 화면에서 직접 또는 랜덤으로 고를 수 있습니다.','Choose a format. On the next screen, pick an adventure yourself or at random.'))+'</p><div class="adventure-formats">'+choices.map(([type,title,subtitle,copy])=>'<button type="button" class="adventure-format" data-adventure-type="'+type+'">'+adventureIcon(type)+'<strong>'+escapeHtml(title)+'</strong><span>'+escapeHtml(subtitle)+'</span><small>'+escapeHtml(copy)+'</small><b aria-hidden="true">→</b></button>').join('')+'</div>';
  }else{
    const instruction=stage==='patrol'?ui('순찰을 고르면 해당 순찰로 게임을 시작합니다.','Picking a Patrol starts the game immediately.'):stage==='scenario'?ui('시나리오를 고른 뒤 함께 사용할 업적을 선택합니다.','Pick a Scenario, then choose its accompanying Feat.'):ui('업적을 고르면 아래 시나리오와 조합하여 게임을 시작합니다.','Picking a Feat starts the game with the Scenario below.');
    const randomLabel=stage==='patrol'?ui('순찰 랜덤으로 시작','Start with a random Patrol'):stage==='scenario'?ui('시나리오 랜덤 선택','Pick a random Scenario'):ui('업적 랜덤으로 시작','Start with a random Feat');
    body='<p class="adventure-instruction">'+escapeHtml(instruction)+'</p>'+(scenario&&stage==='feat'?'<div class="adventure-chosen"><small>'+escapeHtml(ui('선택한 시나리오','Selected Scenario'))+'</small><strong>'+escapeHtml(adventureName(scenario))+'</strong><button type="button" data-adventure-back>'+escapeHtml(ui('변경','Change'))+'</button></div>':'')+'<div class="adventure-list-heading"><span>'+entries.length+' '+escapeHtml(ui('개 중 선택','available'))+'</span><button type="button" class="adventure-random" data-adventure-random'+(!entries.length?' disabled':'')+'>'+adventureIcon('random')+escapeHtml(randomLabel)+'</button></div><div class="adventure-options">'+entries.map(e=>'<article class="adventure-option'+(e.id===flow.scenarioId?' is-selected':'')+'"><button type="button" class="adventure-pick" data-adventure-entry="'+escapeHtml(e.id)+'"><strong>'+escapeHtml(adventureName(e))+'</strong>'+(language!=='en'?'<small lang="en">'+escapeHtml(e.nameEn)+'</small>':'')+(language!=='en'?'<span>'+escapeHtml(e.summary||'')+'</span>':'')+'<b>'+escapeHtml(stage==='scenario'?ui('이 시나리오 선택 →','Choose this Scenario →'):ui('선택하고 게임 시작 →','Choose and start →'))+'</b></button><a href="./scenarios.html#'+encodeURIComponent(e.id)+'" target="_blank" rel="noopener noreferrer">'+escapeHtml(ui('전체 규칙 보기 ↗','Read full rules ↗'))+'</a></article>').join('')+'</div>';
  }
  document.getElementById('adventureStartContent').innerHTML='<header class="adventure-head"><span>WARCROW · WTS SEASON 2</span><h2 id="adventureStartTitle" tabindex="-1">'+escapeHtml(adventureHeading())+'</h2><p>'+escapeHtml(flow.roster.name)+'</p><button type="button" class="adventure-close" data-adventure-close aria-label="'+escapeHtml(ui('모험 선택 닫기','Close adventure setup'))+'">×</button>'+progress+'</header><div class="adventure-body">'+body+'<p id="adventureStartError" class="adventure-error" role="alert" hidden></p></div><footer class="adventure-footer">'+(!isType?'<button type="button" data-adventure-back>'+escapeHtml(ui('← 이전','← Back'))+'</button>':'<span></span>')+'<button type="button" data-adventure-close>'+escapeHtml(ui('편성으로 돌아가기','Return to army'))+'</button></footer>';
  adventureStartDialog.scrollTop=0;if(focus)document.getElementById('adventureStartTitle').focus({preventScroll:true});
}
async function loadAdventureSetup(flow){
  flow.loading=true;flow.error='';renderAdventureSetup();
  try{await loadScenarios();if(adventureSetup!==flow||!adventureStartDialog.open)return;flow.loading=false;renderAdventureSetup();}
  catch{if(adventureSetup!==flow||!adventureStartDialog.open)return;flow.loading=false;flow.error=ui('모험 자료를 불러오지 못했습니다. 다시 시도해 주세요.','Could not load adventures. Please retry.');renderAdventureSetup();}
}
function beginAdventureSetup(){
  if(adventureStartDialog.open){document.getElementById('adventureStartTitle')?.focus({preventScroll:true});return;}
  const roster=captureRosterForPlay();if(!roster.units.length){toast(ui('플레이할 유닛을 먼저 골라 주세요.','Add a unit first.'));return;}
  adventureSetup={roster,stage:'type',type:'',scenarioId:'',loading:true,error:'',committing:false,returnFocus:document.activeElement};
  renderAdventureSetup(false);adventureStartDialog.showModal();loadAdventureSetup(adventureSetup);
}
function adventureBack(){
  const flow=adventureSetup;if(!flow||flow.committing)return;
  if(flow.stage==='feat')flow.stage='scenario';else{flow.stage='type';flow.type='';flow.scenarioId='';}
  renderAdventureSetup();
}
function chooseAdventureEntry(id){
  const flow=adventureSetup;if(!flow||!adventureStartDialog.open||flow.loading||flow.error||flow.committing)return;
  const entry=adventureEntries().find(e=>e.id===id);if(!entry)return;
  if(entry.type==='scenario'){flow.scenarioId=entry.id;flow.stage='feat';renderAdventureSetup();return;}
  const scenario=entry.type==='patrol'?entry:scenarioData.entries.find(e=>e.id===flow.scenarioId&&e.type==='scenario');if(!scenario)return;
  flow.committing=true;
  const selected=entry.type==='feat'?[scenario,entry]:[scenario],adventure={scenarioId:scenario.id,featId:entry.type==='feat'?entry.id:'',scenarioVersion:scenarioData.version,scenarioNames:Object.fromEntries(selected.map(e=>[e.id,e.nameKo]))};
  const game=confirmRoster(flow.roster,adventure);
  if(!game){flow.committing=false;const error=document.getElementById('adventureStartError');error.hidden=false;error.textContent=ui('게임을 저장하지 못했습니다. 브라우저 저장 공간을 확인하고 다시 선택해 주세요.','Could not save the game. Check browser storage and try again.');return;}
  adventureSetup=null;adventureStartDialog.close();document.querySelector('#playUnitTabs [aria-selected="true"]')?.focus({preventScroll:true});
}
document.addEventListener('click',event=>{
  if(!adventureSetup||!adventureStartDialog.open||!event.target.closest('#adventureStartDialog'))return;
  if(event.target.closest('[data-adventure-close]')){adventureStartDialog.close();return;}
  if(event.target.closest('[data-adventure-retry]')){loadAdventureSetup(adventureSetup);return;}
  if(event.target.closest('[data-adventure-back]')){adventureBack();return;}
  const type=event.target.closest('[data-adventure-type]');if(type){if(adventureSetup.loading||!['patrol','scenario'].includes(type.dataset.adventureType))return;adventureSetup.type=type.dataset.adventureType;adventureSetup.stage=type.dataset.adventureType;adventureSetup.scenarioId='';renderAdventureSetup();return;}
  if(event.target.closest('[data-adventure-random]')){const pool=adventureEntries();if(pool.length)chooseAdventureEntry(pool[Math.floor(Math.random()*pool.length)].id);return;}
  const entry=event.target.closest('[data-adventure-entry]');if(entry)chooseAdventureEntry(entry.dataset.adventureEntry);
});
adventureStartDialog.addEventListener('close',()=>{if(adventureStartDialog.open)return;const flow=adventureSetup;adventureSetup=null;if(flow?.returnFocus?.isConnected)flow.returnFocus.focus({preventScroll:true});});
