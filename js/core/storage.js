(function(){
  function loadEntries(){
    try{ const data = localStorage.getItem('treino-entries'); window.entries = data ? JSON.parse(data) : []; }catch(e){ window.entries = []; }
  }
  function saveEntries(){ try{ localStorage.setItem('treino-entries', JSON.stringify(window.entries || [])); }catch(e){} }
  function loadDraft(){ try{
      const data = localStorage.getItem('treino-draft');
      if(data){ const parsed = JSON.parse(data); window.draft = Object.assign({ date: todayISO(), exerciseName:'', manualGroup:null, pendingSets:[] }, parsed); return; }
    }catch(e){}
    window.draft = window.draft || { date: todayISO(), exerciseName:'', manualGroup:null, pendingSets:[] };
  }
  function saveDraft(){ try{ localStorage.setItem('treino-draft', JSON.stringify(window.draft || {})); }catch(e){} }
  function clearDraft(){ window.draft = { date: todayISO(), exerciseName:'', manualGroup:null, pendingSets:[] }; saveDraft(); }

  window.loadEntries = loadEntries;
  window.saveEntries = saveEntries;
  window.loadDraft = loadDraft;
  window.saveDraft = saveDraft;
  window.clearDraft = clearDraft;
})();
