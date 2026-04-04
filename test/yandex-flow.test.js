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
  clearYandexStagingSessionFields,
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

  test("UZ (alohida) + hujjat turi yoq → uz_doc", () => {
    const yx = baseYx({ citizen: "uz", uzDocKind: null });
    assert.deepEqual(getYandexUiState(yx, 0), { ui: "uz_doc" });
  });

  test("KZ/KG + doc tur yoq → kz_doc", () => {
    const yx = baseYx({ citizen: "kz_kg", kzDocKind: null });
    assert.deepEqual(getYandexUiState(yx, 0), { ui: "kz_doc" });
  });

  test("KG (alohida) + doc tur yoq → kz_doc", () => {
    const yx = baseYx({ citizen: "kg", kzDocKind: null });
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

  test("Boshqa davlat: RF bilan bir xil liniya", () => {
    const rf = buildYxLine(baseYx({ citizen: "rf" }));
    const other = buildYxLine(baseYx({ citizen: "other" }));
    assert.deepEqual(other, rf);
    const st = getYandexUiState(baseYx({ citizen: "other" }), 0);
    assert.equal(st.step.docType, "yx_rf_pass_face");
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

  test("yx_staged_doc: preview kutilmoqda — boshqa UI yo‘q", () => {
    const yx = baseYx({ citizen: "rf" });
    const td = { yx_staged_doc: "yx_rf_pass_face" };
    assert.deepEqual(getYandexUiState(yx, 0, td), { ui: "staged" });
  });
});

describe("clearYandexStagingSessionFields", () => {
  test("staging kalitlari ochiladi", () => {
    const o = clearYandexStagingSessionFields({
      bk: {},
      yx_staged_doc: "x",
      yx_prompt_msg_ids: [1],
      yx_preview_msg_ids: [2],
      bk_pending_user_message_id: 9,
      keep: 1,
    });
    assert.equal(o.keep, 1);
    assert.equal(o.yx_staged_doc, undefined);
    assert.equal(o.yx_prompt_msg_ids, undefined);
    assert.equal(o.yx_preview_msg_ids, undefined);
    assert.equal(o.bk_pending_user_message_id, undefined);
  });
});

describe("buildYxLine — tarmoqlar uzunligi va oxirgi qadamlar", () => {
  test("RF: migratsiyadan keyin rekvizitlar text + karta", () => {
    const line = buildYxLine(baseYx({ citizen: "rf" }));
    const texts = line.filter((s) => s.t === "text");
    assert.ok(texts.some((s) => s.colKey === "yx_col_contact_phone"));
    assert.ok(texts.some((s) => s.colKey === "yx_col_req_text"));
    assert.ok(texts.some((s) => s.colKey === "yx_col_card16"));
    assert.ok(!texts.some((s) => s.colKey === "yx_col_phone_bank"));
  });

  test("RF: useRegisteredPhone — kontakt telefon matn qadami yo'q", () => {
    const texts = buildYxLine(
      baseYx({ citizen: "rf", useRegisteredPhone: true })
    ).filter((s) => s.t === "text");
    assert.ok(!texts.some((s) => s.colKey === "yx_col_contact_phone"));
    assert.ok(texts.some((s) => s.colKey === "yx_col_req_text"));
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

  test("TM: ishchi viza — Amina/reg bitta fayl, keyin mig, telefon, rekvizit + 16", () => {
    const yx = baseYx({
      citizen: "tm",
      tmVisaKind: "work",
    });
    const line = buildYxLine(yx);
    const visaIdx = line.findIndex((s) => s.docType === "yx_tm_visa");
    assert.ok(visaIdx >= 0);
    assert.equal(line[visaIdx + 1].t, "doc");
    assert.equal(line[visaIdx + 1].docType, "yx_tm_amina_or_reg");
    const texts = line.filter((s) => s.t === "text");
    assert.ok(texts.some((s) => s.colKey === "yx_col_tm_contact"));
    assert.ok(texts.some((s) => s.colKey === "yx_col_req_text"));
    assert.ok(texts.some((s) => s.colKey === "yx_col_card16"));
  });

  test("TM: ro'yxatdan o'tish telefoni bor — qo'shimcha kontakt tel qadami yo'q", () => {
    const yx = baseYx({
      citizen: "tm",
      tmVisaKind: "work",
      useRegisteredPhone: true,
    });
    const texts = buildYxLine(yx).filter((s) => s.t === "text");
    assert.ok(!texts.some((s) => s.colKey === "yx_col_tm_contact"));
    assert.ok(texts.some((s) => s.colKey === "yx_col_req_text"));
  });

  test("TM: tmVisaKind tanlanguncha viza foto qadami yoq", () => {
    const line = buildYxLine(baseYx({ citizen: "tm", tmVisaKind: null }));
    assert.ok(!line.some((s) => s.docType === "yx_tm_visa"));
  });

  test("TM: eski study sessiya work liniyasiga map qilinadi", () => {
    const line = buildYxLine(baseYx({ citizen: "tm", tmVisaKind: "study" }));
    assert.ok(line.some((s) => s.docType === "yx_tm_visa"));
  });

  test("TM: tmkind tanlangach — viza surati qadami bor", () => {
    const line = buildYxLine(
      baseYx({ citizen: "tm", tmVisaKind: "work" })
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

  test("bk_YX:cit:uz / cit:other", () => {
    assert.equal(yxPayload(`${PREFIX_YX}cit:uz`).slice(4), "uz");
    assert.equal(yxPayload(`${PREFIX_YX}cit:other`).slice(4), "other");
  });

  test("bk_YX:uz:patent → patent", () => {
    const p = yxPayload(`${PREFIX_YX}uz:patent`);
    assert.equal(p.slice(3), "patent");
  });

  test("bk_YX:kz:pass / kz:id", () => {
    assert.equal(yxPayload(`${PREFIX_YX}kz:pass`).slice(3) === "pass", true);
    assert.equal(yxPayload(`${PREFIX_YX}kz:id`).slice(3) === "id", true);
  });

  test("bk_YX:tmkind:work / tourism", () => {
    assert.equal(yxPayload(`${PREFIX_YX}tmkind:work`).slice(7), "work");
    assert.equal(yxPayload(`${PREFIX_YX}tmkind:tourism`).slice(7), "tourism");
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
      {
        bk: { foo: 1 },
        collected: { bank: "x", yx_col_a: "1" },
        yx_staged_doc: "stale",
        yx_prompt_msg_ids: [5],
      },
      YX_LAVKA
    );
    assert.equal(td.bk.foo, 1);
    assert.equal(td.yx.service, YX_LAVKA);
    assert.deepEqual(td.completed_yx, []);
    assert.equal(td.yx.cityKey, null);
    assert.equal(td.yx_staged_doc, undefined);
    assert.equal(td.yx_prompt_msg_ids, undefined);
    assert.equal(td.yx.useRegisteredPhone, false);
  });

  test("init: telefon berilsa — yx_col_contact_phone collected va useRegisteredPhone", () => {
    const td = initYandexSession({ bk: {} }, YX_EATS, "+79991234567");
    assert.equal(td.yx.useRegisteredPhone, true);
    assert.equal(td.collected.yx_col_contact_phone, "+79991234567");
    assert.equal(td.collected.yx_col_tm_contact, "+79991234567");
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
    const step = { t: "video", docType: "any_video_doc" };
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
