(function(){
  var reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Mobile menu */
  var toggle=document.getElementById('navToggle'),menu=document.getElementById('menu');
  toggle.addEventListener('click',function(){
    var open=menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded',open?'true':'false');
  });
  var links=[].slice.call(menu.querySelectorAll('a'));
  links.forEach(function(a){a.addEventListener('click',function(){
    menu.classList.remove('open');toggle.setAttribute('aria-expanded','false');
    if(document.activeElement)document.activeElement.blur();
  });});

  /* Scroll spy: highlight the link for the current section, and its dropdown parent */
  var ids=[];
  links.forEach(function(a){var id=a.getAttribute('href').slice(1);if(ids.indexOf(id)<0)ids.push(id);});
  var sections=ids.map(function(id){return document.getElementById(id);}).filter(Boolean);
  function setActive(){
    if(!sections.length)return;
    var y=window.scrollY+140,current=sections[0];
    sections.forEach(function(s){if(s.offsetTop<=y)current=s;});
    if(window.innerHeight+window.scrollY>=document.body.scrollHeight-4)current=sections[sections.length-1];
    var id='#'+current.id;
    links.forEach(function(a){a.classList.remove('active');});
    menu.querySelectorAll('.sub a[href="'+id+'"]').forEach(function(a){
      a.classList.add('active');a.closest('.has-sub').firstElementChild.classList.add('active');
    });
    menu.querySelectorAll(':scope > li > a[href="'+id+'"]').forEach(function(a){a.classList.add('active');});
  }
  window.addEventListener('scroll',setActive,{passive:true});
  window.addEventListener('resize',setActive);
  setActive();

  /* Hero slider */
  (function(){
  var slider=document.getElementById('slider'),track=document.getElementById('track');
  if(!track)return;
  var slides=[].slice.call(track.children),dots=document.getElementById('dots'),idx=0,timer=null;
  slides.forEach(function(_,i){
    var b=document.createElement('button');
    b.setAttribute('aria-label','Go to slide '+(i+1));
    b.addEventListener('click',function(){go(i);restart();});
    dots.appendChild(b);
  });
  function go(i){
    idx=(i+slides.length)%slides.length;
    track.style.transform='translateX('+(-idx*100)+'%)';
    slides.forEach(function(s,j){s.setAttribute('aria-hidden',j===idx?'false':'true');});
    [].forEach.call(dots.children,function(d,j){d.setAttribute('aria-current',j===idx?'true':'false');});
    var next=slides[(idx+1)%slides.length].querySelector('img');
    if(next&&next.loading==='lazy')next.loading='eager';
  }
  function restart(){clearInterval(timer);if(!reduceMotion)timer=setInterval(function(){go(idx+1);},5500);}
  document.getElementById('slPrev').addEventListener('click',function(){go(idx-1);restart();});
  document.getElementById('slNext').addEventListener('click',function(){go(idx+1);restart();});
  slider.addEventListener('mouseenter',function(){clearInterval(timer);});
  slider.addEventListener('mouseleave',restart);
  slider.addEventListener('focusin',function(){clearInterval(timer);});
  slider.addEventListener('focusout',restart);
  var sx=null;
  slider.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;},{passive:true});
  slider.addEventListener('touchend',function(e){
    if(sx===null)return;var dx=e.changedTouches[0].clientX-sx;
    if(Math.abs(dx)>40){go(idx+(dx<0?1:-1));restart();}sx=null;
  });
  document.addEventListener('visibilitychange',function(){document.hidden?clearInterval(timer):restart();});
  go(0);restart();
  })();

  /* Show more: any [data-limit] grid shows its first N items and a toggle for the rest */
  [].forEach.call(document.querySelectorAll('[data-limit]'),function(grid){
    var n=+grid.dataset.limit,noCollapse=grid.hasAttribute('data-no-collapse'),expanded=false,wrap=document.createElement('div'),btn=document.createElement('button');
    wrap.className='more-wrap';btn.className='more-btn';btn.type='button';
    wrap.appendChild(btn);grid.parentNode.insertBefore(wrap,grid.nextSibling);
    function apply(){
      var items=[].filter.call(grid.children,function(c){return !c.hidden&&!c.classList.contains('gallery-empty');});
      items.forEach(function(c,i){c.classList.toggle('is-extra',!expanded&&i>=n);});
      wrap.hidden=items.length<=n||(expanded&&noCollapse);
      btn.setAttribute('aria-expanded',expanded?'true':'false');
      btn.textContent=expanded?'Show fewer':'Show all '+items.length+' '+(grid.dataset.noun||'');
    }
    btn.addEventListener('click',function(){
      expanded=!expanded;apply();
      if(!expanded)window.scrollTo(0,grid.getBoundingClientRect().top+window.scrollY-90);
    });
    grid._applyLimit=function(){if(!noCollapse)expanded=false;apply();};
    apply();
  });

  /* Filter chips (clubs and gallery) */
  function filterable(chipsEl,items,onChange){
    if(!chipsEl)return;
    var chips=[].slice.call(chipsEl.querySelectorAll('.chip'));
    chips.forEach(function(c){c.addEventListener('click',function(){
      var f=c.dataset.filter,shown=0;
      chips.forEach(function(x){x.setAttribute('aria-pressed',x===c?'true':'false');});
      items.forEach(function(it){var ok=f==='all'||it.dataset.cat===f;it.hidden=!ok;if(ok)shown++;});
      var grid=items[0]&&items[0].parentNode;
      if(grid&&grid._applyLimit)grid._applyLimit();
      if(onChange)onChange(shown);
    });});
  }
  filterable(document.querySelector('#clubs .chips'),[].slice.call(document.querySelectorAll('#clubList .club')));
  var galleryEmpty=document.getElementById('galleryEmpty');
  filterable(document.querySelector('#gallery .chips'),[].slice.call(document.querySelectorAll('#galleryGrid .tile')),function(n){if(galleryEmpty)galleryEmpty.hidden=n>0;});

  /* Lightbox for any [data-gallery] group */
  var lb=document.getElementById('lightbox'),lbImg=document.getElementById('lbImg'),lbCap=document.getElementById('lbCap'),group=[],gi=0;
  function show(i){
    gi=(i+group.length)%group.length;
    var img=group[gi].querySelector('img'),cap=group[gi].querySelector('.cap');
    lbImg.src=img.currentSrc||img.src;lbImg.alt=img.alt;lbCap.textContent=cap?cap.textContent:img.alt;
  }
  document.querySelectorAll('[data-gallery]').forEach(function(g){
    g.addEventListener('click',function(e){
      var t=e.target.closest('.tile');if(!t)return;
      group=[].slice.call(g.querySelectorAll('.tile')).filter(function(x){return !x.hidden;});
      show(group.indexOf(t));
      if(lb.showModal)lb.showModal();else lb.setAttribute('open','');
    });
  });
  document.getElementById('lbClose').addEventListener('click',function(){lb.close();});
  document.getElementById('lbPrev').addEventListener('click',function(){show(gi-1);});
  document.getElementById('lbNext').addEventListener('click',function(){show(gi+1);});
  lb.addEventListener('click',function(e){if(e.target===lb||e.target.tagName==='FIGURE')lb.close();});
  lb.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')show(gi-1);if(e.key==='ArrowRight')show(gi+1);});

  /* Lazy videos: load and play only when on screen (skip for reduced motion / data saver) */
  var saveData=navigator.connection&&navigator.connection.saveData;
  [].forEach.call(document.querySelectorAll('video.lazy-video'),function(v){
    function load(){if(!v.src){v.src=v.dataset.src;}}
    if(!('IntersectionObserver' in window)){load();return;}
    new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){load();if(!reduceMotion&&!saveData){var p=v.play();if(p&&p.catch)p.catch(function(){});}}
        else if(!v.paused){v.pause();}
      });
    },{threshold:.35}).observe(v);
  });

  /* Forms search */
  var input=document.getElementById('formSearch'),rows=[].slice.call(document.querySelectorAll('#formsTable tbody tr')),none=document.getElementById('noResults');
  if(input)input.addEventListener('input',function(){
    var q=input.value.trim().toLowerCase(),shown=0;
    rows.forEach(function(r){
      var match=r.textContent.toLowerCase().indexOf(q)>-1;
      r.style.display=match?'':'none';
      if(match)shown++;
    });
    none.style.display=shown?'none':'block';
  });
})();
