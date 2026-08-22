import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const profile = await readFile(new URL('../src/components/profile/ProfileContent.jsx', import.meta.url), 'utf8');
const actions = await readFile(new URL('../src/components/profile/ProfileAccountActions.jsx', import.meta.url), 'utf8');
const button = await readFile(new URL('../src/components/profile/DeleteAccountButton.jsx', import.meta.url), 'utf8');

for (const required of [
  "import ProfileAccountActions from '@/components/profile/ProfileAccountActions'",
  '<ProfileAccountActions />',
]) {
  assert.ok(profile.includes(required), `ProfileContent must delegate account actions through ${required}`);
}

for (const forbidden of [
  "import DeleteAccountButton from '@/components/profile/DeleteAccountButton'",
  '<DeleteAccountButton />',
  'AlertDialog',
  'handleDelete',
]) {
  assert.ok(!profile.includes(forbidden), `ProfileContent must not own account action presentation or behavior ${forbidden}`);
}

for (const required of [
  "import DeleteAccountButton from '@/components/profile/DeleteAccountButton'",
  'export default function ProfileAccountActions()',
  '<div className="pt-2">',
  '<DeleteAccountButton />',
]) {
  assert.ok(actions.includes(required), `ProfileAccountActions must preserve ${required}`);
}

for (const required of [
  'async function handleDelete()',
  'await lexiaPlatform.progress.clearAll()',
  "localStorage.removeItem('lexia_profile')",
  "await lexiaPlatform.auth.logout('/')",
]) {
  assert.ok(button.includes(required), `DeleteAccountButton must retain ${required}`);
}

console.log('Lexia M38-AM Profile Account Actions Surface: PASS (account action composition extracted; deletion behavior remains button-owned)');
