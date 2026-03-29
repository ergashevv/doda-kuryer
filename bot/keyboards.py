from __future__ import annotations

from telegram import InlineKeyboardButton, InlineKeyboardMarkup

from bot.i18n import t


def language_kb() -> InlineKeyboardMarkup:
    rows = [
        [
            InlineKeyboardButton("🇺🇿 O‘zbek", callback_data="lang_uz"),
            InlineKeyboardButton("🇷🇺 Русский", callback_data="lang_ru"),
        ],
        [
            InlineKeyboardButton("🇹🇯 Тоҷикӣ", callback_data="lang_tg"),
            InlineKeyboardButton("🇰🇬 Кыргызча", callback_data="lang_ky"),
        ],
    ]
    return InlineKeyboardMarkup(rows)


def service_kb(lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton(
                    t(lang, "service_yandex_eda"), callback_data="svc_eda"
                )
            ],
            [
                InlineKeyboardButton(
                    t(lang, "service_yandex_lavka"), callback_data="svc_lavka"
                )
            ],
            [
                InlineKeyboardButton(
                    t(lang, "service_taximeter"), callback_data="svc_tax"
                )
            ],
            [InlineKeyboardButton(t(lang, "back"), callback_data="act_back_lang")],
        ]
    )


def tariff_kb(lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton(
                    t(lang, "tariff_foot_bike"), callback_data="trf_fb"
                )
            ],
            [InlineKeyboardButton(t(lang, "tariff_car"), callback_data="trf_car")],
            [
                InlineKeyboardButton(
                    t(lang, "tariff_truck"), callback_data="trf_truck"
                )
            ],
            [InlineKeyboardButton(t(lang, "back"), callback_data="act_back_svc")],
        ]
    )


def start_docs_kb(lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [InlineKeyboardButton(t(lang, "start_upload"), callback_data="act_start")],
            [InlineKeyboardButton(t(lang, "back"), callback_data="act_back_tariff")],
        ]
    )


def back_only_kb(lang: str, back_data: str = "act_back_collect") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [[InlineKeyboardButton(t(lang, "back"), callback_data=back_data)]]
    )
