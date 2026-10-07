/* Nonessential motion starts after the critical page load. */
(function(){
  function init(){
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    if(finePointer && !document.querySelector('.page-ambient')){
      var amb=document.createElement('div');amb.className='page-ambient';amb.setAttribute('aria-hidden','true');document.body.appendChild(amb);
    }
    var selectors=['.service','.step','.testi','.work-card','.marketing-case','.resource-article','.quick-grid a','.about-pillar-grid article','.stack-grid article','.social-big a','.plan-card','.faq-item','.portfolio-paths-links a','.international-note','.project-form'];
    var nodes=[]; selectors.forEach(function(s){document.querySelectorAll(s).forEach(function(el){if(nodes.indexOf(el)<0)nodes.push(el)})});
    nodes.forEach(function(el,i){el.classList.add('motion-reveal');el.style.setProperty('--reveal-delay',Math.min((i%6)*55,275)+'ms')});
    if(!reduce && 'IntersectionObserver' in window){
      var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
      nodes.forEach(function(el){io.observe(el)});
    }else{nodes.forEach(function(el){el.classList.add('is-visible')})}
    if(reduce || !finePointer)return;
    document.querySelectorAll('.motion-tilt,.hero-card--3d').forEach(function(el){
      el.addEventListener('pointermove',function(ev){var r=el.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width-.5,y=(ev.clientY-r.top)/r.height-.5;el.style.transform='perspective(1000px) rotateX('+(-y*5).toFixed(2)+'deg) rotateY('+(x*7).toFixed(2)+'deg) translateY(-3px)'});
      el.addEventListener('pointerleave',function(){el.style.transform=''})
    });
    document.querySelectorAll('.motion-card,.work-card,.marketing-case').forEach(function(el){el.classList.add('motion-card')});
  }
  function schedule(){
    if('requestIdleCallback' in window) requestIdleCallback(init,{timeout:1200});
    else setTimeout(init,180);
  }
  if(document.readyState==='complete')schedule();
  else window.addEventListener('load',schedule,{once:true});
})();
