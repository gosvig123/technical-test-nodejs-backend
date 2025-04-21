import { ChatOpenAI } from "@langchain/openai";
import { SqlDatabase } from "langchain/sql_db";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import prisma from '../db/index.js';
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Function to initialize the database and create the chain
const initializeAgent = async () => {
    try {
        // Use SqlDatabase with direct connection details
        const db = await SqlDatabase.fromDataSourceParams({
            appDataSource: prisma,
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
        const sqlQuery = await chain.invoke(query);
        return sqlQuery;
    } catch (error) {
        console.error("Error running agent query:", error);
        throw error;
    }
};

export { initializeAgent, queryAgent };
