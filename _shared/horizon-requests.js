(function(){
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
  function targetOf(m){
    var hz = typeof HORIZONS !== 'undefined' && HORIZONS ? HORIZONS[m.cardId] : null;
    return { type:'horizon', id:m.cardId, name:m.cardName || (hz && hz.name) || '' };
  }
  function toItem(cid, m){
    return {
      id:idOf(cid, m),
      kind:'horizon_invite',
      role:String(m.invite || '').indexOf('follower') >= 0 ? 'follower' : 'collaborator',
      from:personOf(m.from),
      target:targetOf(m),
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
  function pendingCount(){
    var n = 0;
    list().forEach(function(it){ if (it.status === 'pending') n += 1; });
    return n;
  }
  function findInvite(id){
    var hit = null;
    walk(function(cid, m){
      if (hit || !incoming(m) || idOf(cid, m) !== id) return;
      hit = { cid:cid, m:m };
    });
    return hit;
  }
  function answer(word, id){
    if (typeof respondHzInvite !== 'function') return;
    var hit = findInvite(id);
    if (!hit) return;
    respondHzInvite(hit.cid, hit.m.cardId, word, hit.m.id || null);
  }
  var provider = {
    kind:'horizon_invite',
    list:list,
    accept:function(id){ answer('accept', id); },
    decline:function(id){ answer('decline', id); },
    undo:function(id){ answer('undo', id); },
    pendingCount:pendingCount
  };
  var ready = false;
  function registered(){ return ready; }
  function registerHorizonRequests(){
    if (!(window.HNRel && window.HNRel.requests && typeof window.HNRel.requests.register === 'function')) return false;
    try {
      window.HNRel.requests.register(provider);
    } catch (err) {
      return false;
    }
    ready = true;
    return true;
  }
  window.HorizonRequests = { idOf:idOf, registered:registered, register:registerHorizonRequests };
  registerHorizonRequests();
})();
