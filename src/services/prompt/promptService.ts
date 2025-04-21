import { PromptTemplate } from '@langchain/core/prompts';

/**
 * Interface for prompt templates
 */
export interface IPromptTemplates {
  analyzePrompt: PromptTemplate;
  sqlPrompt: PromptTemplate;
  answerPrompt: PromptTemplate;
}

/**
 * Class for managing prompt templates
 */
export class PromptService {
  private static readonly ANALYZE_PROMPT_TEMPLATE = `You are an AI assistant that helps analyze database questions.
Given a question about customer data and the database schema, analyze if the question is related to the database and provide a confidence score.

IMPORTANT:
- Analyze if the question is related to customer data, orders, or addresses
- Provide a confidence score from 0 to 1 at the start of your response in the format [CONFIDENCE: X.XX]
- Score 0.0 for completely unrelated questions or greetings
- Score 0.1-0.3 for vague or unclear questions
- Score 0.4-0.7 for somewhat related questions that need clarification
- Score 0.8-1.0 for clear, specific questions about the database

Database schema:
{schema}

Question: {question}

Provide your confidence score and analysis:`;

  private static readonly SQL_PROMPT_TEMPLATE = `You are an AI assistant that translates natural language questions into SQL queries.
Given the database schema and a question, generate a SQL query that will answer the question.

IMPORTANT RULES:
1. Only generate SELECT queries - no INSERT, UPDATE, DELETE, or other modifying queries
2. Make sure your query has proper SELECT and FROM clauses
3. Only respond with the raw SQL query, nothing else - no markdown, no code blocks, no backticks
4. Do not use any SQL features that might not be supported in PostgreSQL
5. Ensure your query is syntactically correct and executable
6. Do not include multiple queries or semicolons
7. Make sure all quotes are properly closed - every opening quote must have a matching closing quote
8. When using string literals, ensure they are properly quoted: 'example'
9. Use lowercase table and column names to match the database schema

Database schema:
{schema}

Question: {question}

Previous analysis: {analysis}

SQL Query (write only the raw query):`;

  private static readonly ANSWER_PROMPT_TEMPLATE = `You are an AI assistant that explains database query results in natural language.
Given a question, SQL query, and query result, provide a clear answer to the original question.

Question: {question}

SQL Query: {sqlQuery}

Query Result: {queryResult}

Please explain these results in a clear, natural way:`;

  /**
   * Creates prompt templates using the provided database schema
   * @param schema The database schema to use in the prompts
   * @returns The prompt templates
   */
  public static createPromptTemplates(): IPromptTemplates {
    // Use the schema string directly in the prompt templates
    return {
      analyzePrompt: PromptTemplate.fromTemplate(this.ANALYZE_PROMPT_TEMPLATE),
      sqlPrompt: PromptTemplate.fromTemplate(this.SQL_PROMPT_TEMPLATE),
      answerPrompt: PromptTemplate.fromTemplate(this.ANSWER_PROMPT_TEMPLATE)
    };
  }
}
