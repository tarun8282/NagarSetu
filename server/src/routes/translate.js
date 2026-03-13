const express = require('express');
const router = express.Router();

/**
 * @route POST /api/translate
 * @desc Translate text to target language
 */
router.post('/', async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;

        if (!text || !targetLanguage) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: text and targetLanguage'
            });
        }

        // If target is English, return original text
        if (targetLanguage === 'en') {
            return res.json({
                success: true,
                translatedText: text
            });
        }

        // Use LibreTranslate API (free and open source)
        // Or use Google Translate API via free service
        const translateText = async (sourceText, target) => {
            try {
                // Using LibreTranslate free API
                const response = await fetch('https://libretranslate.de/translate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        q: sourceText,
                        source: 'en',
                        target: target
                    })
                });

                const data = await response.json();
                return data.translatedText || sourceText;
            } catch (error) {
                console.error('Translation service error:', error);
                return sourceText;
            }
        };

        const translatedText = await translateText(text, targetLanguage);

        res.json({
            success: true,
            translatedText: translatedText || text
        });
    } catch (error) {
        console.error('Translation Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Translation failed'
        });
    }
});

module.exports = router;
