import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { indexedDB, IDBKeyRange } from "fake-indexeddb";

globalThis.indexedDB = indexedDB;
globalThis.IDBKeyRange = IDBKeyRange;

const repository = await import("../app/lib/indexed-db.ts");

beforeEach(async () => {
  repository.closeLucidDb();
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase("lucid-dream");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
});

test("writes, reads, and overwrites a durable preference record", async () => {
  await repository.putRecord("preferences", { id: "plan-mode", value: 45 });
  assert.deepEqual(await repository.getRecord("preferences", "plan-mode"), {
    id: "plan-mode",
    value: 45,
  });

  await repository.putRecord("preferences", { id: "plan-mode", value: 90 });
  assert.equal(
    (await repository.getRecord("preferences", "plan-mode")).value,
    90,
  );
});

test("creates every durable object store in one versioned database", async () => {
  const database = await repository.openLucidDb();
  assert.deepEqual(Array.from(database.objectStoreNames), [
    "activity-progress",
    "examSessions",
    "generated-plans",
    "library",
    "personal-media",
    "portfolio",
    "preferences",
    "speaking-practice",
    "today",
    "vocabulary",
    "writing-practice",
  ]);
});

test("persists imported personal media without downloading its content", async () => {
  const record = {
    id: "spotify:playlist:37i9dQZF1DXcBWIGoYBM5M",
    provider: "spotify",
    kind: "playlist",
    resourceId: "37i9dQZF1DXcBWIGoYBM5M",
    sourceUrl: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M",
    title: "Focus playlist",
    createdAt: 10,
  };
  await repository.putRecord("personal-media", record);
  assert.deepEqual(await repository.getRecord("personal-media", record.id), record);
});

test("persists a selected word with its short source context", async () => {
  const record = { id: "word-1", selection: "visual rhythm", sourceActivityId: "movie-1", context: "The film builds a visual rhythm.", createdAt: 10 };
  await repository.putRecord("vocabulary", record);
  assert.equal((await repository.getRecord("vocabulary", "word-1")).selection, "visual rhythm");
});

test("persists the four-part language dossier and completion evidence", async () => {
  const progress = {
    id: "moma-magazine",
    notice: "The opening establishes context before opinion.",
    savedLanguage: "frames the work as",
    shadowNote: "The pause made the contrast clearer.",
    speakingOutline: "Context, detail, response.",
    completedAt: 1234,
    updatedAt: 1234,
  };
  await repository.putRecord("activity-progress", progress);
  repository.closeLucidDb();
  assert.deepEqual(await repository.getRecord("activity-progress", progress.id), progress);
});

test("recovers an exam checkpoint without extending its deadline", async () => {
  const checkpoint = {
    id: "realistic-reading-01",
    mockId: "realistic-reading-01",
    startedAt: 100,
    endAt: 1_200_000,
    answers: { q1: "B", q2: "visual contrast" },
    currentQuestion: "q2",
    lastSavedAt: 400,
    submitted: false,
  };
  await repository.putRecord("examSessions", checkpoint);
  repository.closeLucidDb();
  const recovered = await repository.getRecord("examSessions", checkpoint.id);
  assert.deepEqual(recovered.answers, checkpoint.answers);
  assert.equal(recovered.endAt, 1_200_000);
});

test("lists all records needed to build the Archive", async () => {
  await repository.putRecord("activity-progress", { id: "one", savedLanguage: "first" });
  await repository.putRecord("activity-progress", { id: "two", savedLanguage: "second" });
  const records = await repository.getAllRecords("activity-progress");
  assert.deepEqual(records.map((record) => record.id).sort(), ["one", "two"]);
});
