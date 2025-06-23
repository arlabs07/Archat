// Import 'get' and 'set' functions from the @netlify/blobs library
const { get, set } = require('@netlify/blobs');

// Main handler for the Netlify Function
exports.handler = async (event, context) => {
    // Ensure the request method is POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Parse the messageId and emoji from the request body
        const { messageId, emoji } = JSON.parse(event.body);

        // Basic validation for required parameters
        if (!messageId || !emoji) {
            return {
                statusCode: 400, // Bad Request
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: 'Missing message ID or emoji for reaction.' })
            };
        }

        // Get the current list of messages
        const blobData = await get('chat-messages', { type: 'json' });
        let messages = blobData && Array.isArray(blobData) ? blobData : [];

        // Find the index of the message to which the reaction is being added
        const messageIndex = messages.findIndex(msg => msg.id === messageId);

        // If message not found, return 404
        if (messageIndex === -1) {
            return {
                statusCode: 404, // Not Found
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: 'Message not found for reaction.' })
            };
        }

        // Get a reference to the message object to update
        const messageToUpdate = messages[messageIndex];

        // Initialize the 'reactions' object if it doesn't exist on the message
        if (!messageToUpdate.reactions) {
            messageToUpdate.reactions = {};
        }

        // Increment the count for the specific emoji, or initialize to 1 if it's the first reaction
        messageToUpdate.reactions[emoji] = (messageToUpdate.reactions[emoji] || 0) + 1;

        // Ensure the updated message object is placed back into the array (important for primitives)
        messages[messageIndex] = messageToUpdate;

        // Save the updated messages array back to the blob
        await set('chat-messages', JSON.stringify(messages), { type: 'json' });

        // Return a success response
        return {
            statusCode: 200, // OK
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ success: true, message: 'Reaction added successfully.' })
        };
    } catch (error) {
        // Log and return error details
        console.error('Error adding reaction:', error);
        return {
            statusCode: 500, // Internal Server Error
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ error: 'Failed to add reaction', details: error.message })
        };
    }
};
