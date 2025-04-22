import prisma from '../../db/index.js';

/**
 * Interface for SQL query result
 */
export interface ISqlQueryResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    query?: string;
}

/**
 * Validates a SQL query to ensure it's safe to execute
 * @param query The SQL query to validate
 * @returns Validation result with isValid flag and optional error message
 */
export const validateSqlQuery = (query: string): { isValid: boolean; error?: string } => {
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
};

/**
 * Safely executes a read-only SQL query
 * @param sqlQuery The SQL query to execute
 * @returns The query result
 */
export const executeSafeReadQuery = async <T = Record<string, string>>(sqlQuery: string): Promise<ISqlQueryResult<T>> => {
    try {
        // Add validation check
        const validation = validateSqlQuery(sqlQuery);
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
};

/**
 * Safely stringify objects with BigInt values
 * @param obj The object to stringify
 * @returns The stringified object
 */
export const safeStringify = (obj: Record<string, string> | Record<string, string>[]): string => {
    return JSON.stringify(obj, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
    );
};
