// Dashboard and calendar render (overrides inline functions)
function renderDashboard(){
  const c = document.getElementById('tab-content');
  const allDates = [...new Set(entries.map(e=>e.date))].sort().reverse();

  c.innerHTML = `
    <div class="filter-row">
      <div style="flex:1">
        <label>Data</label>
        <input type="date" id="filter-date" value="${filterDate}" onchange="onFilterDateChange(this.value)">
      </div>
      <div style="flex:1">
        <label>Grupamento</label>
        <select id="filter-group" onchange="filterGroup=this.value; renderDashboard()">
          <option value="todos" ${filterGroup==='todos'?'selected':''}>Todos</option>
          ${Object.keys(MUSCLE_LABELS).map(k=>`<option value="${k}" ${filterGroup===k?'selected':''}>${MUSCLE_LABELS[k]}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="card">
      <div id="calendar"></div>
    </div>
    <div id="day-summary"></div>
    <div id="share-card" class="card"></div>
    <div id="ex-groups"></div>
    <div class="card">
      <label>Histórico de dias</label>
      <div id="history-list">
        ${allDates.length===0?'<div class="empty">Nenhum treino registrado ainda</div>':
          allDates.map(d=>{
            return `<div class="day-list-item" onclick="filterDate='${d}'; document.getElementById('filter-date').value='${d}'; renderDashboard()">
              <span class="day-date">${fmtDate(d)}</span>
            </div>`;
          }).join('')}
      </div>
    </div>
  `;
  renderCalendar();
  renderDaySummary();
}

function onFilterDateChange(v){ filterDate = v; renderDashboard(); }

function setCalendarDate(date){ filterDate = date; document.getElementById('filter-date').value = date; renderDashboard(); }

function getSeriesCountForDate(date){ return entries.filter(e=>e.date===date).length; }

function getDayColor(count){
  if(!count) return 'rgba(255,255,255,0.03)';
  const intensity = Math.min(count, 8) / 8;
  const hue = 18 + intensity * 120;
  const lightness = 18 + intensity * 16;
  return `linear-gradient(135deg, hsl(${hue} 70% ${lightness}%), hsl(${hue + 10} 70% ${Math.max(22, lightness - 4)}%))`;
}

function renderCalendar(){
  const [year, month] = filterDate.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = firstDay.getDay();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();
  const weekdays = ['D','S','T','Q','Q','S','S'];
  const cells = [];

  for(let i = startOffset - 1; i >= 0; i--){
    const day = prevMonthDays - i;
    const prevMonth = month - 1 <= 0 ? 12 : month - 1;
    const prevYear = month - 1 <= 0 ? year - 1 : year;
    const date = `${prevYear}-${String(prevMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    cells.push({ date, day, muted:true });
  }

  for(let day = 1; day <= daysInMonth; day++){
    const date = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    cells.push({ date, day, muted:false });
  }

  let nextDay = 1;
  while(cells.length < 42){
    const nextMonth = month + 1 > 12 ? 1 : month + 1;
    const nextYear = month + 1 > 12 ? year + 1 : year;
    const date = `${nextYear}-${String(nextMonth).padStart(2,'0')}-${String(nextDay).padStart(2,'0')}`;
    cells.push({ date, day: nextDay, muted:true });
    nextDay += 1;
  }

  const title = firstDay.toLocaleDateString('pt-BR', { month:'long', year:'numeric' });
  const calendarHtml = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; gap:8px;">
      <label style="margin-bottom:0">Calendário</label>
      <div style="font-size:13px; color:var(--text-muted)">${title}</div>
    </div>
    <div class="calendar-grid">
      ${weekdays.map(w=>`<div class="calendar-weekday">${w}</div>`).join('')}
      ${cells.map(cell=>{
        const count = getSeriesCountForDate(cell.date);
        const isActive = filterDate === cell.date;
        const isToday = cell.date === todayISO();
        return `
          <button type="button" class="calendar-day ${cell.muted?'muted':''} ${isActive?'active':''} ${isToday?'today':''}" onclick="setCalendarDate('${cell.date}')" style="background:${getDayColor(count)}; color:${count>0?'#fff':'var(--text-muted)'}">
            <span class="day-number">${cell.day}</span>
            ${count>0?`<span class="day-count">${count} série${count>1?'s':''}</span>`:''}
          </button>
        `;
      }).join('')}
    </div>
  `;

  document.getElementById('calendar').innerHTML = calendarHtml;
}

function getFilteredEntries(){
  return entries.filter(e=>e.date===filterDate && (filterGroup==='todos' || e.muscleGroup===filterGroup));
}

function renderDaySummary(){
  const dayEntries = entries.filter(e=>e.date===filterDate && (filterGroup==='todos'||e.muscleGroup===filterGroup));
  const totalSets = dayEntries.length;
  const exNames = new Set(dayEntries.map(e=>e.exercise));

  const totalDuration = dayEntries.reduce((sum,e)=>sum + (e.durationSecs || 0) + (e.restSeconds || 0), 0);
  document.getElementById('day-summary').innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:8px;">
        <label style="margin-bottom:0">Feed do dia</label>
        <div style="font-size:12px; color:var(--text-muted)">${fmtDate(filterDate)}</div>
      </div>
      <div class="stat-grid">
        <div class="stat"><div class="num">${totalSets}</div><div class="lbl">Séries</div></div>
        <div class="stat"><div class="num">${exNames.size}</div><div class="lbl">Exercícios</div></div>
        <div class="stat"><div class="num">${formatTime(totalDuration)}</div><div class="lbl">Tempo total de treino</div></div>
      </div>
    </div>
  `;

  const byExercise = {};
  const groupSet = new Set();
  dayEntries.forEach(e=>{
    if(!byExercise[e.exercise]) byExercise[e.exercise] = { group:e.muscleGroup, sets:[] };
    byExercise[e.exercise].sets.push(e);
    groupSet.add(e.muscleGroup);
  });

  const groupsEl = document.getElementById('ex-groups');
  const names = Object.keys(byExercise);
  renderShareCard(totalSets, exNames.size, Array.from(groupSet));
  if(names.length===0){
    groupsEl.innerHTML = '<div class="card"><div class="empty">Nenhum exercício registrado para este filtro</div></div>';
    return;
  }
  groupsEl.innerHTML = `<div class="card">` + names.map(name=>{
    const data = byExercise[name];
    const color = MUSCLE_COLORS[data.group];
    return `
      <div class="ex-card" style="border-color:${color}">
        <div class="ex-title">
          <div class="ex-name">${name} <span style="color:${color}; font-size:11px; font-weight:700; margin-left:6px">${MUSCLE_LABELS[data.group]}</span></div>
        </div>
        <div class="set-chip-row">
          ${data.sets.map(s=>`
            <div class="set-chip" onmousedown="startEditPress('entry','${s.id}')" onmouseup="cancelEditPress()" onmouseleave="cancelEditPress()" ontouchstart="startEditPress('entry','${s.id}')" ontouchend="cancelEditPress()" ontouchcancel="cancelEditPress()">
              ${s.reps}×${s.weight}kg${s.durationSecs?` · ${formatTime(s.durationSecs)}`:''}${s.restSeconds?` · descanso ${formatTime(s.restSeconds)}`:''}
              <button onclick="event.stopPropagation(); deleteEntry('${s.id}')">✕</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('') + `</div>`;
}

function deleteEntry(id){
  entries = entries.filter(e=>e.id!==id);
  saveEntries();
  renderDashboard();
}
