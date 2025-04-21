import { Router, Request, Response } from 'express';
import { runLangChainAgent } from '../../agent/agent.js';



const router = Router();



/**
 * Route for querying the database using the LLM-powered agent
 * This uses a multi-step reasoning process:
 * 1. Analyze the question
 * 2. Generate SQL query
 * 3. Execute SQL query
 * 4. Generate natural language answer
 */
router.post('/query', async (req: Request, res: Response) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required in the request body.' });
    }

    // Run the agent and return the result
    const result = await runLangChainAgent(query);

    if (result.error) {
        return res.status(500).json({ error: result.error });
    }

    // Convert any BigInt values to strings before sending the response
    const safeResult = {
        answer: result.answer,
    };

    res.json(safeResult);
});

export default router;