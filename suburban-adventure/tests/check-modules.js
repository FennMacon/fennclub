import { readdir, readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
async function scan(dir) {
    const files = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const path = join(dir, entry.name);
        if (entry.isDirectory()) files.push(...await scan(path));
        else if (path.endsWith('.js')) files.push(path);
    }
    return files;
}
const files = await scan('.');
for (const path of files) {
    const source = await readFile(path, 'utf8');
    const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr);
    for (const match of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)) {
        await access(resolve(dirname(path), match[1]));
    }
}
console.log(`Checked ${files.length} modules: syntax and local import paths pass.`);
