const { CosmosClient } = require('@azure/cosmos');

const MAX_ENTRIES = 10;

async function saveContextData(contextData) {
    try {
        const client = new CosmosClient({
            endpoint: process.env.COSMOS_ENDPOINT.trim(),
            key: process.env.COSMOS_KEY.trim()
        });

        const database = client.database(process.env.COSMOS_DATABASE);
        const container = database.container('user_history');

        console.log('Processing data for user:', contextData.user_id);

        // Prepare new history entry
        const newEntry = {
            timestamp: new Date().toISOString(),
            query: contextData.query || '',
            response: contextData.response || {},
            sessionId: contextData.sessionId || ''
        };

        let existingDoc;
        try {
            // Try to read existing document
            const { resource } = await container.item(contextData.user_id, contextData.user_id).read();
            existingDoc = resource;
            console.log('Found existing document:', JSON.stringify(existingDoc, null, 2));
        } catch (error) {
            if (error.code !== 404) {
                console.error('Error reading document:', error);
                throw error;
            }
        }

        if (existingDoc) {
            console.log('Updating existing document');
            
            // Ensure history is an array
            const history = Array.isArray(existingDoc.history) ? existingDoc.history : [];
            history.unshift(newEntry);

            const updatedDoc = {
                id: contextData.user_id,
                user_id: contextData.user_id,
                email: contextData.email || existingDoc.email || '',
                userName: contextData.userName || existingDoc.userName || '',
                history: history.slice(0, MAX_ENTRIES),
                lastUpdated: new Date().toISOString()
            };

            console.log('Updating document with:', JSON.stringify(updatedDoc, null, 2));
            const { resource: result } = await container.item(contextData.user_id, contextData.user_id)
                .replace(updatedDoc);
            
            console.log('Document updated successfully');
            return result;
        } else {
            console.log('Creating new document');
            const newDoc = {
                id: contextData.user_id,
                user_id: contextData.user_id,
                email: contextData.email || '',
                userName: contextData.userName || '',
                history: [newEntry],
                created: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };

            console.log('Creating document with:', JSON.stringify(newDoc, null, 2));
            const { resource: result } = await container.items.create(newDoc);
            console.log('New document created successfully');
            return result;
        }

    } catch (error) {
        console.error('Cosmos DB Error Details:', {
            message: error.message,
            code: error.code,
            details: error.body,
            user_id: contextData.user_id
        });
        throw new Error(`Failed to save chat history: ${error.message}`);
    }
}

module.exports = { saveContextData };
