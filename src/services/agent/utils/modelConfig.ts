/**
 * LLM model configuration and chain setup
 */
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { ANALYZE_PROMPT_TEMPLATE, SQL_PROMPT_TEMPLATE, ANSWER_PROMPT_TEMPLATE } from './prompts.js';
import { formatSchema } from './dbSchema.js';
import { config } from '../../../config/index.js';

// Initialize LangChain model
export const model = new ChatOpenAI({
    apiKey: config.llm.apiKey,
    modelName: config.llm.modelName,
    temperature: config.llm.temperature,
    configuration: {
        baseURL: config.llm.baseUrl
    }
});

// Get database schema for prompts once
export const dbSchema = formatSchema();

// Create prompt templates
export const analyzePrompt = PromptTemplate.fromTemplate(ANALYZE_PROMPT_TEMPLATE);
export const sqlPrompt = PromptTemplate.fromTemplate(SQL_PROMPT_TEMPLATE);
export const answerPrompt = PromptTemplate.fromTemplate(ANSWER_PROMPT_TEMPLATE);

// Create the chains
export const analyzeChain = analyzePrompt.pipe(model).pipe(new StringOutputParser());
export const sqlChain = sqlPrompt.pipe(model).pipe(new StringOutputParser());
export const answerChain = answerPrompt.pipe(model).pipe(new StringOutputParser());
