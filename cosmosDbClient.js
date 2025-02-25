const { CosmosClient } = require('@azure/cosmos');

const endpoint = process.env.COSMOS_ENDPOINT; // Set this in your .env or environment variables
const key = process.env.COSMOS_KEY;
const client = new CosmosClient({ endpoint, key });

const databaseId = "chatbot_db"; // Change to your DB name
const containerId = "user_feedback"; // Change to your container name


async function saveFeedback(feedbackData) {
    const database = client.database(databaseId);
    const container = database.container(containerId);

    const { resource: createdItem } = await container.items.create(feedbackData);
    return createdItem;
}

module.exports = { saveFeedback };
