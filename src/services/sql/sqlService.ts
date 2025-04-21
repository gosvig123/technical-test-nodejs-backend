import prisma from '../../db/index.js';
import { Prisma } from '../../../generated/prisma/index.js';

/**
 * Interface for SQL query result
 */
export interface ISqlQueryResult<T = any> {
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
   * @param sqlQuery The SQL query to validate
   * @returns Validation result with isValid flag and optional error message
   */
  public static validateSqlQuery(sqlQuery: string): { isValid: boolean; error?: string } {
    if (!sqlQuery || sqlQuery.trim() === '') {
      return { isValid: false, error: 'SQL query is empty' };
    }

    // Check if the query starts with SELECT
    if (!sqlQuery.trim().toUpperCase().startsWith('SELECT')) {
      return { isValid: false, error: 'Only SELECT queries are allowed' };
    }

    // Check for multiple queries (semicolons not at the end)
    const trimmedQuery = sqlQuery.trim();
    const semicolonIndex = trimmedQuery.indexOf(';');
    if (semicolonIndex !== -1 && semicolonIndex !== trimmedQuery.length - 1) {
      return { isValid: false, error: 'Multiple queries are not allowed' };
    }

    // Check for balanced quotes
    const singleQuoteCount = (sqlQuery.match(/'/g) || []).length;
    if (singleQuoteCount % 2 !== 0) {
      return { isValid: false, error: 'Unbalanced single quotes in query' };
    }

    const doubleQuoteCount = (sqlQuery.match(/"/g) || []).length;
    if (doubleQuoteCount % 2 !== 0) {
      return { isValid: false, error: 'Unbalanced double quotes in query' };
    }

    return { isValid: true };
  }

  /**
   * Cleans up a SQL query by removing markdown formatting and fixing common syntax issues
   * @param sqlQuery The SQL query to clean up
   * @returns The cleaned SQL query
   */
  public static cleanupSqlQuery(sqlQuery: string): string {
    if (!sqlQuery) return '';

    let cleaned = sqlQuery;

    // Remove markdown code block syntax and formatting
    cleaned = cleaned.replace(/```sql\s*/gi, '');
    cleaned = cleaned.replace(/```\s*$/g, '');
    cleaned = cleaned.replace(/```/g, '');
    cleaned = cleaned.replace(/^sql\s+/i, '');
    cleaned = cleaned.replace(/^`+|`+$/g, '');
    cleaned = cleaned.replace(/^['"]|['"]+$/g, '');

    // Fix common SQL syntax issues
    cleaned = cleaned.replace(/WHERE\s+([\w.]+)\s*=\s*'([\w\s]+)(?!')(?=\s+(?:AND|OR|GROUP|ORDER|HAVING|LIMIT|$))/gi, "WHERE $1 = '$2'");
    cleaned = cleaned.replace(/WHERE\s+([\w.]+)\s*LIKE\s*'([\w\s%]+)(?!')(?=\s+(?:AND|OR|GROUP|ORDER|HAVING|LIMIT|$))/gi, "WHERE $1 LIKE '$2'");
    cleaned = cleaned.replace(/=\s*'([^']+)(?!')/g, "= '$1'");
    cleaned = cleaned.replace(/LIKE\s*'([^']+)(?!')/g, "LIKE '$1'");
    cleaned = cleaned.replace(/JOIN\s+([\w.]+)\s+ON\s+([\w.]+)\s*=\s*'([\w\s]+)(?!')(?=\s+(?:AND|OR|WHERE|JOIN|GROUP|ORDER|HAVING|LIMIT|$))/gi, "JOIN $1 ON $2 = '$3'");

    // Ensure quotes are properly paired
    let singleQuoteCount = (cleaned.match(/'/g) || []).length;
    if (singleQuoteCount % 2 !== 0) {
      cleaned = cleaned.replace(/WHERE\s+([\w.]+)\s*=\s*'([^']+)$/i, "WHERE $1 = '$2'");
      cleaned = cleaned.replace(/LIKE\s*'([^']+)$/i, "LIKE '$1'");
      
      singleQuoteCount = (cleaned.match(/'/g) || []).length;
      if (singleQuoteCount % 2 !== 0) {
        cleaned += "'";
      }
    }

    let doubleQuoteCount = (cleaned.match(/"/g) || []).length;
    if (doubleQuoteCount % 2 !== 0) {
      cleaned = cleaned.replace(/WHERE\s+([\w.]+)\s*=\s*"([^"]+)$/i, 'WHERE $1 = "$2"');
      
      doubleQuoteCount = (cleaned.match(/"/g) || []).length;
      if (doubleQuoteCount % 2 !== 0) {
        cleaned += '"';
      }
    }

    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  /**
   * Safely executes a read-only SQL query
   * @param sqlQuery The SQL query to execute
   * @returns The query result
   */
  public static async executeSafeReadQuery<T = any>(sqlQuery: string): Promise<ISqlQueryResult<T>> {
    try {
      // Validate the query
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
  public static safeStringify(obj: any): string {
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
    (Prisma.ModelName as any)[key] as string
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