require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Чистим всё от пробелов
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.replace(/\s/g, '') : '';
const GITHUB_REPO = process.env.GITHUB_REPO ? process.env.GITHUB_REPO.trim() : '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.trim() : '';

app.post('/api/admin/save', async (req, res) => {
    const { password, data, filename } = req.body;

    if (password?.toString() !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: 'Невірний пароль!' });
    }

    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
    };

    // Прямой путь к файлу
    const filePath = `public/${filename}`;
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;

    try {
        console.log(`Запрос к GitHub: ${url}`);

        // 1. Получаем SHA файла
        const getFile = await axios.get(url, { headers });
        const sha = getFile.data.sha;

        // 2. Обновляем файл
        await axios.put(url, {
            message: 'Admin update',
            content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
            sha: sha
        }, { headers });

        res.json({ success: true });

    } catch (e) {
        const status = e.response?.status;
        const msg = e.response?.data?.message || e.message;

        console.error(`Ошибка GitHub: ${status} - ${msg}`);

        if (status === 404) {
            res.status(404).json({ error: `GitHub не знаходить файл за шляхом: ${filePath}. Перевір, чи є папка public і файл products.json` });
        } else {
            res.status(500).json({ error: `GitHub API: ${msg}` });
        }
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server live on ${PORT}`));