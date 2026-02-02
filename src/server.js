require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
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

    // Пробуем два пути: в папке public и в корне
    const pathsToTry = [`public/${filename}`, filename];
    let successfulUrl = null;
    let sha = null;

    try {
        for (const path of pathsToTry) {
            const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
            try {
                const getFile = await axios.get(url, { headers });
                sha = getFile.data.sha;
                successfulUrl = url;
                break; // Нашли файл!
            } catch (err) {
                continue; // Пробуем следующий путь
            }
        }

        if (!successfulUrl) {
            return res.status(404).json({ error: `Файл ${filename} не знайдено ні в /public, ні в корені репозиторію!` });
        }

        // Обновляем файл по найденному пути
        await axios.put(successfulUrl, {
            message: 'Admin update',
            content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
            sha: sha
        }, { headers });

        res.json({ success: true });

    } catch (e) {
        const gitError = e.response?.data?.message || e.message;
        res.status(500).json({ error: `GitHub API Error: ${gitError}` });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server live on ${PORT}`));