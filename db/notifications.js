const AWS = require('aws-sdk');
const uuidv4 = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient({
    endpoint: undefined,
    region: "eu-central-1",
    httpOptions: {
        timeout: 2000,
    },
    maxRetries: 2
});

const NOTIFICATION_TABLE = process.env.NOTIFICATION_TABLE;

const getNotifications = async (email) => {
    const params = {
        TableName: NOTIFICATION_TABLE,
        FilterExpression: "#e = :e AND #r = :r",
        ExpressionAttributeNames: {
            "#e": "email",
            "#r": "read"
        },
        ExpressionAttributeValues: { ":e": email, ":r": false }
    };

    try {
        const allItems = [];
        let items;
        do {
            items = await dynamodb.scan(params).promise();
            items.Items.forEach((item) => allItems.push(item));
            // Set the ExclusiveStartKey to continue scanning if more items are available
            params.ExclusiveStartKey = items.LastEvaluatedKey;
        } while (typeof items.LastEvaluatedKey !== "undefined");

        return allItems;
    } catch (error) {
        console.error("Error scanning DynamoDB table: ", error);
        throw new Error("Error scanning DynamoDB table");
    }
}

const setReadNotification = async (id) => {
    const updateUserParams = {
        TableName: NOTIFICATION_TABLE,
        Key: {
            'id': id,
        },
        UpdateExpression: 'set #r = :r',
        ExpressionAttributeNames: {
            '#r': 'read',
        },
        ExpressionAttributeValues: {
            ':r': true,
        },
        ReturnValues: 'UPDATED_NEW'
    };
    try {
        return await dynamodb.update(updateUserParams).promise();
    } catch (error) {
        console.error("Error updating DynamoDB table: ", error);
        throw new Error("Error updating DynamoDB table");
    }
}

const addNotification = async (notification, user_id) => {
    const createUserParams = {
        TableName: NOTIFICATION_TABLE,
        Item: {
            'id': uuidv4.v4(),
            'email': user_id,
            'notification': JSON.stringify(notification),
            'read': false,
            'created_at': new Date().toISOString()
        }
    };
    console.log(createUserParams);
    try {
        const ret = await dynamodb.put(createUserParams).promise();
    } catch (error) {
        console.error("Error updating DynamoDB table: ", error);
        throw new Error("Error updating DynamoDB table");
    }
}


module.exports = { addNotification, setReadNotification, getNotifications };