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
  test("car RF: vehicle pick → license → sts → passport front/back", () => {
    assert.deepEqual(dodaDocSequence("car", { vehicleRf: true }), [
      "vehicle_rf_pick",
      "license",
      "sts",
      "passport_front",
      "passport_back",
    ]);
  });

  test("car foreign: vehicle pick → license → 2× techpassport → passport front/back", () => {
    assert.deepEqual(dodaDocSequence("car", { vehicleRf: false }), [
      "vehicle_rf_pick",
      "license",
      "tech_passport_front",
      "tech_passport_back",
      "passport_front",
      "passport_back",
    ]);
  });

  test("truck: vehicle pick + docs + truck meta + passport front/back", () => {
    const s = dodaDocSequence("truck", { vehicleRf: true });
    assert.equal(s[0], "vehicle_rf_pick");
    assert.equal(s[1], "license");
    assert.equal(s[2], "sts");
    assert.ok(s.includes("truck_dimensions"));
    assert.ok(s.includes("passport_front"));
    assert.equal(s.at(-1), "passport_back");
  });

  test("bike: RF/KG/KZ bo'lsa self-employed branch + passport front/back", () => {
    assert.deepEqual(
      dodaDocSequence("bike", { citizenship: "rf", selfEmployed: false }),
      ["self_employed", "passport_front", "passport_back"]
    );
    assert.deepEqual(
      dodaDocSequence("bike", { citizenship: "kz", selfEmployed: true }),
      ["self_employed", "reg_amina", "moy_nalog_phone", "passport_front", "passport_back"]
    );
  });

  test("bike: boshqa citizenship bo'lsa faqat passport front/back", () => {
    assert.deepEqual(dodaDocSequence("bike", { citizenship: "uz" }), [
      "passport_front",
      "passport_back",
    ]);
  });

  test("foot: bike bilan bir xil citizenship branch", () => {
    assert.deepEqual(dodaDocSequence("foot", { citizenship: "rf", selfEmployed: true }), [
      "self_employed",
      "reg_amina",
      "moy_nalog_phone",
      "passport_front",
      "passport_back",
    ]);
    assert.deepEqual(dodaDocSequence("foot", { citizenship: "tj" }), [
      "passport_front",
      "passport_back",
    ]);
  });

  test("moto: license + passport front/back (STS yo'q)", () => {
    assert.deepEqual(dodaDocSequence("moto", {}), [
      "license",
      "passport_front",
      "passport_back",
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

  test("truck: vehicle pick + VU+STS+barcha meta to‘lsa — passport_front", () => {
    const bk = {
      categoryKey: "truck",
      vehicleRf: true,
      truckDimensionLabel: "M",
      truckPayloadKg: 1000,
      truckBranding: false,
    };
    assert.equal(
      getFirstMissingDodaStepSync(bk, new Set(["license", "sts"])),
      "passport_front"
    );
  });

  test("truck: vehicle pick tanlanmagan bo'lsa — vehicle_rf_pick", () => {
    const bk = {
      categoryKey: "truck",
      truckPayloadKg: 1000,
      truckBranding: true,
    };
    assert.equal(getFirstMissingDodaStepSync(bk, new Set(["license", "sts"])), "vehicle_rf_pick");
  });

  test("truck: gabarit yo‘q — truck_dimensions", () => {
    const bk = {
      categoryKey: "truck",
      vehicleRf: true,
      truckPayloadKg: 1000,
      truckBranding: true,
    };
    assert.equal(
      getFirstMissingDodaStepSync(bk, new Set(["license", "sts"])),
      "truck_dimensions"
    );
  });

  test("bike: RF bo'lsa self_employed tanlanmagan", () => {
    const bk = { categoryKey: "bike", citizenship: "rf" };
    assert.equal(getFirstMissingDodaStepSync(bk, new Set()), "self_employed");
  });

  test("bike: selfEmployed true bo'lsa — reg_amina, keyin moy_nalog_phone", () => {
    const bk = {
      categoryKey: "bike",
      citizenship: "rf",
      selfEmployed: true,
    };
    assert.equal(getFirstMissingDodaStepSync(bk, new Set()), "reg_amina");
    assert.equal(getFirstMissingDodaStepSync(bk, new Set(["reg_amina"])), "moy_nalog_phone");
  });

  test("bike: branch to'lsa — passport_front", () => {
    const bk = {
      categoryKey: "bike",
      citizenship: "rf",
      selfEmployed: true,
      moyNalogPhone: "+79991234567",
    };
    assert.equal(getFirstMissingDodaStepSync(bk, new Set(["reg_amina"])), "passport_front");
  });

  test("hamma narsa to‘lsa — null (review)", () => {
    const bk = {
      categoryKey: "car",
      vehicleRf: true,
    };
    assert.equal(
      getFirstMissingDodaStepSync(
        bk,
        new Set(["license", "sts", "passport_front", "passport_back"])
      ),
      null
    );
  });

  test("moto: VU dan keyin — passport_front (sts йўқ)", () => {
    const bk = { categoryKey: "moto" };
    assert.equal(
      getFirstMissingDodaStepSync(bk, new Set(["license"])),
      "passport_front"
    );
    assert.equal(
      getFirstMissingDodaStepSync(
        bk,
        new Set(["license", "passport_front", "passport_back"])
      ),
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
      dodaDocSequence("bike", { selfEmployed: true, rfCitizen: false }),
      dodaDocSequence("bike", { selfEmployed: true, rfCitizen: true }),
      dodaDocSequence("foot", {}),
      dodaDocSequence("moto", {}),
    ];
    const allKeys = new Set(samples.flat());
    for (const key of allKeys) {
      const covered =
        isDodaUploadDocKey(key) ||
        [
          "self_employed",
          "vehicle_rf_pick",
          "moy_nalog_phone",
          "truck_dimensions",
          "truck_payload",
          "truck_branding",
        ].includes(key);
      assert.ok(
        covered,
        `dodaDocSequence kaliti qoplanmagan bo‘lishi mumkin: ${key}`
      );
    }
  });
});
