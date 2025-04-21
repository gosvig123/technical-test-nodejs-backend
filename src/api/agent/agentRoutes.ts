import { Router, Request, Response } from 'express';
import { naturalLanguageToSqlQuery } from '../../agent/index.js'; // Import the queryAgent function

const router = Router();

router.post('/query', async (req: Request, res: Response) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required in the request body.' });
    }

    try {
        const result = await naturalLanguageToSqlQuery(query);
        if (!result || !result.result || (Array.isArray(result.result) && result.result.length === 0)) {
            res.status(404).json({ message: 'No data found for your query.' });
        } else {
            res.json({
                result: result.result
            });
        }
    } catch (error) {
        console.error('Error processing agent query:', error);
        res.status(500).json({ error: 'An error occurred while processing your query.' });
    }
});

export default router;