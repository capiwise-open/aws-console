const notifications = require("./db/notifications");
const utility = require('./util');

const getNotifications = async (event) => {
    try {
        const { email } = event.queryStringParameters;
        const data = await notifications.getNotifications(email);
        return {
            statusCode: 200,
            headers: utility.getResponseHeaders(),
            body: JSON.stringify(data),
        };
    } catch (e) {
        return {
            statusCode: 500,
            headers: utility.getResponseHeaders(),
            body: JSON.stringify(e),
        };
    }
}

const setNotification = async (event) => {
    try {
        const requestBody = JSON.parse(event.body);
        const { id } = requestBody;
        await notifications.setReadNotification(id);
        return {
            statusCode: 200,
            headers: utility.getResponseHeaders(),
        }
    } catch (e) {
        return {
            statusCode: 500,
            headers: utility.getResponseHeaders(),
            body: JSON.stringify(e),
        };
    }
}

const addNotification = async (event) => {
    try {
        const requestBody = JSON.parse(event.body);
        const { notification, user_id } = requestBody
        await notifications.addNotification(notification, user_id);
        return {
            statusCode: 200,
            headers: utility.getResponseHeaders(),
        }
    } catch (e) {
        return {
            statusCode: 500,
            headers: utility.getResponseHeaders(),
            body: JSON.stringify(e),
        };
    }
}

module.exports = { getNotifications, setNotification, addNotification };