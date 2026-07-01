(function(){
  // Timer state lives on window for compatibility
  window.timerIntervalId = null;
  window.timerSeconds = 0;
  window.timerStartedAt = null;
  window.activeSet = null;
  window.timerMode = 'idle';
  window.restTargetSetId = null;

  function saveTimerState(){
    if(window.timerMode !== 'work' && window.timerMode !== 'rest'){
      try{ localStorage.removeItem('treino-timer-state'); }catch(e){}
      return;
    }
    try{
      localStorage.setItem('treino-timer-state', JSON.stringify({
        mode: window.timerMode,
        startedAt: window.timerStartedAt,
        seconds: window.timerSeconds,
        activeSet: window.activeSet,
        restTargetSetId: window.restTargetSetId
      }));
    }catch(e){}
  }

  function restoreTimerState(){
    try{
      const raw = localStorage.getItem('treino-timer-state');
      if(!raw) return;
      const state = JSON.parse(raw);
      if(state.mode !== 'work' && state.mode !== 'rest') return;
      window.timerMode = state.mode;
      window.timerStartedAt = state.startedAt || null;
      window.activeSet = state.activeSet || null;
      window.restTargetSetId = state.restTargetSetId || null;
      window.timerSeconds = Number(state.seconds) || 0;
      if(window.timerStartedAt){
        window.timerSeconds = Math.max(0, Math.floor((Date.now() - window.timerStartedAt)/1000));
      }
      if(window.timerIntervalId){ clearInterval(window.timerIntervalId); }
      window.timerIntervalId = setInterval(()=>{
        if(window.timerMode === 'work' || window.timerMode === 'rest'){
          if(window.timerStartedAt){
            window.timerSeconds = Math.max(0, Math.floor((Date.now() - window.timerStartedAt)/1000));
          }
          if(typeof renderRegistrar === 'function') renderRegistrar();
        }
      }, 1000);
      saveTimerState();
    }catch(e){ localStorage.removeItem('treino-timer-state'); }
  }

  function syncTimerState(){
    if((window.timerMode !== 'work' && window.timerMode !== 'rest') || !window.timerStartedAt) return;
    window.timerSeconds = Math.max(0, Math.floor((Date.now() - window.timerStartedAt)/1000));
  }

  function startTimerLoop(){
    if(window.timerIntervalId) return;
    window.timerIntervalId = setInterval(()=>{
      if(window.timerMode === 'work' || window.timerMode === 'rest'){
        syncTimerState();
        if(typeof renderRegistrar === 'function') renderRegistrar();
      }
    }, 1000);
  }

  function startSetTimer(){
    const name = document.getElementById('ex-name').value.trim();
    const weight = document.getElementById('set-weight').value;
    const group = detectGroup(name) || (window.draft && window.draft.manualGroup);
    if(!name){ alert('Informe o exercício para iniciar.'); return; }
    if(!group){ alert('Selecione o grupamento muscular.'); return; }
    if(!weight){ alert('Informe o peso para iniciar.'); return; }
    if(window.timerIntervalId){ return; }
    window.activeSet = { exercise:name, group, weight:Number(weight), startAt: Date.now() };
    window.timerMode = 'work';
    window.timerSeconds = 0;
    window.timerStartedAt = Date.now();
    saveTimerState();
    startTimerLoop();
    renderRegistrar();
  }

  function enterRestMode(){
    if(window.timerMode !== 'work' || !window.activeSet) return;
    if(window.timerIntervalId){ clearInterval(window.timerIntervalId); window.timerIntervalId = null; }
    window.timerStartedAt = null;
    saveTimerState();
    window.repsModalMode = 'rest';
    window.repsModalOpen = true;
    render();
  }

  function finishSet(){
    if(window.timerMode !== 'work' || !window.activeSet){ alert('Inicie o timer antes de finalizar.'); return; }
    if(window.timerIntervalId){ clearInterval(window.timerIntervalId); window.timerIntervalId = null; }
    window.timerStartedAt = null;
    saveTimerState();
    window.repsModalMode = 'save';
    window.repsModalOpen = true;
    render();
  }

  function submitRepsModal(){
    const repsInput = document.getElementById('reps-modal-input');
    if(!repsInput) return;
    const reps = repsInput.value.trim();
    const repsNumber = Number(reps);
    if(!reps || Number.isNaN(repsNumber) || repsNumber <= 0){ alert('Informe um número válido de repetições.'); return; }
    const duration = window.timerSeconds;
    const set = {
      id: uid(), exercise: window.activeSet.exercise, group: window.activeSet.group,
      reps: repsNumber, weight: window.activeSet.weight, durationSecs: duration, restSeconds: null, createdAt: Date.now()
    };
    window.draft.pendingSets.push(set);
    window.activeSet = null;
    window.repsModalOpen = false;

    if(window.repsModalMode === 'rest'){
      window.timerMode = 'rest';
      window.restTargetSetId = set.id;
      window.timerSeconds = 0;
      window.timerStartedAt = Date.now();
      saveTimerState();
      startTimerLoop();
      saveDraft();
      renderSetList();
      render();
      return;
    }

    window.timerMode = 'idle';
    window.timerSeconds = 0;
    window.timerStartedAt = null;
    saveTimerState();
    saveDraft();
    renderSetList();
    render();
  }

  function closeRepsModal(){ window.repsModalOpen = false; render(); }

  function stopRest(){
    if(window.timerMode !== 'rest') return;
    if(window.timerIntervalId){ clearInterval(window.timerIntervalId); window.timerIntervalId = null; }
    if(window.restTargetSetId){ const set = window.draft.pendingSets.find(s => s.id === window.restTargetSetId); if(set){ set.restSeconds = window.timerSeconds; } window.restTargetSetId = null; saveDraft(); renderSetList(); }
    window.timerMode = 'idle';
    window.timerSeconds = 0;
    window.timerStartedAt = null;
    saveTimerState();
    renderRegistrar();
  }

  function cancelSet(){
    if(window.timerIntervalId){ clearInterval(window.timerIntervalId); window.timerIntervalId = null; }
    window.activeSet = null;
    window.restTargetSetId = null;
    window.timerMode = 'idle';
    window.timerSeconds = 0;
    window.timerStartedAt = null;
    saveTimerState();
    renderRegistrar();
  }

  // Long-press helpers
  window.longPressTimer = null;
  function startEditPress(source, id){ if(window.longPressTimer){ clearTimeout(window.longPressTimer); } window.longPressTimer = setTimeout(()=>{ openEditModal(source, id); window.longPressTimer = null; }, 600); }
  function cancelEditPress(){ if(window.longPressTimer){ clearTimeout(window.longPressTimer); window.longPressTimer = null; } }

  // Expose
  window.startSetTimer = startSetTimer;
  window.enterRestMode = enterRestMode;
  window.finishSet = finishSet;
  window.submitRepsModal = submitRepsModal;
  window.closeRepsModal = closeRepsModal;
  window.stopRest = stopRest;
  window.cancelSet = cancelSet;
  window.startEditPress = startEditPress;
  window.cancelEditPress = cancelEditPress;
})();
