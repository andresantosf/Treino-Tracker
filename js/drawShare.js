// Externalized image generator that uses SHARE_TEMPLATES defined in js/share-templates.js
function downloadShareImage(templateName){
  const tpl = (window.SHARE_TEMPLATES && window.SHARE_TEMPLATES[templateName]) ? window.SHARE_TEMPLATES[templateName] : (window.SHARE_TEMPLATES && window.SHARE_TEMPLATES.default);
  if(!tpl) return;
  const canvas = document.getElementById('share-canvas');
  if(!canvas) return;
  canvas.width = tpl.canvasWidth || canvas.width;
  canvas.height = tpl.canvasHeight || canvas.height;
  const ctx = canvas.getContext('2d');

  const dayEntries = entries.filter(e=>e.date===filterDate && (filterGroup==='todos'||e.muscleGroup===filterGroup));
  const totalSets = dayEntries.length;
  const exerciseCount = new Set(dayEntries.map(e=>e.exercise)).size;
  const groups = Array.from(new Set(dayEntries.map(e=>e.muscleGroup)));
  const totalDuration = dayEntries.reduce((sum,e)=>sum + (e.durationSecs || 0) + (e.restSeconds || 0), 0);

  ctx.clearRect(0,0,canvas.width,canvas.height);

  const padding = tpl.padding || 80;
  ctx.fillStyle = 'rgba(22,22,22,0.4)';
  ctx.fillRoundRect(padding - 16, 40, canvas.width - padding*2 + 32, 170, 36);

  ctx.fillStyle = '#f5f3ee';
  ctx.font = 'bold 72px Inter';
  ctx.fillText('Resumo do Treino', padding, 120);
  ctx.font = '600 36px Inter';
  ctx.fillStyle = '#c7c6cf';
  ctx.fillText(fmtDate(filterDate).toUpperCase(), padding, 170);

  const statTop = tpl.stat.top;
  const statWidth = (canvas.width - padding*2 - (tpl.stat.gapX * 2))/3;
  [['Séries', totalSets], ['Exercícios', exerciseCount], ['Grupamentos', groups.length]].forEach((item,i)=>{
    const x = padding + i*(statWidth + tpl.stat.gapX);
    ctx.fillStyle = 'rgba(22,22,22,0.2)';
    ctx.fillRoundRect(x, statTop, statWidth, tpl.stat.height, 36);
    ctx.fillStyle = '#ff5a36';
    ctx.font = 'bold 96px Inter';
    ctx.fillText(item[1], x + 30, statTop + 135);
    ctx.fillStyle = '#f5f3ee';
    ctx.font = '700 28px Inter';
    ctx.fillText(item[0], x + 30, statTop + 190);
  });

  const totalBlockTop = statTop + tpl.totalBlock.topOffset;
  const totalBlockHeight = tpl.totalBlock.height;
  const innerPad = tpl.totalBlock.innerPadding;
  ctx.fillStyle = 'rgba(22,22,22,0.2)';
  ctx.fillRoundRect(padding, totalBlockTop, canvas.width - padding*2, totalBlockHeight, 36);
  ctx.fillStyle = '#ff5a36';
  ctx.font = 'bold 64px Inter';
  ctx.fillText(formatTime(totalDuration), padding + innerPad, totalBlockTop + 108);
  ctx.fillStyle = '#f5f3ee';
  ctx.font = '700 24px Inter';
  ctx.fillText('Tempo total de treino', padding + innerPad, totalBlockTop + 52);

  const badgeTop = totalBlockTop + totalBlockHeight + tpl.badge.topGap;
  ctx.fillStyle = '#f5f3ee';
  ctx.font = '800 36px Inter';
  let tagX = padding;
  let tagY = badgeTop + 60;
  const tagGapX = tpl.badge.tagGapX;
  const tagGapY = tpl.badge.tagGapY;
  const tagHeight = tpl.badge.tagHeight;
  ctx.font = '800 28px Inter';
  groups.forEach((group,i) => {
    const tagText = `# ${MUSCLE_LABELS[group]}`;
    const textWidth = ctx.measureText(tagText).width;
    const tagWidth = textWidth + 140;
    if(tagX + tagWidth > canvas.width - padding){
      tagX = padding;
      tagY += tagHeight + tagGapY;
    }
    const rawColor = MUSCLE_COLORS[group] || '#fff';
    const cssVarMatch = rawColor.match(/^var\((--[^\)]+)\)$/);
    const resolvedColor = cssVarMatch ? getComputedStyle(document.documentElement).getPropertyValue(cssVarMatch[1]).trim() || rawColor : rawColor;
    ctx.fillStyle = 'rgba(22,22,22,0.22)';
    ctx.fillRoundRect(tagX, tagY, tagWidth, tagHeight, tagHeight/2);
    ctx.fillStyle = resolvedColor;
    ctx.fillRoundRect(tagX + 22, tagY + 14, 32, 32, 16);
    ctx.fillStyle = '#fff';
    ctx.font = '800 32px Inter';
    ctx.fillText(tagText, tagX + 74, tagY + 42);
    tagX += tagWidth + tagGapX;
  });
  if(groups.length === 0){
    ctx.fillStyle = '#9b9aa3';
    ctx.font = '700 32px Inter';
    ctx.fillText('Nenhum treino registrado', padding, badgeTop + 140);
  }

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `treino-${filterDate}.png`;
  link.click();
}
