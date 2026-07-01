// Registrar screen render and helpers (overrides inline functions)
function renderRegistrar(){
  const c = document.getElementById('tab-content');
  const detected = detectGroup(draft.exerciseName);
  const group = detected || draft.manualGroup;
  const timerActive = Boolean(timerIntervalId);
  const displayWeight = activeSet ? activeSet.weight : document.getElementById('set-weight')?.value || '';

  c.innerHTML = `
    <div class="card">
      <label>Data</label>
      <input type="date" id="ex-date" value="${draft.date}" onchange="onDraftDateChange(this.value)">
    </div>
    <div class="card">
      <label>Exercício</label>
      <div class="combo-wrap">
        <input type="text" id="ex-name" placeholder="ex: Supino inclinado" autocomplete="off" value="${draft.exerciseName||''}" oninput="onExerciseInput()" onfocus="renderExerciseSuggestions()" onblur="setTimeout(hideExerciseSuggestions, 120)">
        <div class="combo-suggestions" id="ex-suggestions"></div>
      </div>
      <div id="group-area"></div>
    </div>

    <div class="card">
      <label>Série com cronômetro</label>
      <div class="timer-card ${timerMode==='rest'?'rest':''}">
        <div class="timer-header ${timerMode==='rest'?'rest':''}">${timerMode==='rest' ? 'Descanso ativo' : draft.exerciseName ? `Exercício selecionado: <strong>${draft.exerciseName}</strong>` : 'Selecione um exercício'}</div>
        <div class="timer-row">
          <div class="timer-field">
            <label>Peso (kg)</label>
            <input type="number" id="set-weight" inputmode="decimal" pattern="[0-9]*" min="0" step="0.5" placeholder="40" value="${displayWeight}" ${timerMode==='work' ? 'disabled' : ''}>
          </div>
          <div class="timer-value ${timerMode==='rest'?'rest':''}">${timerMode==='rest'? 'Descanso ' : ''}${formatTime(timerSeconds)}</div>
        </div>
        <div class="timer-actions">
          ${timerMode==='work' ? `
            <button class="btn btn-primary" onclick="enterRestMode()">Descanso</button>
            <button class="btn btn-ghost" onclick="finishSet()">Finalizar</button>
            <button class="btn btn-small btn-ghost" onclick="cancelSet()">Cancelar</button>
          ` : timerMode==='rest' ? `
            <button class="btn btn-primary" onclick="stopRest()">Parar descanso</button>
            <button class="btn btn-small btn-ghost" onclick="cancelSet()">Cancelar</button>
          ` : `
            <button class="btn btn-primary" onclick="startSetTimer()">Iniciar</button>
          `}
        </div>
      </div>
    </div>

    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center">
        <label style="margin-bottom:0">Séries adicionadas (${draft.pendingSets.length})</label>
        ${draft.pendingSets.length>0?'<button class="btn-small btn-ghost" style="width:auto" onclick="discardDraft()">Limpar</button>':''}
      </div>
      <div style="height:8px"></div>
      <div id="set-list"></div>
    </div>

    <button class="btn btn-primary" onclick="saveWorkout()">Salvar treino</button>
  `;

  renderGroupArea(group);
  renderSetList();
}

function renderExerciseSuggestions(){
  const input = document.getElementById('ex-name');
  const box = document.getElementById('ex-suggestions');
  if(!input || !box) return;

  const query = normalize(input.value);
  const matches = Object.keys(EXERCISE_DB)
    .filter(name => !query || normalize(name).includes(query))
    .slice(0, 8);

  if(!matches.length){
    box.innerHTML = '';
    box.style.display = 'none';
    return;
  }

  box.innerHTML = matches.map(name => `
    <button type="button" class="combo-option" data-value="${name}" onclick="selectExercise(this.getAttribute('data-value'))">${name}</button>
  `).join('');
  box.style.display = 'block';
}

function hideExerciseSuggestions(){
  const box = document.getElementById('ex-suggestions');
  if(box) box.style.display = 'none';
}

function selectExercise(value){
  const input = document.getElementById('ex-name');
  if(!input) return;
  input.value = value;
  draft.exerciseName = value;
  const detected = detectGroup(draft.exerciseName);
  if(detected) draft.manualGroup = null;
  renderGroupArea(detected || draft.manualGroup);
  hideExerciseSuggestions();
  saveDraft();
}

function onExerciseInput(){
  draft.exerciseName = document.getElementById('ex-name').value;
  const detected = detectGroup(draft.exerciseName);
  if(detected) draft.manualGroup = null;
  renderGroupArea(detected || draft.manualGroup);
  renderExerciseSuggestions();
  saveDraft();
}

function renderGroupArea(group){
  const area = document.getElementById('group-area');
  if(!area) return;
  if(group){
    area.innerHTML = `
      <div class="group-badge" style="background:${MUSCLE_COLORS[group]}22; color:${MUSCLE_COLORS[group]}">
        <span class="dot" style="background:${MUSCLE_COLORS[group]}"></span>${MUSCLE_LABELS[group]}
      </div>`;
  } else {
    area.innerHTML = `
      <div style="margin-top:10px">
        <label>Grupamento não identificado — selecione manualmente</label>
        <select id="manual-group" onchange="onManualGroupChange(this.value)">
          <option value="">Selecione…</option>
          ${Object.keys(MUSCLE_LABELS).map(k=>`<option value="${k}">${MUSCLE_LABELS[k]}</option>`).join('')}
        </select>
      </div>`;
  }
}

function onManualGroupChange(v){
  draft.manualGroup = v;
  renderGroupArea(v);
  saveDraft();
}

function removeSet(id){
  draft.pendingSets = draft.pendingSets.filter(s=>s.id!==id);
  renderSetList();
  saveDraft();
}

function discardDraft(){
  if(draft.pendingSets.length>0 && !confirm('Descartar todas as séries ainda não salvas?')) return;
  const keepDate = draft.date;
  draft = { date: keepDate, exerciseName:'', manualGroup:null, pendingSets:[] };
  saveDraft();
  renderRegistrar();
}

function renderSetList(){
  const el = document.getElementById('set-list');
  if(!el) return;
  const header = document.querySelector('#tab-content .card:nth-child(3) label');
  if(header) header.textContent = `Séries adicionadas (${draft.pendingSets.length})`;
  if(draft.pendingSets.length===0){ el.innerHTML = '<div class="empty">Nenhuma série adicionada ainda</div>'; return; }

  const order = [];
  const byExercise = {};
  draft.pendingSets.forEach(s=>{
    if(!byExercise[s.exercise]){ byExercise[s.exercise] = []; order.push(s.exercise); }
    byExercise[s.exercise].push(s);
  });

  el.innerHTML = order.map(name=>{
    const sets = byExercise[name];
    const color = MUSCLE_COLORS[sets[0].group];
    return `
      <div style="margin-bottom:12px">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:6px">
          <span class="dot" style="background:${color}"></span>
          <span style="font-weight:700; font-size:13px">${name}</span>
        </div>
        ${sets.map((s,i)=>`
          <div class="set-row" onmousedown="startEditPress('draft','${s.id}')" onmouseup="cancelEditPress()" onmouseleave="cancelEditPress()" ontouchstart="startEditPress('draft','${s.id}')" ontouchend="cancelEditPress()" ontouchcancel="cancelEditPress()">
            <div class="set-num">${i+1}</div>
            <div class="set-data">
              <div><span class="lbl">reps</span>${s.reps}</div>
              <div><span class="lbl">kg</span>${s.weight}</div>
              ${s.durationSecs?`<div><span class="lbl">tempo</span>${formatTime(s.durationSecs)}</div>`:''}
              ${s.restSeconds?`<div><span class="lbl">descanso</span>${formatTime(s.restSeconds)}</div>`:''}
            </div>
            <button class="del-btn" onclick="event.stopPropagation(); removeSet('${s.id}')">✕</button>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');
}
