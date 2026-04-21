// Main app — improved layout

const { useState, useEffect } = React;

const TWEAKS = /*EDITMODE-BEGIN*/{
  "showMiniMap": true,
  "showTagline": true,
  "schoolMarkerStyle": "ring",
  "mapBg": "paper"
}/*EDITMODE-END*/;

const appStyles = {
  shell: {
    height:'100vh',
    padding: 'clamp(10px, 1.6vw, 20px) clamp(12px, 2vw, 24px)',
    display:'flex', flexDirection:'column', gap: 'clamp(8px, 1vw, 14px)',
    overflow:'hidden',
  },

  // ---------- Top bar ----------
  topBar: {
    display:'flex',
    flexWrap:'wrap',
    alignItems:'center',
    justifyContent:'space-between',
    rowGap: 8, columnGap: 20,
    paddingBottom: 10,
    borderBottom:'1px solid var(--line)',
    flexShrink: 0,
  },
  brand: {
    display:'flex', alignItems:'center', gap: 12,
  },
  brandMark: {
    width:36, height:36, borderRadius: 8,
    background:'var(--ink)', color:'#FBF9F3',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontWeight:800, fontSize:18, letterSpacing:'-0.04em',
  },
  brandText: { display:'flex', flexDirection:'column' },
  kicker: {
    fontFamily:'JetBrains Mono, monospace', fontSize: 10, letterSpacing:'0.14em',
    color:'var(--mute)', textTransform:'uppercase',
  },
  h1: {
    fontSize: 'clamp(15px, 1.4vw, 20px)', fontWeight: 800, letterSpacing:'-0.02em',
    color:'var(--ink)', margin:0, lineHeight: 1.15,
  },

  // ---------- Quick stats strip ----------
  statStrip: {
    display:'flex', alignItems:'center', gap: 4,
    background:'var(--paper)', border:'1px solid var(--line)',
    borderRadius: 999, padding: '6px 8px',
  },
  statChip: {
    display:'flex', alignItems:'baseline', gap: 6,
    padding:'4px 12px',
    borderRight:'1px solid var(--line)',
  },
  statChipLast: {
    display:'flex', alignItems:'baseline', gap: 6,
    padding:'4px 12px',
  },
  statLabel: {
    fontFamily:'JetBrains Mono, monospace', fontSize: 9.5, letterSpacing:'0.12em',
    color:'var(--mute)', textTransform:'uppercase',
  },
  statValue: {
    fontSize: 15, fontWeight: 800, letterSpacing:'-0.02em', color:'var(--ink)',
    fontVariantNumeric:'tabular-nums',
  },
  yearChip: {
    background:'var(--ink)', color:'#FBF9F3',
    borderRadius: 999, padding:'6px 14px',
    fontSize: 11, fontWeight: 700, letterSpacing:'0.04em',
    fontFamily:'JetBrains Mono, monospace',
    whiteSpace:'nowrap', lineHeight: 1.2,
    display:'inline-flex', alignItems:'center',
  },

  // ---------- Main grid ----------
  main: {
    display:'grid',
    gridTemplateColumns:'minmax(0, 1fr) clamp(320px, 28vw, 400px)',
    gap: 'clamp(8px, 1vw, 14px)',
    flex: 1,
    minHeight: 0,
  },
  mainStacked: {
    display:'grid',
    gridTemplateRows:'minmax(0, 1fr) minmax(260px, 45vh)',
    gridTemplateColumns:'1fr',
    gap: 8,
    flex: 1,
    minHeight: 0,
  },
  mapSlot: {
    position:'relative', display:'flex', minHeight:0, flex: 1,
  },

  // ---------- Footer ----------
  footer: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    flexWrap:'wrap', rowGap: 6, columnGap: 12,
    fontSize: 10.5, color:'var(--mute)', fontFamily:'JetBrains Mono, monospace',
    letterSpacing:'0.08em', textTransform:'uppercase',
    paddingTop: 4,
    flexShrink: 0,
  },
  hintPill: {
    display:'inline-flex', alignItems:'center', gap: 8,
    padding:'5px 12px', borderRadius: 999,
    background:'var(--paper)', border:'1px solid var(--line)',
  },

  // ---------- Tweaks ----------
  tweakPanel: {
    position:'fixed', right: 20, bottom: 20, zIndex: 1000,
    width: 280,
    background:'#FFFFFF', border:'1px solid var(--line)', borderRadius: 8,
    padding: 14, boxShadow:'0 12px 32px rgba(0,0,0,0.14)',
  },
};

function App() {
  const [selected, setSelected] = useState(() => localStorage.getItem('selectedZone') || null);
  const [hovered, setHovered] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [visibleZones, setVisibleZones] = useState(['hisingen','nordost','centrum','sydvast']);
  const [activeSchool, setActiveSchool] = useState(null);
  const [tweaks, setTweaks] = useState(TWEAKS);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  // ----- Viewport tracking for responsive layout -----
  const [vp, setVp] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1440,
    h: typeof window !== 'undefined' ? window.innerHeight : 900,
  }));
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isNarrow   = vp.w < 960;   // stack main area
  const isCompact  = vp.w < 1200;  // hide non-essential chrome
  const isVeryNarrow = vp.w < 640;

  useEffect(() => {
    if (selected) localStorage.setItem('selectedZone', selected);
    else localStorage.removeItem('selectedZone');
  }, [selected]);

  useEffect(() => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setTweaksOpen(true);
      if (d.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({type:'__edit_mode_available'}, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const setTweak = (k, v) => {
    setTweaks(t => ({...t, [k]: v}));
    window.parent.postMessage({type:'__edit_mode_set_keys', edits:{[k]: v}}, '*');
  };

  const toggleZone = (z) => setVisibleZones(vz => vz.includes(z) ? vz.filter(x=>x!==z) : [...vz, z]);
  const handleSelect = (z) => setSelected(prev => prev === z ? null : z);

  const totalStudents = Object.values(ZONES).reduce((a,z)=>a+z.students,0);
  const totalSchools = Object.values(ZONES).reduce((a,z)=>a+z.schools,0);
  const visibleSchools = SCHOOLS
    .filter(s => visibleZones.includes(s.zone))
    .filter(s => typeFilter === 'all' || s.type === typeFilter).length;

  return (
    <div style={appStyles.shell}>

      {/* ---------- Top bar (compact) ---------- */}
      <div style={appStyles.topBar}>
        <div style={appStyles.brand}>
          <div style={appStyles.brandMark}>G</div>
          <div style={appStyles.brandText}>
            {!isVeryNarrow && <div style={appStyles.kicker}>Grundskoleförvaltningen</div>}
            <h1 style={appStyles.h1}>
              {isVeryNarrow ? 'Skolor i Göteborg' : 'Grundskolor i Göteborg — Områdesanalys'}
            </h1>
          </div>
        </div>

        <div style={{display:'flex', alignItems:'center', gap: 10, flexWrap:'wrap', rowGap: 6}}>
          {!isCompact && (
            <div style={appStyles.statStrip}>
              <div style={appStyles.statChip}>
                <span style={appStyles.statValue}>4</span>
                <span style={appStyles.statLabel}>områden</span>
              </div>
              <div style={appStyles.statChip}>
                <span style={appStyles.statValue}>{totalSchools}</span>
                <span style={appStyles.statLabel}>skolor</span>
              </div>
              <div style={appStyles.statChipLast}>
                <span style={appStyles.statValue}>{totalStudents.toLocaleString('sv-SE')}</span>
                <span style={appStyles.statLabel}>elever</span>
              </div>
            </div>
          )}
          {isCompact && !isVeryNarrow && (
            <div style={{...appStyles.statStrip, padding:'4px 10px'}}>
              <span style={appStyles.statValue}>{totalSchools}</span>
              <span style={{...appStyles.statLabel, marginLeft:4}}>skolor</span>
              <span style={{width:1, height:12, background:'var(--line)', margin:'0 8px'}}/>
              <span style={appStyles.statValue}>{totalStudents.toLocaleString('sv-SE')}</span>
              <span style={{...appStyles.statLabel, marginLeft:4}}>elever</span>
            </div>
          )}
          <div style={appStyles.yearChip}>LÄSÅR 25/26</div>
        </div>
      </div>

      {/* ---------- Main: map + side panel ---------- */}
      <div style={isNarrow ? appStyles.mainStacked : appStyles.main}>
        <div style={appStyles.mapSlot}>
          <ZoneMap
            selected={selected}
            onSelect={handleSelect}
            hovered={hovered}
            onHover={setHovered}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            visibleZones={visibleZones}
            toggleZone={toggleZone}
            activeSchool={activeSchool}
            onSchoolClick={setActiveSchool}
          />
          <SchoolCard school={activeSchool} onClose={()=>setActiveSchool(null)}/>
        </div>
        <SidePanel
          zone={selected}
          typeFilter={typeFilter}
          onClear={()=>setSelected(null)}
        />
      </div>

      {/* ---------- Footer ---------- */}
      <div style={appStyles.footer}>
        <div style={appStyles.hintPill}>
          <span style={{width:6, height:6, borderRadius:999, background:'var(--teal)'}}/>
          {selected
            ? <span>Valt: <b style={{color:'var(--ink)'}}>{ZONES[selected].name}</b> · klicka kartan för att avmarkera</span>
            : <span>Klicka ett område på kartan för att se detaljer</span>}
        </div>
        <div>{visibleSchools} skolor synliga · källa: Grundskoleförvaltningen · illustrativ data</div>
      </div>

      {/* ---------- Tweaks ---------- */}
      {tweaksOpen && (
        <div style={appStyles.tweakPanel}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10}}>
            <div style={{fontWeight:800, fontSize:14}}>Tweaks</div>
            <div onClick={()=>setTweaksOpen(false)} style={{cursor:'pointer', color:'var(--mute)', fontSize:18, lineHeight:1}}>×</div>
          </div>
          <TweakRow label="Tema">
            <select value={tweaks.mapBg} onChange={e=>setTweak('mapBg', e.target.value)} style={tweakSelect}>
              <option value="paper">Ljust</option>
              <option value="cool">Sval grå</option>
              <option value="dark">Mörkt</option>
            </select>
          </TweakRow>
          <TweakRow label="Visa citat">
            <input type="checkbox" checked={tweaks.showTagline}
                   onChange={e=>setTweak('showTagline', e.target.checked)}/>
          </TweakRow>
          <TweakRow label="Skolmarkör">
            <select value={tweaks.schoolMarkerStyle} onChange={e=>setTweak('schoolMarkerStyle', e.target.value)}
                    style={tweakSelect}>
              <option value="ring">Ring</option>
              <option value="dot">Fylld punkt</option>
            </select>
          </TweakRow>
        </div>
      )}

      <TweaksBgApply tweaks={tweaks}/>
    </div>
  );
}

const tweakSelect = {
  width:'100%', padding: '4px 8px', fontSize: 12, border:'1px solid var(--line-2)',
  borderRadius: 6, background:'#FFF', fontFamily:'inherit',
};

function TweakRow({ label, children }) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, padding:'8px 0', borderTop:'1px solid var(--line)'}}>
      <div style={{fontSize: 12, color:'var(--slate)'}}>{label}</div>
      <div style={{minWidth: 110, display:'flex', justifyContent:'flex-end'}}>{children}</div>
    </div>
  );
}

function TweaksBgApply({ tweaks }) {
  useEffect(()=>{
    const bg = tweaks.mapBg;
    const root = document.documentElement;
    if (bg === 'cool') { root.style.setProperty('--bg','#EEF1F3'); root.style.setProperty('--paper','#FFFFFF'); }
    else if (bg === 'dark') { root.style.setProperty('--bg','#1A1F25'); root.style.setProperty('--paper','#242B32'); root.style.setProperty('--ink','#F6F3EC'); root.style.setProperty('--slate','#C7CFD6'); root.style.setProperty('--slate-2','#9BA6B0'); root.style.setProperty('--line','#2F3840'); root.style.setProperty('--line-2','#3A444D'); root.style.setProperty('--mute','#7B8690'); }
    else { root.style.setProperty('--bg','#F6F3EC'); root.style.setProperty('--paper','#FFFFFF'); root.style.setProperty('--ink','#1A1F25'); root.style.setProperty('--slate','#364A5A'); root.style.setProperty('--slate-2','#4A5E6D'); root.style.setProperty('--line','#E6E2D7'); root.style.setProperty('--line-2','#D8D3C4'); root.style.setProperty('--mute','#8A96A0'); }
  }, [tweaks.mapBg]);
  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
