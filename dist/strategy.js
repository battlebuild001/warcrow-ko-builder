/* Source-backed Korean strategy reader. Example rosters are explicit practice proposals. */
const st$=s=>document.querySelector(s),stEscape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let strategyCommon=null,strategyGuides=[],strategyUnits=[],strategyNames={},strategySearchIndex=[];
const strategyKinds={official:'공식 규칙·자료',analysis:'프로필 기반 운영 제안',community:'커뮤니티 해설'};
const strategySourceTypes={official:'공식',video:'영상',community:'커뮤니티',tournament:'대회'};
function strategyURL(value){try{const url=new URL(value,location.href);return /^https?:$/.test(url.protocol)?url.href:'#';}catch{return '#';}}
function strategyUnit(guide,id){return strategyUnits.find(u=>u.id===id&&u.faction===guide.id)||null;}
function strategyUnitName(guide,id){const unit=strategyUnit(guide,id);return unit?(strategyNames[unit.name]||unit.name):id;}
function strategyParagraphs(values){return (values||[]).map(v=>'<p>'+stEscape(v)+'</p>').join('');}
function strategyList(values,ordered=false){if(!values?.length)return '';const tag=ordered?'ol':'ul';return '<'+tag+'>'+values.map(v=>'<li>'+stEscape(v)+'</li>').join('')+'</'+tag+'>';}
function strategyReferences(guide,ids){const refs=(ids||[]).map(id=>guide.sources?.find(s=>s.id===id)).filter(Boolean);return refs.length?'<div class="strategy-source-refs"><span>근거</span>'+refs.map(s=>'<a href="'+stEscape(strategyURL(s.url))+'" target="_blank" rel="noopener noreferrer" title="'+stEscape(s.title)+'">'+stEscape(strategySourceTypes[s.type]||'출처')+' '+(guide.sources.indexOf(s)+1)+'</a>').join('')+'</div>':'';}
function strategyUnitTags(guide,ids){return '<div class="strategy-unit-tags">'+(ids||[]).map(id=>{const u=strategyUnit(guide,id);return '<a href="./index.html?guideUnit='+encodeURIComponent(id)+'&faction='+encodeURIComponent(guide.id)+'" target="_blank" rel="noopener noreferrer">'+stEscape(strategyUnitName(guide,id))+(u?'<small>'+u.pointsCost+' PT</small>':'')+'</a>';}).join('')+'</div>';}
function strategySection(guide,id,title,body,kind='analysis'){return '<section id="strategy-'+stEscape(guide.id+'-'+id)+'" data-strategy-section="'+stEscape(id)+'" tabindex="-1"><span class="strategy-kind '+stEscape(kind)+'">'+stEscape(strategyKinds[kind]||'자료')+'</span><h2>'+stEscape(title)+'</h2>'+body+'</section>';}
function strategySourceList(sources){return '<ul class="strategy-source-list">'+(sources||[]).map((s,i)=>'<li><a href="'+stEscape(strategyURL(s.url))+'" target="_blank" rel="noopener noreferrer">'+(i+1)+'. '+stEscape(s.title)+' ↗</a><small>'+stEscape(strategySourceTypes[s.type]||'출처')+(s.publishedAt?' · 게시 '+stEscape(s.publishedAt.slice(0,10)):'')+' · 확인 '+stEscape(s.accessedAt||'2026-11-16')+'</small>'+(s.coverage?'<small>'+stEscape(s.coverage)+'</small>':'')+(s.limitations?'<small>범위·시점: '+stEscape(s.limitations)+'</small>':'')+'</li>').join('')+'</ul>';}
function strategyRosterMarkup(guide,roster,index){
  let points=0,com=0,instances=0;
  const rows=Object.entries(roster.quantities).map(([id,n])=>{const u=strategyUnit(guide,id);points+=(u?.pointsCost||0)*n;com+=(u?.command||0)*n;instances+=n;return '<tr><td>'+stEscape(strategyUnitName(guide,id))+(id===roster.commander?' <span class="strategy-kind">지휘관</span>':'')+'</td><td>'+n+'</td><td>'+(u?.pointsCost??'—')+'</td><td>'+((u?.pointsCost||0)*n)+'</td></tr>';}).join('');
  const joins=(roster.joins||[]).map(j=>stEscape(strategyUnitName(guide,j.characterId))+' → '+stEscape(strategyUnitName(guide,j.targetId))).join('<br>');
  return '<div class="strategy-roster"><h3>'+stEscape(roster.title)+'</h3><span class="strategy-kind analysis">연습용 제안 · 대회 우승 명단 아님</span><div class="strategy-table-wrap"><table><thead><tr><th>유닛</th><th>수량</th><th>개당 PT</th><th>합계</th></tr></thead><tbody>'+rows+'</tbody></table></div><div class="strategy-roster-total"><strong>'+points+' / '+roster.limit+' PT</strong><span>시작 COM '+com+'</span><span>편성 '+instances+'개체 · 합류 후 '+(instances-(roster.joins||[]).length)+'개 유닛</span></div><div class="strategy-join-list">'+(joins?'합류 배정<br>'+joins:'합류 배정 없음 · 독립 운용')+'</div><p class="strategy-roster-note">합류가 명시되지 않은 캐릭터는 독립 운용합니다. 일반전 기준 예시이며 WTS 제출 시 시즌·대회 조건을 적용하세요.</p>'+strategyParagraphs([roster.plan])+strategyList(roster.swaps)+'<button type="button" class="strategy-download" data-strategy-download="'+index+'">이 명단 JSON 받기</button><p class="strategy-roster-note">빌더의 불러오기 → 파일 불러오기에서 사용할 수 있습니다.</p>'+strategyReferences(guide,roster.sourceIds)+'</div>';
}
function strategyRenderGuide(guide){
  const toc=[{id:'intro',title:guide.id==='general'?'읽는 방법':guide.title+' 한눈에'}];
  let html='<section class="strategy-intro" id="strategy-'+stEscape(guide.id)+'-intro" data-strategy-section="intro" tabindex="-1"><h2>'+stEscape(guide.title)+'</h2><p class="strategy-tagline">'+stEscape(guide.tagline)+'</p>'+strategyParagraphs([guide.overview])+(guide.styleTags?.length?'<div class="strategy-tags">'+guide.styleTags.map(v=>'<span>'+stEscape(v)+'</span>').join('')+'</div>':'')+'</section>';
  for(const s of guide.sections||[]){toc.push({id:s.id,title:s.title});html+=strategySection(guide,s.id,s.title,strategyParagraphs(s.paragraphs)+strategyList(s.bullets)+strategyUnitTags(guide,s.unitIds)+strategyReferences(guide,s.sourceIds),s.kind);}
  if(guide.unitRoles?.length){toc.push({id:'units',title:'역할별 유닛 선택'});html+=strategySection(guide,'units','역할별 유닛 선택',guide.unitRoles.map(r=>'<div class="strategy-role"><h3>'+stEscape(r.role)+'</h3>'+strategyUnitTags(guide,r.unitIds)+strategyParagraphs([r.why,r.when])+strategyReferences(guide,r.sourceIds)+'</div>').join(''));}
  if(guide.synergies?.length){toc.push({id:'synergy',title:'조합과 합류 선택'});html+=strategySection(guide,'synergy','조합과 합류 선택',guide.synergies.map(s=>'<div class="strategy-synergy"><h3>'+stEscape(s.title)+'</h3>'+strategyUnitTags(guide,s.unitIds)+strategyParagraphs([s.plan])+(s.caution?'<p><strong>확인할 조건</strong> · '+stEscape(s.caution)+'</p>':'')+strategyReferences(guide,s.sourceIds)+'</div>').join(''));}
  if(guide.rosters?.length){toc.push({id:'rosters',title:'250점 연습 로스터'});html+=strategySection(guide,'rosters','250점 연습 로스터',guide.rosters.map((r,i)=>strategyRosterMarkup(guide,r,i)).join(''));}
  if(guide.gamePlan){toc.push({id:'plan',title:'배치·초중후반 운영'});const names={deployment:'배치에서 준비할 것',opening:'초반: 발판과 위협 만들기',midgame:'중반: 역할 교환과 압박',endgame:'후반: 득점으로 우선순위 재정렬',priorities:'활성화 전 우선순위'};html+=strategySection(guide,'plan','배치·초중후반 운영',Object.entries(names).map(([k,v])=>'<h3>'+v+'</h3>'+strategyList(guide.gamePlan[k],k==='priorities')).join(''));}
  if(guide.matchups?.length){toc.push({id:'matchups',title:'상대 유형별 대응'});html+=strategySection(guide,'matchups','상대 유형별 대응',guide.matchups.map(m=>'<div class="strategy-matchup"><h3>'+stEscape(m.opponentType)+'</h3>'+strategyParagraphs([m.plan])+(m.avoid?'<p><strong>피할 선택</strong> · '+stEscape(m.avoid)+'</p>':'')+'</div>').join(''));}
  if(guide.mistakes?.length){toc.push({id:'mistakes',title:'자주 하는 실수'});html+=strategySection(guide,'mistakes','자주 하는 실수',strategyList(guide.mistakes));}
  if(guide.practice?.length){toc.push({id:'practice',title:'연습과 복기'});html+=strategySection(guide,'practice','연습과 복기',strategyList(guide.practice,true));}
  toc.push({id:'sources',title:'출처와 적용 시점'});html+=strategySection(guide,'sources','출처와 적용 시점','<p>공식 자료는 규칙·프로필의 근거, 운영 제안은 그 자료를 바탕으로 한 해석, 커뮤니티 해설은 해당 제작자의 시점과 관점입니다.</p>'+strategySourceList(guide.sources)+(guide.id==='general'?strategyList(strategyCommon.researchLimits):''),'official');
  st$('#strategyToc').innerHTML=toc.map(t=>'<a href="#'+stEscape(guide.id+'/'+t.id)+'">'+stEscape(t.title)+'</a>').join('');st$('#strategyContent').innerHTML=html;
}
function strategyRouteParts(){try{return decodeURIComponent(location.hash.slice(1)).split('/');}catch{return ['general'];}}
function strategyCurrentGuide(){const id=strategyRouteParts()[0]||'general';return strategyGuides.find(g=>g.id===id)||strategyCommon;}
function strategyShowSources(){
  const map=new Map();for(const g of strategyGuides)for(const s of g.sources||[])if(!map.has(s.url))map.set(s.url,s);
  st$('#strategyToc').innerHTML='<a href="#general">기본 가이드</a>';st$('#strategyContent').innerHTML='<section class="strategy-intro"><h2>조사 출처와 적용 범위</h2><p>공식 프로필과 룰북을 먼저 읽고, 공개 영상·전술 글의 의견을 대조했습니다. '+map.size+'개 원문 링크를 모았습니다.</p>'+strategyList(strategyCommon.researchLimits)+'</section><section>'+strategySourceList([...map.values()])+'</section>';
}
function strategyRenderRoute(){
  if(!strategyCommon)return;const [id,section]=strategyRouteParts(),guide=strategyCurrentGuide();
  if(id==='sources')strategyShowSources();else strategyRenderGuide(guide);
  for(const a of st$('#strategyFactions').querySelectorAll('a')){if(a.dataset.strategyGuide===(id==='sources'?'sources':guide.id))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}
  if(section){const guide=strategyCurrentGuide(),target=document.getElementById('strategy-'+guide.id+'-'+section);if(target){target.scrollIntoView({block:'start',behavior:'auto'});target.focus({preventScroll:true});}}
}
function strategyMakeIndex(){
  strategySearchIndex=[];
  for(const g of strategyGuides){
    const add=(id,title,text)=>strategySearchIndex.push({guide:g.id,guideTitle:g.title,id,title,text:String(text||'')});
    const names=id=>{const u=strategyUnit(g,id);return [strategyUnitName(g,id),u?.name,u?.name_es].filter(Boolean).join(' ');};
    add('intro',g.title,[g.tagline,g.overview,...(g.styleTags||[])].join(' '));
    for(const s of g.sections||[])add(s.id,s.title,[...(s.paragraphs||[]),...(s.bullets||[]),...(s.unitIds||[]).map(names)].join(' '));
    for(const r of g.unitRoles||[])add('units',r.role,[r.why,r.when,...r.unitIds.map(names)].join(' '));
    for(const s of g.synergies||[])add('synergy',s.title,[s.plan,s.caution,...s.unitIds.map(names)].join(' '));
    for(const r of g.rosters||[])add('rosters',r.title,[r.plan,...Object.keys(r.quantities).map(names),...(r.swaps||[])].join(' '));
    if(g.gamePlan)for(const [k,values]of Object.entries(g.gamePlan))add('plan','배치·초중후반 운영',values.join(' '));
    for(const m of g.matchups||[])add('matchups',m.opponentType,m.plan+' '+m.avoid);
    if(g.mistakes?.length)add('mistakes','자주 하는 실수',g.mistakes.join(' '));if(g.practice?.length)add('practice','연습과 복기',g.practice.join(' '));
  }
}
function strategySearch(value){
  const q=value.trim().toLocaleLowerCase().replace(/\s/g,''),box=st$('#strategySearchResults');box.hidden=!q;if(!q){box.innerHTML='';return;}
  const results=strategySearchIndex.filter(e=>(e.title+' '+e.guideTitle+' '+e.text).toLocaleLowerCase().replace(/\s/g,'').includes(q));
  box.innerHTML='<p>'+results.length+'개 검색 결과'+(results.length>35?' · 앞의 35개 표시':'')+'</p>'+results.slice(0,35).map(e=>{const pos=e.text.toLocaleLowerCase().indexOf(value.trim().toLocaleLowerCase()),start=Math.max(0,pos-35),snippet=e.text.slice(start,start+170);return '<a class="strategy-search-result" href="#'+stEscape(e.guide+'/'+e.id)+'"><strong>'+stEscape(e.guideTitle)+' · '+stEscape(e.title)+'</strong><span>'+stEscape(snippet)+(snippet.length===170?'…':'')+'</span></a>';}).join('');
}
let strategyLastDownload=null;
function strategyDownload(index){
  const guide=strategyCurrentGuide(),roster=guide.rosters?.[Number(index)];if(!roster)return;
  const payload={format:'warcrow-ko-draft-v2',schemaVersion:2,name:guide.title+' · '+roster.title,faction:guide.id,mode:roster.mode,limit:roster.limit,quantities:{...roster.quantities},commander:roster.commander,joins:JSON.parse(JSON.stringify(roster.joins||[])),sourceVersion:strategyCommon.builderVersion};
  strategyLastDownload={payload};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=(payload.name.replace(/[\\/:*?"<>|]/g,'-')+'.json');document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.addEventListener('click',e=>{const download=e.target.closest('[data-strategy-download]');if(download){strategyDownload(download.dataset.strategyDownload);return;}const result=e.target.closest('.strategy-search-result');if(result){st$('#strategySearch').value='';strategySearch('');}});
st$('#strategySearch').addEventListener('input',e=>strategySearch(e.target.value));st$('#strategyClear').addEventListener('click',()=>{st$('#strategySearch').value='';strategySearch('');st$('#strategySearch').focus();});st$('#strategyPrint').addEventListener('click',()=>window.print());window.addEventListener('hashchange',strategyRenderRoute);
async function loadStrategy(){
  const fetchJSON=async path=>{const r=await fetch(path);if(!r.ok)throw Error(path);return r.json();};
  try{
    strategyCommon=await fetchJSON('./strategy-common.json?v=46');
    const [units,names,...guides]=await Promise.all([fetchJSON('./app-data.json?v=46'),fetchJSON('./card-ko.json?v=46'),...strategyCommon.factions.map(id=>fetchJSON('./strategy-factions/'+id+'.json?v=46'))]);
    strategyUnits=units.units;strategyNames=names.names;strategyGuides=[strategyCommon,...guides];
    st$('#strategyEdition').innerHTML='<span>룰북 '+stEscape(strategyCommon.rulesVersion)+'</span><span>예시 명단 검산: 프로필 '+stEscape(strategyCommon.builderVersion)+'</span><span>자료 확인 '+stEscape(strategyCommon.reviewedAt)+'</span>';
    st$('#strategyFactions').innerHTML=strategyGuides.map(g=>'<a href="#'+stEscape(g.id)+'" data-strategy-guide="'+stEscape(g.id)+'">'+(g.id==='general'?'': '<img src="./faction-art/'+stEscape(g.id)+'.webp" alt="">')+stEscape(g.id==='general'?'공통 운영':g.title)+'</a>').join('')+'<a href="#sources" data-strategy-guide="sources">출처·버전</a>';
    const p=strategyCommon.patchNotice;st$('#strategyPatchNotice').innerHTML='<aside class="strategy-patch"><strong>'+stEscape(p.title)+'</strong><p>'+stEscape(p.text)+'</p><a href="'+stEscape(strategyURL(p.url))+'" target="_blank" rel="noopener noreferrer">공식 11월 변경 공지 ↗</a></aside>';
    strategyMakeIndex();st$('#strategyReader').hidden=false;strategyRenderRoute();st$('#strategyLoading').hidden=true;
  }catch(error){st$('#strategyLoading').textContent='가이드를 불러오지 못했습니다. 새로고침하거나 빌더로 돌아가 다시 열어주세요.';st$('#strategyLoading').setAttribute('role','alert');}
}
loadStrategy();

