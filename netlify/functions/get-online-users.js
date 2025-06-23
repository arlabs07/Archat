// Import the 'get' function from the @netlify/blobs library
const { get } = require('@netlify/blobs');

// Define the threshold for considering a user online (must match heartbeat.js)
const ONLINE_THRESHOLD_MS = 20 * 1000; // 20 seconds

// Main handler for the Netlify Function
exports.handler = async (event, context) => {
    try {
        // Get the current map of online users from the 'online-users' blob
        const blobData = await get('online-users', { type: 'json' });
        const onlineUsersMap = blobData || {}; // Initialize as empty object if no data

        const now = new Date().getTime(); // Current timestamp in milliseconds
        const activeUsers = []; // Array to store currently active users

        // Iterate through the onlineUsersMap
        for (const userId in onlineUsersMap) {
            const user = onlineUsersMap[userId];
            // Check if the user's last heartbeat was within the defined ONLINE_THRESHOLD_MS
            if (now - new Date(user.lastSeen).getTime() < ONLINE_THRESHOLD_MS) {
                // If active, add their userId and userName to the list of active users
                activeUsers.push({ userId: userId, userName: user.userName });
            }
        }

        // Return a successful HTTP response with the list of online users
        return {
            statusCode: 200, // OK
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ onlineUsers: activeUsers })
        };
    } catch (error) {
        // Log and return error details
        console.error('Error fetching online users:', error);
        return {
            statusCode: 500, // Internal Server Error
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ error: 'Failed to fetch online users', details: error.message })
        };
    }
};
