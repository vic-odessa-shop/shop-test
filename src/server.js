require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO?.trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

app.post('/api/admin/save', async (req, res) => {
    const { password, data, filename } = req.body;

    if (password?.toString() !== ADMIN_PASSWORD?.toString()) {
        return res.status(403).json({ error: 'Невірний пароль!' });
    }

    const headers = {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
    };

    try {
        console.log(`--- Поиск файла ${filename} в репозитории ${GITHUB_REPO} ---`);

        // 1. Ищем путь к файлу через поиск по репозиторию
        // Это сработает, даже если файл в /public, в корне или любой другой папке
        const searchUrl = `https://api.github.com/search/code?q=filename:${filename}+repo:${GITHUB_REPO}`;
        const searchRes = await axios.get(searchUrl, { headers });

        if (searchRes.data.total_count === 0) {
            return res.status(404).json({ error: `Файл ${filename} не знайдено в репозиторії взагалі!` });
        }

        // Берем путь первого найденного файла (обычно это и есть наш файл)
        const filePath = searchRes.data.items[0].path;
        const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;

        console.log(`Файл найден по пути: ${filePath}`);

        // 2. Получаем текущий SHA этого файла
        const getFile = await axios.get(url, { headers });
        const sha = getFile.data.sha;

        // 3. Отправляем обновление
        await axios.put(url, {
            message: 'Admin update',
            content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
            sha: sha
        }, { headers });

        console.log('✅ Успешно обновлено!');
        res.json({ success: true });

    } catch (e) {
        const status = e.response?.status;
        const msg = e.response?.data?.message || e.message;
        console.error(`Ошибка (Статус ${status}): ${msg}`);

        if (status === 403 && msg.includes('rate limit')) {
            res.status(403).json({ error: "GitHub API rate limit exceeded. Подождите немного." });
        } else {
            res.status(500).json({ error: `Ошибка GitHub: ${msg}` });
        }
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server live on ${PORT}`));