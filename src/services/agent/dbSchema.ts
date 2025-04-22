import { Prisma } from '../../../generated/prisma/index.js';

/**
 * Get a formatted database schema string for use in prompts
 * This method dynamically extracts schema information from Prisma's metadata
 * @returns A string representation of the database schema
 */
export const getDatabaseSchemaForPrompt = (): string => {
    // Get DMMF data once
    const dmmf = Prisma.dmmf;
    let schema = '';

    // Map Prisma types to SQL types
    const typeMap: Record<string, string> = {
        'Int': 'integer',
        'String': 'string',
        'Boolean': 'boolean',
        'DateTime': 'date',
        'Float': 'decimal',
        'Decimal': 'decimal'
    };

    // Process all models
    for (const model of dmmf.datamodel.models) {
        const modelName = model.name;
        schema += `Table: ${modelName}\n`;

        // Extract column information
        const columnStrings = model.fields
            .filter(field => field.kind === 'scalar')
            .map(field => `${field.name} (${typeMap[field.type] || 'string'})`);

        schema += `Columns: ${columnStrings.join(', ')}\n\n`;
    }

    // Add relationships section
    schema += 'Relationships:\n';

    // Process relationships
    for (const model of dmmf.datamodel.models) {
        const modelName = model.name.toLowerCase();

        // Find and process relation fields
        const relationFields = model.fields.filter(field => field.kind === 'object');

        for (const field of relationFields) {
            const targetModel = field.type.toLowerCase();
            const relationType = field.isList ? 'one-to-many' : 'many-to-one';
            const typeStr = field.isList ? 'has many' : 'belongs to';

            schema += `- ${modelName} ${typeStr} ${targetModel} (${relationType} relationship via ${field.name})\n`;
        }
    }

    return schema;
};
