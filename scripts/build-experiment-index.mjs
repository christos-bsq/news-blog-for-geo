import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const postsDir = path.join(rootDir, 'src', 'content', 'posts');
const publicDir = path.join(rootDir, 'public');
const edgeDir = path.join(rootDir, 'netlify', 'edge-functions');

const files = await fg('*.md', { cwd: postsDir });
const mapping = {};

for (const relative of files) {
  const absolute = path.join(postsDir, relative);
  const raw = await readFile(absolute, 'utf8');
  const { data } = matter(raw);
  const fallback = relative.replace(/\.md$/, '');
  const slug = toSlug(typeof data.slug === 'string' && data.slug.trim() ? data.slug : fallback);
  mapping[slug] = {
    slug,
    title: data.title ?? slug,
    experiment_type: data.experiment_type ?? 'baseline',
    render_mode: data.render_mode ?? 'ssr',
    server_delay_ms: Number(data.server_delay_ms ?? 0),
    indexable: data.indexable !== false
  };
}

const serialized = JSON.stringify(mapping, null, 2);
await mkdir(publicDir, { recursive: true });
await writeFile(path.join(publicDir, 'experiment-index.json'), serialized);
await mkdir(edgeDir, { recursive: true });
await writeFile(path.join(edgeDir, 'experiment-index.json'), serialized);

console.log(`Generated experiment index for ${Object.keys(mapping).length} posts.`);

function toSlug(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
