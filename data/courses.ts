// Course seed data — 57 entries, Chicago-heavy
// verified=false means ratings/slopes are approximate until confirmed via API

export interface Course {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  par: number;
  rating18?: number;
  slope18?: number;
  rating9?: number;
  slope9?: number;
  holes: 9 | 18;
  verified: boolean;
  notes?: string;
}

export const COURSES: Course[] = [
  // ─── CHICAGO METRO ───────────────────────────────────────────
  { id:'harborside-port',    name:'Harborside International - Port',    city:'Chicago',     state:'IL', lat:41.6585, lng:-87.5442, par:72, rating18:74.4, slope18:138, holes:18, verified:false },
  { id:'harborside-star',    name:'Harborside International - Starboard',city:'Chicago',     state:'IL', lat:41.6585, lng:-87.5442, par:72, rating18:73.7, slope18:134, holes:18, verified:false },
  { id:'cog-hill-1',         name:'Cog Hill Golf & Country Club - No. 1', city:'Lemont',     state:'IL', lat:41.6900, lng:-88.0015, par:72, rating18:70.4, slope18:121, holes:18, verified:false },
  { id:'cog-hill-2',         name:'Cog Hill Golf & Country Club - No. 2', city:'Lemont',     state:'IL', lat:41.6900, lng:-88.0015, par:72, rating18:71.4, slope18:125, holes:18, verified:false },
  { id:'cog-hill-4',         name:'Cog Hill Golf & Country Club - Dubsdread (No. 4)', city:'Lemont', state:'IL', lat:41.6900, lng:-88.0015, par:72, rating18:76.3, slope18:144, holes:18, verified:false, notes:'US Open qualifying venue' },
  { id:'cog-hill-3',         name:'Cog Hill Golf & Country Club - No. 3', city:'Lemont',     state:'IL', lat:41.6900, lng:-88.0015, par:72, rating18:72.6, slope18:132, holes:18, verified:false },
  { id:'jackson-park',       name:'Jackson Park Golf Course',            city:'Chicago',     state:'IL', lat:41.7780, lng:-87.5720, par:71, rating18:70.6, slope18:118, holes:18, verified:false },
  { id:'glen-club',          name:'The Glen Club',                       city:'Glenview',    state:'IL', lat:42.0810, lng:-87.8200, par:72, rating18:75.1, slope18:141, holes:18, verified:false },
  { id:'cantigny',           name:'Cantigny Golf',                       city:'Wheaton',     state:'IL', lat:41.8560, lng:-88.1760, par:72, rating18:73.7, slope18:135, holes:18, verified:false },
  { id:'medinah-3',          name:'Medinah Country Club - No. 3',        city:'Medinah',     state:'IL', lat:41.9610, lng:-88.0220, par:72, rating18:76.6, slope18:144, holes:18, verified:false },
  { id:'butler-national',    name:'Butler National Golf Club',           city:'Oak Brook',   state:'IL', lat:41.8540, lng:-87.9600, par:71, rating18:75.0, slope18:143, holes:18, verified:false },
  { id:'olympia-fields',     name:'Olympia Fields Country Club - North', city:'Olympia Fields', state:'IL', lat:41.5120, lng:-87.6930, par:70, rating18:74.4, slope18:142, holes:18, verified:false },
  { id:'shoreacres',         name:'Shore Acres Club',                    city:'Lake Bluff',  state:'IL', lat:42.2790, lng:-87.8510, par:71, rating18:73.8, slope18:141, holes:18, verified:false },
  { id:'bob-olink',          name:'Bob O\'Link Golf Club',               city:'Highland Park',state:'IL', lat:42.1760, lng:-87.8020, par:71, rating18:72.9, slope18:138, holes:18, verified:false },
  { id:'skokie-cc',          name:'Skokie Country Club',                 city:'Glencoe',     state:'IL', lat:42.1520, lng:-87.7830, par:71, rating18:74.4, slope18:141, holes:18, verified:false },
  { id:'midwest-gc',         name:'Midwest Club at Midwest GC',          city:'Hawthorn Woods',state:'IL',lat:42.2215, lng:-88.0370, par:72, rating18:73.5, slope18:133, holes:18, verified:false },
  { id:'seven-bridges',      name:'Seven Bridges Golf Club',             city:'Woodridge',   state:'IL', lat:41.7490, lng:-88.0280, par:72, rating18:73.3, slope18:130, holes:18, verified:false },
  { id:'golfclub-illinois',  name:'Golf Club of Illinois',               city:'Algonquin',   state:'IL', lat:42.2030, lng:-88.3410, par:72, rating18:74.7, slope18:137, holes:18, verified:false },
  { id:'chgo-highlands',     name:'Chicago Highlands Club',              city:'Westchester', state:'IL', lat:41.8520, lng:-87.8870, par:71, rating18:72.5, slope18:132, holes:18, verified:false },
  { id:'flossmoor',          name:'Flossmoor Country Club',              city:'Flossmoor',   state:'IL', lat:41.5370, lng:-87.6750, par:72, rating18:73.5, slope18:132, holes:18, verified:false },
  { id:'waveland',           name:'Sydney Marovitz (Waveland) Golf Course',city:'Chicago',   state:'IL', lat:41.9530, lng:-87.6380, par:35, rating9:35.7, slope9:122, holes:9, verified:false },
  { id:'columbus-park',      name:'Columbus Park Golf Course',           city:'Chicago',     state:'IL', lat:41.8710, lng:-87.7590, par:34, rating9:33.5, slope9:112, holes:9, verified:false },
  { id:'diversey-dr',        name:'Diversey Driving Range & Par 3',      city:'Chicago',     state:'IL', lat:41.9370, lng:-87.6380, par:27, holes:9, verified:false },
  { id:'lincoln-fields',     name:'Lincoln Fields Country Club',         city:'Crete',       state:'IL', lat:41.4410, lng:-87.6200, par:72, rating18:72.9, slope18:126, holes:18, verified:false },
  { id:'valley-lo',          name:'Valley Lo Sports Club',               city:'Glenview',    state:'IL', lat:42.0870, lng:-87.8560, par:72, rating18:71.5, slope18:126, holes:18, verified:false },
  { id:'sportsmans',         name:'Sportsman\'s Country Club',           city:'Northbrook',  state:'IL', lat:42.1490, lng:-87.9000, par:72, rating18:70.5, slope18:122, holes:18, verified:false },
  { id:'eagle-ridge-gen',    name:'Eagle Ridge Resort - General Course', city:'Galena',      state:'IL', lat:42.3680, lng:-90.4320, par:72, rating18:73.8, slope18:138, holes:18, verified:false },
  { id:'eagle-ridge-north',  name:'Eagle Ridge Resort - North Course',   city:'Galena',      state:'IL', lat:42.3680, lng:-90.4320, par:72, rating18:74.7, slope18:141, holes:18, verified:false },

  // ─── WISCONSIN ───────────────────────────────────────────────
  { id:'erin-hills',         name:'Erin Hills Golf Course',              city:'Erin',        state:'WI', lat:43.0590, lng:-88.3840, par:72, rating18:76.2, slope18:148, holes:18, verified:false, notes:'2017 US Open venue' },
  { id:'whistling-straits',  name:'Whistling Straits (Straits)',         city:'Haven',       state:'WI', lat:43.9110, lng:-87.7960, par:72, rating18:77.2, slope18:151, holes:18, verified:false, notes:'2021 Ryder Cup venue' },
  { id:'blackwolf-meadow',   name:'Blackwolf Run - Meadow Valleys',     city:'Kohler',      state:'WI', lat:43.7240, lng:-87.7910, par:72, rating18:74.6, slope18:138, holes:18, verified:false },
  { id:'blackwolf-river',    name:'Blackwolf Run - River',               city:'Kohler',      state:'WI', lat:43.7240, lng:-87.7910, par:72, rating18:74.7, slope18:143, holes:18, verified:false },
  { id:'sentryworld',        name:'SentryWorld',                         city:'Stevens Point',state:'WI', lat:44.5250, lng:-89.5460, par:72, rating18:74.0, slope18:137, holes:18, verified:false },
  { id:'lawsonia-links',     name:'Lawsonia Links Course',               city:'Green Lake',  state:'WI', lat:43.8580, lng:-88.9380, par:72, rating18:73.9, slope18:136, holes:18, verified:false },
  { id:'geneva-natl',        name:'Geneva National Resort - Palmer',     city:'Lake Geneva', state:'WI', lat:42.5840, lng:-88.4610, par:72, rating18:74.4, slope18:137, holes:18, verified:false },

  // ─── MICHIGAN ─────────────────────────────────────────────────
  { id:'arcadia-bluffs',     name:'Arcadia Bluffs Golf Club',            city:'Arcadia',     state:'MI', lat:44.5060, lng:-86.2360, par:72, rating18:75.8, slope18:143, holes:18, verified:false },
  { id:'forest-dunes',       name:'Forest Dunes Golf Club',              city:'Roscommon',   state:'MI', lat:44.5630, lng:-84.5730, par:72, rating18:75.9, slope18:141, holes:18, verified:false },
  { id:'bay-harbor',         name:'Bay Harbor Golf Club - Links',        city:'Bay Harbor',  state:'MI', lat:45.3710, lng:-85.0390, par:72, rating18:75.0, slope18:140, holes:18, verified:false },
  { id:'herrington-pointe',  name:'Heritance Golf Club',                 city:'Chelsea',     state:'MI', lat:42.3180, lng:-84.0600, par:72, rating18:72.4, slope18:128, holes:18, verified:false },
  { id:'shepherds-hollow',   name:'Shepherd\'s Hollow Golf Club',        city:'Clarkston',   state:'MI', lat:42.7660, lng:-83.4570, par:72, rating18:75.3, slope18:140, holes:18, verified:false },

  // ─── NATIONAL BUCKET LIST ─────────────────────────────────────
  { id:'pebble-beach',       name:'Pebble Beach Golf Links',             city:'Pebble Beach', state:'CA', lat:36.5688, lng:-121.9494, par:72, rating18:75.4, slope18:145, holes:18, verified:false, notes:'Bucket list — Ocean views, 7th hole' },
  { id:'bandon-dunes',       name:'Bandon Dunes Golf Resort - Bandon Dunes', city:'Bandon', state:'OR', lat:43.1680, lng:-124.4060, par:72, rating18:74.3, slope18:140, holes:18, verified:false },
  { id:'pacific-dunes',      name:'Bandon Dunes Golf Resort - Pacific Dunes', city:'Bandon', state:'OR', lat:43.1680, lng:-124.4060, par:71, rating18:74.5, slope18:142, holes:18, verified:false },
  { id:'bandon-trails',      name:'Bandon Dunes Golf Resort - Bandon Trails', city:'Bandon', state:'OR', lat:43.1680, lng:-124.4060, par:71, rating18:73.6, slope18:130, holes:18, verified:false },
  { id:'bethpage-black',     name:'Bethpage State Park - Black Course', city:'Farmingdale', state:'NY', lat:40.7240, lng:-73.4520, par:71, rating18:77.8, slope18:155, holes:18, verified:false, notes:'Warning sign — most difficult public course in USA' },
  { id:'tpc-sawgrass',       name:'TPC Sawgrass - Stadium Course',      city:'Ponte Vedra Beach', state:'FL', lat:30.1980, lng:-81.3970, par:72, rating18:76.0, slope18:147, holes:18, verified:false, notes:'THE PLAYERS Championship venue; 17th island green' },
  { id:'pinehurst-2',        name:'Pinehurst Resort & CC - No. 2',       city:'Pinehurst',   state:'NC', lat:35.1930, lng:-79.4710, par:70, rating18:75.8, slope18:142, holes:18, verified:false },
  { id:'torrey-pines-s',     name:'Torrey Pines Golf Course - South',   city:'La Jolla',    state:'CA', lat:32.8980, lng:-117.2490, par:72, rating18:75.7, slope18:144, holes:18, verified:false },
  { id:'kiawah-ocean',       name:'Kiawah Island Golf Resort - Ocean',  city:'Kiawah Island',state:'SC', lat:32.6060, lng:-80.0850, par:72, rating18:79.6, slope18:152, holes:18, verified:false, notes:'2021 PGA Championship venue' },
  { id:'streamsong-red',     name:'Streamsong Resort - Red',            city:'Streamsong',  state:'FL', lat:27.8340, lng:-81.8330, par:72, rating18:75.8, slope18:143, holes:18, verified:false },
  { id:'streamsong-blue',    name:'Streamsong Resort - Blue',           city:'Streamsong',  state:'FL', lat:27.8340, lng:-81.8330, par:72, rating18:75.2, slope18:140, holes:18, verified:false },
  { id:'erin-hills-short',   name:'Erin Hills - Short Nine',            city:'Erin',        state:'WI', lat:43.0590, lng:-88.3840, par:35, rating9:36.0, slope9:136, holes:9, verified:false },
  { id:'sand-hills',         name:'Sand Hills Golf Club',               city:'Mullen',      state:'NE', lat:42.0760, lng:-101.1200, par:72, rating18:75.0, slope18:142, holes:18, verified:false, notes:'Bucket list — one of the greatest courses in America' },
  { id:'prairie-dunes',      name:'Prairie Dunes Country Club',         city:'Hutchinson',  state:'KS', lat:38.0860, lng:-97.9470, par:70, rating18:73.2, slope18:138, holes:18, verified:false },
  { id:'pasatiempo',         name:'Pasatiempo Golf Club',               city:'Santa Cruz',  state:'CA', lat:37.0170, lng:-122.0420, par:71, rating18:74.9, slope18:143, holes:18, verified:false },
  { id:'richland-cc',        name:'Richland Country Club',              city:'Richland Center',state:'WI', lat:43.3360, lng:-90.3740, par:71, rating18:70.5, slope18:122, holes:18, verified:false },
];
