(function(){
  function esc(s){
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function idOf(cid, m){
    if (m && typeof m.id === 'string' && m.id) return m.id;
    return cid + ':' + (m && m.cardId);
  }
  function stateWord(m){
    return String(m && m.invite != null ? m.invite : '').split(' ')[0];
  }
  function listedState(word){
    return word === 'pending' || word === 'accepted' || word === 'declined';
  }
  function incoming(m){
    return !!(m && m.cardType === 'horizon_invite' && m.from !== 'self');
  }
  function personOf(id){
    var p = typeof PEOPLE !== 'undefined' && PEOPLE ? PEOPLE[id] : null;
    return { id:id, name:(p && p.displayName) || '', avatar:(p && p.avatar) || null };
  }
  function horizonOf(m){
    var hz = typeof HORIZONS !== 'undefined' && HORIZONS ? HORIZONS[m.cardId] : null;
    return { id:m.cardId, name:m.cardName || (hz && hz.name) || '' };
  }
  function toItem(cid, m){
    return {
      id:idOf(cid, m),
      role:String(m.invite || '').indexOf('follower') >= 0 ? 'follower' : 'collaborator',
      from:personOf(m.from),
      horizon:horizonOf(m),
      createdAt:typeof m.ts === 'string' ? m.ts : null,
      status:stateWord(m)
    };
  }
  function walk(fn){
    if (typeof CHATS === 'undefined' || !CHATS || typeof CHATS !== 'object') return;
    Object.keys(CHATS).forEach(function(cid){
      var msgs = CHATS[cid] && CHATS[cid].messages;
      if (!msgs || typeof msgs.forEach !== 'function') return;
      msgs.forEach(function(m){ fn(cid, m); });
    });
  }
  function list(){
    var items = [];
    walk(function(cid, m){
      if (!incoming(m) || !listedState(stateWord(m))) return;
      items.push(toItem(cid, m));
    });
    return items;
  }
  function count(){
    var n = 0;
    list().forEach(function(it){ if (it.status === 'pending') n += 1; });
    return n;
  }
  function render(item){
    var hz = item && item.horizon || {};
    var card = typeof ChatCards !== 'undefined' && ChatCards && typeof ChatCards.get === 'function' && ChatCards.get('horizon_invite');
    var phrase = card && typeof card.phrase === 'function' ? card.phrase({
      cardId: hz.id,
      cardName: hz.name || '',
      invite: item && item.role === 'follower' ? 'pending follower' : 'pending',
      from: 'other'
    }) : '';
    var name = hz.name || '';
    var at = name ? String(phrase).lastIndexOf(name) : -1;
    var button = '<button type="button" class="hzname" data-act="open" data-type="horizon" data-id="'+esc(hz.id)+'">'+esc(name)+'</button>';
    if (at < 0) return esc(phrase);
    return esc(phrase.slice(0, at)) + button + esc(phrase.slice(at + name.length));
  }
  function findInvite(id){
    var hit = null;
    walk(function(cid, m){
      if (hit || !incoming(m) || idOf(cid, m) !== id) return;
      hit = { cid:cid, m:m };
    });
    return hit;
  }
  function answer(word, item){
    return new Promise(function(resolve){
      var id = item && item.id;
      if (typeof respondHzInvite === 'function' && id){
        var hit = findInvite(id);
        if (hit) respondHzInvite(hit.cid, hit.m.cardId, word, hit.m.id || null);
      }
      resolve();
    });
  }
  var provider = {
    type:'horizon_invite',
    label:'Horizon invites',
    list:list,
    count:count,
    render:render,
    accept:function(item){ return answer('accept', item); },
    decline:function(item){ return answer('decline', item); },
    undo:function(item){ return answer('undo', item); }
  };
  var ready = false;
  var off = null;
  function registered(){ return ready; }
  function changed(){
    var rel = window.HNRel;
    if (rel && typeof rel.requestsChanged === 'function') rel.requestsChanged();
  }
  function registerHorizonRequests(){
    var rel = window.HNRel;
    if (!(rel && typeof rel.registerRequestProvider === 'function')) return false;
    try {
      var next = rel.registerRequestProvider(provider);
      if (typeof off === 'function') off();
      off = typeof next === 'function' ? next : null;
    } catch (err) {
      return false;
    }
    ready = true;
    return true;
  }
  window.HorizonRequests = { idOf:idOf, registered:registered, register:registerHorizonRequests, changed:changed };
  registerHorizonRequests();
})();
