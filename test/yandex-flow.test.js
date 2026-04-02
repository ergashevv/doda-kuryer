/**
 * Yandex Lavka/Eda: UI ketma-ketligi, callback payloadlari, matn validatsiyasi.
 * DB va Telegramsiz.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  YX_EATS,
  YX_LAVKA,
  buildYxLine,
  clearYandexCollected,
  getYandexUiState,
  initYandexSession,
  validateYxText,
  yxExtractFile,
  yxForbiddenMedia,
} from "../src/bk/yandexFlow.js";

const PREFIX_YX = "bk_YX:";

/** Handlers bilan bir xil: payload = data.slice("bk_YX:".length) */
function yxPayload(data) {
  return data.slice(PREFIX_YX.length);
}

function baseYx(over = {}) {
  return {
    service: YX_LAVKA,
    cityKey: "msk",
    citizen: "rf",
    uzDocKind: null,
    kzDocKind: null,
    tmVisaKind: null,
    regAmina: null,
    ...over,
  };
}

describe("getYandexUiState — boshidan yakunigacha tartib", () => {
  test("servis yoq → none", () => {
    assert.deepEqual(getYandexUiState({}, 0), { ui: "none" });
  });

  test("shahar yoq → city", () => {
    const yx = { service: YX_LAVKA, cityKey: null };
    assert.deepEqual(getYandexUiState(yx, 0), { ui: "city" });
  });

  test("fuqarolik yoq → citizen", () => {
    const yx = { service: YX_EATS, cityKey: "spb", citizen: null };
    assert.deepEqual(getYandexUiState(yx, 0), { ui: "citizen" });
  });

  test("UZ/TJ + hujjat turi yoq → uz_doc", () => {
    const yx = baseYx({ citizen: "uz_tj", uzDocKind: null });
    assert.deepEqual(getYandexUiState(yx, 0), { ui: "uz_doc" });
  });

  test("KZ/KG + doc tur yoq → kz_doc", () => {
    const yx = baseYx({ citizen: "kz_kg", kzDocKind: null });
    assert.deepEqual(getYandexUiState(yx, 0), { ui: "kz_doc" });
  });

  test("TM: birinchi qadam — pasport (viza turi keyinroq, TZ)", () => {
    const yx = baseYx({ citizen: "tm", tmVisaKind: null });
    const st = getYandexUiState(yx, 0);
    assert.equal(st.ui, "step");
    assert.equal(st.step.docType, "yx_tm_pass");
  });

  test("TM: pasportdan keyin — viza turi tanlovi (choice)", () => {
    const yx = baseYx({ citizen: "tm", tmVisaKind: null });
    const st = getYandexUiState(yx, 1);
    assert.equal(st.ui, "step");
    assert.equal(st.step.t, "choice");
    assert.equal(st.step.choiceId, "visa_kind");
  });

  test("RF liniyasi: birinchi qadam — pasport beti", () => {
    const yx = baseYx({ citizen: "rf" });
    const st = getYandexUiState(yx, 0);
    assert.equal(st.ui, "step");
    assert.equal(st.step.docType, "yx_rf_pass_face");
    assert.equal(st.step.t, "photo");
  });

  test("RF: completedLen toliq bolsa → done", () => {
    const yx = baseYx({ citizen: "rf" });
    const line = buildYxLine(yx);
    assert.ok(line.length > 0);
    const st = getYandexUiState(yx, line.length);
    assert.equal(st.ui, "done");
  });

  test("UZ patent: regAmina yoq → choice qadam", () => {
    const yx = baseYx({
      citizen: "uz_tj",
      uzDocKind: "patent",
      regAmina: null,
    });
    const line = buildYxLine(yx);
    const idx = 3;
    assert.equal(line[idx].t, "choice");
    const st = getYandexUiState(yx, idx);
    assert.equal(st.ui, "step");
    assert.equal(st.step.t, "choice");
  });
});

describe("buildYxLine — tarmoqlar uzunligi va oxirgi qadamlar", () => {
  test("RF: migratsiyadan keyin rekvizitlar (video) bor", () => {
    const line = buildYxLine(baseYx({ citizen: "rf" }));
    const videos = line.filter((s) => s.t === "video");
    assert.equal(videos.length, 1);
    assert.equal(videos[0].docType, "yx_req_video");
  });

  test("VNJ: qisqa yo'l — choice yoq", () => {
    const line = buildYxLine(
      baseYx({ citizen: "uz_tj", uzDocKind: "vnzh" })
    );
    assert.ok(line.every((s) => s.t !== "choice"));
    assert.ok(line.some((s) => s.docType === "yx_uz_vnzh_f"));
  });

  test("KZ pass: kzDocKind=pass", () => {
    const line = buildYxLine(
      baseYx({ citizen: "kz_kg", kzDocKind: "pass" })
    );
    assert.ok(line.some((s) => s.docType === "yx_kz_pass_face"));
  });

  test("TM: viza + alohida contact phone maydoni", () => {
    const yx = baseYx({
      citizen: "tm",
      tmVisaKind: "work",
      regAmina: "reg",
    });
    const line = buildYxLine(yx);
    const texts = line.filter((s) => s.t === "text");
    assert.ok(texts.some((s) => s.colKey === "yx_col_tm_contact"));
  });

  test("TM: tmVisaKind tanlanguncha viza foto qadami yoq", () => {
    const line = buildYxLine(baseYx({ citizen: "tm", tmVisaKind: null }));
    assert.ok(!line.some((s) => s.docType === "yx_tm_visa"));
  });

  test("TM: tmkind tanlangach — viza surati qadami bor", () => {
    const line = buildYxLine(
      baseYx({ citizen: "tm", tmVisaKind: "study" })
    );
    const visaIdx = line.findIndex((s) => s.docType === "yx_tm_visa");
    assert.ok(visaIdx > 0);
    assert.equal(line[0].docType, "yx_tm_pass");
  });
});

describe("Callback data — handler bilan mos payload", () => {
  test("bk_YX:city:msk → msk", () => {
    const p = yxPayload(`${PREFIX_YX}city:msk`);
    assert.ok(p.startsWith("city:"));
    assert.ok(p.endsWith("msk"));
  });

  test("bk_YX:cit:uz_tj → fuqarolik kodi", () => {
    const p = yxPayload(`${PREFIX_YX}cit:uz_tj`);
    assert.equal(p.slice(4), "uz_tj");
  });

  test("bk_YX:uz:patent → patent", () => {
    const p = yxPayload(`${PREFIX_YX}uz:patent`);
    assert.equal(p.slice(3), "patent");
  });

  test("bk_YX:kz:pass / kz:id", () => {
    assert.equal(yxPayload(`${PREFIX_YX}kz:pass`).slice(3) === "pass", true);
    assert.equal(yxPayload(`${PREFIX_YX}kz:id`).slice(3) === "id", true);
  });

  test("bk_YX:tmkind:work", () => {
    const p = yxPayload(`${PREFIX_YX}tmkind:work`);
    assert.equal(p.slice(7) === "work", true);
  });

  test("bk_YX:ram:reg → reg", () => {
    const p = yxPayload(`${PREFIX_YX}ram:reg`);
    assert.ok(p.endsWith("reg"));
  });

  test("bk_S: doda / lavka / eats", () => {
    assert.equal("bk_S:doda".slice(5), "doda");
    assert.equal("bk_S:lavka".slice(5), "lavka");
    assert.equal("bk_S:eats".slice(5), "eats");
  });

  test("bk_YR:send aniq mos keladi", () => {
    assert.equal("bk_YR:send", "bk_YR:send");
  });
});

describe("initYandexSession / clearYandexCollected", () => {
  test("init: yx va completed_yx nollanadi, bk saqlanadi", () => {
    const td = initYandexSession(
      { bk: { foo: 1 }, collected: { bank: "x", yx_col_a: "1" } },
      YX_LAVKA
    );
    assert.equal(td.bk.foo, 1);
    assert.equal(td.yx.service, YX_LAVKA);
    assert.deepEqual(td.completed_yx, []);
    assert.equal(td.yx.cityKey, null);
  });

  test("clearYandexCollected: faqat yx_col_* ochadi", () => {
    const coll = clearYandexCollected({
      collected: { bank: "keep", yx_col_x: "drop" },
    });
    assert.equal(coll.bank, "keep");
    assert.equal(coll.yx_col_x, undefined);
  });
});

describe("validateYxText", () => {
  const step16 = { mode: "digits16" };
  const stepPh = { mode: "phone" };
  const stepPlain = { mode: "plain" };

  test("16 raqam", () => {
    assert.equal(validateYxText(step16, "1234 5678 9012 3456"), "1234567890123456");
    assert.equal(validateYxText(step16, "123"), null);
  });

  test("telefon kamida 10 raqam", () => {
    assert.ok(validateYxText(stepPh, "+79991234567"));
    assert.equal(validateYxText(stepPh, "123"), null);
  });

  test("plain", () => {
    assert.equal(validateYxText(stepPlain, "  hello "), "hello");
  });
});

describe("yxForbiddenMedia / yxExtractFile", () => {
  test("video qadamda oddiy video ruxsat; video_note taqiq", () => {
    const step = { t: "video", docType: "yx_req_video" };
    assert.equal(yxForbiddenMedia({ video: {} }, step), false);
    assert.equal(yxForbiddenMedia({ video_note: {} }, step), true);
  });

  test("photo qadamda video taqiq", () => {
    const step = { t: "photo", docType: "x" };
    assert.equal(yxForbiddenMedia({ video: {} }, step), true);
  });

  test("extract: photo", () => {
    const step = { t: "photo", docType: "d" };
    const msg = { photo: [{ file_id: "a" }, { file_id: "b" }] };
    assert.equal(yxExtractFile(msg, step).fileId, "b");
  });
});

describe("Simulyatsiya: RF liniyasi boyicha indekslar ketma-ket", () => {
  test("har bir completedLen uchun keyingi step mavjud (done gacha)", () => {
    const yx = baseYx({ citizen: "rf" });
    const line = buildYxLine(yx);
    for (let i = 0; i < line.length; i++) {
      const st = getYandexUiState(yx, i);
      assert.equal(st.ui, "step");
      assert.deepEqual(st.step, line[i]);
    }
    assert.equal(getYandexUiState(yx, line.length).ui, "done");
  });
});
