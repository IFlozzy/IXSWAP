// telegram/telegramBot.js
import TelegramBot from 'node-telegram-bot-api';

const TELEGRAM_BOT_TOKEN = '7860660251:AAHrqtuGnAxA5SfR8SdJu1WkPfK3Iakfsyo';
const LOGS_CHAT_ID = '-1002513004462';
const MAIN_CHAT_ID = '-4694395041';

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

export function sendLogMessage(text) {
    return bot.sendMessage(LOGS_CHAT_ID, text);
}

export function sendMainMessage(text) {
    return bot.sendMessage(MAIN_CHAT_ID, text);
}
