let active = null;
const changed = () => { if (typeof document !== 'undefined') document.dispatchEvent(new Event('game-modal-change')); };
export const getStoryModalOpen = () => active !== null;

export function closeStoryModal() {
    if (!active) return;
    const previous = active; active = null;
    previous.cleanup?.();
    previous.dialog.close(); previous.dialog.remove();
    previous.focus?.focus?.();
    changed();
}

// Native dialogs provide focus trapping and make the world controls inert on touch.
export function openStoryModal(title, render) {
    if (typeof document === 'undefined') return null;
    closeStoryModal();
    const dialog = document.createElement('dialog');
    dialog.setAttribute('aria-label', title);
    dialog.style.cssText = 'width:min(560px,calc(100vw - 28px));max-height:calc(100dvh - 28px);box-sizing:border-box;overflow:auto;background:#101d20;color:#e7fff2;border:2px solid #90e6c5;border-radius:12px;padding:22px;font:calc(16px * var(--game-text-scale,1))/1.5 monospace;box-shadow:0 12px 80px #000c;';
    const heading = document.createElement('h2'); heading.textContent = title; heading.style.cssText = 'font-size:22px;margin:0 0 16px;color:#ffdc9d;';
    const body = document.createElement('div');
    const close = storyButton('Back to the neighborhood', closeStoryModal);
    close.style.marginTop = '20px';
    dialog.append(heading, body, close); document.body.append(dialog);
    const focus = document.activeElement;
    active = { dialog, focus, cleanup: null };
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeStoryModal(); });
    // Space and movement keys belong to the activity while it is open.
    dialog.addEventListener('keydown', event => { event.stopPropagation(); });
    active.cleanup = render(body, close) || null;
    dialog.showModal(); changed();
    (body.querySelector('button,input') || close).focus();
    return dialog;
}

export function storyText(parent, text, style = '') {
    const p = document.createElement('p'); p.textContent = text; p.style.cssText = style; parent.append(p); return p;
}
export function storyButton(label, click) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
    button.style.cssText = 'font:inherit;min-height:48px;padding:10px 14px;border:1px solid #86d4bf;border-radius:7px;color:#e9fff6;background:#223b3e;cursor:pointer;touch-action:manipulation;';
    button.addEventListener('click', click); return button;
}
