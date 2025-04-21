import { OpenAI } from 'openai';
import prisma from '../db/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.NEBIUS_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.studio.nebius.com/v1/',
});

// Function to get database schema information
const getCustomerDatabaseSchema = async () => {
    try {
        // Create schema description based on known schema
        const schema = `
            Table: customer
            Columns: id (integer), name (string), email (string)

            Table: address
            Columns: id (integer), customer_id (integer), type (string), street (string), city (string), zip (string), country (string)

            Table: orders
            Columns: id (integer), customer_id (integer), order_date (date), total_amount (decimal)

            Relationships:
            - customer has many address (one-to-many relationship via customer_id)
            - customer has many orders (one-to-many relationship via customer_id)
        `;

        return schema;
    } catch (error) {
        console.error('Error getting database schema:', error);
        throw error;
    }
};

// Function to execute SQL query using Prisma
const executeSafeReadQuery = async (sqlQuery: string) => {
    try {
        // For safety, only allow SELECT queries
        if (!sqlQuery.trim().toLowerCase().startsWith('select')) {
            throw new Error('Only SELECT queries are allowed');
        }

        // Execute raw query using Prisma
        const result = await prisma.$queryRawUnsafe(sqlQuery);
        return result;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
};

// Main function to process natural language query
const naturalLanguageToSqlQuery = async (query: string) => {
    try {
        // Get database schema
        const schema = await getCustomerDatabaseSchema();

        // Generate SQL query using OpenAI
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'meta-llama/Llama-3.3-70B-Instruct',
            temperature: 0,
            messages: [
                {
                    role: 'system',
                    content: `You are an AI assistant that translates natural language questions into SQL queries based on the provided database schema. Only respond with the SQL query, nothing else.`
                },
                {
                    role: 'user',
                    content: `Database schema:\n${schema}\n\nQuestion: ${query}\n\nSQL Query:`
                }
            ]
        });

        // Extract SQL query from response
        const sqlQuery = completion.choices[0].message.content?.trim() || '';
        console.log('Generated SQL query:', sqlQuery);

        // Execute the query
        const result = await executeSafeReadQuery(sqlQuery);

        return {
            sqlQuery,
            result
        };
    } catch (error) {
        console.error('Error in naturalLanguageToSqlQuery:', error);
        throw error;
    }
};

// Export the naturalLanguageToSqlQuery function
export { naturalLanguageToSqlQuery };
