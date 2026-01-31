require('dotenv').config(); // Эта строка подтягивает данные из .env
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// Теперь мы берем токен не из текста, а из системных переменных
const token = process.env.BOT_TOKEN; 

