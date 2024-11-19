const AWS = require("aws-sdk");

const PROFILE_TABLE = process.env.PROFILE_TABLE;
const ALERT_TABLE = process.env.ALERT_TABLE;

const dynamodb = new AWS.DynamoDB.DocumentClient({
    endpoint: undefined,
    region: "eu-central-1",
    httpOptions: {
        timeout: 2000,
    },
    maxRetries: 2
});

const getWatchlist = async (email) => {
    let ret = [];
    try {
        if (!email)
            return null;
        const params = {
            TableName: PROFILE_TABLE,
            FilterExpression: "#e = :e",
            ExpressionAttributeNames: {
                "#e": "email",
            },
            ExpressionAttributeValues: { ":e": email }
        };
        const alertData = await dynamodb.scan(params).promise();

        if (alertData.Count > 0) {
            // console.log(alertData.Items[0], alertData.Items[0].watchlist, typeof alertData.Items[0].watchlist);
            ret = alertData.Items[0].watchlist;
            // console.log("$$$", ret);
        }
        return ret;
    } catch (error) {
        console.error("Database error:", error);
        return null;
    }
}

const getAllUsers = async () => {
    const params = {
        TableName: PROFILE_TABLE
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

const getAllAlerts = async () => {
    const params = {
        TableName: ALERT_TABLE
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

        console.log(allItems);
        return allItems;
    } catch (error) {
        console.error("Error scanning DynamoDB table: ", error);
        throw new Error("Error scanning DynamoDB table");
    }
}

module.exports = {
    getWatchlist,
    getAllUsers,
    getAllAlerts
}