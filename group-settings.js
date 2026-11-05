import fs from 'node:fs/promises';
import path from 'node:path';

const filePath = path.resolve(process.env.GROUP_SETTINGS_FILE || './data/group-settings.json');
let cache;

async function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    cache = {};
  }
  return cache;
}

async function save(data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporary = filePath + '.tmp';
  await fs.writeFile(temporary, JSON.stringify(data, null, 2), { mode: 0o600 });
  await fs.rename(temporary, filePath);
  cache = data;
}

export async function getGroupSettings(groupJid) {
  const data = await load();
  return { antilink: false, welcome: false, goodbye: false, ...(data[groupJid] || {}) };
}

export async function setGroupSetting(groupJid, key, value) {
  if (!['antilink', 'welcome', 'goodbye'].includes(key)) {
    throw new Error('Unsupported group setting: ' + key);
  }
  const data = await load();
  data[groupJid] = { ...(data[groupJid] || {}), [key]: Boolean(value) };
  await save(data);
  return data[groupJid];
}
