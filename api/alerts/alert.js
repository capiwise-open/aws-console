const AWS = require('aws-sdk');
const uuidv4 = require('uuid');
const { } = require('../../conf');
const utility = require('../../util');
const { sendAlertConfirmation } = require('../email');

const dynamodb = new AWS.DynamoDB.DocumentClient({
    endpoint: undefined,
    region: "eu-central-1",
    httpOptions: {
        timeout: 2000,
    },
    maxRetries: 2
});

const ALERT_TABLE = process.env.ALERT_TABLE;

const triggerAlert = async (event) => {
    const requestBody = JSON.parse(event.body);
    console.log("triggerAlert", requestBody);

    try {
        const { id, triggered_at } = requestBody;
        const updateAlertParams = {
            TableName: ALERT_TABLE,
            Key: {
                'id': id,
            },
            UpdateExpression: 'set #st = :st, #tr = :tr',
            ExpressionAttributeNames: {
                '#st': 'status',
                '#tr': 'triggered_at'
            },
            ExpressionAttributeValues: {
                ':st': false,
                ':tr': triggered_at
            },
            ReturnValues: 'UPDATED_NEW'
        };
        console.log("triggerAlert", updateAlertParams);
        const updatedData = await dynamodb.update(updateAlertParams).promise();
        console.log("triggerAlert-end");
    } catch (e) {}
}

const updateAlert = async (event) => {
    const requestBody = JSON.parse(event.body);
    try {
        const { id, user_id, signal, condition, value, type, email, notification, status, isDeleted = false, identifier, etf = false, triggered_at } = requestBody;

        // Execute the insertion query
        if (!user_id || !identifier) {
            return {
                statusCode: 400,
                headers: utility.getResponseHeaders(),
                body: JSON.stringify({ message: "Please provide user_id and identifier!" }),
            };
        }
        console.log(id, user_id, signal, condition, value, type, email, notification, status, isDeleted, identifier, triggered_at);

        var params = {
            TableName: ALERT_TABLE,
            FilterExpression: "#id = :id AND #u = :user_id AND #i = :identifier AND #d = :d",
            ExpressionAttributeNames: {
                "#id": "id",
                "#u": "user_id",
                "#i": "identifier",
                "#d": "isDeleted"
            },
            ExpressionAttributeValues: {":id": id, ":user_id": user_id, ":identifier": identifier, ":d": false }
        };
        console.log(params);
        const alertData = await dynamodb.scan(params).promise();
        console.log(alertData);
        if (alertData.Count > 0) {
            const currentAlertData = alertData.Items[0];
            const updateAlertParams = {
                TableName: ALERT_TABLE,
                Key: {
                    'id': currentAlertData.id,
                    'identifier': currentAlertData.identifier
                },
                UpdateExpression: 'set #s = :s, #c = :c, #v = :v, #t = :t, #e = :e, #n = :n, #st = :st, #d = :d, #u = :u, #et = :et, #tr = :tr',
                ExpressionAttributeNames: {
                    '#s': 'signal',
                    '#c': 'condition',
                    '#v': 'value',
                    '#t': 'type',
                    '#n': 'notification',
                    '#e': 'email',
                    '#st': 'status',
                    '#d': 'isDeleted',
                    '#u': 'updatedAt',
                    '#et': 'etf',
                    '#tr': 'triggered_at'
                },
                ExpressionAttributeValues: {
                    ':s': signal || currentAlertData.signal,
                    ':c': condition || currentAlertData.condition,
                    ':v': value || currentAlertData.value,
                    ':t': type || currentAlertData.type,
                    ':e': (email === null || email === undefined) ? currentAlertData.email : email,
                    ':n': (notification === null || notification === undefined) ? currentAlertData.notification : notification,
                    ':st': (status === null || status === undefined) ? currentAlertData.status : status,
                    ':d': (isDeleted === null || isDeleted === undefined) ? currentAlertData.isDeleted : isDeleted,
                    ':u': new Date().toISOString(),
                    ':et': etf,
                    ':tr': triggered_at ?? 0
                },
                ReturnValues: 'UPDATED_NEW'
            };
            const updatedData = await dynamodb.update(updateAlertParams).promise();
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "updated successfully", data: updatedData })
            };
        } else {
            const newAlertParam = {
                TableName: ALERT_TABLE,
                Item: {
                    'id': uuidv4.v4(),
                    'user_id': user_id,
                    'signal': signal,
                    'condition': condition,
                    'value': value,
                    'type': type,
                    'email': email,
                    'notification': notification,
                    'isDeleted': false,
                    'status': true,
                    'identifier': identifier,
                    'createdAt': new Date().toISOString(),
                    'updatedAt': new Date().toISOString(),
                    'etf': etf
                }
            };
            console.log(newAlertParam);
            const ret = await dynamodb.put(newAlertParam).promise();
            console.log(ret);

            sendAlertConfirmation(newAlertParam.Item);

            return {
                statusCode: 201,
                body: JSON.stringify({ message: "created successfully", data: newAlertParam })
            };
        }
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error }) };
    }
};

const getAlerts = async (event) => {
    const requestBody = event.queryStringParameters;

    try {
        const { user_id, status = true, isDeleted = false } = requestBody;

        if (!user_id) {
            return {
                statusCode: 400,
                headers: utility.getResponseHeaders(),
                body: JSON.stringify({ message: "Please provide user_id (email)" }),
            };
        }
        console.log(user_id, status, isDeleted);

        var params = {
            TableName: ALERT_TABLE,
            FilterExpression: "#u = :user_id AND #d = :isDeleted AND #s = :status",
            ExpressionAttributeNames: {
                "#u": "user_id",
                "#d": "isDeleted",
                "#s": "status"
            },
            ExpressionAttributeValues: { ":user_id": user_id, ":isDeleted": isDeleted, ":status": status === true || status === 'true' }
        };
        console.log(params);
        const alertData = await dynamodb.scan(params).promise();
        console.log(alertData);
        return {
            statusCode: 200,
            body: JSON.stringify({ data: alertData.Items })
        }
    } catch (e) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: e })
        }

    }
}

const deleteAlert = async (event) => {

    const requestBody = JSON.parse(event.body);

    try {
        const { user_id, identifier, isDeleted = true } = requestBody;

        if (!user_id || !identifier) {
            return {
                statusCode: 400,
                headers: utility.getResponseHeaders(),
                body: JSON.stringify({ message: "Please provide user_id and identifier!" }),
            };
        }
        console.log(user_id, isDeleted, identifier);

        var params = {
            TableName: ALERT_TABLE,
            FilterExpression: "#u = :user_id AND #i = :identifier",
            ExpressionAttributeNames: {
                "#u": "user_id",
                "#i": "identifier",
            },
            ExpressionAttributeValues: { ":user_id": user_id, ":identifier": identifier }
        };
        console.log(params);
        const alertData = await dynamodb.scan(params).promise();
        console.log(alertData);
        if (alertData.Count > 0) {
            const currentAlertData = alertData.Items[0];
            const updateAlertParams = {
                TableName: ALERT_TABLE,
                Key: {
                    'id': currentAlertData.id,
                    'identifier': currentAlertData.identifier
                },
                UpdateExpression: 'set #d = :d',
                ExpressionAttributeNames: {
                    '#d': 'isDeleted',
                },
                ExpressionAttributeValues: {
                    ':d': isDeleted,
                },
                ReturnValues: 'UPDATED_NEW'
            };
            const updatedData = await dynamodb.update(updateAlertParams).promise();
        }
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "deleted successfully" })
        };
    } catch (e) {
        return {
            statusCode: 500,
            body: JSON.stringify(e)
        }
    }
}


const disableAlert = async (id) => {
    console.log("disableAlert", id);
    try {
        const updateAlertParams = {
            TableName: ALERT_TABLE,
            Key: {
                'id': id,
            },
            UpdateExpression: 'set #st = :st',
            ExpressionAttributeNames: {
                '#st': 'status',
            },
            ExpressionAttributeValues: {
                ':st': false,
            },
            ReturnValues: 'UPDATED_NEW'
        };
        return await dynamodb.update(updateAlertParams).promise();
    } catch (error) {
        console.log("failed to disable", error);
    }
    return;
};

// Export the User function
module.exports = { updateAlert, getAlerts, deleteAlert, disableAlert, triggerAlert };