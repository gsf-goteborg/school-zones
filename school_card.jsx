// SchoolCard — anchored floating card for a clicked school
// Pops out from the school marker, pointer-tail connects it to the map
// Esc or click-outside to close

const { useEffect, useState, useRef } = React;

// Synthetic but deterministic per-school data, derived from id+students
function useSchoolDetail(school) {
  return React.useMemo(()=>{
    if (!school) return null;
    const seed = [...school.id].reduce((a,c)=>a*31 + c.charCodeAt(0), 7);
    const r = (n)=>{ let x = Math.sin(seed+n)*10000; return x - Math.floor(x); };
    const base = school.students;
    const trend = [0,1,2,3,4].map(i => Math.round(base * (0.82 + 0.05*i + (r(i)-0.5)*0.07)));
    trend.push(base);
    const classes = Math.max(6, Math.round(school.students / (20 + r(10)*4)));
    const teachers = Math.max(10, Math.round(school.students / (10 + r(11)*2)));
    const satisfaction = Math.round(65 + r(12)*25);
    const newcomers = Math.round(5 + r(13)*25);
    const established = 1900 + Math.floor(r(14)*120);
    const fk3 = Math.round(35 + r(15)*15);
    const y46 = Math.round(25 + r(16)*15);
    const y79 = Math.max(0, 100 - fk3 - y46);
    return { trend, classes, teachers, satisfaction, newcomers, established,
             grades:{fk3, y46, y79},
             classSize: +(school.students/classes).toFixed(1),
             ratio: +(school.students/teachers).toFixed(1) };
  }, [school?.id]);
}

// Mini sparkline
function SparkLine({ values, color, w=220, h=48 }) {
  const P = 4;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v,i)=>[P + (i/(values.length-1))*(w-2*P), P + (1-(v-min)/span)*(h-2*P)]);
  const path = pts.map((p,i)=>`${i?'L':'M'} ${p[0]} ${p[1]}`).join(' ');
  const fill = path + ` L ${w-P} ${h-P} L ${P} ${h-P} Z`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={fill} fill={color} opacity="0.15"/>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=>(
        <circle key={i} cx={p[0]} cy={p[1]} r={i===pts.length-1?3.5:1.8}
                fill={i===pts.length-1?color:'#FFF'} stroke={color} strokeWidth={i===pts.length-1?0:1.2}/>
      ))}
    </svg>
  );
}

function MiniDonut({ segs, size=58, thickness=9 }) {
  const R = size/2, r = R - thickness/2;
  const C = 2*Math.PI*r;
  const total = segs.reduce((a,s)=>a+s.value,0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={R} cy={R} r={r} fill="none" stroke="#EFEBDE" strokeWidth={thickness}/>
      {segs.map((s,i)=>{
        const dash = (s.value/total)*C;
        const c = <circle key={i} cx={R} cy={R} r={r} fill="none" stroke={s.color}
                          strokeWidth={thickness} strokeDasharray={`${dash} ${C-dash}`}
                          strokeDashoffset={-offset}
                          transform={`rotate(-90 ${R} ${R})`}/>;
        offset += dash; return c;
      })}
    </svg>
  );
}

// Minimal KPI row for mobile bottom sheet
function MobileKPIs({ detail }) {
  const items = [
    { label:'Klasstorlek', val: detail.classSize, unit:'el/kl' },
    { label:'Lärartäthet', val: detail.ratio, unit:'el/lär' },
    { label:'Nyanlända',   val: detail.newcomers, unit:'%' },
    { label:'Nöjdhet',     val: detail.satisfaction, unit:'%' },
  ];
  return (
    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
      {items.map((k,i)=>(
        <div key={i} style={{background:'#FBF9F3', border:'1px solid var(--line)', borderRadius:6, padding:'10px 12px'}}>
          <div style={{fontSize:10, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.1em', color:'var(--mute)', textTransform:'uppercase'}}>{k.label}</div>
          <div style={{display:'flex', alignItems:'baseline', gap:4, marginTop:2}}>
            <span style={{fontSize:20, fontWeight:800, color:'var(--ink)', letterSpacing:'-0.02em', fontVariantNumeric:'tabular-nums'}}>{k.val}</span>
            <span style={{fontSize:11, fontWeight:600, color:'var(--slate-2)'}}>{k.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SchoolCard({ school, onClose, isMobile }) {
  const [anchor, setAnchor] = useState(null); // {x, y, containerW, containerH}
  const [mounted, setMounted] = useState(false);
  const detail = useSchoolDetail(school);

  // Compute anchor position by projecting the school latlng to the map's pixel coordinates
  useEffect(()=>{
    if (!school) { setMounted(false); return; }
    let raf;
    const update = () => {
      const g = window.__gbgMap;
      if (!g || !g.map) { raf = requestAnimationFrame(update); return; }
      const container = g.map.getContainer();
      const pt = g.map.latLngToContainerPoint([school.lat, school.lng]);
      const rect = container.getBoundingClientRect();
      setAnchor({
        x: pt.x, y: pt.y,
        containerW: rect.width, containerH: rect.height,
      });
    };
    update();
    // Re-sync on map move/zoom
    const onMove = () => update();
    const map = window.__gbgMap && window.__gbgMap.map;
    if (map) { map.on('move', onMove); map.on('zoom', onMove); map.on('resize', onMove); }
    setMounted(true);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (map) { map.off('move', onMove); map.off('zoom', onMove); map.off('resize', onMove); }
    };
  }, [school?.id]);

  // Esc to close
  useEffect(()=>{
    if (!school) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [school, onClose]);

  if (!school || !anchor || !detail) return null;

  const zd = ZONES[school.zone];

  // ----- Mobile: render as bottom sheet instead of anchored popup -----
  if (isMobile) {
    const trendPctM = Math.round(((detail.trend[5]-detail.trend[0])/detail.trend[0])*100);
    return (
      <>
        <div onClick={onClose} style={{
          position:'absolute', inset:0, zIndex: 600,
          background:'rgba(0,0,0,0.38)',
          opacity: mounted ? 1 : 0,
          transition:'opacity 200ms ease',
        }}/>
        <div style={{
          position:'absolute', left: 0, right: 0, bottom: 0, zIndex: 700,
          background:'#FFFFFF',
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
          boxShadow:'0 -10px 32px rgba(0,0,0,0.22)',
          transform: mounted ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 320ms cubic-bezier(0.2, 1, 0.3, 1)',
          maxHeight: '82%', display:'flex', flexDirection:'column', overflow:'hidden',
        }}>
          {/* drag handle */}
          <div onClick={onClose} style={{padding:'8px 0 2px', display:'flex', justifyContent:'center', cursor:'pointer', flexShrink:0}}>
            <div style={{width:40, height:4, borderRadius:2, background:'var(--line-2)'}}/>
          </div>
          {/* Colored header band */}
          <div style={{
            background: zd.color, color: zd.ink,
            padding: '12px 16px 14px', position:'relative', flexShrink: 0,
          }}>
            <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:9.5, letterSpacing:'0.14em', opacity:0.75, textTransform:'uppercase'}}>
              {zd.name} · est. {detail.established}
            </div>
            <div style={{fontSize: 20, fontWeight: 800, letterSpacing:'-0.02em', marginTop:2, lineHeight:1.15, paddingRight: 36}}>
              {school.name}
            </div>
            <div style={{display:'flex', gap:6, marginTop: 6, flexWrap:'wrap'}}>
              <span style={{background:'rgba(0,0,0,0.12)', padding:'2px 8px', borderRadius:999, fontSize:10.5, fontWeight:700, letterSpacing:'0.04em', fontFamily:'JetBrains Mono, monospace', whiteSpace:'nowrap'}}>{school.type}</span>
              <span style={{background:'rgba(0,0,0,0.12)', padding:'2px 8px', borderRadius:999, fontSize:10.5, fontWeight:700, letterSpacing:'0.04em', fontFamily:'JetBrains Mono, monospace', whiteSpace:'nowrap'}}>{detail.classes} klasser</span>
            </div>
            <button onClick={onClose} style={{
              position:'absolute', top:12, right:12,
              width:32, height:32, borderRadius:999,
              background:'rgba(0,0,0,0.12)', border:0, color:'inherit',
              cursor:'pointer', fontSize:20, fontWeight:700, lineHeight:1,
            }}>×</button>
          </div>
          {/* Scrollable body */}
          <div style={{flex:1, minHeight:0, overflowY:'auto', padding:'14px 16px 20px', display:'flex', flexDirection:'column', gap: 12}}>
            <div>
              <div style={panelStyles.kicker}>Elever</div>
              <div style={{display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap'}}>
                <div style={{fontSize: 36, fontWeight:800, lineHeight:1, letterSpacing:'-0.03em', color:'var(--ink)', fontVariantNumeric:'tabular-nums'}}>
                  {school.students}
                </div>
                <div style={{fontSize:12, fontWeight:700, color: trendPctM>=0?'#0E7C86':'#B54B3C', whiteSpace:'nowrap'}}>
                  {trendPctM>=0?'▲':'▼'} {Math.abs(trendPctM)}% sedan 20/21
                </div>
              </div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap: 12, padding:'10px 12px', background:'#FBF9F3', borderRadius:8, border:'1px solid var(--line)'}}>
              <MiniDonut segs={[
                {value: detail.grades.fk3, color: zd.color},
                {value: detail.grades.y46, color: '#364A5A'},
                {value: detail.grades.y79, color: '#F4BFAE'},
              ]}/>
              <div style={{flex:1}}>
                <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:9.5, letterSpacing:'0.1em', color:'var(--mute)', textTransform:'uppercase', marginBottom:4}}>Årskursfördelning</div>
                <div style={{fontSize:12, display:'flex', flexDirection:'column', gap:3, color:'var(--slate)'}}>
                  <div style={{display:'flex', alignItems:'center', gap:6}}><span style={{width:8,height:8,borderRadius:2,background:zd.color}}/><span style={{flex:1}}>F–3</span><span style={{fontVariantNumeric:'tabular-nums', fontWeight:600}}>{detail.grades.fk3}%</span></div>
                  <div style={{display:'flex', alignItems:'center', gap:6}}><span style={{width:8,height:8,borderRadius:2,background:'#364A5A'}}/><span style={{flex:1}}>4–6</span><span style={{fontVariantNumeric:'tabular-nums', fontWeight:600}}>{detail.grades.y46}%</span></div>
                  <div style={{display:'flex', alignItems:'center', gap:6}}><span style={{width:8,height:8,borderRadius:2,background:'#F4BFAE'}}/><span style={{flex:1}}>7–9</span><span style={{fontVariantNumeric:'tabular-nums', fontWeight:600}}>{detail.grades.y79}%</span></div>
                </div>
              </div>
            </div>
            <MobileKPIs detail={detail}/>
            <button onClick={onClose} style={{
              marginTop: 6, padding:'12px 16px', border:0, borderRadius: 8,
              background:'var(--ink)', color:'#FBF9F3', fontSize: 14, fontWeight:700,
              fontFamily:'inherit', cursor:'pointer', letterSpacing:'-0.01em',
            }}>Stäng</button>
          </div>
        </div>
      </>
    );
  }

  // Responsive: clamp to container so card always fits
  const CARD_W = Math.min(340, Math.max(280, anchor.containerW - 32));
  const CARD_H = Math.min(560, Math.max(380, anchor.containerH - 24));
  const tailGap = anchor.containerW < 520 ? 18 : 70;

  // Decide which side of the anchor to place the card
  const margin = 12;
  const placeRight = anchor.x + CARD_W + margin + tailGap < anchor.containerW;
  const placeLeft  = anchor.x - CARD_W - tailGap > margin;
  let left, top, tailSide;
  if (placeRight)     { left = anchor.x + tailGap; tailSide = 'left'; }
  else if (placeLeft) { left = anchor.x - CARD_W - tailGap; tailSide = 'right'; }
  else {
    // Center horizontally if neither side fits (very narrow container)
    left = Math.max(margin, Math.min(anchor.containerW - CARD_W - margin, anchor.x - CARD_W/2));
    tailSide = anchor.x < anchor.containerW/2 ? 'left' : 'right';
  }
  // Clamp horizontally within container
  left = Math.max(margin, Math.min(anchor.containerW - CARD_W - margin, left));
  top = Math.max(12, Math.min(anchor.containerH - CARD_H - 12, anchor.y - 60));

  const tailY = anchor.y - top; // tail y-offset inside card
  const trendPct = Math.round(((detail.trend[5]-detail.trend[0])/detail.trend[0])*100);

  return (
    <>
      {/* Backdrop that catches clicks but NOT over the map's interactive surface —
          we use a transparent overlay aligned with the map container so outside-clicks close */}
      <div
        onClick={onClose}
        style={{
          position:'absolute', inset: 0, zIndex: 400,
          background:'rgba(0,0,0,0)',
          pointerEvents:'auto',
        }}/>

      {/* Pointer tail — SVG line from anchor to card */}
      <svg style={{
        position:'absolute', left:0, top:0,
        width: anchor.containerW, height: anchor.containerH,
        pointerEvents:'none', zIndex: 450,
      }}>
        <defs>
          <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity="0.18"/>
          </filter>
        </defs>
        {/* Connecting line */}
        <line x1={anchor.x} y1={anchor.y}
              x2={tailSide==='left' ? left : left+CARD_W}
              y2={top + tailY}
              stroke={zd.color} strokeWidth="2.5" strokeDasharray="5 4"
              opacity={mounted ? 0.85 : 0}
              style={{transition:'opacity 300ms 120ms ease'}}/>
        {/* Anchor marker halo */}
        <circle cx={anchor.x} cy={anchor.y} r="14"
                fill="none" stroke={zd.color} strokeWidth="2" opacity={mounted?0.5:0}
                style={{transition:'opacity 300ms ease'}}/>
      </svg>

      {/* The card itself */}
      <div
        onClick={(e)=>e.stopPropagation()}
        style={{
          position:'absolute', left, top,
          width: CARD_W, height: CARD_H,
          zIndex: 500,
          background:'#FFFFFF',
          border:'1px solid var(--line)',
          borderRadius: 12,
          boxShadow: '0 20px 48px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.06)',
          overflow:'hidden',
          display:'flex', flexDirection:'column',
          transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.6) translateY(10px)',
          transformOrigin: `${tailSide==='left' ? 0 : CARD_W}px ${tailY}px`,
          opacity: mounted ? 1 : 0,
          transition: 'transform 360ms cubic-bezier(0.34, 1.4, 0.54, 1), opacity 240ms ease',
        }}>

        {/* Colored header band */}
        <div style={{
          background: zd.color, color: zd.ink,
          padding: '14px 16px 12px',
          position:'relative',
        }}>
          <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:9.5, letterSpacing:'0.14em', opacity:0.75, textTransform:'uppercase'}}>
            {zd.name} · est. {detail.established}
          </div>
          <div style={{fontSize: 20, fontWeight: 800, letterSpacing:'-0.02em', marginTop:2, lineHeight:1.15, paddingRight: 28}}>
            {school.name}
          </div>
          <div style={{display:'flex', gap:6, marginTop: 6, flexWrap:'wrap'}}>
            <span style={{
              background:'rgba(0,0,0,0.12)', padding:'2px 8px', borderRadius:999,
              fontSize:10.5, fontWeight:700, letterSpacing:'0.04em',
              fontFamily:'JetBrains Mono, monospace', whiteSpace:'nowrap',
            }}>{school.type}</span>
            <span style={{
              background:'rgba(0,0,0,0.12)', padding:'2px 8px', borderRadius:999,
              fontSize:10.5, fontWeight:700, letterSpacing:'0.04em',
              fontFamily:'JetBrains Mono, monospace', whiteSpace:'nowrap',
            }}>{detail.classes} klasser</span>
          </div>
          <button onClick={onClose} style={{
            position:'absolute', top:12, right:12,
            width:24, height:24, borderRadius:999,
            background:'rgba(0,0,0,0.12)', border:0, color:'inherit',
            cursor:'pointer', fontSize:16, fontWeight:700, lineHeight:1,
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{flex:1, padding:'14px 16px 16px', display:'flex', flexDirection:'column', gap: 12, overflowY:'auto'}}>

          {/* Hero stat */}
          <div>
            <div style={panelStyles.kicker}>Elever</div>
            <div style={{display:'flex', alignItems:'baseline', gap:8}}>
              <div style={{fontSize: 36, fontWeight:800, lineHeight:1, letterSpacing:'-0.03em', color:'var(--ink)', fontVariantNumeric:'tabular-nums'}}>
                {school.students}
              </div>
              <div style={{fontSize:11, fontWeight:700, color: trendPct>=0?'#0E7C86':'#B54B3C', whiteSpace:'nowrap'}}>
                {trendPct>=0?'▲':'▼'} {Math.abs(trendPct)}% sedan 20/21
              </div>
            </div>
          </div>

          {/* Grade donut + legend (own row so they don't collide with hero) */}
          <div style={{display:'flex', alignItems:'center', gap: 12, padding:'10px 12px', background:'#FBF9F3', borderRadius:8, border:'1px solid var(--line)'}}>
            <MiniDonut segs={[
              {value: detail.grades.fk3, color: zd.color},
              {value: detail.grades.y46, color: '#364A5A'},
              {value: detail.grades.y79, color: '#F4BFAE'},
            ]}/>
            <div style={{flex:1}}>
              <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:9.5, letterSpacing:'0.1em', color:'var(--mute)', textTransform:'uppercase', marginBottom:4}}>Årskursfrödelning</div>
              <div style={{fontSize:11, display:'flex', flexDirection:'column', gap:3, color:'var(--slate)'}}>
                <div style={{display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap'}}><span style={{display:'inline-block',width:8,height:8,borderRadius:2,background:zd.color,flexShrink:0}}/><span style={{flex:1}}>F–3</span><span style={{fontVariantNumeric:'tabular-nums', fontWeight:600}}>{detail.grades.fk3}%</span></div>
                <div style={{display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap'}}><span style={{display:'inline-block',width:8,height:8,borderRadius:2,background:'#364A5A',flexShrink:0}}/><span style={{flex:1}}>4–6</span><span style={{fontVariantNumeric:'tabular-nums', fontWeight:600}}>{detail.grades.y46}%</span></div>
                <div style={{display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap'}}><span style={{display:'inline-block',width:8,height:8,borderRadius:2,background:'#F4BFAE',flexShrink:0}}/><span style={{flex:1}}>7–9</span><span style={{fontVariantNumeric:'tabular-nums', fontWeight:600}}>{detail.grades.y79}%</span></div>
              </div>
            </div>
          </div>

          {/* Sparkline */}
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
              <div style={panelStyles.kicker}>Elevutveckling · 6 år</div>
              <div style={{fontSize:10, color:'var(--mute)', fontFamily:'JetBrains Mono, monospace'}}>
                {detail.trend[0]} → {detail.trend[5]}
              </div>
            </div>
            <SparkLine values={detail.trend} color={zd.color}/>
          </div>

          {/* 2x2 KPIs */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <KPI label="Klasstorlek" value={detail.classSize} unit="el/kl" hint={`Snitt ${zd.avgClass.toFixed(1)}`}/>
            <KPI label="Lärartäthet" value={detail.ratio} unit="el/lär" hint={`Snitt ${zd.teacherRatio.toFixed(1)}`}/>
            <KPI label="Nyanlända" value={detail.newcomers} unit="%" hint={`Område ${zd.newcomers}%`}/>
            <KPI label="Nöjdhet" value={detail.satisfaction} unit="%" hint={`Staden 73%`}/>
          </div>

          {/* Quick actions */}
          <div style={{display:'flex', gap:8, marginTop: 'auto', paddingTop: 6, borderTop:'1px solid var(--line)'}}>
            <button style={cardBtnPrimary(zd.color, zd.ink)}>
              Öppna skolprofil →
            </button>
            <button style={cardBtnGhost} onClick={onClose} title="Esc">
              Stäng
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function KPI({ label, value, unit, hint }) {
  return (
    <div style={{
      background:'#FBF9F3', border:'1px solid var(--line)', borderRadius:6,
      padding:'8px 10px',
    }}>
      <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:9.5, letterSpacing:'0.1em', color:'var(--mute)', textTransform:'uppercase'}}>{label}</div>
      <div style={{display:'flex', alignItems:'baseline', gap:3, marginTop:1}}>
        <div style={{fontSize: 18, fontWeight:800, color:'var(--ink)', letterSpacing:'-0.02em', fontVariantNumeric:'tabular-nums'}}>{value}</div>
        <div style={{fontSize: 10, fontWeight:600, color:'var(--slate-2)'}}>{unit}</div>
      </div>
      <div style={{fontSize:9.5, color:'var(--mute)', marginTop:1, fontFamily:'JetBrains Mono, monospace'}}>{hint}</div>
    </div>
  );
}

const cardBtnPrimary = (bg, ink) => ({
  flex:1, padding:'9px 12px', borderRadius: 8,
  background: bg, color: ink, fontWeight: 700, fontSize: 12,
  border: 0, cursor:'pointer', letterSpacing:'-0.01em',
});
const cardBtnGhost = {
  padding:'9px 14px', borderRadius: 8,
  background:'#FFFFFF', color:'var(--slate)', fontWeight:600, fontSize: 12,
  border:'1px solid var(--line)', cursor:'pointer',
};

window.SchoolCard = SchoolCard;
