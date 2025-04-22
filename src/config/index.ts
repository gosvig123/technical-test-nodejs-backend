/**
 * Centralized configuration file for all environment variables
 */
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Application configuration
 */
export const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 8000,
  },
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://test_user:test_pass@localhost:5432/test_db',
  },
  
  // API configuration
  api: {
    key: process.env.VERY_SECRET_API_KEY || 'default_api_key_for_development',
  },
  
  // LLM configuration
  llm: {
    apiKey: process.env.NEBIUS_API_KEY || '',
    baseUrl: 'https://api.studio.nebius.com/v1/',
    modelName: 'meta-llama/Llama-3.3-70B-Instruct',
    temperature: 0,
  },
  
  // Agent configuration
  agent: {
    confidenceThreshold: 0.4,
  },
};
