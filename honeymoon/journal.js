        const journeyData = [
            { date: "Wed 6/18", location: "Chicago", activity: "Fly to Chicago - Adventure begins!", type: "travel", palette: "day1-chicago-start" },
            { date: "Thu 6/19", location: "St. Ignace", activity: "Rent car, drive to Upper Peninsula (6.5hr)", type: "travel", palette: "day2-toward-mackinac" },
            { date: "Fri 6/20", location: "Mackinac Island", activity: "Island day trip & Victorian charm", type: "location", palette: "day3-mackinac-pure" },
            { date: "Sat 6/21", location: "Pictured Rocks", activity: "Kayaking adventure & sandstone cliffs", type: "location", palette: "day4-mackinac-to-pictured" },
            { date: "Sun 6/22", location: "Drive to SD", activity: "Epic 13-14hr drive, overnight in Kadoka", type: "travel", palette: "day5-pictured-to-prairie" },
            { date: "Mon 6/23", location: "Badlands", activity: "National Park exploration & camping", type: "location", palette: "day6-prairie-to-badlands" },
            { date: "Tue 6/24", location: "Badlands", activity: "More Badlands, drive to Devil's Tower", type: "location", palette: "day7-badlands-to-devils" },
            { date: "Wed 6/25", location: "Devil's Tower", activity: "Visit tower, drive to Glacier (12hr)", type: "location", palette: "day8-devils-to-glacier" },
            { date: "Thu 6/26", location: "Glacier National Park", activity: "Park exploration & camping", type: "location", palette: "day9-glacier-pure" },
            { date: "Fri 6/27", location: "Glacier National Park", activity: "More park adventures & camping", type: "location", palette: "day10-glacier-to-yellowstone" },
            { date: "Sat 6/28", location: "Yellowstone", activity: "Drive to Yellowstone & Old Faithful Inn", type: "location", palette: "day11-yellowstone-arrival" },
            { date: "Sun 6/29", location: "Yellowstone", activity: "Park exploration (staying at inn)", type: "location", palette: "day12-yellowstone-pure" },
            { date: "Mon 6/30", location: "Grand Teton", activity: "Morning Yellowstone, drive to Tetons", type: "location", palette: "day13-yellowstone-to-tetons" },
            { date: "Tue 7/1", location: "Grand Teton", activity: "River rafting & wildflower photos!", type: "location", palette: "day14-tetons-pure" },
            { date: "Wed 7/2", location: "Drive to Moab", activity: "Drive to Moab via Dinosaur Monument", type: "travel", palette: "day15-tetons-to-arches" },
            { date: "Thu 7/3", location: "Arches", activity: "Arches National Park & camping", type: "location", palette: "day16-arches-arrival" },
            { date: "Fri 7/4", location: "Arches", activity: "Arches National Park & camping", type: "location", palette: "day17-arches-pure" },
            { date: "Sat 7/5", location: "Salt Flats", activity: "Salt Flats exploration & drive to SLC", type: "location", palette: "day18-arches-to-salt" },
            { date: "Sun 7/6", location: "Salt Lake City", activity: "SLC exploration & prep for home", type: "location", palette: "day19-salt-flats-pure" },
            { date: "Mon 7/7", location: "Home", activity: "Fly home - Journey complete!", type: "travel", palette: "day20-journey-reflection" }
        ];

        // Flowing color journey across all 20 days
        const paletteStyles = {
            'day1-chicago-start': {
                headerGradient: 'linear-gradient(135deg, #2F4F4F, #708090)',
                borderColors: ['#2c2c2c', '#4682b4', '#778899'],
                descBorders: ['#2F4F4F', '#708090', '#2F4F4F'],
                actionColors: ['#2F4F4F', '#708090', '#778899', '#4682b4'],
                textColor: 'white'
            },
            'day2-toward-mackinac': {
                headerGradient: 'linear-gradient(135deg, #708090, #87ceeb)',
                borderColors: ['#2c2c2c', '#b0e0e6', '#e6f3ff'],
                descBorders: ['#708090', '#87ceeb', '#708090'],
                actionColors: ['#708090', '#87ceeb', '#e6f3ff', '#b0e0e6'],
                textColor: '#333'
            },
            'day3-mackinac-pure': {
                headerGradient: 'linear-gradient(135deg, #87ceeb, #f8bbd9)',
                borderColors: ['#2c2c2c', '#7dd3c0', '#fefefe'],
                descBorders: ['#87ceeb', '#f8bbd9', '#87ceeb'],
                actionColors: ['#87ceeb', '#f8bbd9', '#fefefe', '#7dd3c0'],
                textColor: '#333'
            },
            'day4-mackinac-to-pictured': {
                headerGradient: 'linear-gradient(135deg, #f8bbd9, #f4a460)',
                borderColors: ['#2c2c2c', '#7dd3c0', '#cd5c5c'],
                descBorders: ['#f8bbd9', '#f4a460', '#f8bbd9'],
                actionColors: ['#f8bbd9', '#f4a460', '#cd5c5c', '#7dd3c0'],
                textColor: '#333'
            },
            'day5-pictured-to-prairie': {
                headerGradient: 'linear-gradient(135deg, #f4a460, #9acd32)',
                borderColors: ['#2c2c2c', '#48a999', '#daa520'],
                descBorders: ['#f4a460', '#9acd32', '#f4a460'],
                actionColors: ['#f4a460', '#9acd32', '#daa520', '#48a999'],
                textColor: '#333'
            },
            'day6-prairie-to-badlands': {
                headerGradient: 'linear-gradient(135deg, #9acd32, #daa520)',
                borderColors: ['#2c2c2c', '#8b4513', '#87ceeb'],
                descBorders: ['#9acd32', '#daa520', '#9acd32'],
                actionColors: ['#9acd32', '#daa520', '#87ceeb', '#8b4513'],
                textColor: '#333'
            },
            'day7-badlands-to-devils': {
                headerGradient: 'linear-gradient(135deg, #daa520, #b22222)',
                borderColors: ['#2c2c2c', '#663399', '#ff8c00'],
                descBorders: ['#daa520', '#b22222', '#daa520'],
                actionColors: ['#daa520', '#b22222', '#ff8c00', '#663399'],
                textColor: 'white'
            },
            'day8-devils-to-glacier': {
                headerGradient: 'linear-gradient(135deg, #663399, #4682b4)',
                borderColors: ['#2c2c2c', '#228b22', '#708090'],
                descBorders: ['#663399', '#4682b4', '#663399'],
                actionColors: ['#663399', '#4682b4', '#708090', '#228b22'],
                textColor: 'white'
            },
            'day9-glacier-pure': {
                headerGradient: 'linear-gradient(135deg, #4682b4, #228b22)',
                borderColors: ['#2c2c2c', '#ff6347', '#708090'],
                descBorders: ['#4682b4', '#228b22', '#4682b4'],
                actionColors: ['#4682b4', '#228b22', '#708090', '#ff6347'],
                textColor: 'white'
            },
            'day10-glacier-to-yellowstone': {
                headerGradient: 'linear-gradient(135deg, #228b22, #008B8B)',
                borderColors: ['#2c2c2c', '#B8860B', '#DC143C'],
                descBorders: ['#228b22', '#008B8B', '#228b22'],
                actionColors: ['#228b22', '#008B8B', '#DC143C', '#B8860B'],
                textColor: 'white'
            },
            'day11-yellowstone-arrival': {
                headerGradient: 'linear-gradient(135deg, #008B8B, #B8860B)',
                borderColors: ['#2c2c2c', '#DC143C', '#1E90FF'],
                descBorders: ['#008B8B', '#B8860B', '#008B8B'],
                actionColors: ['#008B8B', '#B8860B', '#1E90FF', '#DC143C'],
                textColor: 'white'
            },
            'day12-yellowstone-pure': {
                headerGradient: 'linear-gradient(135deg, #1E90FF, #DC143C)',
                borderColors: ['#2c2c2c', '#B8860B', '#008B8B'],
                descBorders: ['#1E90FF', '#DC143C', '#1E90FF'],
                actionColors: ['#1E90FF', '#DC143C', '#008B8B', '#B8860B'],
                textColor: 'white'
            },
            'day13-yellowstone-to-tetons': {
                headerGradient: 'linear-gradient(135deg, #DC143C, var(--faded-lupine))',
                borderColors: ['#2c2c2c', 'var(--vintage-poppy)', 'var(--sepia-parchment)'],
                descBorders: ['#DC143C', 'var(--faded-lupine)', '#DC143C'],
                actionColors: ['#DC143C', 'var(--faded-lupine)', 'var(--sepia-parchment)', 'var(--vintage-poppy)'],
                textColor: 'white'
            },
            'day14-tetons-pure': {
                headerGradient: 'linear-gradient(135deg, var(--faded-lupine), var(--vintage-poppy))',
                borderColors: ['#2c2c2c', 'var(--sepia-parchment)', 'var(--sun-bleached-yellow)'],
                descBorders: ['var(--faded-lupine)', 'var(--vintage-poppy)', 'var(--faded-lupine)'],
                actionColors: ['var(--faded-lupine)', 'var(--vintage-poppy)', 'var(--sun-bleached-yellow)', 'var(--sepia-parchment)'],
                textColor: '#333'
            },
            'day15-tetons-to-arches': {
                headerGradient: 'linear-gradient(135deg, var(--vintage-poppy), #cd5c5c)',
                borderColors: ['#2c2c2c', '#ff8c00', 'var(--sun-bleached-yellow)'],
                descBorders: ['var(--vintage-poppy)', '#cd5c5c', 'var(--vintage-poppy)'],
                actionColors: ['var(--vintage-poppy)', '#cd5c5c', 'var(--sun-bleached-yellow)', '#ff8c00'],
                textColor: '#333'
            },
            'day16-arches-arrival': {
                headerGradient: 'linear-gradient(135deg, #cd5c5c, #ff8c00)',
                borderColors: ['#2c2c2c', '#8b008b', '#9acd32'],
                descBorders: ['#cd5c5c', '#ff8c00', '#cd5c5c'],
                actionColors: ['#cd5c5c', '#ff8c00', '#9acd32', '#8b008b'],
                textColor: '#333'
            },
            'day17-arches-pure': {
                headerGradient: 'linear-gradient(135deg, #ff8c00, #8b008b)',
                borderColors: ['#2c2c2c', '#9acd32', '#cd5c5c'],
                descBorders: ['#ff8c00', '#8b008b', '#ff8c00'],
                actionColors: ['#ff8c00', '#8b008b', '#cd5c5c', '#9acd32'],
                textColor: 'white'
            },
            'day18-arches-to-salt': {
                headerGradient: 'linear-gradient(135deg, #8b008b, #c0c0c0)',
                borderColors: ['#2c2c2c', '#ffffff', '#ffb6c1'],
                descBorders: ['#8b008b', '#c0c0c0', '#8b008b'],
                actionColors: ['#8b008b', '#c0c0c0', '#ffb6c1', '#ffffff'],
                textColor: 'white'
            },
            'day19-salt-flats-pure': {
                headerGradient: 'linear-gradient(135deg, #ffffff, #87ceeb)',
                borderColors: ['white', '#ffb6c1', '#c0c0c0'],
                descBorders: ['#ffffff', '#87ceeb', '#ffffff'],
                actionColors: ['#ffffff', '#87ceeb', '#c0c0c0', '#ffb6c1'],
                textColor: '#2c2c2c'
            },
            'day20-journey-reflection': {
                headerGradient: 'linear-gradient(135deg, #87ceeb, #ffd700)',
                borderColors: ['#2c2c2c', '#f8bbd9', 'var(--vintage-poppy)'],
                descBorders: ['#87ceeb', '#ffd700', '#87ceeb'],
                actionColors: ['#87ceeb', '#ffd700', 'var(--vintage-poppy)', '#f8bbd9'],
                textColor: '#333'
            }
        };


function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
}

async function renderJournal() {
    const journal = document.getElementById('journal');
    try {
        const response = await fetch('honeymoon-content.json');
        if (!response.ok) throw new Error('Content could not be loaded');
        const content = await response.json();
        const entries = document.createDocumentFragment();
        const navigation = document.createDocumentFragment();
        journeyData.forEach((day, index) => {
            const saved = content.days.find(item => item.day === index + 1);
            if (!saved) throw new Error('Missing journal day');
            const palette = paletteStyles[day.palette];
            const link = element('a', String(index + 1).padStart(2, '0'));
            link.append(element('span', day.date, 'nav-date'), element('span', day.location, 'nav-location'));
            link.href = '#day-' + (index + 1);
            link.setAttribute('aria-label', `${day.date} · ${day.location}`);
            link.title = `${day.date} · ${day.location}`;
            link.style.setProperty('--day-color', palette.actionColors[0]);
            navigation.append(link);

            const entry = element('section', undefined, 'entry');
            entry.id = 'day-' + (index + 1);
            entry.style.setProperty('--day-gradient', palette.headerGradient);
            const meta = element('div', undefined, 'entry-meta');
            meta.append(element('span', String(index + 1).padStart(2, '0'), 'day-number'), element('p', day.date));
            const swatches = element('div', undefined, 'palette');
            swatches.setAttribute('aria-hidden', 'true');
            meta.append(swatches);
            const body = element('div', undefined, 'entry-content');
            const heading = element('h2', day.location);
            heading.id = entry.id + '-heading';
            entry.setAttribute('aria-labelledby', heading.id);
            body.append(heading, element('div', saved.journal.content, 'journal-copy'));
            body.append(element('p', '💿 ' + saved.album.title, 'album'));

            entry.append(meta, body);
            entries.append(entry);
        });
        journal.replaceChildren(entries);
        document.getElementById('journeyPath').replaceChildren(navigation);
        initializeScrollPalette();
        if (/^#day-\d+$/.test(location.hash)) document.getElementById(location.hash.slice(1))?.scrollIntoView();
    } catch (error) {
        const message = element('p', error.message, 'error');
        message.setAttribute('role', 'alert');
        const retry = element('button', '↻');
        retry.setAttribute('aria-label', 'Retry');
        retry.addEventListener('click', renderJournal);
        journal.replaceChildren(message, retry);
    } finally {
        journal.setAttribute('aria-busy', 'false');
    }
}

function initializeScrollPalette() {
    const entries = [...document.querySelectorAll('.entry')];
    const links = [...document.querySelectorAll('#journeyPath a')];
    const tokens = getComputedStyle(document.documentElement);
    const colors = journeyData.map(day => {
        const gradient = paletteStyles[day.palette].headerGradient.replace(
            /var\((--[\w-]+)\)/g, (_, token) => tokens.getPropertyValue(token).trim());
        return gradient.match(/#[\da-f]{6}/gi)
            .map(hex => [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16)));
    });
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let positions = [], pending = false, active = -1;
    function update() {
        pending = false;
        const readingPosition = scrollY + innerHeight * .3;
        let index = 0;
        while (index < positions.length - 1 && positions[index + 1] <= readingPosition) index++;
        const next = Math.min(index + 1, positions.length - 1);
        const fraction = reducedMotion.matches ? 0 : Math.max(0, Math.min(1,
            (readingPosition - positions[index]) / (positions[next] - positions[index] || 1)));
        for (let endpoint = 0; endpoint < 2; endpoint++) {
            const tint = colors[index][endpoint].map((channel, component) => {
                const blended = channel + (colors[next][endpoint][component] - channel) * fraction;
                // A pale paper blend bounds contrast regardless of the source palette.
                return Math.round(250 * .88 + blended * .12);
            });
            document.documentElement.style.setProperty('--trip-color-' + endpoint, `rgb(${tint.join(',')})`);
        }
        if (active !== index) {
            links.forEach((link, i) => {
                if (i === index) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
            });
            active = index;
        }
    }
    function measure() {
        positions = entries.map(entry => entry.getBoundingClientRect().top + scrollY);
        update();
    }
    addEventListener('scroll', () => {
        if (!pending) { pending = true; requestAnimationFrame(update); }
    }, { passive: true });
    addEventListener('resize', measure);
    new ResizeObserver(measure).observe(document.querySelector('.masthead'));
    reducedMotion.addEventListener('change', update);
    document.fonts.ready.then(measure);
    measure();
}
const journeyToggle = document.getElementById('journeyToggle');
journeyToggle.addEventListener('click', () => {
    const expanded = journeyToggle.getAttribute('aria-expanded') !== 'true';
    journeyToggle.setAttribute('aria-expanded', String(expanded));
    journeyToggle.textContent = expanded ? 'Collapse journey −' : 'Expand journey +';
    document.getElementById('journeyPath').classList.toggle('compact', !expanded);
});
renderJournal();
