(() => {
  const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const coreSource='https://experience.corvusbelli.com/en/resources/e89e441f-98af-5417-ba5d-96d9a5be719d?l=712b6686-47e5-479e-a729-80c7af9ce90a';
  const wtsSource='https://experience.corvusbelli.com/en/resources/7bedf3e5-526f-5da1-9f46-2d0e14e6baf9?l=712b6686-47e5-479e-a729-80c7af9ce90a';
  const chapters={core:[[2,4,'게임 소개·준비물'],[5,22,'기본 개념·프로필·굴림'],[23,29,'게임 준비·편성·배치'],[30,37,'턴·라운드·게임 종료'],[38,54,'활성화·이동·전투 행동'],[55,59,'능력·요구 조건·능력 종류'],[60,63,'마법·주문·팅지 굴림'],[64,72,'스트레스·사기·상태·피해'],[73,81,'캐릭터 합류·이탈·피해 배분'],[82,92,'용어·기호·키워드'],[93,98,'지형 요소·지형 키워드'],[99,105,'모험·목표물·중립 유닛'],[106,120,'부록: 도해와 예시 1–18']],wts:[[5,8,'참가·준비물·운영진'],[9,12,'대회 형식·득점·순위'],[13,14,'비공개 정보·게임 준비'],[15,16,'추가 규정·출전 제한'],[17,18,'공식 전장 배치 예시']]};
  let books={core:[],wts:[]},source={},figures={},book='core',chapter=0,printAll=false,searchTimer;
  const text=html=>{const el=document.createElement('div');el.innerHTML=html;return el.textContent||''};
  function pageHtml(page,b=book){
    const original=source[b]?.[page.page],images=figures[b]?.[page.page]||[],url=b==='core'?coreSource:wtsSource;
    return `<section class="book-page" id="${b}-${page.page}" data-book-page="${page.page}"><header><span>${b==='core'?'CORE 1.6.1':'WTS 2026.11.03'} · 인쇄 ${page.page}쪽</span><a href="#${b}-${page.page}" aria-label="${page.page}쪽 바로가기 링크"># ${page.page}</a></header><h2>${esc(page.title)}</h2><div class="book-prose">${page.html.replace(/<figure\b[^>]*data-(?:source-page|figure)[^>]*>[\s\S]*?<\/figure>/gi,'')}</div>${images.length?`<details class="book-figures" open><summary>원문 도해 ${images.length>1?images.length+'개':''}</summary><p>도해의 A·B·C 및 숫자는 위 한국어 설명과 대응합니다.</p>${images.map(img=>`<figure><a href="${esc(img.src)}" target="_blank" rel="noopener noreferrer"><img src="${esc(img.src)}" alt="${esc(img.alt||'공식 원문 도해')}" loading="lazy"></a><figcaption>${esc(img.alt||'공식 원문 도해')} · 누르면 원본 크기로 열립니다.</figcaption></figure>`).join('')}</details>`:''}${original?`<details class="book-original"><summary>영문 원문 함께 보기</summary><pre lang="en">${esc(typeof original==='string'?original:original.text)}</pre></details>`:''}<p class="book-source"><a href="${url}#page=${original?.pdfPage||page.page+(b==='core'?6:0)}" target="_blank" rel="noopener noreferrer">공식 PDF ${page.page}쪽 열기 ↗</a></p></section>`;
  }
  function renderToc(){
    $('#bookToc').innerHTML=chapters[book].map(([start,end,title],i)=>`<button type="button" data-book-chapter="${i}" aria-current="${i===chapter?'true':'false'}"><span>${String(i+1).padStart(2,'0')}</span><div>${title}<small>${start}–${end}쪽</small></div></button>`).join('');
    $('#bookPageSelect').innerHTML=books[book].map(p=>`<option value="${p.page}">${p.page}쪽 · ${esc(p.title)}</option>`).join('');
    document.querySelectorAll('[data-book]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.book===book)));
    $('#bookSource').href=book==='core'?coreSource:wtsSource;
    $('#bookEdition').textContent=book==='core'?'기본 룰북 1.6.1 · 본문 2–120쪽':'WTS 시즌 2 · 2026.11.03 · 운영 규정 5–18쪽';
    $('#bookScopeNote').textContent=book==='core'?'본문·목록·표·도해 설명·부록 예시를 인쇄 쪽수에 맞춰 번역했습니다. 책에 실린 예시 카드의 수치는 원문 그대로 유지합니다.':'공식 최신 WTS의 참가·운영·편성·준비·추가 규정을 자세히 설명합니다. 언어판의 규정이 다르면 공식 스페인어판이 우선합니다. 순찰·시나리오·업적 20개는 시나리오 화면에서 확인하세요.';
  }
  function renderChapter(target=null){
    const [start,end,title]=chapters[book][chapter],pages=printAll?books[book]:books[book].filter(p=>p.page>=start&&p.page<=end);
    $('#bookChapterTitle').textContent=printAll?(book==='core'?'기본 룰북 전체':'WTS 운영 규정 전체'):title;
    $('#bookChapterRange').textContent=printAll?`${pages.length}쪽`:`${start}–${end}쪽`;
    $('#bookContent').innerHTML=pages.map(p=>pageHtml(p)).join('');
    diceProse.enhance($('#bookContent'));
    $('#bookPrev').disabled=chapter===0;$('#bookNext').disabled=chapter===chapters[book].length-1;
    $('#bookPageSelect').value=String(target||start);renderToc();$('#bookPageSelect').value=String(target||start);
    if(target)requestAnimationFrame(()=>document.getElementById(`${book}-${target}`)?.scrollIntoView({block:'start'}));
    try{localStorage.setItem('warcrow-rulebook-reading',`${book}-${target||start}`)}catch{}
  }
  function goTo(b,page,writeHash=true){
    if(!books[b]?.some(p=>p.page===Number(page))){b='core';page=2;}
    book=b;chapter=chapters[b].findIndex(([a,z])=>page>=a&&page<=z);if(chapter<0)chapter=0;
    printAll=false;$('#bookSearch').value='';$('#bookSearchResults').hidden=true;$('#bookReading').hidden=false;renderChapter(Number(page));
    if(writeHash)history.replaceState(null,'',`#${b}-${page}`);
  }
  function search(){
    const query=$('#bookSearch').value.trim().toLocaleLowerCase().replace(/\s/g,'');if(!query){$('#bookSearchResults').hidden=true;$('#bookReading').hidden=false;return}
    const results=[];for(const b of ['core','wts'])for(const page of books[b])if(page.search.includes(query))results.push({b,page});
    $('#bookReading').hidden=true;$('#bookSearchResults').hidden=false;
    $('#bookSearchResults').innerHTML=`<p class="book-result-count">${results.length}개 쪽에서 찾았습니다.</p>${results.map(({b,page})=>{const compact=page.plain.replace(/\s/g,''),idx=compact.toLocaleLowerCase().indexOf(query),snippet=compact.slice(Math.max(0,idx-35),Math.max(0,idx-35)+150);return `<button type="button" data-book-result="${b}-${page.page}"><small>${b==='core'?'기본 룰북':'WTS'} · ${page.page}쪽</small><strong>${esc(page.title)}</strong><p>${esc(snippet)}${compact.length>150?'…':''}</p></button>`}).join('')||'<p>검색 결과가 없습니다. 짧은 용어나 영문 키워드로 다시 검색해 보세요.</p>'}`;
    diceProse.enhance($('#bookSearchResults'));
  }
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-book-retry]')){location.reload();return}
    const b=event.target.closest('[data-book]');if(b){goTo(b.dataset.book,chapters[b.dataset.book][0][0]);return}
    const c=event.target.closest('[data-book-chapter]');if(c){chapter=Number(c.dataset.bookChapter);goTo(book,chapters[book][chapter][0]);return}
    const result=event.target.closest('[data-book-result]');if(result){const match=result.dataset.bookResult.match(/^(core|wts)-(\d+)$/);goTo(match[1],Number(match[2]));return}
    if(event.target.closest('#bookPrev')){if(chapter>0)goTo(book,chapters[book][chapter-1][0]);return}
    if(event.target.closest('#bookNext')){if(chapter<chapters[book].length-1)goTo(book,chapters[book][chapter+1][0]);return}
    if(event.target.closest('#bookPrint')){printAll=$('#bookPrintAll').checked;renderChapter();window.print();return}
  });
  $('#bookPageSelect').addEventListener('change',e=>goTo(book,Number(e.target.value)));
  $('#bookSearch').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(search,100)});
  window.addEventListener('hashchange',()=>{const m=location.hash.match(/^#(core|wts)-(\d+)$/);if(m)goTo(m[1],Number(m[2]),false)});
  window.addEventListener('afterprint',()=>{if(printAll){printAll=false;renderChapter()}});
  Promise.all(['rulebook-core-a.json','rulebook-core-b.json','rulebook-core-c.json','rulebook-core-d.json','rulebook-wts.json','rulebook-source.json','rulebook-figures.json'].map(f=>fetch(`./${f}?v=${f==='rulebook-source.json'?'50':'35'}`).then(r=>{if(!r.ok)throw Error(f);return r.json()}))).then(([a,b,c,d,wts,english,art])=>{
    books={core:[...a,...b,...c,...d].sort((x,y)=>x.page-y.page),wts};source=english;figures=art;
    for(const pages of Object.values(books))for(const p of pages){p.plain=text(p.html);p.search=[p.title,p.plain,source[pages===books.core?'core':'wts']?.[p.page]?.text||''].join(' ').toLocaleLowerCase().replace(/\s/g,'')}
    $('#bookLoading').hidden=true;$('#bookReader').hidden=false;
    let saved='';try{saved=localStorage.getItem('warcrow-rulebook-reading')||''}catch{}
    const m=(location.hash.slice(1)||saved).match(/^(core|wts)-(\d+)$/);goTo(m?.[1]||'core',Number(m?.[2]||2),false);
  }).catch(()=>{$('#bookLoading').innerHTML='룰북 자료를 불러오지 못했습니다. <button type="button" data-book-retry>다시 불러오기</button>'});
})();
