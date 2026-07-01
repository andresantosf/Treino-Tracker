// Share card renderer (overrides inline renderShareCard)
function renderShareCard(totalSets, exerciseCount, groups){
  const shareCard = document.getElementById('share-card');
  if(!shareCard) return;

  const dayEntries = entries.filter(e=>e.date===filterDate && (filterGroup==='todos'|| e.muscleGroup===filterGroup));
  const totalDuration = dayEntries.reduce((sum,e)=>sum + (e.durationSecs || 0), 0);
  const avgDuration = dayEntries.length ? Math.round(totalDuration / dayEntries.length) : 0;
  const restEntries = dayEntries.filter(e=>typeof e.restSeconds === 'number');
  const totalRest = restEntries.reduce((sum,e)=>sum + (e.restSeconds || 0), 0);
  const avgRest = restEntries.length ? Math.round(totalRest / restEntries.length) : 0;

  const badges = groups.length > 0 ? groups.map(group=>`
      <div class="share-badge">
        <div class="badge-icon" style="background:${MUSCLE_COLORS[group]}33; color:${MUSCLE_COLORS[group]};">${MUSCLE_LABELS[group].slice(0,2)}</div>
        <div class="badge-label">${MUSCLE_LABELS[group]}</div>
      </div>
    `).join('') : '<div class="share-placeholder">Sem grupamentos ainda</div>';

  shareCard.innerHTML = `
    <div class="share-preview">
      <div class="share-header">
        <div>
          <div class="share-subtitle">Resumo do treino de hoje</div>
          <div class="share-title">${fmtDate(filterDate)}</div>
        </div>
        <button class="btn btn-primary" onclick="downloadShareImage()">Baixar PNG</button>
      </div>
      <div class="share-stats">
        <div class="share-stat"><div class="num">${totalSets}</div><div class="lbl">Séries Totais</div></div>
        <div class="share-stat"><div class="num">${exerciseCount}</div><div class="lbl">Exercícios</div></div>
        <div class="share-stat"><div class="num">${groups.length}</div><div class="lbl">Grupamentos</div></div>
        <div class="share-stat"><div class="num">${formatTime(avgDuration)}</div><div class="lbl">Média de Execução</div></div>
        <div class="share-stat"><div class="num">${formatTime(avgRest)}</div><div class="lbl">Média de Descanso</div></div>
      </div>
      <div class="share-badges">
        ${badges}
      </div>
    </div>
    <canvas id="share-canvas" width="1200" height="1200" style="display:none"></canvas>
    `;
}
