/* Host adapter for the same glossary and rule dialog used by the army builder. */
const $=selector=>document.querySelector(selector);
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function ui(korean){return korean;}
function rulePageContext(){return {faction:strategyCurrentGuide()?.id||''};}

function strategyConfigureRules(value){
  // Guide wording has a few equivalent terms that cards do not use as labels.
  const extra={conquest:['점령'], 'leave-unit':['해산']};
  configureRules({...value,entries:value.entries.map(e=>({...e,aliases:[...e.aliases,...(extra[e.id]||[])]}))});
}
function strategyEnhanceRules(root){
  if(!root||!rulePattern)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
    return node.nodeValue.trim()&&!node.parentElement.closest('a,button,script,style,code,pre,textarea,.strategy-source-refs,.strategy-source-list,.strategy-kind')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
  }}),nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){
    const text=node.nodeValue,markup=ruleText(text);if(!markup.includes('data-rule=')&&!markup.includes('class="prose-dice"'))continue;
    const template=document.createElement('template');template.innerHTML=markup;
    for(const term of template.content.querySelectorAll('[data-rule]')){
      const word=term.textContent,tail=term.nextSibling?.nodeType===Node.TEXT_NODE?term.nextSibling:null;
      const after=tail?.nodeValue||'',before=term.previousSibling?.textContent||'';
      let following='';for(let next=term.nextSibling;next&&following.length<30;next=next.nextSibling)following+=next.textContent;
      // Bare deployment prose does not mean the Place(X) effect or combat positioning.
      if(word==='배치'){
        if(/^\s*\(\s*(?:\d+|X)\s*\)/i.test(after))term.dataset.rule='place';
        else{term.replaceWith(document.createTextNode(word));continue;}
      }
      if(word==='대형'&&/^\s*유닛/.test(following))term.dataset.rule='large';
      if(word==='기사'&&(/(?:공식|입문|소개)\s*$/.test(before)||/^\s*(?:작성|게시|원문)/.test(after))){term.replaceWith(document.createTextNode(word));continue;}
      if(['place','displace','shove','attract','intimidating','rugged','bloodlust','sinister'].includes(term.dataset.rule)){
        const suffix=after.match(/^\s*\(\s*(\d+|X|N)\s*\)/i);
        if(suffix){term.append(document.createTextNode(suffix[0]));tail.nodeValue=after.slice(suffix[0].length);term.dataset.ruleValue=suffix[1];}
      }
      term.setAttribute('aria-label',term.textContent+' 규칙 설명');
    }
    node.replaceWith(template.content);
  }
}
let strategyRuleReturnFocus=null;
document.addEventListener('click',event=>{
  const trigger=event.target.closest('[data-rule],[data-open-rules]');
  if(trigger&&!trigger.closest('#ruleDialog'))strategyRuleReturnFocus=trigger;
},true);
$('#ruleDialog').addEventListener('close',()=>{
  if(strategyRuleReturnFocus?.isConnected)strategyRuleReturnFocus.focus({preventScroll:true});
  strategyRuleReturnFocus=null;
});
