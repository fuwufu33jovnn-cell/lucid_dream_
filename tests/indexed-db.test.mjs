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

test("creates every Phase 1 object store in one versioned database", async () => {
  const database = await repository.openLucidDb();
  assert.deepEqual(Array.from(database.objectStoreNames), [
    "examSessions",
    "library",
    "portfolio",
    "preferences",
    "today",
  ]);
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
