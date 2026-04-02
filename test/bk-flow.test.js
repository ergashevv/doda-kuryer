/**
 * BK oqimi: ketma-kilik va callback parse — DB/Telegramsiz.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  dodaDocSequence,
  getFirstMissingDodaStepSync,
  isDodaUploadDocKey,
  parseBkTrCallbackData,
} from "../src/flow.js";

describe("dodaDocSequence", () => {
  test("car RF: license → sts → passport", () => {
    assert.deepEqual(dodaDocSequence("car", { vehicleRf: true }), [
      "license",
      "sts",
      "passport",
    ]);
  });

  test("car foreign: license → 2× techпаспорт → passport", () => {
    assert.deepEqual(dodaDocSequence("car", { vehicleRf: false }), [
      "license",
      "tech_passport_front",
      "tech_passport_back",
      "passport",
    ]);
  });

  test("truck: VU, СТС, then truck meta, passport", () => {
    const s = dodaDocSequence("truck", {});
    assert.equal(s[0], "license");
    assert.equal(s[1], "sts");
    assert.ok(s.includes("truck_dimensions"));
    assert.ok(s.includes("passport"));
    assert.equal(s.at(-1), "passport");
  });

  test("bike: self_employed → optional inn → thermal → passport", () => {
    assert.deepEqual(dodaDocSequence("bike", { selfEmployed: false }), [
      "self_employed",
      "thermal",
      "passport",
    ]);
    assert.deepEqual(dodaDocSequence("bike", { selfEmployed: true }), [
      "self_employed",
      "inn",
      "thermal",
      "passport",
    ]);
  });

  test("foot/moto: license → sts → passport", () => {
    assert.deepEqual(dodaDocSequence("foot", {}), [
      "license",
      "sts",
      "passport",
    ]);
    assert.deepEqual(dodaDocSequence("moto", {}), [
      "license",
      "sts",
      "passport",
    ]);
  });
});

describe("getFirstMissingDodaStepSync (bot qotmasligi)", () => {
  test("bosh mashina oqimi: birinchi license", () => {
    const bk = { categoryKey: "car", vehicleRf: true };
    assert.equal(getFirstMissingDodaStepSync(bk, new Set()), "license");
  });

  test("VU yuklangan — keyingi sts", () => {
    const bk = { categoryKey: "car", vehicleRf: true };
    assert.equal(
      getFirstMissingDodaStepSync(bk, new Set(["license"])),
      "sts"
    );
  });

  test("truck: VU+STS+barcha meta to‘lsa — passport", () => {
    const bk = {
      categoryKey: "truck",
      truckDimensionLabel: "M",
      truckPayloadKg: 1000,
      truckLoaders: 1,
      truckBranding: false,
    };
    assert.equal(
      getFirstMissingDodaStepSync(bk, new Set(["license", "sts"])),
      "passport"
    );
  });

  test("truck: gabarit yo‘q — truck_dimensions", () => {
    const bk = {
      categoryKey: "truck",
      truckPayloadKg: 1000,
      truckLoaders: 0,
      truckBranding: true,
    };
    assert.equal(
      getFirstMissingDodaStepSync(bk, new Set(["license", "sts"])),
      "truck_dimensions"
    );
  });

  test("bike: self_employed tanlanmagan", () => {
    const bk = { categoryKey: "bike" };
    assert.equal(getFirstMissingDodaStepSync(bk, new Set()), "self_employed");
  });

  test("bike: selfEmployed true, INN yo‘q", () => {
    const bk = { categoryKey: "bike", selfEmployed: true, hasThermal: true };
    assert.equal(
      getFirstMissingDodaStepSync(bk, new Set(["passport"])),
      "inn"
    );
  });

  test("hamma narsa to‘lsa — null (review)", () => {
    const bk = {
      categoryKey: "car",
      vehicleRf: true,
    };
    assert.equal(
      getFirstMissingDodaStepSync(bk, new Set(["license", "sts", "passport"])),
      null
    );
  });
});

describe("parseBkTrCallbackData", () => {
  test("bk_TR:d:S → kind d, val S", () => {
    assert.deepEqual(parseBkTrCallbackData("bk_TR:d:S"), {
      kind: "d",
      val: "S",
    });
  });

  test("bk_TR:l:2", () => {
    assert.deepEqual(parseBkTrCallbackData("bk_TR:l:2"), {
      kind: "l",
      val: "2",
    });
  });

  test("not bk_TR", () => {
    assert.equal(parseBkTrCallbackData("bk_C:car"), null);
  });
});

describe("sequence ↔ getFirstMissing — barcha qadamlar qoplangan", () => {
  test("har bir seq kaliti getFirstMissingDodaStepSync da ishlatiladi", () => {
    const samples = [
      dodaDocSequence("car", { vehicleRf: true }),
      dodaDocSequence("car", { vehicleRf: false }),
      dodaDocSequence("truck", {}),
      dodaDocSequence("bike", { selfEmployed: false }),
      dodaDocSequence("bike", { selfEmployed: true }),
      dodaDocSequence("foot", {}),
    ];
    const allKeys = new Set(samples.flat());
    for (const key of allKeys) {
      const covered =
        isDodaUploadDocKey(key) ||
        [
          "self_employed",
          "inn",
          "thermal",
          "truck_dimensions",
          "truck_payload",
          "truck_loaders",
          "truck_branding",
        ].includes(key);
      assert.ok(
        covered,
        `dodaDocSequence kaliti qoplanmagan bo‘lishi mumkin: ${key}`
      );
    }
  });
});
