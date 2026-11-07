import { getAdventureState, setAdventureSettings, markAreaVisited, rememberDiscovery, visitBusiness } from '../adventure-state.js';

// Runs inside the real game fixture; no browser automation or duplicate game setup.
export async function runPhoneAdventureChecks({ game, THREE, check, assert, frame, phone, controls }) {
    const settings = getAdventureState().settings;
    const ensurePhone = () => {
        if (!phone.getPhoneOpenState()) phone.togglePhone();
        assert(document.getElementById('phone-ui').getAttribute('aria-hidden') === 'false', 'Phone did not open');
    };
    const tab = name => document.querySelector(`#phone-tab-${name}`);
    try {
        await check('phone discovery map remembers districts and announces the current area', () => {
            markAreaVisited('suburban', 'PLAZA', 'Massachusetts Plaza');
            markAreaVisited('city', 'CITY_NE', 'Rehearsal District');
            phone.updatePhoneDebugInfo({ map: 'suburban', district: 'PLAZA', districtName: 'Massachusetts Plaza' });
            ensurePhone(); tab('map').click();
            const panel = document.getElementById('phone-panel-map');
            assert(!panel.hidden && tab('map').getAttribute('aria-selected') === 'true', 'Map tab did not open');
            assert(panel.querySelectorAll('.discovery-map li').length === 18, 'Expected two 3 by 3 maps');
            assert(panel.querySelector('[aria-current="location"]')?.getAttribute('aria-label').includes('Massachusetts Plaza'), 'Current area missing');
            assert(panel.querySelector('[aria-label="Rehearsal District"]') && panel.querySelector('[aria-label="Unexplored area"]'), 'Visited and undiscovered labels missing');
            tab('map').focus(); tab('map').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
            assert(document.activeElement === tab('music') && tab('music').getAttribute('aria-selected') === 'true', 'Arrow keys did not navigate tabs');
        });
        await check('phone journal saves escaped descriptions and business locations', () => {
            rememberDiscovery({ id: 'browser-journal-note', name: 'Folded <invitation>', text: 'Meet by the river after the show.', map: 'suburban', area: 'Woodland clearings' });
            visitBusiness('browser-journal-business', 'Wild Violet Flowers', { map: 'suburban', area: 'Massachusetts Plaza' });
            ensurePhone(); tab('journal').click();
            const panel = document.getElementById('phone-panel-journal');
            assert(panel.textContent.includes('Folded <invitation>') && !panel.querySelector('invitation'), 'Journal markup was not escaped');
            assert(panel.textContent.includes('Meet by the river after the show.') && panel.textContent.includes('Woodland clearings'), 'Description or location missing');
            assert(panel.textContent.includes('Wild Violet Flowers') && panel.textContent.includes('Tonight’s lead'), 'Business or story lead missing');
        });
        await check('phone comfort settings update scene brightness, readable text and controls help', () => {
            ensurePhone(); tab('settings').click();
            const panel = document.getElementById('phone-panel-settings');
            const brightness = panel.querySelector('[data-setting="brightness"]');
            brightness.value = '1.3'; brightness.dispatchEvent(new Event('input', { bubbles: true }));
            const textScale = panel.querySelector('[data-setting="textScale"]');
            textScale.value = '1.25'; textScale.dispatchEvent(new Event('input', { bubbles: true }));
            const sensitivity = panel.querySelector('[data-setting="sensitivity"]');
            sensitivity.value = '.75'; sensitivity.dispatchEvent(new Event('input', { bubbles: true }));
            assert(getAdventureState().settings.brightness === 1.3 && getAdventureState().settings.sensitivity === .75, 'Settings input did not save');
            assert(document.documentElement.style.getPropertyValue('--game-brightness') === '1.3', 'Brightness not applied');
            assert(document.documentElement.style.getPropertyValue('--game-text-scale') === '1.25', 'Text size not applied');
            const canvas = document.querySelector('body > canvas');
            assert(canvas && getComputedStyle(canvas).filter.includes('1.3'), 'Scene brightness filter missing');
            assert(panel.textContent.includes('WASD') && panel.textContent.includes('left stick') && panel.textContent.includes('Escape'), 'Controls reminder missing');
            const ambience = panel.querySelector('[data-setting="ambience"]');
            ambience.checked = false; ambience.dispatchEvent(new Event('input', { bubbles: true }));
            assert(getAdventureState().settings.ambience === false && panel.textContent.includes('Landmark sounds'), 'Ambience preference not saved');
            setAdventureSettings({ brightness: 99, textScale: 99, sensitivity: 99 });
            assert(getAdventureState().settings.brightness === 1.6 && getAdventureState().settings.textScale === 1.5 && getAdventureState().settings.sensitivity === 2, 'Settings bounds not enforced');
        });
        await check('discovered transit routes are modal, block movement and support cancellation', async () => {
            if (phone.getPhoneOpenState()) phone.togglePhone();
            assert(phone.openTransitChooser('suburban') === true, 'Transit chooser did not open');
            const modal = document.getElementById('transit-chooser');
            assert(modal?.getAttribute('aria-modal') === 'true' && phone.getPhoneOpenState(), 'Transit is not modal');
            assert(modal.querySelector('[data-travel-area="PLAZA"]'), 'Known destination missing');
            const { camera } = game.getRuntimeState(), before = camera.position.clone();
            controls.keyboard.w = true; controls.updateCameraPosition(camera, null, null, 1); controls.resetControls();
            assert(camera.position.distanceTo(new THREE.Vector3(before.x, before.y, before.z)) === 0, 'Movement leaked through transit modal');
            modal.querySelector('[data-transit-cancel]').click(); await frame();
            assert(!document.getElementById('transit-chooser') && !phone.getPhoneOpenState(), 'Transit cancel did not close modal');
        });
        await check('transit route selection emits a validated destination and safe return keeps progress', async () => {
            let destination;
            const hearTravel = event => { destination = event.detail; };
            document.addEventListener('game-travel', hearTravel);
            phone.openTransitChooser('suburban');
            document.querySelector('#transit-chooser [data-travel-area="PLAZA"]').click(); await frame();
            document.removeEventListener('game-travel', hearTravel);
            assert(destination?.map === 'suburban' && destination.key === 'PLAZA' && !phone.getPhoneOpenState(), 'Destination event invalid');
            let returned = false;
            const hearReturn = () => { returned = true; };
            document.addEventListener('game-return-safe', hearReturn);
            ensurePhone(); tab('settings').click();
            document.querySelector('#phone-panel-settings [data-safe-return]').click(); await frame();
            document.removeEventListener('game-return-safe', hearReturn);
            assert(returned && !phone.getPhoneOpenState(), 'Safe return did not close phone and emit');
            assert(getAdventureState().discoveries.some(entry => entry.id === 'browser-journal-note'), 'Safe return cleared discoveries');
        });
    } finally {
        document.querySelector('#transit-chooser [data-transit-cancel]')?.click();
        setAdventureSettings(settings);
        if (phone.getPhoneOpenState()) phone.togglePhone();
        controls.resetControls();
    }
}
