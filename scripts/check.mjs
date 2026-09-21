#!/usr/bin/env node

import { readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(join(root, 'projects/catalog.json'), 'utf8'));
const ids = new Set();
const slugs = new Set();

for (const item of catalog) {
  for (const key of ['id', 'slug', 'title', 'date', 'invitation', 'path', 'stack', 'status']) {
    if (!(key in item)) throw new Error(`catalog entry is missing ${key}`);
  }
  if (ids.has(item.id)) throw new Error(`duplicate project id: ${item.id}`);
  if (slugs.has(item.slug)) throw new Error(`duplicate project slug: ${item.slug}`);
  ids.add(item.id);
  slugs.add(item.slug);
  if (item.status !== 'complete') throw new Error(`project ${item.id} is not complete`);

  const project = join(root, item.path);
  const expectedName = `${String(item.id).padStart(3, '0')}-${item.slug}`;
  if (project.split('/').at(-1) !== expectedName) {
    throw new Error(`project ${item.id} should use directory ${expectedName}`);
  }
  for (const file of ['README.md', 'index.html', 'test_constellation.js']) {
    if (!statSync(join(project, file)).isFile()) throw new Error(`${item.path} is missing ${file}`);
  }

  console.log(`Testing ${item.path}`);
  const result = spawnSync(process.execPath, ['--test', join(project, 'test_constellation.js')], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`Catalog: ${catalog.length} complete experiment(s)`);
