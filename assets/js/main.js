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
  /* Mobile menu: each dropdown collapses behind an arrow button, so the open menu shows only the main items */
  [].forEach.call(menu.querySelectorAll('.has-sub'),function(li){
    var a=li.firstElementChild,b=document.createElement('button');
    b.type='button';b.className='sub-toggle';b.setAttribute('aria-expanded','false');
    b.setAttribute('aria-label','Show '+a.textContent.trim()+' links');
    b.innerHTML='<svg class="ico"><use href="#i-down"/></svg>';
    a.insertAdjacentElement('afterend',b);
    b.addEventListener('click',function(){
      var open=!li.classList.contains('sub-open');
      [].forEach.call(menu.querySelectorAll('.sub-open'),function(o){
        o.classList.remove('sub-open');o.querySelector('.sub-toggle').setAttribute('aria-expanded','false');
      });
      li.classList.toggle('sub-open',open);b.setAttribute('aria-expanded',open?'true':'false');
    });
  });

  /* Sliders: every [data-slider] (home hero, gym photos). Add data-autoplay to advance on its own. */
  [].forEach.call(document.querySelectorAll('[data-slider]'),function(slider){
    var track=slider.querySelector('.track'),dots=slider.querySelector('.dots');
    var slides=[].slice.call(track.children),idx=0,timer=null,auto=slider.hasAttribute('data-autoplay');
    if(!slides.length)return;
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
    function restart(){clearInterval(timer);if(auto&&!reduceMotion)timer=setInterval(function(){go(idx+1);},5500);}
    slider.querySelector('.sl-btn.prev').addEventListener('click',function(){go(idx-1);restart();});
    slider.querySelector('.sl-btn.next').addEventListener('click',function(){go(idx+1);restart();});
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
  });

  /* News strip: slides one card at a time, loops back to the start, pauses on hover, focus or touch */
  [].forEach.call(document.querySelectorAll('[data-news]'),function(track){
    var box=track.closest('.news'),timer=null;
    function step(dir){
      var card=track.querySelector('.news-card');if(!card)return;
      var w=card.getBoundingClientRect().width+parseFloat(getComputedStyle(track).columnGap||0);
      var end=track.scrollLeft+track.clientWidth>=track.scrollWidth-4;
      if(dir>0&&end)track.scrollTo({left:0,behavior:'smooth'});
      else if(dir<0&&track.scrollLeft<=4)track.scrollTo({left:track.scrollWidth,behavior:'smooth'});
      else track.scrollBy({left:dir*w,behavior:'smooth'});
    }
    function stop(){clearInterval(timer);}
    function start(){stop();if(!reduceMotion)timer=setInterval(function(){step(1);},4500);}
    [].forEach.call(box.querySelectorAll('.news-btn'),function(b){
      b.addEventListener('click',function(){step(+b.dataset.dir);start();});
    });
    box.addEventListener('mouseenter',stop);box.addEventListener('mouseleave',start);
    box.addEventListener('focusin',stop);box.addEventListener('focusout',start);
    track.addEventListener('touchstart',stop,{passive:true});
    track.addEventListener('touchend',function(){setTimeout(start,1500);},{passive:true});
    document.addEventListener('visibilitychange',function(){document.hidden?stop():start();});
    start();
  });

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
  var lb=document.getElementById('lightbox');
  if(lb){
  var lbImg=document.getElementById('lbImg'),lbCap=document.getElementById('lbCap'),group=[],gi=0;
  function show(i){
    gi=(i+group.length)%group.length;
    var it=group[gi],img=it.tagName==='IMG'?it:it.querySelector('img'),cap=it.querySelector&&it.querySelector('.cap, figcaption strong');
    lbImg.src=img.currentSrc||img.src;lbImg.alt=img.alt;lbCap.textContent=cap?cap.textContent:img.alt;
  }
  document.querySelectorAll('[data-gallery]').forEach(function(g){
    g.addEventListener('click',function(e){
      var sel='.tile, .slide, :scope > img',t=e.target.closest('.tile, .slide, img');
      if(!t||!g.contains(t)||e.target.closest('.sl-btn, .dots'))return;
      if(t.tagName==='IMG'&&t.closest('.tile, .slide'))t=t.closest('.tile, .slide');
      group=[].slice.call(g.querySelectorAll(sel)).filter(function(x){return !x.hidden;});
      show(group.indexOf(t));
      if(lb.showModal)lb.showModal();else lb.setAttribute('open','');
    });
  });
  document.getElementById('lbClose').addEventListener('click',function(){lb.close();});
  document.getElementById('lbPrev').addEventListener('click',function(){show(gi-1);});
  document.getElementById('lbNext').addEventListener('click',function(){show(gi+1);});
  lb.addEventListener('click',function(e){if(e.target===lb||e.target.tagName==='FIGURE')lb.close();});
  lb.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')show(gi-1);if(e.key==='ArrowRight')show(gi+1);});
  var lx=null;
  lb.addEventListener('touchstart',function(e){lx=e.touches[0].clientX;},{passive:true});
  lb.addEventListener('touchend',function(e){
    if(lx===null)return;var dx=e.changedTouches[0].clientX-lx;lx=null;
    if(Math.abs(dx)>40)show(gi+(dx<0?1:-1));
  });
  }

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
