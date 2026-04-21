// Leaflet-based map with real tiles and zone polygons

const { useEffect, useRef } = React;

const mapStyles = {
  wrap: {
    position:'relative', background:'var(--paper)',
    border:'1px solid var(--line)', borderRadius:8, overflow:'hidden',
    display:'flex', flexDirection:'column', minHeight: 0,
    boxShadow:'0 1px 0 rgba(0,0,0,0.02)',
    flex: 1,
  },
  zoneStrip: {
    display:'flex', alignItems:'stretch',
    borderBottom:'1px solid var(--line)',
    background:'#FBF9F3', zIndex: 2,
  },
  zoneTab: (zone, active, dim, isMobile) => ({
    flex: 1,
    display:'flex', flexDirection:'column', justifyContent:'center',
    padding: isMobile ? '7px 10px' : '10px 14px',
    cursor:'pointer', userSelect:'none',
    transition:'all 140ms ease',
    borderRight:'1px solid var(--line)',
    borderBottom: active ? `3px solid ${zone.color}` : '3px solid transparent',
    background: active ? '#FFFFFF' : 'transparent',
    opacity: dim ? 0.45 : 1,
    position:'relative',
    minHeight: isMobile ? 44 : 'auto',
  }),
  zoneTabHead: { display:'flex', alignItems:'center', gap:8, marginBottom:2 },
  zoneTabSwatch: (c) => ({ width:10, height:10, borderRadius:3, background:c, boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.08)' }),
  zoneTabName: { fontSize: 13, fontWeight: 700, color:'var(--ink)', letterSpacing:'-0.01em' },
  zoneTabMeta: { fontSize: 10.5, color:'var(--mute)', fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.06em' },
  zoneTabEye: {
    position:'absolute', top:8, right:8,
    width:18, height:18, borderRadius:4,
    display:'flex', alignItems:'center', justifyContent:'center',
    cursor:'pointer', color:'var(--mute)',
    fontSize: 11,
  },
  filterPanel:{
    position:'absolute', right:14, top:14, zIndex:500,
    background:'#FFFFFF', border:'1px solid var(--line)', borderRadius:8,
    padding:'8px 12px',
    display:'flex', alignItems:'center', gap:10,
    boxShadow:'0 6px 20px rgba(0,0,0,0.12)',
  },
  filterLabel:{ fontFamily:'JetBrains Mono, monospace', fontSize:9.5, letterSpacing:'0.12em', color:'var(--mute)', textTransform:'uppercase' },
  pills:{display:'flex', gap:4},
  pill:(a)=>({
    padding:'4px 10px', fontSize:11, fontWeight:600,
    border:'1px solid '+(a?'var(--slate)':'var(--line-2)'),
    background: a?'var(--slate)':'#FFF', color: a?'#FFF':'var(--slate)',
    borderRadius:999, cursor:'pointer', transition:'all 120ms',
  }),
  legendCard: {
    position:'absolute', left:14, bottom:14, zIndex:500,
    background:'#FFFFFF', border:'1px solid var(--line)', borderRadius:8,
    padding:'10px 14px',
    display:'flex', flexDirection:'column', gap:6,
    boxShadow:'0 6px 20px rgba(0,0,0,0.12)',
    minWidth: 160,
  },
  clearBtn: {
    position:'absolute', left:64, top:14, zIndex:500,
    background:'#FFFFFF', border:'1px solid var(--line)', borderRadius:999,
    padding:'6px 12px',
    fontSize:11, fontWeight:600, color:'var(--ink)',
    cursor:'pointer', boxShadow:'0 6px 20px rgba(0,0,0,0.12)',
    display:'flex', alignItems:'center', gap:6,
  },
};

function ZoneMap({ selected, onSelect, typeFilter, setTypeFilter, visibleZones, toggleZone, activeSchool, onSchoolClick, isMobile }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const zonesLayer = useRef({});
  const markersLayer = useRef(null);
  const markerById = useRef({});
  const rippleLayer = useRef(null);

  // Refs-to-latest-state so Leaflet event handlers don't capture stale closures
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selected);
  const visibleZonesRef = useRef(visibleZones);
  useEffect(()=>{ onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(()=>{ selectedRef.current = selected; }, [selected]);
  useEffect(()=>{ visibleZonesRef.current = visibleZones; }, [visibleZones]);

  // Pure style computation — reads from refs so it's always current
  function computeStyle(zid, hovering=false) {
    const on = visibleZonesRef.current.includes(zid);
    const sel = selectedRef.current;
    const isSel = sel === zid;
    const dim = !on || (sel && !isSel);
    return {
      fillOpacity: dim ? 0.08 : (isSel ? 0.82 : (hovering ? 0.68 : 0.48)),
      opacity: dim ? 0.3 : 1,
      weight: isSel ? 4 : (hovering ? 3 : 2),
      color: isSel ? '#1A1F25' : (hovering ? '#1A1F25' : '#FFFFFF'),
      dashArray: isSel ? null : (hovering ? '6 4' : null),
    };
  }
  function applyStyle(zid, hovering=false) {
    const poly = zonesLayer.current[zid];
    if (!poly) return;
    poly.setStyle(computeStyle(zid, hovering));
    const tt = poly.getTooltip();
    if (tt && tt.getElement()) {
      const on = visibleZonesRef.current.includes(zid);
      const sel = selectedRef.current;
      const dim = !on || (sel && sel !== zid);
      tt.getElement().style.opacity = dim ? 0.3 : 1;
    }
  }
  // Stash on ref too so init-time closures can reach it
  const applyStyleRef = useRef(applyStyle);
  applyStyleRef.current = applyStyle;

  function wirePolygon(zid, poly) {
    poly.on('click', () => onSelectRef.current(zid));
    poly.on('mouseover', () => applyStyleRef.current(zid, true));
    poly.on('mouseout',  () => applyStyleRef.current(zid, false));
  }

  const onSchoolClickRef = useRef(onSchoolClick);
  useEffect(()=>{ onSchoolClickRef.current = onSchoolClick; }, [onSchoolClick]);

  // Expose map instance + marker lookup via global so School Card can compute anchor pos
  useEffect(()=>{
    window.__gbgMap = { map: mapInst.current, markerById: markerById.current };
  });

  // Init map once
  useEffect(() => {
    if (mapInst.current) return;
    const map = L.map(mapRef.current, {
      center: [57.72, 11.97],
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
    });
    // Use a light Google-Maps-like basemap (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:'© OpenStreetMap · © CARTO',
      subdomains:'abcd', maxZoom:19,
    }).addTo(map);

    // Build zone polygons
    Object.values(ZONES).forEach(z => {
      const coords = ZONE_POLYGONS[z.id];
      const poly = L.polygon(coords, {
        color:'#FFFFFF', weight:2, opacity:1,
        fillColor: z.color, fillOpacity: 0.48,
        className:'zone-poly',
      }).addTo(map);
      wirePolygon(z.id, poly);

      // Label tooltip (permanent)
      poly.bindTooltip(
        `<div style="font-family:Inter;font-weight:800;font-size:14px;letter-spacing:-0.01em;color:${['centrum','nordost','sydvast'].includes(z.id)?'#1A1F25':'#FFFFFF'}">${z.name}</div>
         <div style="font-family:JetBrains Mono,monospace;font-size:9px;letter-spacing:0.12em;opacity:0.8;color:${['centrum','nordost','sydvast'].includes(z.id)?'#1A1F25':'#FFFFFF'};margin-top:2px">${z.schools} SKOLOR</div>`,
        {permanent:true, direction:'center', className:'zone-label', opacity:1}
      );

      zonesLayer.current[z.id] = poly;
    });

    // Asynchronously upgrade all zones to real OSM stadsområde boundaries
    const OSM_QUERIES = {
      hisingen: 'Hisingen,+G%C3%B6teborgs+Stad',
      nordost:  'Nordost,+G%C3%B6teborg,+G%C3%B6teborgs+Stad',
      centrum:  'Centrum,+G%C3%B6teborg,+G%C3%B6teborgs+Stad',
      sydvast:  'Sydv%C3%A4st,+G%C3%B6teborg,+G%C3%B6teborgs+Stad',
    };
    Object.entries(OSM_QUERIES).forEach(([zid, q]) => {
      fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&polygon_geojson=1&limit=5`)
        .then(r => r.json())
        .then(results => {
          const hit = (results || []).find(h => h.class === 'boundary' && h.geojson && (h.geojson.type === 'Polygon' || h.geojson.type === 'MultiPolygon'));
          if (!hit) return;
          const gj = hit.geojson;
          const latlngs = [];
          const toLL = (ring) => ring.map(([lng,lat]) => [lat,lng]);
          if (gj.type === 'Polygon') gj.coordinates.forEach(ring => latlngs.push(toLL(ring)));
          else gj.coordinates.forEach(poly => poly.forEach(ring => latlngs.push(toLL(ring))));
          if (!latlngs.length) return;
          const old = zonesLayer.current[zid];
          const tt = old && old.getTooltip();
          if (old) map.removeLayer(old);
          const zd = ZONES[zid];
          const newPoly = L.polygon(latlngs, {
            color:'#FFFFFF', weight:2, opacity:1,
            fillColor: zd.color, fillOpacity: 0.48,
            className:'zone-poly',
          }).addTo(map);
          wirePolygon(zid, newPoly);
          if (tt) newPoly.bindTooltip(tt.getContent(), {permanent:true, direction:'center', className:'zone-label', opacity:1});
          zonesLayer.current[zid] = newPoly;
          applyStyle(zid);
        })
        .catch(()=>{});
    });

    markersLayer.current = L.layerGroup().addTo(map);
    rippleLayer.current = L.layerGroup().addTo(map);

    mapInst.current = map;

    // Click on empty map dismisses active school
    map.on('click', () => {
      if (onSchoolClickRef.current) onSchoolClickRef.current(null);
    });
  }, []);

  // Keep refs fresh so leaflet handlers call latest React callbacks

  useEffect(() => {
    Object.keys(zonesLayer.current).forEach(z => applyStyle(z));
    // Pan/fit to the selected zone so the user sees the reaction
    if (selected && mapInst.current && zonesLayer.current[selected]) {
      const b = zonesLayer.current[selected].getBounds();
      if (b.isValid()) mapInst.current.flyToBounds(b, { padding:[40,40], duration: 0.6, maxZoom: 12 });
    }
  }, [selected, visibleZones]);

  // Rebuild school markers whenever filters change
  useEffect(() => {
    if (!markersLayer.current) return;
    markersLayer.current.clearLayers();
    markerById.current = {};
    SCHOOLS
      .filter(s => visibleZones.includes(s.zone))
      .filter(s => typeFilter === 'all' || s.type === typeFilter)
      .forEach(s => {
        const zd = ZONES[s.zone];
        const isDim = selected && selected !== s.zone;
        const isActive = activeSchool && activeSchool.id === s.id;
        const r = Math.max(4, Math.sqrt(s.students)/3.2);
        const marker = L.circleMarker([s.lat, s.lng], {
          radius: isActive ? r + 3 : r,
          color: zd.color, weight: isActive ? 3.5 : 2.5,
          fillColor: isActive ? zd.color : '#FFFFFF', fillOpacity: 1,
          opacity: isDim && !isActive ? 0.25 : 1,
          className: 'school-ring',
        }).addTo(markersLayer.current);
        // inner dot
        const dot = L.circleMarker([s.lat, s.lng], {
          radius: isActive ? 4 : 3, color: zd.color, weight: 0,
          fillColor: isActive ? '#FFFFFF' : zd.color,
          fillOpacity: isDim && !isActive ? 0.3 : 1,
          interactive: false,
        }).addTo(markersLayer.current);

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          triggerRipple(s.lat, s.lng, zd.color);
          if (onSchoolClickRef.current) onSchoolClickRef.current(s);
        });
        marker.bindTooltip(
          `<b>${s.name}</b><br>${s.type} · ${s.students} elever`,
          {direction:'top', offset:[0,-r]}
        );
        markerById.current[s.id] = marker;
      });
  }, [typeFilter, visibleZones, selected, activeSchool]);

  // Fly to selected school
  useEffect(()=>{
    if (!activeSchool || !mapInst.current) return;
    // Offset target vertically so the school sits above center (leaves room for card below)
    const map = mapInst.current;
    const size = map.getSize();
    const targetPoint = map.project([activeSchool.lat, activeSchool.lng], 14);
    targetPoint.y -= size.y * 0.18; // push focus up by 18%
    const centered = map.unproject(targetPoint, 14);
    map.flyTo(centered, 14, { duration: 0.6 });
  }, [activeSchool]);

  // Ripple effect on click — an expanding circle that fades out
  function triggerRipple(lat, lng, color) {
    if (!rippleLayer.current || !mapInst.current) return;
    const start = performance.now();
    const dur = 700;
    const ring = L.circleMarker([lat, lng], {
      radius: 4, color: color, weight: 3, opacity: 0.9,
      fill: false, interactive: false, className: 'school-ripple',
    }).addTo(rippleLayer.current);
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      ring.setStyle({ opacity: 0.9 * (1 - t) });
      ring.setRadius(4 + eased * 38);
      if (t < 1) requestAnimationFrame(step);
      else rippleLayer.current.removeLayer(ring);
    }
    requestAnimationFrame(step);
  }

  const zoneList = ['hisingen','nordost','centrum','sydvast'];

  return (
    <div style={mapStyles.wrap}>
      {/* Zone tabs strip — combines legend + selector + visibility toggle */}
      <div style={mapStyles.zoneStrip}>
        {zoneList.map(z => {
          const zd = ZONES[z];
          const on = visibleZones.includes(z);
          const isSel = selected === z;
          return (
            <div key={z}
                 style={mapStyles.zoneTab(zd, isSel, !on, isMobile)}
                 onClick={()=>onSelect(z)}
                 title="Klicka för att välja område">
              <div style={mapStyles.zoneTabHead}>
                <div style={mapStyles.zoneTabSwatch(zd.color)}/>
                <div style={{...mapStyles.zoneTabName, fontSize: isMobile ? 12 : 13}}>{zd.name}</div>
              </div>
              {!isMobile && (
                <div style={mapStyles.zoneTabMeta}>
                  {zd.schools} skolor · {zd.students.toLocaleString('sv-SE')} elever
                </div>
              )}
              {isMobile && (
                <div style={mapStyles.zoneTabMeta}>{zd.schools} skolor</div>
              )}
              <div style={mapStyles.zoneTabEye}
                   onClick={(e)=>{e.stopPropagation(); toggleZone(z);}}
                   title={on?'Dölj på kartan':'Visa på kartan'}>
                {on ? '●' : '○'}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{position:'relative', flex:1, minHeight:0}}>
        <div ref={mapRef} style={{position:'absolute', inset:0}}/>

        {/* Top-left: school type filter (compact horizontal) */}
        <div style={isMobile ? {...mapStyles.filterPanel, right: 8, top: 8, padding:'6px 8px', gap: 6} : mapStyles.filterPanel}>
          {!isMobile && <div style={mapStyles.filterLabel}>Skoltyp</div>}
          <div style={mapStyles.pills}>
            {['all','F-3','F-6','F-9','4-9'].map(t=>(
              <div key={t} style={mapStyles.pill(typeFilter===t)} onClick={()=>setTypeFilter(t)}>
                {t==='all'?'Alla':t}
              </div>
            ))}
          </div>
        </div>

        {/* Top-right: clear selection (only when something is selected) */}
        {selected && (
          <div style={mapStyles.clearBtn} onClick={()=>onSelect(selected)}>
            <span style={{fontSize:14, lineHeight:1}}>×</span>
            <span>Återställ</span>
          </div>
        )}

        {/* Bottom-right: marker size legend (hidden on mobile for space) */}
        {!isMobile && (
        <div style={mapStyles.legendCard}>
          <div style={mapStyles.filterLabel}>Skolstorlek</div>
          <div style={{display:'flex', alignItems:'center', gap:14, marginTop:2}}>
            <div style={{display:'flex', alignItems:'center', gap:6}}>
              <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="4" fill="#FFF" stroke="#364A5A" strokeWidth="2"/></svg>
              <span style={{fontSize:10.5, color:'var(--slate)', fontFamily:'JetBrains Mono, monospace'}}>~300</span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:6}}>
              <svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#FFF" stroke="#364A5A" strokeWidth="2"/></svg>
              <span style={{fontSize:10.5, color:'var(--slate)', fontFamily:'JetBrains Mono, monospace'}}>~600</span>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

window.ZoneMap = ZoneMap;
