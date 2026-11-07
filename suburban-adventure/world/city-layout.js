// Allston-inspired rather than a street-for-street reproduction. World north is +z.
export const CITY_ATMOSPHERE = { color:0x77817d, near:16, far:118, loadDistance:172, keepDistance:205 };
export const CITY_DISTRICTS = [
    {key:'CITY_NW',name:'Rat City Porches',x:-333,z:333,kind:'porches',shops:['Corner Market','Basement Laundry','Rat City Repairs']},
    {key:'CITY_N',name:'Commonwealth Avenue',x:0,z:333,kind:'apartments',shops:['Comm Ave Pharmacy','Allston Books','Daybreak Cafe']},
    {key:'CITY_NE',name:'Rehearsal District',x:333,z:333,kind:'music',shops:['Static Records','Practice Rooms','Secondhand Sound','Night Window Vintage']},
    {key:'CITY_W',name:'Linden Side Streets',x:-333,z:0,kind:'porches',shops:['Linden Laundry','Porchlight Market','Basement Tapes']},
    {key:'CITY_PLAZA',name:'Harvard Avenue Village',x:0,z:0,kind:'village',shops:['Harvard Hardware','Village Pizza','Allston Exchange']},
    {key:'CITY_E',name:'Brighton Food Blocks',x:333,z:0,kind:'food',shops:['Seoul Kitchen','Midnight Dumplings','Banh Mi Corner','Steam Table','Late Night Noodles']},
    {key:'CITY_SW',name:'Union Square Commons',x:-333,z:-333,kind:'park',shops:['Garden Supply','Union Corner Store','Community Workshop']},
    {key:'CITY_S',name:'Brighton After Dark',x:0,z:-333,kind:'nightlife',shops:['The Loading Dock','After Hours Diner','Allston Arcade']},
    {key:'CITY_SE',name:'Green Line & Back Streets',x:333,z:-333,kind:'station',shops:['Station Bakery','Bike Repair','Parcel Depot','Back Street Auto']}
];
export const CITY_LOCAL_ROADS = [
    ...[-443,-223,-110,110,223,443].map(z=>({axis:'x',coordinate:z,min:-500,max:500,width:8})),
    ...[-410,410].map(x=>({axis:'z',coordinate:x,min:-500,max:500,width:8}))
];
export const CITY_HORIZONTAL_ROADS = [-443,-322,-223,-166,-110,11,110,166,223,344,443];
export const CITY_VERTICAL_ROADS = [-410,-255,-85,85,255,410];
export const CITY_SPECIAL_SITES = [
    {id:'musicHall',x:350,z:392,width:34,depth:28,height:14,style:'music',name:'The Feedback Room',facing:-1},
    {id:'depot',x:348,z:-468,width:38,depth:20,height:9,style:'station',name:'Back Street Works',facing:1}
];
const overlaps=(a,b,pad=0)=>Math.abs(a.x-b.x)<(a.width+b.width)/2+pad&&Math.abs(a.z-b.z)<(a.depth+b.depth)/2+pad;
export const cityRoadClear = (lot,padding=3) =>
    CITY_HORIZONTAL_ROADS.every(z=>Math.abs(lot.z-z)>lot.depth/2+ ([-443,-223,-110,110,223,443].includes(z)?4:11)+padding)
    && CITY_VERTICAL_ROADS.every(x=>Math.abs(lot.x-x)>lot.width/2+([-410,410].includes(x)?4:6)+padding);
export const cityDistrictAt=(x,z)=>CITY_DISTRICTS.reduce((best,d)=>Math.hypot(x-d.x,z-d.z)<Math.hypot(x-best.x,z-best.z)?d:best,CITY_DISTRICTS[0]);
export const cityReserved = lot => {
    // Preserve existing center-column shops, bus stops, NPCs and parking access.
    if([333,0,-333].some(z=>overlaps(lot,{x:0,z:z+36,width:165,depth:108},4)))return true;
    if(overlaps(lot,{x:-344,z:-385,width:108,depth:76},3))return true;
    if(overlaps(lot,{x:-461,z:-385,width:40,depth:65},3))return true;
    if(overlaps(lot,{x:333,z:-290,width:64,depth:48},4))return true;
    return CITY_SPECIAL_SITES.some(site=>overlaps(lot,site,5));
};
export const createCityPlan = () => {
    const lots=[];
    for(const road of CITY_HORIZONTAL_ROADS)for(const facing of [-1,1])for(let x=-478;x<=478;x+=28) {
        const z=road-facing*([-443,-223,-110,110,223,443].includes(road)?25:29);
        const district=cityDistrictAt(x,z);
        const id=lots.length;
        const lot={id:'lot-'+id,x,z,width:19,depth:17,height:10+(id%4)*2.5,facing,
            district:district.key,style:district.kind,retail:!['porches','park'].includes(district.kind)||id%5===0};
        if(Math.abs(z)+lot.depth/2>497||!cityRoadClear(lot)||cityReserved(lot)||lots.some(other=>overlaps(lot,other,3)))continue;
        lot.name=lot.retail?district.shops[id%district.shops.length]:'Triple Decker '+(id+1);
        lot.enterable=lot.retail?id%3===0:id%11===0;
        lots.push(lot);
    }
    for(const site of CITY_SPECIAL_SITES)lots.push({...site,district:cityDistrictAt(site.x,site.z).key,retail:true,enterable:true});
    return {districts:CITY_DISTRICTS,roads:CITY_LOCAL_ROADS,lots};
};

// Fog is measured along view depth; widescreen corners are farther away in world space.
export const cityVisibilityDistances = (aspect=16/9, fov=75) => {
    const load=Math.max(CITY_ATMOSPHERE.loadDistance,CITY_ATMOSPHERE.far*Math.hypot(1,Math.tan(fov*Math.PI/360)*aspect)+24);
    return {load,keep:Math.max(CITY_ATMOSPHERE.keepDistance,load+33)};
};

export const storeSignStyle=name=>{
    const key=name.toLowerCase();
    if(/record|tapes|sound|music|feedback|practice|karaoke|loading dock/.test(key))return 'orbit';
    if(/pho|kitchen|dumpling|noodle|banh|pizza|diner|sushi|steam/.test(key))return 'steam';
    if(/cafe|coffee|tea|bakery/.test(key))return 'cup';
    if(/book|laundry|laundromat/.test(key))return 'fan';
    if(/arcade|pixel|after hours/.test(key))return 'pixel';
    if(/vintage|thread|clothing/.test(key))return 'hanger';
    if(/repair|works|hardware|bike|auto|workshop/.test(key))return 'spark';
    if(/tattoo|smoke|dive/.test(key))return 'bolt';
    return 'constellation';
};
