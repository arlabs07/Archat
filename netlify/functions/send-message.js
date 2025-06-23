// Import 'get' and 'set' functions from the @netlify/blobs library
const { get, set } = require('@netlify/blobs');

// Main handler for the Netlify Function
exports.handler = async (event, context) => {
    // Ensure the request method is POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Parse the incoming message from the request body (which is a JSON string)
        const newMessage = JSON.parse(event.body);

        // Basic validation: Check if essential message fields are present
        if (!newMessage.id || !newMessage.userId || !newMessage.userName || !newMessage.text || !newMessage.timestamp) {
            return {
                statusCode: 400, // Bad Request
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: 'Missing required message fields.' })
            };
        }

        // Get the current list of messages from the 'chat-messages' blob
        const blobData = await get('chat-messages', { type: 'json' });
        // Initialize messages as an array; if blobData is null/undefined, start with an empty array
        const messages = blobData && Array.isArray(blobData) ? blobData : [];

        // Add the new message to the end of the messages array
        messages.push(newMessage);

        // Optional: Limit the number of messages stored to prevent the blob from growing too large.
        // This keeps only the latest 100 messages. Adjust as needed.
        const MAX_MESSAGES = 100;
        if (messages.length > MAX_MESSAGES) {
            messages.splice(0, messages.length - MAX_MESSAGES); // Remove older messages from the beginning
        }

        // Save the updated array of messages back to the 'chat-messages' blob
        // The content must be stringified back to JSON before setting.
        await set('chat-messages', JSON.stringify(messages), { type: 'json' });

        // Return a success response
        return {
            statusCode: 200, // OK
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ success: true, message: 'Message sent successfully.' })
        };
    } catch (error) {
        // Log and return error details if something goes wrong
        console.error('Error sending message:', error);
        return {
            statusCode: 500, // Internal Server Error
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ error: 'Failed to send message', details: error.message })
        };
    }
};
