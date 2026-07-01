// Utility helpers attached to window for backward compatibility
(function(){
  function normalize(s){
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  }

  function todayISO(){ return new Date().toLocaleDateString('sv-SE'); }

  function fmtDate(iso){
    const d = new Date(iso+'T12:00:00');
    return d.toLocaleDateString('pt-BR',{weekday:'short', day:'2-digit', month:'short'});
  }

  function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

  function formatTime(seconds){
    const min = Math.floor(seconds/60);
    const sec = seconds % 60;
    return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  // EXERCISE_DB lookup helper (robust: use existing normalized map or build it)
  function detectGroup(name){
    try{
      const n = normalize(name);
      if(!n) return null;

      // Prefer a pre-built normalized map if available (either var or window prop)
      const preMap = (typeof EXERCISE_DB_NORMALIZED !== 'undefined') ? EXERCISE_DB_NORMALIZED : (window.EXERCISE_DB_NORMALIZED || null);

      let map = preMap;
      if(!map && typeof EXERCISE_DB !== 'undefined'){
        map = Object.fromEntries(Object.entries(EXERCISE_DB).map(([k,v])=>[normalize(k), v]));
      }

      if(map){
        if(map[n]) return map[n];
        let best = null, bestLen = 0;
        for(const key in map){
          if(n.includes(key) && key.length > bestLen){ best = map[key]; bestLen = key.length; }
        }
        return best;
      }

      return null;
    }catch(e){ return null; }
  }

  // Export to window for backwards compatibility
  window.normalize = normalize;
  window.todayISO = todayISO;
  window.fmtDate = fmtDate;
  window.uid = uid;
  window.formatTime = formatTime;
  window.detectGroup = detectGroup;
})();
