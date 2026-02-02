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

    try {
        const filePath = `public/${filename}`;
        const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;
        const headers = {
            Authorization: `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        // 1. Получаем SHA файла
        let sha;
        try {
            const getFile = await axios.get(url, { headers });
            sha = getFile.data.sha;
        } catch (err) {
            return res.status(404).json({ error: `Файл ${filename} не знайдено в репозиторії!` });
        }

        // 2. Обновляем файл
        await axios.put(url, {
            message: 'Admin update from shop',
            content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
            sha: sha
        }, { headers });

        res.json({ success: true });

    } catch (e) {
        // Выводим РЕАЛЬНУЮ причину от GitHub
        const gitError = e.response?.data?.message || e.message;
        console.error('GitHub Error:', gitError);
        res.status(500).json({ error: `GitHub API: ${gitError}` });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server live on ${PORT}`));