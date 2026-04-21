// Right-side analytics panels — refined layout

const panelStyles = {
  wrap: {
    display:'flex', flexDirection:'column', gap: 10,
    height:'100%', minHeight: 0,
    background:'var(--paper)', border:'1px solid var(--line)', borderRadius: 8,
    overflow:'hidden',
  },

  // Header band — zone identity always visible
  header: (zd) => ({
    background: zd ? zd.color : 'var(--ink)',
    color: zd ? zd.ink : '#FBF9F3',
    padding: '14px 18px 12px',
    position:'relative',
  }),
  headerKicker: { fontFamily:'JetBrains Mono, monospace', fontSize:9.5, letterSpacing:'0.14em', opacity:0.75, textTransform:'uppercase' },
  headerName: { fontSize: 22, fontWeight: 800, letterSpacing:'-0.02em', marginTop:2, lineHeight:1.1 },
  headerSub: { fontSize: 12, marginTop: 4, opacity: 0.85 },
  closeBtn: {
    position:'absolute', top:12, right:12,
    width:24, height:24, borderRadius:999,
    background:'rgba(0,0,0,0.08)', border:0,
    cursor:'pointer', color:'inherit',
    fontSize: 16, lineHeight:1, fontWeight: 700,
  },

  scroll: {
    flex:1, minHeight:0, overflowY:'auto',
    padding: '14px 16px 18px',
    display:'flex', flexDirection:'column', gap: 12,
  },

  kicker: { fontFamily:'JetBrains Mono, monospace', fontSize:9.5, letterSpacing:'0.14em', color:'var(--mute)', textTransform:'uppercase', marginBottom:6, whiteSpace:'nowrap' },

  // Hero stat
  heroBlock: { display:'flex', alignItems:'baseline', gap:8 },
  heroNum: { fontSize: 44, fontWeight:800, lineHeight:1, letterSpacing:'-0.03em', color:'var(--ink)', fontVariantNumeric:'tabular-nums' },
  heroUnit: { fontSize: 14, fontWeight:600, color:'var(--slate-2)' },
  heroSub: { fontSize: 12, color:'var(--mute)', marginTop: 4 },

  // KPI grid 2x2
  kpiGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 },
  kpi: {
    background:'#FBF9F3', border:'1px solid var(--line)', borderRadius: 6,
    padding:'10px 12px',
  },
  kpiLabel: { fontSize: 10.5, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.1em', color:'var(--mute)', textTransform:'uppercase' },
  kpiVal: { display:'flex', alignItems:'baseline', gap:4, marginTop:2 },
  kpiNum: { fontSize: 22, fontWeight:800, color:'var(--ink)', letterSpacing:'-0.02em', fontVariantNumeric:'tabular-nums' },
  kpiUnit: { fontSize: 11, fontWeight:600, color:'var(--slate-2)' },
  kpiCmp: { fontSize: 10, color:'var(--mute)', marginTop: 2 },

  divider: { height: 1, background:'var(--line)', margin: '2px 0' },

  // Schools list
  schoolHead: { display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 4 },
  schoolRow: { display:'grid', gridTemplateColumns:'8px 1fr auto auto', gap: 10, alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--line)', fontSize: 12.5 },
  schoolDot: (c) => ({ width:8, height:8, borderRadius:2, background:c }),
  schoolType: { fontFamily:'JetBrains Mono, monospace', fontSize: 9.5, letterSpacing:'0.06em', color:'var(--mute)', padding:'2px 6px', border:'1px solid var(--line-2)', borderRadius:3, whiteSpace:'nowrap' },
  schoolStudents: { fontVariantNumeric:'tabular-nums', fontWeight:700, color:'var(--ink)', fontSize: 12 },
};

// ----- Donut -----
function Donut({ segments, size=88, thickness=14 }) {
  const R = size/2, r = R - thickness/2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((a,s)=>a+s.value,0);
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={R} cy={R} r={r} fill="none" stroke="#EFEBDE" strokeWidth={thickness}/>
      {segments.map((s,i)=>{
        const dash = (s.value/total) * C;
        const c = <circle key={i} cx={R} cy={R} r={r} fill="none" stroke={s.color} strokeWidth={thickness} strokeDasharray={`${dash} ${C-dash}`} strokeDashoffset={-offset} transform={`rotate(-90 ${R} ${R})`}/>;
        offset += dash; return c;
      })}
    </svg>
  );
}

// ----- Trend sparkline -----
function Trend({ values, color }) {
  const W = 260, H = 60, P = 6;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v,i)=>[P + (i/(values.length-1))*(W-2*P), P + (1-(v-min)/span)*(H-2*P)]);
  const path = pts.map((p,i)=>`${i?'L':'M'} ${p[0]} ${p[1]}`).join(' ');
  const fillPath = path + ` L ${W-P} ${H-P} L ${P} ${H-P} Z`;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <path d={fillPath} fill={color} opacity="0.18"/>
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=>(
        <circle key={i} cx={p[0]} cy={p[1]} r={i===pts.length-1?4:2.2}
                fill={i===pts.length-1?color:'#FFF'} stroke={color} strokeWidth={i===pts.length-1?0:1.5}/>
      ))}
    </svg>
  );
}

function SidePanel({ zone, typeFilter, onClear }) {
  const zd = zone ? ZONES[zone] : null;
  if (!zd) return <CityOverview typeFilter={typeFilter}/>;
  const schools = SCHOOLS.filter(s => s.zone===zone).filter(s => typeFilter==='all' || s.type===typeFilter);
  const gradeColors = [zd.color, '#364A5A', '#F4BFAE'];
  const gradeSegs = [
    { value: zd.grades.fk3, color: gradeColors[0], label: 'F–3' },
    { value: zd.grades.y46, color: gradeColors[1], label: '4–6' },
    { value: zd.grades.y79, color: gradeColors[2], label: '7–9' },
  ];
  const trendPct = Math.round(((zd.trend[5]-zd.trend[0])/zd.trend[0])*100);

  return (
    <div style={panelStyles.wrap}>
      {/* Sticky zone header band */}
      <div style={panelStyles.header(zd)}>
        <div style={panelStyles.headerKicker}>Stadsområde</div>
        <div style={panelStyles.headerName}>{zd.name}</div>
        <div style={panelStyles.headerSub}>{zd.tagline}</div>
        <button style={panelStyles.closeBtn} onClick={onClear} title="Stäng">×</button>
      </div>

      <div style={panelStyles.scroll}>
        {/* Hero stat */}
        <div>
          <div style={panelStyles.kicker}>Elever totalt</div>
          <div style={panelStyles.heroBlock}>
            <div style={panelStyles.heroNum}>{zd.students.toLocaleString('sv-SE')}</div>
            <div style={panelStyles.heroUnit}>elever</div>
          </div>
          <div style={panelStyles.heroSub}>
            i <b>{zd.schools}</b> skolor · snitt <b>{Math.round(zd.students/zd.schools)}</b>/skola
          </div>
        </div>

        {/* KPI grid */}
        <div style={panelStyles.kpiGrid}>
          <div style={panelStyles.kpi}>
            <div style={panelStyles.kpiLabel}>Klasstorlek</div>
            <div style={panelStyles.kpiVal}>
              <span style={panelStyles.kpiNum}>{zd.avgClass.toFixed(1)}</span>
              <span style={panelStyles.kpiUnit}>el/klass</span>
            </div>
            <div style={panelStyles.kpiCmp}>Staden 22.2 · Riket 21.8</div>
          </div>
          <div style={panelStyles.kpi}>
            <div style={panelStyles.kpiLabel}>Lärartäthet</div>
            <div style={panelStyles.kpiVal}>
              <span style={panelStyles.kpiNum}>{zd.teacherRatio.toFixed(1)}</span>
              <span style={panelStyles.kpiUnit}>el/lärare</span>
            </div>
            <div style={panelStyles.kpiCmp}>Staden 11.5</div>
          </div>
          <div style={panelStyles.kpi}>
            <div style={panelStyles.kpiLabel}>Nyanlända</div>
            <div style={panelStyles.kpiVal}>
              <span style={panelStyles.kpiNum}>{zd.newcomers}</span>
              <span style={panelStyles.kpiUnit}>%</span>
            </div>
            <div style={panelStyles.kpiCmp}>Staden 16%</div>
          </div>
          <div style={panelStyles.kpi}>
            <div style={panelStyles.kpiLabel}>Nöjdhet</div>
            <div style={panelStyles.kpiVal}>
              <span style={panelStyles.kpiNum}>{zd.satisfaction}</span>
              <span style={panelStyles.kpiUnit}>%</span>
            </div>
            <div style={panelStyles.kpiCmp}>Staden 73%</div>
          </div>
        </div>

        {/* Donut + grades + trend combined */}
        <div style={{display:'grid', gridTemplateColumns:'auto 1fr', gap: 14, alignItems:'center'}}>
          <Donut segments={gradeSegs}/>
          <div>
            <div style={panelStyles.kicker}>Årskursfördelning</div>
            <div style={{display:'flex', flexDirection:'column', gap: 4, fontSize: 12}}>
              {gradeSegs.map((s,i)=>(
                <div key={i} style={{display:'flex', alignItems:'center', gap:8}}>
                  <div style={{width:10, height:10, borderRadius:2, background: gradeColors[i]}}/>
                  <span style={{fontWeight:700, width: 38}}>{s.label}</span>
                  <span style={{flex:1, height:6, background:'#F0EBDD', borderRadius:3, overflow:'hidden'}}>
                    <span style={{display:'block', width:`${s.value}%`, height:'100%', background:gradeColors[i]}}/>
                  </span>
                  <span style={{fontVariantNumeric:'tabular-nums', color:'var(--slate-2)', width:30, textAlign:'right'}}>{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={panelStyles.divider}/>

        {/* Trend */}
        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
            <div style={panelStyles.kicker}>Elevutveckling 6 år</div>
            <div style={{fontSize:11, color:'var(--slate)'}}>
              <b style={{color:zd.color, fontSize:13}}>+{trendPct}%</b> sedan 20/21
            </div>
          </div>
          <Trend values={zd.trend} color={zd.color}/>
        </div>

        <div style={panelStyles.divider}/>

        {/* Schools list */}
        <div>
          <div style={panelStyles.schoolHead}>
            <div style={panelStyles.kicker}>Skolor ({schools.length})</div>
            <div style={{fontSize:9.5, color:'var(--mute)', fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.1em'}}>TYP · ELEVER</div>
          </div>
          <div>
            {schools.sort((a,b)=>b.students-a.students).map(s=>(
              <div key={s.id} style={panelStyles.schoolRow}>
                <div style={panelStyles.schoolDot(zd.color)}/>
                <div style={{fontWeight:600, color:'var(--ink)'}}>{s.name}</div>
                <div style={panelStyles.schoolType}>{s.type}</div>
                <div style={panelStyles.schoolStudents}>{s.students}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- Empty state -----
function CityOverview({ typeFilter }) {
  const totalStudents = Object.values(ZONES).reduce((a,z)=>a+z.students,0);
  const totalSchools = Object.values(ZONES).reduce((a,z)=>a+z.schools,0);
  const zones = Object.values(ZONES);

  return (
    <div style={panelStyles.wrap}>
      <div style={panelStyles.header(null)}>
        <div style={panelStyles.headerKicker}>Hela staden</div>
        <div style={panelStyles.headerName}>Göteborg — Översikt</div>
        <div style={panelStyles.headerSub}>Klicka ett område på kartan för full profil</div>
      </div>

      <div style={panelStyles.scroll}>
        <div>
          <div style={panelStyles.kicker}>Elever i grundskola</div>
          <div style={panelStyles.heroBlock}>
            <div style={panelStyles.heroNum}>{totalStudents.toLocaleString('sv-SE')}</div>
            <div style={panelStyles.heroUnit}>elever</div>
          </div>
          <div style={panelStyles.heroSub}>
            över <b>{totalSchools}</b> skolor i <b>4</b> stadsområden
          </div>
        </div>

        <div style={panelStyles.divider}/>

        {/* Zones ranked */}
        <div>
          <div style={panelStyles.kicker}>Områden — elever & skolor</div>
          <div style={{display:'flex', flexDirection:'column', gap: 8}}>
            {zones.sort((a,b)=>b.students-a.students).map(z => {
              const max = Math.max(...zones.map(x=>x.students));
              const pct = (z.students/max)*100;
              return (
                <div key={z.id} style={{display:'grid', gridTemplateColumns:'90px 1fr auto', gap:10, alignItems:'center'}}>
                  <div style={{display:'flex', alignItems:'center', gap:6}}>
                    <div style={{width:10, height:10, borderRadius:3, background:z.color}}/>
                    <span style={{fontSize:12, fontWeight:700}}>{z.name}</span>
                  </div>
                  <div style={{height:14, background:'#F0EBDD', borderRadius:3, overflow:'hidden', position:'relative'}}>
                    <div style={{width:`${pct}%`, height:'100%', background:z.color}}/>
                  </div>
                  <div style={{fontSize:11, color:'var(--slate)', fontVariantNumeric:'tabular-nums', textAlign:'right'}}>
                    <b style={{color:'var(--ink)'}}>{(z.students/1000).toFixed(1)}k</b> · {z.schools} skolor
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={panelStyles.divider}/>

        {/* Help / keyboard */}
        <div>
          <div style={panelStyles.kicker}>Att göra</div>
          <ul style={{margin:0, paddingLeft: 16, fontSize: 12.5, lineHeight: 1.7, color:'var(--slate)'}}>
            <li>Klicka ett område — fliken eller polygonen</li>
            <li>Toggla synlighet med ●/○ i flikarna</li>
            <li>Filtrera skoltyp uppe i kartans hörn</li>
            <li>Cirklarnas storlek = elevantal per skola</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

window.SidePanel = SidePanel;
