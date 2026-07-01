(function(){
  // Timer state lives on window for compatibility
  window.timerIntervalId = null;
  window.timerSeconds = 0;
  window.activeSet = null;
  window.timerMode = 'idle';
  window.restTargetSetId = null;

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
    window.timerIntervalId = setInterval(()=>{ window.timerSeconds += 1; renderRegistrar(); }, 1000);
    renderRegistrar();
  }

  function enterRestMode(){
    if(window.timerMode !== 'work' || !window.activeSet) return;
    if(window.timerIntervalId){ clearInterval(window.timerIntervalId); window.timerIntervalId = null; }
    window.repsModalMode = 'rest';
    window.repsModalOpen = true;
    render();
  }

  function finishSet(){
    if(window.timerMode !== 'work' || !window.activeSet){ alert('Inicie o timer antes de finalizar.'); return; }
    if(window.timerIntervalId){ clearInterval(window.timerIntervalId); window.timerIntervalId = null; }
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
      window.timerIntervalId = setInterval(()=>{ window.timerSeconds += 1; renderRegistrar(); }, 1000);
      saveDraft();
      renderSetList();
      render();
      return;
    }

    window.timerMode = 'idle';
    window.timerSeconds = 0;
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
    renderRegistrar();
  }

  function cancelSet(){
    if(window.timerIntervalId){ clearInterval(window.timerIntervalId); window.timerIntervalId = null; window.activeSet = null; window.restTargetSetId = null; window.timerMode = 'idle'; window.timerSeconds = 0; renderRegistrar(); }
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
