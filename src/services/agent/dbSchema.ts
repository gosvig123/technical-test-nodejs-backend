import { Prisma } from '../../../generated/prisma/index.js';

/**
 * Get a formatted database schema string for use in prompts
 * This method dynamically extracts schema information from Prisma's metadata
 * @returns A string representation of the database schema
 */
export const getDatabaseSchemaForPrompt = (): string => {
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
};
