/** Storage is passed in, so Node tests and browsers use the same save handling. */
export const SAVE_KEY = 'fenn.also.save.v1';
const MAX_SAVE_LENGTH = 100000;
export function importSave(engine,text) {
  if (typeof text !== 'string' || text.length > MAX_SAVE_LENGTH) throw new Error('Invalid save file.');
  let state;
  try { state=JSON.parse(text); } catch { throw new Error('Save file is not valid JSON.'); }
  return engine.assertState(state);
}
export function exportSave(engine,state) {
  return JSON.stringify(engine.assertState(state),null,2);
}
export function createSaveStore(engine,storage) {
  return Object.freeze({
    load() {
      try {
        const text=storage.getItem(SAVE_KEY);
        return {state:text === null ? null : importSave(engine,text),error:null};
      } catch (error) { return {state:null,error:`Could not load your save: ${error.message}`}; }
    },
    save(state) {
      const text=exportSave(engine,state);
      try { storage.setItem(SAVE_KEY,text); return {error:null}; }
      catch { return {error:'Could not save progress in this browser. Export your save to keep it.'}; }
    },
    // Validate before writing: failed imports leave the existing save untouched.
    import(text) {
      const state=importSave(engine,text), result=this.save(state);
      return {state,...result};
    },
    reset(seed) {
      const state=engine.newGame(seed),result=this.save(state);
      return {state,...result};
    }
  });
}
