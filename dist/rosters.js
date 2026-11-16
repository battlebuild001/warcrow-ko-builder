/* Browser-local roster library. JSON backups remain portable across browsers. */
const rosterLibraryKey='warcrow-ko-draft-lists-v1';
let rosterLibraryCache=null,rosterLastStorageError='',rosterUndoRecord=null,rosterLastDownload=null;
function rosterText(ko,en){return typeof ui==='function'?ui(ko,en):ko;}
function rosterEscape(value){return typeof escapeHtml==='function'?escapeHtml(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function rosterElement(id){return document.getElementById(id);}
function rosterId(){return typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function'?crypto.randomUUID():`roster-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,12)}`;}
function rosterClone(value){return JSON.parse(JSON.stringify(value));}
function rosterValidDate(value){return typeof value==='string'&&Number.isFinite(Date.parse(value));}
function rosterReport(message,type='info',notify=true){
  const el=rosterElement('rosterStatus');if(el){el.textContent=message;el.dataset.status=type;el.setAttribute('role',type==='error'?'alert':'status');el.hidden=!message;}
  if(notify&&message&&typeof toast==='function')toast(message);
}
function rosterStorageFailure(error){
  const message=rosterText('브라우저 저장소를 읽거나 기록할 수 없습니다. 목록은 덮어쓰지 않았습니다. JSON 파일로 백업할 수 있습니다.','Browser storage could not be read or written. Existing lists were not overwritten. You can export a JSON backup.');
  rosterReport(message,'error',rosterLastStorageError!==message);rosterLastStorageError=message;
  const note=rosterElement('rosterStorageNote');if(note){note.textContent=message;note.dataset.status='error';}
  return error;
}
function rosterWriteLibrary(items){
  try{const raw=JSON.stringify(items);localStorage.setItem(rosterLibraryKey,raw);rosterLibraryCache={raw,items};rosterLastStorageError='';return true;}catch(error){rosterStorageFailure(error);return false;}
}
function rosterReadLibrary(){
  let raw;try{raw=localStorage.getItem(rosterLibraryKey)||'[]';}catch(error){rosterStorageFailure(error);return {items:rosterLibraryCache?.items||[],error};}
  if(rosterLibraryCache?.raw===raw)return {items:rosterLibraryCache.items,error:null};
  let stored;try{stored=JSON.parse(raw);if(!Array.isArray(stored))throw Error('The roster library must be an array.');}catch(error){rosterStorageFailure(error);return {items:[],error};}
  const used=new Set();let changed=false;
  const items=stored.map(item=>{
    const object=item&&typeof item==='object'&&!Array.isArray(item)?{...item}:{legacyRecord:item};
    if(typeof object.id!=='string'||!object.id||used.has(object.id)){object.id=rosterId();changed=true;}used.add(object.id);
    if(!object.updatedAt&&rosterValidDate(object.createdAt)){object.updatedAt=object.createdAt;changed=true;}
    return object;
  });
  if(changed){if(!rosterWriteLibrary(items)){rosterLibraryCache={raw,items};return {items,error:Error('Legacy roster migration could not be persisted.')};}}
  else{rosterLibraryCache={raw,items};rosterLastStorageError='';}
  return {items,error:null};
}
function getSaved(){return rosterReadLibrary().items;}
function rosterCurrentGame(){return typeof screen!=='undefined'&&screen==='game'&&typeof activeGame==='function'?activeGame():null;}
function getRosterSnapshot(){
  const game=rosterCurrentGame(),now=new Date().toISOString();
  if(game){return {id:game.savedRosterId||'',name:String(game.name||''),faction:game.faction,mode:game.mode||'wts',limit:game.limit??250,commander:game.commander||'',quantities:Object.fromEntries((game.units||[]).map(u=>[u.id,u.quantity??1])),joins:rosterClone(game.joins||[]),sourceVersion:game.sourceVersion||(typeof data!=='undefined'?data.version:''),createdAt:game.confirmedAt||now,updatedAt:now};}
  const draft=typeof state!=='undefined'?state:{};
  return {id:draft.savedRosterId||'',name:String(rosterElement('listName')?.value??draft.listName??''),faction:draft.faction,mode:draft.mode||'wts',limit:draft.limit??250,commander:draft.commander||'',quantities:{...(draft.quantities||{})},joins:rosterClone(draft.joins||[]),sourceVersion:typeof data!=='undefined'?data.version:'',updatedAt:now};
}
function rosterDataUnits(faction){return (typeof data!=='undefined'?data.units:[]).filter(u=>u.faction===faction);}
function validateRosterPayload(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error(rosterText('로스터 JSON 객체가 필요합니다.','A roster JSON object is required.'));
  if(input.format&&!['warcrow-ko-draft-v1','warcrow-ko-draft-v2','warcrow-ko-roster-v2'].includes(input.format))throw Error(rosterText('지원하지 않는 로스터 파일 형식입니다.','Unsupported roster file format.'));
  const knownFactions=typeof data!=='undefined'?data.factions:[];if(!knownFactions.some(f=>f.id===input.faction))throw Error(rosterText('알 수 없는 진영입니다.','Unknown faction.'));
  const mode=Object.prototype.hasOwnProperty.call(input,'mode')?input.mode:'wts';if(!['wts','standard'].includes(mode))throw Error(rosterText('게임 방식이 올바르지 않습니다.','Invalid game mode.'));
  const limit=Object.prototype.hasOwnProperty.call(input,'limit')?input.limit:250;if(typeof limit!=='number'||!Number.isInteger(limit)||limit<50||limit>1000)throw Error(rosterText('점수 상한은 50~1000 사이의 정수여야 합니다.','The points limit must be an integer from 50 to 1000.'));
  let quantities={};const hasQuantities=Object.prototype.hasOwnProperty.call(input,'quantities'),hasUnits=Object.prototype.hasOwnProperty.call(input,'units');
  if(hasQuantities){if(!input.quantities||typeof input.quantities!=='object'||Array.isArray(input.quantities))throw Error(rosterText('유닛 수량 형식이 올바르지 않습니다.','Invalid unit quantities.'));quantities={...input.quantities};}
  let unitQuantities=null;
  if(hasUnits){if(!Array.isArray(input.units))throw Error(rosterText('유닛 목록 형식이 올바르지 않습니다.','Invalid unit list.'));unitQuantities={};for(const u of input.units){if(!u||typeof u.id!=='string'||Object.prototype.hasOwnProperty.call(unitQuantities,u.id))throw Error(rosterText('유닛 ID가 없거나 중복되었습니다.','Missing or duplicate unit ID.'));unitQuantities[u.id]=Object.prototype.hasOwnProperty.call(u,'quantity')?u.quantity:1;}if(!hasQuantities)quantities=unitQuantities;}
  if(!hasQuantities&&!hasUnits)throw Error(rosterText('파일에 유닛 수량이 없습니다.','The file has no unit quantities.'));
  const entries=Object.entries(quantities);if(!entries.length)throw Error(rosterText('유닛을 먼저 추가하세요.','Add a unit first.'));
  const allUnits=typeof data!=='undefined'?data.units:[],selected=rosterDataUnits(input.faction);
  for(const [id,quantity]of entries){if(!allUnits.some(u=>u.id===id))throw Error(rosterText(`알 수 없는 유닛 ID: ${id}`,`Unknown unit ID: ${id}`));if(!selected.some(u=>u.id===id))throw Error(rosterText(`선택한 진영에 속하지 않는 유닛: ${id}`,`Unit does not belong to the selected faction: ${id}`));if(typeof quantity!=='number'||!Number.isSafeInteger(quantity)||quantity<=0)throw Error(rosterText(`유닛 수량은 양의 정수여야 합니다: ${id}`,`Unit quantity must be a positive integer: ${id}`));}
  if(entries.reduce((sum,[,quantity])=>sum+quantity,0)>1000)throw Error(rosterText('유닛 개체는 최대 1000개까지 불러올 수 있습니다.','A roster can contain at most 1000 unit instances.'));
  if(hasQuantities&&unitQuantities){const left=Object.keys(quantities).sort(),right=Object.keys(unitQuantities).sort();if(JSON.stringify(left)!==JSON.stringify(right)||left.some(id=>quantities[id]!==unitQuantities[id]))throw Error(rosterText('파일의 두 유닛 수량 목록이 서로 다릅니다.','The file contains inconsistent unit quantities.'));}
  const commander=Object.prototype.hasOwnProperty.call(input,'commander')?input.commander:'';if(typeof commander!=='string'||commander&&!Object.prototype.hasOwnProperty.call(quantities,commander))throw Error(rosterText('지휘관은 편성에 포함된 유닛이어야 합니다.','The commander must be a selected unit.'));
  if(commander){const u=selected.find(x=>x.id===commander),character=typeof joinIsCharacter==='function'?joinIsCharacter(u):(u.characteristics||[]).includes('Character');if(!character)throw Error(rosterText('지휘관은 캐릭터여야 합니다.','The commander must be a Character.'));if(typeof joinRole==='function'&&joinRole(u)!=='officer')throw Error(rosterText('지휘관은 공식 자료에서 장교로 확인된 캐릭터여야 합니다.','The commander must be a Character verified as an Officer in the official data.'));}
  const joins=Object.prototype.hasOwnProperty.call(input,'joins')?input.joins:[];if(!Array.isArray(joins))throw Error(rosterText('합류 배정 형식이 올바르지 않습니다.','Invalid join assignments.'));
  for(const j of joins){if(!j||typeof j.characterId!=='string'||typeof j.targetId!=='string'||!Number.isInteger(Object.prototype.hasOwnProperty.call(j,'characterCopy')?j.characterCopy:0)||!Number.isInteger(Object.prototype.hasOwnProperty.call(j,'targetCopy')?j.targetCopy:0))throw Error(rosterText('합류 개체 정보가 올바르지 않습니다.','Invalid joined instance information.'));}
  const cleanJoins=joins.map(j=>({characterId:j.characterId,characterCopy:j.characterCopy??0,targetId:j.targetId,targetCopy:j.targetCopy??0}));
  if(cleanJoins.length){if(typeof validateJoins!=='function')throw Error(rosterText('합류 규칙 자료가 아직 준비되지 않았습니다.','Join rule data is not ready.'));const result=validateJoins({faction:input.faction,quantities,joins:cleanJoins},data);if(result.issues.length)throw Error(result.issues.join(' '));}
  if(input.name!==undefined&&typeof input.name!=='string')throw Error(rosterText('로스터 이름은 문자열이어야 합니다.','The roster name must be text.'));
  return {id:typeof input.id==='string'?input.id:'',name:(input.name||'').trim(),faction:input.faction,mode,limit,quantities,commander,joins:cleanJoins,sourceVersion:typeof input.sourceVersion==='string'?input.sourceVersion:'',createdAt:rosterValidDate(input.createdAt)?input.createdAt:undefined,updatedAt:rosterValidDate(input.updatedAt)?input.updatedAt:undefined};
}
function rosterAutomaticName(faction,library){const prefix=typeof factionDisplay==='function'?factionDisplay(faction):faction;let number=1;while(library.some(r=>r.name===`${prefix} ${rosterText('로스터','roster')} ${number}`))number++;return `${prefix} ${rosterText('로스터','roster')} ${number}`;}
function updateRosterActions(){const hasUnits=Object.values(getRosterSnapshot().quantities||{}).some(q=>Number(q)>0);for(const id of ['rosterLibrarySave','rosterLibraryExport']){const button=rosterElement(id);if(button)button.disabled=!hasUnits;}}
function rosterDateLabel(item){const value=item.updatedAt||item.createdAt;if(!rosterValidDate(value))return rosterText('저장 날짜 없음','No saved date');return new Date(value).toLocaleString(typeof language!=='undefined'&&language==='en'?'en-US':'ko-KR',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});}
function renderSavedRosters(){
  const {items,error}=rosterReadLibrary(),list=rosterElement('savedList'),count=rosterElement('savedRosterCount');if(count)count.textContent=rosterText(`${items.length}개`,`${items.length} saved`);
  if(list)list.innerHTML=items.length?items.map((item,index)=>{let valid=null;try{valid=validateRosterPayload(item);}catch{}const faction=typeof factionDisplay==='function'?factionDisplay(item.faction):item.faction||rosterText('진영 미확인','Unknown faction'),quantities=item.quantities||Object.fromEntries((Array.isArray(item.units)?item.units:[]).filter(Boolean).map(u=>[u.id,u.quantity??1])),units=rosterDataUnits(item.faction),number=Object.values(quantities).reduce((sum,n)=>sum+(Number.isFinite(Number(n))?Number(n):0),0),points=Object.entries(quantities).reduce((sum,[id,n])=>sum+(units.find(u=>u.id===id)?.pointsCost||0)*(Number(n)||0),0),name=item.name||rosterText('이름 없는 로스터','Unnamed roster');return `<article class="saved-entry saved-roster" data-roster-id="${rosterEscape(item.id)}"><div class="saved-roster-main"><strong>${rosterEscape(name)}</strong><div class="saved-roster-meta"><span>${rosterEscape(faction)}</span><span>${item.mode==='standard'?rosterText('일반전','Standard'):'WTS'}</span><span>${rosterText(`${number}개 유닛`,`${number} units`)} · ${points} / ${rosterEscape(item.limit??250)} PT</span><span>${rosterEscape(rosterDateLabel(item))}</span></div>${valid?'':`<small class="roster-record-warning">${rosterText('현재 자료로 불러올 수 없습니다. 파일로 내보내 원본을 보관할 수 있습니다.','This record cannot be loaded with current data. Export it to preserve the original.')}</small>`}</div><div class="saved-roster-actions"><button type="button" class="button" data-load="${index}" ${valid?'':'disabled'} aria-label="${rosterEscape(name)} ${rosterText('불러오기','load')}">${rosterText('불러오기','Load')}</button><button type="button" class="button button-ghost" data-export-roster="${rosterEscape(item.id)}" aria-label="${rosterEscape(name)} JSON ${rosterText('내보내기','export')}">${rosterText('파일 백업','Export')}</button><button type="button" class="button button-ghost roster-delete" data-delete-roster="${rosterEscape(item.id)}" aria-label="${rosterEscape(name)} ${rosterText('삭제','delete')}">${rosterText('삭제','Delete')}</button></div></article>`;}).join(''):`<div class="empty"><strong>${rosterText('저장한 로스터가 없습니다.','No saved rosters yet.')}</strong><p>${rosterText('현재 편성을 저장하거나 JSON 파일을 가져오세요.','Save the current army or import a JSON file.')}</p></div>`;
  const note=rosterElement('rosterStorageNote');if(note&&!error){note.textContent=rosterText('이 기기의 브라우저에 저장됩니다. 다른 기기로 옮기거나 브라우저 데이터를 지우기 전에는 JSON 파일을 백업하세요.','Saved in this browser on this device. Export JSON before changing devices or clearing browser data.');note.dataset.status='info';}
  const undo=rosterElement('rosterUndo');if(undo){undo.hidden=!rosterUndoRecord;undo.innerHTML=rosterUndoRecord?`<span>${rosterEscape(rosterUndoRecord.item.name||rosterText('로스터','Roster'))} ${rosterText('삭제됨','deleted')}</span> <button type="button" class="roster-undo-action" data-roster-undo>${rosterText('실행 취소','Undo')}</button>`:'';}
  updateRosterActions();
}
function saveList(nameOverride,source=null){
  const library=rosterReadLibrary();if(library.error)return false;
  let snapshot;try{const current=source?.snapshot||getRosterSnapshot();snapshot=validateRosterPayload(typeof nameOverride==='string'?{...current,name:nameOverride}:current);}catch(error){rosterReport(error.message,'error');return false;}
  const previous=library.items.find(item=>item.id===snapshot.id),now=new Date().toISOString();snapshot.id=previous?.id||rosterId();snapshot.name=snapshot.name||rosterAutomaticName(snapshot.faction,library.items);snapshot.createdAt=previous?.createdAt||snapshot.createdAt||now;snapshot.updatedAt=now;
  const next=[snapshot,...library.items.filter(item=>item.id!==snapshot.id)];if(!rosterWriteLibrary(next))return false;
  const game=source?source.game:rosterCurrentGame();if(game){game.savedRosterId=snapshot.id;game.name=snapshot.name;try{if(typeof persistGames==='function')persistGames();}catch{rosterReport(rosterText('로스터는 저장했습니다. 플레이 세션의 저장 연결은 유지하지 못했습니다.','Roster saved, but its play-session link could not be persisted.'),'error');renderSavedRosters();return snapshot;}}
  else if(typeof state!=='undefined'){state.savedRosterId=snapshot.id;state.listName=snapshot.name;if(rosterElement('listName'))rosterElement('listName').value=snapshot.name;}
  renderSavedRosters();rosterReport(previous?rosterText('저장한 로스터를 업데이트했습니다.','Saved roster updated.'):rosterText('로스터를 이 브라우저에 저장했습니다.','Roster saved in this browser.'),'success');return snapshot;
}
function rosterExportPayload(snapshot){
  const units=rosterDataUnits(snapshot.faction);return {...rosterClone(snapshot),format:'warcrow-ko-draft-v2',schemaVersion:2,exportedAt:new Date().toISOString(),units:Object.entries(snapshot.quantities||{}).map(([id,quantity])=>{const u=units.find(x=>x.id===id);return {id,name:u?.name||id,quantity,pointsCost:u?.pointsCost??null,command:u?.command??null};})};
}
function rosterDownload(payload){
  const text=JSON.stringify(payload,null,2),blob=new Blob([text],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`warcrow-${String(payload.name||payload.faction||'roster').replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_')}.json`;a.hidden=true;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);rosterLastDownload={name:a.download,payload};return payload;
}
function exportList(){
  let snapshot;try{snapshot=validateRosterPayload(getRosterSnapshot());snapshot.name=snapshot.name||rosterAutomaticName(snapshot.faction,getSaved());rosterDownload(rosterExportPayload(snapshot));}catch(error){rosterReport(error.message||rosterText('JSON 파일을 내보내지 못했습니다.','Could not export the JSON file.'),'error');return false;}
  rosterReport(rosterText('현재 로스터를 JSON 파일로 내보냈습니다.','Current roster exported as JSON.'),'success');return snapshot;
}
function exportSavedRoster(id){
  const item=getSaved().find(x=>x.id===id);if(!item)return false;
  try{let payload;try{payload=rosterExportPayload(validateRosterPayload(item));}catch{payload=rosterClone(item);}rosterDownload(payload);rosterReport(rosterText('저장된 로스터를 JSON 파일로 내보냈습니다. 현재 편성은 바뀌지 않습니다.','Saved roster exported as JSON. The current army is unchanged.'),'success');return payload;}catch(error){rosterReport(error.message,'error');return false;}
}
function applyRosterDraft(snapshot,savedId=''){
  Object.assign(state,{faction:snapshot.faction,mode:snapshot.mode,limit:snapshot.limit,quantities:{...snapshot.quantities},commander:snapshot.commander,joins:rosterClone(snapshot.joins),savedRosterId:savedId,listName:snapshot.name,query:'',type:'all',availableOnly:false,sort:'points'});
  for(const [id,value]of [['listName',snapshot.name],['pointsLimit',snapshot.limit],['searchInput',''],['typeFilter','all'],['sortSelect','points']]){const el=rosterElement(id);if(el)el.value=value;}
  if(rosterElement('availableOnly'))rosterElement('availableOnly').checked=false;document.querySelectorAll('input[name="mode"]').forEach(input=>input.checked=input.value===snapshot.mode);
  if(typeof screen!=='undefined')screen='builder';if(typeof setArmyDrawer==='function')setArmyDrawer(false);const dialog=rosterElement('loadDialog');if(dialog?.open)dialog.close();if(typeof render==='function')render();if(typeof window!=='undefined'&&typeof window.scrollTo==='function')window.scrollTo(0,0);return snapshot;
}
function loadSavedRoster(index){
  const items=getSaved(),item=typeof index==='string'?items.find(item=>item.id===index):items[Number(index)];if(!item){rosterReport(rosterText('저장된 로스터를 찾을 수 없습니다.','Saved roster not found.'),'error');return false;}
  let snapshot;try{snapshot=validateRosterPayload(item);}catch(error){rosterReport(error.message,'error');return false;}
  applyRosterDraft(snapshot,item.id);rosterReport(rosterText('저장한 로스터를 편집용으로 불러왔습니다.','Saved roster loaded for editing.'),'success');return snapshot;
}
async function importRosterFile(file){
  if(!file)return false;
  if(typeof file.size==='number'&&file.size>2*1024*1024){rosterReport(rosterText('로스터 JSON 파일은 2MB 이하여야 합니다.','Roster JSON files must be 2 MB or smaller.'),'error');return false;}
  let snapshot;try{const text=typeof file.text==='function'?await file.text():await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error||Error('Read failed'));reader.readAsText(file);});let parsed;try{parsed=JSON.parse(text);}catch{throw Error(rosterText('올바른 JSON 파일이 아닙니다.','This is not a valid JSON file.'));}snapshot=validateRosterPayload(parsed);}catch(error){rosterReport(error.message||rosterText('파일을 읽을 수 없습니다.','Could not read the file.'),'error');return false;}
  applyRosterDraft(snapshot,'');rosterReport(rosterText('JSON 로스터를 편집용으로 가져왔습니다. 저장을 누르면 새 목록으로 보관합니다.','JSON roster imported for editing. Save it to create a new library entry.'),'success');return snapshot;
}
function showSaved(){renderSavedRosters();const dialog=rosterElement('loadDialog');if(dialog&&!dialog.open)dialog.showModal();rosterElement('rosterLibraryTitle')?.focus({preventScroll:true});}
function deleteSavedRoster(id){const library=rosterReadLibrary();if(library.error)return false;const index=library.items.findIndex(x=>x.id===id);if(index<0)return false;const item=library.items[index];if(!rosterWriteLibrary(library.items.filter(x=>x.id!==id)))return false;rosterUndoRecord={item:rosterClone(item),index};renderSavedRosters();rosterReport(rosterText('로스터를 삭제했습니다. 실행 취소로 복원할 수 있습니다.','Roster deleted. Use Undo to restore it.'),'success');rosterElement('rosterUndo')?.querySelector('button')?.focus();return true;}
function undoRosterDeletion(){if(!rosterUndoRecord)return false;const library=rosterReadLibrary();if(library.error)return false;if(library.items.some(x=>x.id===rosterUndoRecord.item.id)){rosterReport(rosterText('같은 ID의 로스터가 이미 있습니다. 복원하지 않았습니다.','A roster with that ID already exists. Nothing was restored.'),'error');return false;}const next=[...library.items];next.splice(Math.min(rosterUndoRecord.index,next.length),0,rosterUndoRecord.item);if(!rosterWriteLibrary(next))return false;rosterUndoRecord=null;renderSavedRosters();rosterReport(rosterText('삭제한 로스터를 복원했습니다.','Deleted roster restored.'),'success');return true;}
document.addEventListener('click',event=>{
  const button=event.target.closest?.('button');if(!button)return;
  if(button.matches('[data-roster-save]')&&button.id!=='saveButton'){openRosterSaveDialog();return;}
  if(button.matches('[data-roster-export]')&&button.id!=='exportButton'){exportList();return;}
  if(button.matches('[data-roster-import]')){rosterElement('rosterImportInput')?.click();return;}
  if(button.hasAttribute('data-export-roster')){exportSavedRoster(button.dataset.exportRoster);return;}
  if(button.hasAttribute('data-delete-roster')){deleteSavedRoster(button.dataset.deleteRoster);return;}
  if(button.matches('[data-roster-undo]'))undoRosterDeletion();
});
document.addEventListener('change',async event=>{if(event.target.id!=='rosterImportInput')return;const file=event.target.files?.[0];if(file)await importRosterFile(file);event.target.value='';});

function openRosterSaveDialog(){
  let snapshot;try{snapshot=validateRosterPayload(getRosterSnapshot());}catch(error){rosterReport(error.message,'error');return false;}
  let dialog=rosterElement('rosterSaveDialog');if(dialog?.open)return false;
  const source={snapshot,game:rosterCurrentGame()},opener=document.activeElement;
  if(!dialog){dialog=document.createElement('dialog');dialog.id='rosterSaveDialog';dialog.className='roster-save-dialog';document.body.append(dialog);}
  dialog.setAttribute('aria-labelledby','rosterSaveTitle');
  dialog.innerHTML='<form class="roster-name-form" novalidate><header class="roster-name-header"><h2 id="rosterSaveTitle">'+rosterText('로스터 저장','Save roster')+'</h2><button type="button" class="roster-name-close" data-cancel-roster-name aria-label="'+rosterText('닫기','Close')+'">×</button></header><label for="rosterSaveName">'+rosterText('로스터 이름','Roster name')+'</label><input id="rosterSaveName" name="rosterName" type="text" maxlength="60" required autocomplete="off" enterkeyhint="done" aria-describedby="rosterNameHint rosterNameError"><p id="rosterNameHint" class="roster-name-hint">'+rosterText('최대 60자','Up to 60 characters')+'</p><p id="rosterNameError" class="roster-name-error" role="alert" hidden></p><div class="roster-name-actions"><button type="button" data-cancel-roster-name>'+rosterText('취소','Cancel')+'</button><button type="submit" id="rosterNameConfirm">'+rosterText('저장','Save')+'</button></div></form>';
  const input=dialog.querySelector('#rosterSaveName'),error=dialog.querySelector('#rosterNameError');
  input.value=snapshot.name;input.placeholder=rosterText('예: 주말 게임 250점','e.g. Weekend army 250 pts');
  const showError=message=>{error.textContent=message;error.hidden=false;input.setAttribute('aria-invalid','true');input.focus({preventScroll:true});};
  input.addEventListener('input',()=>{error.hidden=true;error.textContent='';input.removeAttribute('aria-invalid');});
  dialog.querySelectorAll('[data-cancel-roster-name]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
  dialog.querySelector('form').addEventListener('submit',event=>{
    event.preventDefault();const name=input.value.trim();
    if(!name){showError(rosterText('로스터 이름을 입력하세요.','Enter a roster name.'));return;}
    if(name.length>60){showError(rosterText('이름은 60자 이내로 입력하세요.','Use 60 characters or fewer.'));return;}
    const saved=saveList(name,source);
    if(!saved){error.textContent=rosterElement('rosterStatus')?.textContent||rosterText('저장하지 못했습니다. 다시 시도하세요.','Could not save. Please try again.');error.hidden=false;return;}
    if(source.game&&source.game===rosterCurrentGame()&&typeof renderGame==='function')renderGame();
    dialog.close();
  });
  dialog.addEventListener('close',()=>{if(opener?.isConnected&&typeof opener.focus==='function')opener.focus({preventScroll:true});},{once:true});
  dialog.showModal();input.focus({preventScroll:true});input.select();return true;
}
