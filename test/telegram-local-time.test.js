import assert from "node:assert/strict";
import { test } from "node:test";
import {
  approxTimeZoneForTelegramUser,
  buildBkStartLanguagePrompt,
  hourForTelegramUser,
  localHourInZone,
  russianTimeOfDayGreeting,
} from "../src/bk/telegramLocalTime.js";

test("approxTimeZoneForTelegramUser: language", () => {
  assert.equal(approxTimeZoneForTelegramUser({ language_code: "uz" }), "Asia/Tashkent");
  assert.equal(approxTimeZoneForTelegramUser({ language_code: "kk" }), "Asia/Almaty");
  assert.equal(approxTimeZoneForTelegramUser({ language_code: "ru" }), "Europe/Moscow");
});

test("approxTimeZoneForTelegramUser: region suffix", () => {
  assert.equal(approxTimeZoneForTelegramUser({ language_code: "ru-UZ" }), "Asia/Tashkent");
  assert.equal(approxTimeZoneForTelegramUser({ language_code: "en-KZ" }), "Asia/Almaty");
});

test("approxTimeZoneForTelegramUser: default", () => {
  assert.equal(approxTimeZoneForTelegramUser({}), "Europe/Moscow");
  assert.equal(approxTimeZoneForTelegramUser({ language_code: "" }), "Europe/Moscow");
});

test("localHourInZone returns 0–23", () => {
  const h = localHourInZone("Europe/Moscow");
  assert.ok(h >= 0 && h <= 23);
});

test("russianTimeOfDayGreeting bands", () => {
  assert.equal(russianTimeOfDayGreeting(4), "Доброй ночи!");
  assert.equal(russianTimeOfDayGreeting(5), "Доброе утро!");
  assert.equal(russianTimeOfDayGreeting(11), "Доброе утро!");
  assert.equal(russianTimeOfDayGreeting(12), "Добрый день!");
  assert.equal(russianTimeOfDayGreeting(17), "Добрый день!");
  assert.equal(russianTimeOfDayGreeting(18), "Добрый вечер!");
  assert.equal(russianTimeOfDayGreeting(22), "Добрый вечер!");
  assert.equal(russianTimeOfDayGreeting(23), "Доброй ночи!");
});

test("hourForTelegramUser uses inferred zone", () => {
  const fixed = new Date("2024-06-15T12:00:00Z");
  const hUz = hourForTelegramUser({ language_code: "uz" }, fixed);
  const hRu = hourForTelegramUser({ language_code: "ru" }, fixed);
  assert.notEqual(hUz, hRu);
});

test("buildBkStartLanguagePrompt shape", () => {
  const fixed = new Date("2024-06-15T08:00:00Z");
  const text = buildBkStartLanguagePrompt({ language_code: "ru" }, fixed);
  assert.match(text, /Доброе утро!|Добрый день!|Добрый вечер!|Доброй ночи!/);
  assert.ok(text.includes("Дода Курьер"));
  assert.ok(text.includes("Выберите язык"));
});
