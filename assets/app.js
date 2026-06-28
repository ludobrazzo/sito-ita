
function topicById(id){ return window.TOPICS.find(t => t.id === id); }
function topicUrl(id){ return `argomenti/${id}.html`; }
function shuffle(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
function progress(){ return JSON.parse(localStorage.getItem('ita-progress') || '{}'); }
function setDone(id){ const p=progress(); p[id]=true; localStorage.setItem('ita-progress', JSON.stringify(p)); }
function isDone(id){ return !!progress()[id]; }
function renderProgress(){ const done=Object.keys(progress()).filter(k=>progress()[k]).length; const total=window.TOPICS.length; document.querySelectorAll('[data-progress-text]').forEach(e=>e.textContent=`${done}/${total} argomenti superati`); document.querySelectorAll('[data-progress-bar]').forEach(e=>e.style.width=`${Math.round(done/total*100)}%`); }
function initIndex(){
  const grid=document.querySelector('#topicsGrid'); if(!grid) return;
  window.TOPICS.forEach((t,i)=>{
    const locked = i>0 && !isDone(window.TOPICS[i-1].id);
    const done = isDone(t.id);
    const el=document.createElement('article'); el.className='tile';
    el.innerHTML=`<div class="meta">Argomento ${i+1} · PDF pagine ${t.pageRange[0]}-${t.pageRange[1]} · ${t.quizCount} domande</div><h3>${t.title}</h3><p>${t.subtitle}</p><a class="open" href="${topicUrl(t.id)}">${done?'Ripassa':locked?'Apri comunque':'Studia'}</a>`;
    grid.appendChild(el);
  });
  renderProgress();
}
function initTopic(){
  const page=document.querySelector('[data-topic-id]'); if(!page) return;
  const id=page.dataset.topicId; const t=topicById(id); const quiz=window.QUIZZES[id];
  const toc=document.querySelector('#sideToc');
  if(toc){ window.TOPICS.forEach((x,i)=>{ const a=document.createElement('a'); a.href='../'+topicUrl(x.id); a.textContent=`${i+1}. ${x.title}`; if(x.id===id) a.className='active'; toc.appendChild(a); }); }
  const form=document.querySelector('#quizForm');
  const submit=document.querySelector('#checkQuiz'); const retry=document.querySelector('#retryQuiz'); const result=document.querySelector('#quizResult'); const nextBtn=document.querySelector('#nextBtn');
  const shuffled = quiz.map((item,idx)=>({ ...item, idx, options: shuffle(item.options) }));
  shuffled.forEach((item,i)=>{
    const box=document.createElement('section'); box.className='question'; box.dataset.index=i; box.dataset.answer=item.answer;
    box.innerHTML=`<div class="q-title">${i+1}. ${item.q}</div><div class="options"></div><div class="q-feedback"></div>`;
    const opts=box.querySelector('.options');
    item.options.forEach((opt,j)=>{
      const lab=document.createElement('label'); lab.className='option';
      lab.innerHTML=`<input type="radio" name="q${i}" value="${encodeURIComponent(opt)}"><span>${opt}</span>`;
      opts.appendChild(lab);
    });
    form.appendChild(box);
  });
  function clearMarks(){
    document.querySelectorAll('.question').forEach(q=>{q.classList.remove('wrong','correct'); q.querySelector('.q-feedback').textContent='';});
    document.querySelectorAll('.option').forEach(o=>o.classList.remove('wrong-selected'));
    result.className='result'; result.style.display='none'; result.textContent='';
  }
  submit.addEventListener('click',()=>{
    clearMarks();
    let wrong=0, unanswered=0;
    document.querySelectorAll('.question').forEach((q,i)=>{
      const selected=q.querySelector(`input[name="q${i}"]:checked`);
      const answer=q.dataset.answer;
      if(!selected){ wrong++; unanswered++; q.classList.add('wrong'); q.querySelector('.q-feedback').textContent='Domanda non risposta.'; return; }
      const val=decodeURIComponent(selected.value);
      if(val !== answer){
        wrong++;
        q.classList.add('wrong');
        selected.closest('.option').classList.add('wrong-selected');
        q.querySelector('.q-feedback').textContent='Risposta selezionata sbagliata.';
      } else {
        q.classList.add('correct');
        q.querySelector('.q-feedback').textContent='Risposta corretta.';
      }
    });
    if(wrong){
      document.querySelectorAll('.question.correct').forEach(q=>{ q.classList.remove('correct'); q.querySelector('.q-feedback').textContent=''; });
      result.className='result bad'; result.style.display='block';
      result.textContent = unanswered ? `Quiz non superato: ${wrong} domande da correggere, incluse ${unanswered} non risposte. Le risposte sbagliate selezionate sono evidenziate; la risposta giusta non viene mostrata.` : `Quiz non superato: ${wrong} risposte sbagliate. Le risposte sbagliate selezionate sono evidenziate; la risposta giusta non viene mostrata.`;
      retry.classList.remove('hidden');
      if(nextBtn) nextBtn.setAttribute('aria-disabled','true');
      result.scrollIntoView({behavior:'smooth', block:'center'});
    } else {
      setDone(id); renderProgress();
      result.className='result ok'; result.style.display='block'; result.textContent='Quiz superato: puoi passare all’argomento successivo.';
      retry.classList.add('hidden');
      if(nextBtn){ nextBtn.removeAttribute('aria-disabled'); nextBtn.classList.remove('disabled'); }
    }
  });
  retry.addEventListener('click',()=>{
    clearMarks(); form.reset(); retry.classList.add('hidden'); window.scrollTo({top:document.querySelector('#quiz').offsetTop-20,behavior:'smooth'});
  });
  if(nextBtn && isDone(id)){ nextBtn.removeAttribute('aria-disabled'); nextBtn.classList.remove('disabled'); }
  if(nextBtn){ nextBtn.addEventListener('click',(e)=>{ if(nextBtn.getAttribute('aria-disabled')==='true'){ e.preventDefault(); result.className='result bad'; result.style.display='block'; result.textContent='Devi superare il quiz prima di andare avanti.'; result.scrollIntoView({behavior:'smooth', block:'center'}); } }); }
  const search=document.querySelector('#searchInPage');
  if(search){
    const content=document.querySelector('.content'); const original=content.innerHTML;
    search.addEventListener('input',()=>{
      const q=search.value.trim(); content.innerHTML=original;
      if(q.length<2) return;
      const esc=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      content.innerHTML=content.innerHTML.replace(new RegExp(esc,'gi'), m=>`<mark>${m}</mark>`);
    });
  }
  renderProgress();
}
document.addEventListener('DOMContentLoaded',()=>{ initIndex(); initTopic(); });
