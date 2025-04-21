import prisma from '../../db/index.js';
import { Prisma } from '../../../generated/prisma/index.js';

/**
 * Interface for SQL query result
 */
export interface ISqlQueryResult<T = Record<string, string>> {
  success: boolean;
  data?: T;
  error?: string;
  query?: string;
}

/**
 * Class for handling SQL queries with dynamic schema extraction
 */
export class SqlService {
  /**
   * Validates a SQL query
   * @param query The SQL query to validate
   * @returns Validation result with isValid flag and optional error message
   */
  public static validateSqlQuery(query: string): { isValid: boolean; error?: string } {
    // Basic validation checks
    if (!query) {
      return { isValid: false, error: 'Query is empty' };
    }

    // Ensure it's a SELECT query
    if (!query.trim().toLowerCase().startsWith('select')) {
      return { isValid: false, error: 'Only SELECT queries are allowed' };
    }

    // Check for dangerous keywords
    const dangerousKeywords = ['insert', 'update', 'delete', 'drop', 'truncate', 'alter'];
    const hasDisallowedKeywords = dangerousKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
    
    if (hasDisallowedKeywords) {
      return { isValid: false, error: 'Query contains disallowed keywords' };
    }

    return { isValid: true };
  }

  /**
   * Safely executes a read-only SQL query
   * @param sqlQuery The SQL query to execute
   * @returns The query result
   */
  public static async executeSafeReadQuery<T = Record<string, string>>(sqlQuery: string): Promise<ISqlQueryResult<T>> {
    try {
      // Add validation check
      const validation = this.validateSqlQuery(sqlQuery);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          query: sqlQuery
        };
      }

      // Execute the query
      const result = await prisma.$queryRawUnsafe<T>(sqlQuery);
      
      return {
        success: true,
        data: result,
        query: sqlQuery
      };
    } catch (error) {
      console.error('Error executing query:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error executing query';
      
      return {
        success: false,
        error: errorMessage,
        query: sqlQuery
      };
    }
  }

  /**
   * Safely stringify objects with BigInt values
   * @param obj The object to stringify
   * @returns The stringified object
   */
  public static safeStringify(obj: Record<string, string>): string {
    return JSON.stringify(obj, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
  }

/**
 * Get a formatted database schema string for use in prompts
 * This method dynamically extracts schema information from Prisma's metadata
 * @returns A string representation of the database schema
 */
public static getDatabaseSchemaForPrompt(): string {
  // Get model names from Prisma's metadata
  const modelNames = Object.keys(Prisma.ModelName).map(key =>
    (Prisma.ModelName as Record<string, string>)[key]
  );

  let schema = '';

  // Add tables and columns
  for (const modelName of modelNames) {
    schema += `Table: ${modelName}\n`;
    
    // Get column information dynamically from Prisma's DMMF
    const dmmf = Prisma.dmmf;
    const model = dmmf.datamodel.models.find(m => 
      m.name.toLowerCase() === modelName.toLowerCase()
    );
    
    if (model) {
      // Map Prisma types to SQL types
      const typeMap: Record<string, string> = {
        'Int': 'integer',
        'String': 'string',
        'Boolean': 'boolean',
        'DateTime': 'date',
        'Float': 'decimal',
        'Decimal': 'decimal'
      };
      
      // Extract column information
      const columnStrings = model.fields
        .filter(field => field.kind === 'scalar') // Only include scalar fields, not relations
        .map(field => {
          const type = typeMap[field.type] || 'string';
          return `${field.name} (${type})`;
        });
      
      schema += `Columns: ${columnStrings.join(', ')}\n\n`;
    } 
  }

  // Add relationships
  schema += 'Relationships:\n';
  
  // Extract relationships dynamically from DMMF
  const relationships = [];
  const dmmf = Prisma.dmmf;
  
  for (const model of dmmf.datamodel.models) {
    const modelName = model.name.toLowerCase();
    
    // Find relation fields
    const relationFields = model.fields.filter(field => field.kind === 'object');
    
    for (const field of relationFields) {
      const targetModel = field.type.toLowerCase();
      const relationType = field.isList ? 'one-to-many' : 'many-to-one';
      
      relationships.push({
        source: modelName,
        target: targetModel,
        type: relationType,
        field: field.name
      });
    }
  }
  
  // Add relationship strings
  for (const rel of relationships) {
    const typeStr = rel.type === 'one-to-many' ? 'has many' : 'belongs to';
    schema += `- ${rel.source} ${typeStr} ${rel.target} (${rel.type} relationship via ${rel.field})\n`;
  }
  
  
    return schema;
  }
}
