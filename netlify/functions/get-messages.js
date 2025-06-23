// Import the 'get' function from the @netlify/blobs library
const { get } = require('@netlify/blobs');

// Main handler for the Netlify Function
exports.handler = async (event, context) => {
    try {
        // Attempt to retrieve the 'chat-messages' blob.
        // The 'type: json' option automatically parses the content as JSON.
        // It's crucial that the NETLIFY_BLOBS_CONTEXT environment variable
        // is set in netlify.toml for this to connect to your blob store.
        const blobData = await get('chat-messages', { type: 'json' });

        // Ensure blobData is an array. If it's null (no blob yet) or not an array,
        // initialize it as an empty array to prevent errors.
        const messages = blobData && Array.isArray(blobData) ? blobData : [];

        // Return a successful HTTP response with the messages as JSON
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json" // Indicate JSON response
            },
            body: JSON.stringify({ messages }) // Convert messages array to JSON string
        };
    } catch (error) {
        // Log any errors that occur during the process
        console.error('Error fetching messages:', error);
        // Return an error HTTP response
        return {
            statusCode: 500, // Internal Server Error
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ error: 'Failed to fetch messages', details: error.message })
        };
    }
};
