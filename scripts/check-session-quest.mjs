import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getJourneyState } from '../src/game/journeyEngine.js';
import {
  advanceSessionQuest,
  createSessionQuest,
  getSessionQuestLabel,
  getSessionQuestPercent,
} from '../src/game/sessionQuestEngine.js';

const journey = getJourneyState([]);
const quest = createSessionQuest(journey);
assert.equal(quest.enabled, true);
assert.equal(quest.id, 'letters-expedition');
assert.equal(quest.goal, 3);
assert.equal(quest.progress, 0);
assert.equal(quest.stars, 0);
assert.equal(getSessionQuestPercent(quest), 0);

const failed = advanceSessionQuest(quest, { isCorrect: false, starsEarned: 0, encounterId: 'a1' });
assert.equal(failed, quest, 'failed encounters must not advance the quest');

const first = advanceSessionQuest(quest, { isCorrect: true, starsEarned: 1, encounterId: 'a1' });
assert.equal(first.progress, 1);
assert.equal(first.stars, 1);
assert.equal(first.completed, false);
assert.equal(getSessionQuestPercent(first), 33);

const duplicate = advanceSessionQuest(first, { isCorrect: true, starsEarned: 2, encounterId: 'a1' });
assert.equal(duplicate, first, 'the same encounter must never count twice');

const second = advanceSessionQuest(first, { isCorrect: true, starsEarned: 2, encounterId: 'a2' });
const complete = advanceSessionQuest(second, { isCorrect: true, starsEarned: 1, encounterId: 'a3' });
assert.equal(complete.progress, 3);
assert.equal(complete.stars, 4);
assert.equal(complete.completed, true);
assert.equal(getSessionQuestPercent(complete), 100);
assert.equal(getSessionQuestLabel(complete), 'Expedição das Letras concluída');

const disabled = createSessionQuest(journey, { enabled: false });
assert.equal(disabled.enabled, false);
assert.equal(disabled.goal, 0);

const playGame = await readFile(new URL('../src/pages/PlayGame.jsx', import.meta.url), 'utf8');
assert.ok(playGame.includes('createSessionQuest(journey, { enabled: isGuidedMission })'));
assert.ok(playGame.includes('encounterSequenceRef'));
assert.ok(playGame.includes('activeEncounterRef'));
assert.ok(playGame.includes('advanceSessionQuest'));
assert.ok(playGame.includes('<SessionQuestBar quest={sessionQuest} />'));
assert.ok(playGame.includes('<SessionQuestComplete'));
assert.ok(playGame.includes("saveMutation.mutate({ letter: currentLetter, gradeValue: grade, encounterId })"));
assert.ok(playGame.includes("if (!isPracticeMode) saveMutation.mutate({ letter: currentLetter, gradeValue: 2, encounterId })"));

console.log('Lexia Session Quest M07-E contract: PASS (3 checkpoints, unique encounters, existing stars only, practice excluded)');
