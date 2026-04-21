// Gothenburg school zones — geographic polygons (approximate, stylised)
// Coordinates in [lat, lng]. Traced loosely to match the 4 stadsområden.

const ZONES = {
  hisingen: {
    id: 'hisingen', name: 'Hisingen',
    color: '#0E7C86', ink:'#FFFFFF', soft:'#BFDDDF',
    students: 14820, schools: 32, avgClass: 22.4, teacherRatio: 11.8,
    satisfaction: 71, newcomers: 18,
    grades:{fk3:42,y46:32,y79:26},
    trend:[13200,13500,13900,14200,14500,14820],
    tagline:'Störst till ytan, mest varierat elevunderlag.',
    center: [57.745, 11.91],
  },
  nordost: {
    id:'nordost', name:'Nordost',
    color:'#F5C518', ink:'#1A1F25', soft:'#FCE89A',
    students:11240, schools:24, avgClass:23.1, teacherRatio:12.4,
    satisfaction:68, newcomers:27,
    grades:{fk3:45,y46:31,y79:24},
    trend:[9800,10100,10500,10780,11050,11240],
    tagline:'Snabbast växande område, ung befolkning.',
    center:[57.775, 12.04],
  },
  centrum: {
    id:'centrum', name:'Centrum',
    color:'#8FC49F', ink:'#0B3C1F', soft:'#D9ECDD',
    students:6980, schools:18, avgClass:21.2, teacherRatio:10.6,
    satisfaction:78, newcomers:9,
    grades:{fk3:38,y46:33,y79:29},
    trend:[6700,6750,6820,6880,6940,6980],
    tagline:'Högst behörighet till gymnasiet i staden.',
    center:[57.70, 12.00],
  },
  sydvast: {
    id:'sydvast', name:'Sydväst',
    color:'#F4BFAE', ink:'#5A1F10', soft:'#FADFD4',
    students:9650, schools:22, avgClass:22.0, teacherRatio:11.2,
    satisfaction:74, newcomers:12,
    grades:{fk3:40,y46:33,y79:27},
    trend:[9100,9220,9340,9460,9560,9650],
    tagline:'Stabil tillväxt, hög andel behöriga lärare.',
    center:[57.655, 11.92],
  },
};

// Approximate polygon outlines for each zone (stadsområde).
// Hand-traced — good enough for analytics visual, not cadastral accuracy.
const ZONE_POLYGONS = {
  // Hisingen island — traced along the Nordre älv (north), Göta älv (south),
  // and the Kattegat coastline (west). Clockwise from NW tip.
  hisingen: [
    [57.8310, 11.7680], // NW tip near Björlanda / coast
    [57.8380, 11.8050],
    [57.8440, 11.8600], // Nordre älv mouth area
    [57.8420, 11.9100],
    [57.8380, 11.9600],
    [57.8300, 12.0050],
    [57.8200, 12.0400], // NE tip by Surte / Nordre älv bend
    [57.8080, 12.0450],
    [57.7950, 12.0300],
    [57.7820, 12.0150],
    [57.7700, 12.0050], // Gamlestaden / Tingstadstunneln
    [57.7600, 11.9950],
    [57.7480, 11.9850],
    [57.7380, 11.9700], // Lindholmen / along Göta älv south bank of Hisingen
    [57.7300, 11.9500],
    [57.7200, 11.9200],
    [57.7100, 11.8900], // Eriksberg
    [57.7050, 11.8500], // Sannegården
    [57.7020, 11.8100], // Arendal / Hjuvik approach
    [57.7080, 11.7700], // Torslanda south coast
    [57.7200, 11.7400],
    [57.7400, 11.7250], // Torslanda / Amhult
    [57.7600, 11.7200],
    [57.7800, 11.7250],
    [57.8000, 11.7350],
    [57.8180, 11.7500],
  ],
  nordost: [
    [57.835, 11.990], [57.845, 12.035], [57.850, 12.080], [57.845, 12.130],
    [57.830, 12.175], [57.810, 12.190], [57.785, 12.180], [57.760, 12.160],
    [57.740, 12.130], [57.728, 12.095], [57.720, 12.060], [57.725, 12.025],
    [57.740, 12.005], [57.760, 11.995], [57.785, 11.992], [57.810, 11.993],
  ],
  centrum: [
    [57.728, 11.960], [57.730, 11.995], [57.725, 12.025], [57.720, 12.060],
    [57.715, 12.085], [57.705, 12.100], [57.690, 12.095], [57.680, 12.070],
    [57.678, 12.040], [57.682, 12.010], [57.690, 11.980], [57.700, 11.960],
    [57.712, 11.955],
  ],
  sydvast: [
    [57.690, 11.780], [57.705, 11.810], [57.712, 11.850], [57.708, 11.890],
    [57.700, 11.930], [57.690, 11.960], [57.678, 11.970], [57.660, 11.965],
    [57.640, 11.950], [57.625, 11.930], [57.615, 11.900], [57.612, 11.870],
    [57.618, 11.835], [57.630, 11.805], [57.650, 11.785], [57.670, 11.775],
  ],
};

// Schools — real-ish names, approximate coordinates within each zone
const SCHOOLS = [
  // Hisingen
  { id:'h1', zone:'hisingen', name:'Bräckeskolan',        students:412, type:'F-6', lat:57.706, lng:11.870 },
  { id:'h2', zone:'hisingen', name:'Biskopsgårdsskolan',  students:568, type:'F-9', lat:57.725, lng:11.870 },
  { id:'h3', zone:'hisingen', name:'Lundbyskolan',        students:490, type:'F-6', lat:57.715, lng:11.935 },
  { id:'h4', zone:'hisingen', name:'Ryaskolan',           students:378, type:'F-6', lat:57.735, lng:11.850 },
  { id:'h5', zone:'hisingen', name:'Toleredsskolan',      students:622, type:'F-9', lat:57.765, lng:11.905 },
  { id:'h6', zone:'hisingen', name:'Kannebäcksskolan',    students:340, type:'F-3', lat:57.750, lng:11.950 },
  { id:'h7', zone:'hisingen', name:'Backaskolan',         students:455, type:'F-6', lat:57.735, lng:11.965 },
  { id:'h8', zone:'hisingen', name:'Klareberg',           students:310, type:'F-6', lat:57.795, lng:11.870 },
  { id:'h9', zone:'hisingen', name:'Kärra',               students:520, type:'F-9', lat:57.800, lng:11.950 },
  { id:'h10',zone:'hisingen', name:'Skälltorp',           students:395, type:'F-6', lat:57.780, lng:11.920 },
  { id:'h11',zone:'hisingen', name:'Eriksbo',             students:290, type:'F-3', lat:57.790, lng:11.995 },
  { id:'h12',zone:'hisingen', name:'Länsmansgården',      students:410, type:'4-9', lat:57.720, lng:11.820 },

  // Nordost
  { id:'n1', zone:'nordost', name:'Bergsjöskolan',        students:540, type:'F-9', lat:57.765, lng:12.050 },
  { id:'n2', zone:'nordost', name:'Gårdstensskolan',      students:480, type:'F-6', lat:57.810, lng:12.070 },
  { id:'n3', zone:'nordost', name:'Hammarkullsskolan',    students:395, type:'F-6', lat:57.795, lng:12.040 },
  { id:'n4', zone:'nordost', name:'Hjällboskolan',        students:610, type:'F-9', lat:57.775, lng:12.030 },
  { id:'n5', zone:'nordost', name:'Utbyskolan',           students:330, type:'F-3', lat:57.740, lng:12.055 },
  { id:'n6', zone:'nordost', name:'Kortedala',            students:510, type:'F-6', lat:57.755, lng:12.070 },
  { id:'n7', zone:'nordost', name:'Angeredsskolan',       students:580, type:'F-9', lat:57.815, lng:12.105 },
  { id:'n8', zone:'nordost', name:'Rannebergsskolan',     students:265, type:'F-3', lat:57.830, lng:12.120 },
  { id:'n9', zone:'nordost', name:'Kviberg',              students:445, type:'F-6', lat:57.740, lng:12.030 },

  // Centrum
  { id:'c1', zone:'centrum', name:'Annedalsskolan',       students:420, type:'F-6', lat:57.700, lng:11.960 },
  { id:'c2', zone:'centrum', name:'Guldhedsskolan',       students:365, type:'F-6', lat:57.690, lng:11.975 },
  { id:'c3', zone:'centrum', name:'Johannebergsskolan',   students:480, type:'F-9', lat:57.690, lng:12.000 },
  { id:'c4', zone:'centrum', name:'Bergsgårdsskolan',     students:295, type:'F-3', lat:57.700, lng:11.985 },
  { id:'c5', zone:'centrum', name:'Vasaskolan',           students:510, type:'F-9', lat:57.700, lng:11.970 },
  { id:'c6', zone:'centrum', name:'Haga',                 students:260, type:'F-3', lat:57.702, lng:11.955 },
  { id:'c7', zone:'centrum', name:'Lundenskolan',         students:390, type:'F-6', lat:57.710, lng:12.025 },
  { id:'c8', zone:'centrum', name:'Örgryteskolan',        students:330, type:'F-6', lat:57.700, lng:12.040 },

  // Sydväst
  { id:'s1', zone:'sydvast', name:'Askimsskolan',         students:455, type:'F-6', lat:57.640, lng:11.910 },
  { id:'s2', zone:'sydvast', name:'Frölundaskolan',       students:510, type:'F-9', lat:57.660, lng:11.920 },
  { id:'s3', zone:'sydvast', name:'Hagenskolan',          students:340, type:'F-6', lat:57.650, lng:11.895 },
  { id:'s4', zone:'sydvast', name:'Ängåsskolan',          students:420, type:'F-6', lat:57.665, lng:11.935 },
  { id:'s5', zone:'sydvast', name:'Påvelundsskolan',      students:380, type:'F-6', lat:57.680, lng:11.870 },
  { id:'s6', zone:'sydvast', name:'Tynneredsskolan',      students:480, type:'F-9', lat:57.660, lng:11.895 },
  { id:'s7', zone:'sydvast', name:'Önneredsskolan',       students:290, type:'F-3', lat:57.655, lng:11.870 },
  { id:'s8', zone:'sydvast', name:'Västra Frölunda',      students:535, type:'F-9', lat:57.655, lng:11.915 },
  { id:'s9', zone:'sydvast', name:'Näsetskolan',          students:245, type:'F-3', lat:57.635, lng:11.830 },
];

window.ZONES = ZONES;
window.ZONE_POLYGONS = ZONE_POLYGONS;
window.SCHOOLS = SCHOOLS;
