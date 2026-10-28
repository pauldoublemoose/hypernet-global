/* Mounts Friends & Privacy's cog on a horizon the viewer owns.
   Horizons store published_at, not an audience. The include/exclude list stays on the horizon
   in the offline store. "everyone" still flips isPublished through the existing save.
   HNCog.mount does not draw a control. When it is present, the "..." button stays in the
   page and a cog button in [data-hzcog] takes its place. Clicking that button calls
   HNCog.open. When HNCog is missing, the "..." button is the menu. */
(function(){
  var off = null;
  function audienceOf(hz){
    var a = hz && hz.audience;
    if (a && Array.isArray(a.include)) return { include:a.include.slice(), exclude:Array.isArray(a.exclude) ? a.exclude.slice() : [] };
    return { include: hz && hz.isPublished ? ['everyone'] : [], exclude:[] };
  }
  function itemsFor(hzId){
    return [
      { id:'invite', label:'Invite collaborators/followers', icon:'plus', onClick:function(){ if (typeof addCollabDialog === 'function') addCollabDialog(hzId); } },
      { id:'rename', label:'Rename', icon:'edit', onClick:function(){ if (typeof editHorizonDialog === 'function') editHorizonDialog(hzId); } },
      { id:'delete', label:'Delete', icon:'trash', danger:true, onClick:function(){ if (typeof deleteHorizonDialog === 'function') deleteHorizonDialog(hzId); } }
    ];
  }
  function saveAudience(hzId, audience){
    var hz = typeof HORIZONS !== 'undefined' && HORIZONS ? HORIZONS[hzId] : null;
    if (!hz || typeof hzOwnedByMe !== 'function' || !hzOwnedByMe(hzId)) return;
    var include = audience && Array.isArray(audience.include) ? audience.include.slice() : [];
    var exclude = audience && Array.isArray(audience.exclude) ? audience.exclude.slice() : [];
    hz.audience = { include:include, exclude:exclude };
    var pub = include.indexOf('everyone') >= 0;
    if (!hz.isPersonalDefault && !!hz.isPublished !== pub && typeof setHzPublished === 'function') setHzPublished(hzId, pub);
    if (typeof ONLINE !== 'undefined' && ONLINE && window.HNAPI && typeof HNAPI.saveHorizon === 'function') HNAPI.saveHorizon(hzId);
    if (typeof render === 'function') render();
    else if (typeof schedulePersist === 'function') schedulePersist();
  }
  function release(){
    if (typeof off === 'function') off();
    off = null;
  }
  function slot(){ return document.querySelector('#dscroll [data-hzcog]'); }
  function moreBtn(){ return document.querySelector('#dscroll [data-act="hzmore"]'); }
  function escId(id){
    if (typeof esc === 'function') return esc(id);
    return String(id).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }
  /* The cog button is the element HNCog.mount and HNCog.open share. It exists only after a successful mount. */
  function cogButton(el, hzId){
    if (!el || typeof el.querySelector !== 'function') return el;
    var btn = el.querySelector('[data-act="hzcog"]');
    if (btn) return btn;
    var icon = typeof ic === 'function' ? ic('cog', 16) : '';
    el.innerHTML = '<button type="button" class="btn vb icononly" data-act="hzcog" data-id="'+escId(hzId)+'" aria-label="Settings" aria-haspopup="menu">'+icon+'</button>';
    return el.querySelector('[data-act="hzcog"]') || el;
  }
  function mount(hzId){
    release();
    var hz = typeof HORIZONS !== 'undefined' && HORIZONS ? HORIZONS[hzId] : null;
    var el = slot();
    var btn = moreBtn();
    var cog = window.HNCog;
    if (!hz || typeof hzOwnedByMe !== 'function' || !hzOwnedByMe(hzId) || !el || !cog || typeof cog.mount !== 'function'){
      if (btn) btn.hidden = false;
      if (el){ el.hidden = true; if (typeof el.innerHTML === 'string') el.innerHTML = ''; }
      return false;
    }
    if (btn) btn.hidden = true;
    el.hidden = false;
    var host = cogButton(el, hzId);
    var next = cog.mount(host, {
      kind:'horizon',
      id:hzId,
      title:hz.name,
      audience:audienceOf(hz),
      canEdit:true,
      saveAudience:function(audience){ saveAudience(hzId, audience); },
      items:itemsFor(hzId)
    });
    off = typeof next === 'function' ? next : null;
    return true;
  }
  if (typeof document !== 'undefined' && document.addEventListener){
    document.addEventListener('click', function(ev){
      var b = ev.target && ev.target.closest && ev.target.closest('#dscroll [data-act="hzcog"]');
      if (!b) return;
      ev.preventDefault();
      ev.stopPropagation();
      var cog = window.HNCog;
      if (cog && typeof cog.open === 'function') cog.open(b);
    }, true);
  }
  window.HorizonCog = { mount:mount, release:release, saveAudience:saveAudience, audienceOf:audienceOf };
})();
