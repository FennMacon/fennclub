// Authored brand fragments keep repeated business types distinct without numbered branches.
const brands = [
    'Paper Moon', 'Copper Finch', 'Soft Static', 'Bent Arrow', 'Mothlight',
    'Velvet Anchor', 'Blue Hour', 'Side Pocket', 'Lucky Penny', 'Little Comet',
    'Tin Sparrow', 'Slow Parade', 'Golden Moth', 'Loose Thread', 'Silver Lining',
    'Backbeat', 'Green Lantern', 'Red Kite', 'Low Tide', 'Painted Fox',
    'Half Moon', 'Night Owl', 'Brass Button', 'Sugar Ghost', 'Small Wonder',
    'Second Wind', 'Broken Clock', 'Morning Bell', 'Amber Window', 'Quiet Riot',
    'Crooked Star', 'Pocket Change', 'Sunday Best', 'Electric Fern', 'Lucky Cricket',
    'Hollow Reed', 'Wild Honey', 'Wandering Wren', 'Lantern Fish', 'Open Secret'
];
const services = {
    'Corner Market':'Market', 'Basement Laundry':'Laundry', 'Rat City Repairs':'Repairs',
    'Comm Ave Pharmacy':'Pharmacy', 'Allston Books':'Books', 'Daybreak Cafe':'Cafe',
    'Static Records':'Records', 'Practice Rooms':'Rehearsal', 'Secondhand Sound':'Sound',
    'Night Window Vintage':'Vintage', 'Linden Laundry':'Laundry', 'Porchlight Market':'Market',
    'Basement Tapes':'Tapes', 'Harvard Hardware':'Hardware', 'Village Pizza':'Pizza',
    'Allston Exchange':'Exchange', 'Seoul Kitchen':'Kitchen', 'Midnight Dumplings':'Dumplings',
    'Banh Mi Corner':'Banh Mi', 'Steam Table':'Steam Kitchen', 'Late Night Noodles':'Noodles',
    'Garden Supply':'Garden Supply', 'Union Corner Store':'General Store',
    'Community Workshop':'Workshop', 'The Loading Dock':'Music Club',
    'After Hours Diner':'Diner', 'Allston Arcade':'Arcade', 'Station Bakery':'Bakery',
    'Bike Repair':'Bike Repair', 'Parcel Depot':'Parcel Depot', 'Back Street Auto':'Auto'
};

export const createStoreNamer = (reserved = []) => {
    const used = new Set(reserved.map(name=>name.toLowerCase()));
    const nextBrand = new Map();
    return base => {
        let name=base,index=nextBrand.get(base)||0;
        while(used.has(name.toLowerCase())) {
            if(index>=brands.length)throw new Error('Store name pool exhausted for '+base);
            name=brands[index++]+' '+(services[base]||base);
        }
        nextBrand.set(base,index);
        used.add(name.toLowerCase());
        return name;
    };
};
