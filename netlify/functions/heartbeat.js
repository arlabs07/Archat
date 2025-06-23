// Import 'get' and 'set' functions from the @netlify/blobs library
const { get, set } = require('@netlify/blobs');

// Define the threshold for considering a user online (e.g., 20 seconds).
// If a heartbeat isn't received within this time, the user might be considered offline.
const ONLINE_THRESHOLD_MS = 20 * 1000; // 20 seconds

// Main handler for the Netlify Function
exports.handler = async (event, context) => {
    // Ensure the request method is POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Parse the user data from the request body
        const { userId, userName, timestamp } = JSON.parse(event.body);

        // Basic validation for required user data
        if (!userId || !userName || !timestamp) {
            return {
                statusCode: 400, // Bad Request
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: 'Missing required user data for heartbeat.' })
            };
        }

        // Get the current map of online users from the 'online-users' blob.
        // It's a map where keys are userId and values are user objects with lastSeen timestamp.
        const blobData = await get('online-users', { type: 'json' });
        let onlineUsers = blobData || {}; // Initialize as an empty object if no blob data exists

        // Update the current user's lastSeen timestamp.
        onlineUsers[userId] = { userName, lastSeen: timestamp };

        // Optional: Clean up stale users from the map.
        // This removes users who haven't sent a heartbeat for a longer duration
        // (e.g., twice the online threshold to avoid immediate removal).
        const now = new Date().getTime();
        for (const id in onlineUsers) {
            if (now - new Date(onlineUsers[id].lastSeen).getTime() > ONLINE_THRESHOLD_MS * 2) {
                delete onlineUsers[id]; // Remove inactive user
            }
        }

        // Save the updated online users map back to the 'online-users' blob
        await set('online-users', JSON.stringify(onlineUsers), { type: 'json' });

        // Return a success response
        return {
            statusCode: 200, // OK
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        // Log and return error details
        console.error('Error sending heartbeat:', error);
        return {
            statusCode: 500, // Internal Server Error
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ error: 'Failed to send heartbeat', details: error.message })
        };
    }
};
