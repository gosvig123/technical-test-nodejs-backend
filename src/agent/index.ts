import { ChatOpenAI } from "@langchain/openai";
import { SqlDatabase } from "langchain/sql_db";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { PrismaClient } from "@prisma/client";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Function to initialize the database and create the chain
const initializeAgent = async () => {
    try {
        // Use SqlDatabase with PrismaClient
        const db = await SqlDatabase.fromDataSourceParams({
            appDataSource: prisma, // Pass PrismaClient instance
        });

        const model = new ChatOpenAI({ temperature: 0 });

        // Get table information to include in the prompt
        const tableInfo = await db.getTableInfo();

        // Define the prompt template
        const prompt = PromptTemplate.fromTemplate(`
            You are an AI assistant that translates natural language questions into SQL queries based on the provided database schema.
            The database schema is as follows:
            {table_info}

            Based on the schema, write a SQL query to answer the following question:
            {query}

            SQL Query:
        `);

        // Create the chain
        const chain = RunnableSequence.from([
            {
                table_info: () => tableInfo,
                query: (input: string) => input,
            },
            prompt,
            model,
            new StringOutputParser(),
            // Optional: Add a step here to execute the SQL query using db.run()
            // This would require parsing the SQL query from the model's output
            // and handling the results. For a basic implementation, we'll return the SQL query.
        ]);

        return chain;
    } catch (error) {
        console.error("Error initializing agent:", error);
        throw error;
    }
};


const queryAgent = async (query: string) => {
    const chain = await initializeAgent();
    try {
        // The chain now returns the generated SQL query as a string
        const sqlQuery = await chain.invoke(query);
        // For a basic implementation, we will return the generated SQL query.
        // In a full implementation, you would execute this query against the database
        // and return the results.
        return sqlQuery;
    } catch (error) {
        console.error("Error running agent query:", error);
        throw error;
    }
};

export { initializeAgent, queryAgent };