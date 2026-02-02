require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Очищаем переменные от невидимых символов и пробелов
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

    try {
        // Сначала находим путь к файлу
        const searchUrl = `https://api.github.com/search/code?q=filename:${filename}+repo:${GITHUB_REPO}`;
        const searchRes = await axios.get(searchUrl, { headers });

        if (!searchRes.data.items || searchRes.data.items.length === 0) {
            return res.status(404).json({ error: "Файл не знайдено в репозиторії" });
        }

        const filePath = searchRes.data.items[0].path;
        const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;

        const getFile = await axios.get(url, { headers });
        const sha = getFile.data.sha;

        await axios.put(url, {
            message: 'Admin update',
            content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
            sha: sha
        }, { headers });

        res.json({ success: true });

    } catch (e) {
        const msg = e.response?.data?.message || e.message;
        res.status(500).json({ error: `GitHub API: ${msg}` });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server live on ${PORT}`));