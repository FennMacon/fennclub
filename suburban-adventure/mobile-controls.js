// Each control owns its pointer, allowing simultaneous movement, look and sprint.
import { getPhoneOpenState } from './phone-ui.js';
import { hasActiveConversation } from './dialogue.js';
const movement = { x: 0, y: 0 };
const look = { x: 0, y: 0 };
let sprintHeld = false;
let mobileActionButton;
let actionType = '';
const resets = [];
const blocked = () => document.getElementById('startup') || getPhoneOpenState() || hasActiveConversation();
export const getMobileMovement = () => movement;
export const getMobileLook = () => look;
export const getMobileSprint = () => sprintHeld;
export const getMobileActionButton = () => mobileActionButton;
export const resetMobileControls = () => resets.forEach(reset => reset());
export const updateMobileActionButton = (type, text) => {
    if (!mobileActionButton || actionType === type) return;
    actionType = type;
    mobileActionButton.textContent = text;
    mobileActionButton.disabled = type === 'run';
    mobileActionButton.dataset.action = type;
};
export const initializeMobileControls = ({ onAction } = {}) => {
    const root = document.createElement('div');
    root.id = 'mobile-controls';
    document.body.append(root);
    const stick = (label, side, state) => {
        const base = document.createElement('div');
        base.className = `joystick ${side}`;
        base.setAttribute('aria-label', label);
        const knob = document.createElement('div');
        knob.className = 'joystick-knob';
        base.append(knob);
        root.append(base);
        let pointer = null;
        const reset = () => {
            state.x = state.y = 0;
            knob.style.transform = 'translate(-50%, -50%)';
            if (pointer !== null && base.hasPointerCapture(pointer)) base.releasePointerCapture(pointer);
            pointer = null;
        };
        resets.push(reset);
        const update = event => {
            const rect = base.getBoundingClientRect();
            let x = (event.clientX - rect.left - rect.width / 2) / 40;
            let y = (event.clientY - rect.top - rect.height / 2) / 40;
            const length = Math.max(1, Math.hypot(x, y));
            x /= length; y /= length;
            state.x = Math.abs(x) < 0.08 ? 0 : x;
            state.y = Math.abs(y) < 0.08 ? 0 : y;
            knob.style.transform = `translate(calc(-50% + ${x * 40}px), calc(-50% + ${y * 40}px))`;
        };
        base.addEventListener('pointerdown', event => {
            if (blocked() || pointer !== null) return;
            event.preventDefault();
            pointer = event.pointerId;
            base.setPointerCapture(pointer);
            update(event);
        });
        base.addEventListener('pointermove', event => {
            if (event.pointerId === pointer) { if (blocked()) reset(); else update(event); }
        });
        for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
            base.addEventListener(type, event => { if (event.pointerId === pointer) reset(); });
        }
    };
    stick('Move', 'movement', movement);
    stick('Look', 'look', look);
    const sprint = document.createElement('button');
    sprint.className = 'sprint-button';
    sprint.textContent = 'HOLD TO RUN';
    root.append(sprint);
    let sprintPointer = null;
    const resetSprint = () => { sprintHeld = false; sprintPointer = null; sprint.setAttribute('aria-pressed', 'false'); };
    resets.push(resetSprint);
    sprint.addEventListener('pointerdown', event => {
        if (blocked() || sprintPointer !== null) return;
        event.preventDefault();
        sprintPointer = event.pointerId;
        sprintHeld = true;
        sprint.setPointerCapture(event.pointerId);
        sprint.setAttribute('aria-pressed', 'true');
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        sprint.addEventListener(type, event => { if (event.pointerId === sprintPointer) resetSprint(); });
    }
    mobileActionButton = document.createElement('button');
    mobileActionButton.className = 'action-button';
    root.append(mobileActionButton);
    mobileActionButton.addEventListener('click', () => {
        if (!getPhoneOpenState() && !mobileActionButton.disabled) onAction?.();
        mobileActionButton.blur();
    });
    updateMobileActionButton('run', 'EXPLORE');
    window.addEventListener('blur', resetMobileControls);
    window.addEventListener('resize', resetMobileControls);
    document.addEventListener('visibilitychange', resetMobileControls);
    document.addEventListener('game-modal-change', () => {
        resetMobileControls();
        root.hidden = getPhoneOpenState();
    });
};
