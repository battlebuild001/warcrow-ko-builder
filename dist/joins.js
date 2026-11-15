/* Card grouping follows printed Join conditions; activation and battlefield states are not tracked. */
let joinMetadata={units:{},unitNameAliases:{},sourceNotes:[]};
function configureJoins(value){joinMetadata=value&&value.units?value:{units:{},unitNameAliases:{},sourceNotes:[]};}
function joinUi(ko,en){return typeof ui==='function'?ui(ko,en):ko;}
function joinEscape(value){return typeof escapeHtml==='function'?escapeHtml(value??''):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function joinName(unit){return typeof unitName==='function'?unitName(unit):unit.name||unit.id;}
function joinNormalize(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ÿ/g,'y').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function joinUnitMetadata(unit){return joinMetadata.units[unit?.id]||null;}
function joinIsCharacter(unit){const m=joinUnitMetadata(unit);return m?m.isCharacter:(unit?.characteristics||[]).includes('Character')||/Character/.test(unit?.type||'');}
function joinRole(unit){return joinUnitMetadata(unit)?.role||null;}
function joinRoleLabel(unit){const r=joinRole(unit);return r==='officer'?joinUi('장교','Officer'):r==='support'?joinUi('지원','Support'):joinUi('유형 미확인','Type unverified');}
function joinGroups(unit){const m=joinUnitMetadata(unit);if(m)return m.joinGroups||[];return (unit?.keywords||[]).flatMap(k=>{const match=String(k.name||k).match(/^Join\s*\((.*)\)$/i);return match?match[1].split('|').map(g=>g.split(',').map(x=>x.trim()).filter(Boolean)):[];});}
function joinTargetMatches(character,target){
  if(!character||!target||!joinIsCharacter(character)||joinIsCharacter(target)||character.id===target.id)return false;
  const m=joinUnitMetadata(target),terms=[...(m?.traits||target.characteristics||[]),...(m?.keywords||(target.keywords||[]).map(k=>k.name||k)),target.name,m?.name,target.id].map(joinNormalize);
  return joinGroups(character).some(group=>group.length&&group.every(term=>{
    const normalized=joinNormalize(term),ids=joinMetadata.unitNameAliases?.[normalized]||[];
    return terms.includes(normalized)||ids.includes(target.id);
  }));
}
function joinInstanceKey(id,copy=0){return `${id}:${copy}`;}
function joinRosterInstances(roster,source){
  const units=Array.isArray(source)?source:source?.units||[],seen=new Set(),result=[];
  for(const unit of units){if(seen.has(unit.id)||roster?.faction&&unit.faction!==roster.faction)continue;seen.add(unit.id);const n=Math.max(0,Math.floor(Number(roster?.quantities?.[unit.id])||0));for(let copy=0;copy<n;copy++)result.push({unit,copy,instanceKey:joinInstanceKey(unit.id,copy)});}
  return result;
}
function validateJoins(roster,source){
  const instances=joinRosterInstances(roster,source),byKey=new Map(instances.map(i=>[i.instanceKey,i])),characters=new Set(),targets=new Set(),validJoins=[],issues=[],invalidJoins=[];
  for(const input of Array.isArray(roster?.joins)?roster.joins:[]){
    const j={characterId:input?.characterId,characterCopy:input?.characterCopy??0,targetId:input?.targetId,targetCopy:input?.targetCopy??0};let reason='';
    const ckey=joinInstanceKey(j.characterId,j.characterCopy),tkey=joinInstanceKey(j.targetId,j.targetCopy),character=byKey.get(ckey),target=byKey.get(tkey);
    if(!Number.isInteger(j.characterCopy)||!Number.isInteger(j.targetCopy)||j.characterCopy<0||j.targetCopy<0)reason=joinUi('합류 대상의 개체 번호가 올바르지 않습니다.','Invalid instance number.');
    else if(!character||!target)reason=joinUi('편성에서 제거된 개체의 합류 배정을 해제했습니다.','A join refers to an instance no longer in the army.');
    else if(!joinIsCharacter(character.unit))reason=joinUi('캐릭터만 이 합류 기능을 사용할 수 있습니다.','Only Characters may use this join assignment.');
    else if(!joinGroups(character.unit).length)reason=joinUi('Join 조건이 없는 캐릭터는 합류할 수 없습니다.','A Character without Join cannot join a unit.');
    else if(joinIsCharacter(target.unit))reason=joinUi('캐릭터에게 다른 캐릭터를 합류시킬 수 없습니다.','A Character cannot join another Character.');
    else if(!joinTargetMatches(character.unit,target.unit))reason=joinUi('공식 Join 조건을 충족하지 않는 대상입니다.','The target does not meet the official Join requirements.');
    else if(characters.has(ckey))reason=joinUi('같은 캐릭터 개체를 두 유닛에 합류시킬 수 없습니다.','The same Character instance cannot join two units.');
    else if(targets.has(tkey))reason=joinUi('한 유닛 개체에는 캐릭터 한 명만 합류할 수 있습니다.','A unit instance can include only one Character.');
    if(reason){issues.push(reason);invalidJoins.push({join:input,reason});continue;}
    characters.add(ckey);targets.add(tkey);validJoins.push(j);
  }
  return {validJoins,issues,invalidJoins};
}
function joinCopyLabel(instance,all){const n=all.filter(x=>x.unit.id===instance.unit.id).length;return `${joinName(instance.unit)}${n>1?` #${instance.copy+1}`:''}`;}
function renderJoinPlanner(roster=state,source=data){
  const all=joinRosterInstances(roster,source),chars=all.filter(i=>joinIsCharacter(i.unit)&&joinGroups(i.unit).length),targets=all.filter(i=>!joinIsCharacter(i.unit));
  if(!chars.length)return '';
  const valid=validateJoins(roster,source).validJoins;
  const rows=chars.map(c=>{
    const attached=valid.find(j=>j.characterId===c.unit.id&&j.characterCopy===c.copy),current=attached?joinInstanceKey(attached.targetId,attached.targetCopy):'',label=joinCopyLabel(c,all),inputId=`join-select-${c.unit.id}-${c.copy}`;
    const options=targets.map(t=>{const key=t.instanceKey,occupied=valid.some(j=>joinInstanceKey(j.targetId,j.targetCopy)===key&&!(j.characterId===c.unit.id&&j.characterCopy===c.copy)),legal=joinTargetMatches(c.unit,t.unit),reason=occupied?joinUi('다른 캐릭터가 합류 중','Already has a Character'):!legal?joinUi('Join 조건 불일치','Join requirements not met'):'';return `<option value="${joinEscape(key)}" ${current===key?'selected':''} ${reason?'disabled':''}>${joinEscape(joinCopyLabel(t,all))}${reason?` — ${joinEscape(reason)}`:''}</option>`;}).join('');
    const noLegal=!targets.some(t=>joinTargetMatches(c.unit,t.unit)&&!valid.some(j=>joinInstanceKey(j.targetId,j.targetCopy)===t.instanceKey&&!(j.characterId===c.unit.id&&j.characterCopy===c.copy)));
    return `<div class="join-planner-row"><label for="${inputId}"><strong>${joinEscape(label)}</strong><span>${joinEscape(joinRoleLabel(c.unit))} · ${joinEscape((joinUnitMetadata(c.unit)?.joinText||[]).join(' / '))}</span></label><select id="${inputId}" data-join-character="${joinEscape(c.unit.id)}" data-join-copy="${c.copy}" aria-describedby="${inputId}-note"><option value="">${joinUi('독립 운용','Independent')}</option>${options}</select><small id="${inputId}-note">${noLegal?joinUi('현재 편성에 조건을 충족하는 빈 유닛이 없습니다.','There is no eligible unoccupied unit in this army.'):joinUi('각 유닛 개체에 한 명만 배정합니다.','One Character per unit instance.')}${!joinRole(c.unit)?` ${joinUi('공식 카드가 없어 장교·지원 유형은 표시하지 않습니다.','The unavailable source card prevents verifying Officer/Support type.')}`:''}</small></div>`;
  }).join('');
  const relevantNotes=(joinMetadata.sourceNotes||[]).filter(n=>chars.some(c=>n.ids.includes(c.unit.id))).map(n=>`<p class="join-note">${joinEscape(n.messageKo)}</p>`).join('');
  return `<section class="join-planner" aria-labelledby="joinPlannerTitle"><div class="join-section-heading"><h3 id="joinPlannerTitle">${joinUi('캐릭터 합류','Character joins')}</h3><button type="button" data-rule="join">${joinUi('합류 규칙','Join rules')}</button></div><p>${joinUi('배치 시 합류할 유닛을 정합니다. 같은 종류를 여러 개 편성했다면 개체별로 선택하세요.','Assign Characters for deployment. Multiple copies are separate unit instances.')}</p>${rows}${relevantNotes}<small class="join-planner-footnote">${joinUi('플레이 중 합류·해산은 카드 화면에서 처리합니다. 캐릭터의 일반 프로필과 합류 프로필은 함께 적용하지 않습니다.','Join or detach Characters from the card screen. Individual and joined Character profiles do not apply together.')}</small></section>`;
}
function joinGameRoster(game){return {faction:game?.faction,quantities:Object.fromEntries((game?.units||[]).map(u=>[u.id,Math.max(1,Math.floor(Number(u.quantity)||1))])),joins:game?.joins||[]};}
function gameJoinGroups(game){
  const roster=joinGameRoster(game),all=joinRosterInstances(roster,game?.units||[]),valid=validateJoins(roster,game?.units||[]).validJoins,attached=new Set(valid.map(j=>joinInstanceKey(j.characterId,j.characterCopy)));
  return all.filter(i=>!attached.has(i.instanceKey)).map(i=>{const j=valid.find(x=>x.targetId===i.unit.id&&x.targetCopy===i.copy),character=j?all.find(x=>x.unit.id===j.characterId&&x.copy===j.characterCopy)?.unit:null;return {...i,id:i.unit.id,unitId:i.unit.id,quantity:1,character:character||null,characterCopy:j?.characterCopy??null,join:j||null,label:`${joinCopyLabel(i,all)}${character?` + ${joinName(character)}`:''}`,game};});
}
function joinAbilityKey(ability){return String(ability.titleKo||ability.english?.split('.')[0]||'').normalize('NFC').replace(/\s+/g,' ').trim().toLowerCase();}
function joinClone(value){return JSON.parse(JSON.stringify(value));}
function joinHasPool(pool){return !!((pool?.dice||[]).length||(pool?.symbols||[]).length);}
function joinCapDice(dice){const counts={};return dice.filter(c=>(counts[c]=(counts[c]||0)+1)<=3);}
function joinMergePool(target,extra){target.dice=joinCapDice([...(target.dice||[]),...(extra?.dice||[])]);target.symbols=[...(target.symbols||[]),...(extra?.symbols||[])];}
function joinAddModifier(target,extra,targetLabel,extraLabel){
  if(!joinHasPool(extra?.modifier))return;
  const options=target.modifierOptions||(joinHasPool(target.modifier)?[{...joinClone(target.modifier),label:targetLabel}]:[]);
  options.push({...joinClone(extra.modifier),label:extraLabel,mode:'add'});target.modifierOptions=options;
}
function joinedCardData(group){
  const target=group.unit,character=group.character,base=joinClone(nativeCards[target.cardKey]||{}),targetAbilities=cardAbilities[target.cardKey]||[],targetEffects=cardEffects[target.cardKey]||[];
  if(!character)return {profile:base,abilities:targetAbilities,effects:targetEffects};
  const extra=nativeCards[character.cardKey]||{},extraRows=(extra.combat||[]).filter(r=>r.section==='enhancement'),extraAbilities=cardAbilities[character.cardKey]||[],extraEffects=cardEffects[character.cardKey]||[];
  for(const stat of extra.enhancement?.stats||[]){const field={MOV:'mov',W:'w',MOR:'mor'}[stat.label];if(stat.label==='WP'){base.wpDice=joinCapDice(stat.mode==='add'?[...(base.wpDice||[]),...(stat.dice||[])]:[...(stat.dice||[])]);}else if(field){if(stat.mode==='add'){const n=Number(stat.value);if(Number.isFinite(n)&&Number.isFinite(Number(base[field])))base[field]=Number(base[field])+n;}else if(stat.value!==null&&stat.value!==undefined)base[field]=stat.label==='MOV'?stat.value:Number(stat.value);}}
  const effects=joinClone(targetEffects),rows=(base.combat||[]).filter(r=>(r.section||'base')==='base');
  rows.forEach((row,rowIndex)=>{
    for(const erow of extraRows){
      for(const addition of erow.attacks||[]){const matching=(row.attacks||[]).map((a,i)=>({a,i})).filter(({a})=>addition.kind==='all'||a.kind===addition.kind);for(const {a,i}of matching){joinMergePool(a,addition);joinAddModifier(a,addition,joinName(target),joinName(character));for(const ef of extraEffects.filter(e=>e.section==='enhancement'&&e.row===extraRows.indexOf(erow)&&e.columnRole===`attack-${(erow.attacks||[]).indexOf(addition)+1}`))effects.push({...joinClone(ef),section:'base',row:rowIndex,rowKey:row.key,columnRole:`attack-${i+1}`,joinedFrom:character.cardKey});}}
      if(erow.defense&&!erow.defense.hidden&&row.defense){joinMergePool(row.defense,erow.defense);joinAddModifier(row.defense,erow.defense,joinName(target),joinName(character));for(const ef of extraEffects.filter(e=>e.section==='enhancement'&&e.row===extraRows.indexOf(erow)&&e.columnRole==='defense'))effects.push({...joinClone(ef),section:'base',row:rowIndex,rowKey:row.key,columnRole:'defense',joinedFrom:character.cardKey});}
      if(erow.conquest!==null&&erow.conquest!==undefined)row.conquest=erow.conquestMode==='replace'?erow.conquest:(row.conquest??0)+erow.conquest;
    }
  });
  if(Number.isFinite(base.initialTroops))base.initialTroops+=1;
  const rear=extraAbilities.filter(a=>a.section==='enhancement'),titles=new Set(rear.map(joinAbilityKey)),permanent=extraAbilities.filter(a=>(a.section||'base')==='base'&&/\bPermanent\b/i.test(a.english||'')&&!titles.has(joinAbilityKey(a)));
  const skills=[...rear,...permanent].map(a=>({...joinClone(a),section:'base',joinedFrom:character.cardKey}));
  return {profile:base,abilities:[...joinClone(targetAbilities),...skills],effects,characterProfileAvailable:extra.sourceAvailable!==false&&!!(extraRows.length||extra.enhancement||rear.length),character};
}
function joinTokenRules(leaving=false){
  return leaving?joinUi('이탈 토큰 처리: 유닛은 피해·효과 토큰을 유지합니다. 캐릭터는 합류 전에 가졌던 피해만 되찾고, 유닛과 같은 스트레스·상태·팅지를 받습니다. 유닛이 이미 활성화되었다면 활성화 토큰도 받습니다. 사기가 붕괴된 유닛에서 이탈하면 같은 턴 칸에 캐릭터의 사기 붕괴 토큰을 놓습니다. 장교가 이탈하면 새 병사 리더를 지정합니다. 유닛의 능력치는 원래 값으로 돌아갑니다.','Leaving: the unit keeps damage/effects. The Character regains only its pre-join damage and receives the unit’s stress, states and Tinge; also an activation token if the unit already activated. If demoralized, place its own token on the same turn position. Replace a departing Officer with a troop leader. The unit regains its original stats.'):joinUi('합류 토큰 처리: 캐릭터의 피해는 별도로 보관하고 합류 중에는 무시합니다. 스트레스와 팅지는 각각 유닛과 캐릭터 중 더 큰 값을 유닛에 남깁니다. 캐릭터의 상태·효과 토큰은 유닛으로 옮기고 중복 상태는 제거합니다. 활성화 토큰도 유닛으로 옮기되, 이미 있다면 추가 토큰은 제거합니다.','Joining: retain the Character’s damage separately and ignore it while joined. Keep the higher stress and higher Tinge value on the unit. Transfer states/effects; remove duplicate states. Transfer its activation token, discarding the extra if the unit already has one.');
}
function renderJoinedContribution(character){
  const p=nativeCards[character.cardKey]||{},abilities=cardAbilities[character.cardKey]||[],effects=cardEffects[character.cardKey]||[],rows=(p.combat||[]).filter(r=>r.section==='enhancement');
  if(!rows.length&&!p.enhancement&&!abilities.some(a=>a.section==='enhancement'))return '';
  const stats=(p.enhancement?.stats||[]).map(stat=>nativeStat(stat.label,stat.dice?.length?`${stat.mode==='add'?'+ ':''}${stat.dice.map(c=>`<span class="native-glyph die-${joinEscape(c)}"><span>${nativeGlyphs[c]}</span></span>`).join('')}`:joinEscape(stat.value??'—'),'enhancement',true)).join('');
  return `<details class="joined-contribution" data-rule-unit="${joinEscape(character.id)}"><summary>${joinEscape(joinName(character))} · ${joinUi('합류 프로필 원형 보기','Printed joined contribution')}</summary><div class="joined-contribution-body">${stats?`<div class="native-enhancement-stats">${stats}</div>`:''}${rows.map((row,i)=>nativeCombat(row,effects.map((effect,index)=>({effect,index})).filter(({effect})=>effect.section==='enhancement'&&effect.row===i))).join('')}${abilities.map((a,i)=>a.section==='enhancement'?nativeAbility(a,i):'').join('')}</div></details>`;
}
function renderJoinedGroup(group){
  if(!group?.character)return nativeUnitCard(group?.unit||group);
  const combined=joinedCardData(group),role=joinRole(group.character),note=joinUi(`${joinName(group.character)} 합류 · ${joinRoleLabel(group.character)}`,`${joinName(group.character)} joined · ${joinRoleLabel(group.character)}`);
  const unavailable=combined.characterProfileAvailable?'':`<p class="join-warning">${joinUi('이 캐릭터의 공식 합류 프로필을 확보하지 못했습니다. 합류 배정은 저장하지만 확인되지 않은 능력치나 능력은 추가하지 않습니다.','The official joined profile is unavailable. The assignment is saved; unverified bonuses are not added.')}</p>`;
  const troopText=joinUi('캐릭터를 병력 1명으로 포함합니다. 현재 병력 수에 맞는 전투 행을 사용하세요. 캐릭터의 특성·키워드는 자동 공유하지 않습니다.','Count the Character as one additional troop. Use the combat row for the current troop count. Its traits/keywords are not shared automatically.');
  const roleText=role==='officer'?joinUi('합류한 장교가 병사 리더가 되며 피해를 마지막으로 받습니다.','The joined Officer is the troop leader and suffers damage last.'):role==='support'?joinUi('지원 캐릭터는 추가 병사로 취급합니다. 병사 제거 시 지원 캐릭터를 대신 제거할 수 있습니다.','A Support is another troop and may be removed instead of a regular troop.'):joinUi('장교·지원 유형은 원본 미제공으로 확인되지 않았습니다.','Officer/Support type could not be verified from an unavailable source card.');
  return `<section class="joined-unit" data-joined-instance="${joinEscape(group.instanceKey)}"><header class="joined-banner"><span>${joinUi('합류 유닛','Joined unit')}</span><h3>${joinEscape(group.label)}</h3><p>${joinEscape(roleText)}</p></header>${unavailable}${nativeUnitCard(group.unit,{profile:combined.profile,abilities:combined.abilities,effects:combined.effects,headingNote:note})}${renderJoinedContribution(group.character)}<div class="join-explanation"><p>${joinEscape(troopText)}</p><p>${joinUi('절대값은 교체하고 +값은 더했습니다. 유닛·캐릭터의 수정치는 각각 별도 선택이며 하나마다 스트레스 1이 필요합니다.','Absolute values replace; + values add. Unit and Character modifiers remain separate options, each costing 1 stress.')}</p><p>${joinUi('한 굴림에는 같은 색 주사위를 최대 3개만 사용합니다. 수정치를 추가한 뒤에도 이 상한을 적용합니다.','Use at most 3 dice of each color in a roll, including after adding modifiers.')}</p><details><summary>${joinUi('합류 토큰 처리','Joining tokens')}</summary><p>${joinEscape(joinTokenRules())}</p></details></div></section>`;
}
function renderPlayJoinControls(group,game){
  if(!group?.unit)return '';
  const character=group.character||group.unit;if(!group.character&&(!joinIsCharacter(character)||!joinGroups(character).length))return '';
  const key=joinInstanceKey(character.id,group.character?group.characterCopy:group.copy),action=group.character?'leave':'join';
  return `<section class="play-join-controls" aria-label="${joinUi('합류·해산','Join / detach')}"><div><button type="button" class="button button-ghost" data-play-join-action="${action}" data-join-key="${joinEscape(key)}" aria-label="${group.character?joinUi('캐릭터 합류 해산','Detach Character'):joinUi('유닛에 합류','Join a unit')}">${group.character?joinUi('해산','Detach'):joinUi('합류','Join')}</button></div></section>`;
}
function joinGameChanged(game){if(typeof persistGames==='function')persistGames();if(typeof renderGame==='function')renderGame();document.dispatchEvent(new CustomEvent('warcrow:joins-changed',{detail:{game}}));}
function applyPlayJoin(game,key,targetKey=null){
  const all=joinRosterInstances(joinGameRoster(game),game.units),ci=all.find(i=>i.instanceKey===key);if(!ci)return false;
  const current=validateJoins(joinGameRoster(game),game.units).validJoins.find(j=>joinInstanceKey(j.characterId,j.characterCopy)===key),leaving=targetKey===null;
  if(leaving&&!current||!leaving&&current)return false;
  const next=(game.joins||[]).filter(j=>joinInstanceKey(j.characterId,j.characterCopy)!==key);
  if(!leaving){
    const target=gameJoinGroups(game).find(g=>g.instanceKey===targetKey&&!g.character&&!joinIsCharacter(g.unit)&&joinTargetMatches(ci.unit,g.unit));
    if(!target)return false;
    next.push({characterId:ci.unit.id,characterCopy:ci.copy,targetId:target.unit.id,targetCopy:target.copy});
  }
  const result=validateJoins({...joinGameRoster(game),joins:next},game.units);if(result.issues.length){if(typeof toast==='function')toast(result.issues[0]);return false;}
  game.joins=result.validJoins;delete game.joinActivation;
  const groups=gameJoinGroups(game),index=leaving?groups.findIndex(g=>g.unit.id===ci.unit.id&&g.copy===ci.copy):groups.findIndex(g=>g.character?.id===ci.unit.id&&g.characterCopy===ci.copy);
  if(index>=0)game.cardIndex=index;
  joinGameChanged(game);return true;
}
function openPlayJoinDialog(game,key,action){
  if(action==='leave'){applyPlayJoin(game,key);return;}
  if(action!=='join')return;
  const all=joinRosterInstances(joinGameRoster(game),game.units),ci=all.find(i=>i.instanceKey===key);if(!ci||!joinIsCharacter(ci.unit)||!joinGroups(ci.unit).length)return;
  if(validateJoins(joinGameRoster(game),game.units).validJoins.some(j=>joinInstanceKey(j.characterId,j.characterCopy)===key))return;
  const available=gameJoinGroups(game).filter(g=>!g.character&&!joinIsCharacter(g.unit)&&joinTargetMatches(ci.unit,g.unit));
  let dialog=document.getElementById('joinPlayDialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='joinPlayDialog';dialog.className='join-play-dialog';document.body.append(dialog);}
  dialog.innerHTML=`<form method="dialog" class="join-play-form"><header><h2 id="joinPlayTitle" tabindex="-1" autofocus>${joinUi('합류','Join')}</h2><button type="button" data-join-dialog-cancel class="join-dialog-close" aria-label="${joinUi('닫기','Close')}">×</button></header><p>${joinEscape(joinName(ci.unit))}</p><label class="join-target-label" for="joinPlayTarget">${joinUi('합류할 유닛','Target unit')}</label><select id="joinPlayTarget">${available.map(g=>`<option value="${joinEscape(g.instanceKey)}">${joinEscape(g.label)}</option>`).join('')}</select>${available.length?'':`<p class="join-warning">${joinUi('합류할 수 있는 빈 유닛이 없습니다.','There is no eligible unoccupied unit.')}</p>`}<footer><button type="button" class="button button-ghost" data-join-dialog-cancel>${joinUi('취소','Cancel')}</button><button type="submit" class="button" data-join-submit ${available.length?'':'disabled'}>${joinUi('합류','Join')}</button></footer></form>`;
  dialog.setAttribute('aria-labelledby','joinPlayTitle');
  dialog.querySelectorAll('[data-join-dialog-cancel]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
  dialog.querySelector('form').addEventListener('submit',event=>{
    event.preventDefault();const target=dialog.querySelector('#joinPlayTarget').value;if(!target)return;
    if(applyPlayJoin(game,key,target))dialog.close();
  });
  dialog.showModal();dialog.querySelector('#joinPlayTitle').focus({preventScroll:true});
}
document.addEventListener('change',event=>{
  const select=event.target.closest?.('[data-join-character]');if(!select||typeof state==='undefined'||typeof data==='undefined')return;
  const characterId=select.dataset.joinCharacter,characterCopy=Number(select.dataset.joinCopy),next=(state.joins||[]).filter(j=>!(j.characterId===characterId&&j.characterCopy===characterCopy));
  if(select.value){const index=select.value.lastIndexOf(':'),targetId=select.value.slice(0,index),targetCopy=Number(select.value.slice(index+1));next.push({characterId,characterCopy,targetId,targetCopy});}
  const result=validateJoins({...state,joins:next},data);if(result.issues.length){if(typeof toast==='function')toast(result.issues[0]);return;}state.joins=result.validJoins;if(typeof renderArmy==='function')renderArmy();document.getElementById(select.id)?.focus({preventScroll:true});document.dispatchEvent(new CustomEvent('warcrow:joins-changed',{detail:{state}}));
});
document.addEventListener('click',event=>{
  const action=event.target.closest?.('[data-play-join-action]');if(action&&typeof activeGame==='function'){const game=activeGame();if(game)openPlayJoinDialog(game,action.dataset.joinKey,action.dataset.playJoinAction);}
});
