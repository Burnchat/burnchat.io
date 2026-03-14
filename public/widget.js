(function(){
  'use strict';
  if(window.__BURNCHAT_LOADED)return;
  window.__BURNCHAT_LOADED=true;

  var s=document.currentScript||document.querySelector('script[src*="burnchat.io/widget.js"]');
  var c={
    room:s&&s.getAttribute('data-room')||'lobby',
    theme:s&&s.getAttribute('data-theme')||'dark',
    accent:s&&s.getAttribute('data-accent')||'#ff6b35',
    position:s&&s.getAttribute('data-position')||'bottom-right',
    height:s&&s.getAttribute('data-height')||'520',
    width:s&&s.getAttribute('data-width')||'380',
    welcome:s&&s.getAttribute('data-welcome')||'',
    mode:s&&s.getAttribute('data-mode')||'float'
  };

  function init(){
    // Inline mode — embed directly in a target div
    if(c.mode==='inline'){
      var target=document.getElementById('burnchat-widget');
      if(!target)return;
      var p=new URLSearchParams({room:c.room,theme:c.theme,accent:c.accent,welcome:c.welcome,ref:location.hostname});
      var f=document.createElement('iframe');
      f.src='https://burnchat.io/embed?'+p.toString();
      f.title='BurnChat';
      f.style.cssText='border:none;width:100%;height:'+c.height+'px;border-radius:8px;';
      f.setAttribute('sandbox','allow-scripts allow-forms allow-popups');
      f.loading='lazy';
      target.appendChild(f);
      // Powered by link
      var pw=document.createElement('div');
      pw.style.cssText='text-align:center;padding:6px 0;font-family:monospace;font-size:11px;';
      pw.innerHTML='<a href="https://burnchat.io/widget?utm_source=widget&utm_medium=powered-by&utm_campaign='+encodeURIComponent(location.hostname)+'" rel="nofollow" target="_blank" style="color:#888;text-decoration:none;">🔥 Powered by BurnChat</a>';
      target.appendChild(pw);
      return;
    }

    // Float mode — bottom corner bubble
    var wrap=document.createElement('div');
    wrap.id='burnchat-widget-wrap';
    wrap.style.cssText='position:fixed;z-index:2147483647;'+
      (c.position.includes('right')?'right:16px;':'left:16px;')+
      'bottom:16px;width:0;height:0;overflow:visible;font-family:system-ui,sans-serif;';

    // Toggle button
    var btn=document.createElement('button');
    btn.setAttribute('aria-label','Open BurnChat');
    btn.style.cssText='width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;'+
      'background:'+c.accent+';color:#fff;font-size:24px;'+
      'box-shadow:0 4px 16px rgba(0,0,0,0.2);transition:all 0.3s cubic-bezier(0.4,0,0.2,1);'+
      'display:flex;align-items:center;justify-content:center;';
    btn.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    btn.onmouseenter=function(){btn.style.transform='scale(1.1)';};
    btn.onmouseleave=function(){btn.style.transform='scale(1)';};

    // iframe
    var p=new URLSearchParams({room:c.room,theme:c.theme,accent:c.accent,welcome:c.welcome,ref:location.hostname});
    var iframeSrc='https://burnchat.io/embed?'+p.toString();
    var frame=document.createElement('iframe');
    frame.title='BurnChat';
    frame.style.cssText='display:none;border:none;border-radius:12px;'+
      'width:'+c.width+'px;height:'+c.height+'px;'+
      'box-shadow:0 8px 40px rgba(0,0,0,0.25);position:absolute;bottom:68px;'+
      (c.position.includes('right')?'right:0;':'left:0;')+
      'transition:opacity 0.2s,transform 0.2s;opacity:0;transform:translateY(8px);'+
      'background:'+(c.theme==='light'?'#f5f3f0':'#0d0d0d')+';';
    frame.setAttribute('sandbox','allow-scripts allow-forms allow-popups');
    frame.loading='lazy';

    // Powered by (outside iframe for SEO)
    var powered=document.createElement('a');
    powered.href='https://burnchat.io/widget?utm_source=widget&utm_medium=powered-by&utm_campaign='+encodeURIComponent(location.hostname);
    powered.rel='nofollow';
    powered.target='_blank';
    powered.style.cssText='display:none;position:absolute;bottom:'+((parseInt(c.height)+76))+'px;'+
      (c.position.includes('right')?'right:0;':'left:0;')+
      'font-family:monospace;font-size:10px;color:#666;text-decoration:none;white-space:nowrap;';
    powered.textContent='🔥 Powered by BurnChat';

    var open=false;
    var loaded=false;
    btn.onclick=function(){
      open=!open;
      if(open){
        if(!loaded){frame.src=iframeSrc;loaded=true;}
        frame.style.display='block';
        powered.style.display='block';
        setTimeout(function(){frame.style.opacity='1';frame.style.transform='translateY(0)';},10);
        btn.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        btn.setAttribute('aria-label','Close BurnChat');
      }else{
        frame.style.opacity='0';frame.style.transform='translateY(8px)';
        setTimeout(function(){frame.style.display='none';powered.style.display='none';},200);
        btn.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
        btn.setAttribute('aria-label','Open BurnChat');
      }
    };

    // postMessage listener
    window.addEventListener('message',function(e){
      if(!e.data||e.data.key!=='burnchat')return;
      if(e.data.action==='close')btn.click();
      if(e.data.action==='notify'){
        if(!open)btn.style.boxShadow='0 0 0 4px '+c.accent+'44, 0 4px 16px rgba(0,0,0,0.2)';
      }
    });

    wrap.appendChild(frame);
    wrap.appendChild(powered);
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
  }

  if(document.readyState==='complete'){
    'requestIdleCallback'in window?requestIdleCallback(init,{timeout:3000}):setTimeout(init,0);
  }else{
    window.addEventListener('load',function(){
      'requestIdleCallback'in window?requestIdleCallback(init,{timeout:3000}):setTimeout(init,0);
    });
  }
})();
