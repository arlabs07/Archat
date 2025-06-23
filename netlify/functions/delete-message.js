// Import 'get' and 'set' functions from the @netlify/blobs library
const { get, set } = require('@netlify/blobs');

// Main handler for the Netlify Function
exports.handler = async (event, context) => {
    // Ensure the request method is POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Parse the messageId and userId from the request body
        const { messageId, userId } = JSON.parse(event.body);

        // Basic validation for required parameters
        if (!messageId || !userId) {
            return {
                statusCode: 400, // Bad Request
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: 'Missing message ID or user ID for deletion.' })
            };
        }

        // Get the current list of messages
        const blobData = await get('chat-messages', { type: 'json' });
        let messages = blobData && Array.isArray(blobData) ? blobData : [];

        // Find the index of the message to delete by its ID
        const messageIndex = messages.findIndex(msg => msg.id === messageId);

        // If message not found, return 404
        if (messageIndex === -1) {
            return {
                statusCode: 404, // Not Found
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: 'Message not found.' })
            };
        }

        // Authorization check: Ensure the userId requesting deletion matches the message's original sender
        if (messages[messageIndex].userId !== userId) {
            return {
                statusCode: 403, // Forbidden
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: 'You can only delete your own messages.' })
            };
        }

        // Remove the message from the array using splice
        messages.splice(messageIndex, 1);

        // Save the updated messages array back to the blob
        await set('chat-messages', JSON.stringify(messages), { type: 'json' });

        // Return a success response
        return {
            statusCode: 200, // OK
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ success: true, message: 'Message deleted successfully.' })
        };
    } catch (error) {
        // Log and return error details
        console.error('Error deleting message:', error);
        return {
            statusCode: 500, // Internal Server Error
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ error: 'Failed to delete message', details: error.message })
        };
    }
};
