from __future__ import annotations

import re
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified
from telegram import Update
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

from bot.db.models import UploadedFile
from bot.flow import is_photo_doc, next_pending
from bot.i18n import checklist_lines, doc_label, t
from bot.keyboards import (
    back_only_kb,
    language_kb,
    service_kb,
    start_docs_kb,
    tariff_kb,
)
from bot.services.chat_log import log_chat
from bot.services.storage import download_telegram_file
from bot.services.users import ensure_profile, reset_registration

SVC_MAP = {"svc_eda": "yandex_eda", "svc_lavka": "yandex_lavka", "svc_tax": "taximeter"}
TRF_MAP = {"trf_fb": "foot_bike", "trf_car": "car", "trf_truck": "truck"}


def _session_factory():
    from bot.db.session import get_session_factory

    return get_session_factory()


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_user or not update.message:
        return
    uid = update.effective_user.id
    fac = _session_factory()
    async with fac() as session:
        p = await reset_registration(session, uid)
        await log_chat(session, uid, "user", "/start")
        lang = p.language if p else "uz"
        text = t(lang, "greet")
        await log_chat(session, uid, "assistant", text)
        await session.commit()
    await update.message.reply_text(text, reply_markup=language_kb())


async def on_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    q = update.callback_query
    if not q or not q.data or not update.effective_user:
        return
    await q.answer()
    uid = update.effective_user.id
    data = q.data
    fac = _session_factory()

    async with fac() as session:
        profile = await ensure_profile(session, uid)
        lang = profile.language

        if data.startswith("lang_"):
            lg = data.replace("lang_", "")
            if lg in ("uz", "ru", "tg", "ky"):
                profile.language = lg
                profile.session_state = "service"
                await log_chat(session, uid, "user", f"[callback] {data}")
                msg = t(lg, "pick_service")
                await log_chat(session, uid, "assistant", msg)
                await session.commit()
                await q.edit_message_text(msg, reply_markup=service_kb(lg))
            return

        if data in SVC_MAP:
            profile.service = SVC_MAP[data]
            profile.session_state = "tariff"
            await log_chat(session, uid, "user", f"[callback] {data}")
            msg = t(lang, "pick_tariff")
            await log_chat(session, uid, "assistant", msg)
            await session.commit()
            await q.edit_message_text(msg, reply_markup=tariff_kb(lang))
            return

        if data in TRF_MAP:
            profile.tariff = TRF_MAP[data]
            profile.session_state = "city"
            await log_chat(session, uid, "user", f"[callback] {data}")
            msg = t(lang, "ask_city")
            await log_chat(session, uid, "assistant", msg)
            await session.commit()
            await q.edit_message_text(msg)
            return

        if data == "act_start":
            if not profile.tariff:
                await session.commit()
                return
            profile.session_state = "collect"
            profile.session_data = {"completed_docs": []}
            flag_modified(profile, "session_data")
            await log_chat(session, uid, "user", "[callback] act_start")
            doc = next_pending([], profile.tariff)
            if not doc:
                await session.commit()
                return
            prompt = _prompt_for_doc(lang, doc)
            await log_chat(session, uid, "assistant", prompt)
            await session.commit()
            await q.edit_message_text(
                prompt, reply_markup=back_only_kb(lang, "act_back_collect")
            )
            return

        if data == "act_back_lang":
            profile.session_state = "language"
            await log_chat(session, uid, "user", "[callback] act_back_lang")
            msg = t(lang, "pick_language")
            await log_chat(session, uid, "assistant", msg)
            await session.commit()
            await q.edit_message_text(msg, reply_markup=language_kb())
            return

        if data == "act_back_svc":
            profile.session_state = "service"
            await log_chat(session, uid, "user", "[callback] act_back_svc")
            msg = t(lang, "pick_service")
            await log_chat(session, uid, "assistant", msg)
            await session.commit()
            await q.edit_message_text(msg, reply_markup=service_kb(lang))
            return

        if data == "act_back_tariff":
            profile.session_state = "tariff"
            profile.city = None
            await log_chat(session, uid, "user", "[callback] act_back_tariff")
            msg = t(lang, "pick_tariff")
            await log_chat(session, uid, "assistant", msg)
            await session.commit()
            await q.edit_message_text(msg, reply_markup=tariff_kb(lang))
            return

        if data == "act_back_collect":
            td = dict(profile.session_data or {})
            completed: list[str] = list(td.get("completed_docs", []))
            if not completed:
                profile.session_state = "city"
                await log_chat(session, uid, "user", "[callback] act_back_collect -> city")
                msg = t(lang, "ask_city")
                await log_chat(session, uid, "assistant", msg)
                await session.commit()
                await q.edit_message_text(msg)
                return
            completed.pop()
            td["completed_docs"] = completed
            profile.session_data = td
            flag_modified(profile, "session_data")
            doc = next_pending(completed, profile.tariff or "foot_bike")
            if not doc:
                profile.session_state = "done"
                await session.commit()
                return
            prompt = _prompt_for_doc(lang, doc)
            await log_chat(session, uid, "assistant", prompt)
            await session.commit()
            await q.edit_message_text(
                prompt, reply_markup=back_only_kb(lang, "act_back_collect")
            )
            return

        await session.commit()


def _prompt_for_doc(lang: str, doc_key: str) -> str:
    if doc_key == "phone":
        return t(lang, "send_phone_contact")
    if doc_key == "bank":
        return t(lang, "send_bank")
    label = doc_label(lang, doc_key)
    return t(lang, "send_photo_or_file", label=label)


async def on_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_user or not update.message:
        return
    uid = update.effective_user.id
    msg = update.message
    text = (msg.text or "").strip()
    fac = _session_factory()

    async with fac() as session:
        profile = await ensure_profile(session, uid)
        lang = profile.language
        state = profile.session_state

        if state == "city" and not text and (msg.photo or msg.document):
            await log_chat(session, uid, "user", "[media instead of city]")
            await log_chat(session, uid, "assistant", t(lang, "ask_city"))
            await session.commit()
            await msg.reply_text(t(lang, "ask_city"))
            return

        if state == "city" and text:
            profile.city = text
            profile.session_state = "ready"
            await log_chat(session, uid, "user", text)
            ack = t(lang, "city_received", city=text)
            lines = checklist_lines(lang, profile.tariff or "foot_bike")
            body = "\n".join(lines)
            full = f"{ack}\n\n{body}"
            await log_chat(session, uid, "assistant", full)
            await session.commit()
            await msg.reply_text(full, reply_markup=start_docs_kb(lang))
            return

        if state == "collect" and profile.tariff:
            td = dict(profile.session_data or {})
            completed: list[str] = list(td.get("completed_docs", []))
            doc = next_pending(completed, profile.tariff)
            if not doc:
                profile.session_state = "done"
                await log_chat(session, uid, "user", text or "[media]")
                done = t(lang, "completed")
                await log_chat(session, uid, "assistant", done)
                await session.commit()
                await msg.reply_text(done)
                return

            await log_chat(
                session,
                uid,
                "user",
                text or "[media]",
                extra={"doc": doc},
            )
            ok = await _try_accept_doc(session, context, profile, uid, doc, msg)
            if not ok:
                await log_chat(session, uid, "assistant", t(lang, "invalid_input"))
                await session.commit()
                await msg.reply_text(
                    t(lang, "invalid_input"),
                    reply_markup=back_only_kb(lang, "act_back_collect"),
                )
                return

            td = dict(profile.session_data or {})
            completed = list(td.get("completed_docs", []))
            completed.append(doc)
            td["completed_docs"] = completed
            profile.session_data = td
            flag_modified(profile, "session_data")

            nxt = next_pending(completed, profile.tariff)
            label = doc_label(lang, doc)
            saved = t(lang, "saved", label=label)
            await log_chat(session, uid, "assistant", saved)
            if not nxt:
                profile.session_state = "done"
                done = t(lang, "completed")
                await log_chat(session, uid, "assistant", done)
                await session.commit()
                await msg.reply_text(f"{saved}\n\n{done}")
                return

            n_prompt = _prompt_for_doc(lang, nxt)
            await log_chat(session, uid, "assistant", n_prompt)
            await session.commit()
            await msg.reply_text(
                f"{saved}\n\n{n_prompt}",
                reply_markup=back_only_kb(lang, "act_back_collect"),
            )
            return

        if text:
            await log_chat(session, uid, "user", text)
            await log_chat(session, uid, "assistant", t(lang, "use_buttons"))
            await session.commit()
            await msg.reply_text(t(lang, "use_buttons"))


async def _try_accept_doc(
    session: AsyncSession,
    context: ContextTypes.DEFAULT_TYPE,
    profile: Any,
    uid: int,
    doc: str,
    msg: Any,
) -> bool:
    if doc == "phone":
        phone = None
        if msg.contact and msg.contact.phone_number:
            phone = msg.contact.phone_number
        elif msg.text:
            phone = re.sub(r"\s+", "", msg.text)
        if phone and len(phone) >= 8:
            td = dict(profile.session_data or {})
            coll = dict(td.get("collected", {}))
            coll["phone"] = phone
            td["collected"] = coll
            profile.session_data = td
            flag_modified(profile, "session_data")
            return True
        return False

    if doc == "bank":
        if not msg.text:
            return False
        raw = msg.text.strip()
        digits = re.sub(r"\D", "", raw)
        if len(digits) < 16:
            return False
        td = dict(profile.session_data or {})
        coll = dict(td.get("collected", {}))
        coll["bank"] = raw
        td["collected"] = coll
        profile.session_data = td
        flag_modified(profile, "session_data")
        return True

    if not is_photo_doc(doc):
        return False

    file_id = None
    mime = None
    if msg.photo:
        file_id = msg.photo[-1].file_id
        mime = "image/jpeg"
    elif msg.document:
        file_id = msg.document.file_id
        mime = msg.document.mime_type

    if not file_id:
        return False

    bot = context.bot
    path = await download_telegram_file(bot, file_id, uid, doc, mime)
    row = UploadedFile(
        telegram_user_id=uid,
        doc_type=doc,
        telegram_file_id=file_id,
        local_path=path,
    )
    session.add(row)
    return True


def register_handlers(application: Application) -> None:
    application.add_handler(CommandHandler("start", cmd_start))
    application.add_handler(CallbackQueryHandler(on_callback, pattern=r"^(lang_|svc_|trf_|act_)"))
    application.add_handler(
        MessageHandler(
            filters.TEXT | filters.PHOTO | filters.Document.ALL | filters.CONTACT,
            on_message,
        )
    )
