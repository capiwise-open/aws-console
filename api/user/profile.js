const AWS = require('aws-sdk');
const uuidv4 = require('uuid');
const utility = require('../../util');

const dynamodb = new AWS.DynamoDB.DocumentClient({
    endpoint: undefined,
    region: "eu-central-1",
    httpOptions: {
        timeout: 2000,
    },
    maxRetries: 2
});

const PROFILE_TABLE = process.env.PROFILE_TABLE;

// type user_info = {
//     email: string,
//     myself: "Investore" | "Trader" | "Both",
//     trader: string, //["Banking", "Energy"],
//     interest: string, //["a", "b"],
//     watchlist: number,
//     status: number
// }

// Function to handle profile step3 operations
const getUserInfo = async (event) => {
    try {
        const { id = null, email = null } = event.queryStringParameters;

        if (!email && !id) {
            return {
                statusCode: 400,
                headers: utility.getResponseHeaders(),
                body: JSON.stringify({ message: "Please provide an id , email!" }),
            };
        }

        if (!!id && !!email) {
            const params = {
                TableName: PROFILE_TABLE,
                Key: {
                    'id': id,
                    'email': email
                }
            };

            const data = await dynamodb.get(params).promise();
            console.log('Success:', data);
            if (data.Count === 0)
                throw new Error("No users found");
            return {
                statusCode: 200,
                headers: utility.getResponseHeaders(),
                body: JSON.stringify({ message: 'Data collected successfully', data })
            };
        } else if (!!email) {
            var params = {
                TableName: PROFILE_TABLE,
                FilterExpression: "#m = :email",
                ExpressionAttributeNames: {
                    "#m": "email",
                },
                ExpressionAttributeValues: { ":email": email }
            };
            const userData = await dynamodb.scan(params).promise();
            console.log(userData);
            if (userData.Count === 0)
                throw new Error("No users found");
            return {
                statusCode: 200,
                headers: utility.getResponseHeaders(),
                body: JSON.stringify({
                    message: 'Data collected successfully',
                    data: userData.Items[0]
                })
            };
        } else {
            throw new Error("unkown issue");
        }
    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500,
            headers: utility.getResponseHeaders(),
            body: JSON.stringify({ message: error })
        };
    }
};

const updateUserInfo = async (event) => {
    try {
        const requestBody = JSON.parse(event.body);
        const { id, email, myself, trader, interest, watchlist, status = true } = requestBody;

        if (!email) {
            return {
                statusCode: 400,
                headers: utility.getResponseHeaders(),
                body: JSON.stringify({ message: "Please provide an email!" }),
            };
        }

        console.log(email, myself, trader, interest, watchlist, status);

        var params = {
            TableName: PROFILE_TABLE,
            FilterExpression: "#m = :email",
            ExpressionAttributeNames: {
                "#m": "email",
            },
            ExpressionAttributeValues: { ":email": email }
        };

        const userData = await dynamodb.scan(params).promise();


        if (userData.Count > 0) {
            const currentUserData = userData.Items[0];
            console.log(currentUserData);
            const updateUserParams = {
                TableName: PROFILE_TABLE,
                Key: {
                    'id': currentUserData.id,
                    'email': currentUserData.email
                },
                UpdateExpression: 'set #m = :m, #t = :t, #i = :i, #w = :w, #s = :s',
                ExpressionAttributeNames: {
                    '#m': 'myself',
                    '#t': 'trader',
                    '#i': 'interest',
                    '#w': 'watchlist',
                    '#s': 'status'
                },
                ExpressionAttributeValues: {
                    ':m': myself || currentUserData.myself,
                    ':t': trader || currentUserData.trader,
                    ':i': interest || currentUserData.interest,
                    ':w': watchlist || currentUserData.watchlist,
                    ':s': (status == undefined || status == null) ? currentUserData.status : status
                },
                ReturnValues: 'UPDATED_NEW'
            };

            const updatedData = await dynamodb.update(updateUserParams).promise();
            return {
                statusCode: 200,
                body: JSON.stringify({ "message": "updated", data: updatedData.Attributes })
            };
        } else {
            const createUserParams = {
                TableName: PROFILE_TABLE,
                Item: {
                    'id': uuidv4.v4(),
                    'email': email,
                    'myself': myself,
                    'trader': trader,
                    'interest': interest,
                    'watchlist': watchlist,
                    'status': status
                }
            };
            console.log(createUserParams);
            const ret = await dynamodb.put(createUserParams).promise();
            console.log(ret.Attributes);
            return {
                statusCode: 201,
                body: JSON.stringify({ "message": "created", data: ret.Attributes })
            };
        }
    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500,
            headers: utility.getResponseHeaders(),
            body: JSON.stringify({ message: error })
        };
    }
};

const addWatchlist = async (event) => {
    try {
        const requestBody = JSON.parse(event.body);
        const { email, symbol } = requestBody;

        if (!email || !symbol) {
            return {
                statusCode: 400,
                headers: utility.getResponseHeaders(),
                body: JSON.stringify({ message: "Please provide an email, and symbol!" }),
            };
        }

        console.log(email, symbol);

        var params = {
            TableName: PROFILE_TABLE,
            FilterExpression: "#m = :email",
            ExpressionAttributeNames: {
                "#m": "email",
            },
            ExpressionAttributeValues: { ":email": email }
        };

        const userData = await dynamodb.scan(params).promise();


        if (userData.Count > 0) {
            const currentUserData = userData.Items[0];
            console.log(currentUserData);
            const updateUserParams = {
                TableName: PROFILE_TABLE,
                Key: {
                    'id': currentUserData.id,
                    'email': currentUserData.email
                },
                UpdateExpression: 'set #w = :w',
                ExpressionAttributeNames: {
                    '#w': 'watchlist',
                },
                ExpressionAttributeValues: {
                    ':w': [...currentUserData.watchlist, symbol],
                },
                ReturnValues: 'UPDATED_NEW'
            };
            const updatedData = await dynamodb.update(updateUserParams).promise();
            return {
                statusCode: 200,
                body: JSON.stringify({ "message": "updated", data: updatedData.Attributes })
            };
        } else {
            return {
                statusCode: 200,
                body: JSON.stringify({ "message": "not found" })
            };
        }
    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500,
            headers: utility.getResponseHeaders(),
            body: JSON.stringify({ message: error })
        };
    }

}

const registerNtoken = async (event) => {
    try {
        const requestBody = JSON.parse(event.body);
        const { email, ntoken } = requestBody;

        if (!email || !ntoken) {
            return {
                statusCode: 400,
                headers: utility.getResponseHeaders(),
                body: JSON.stringify({ message: "Please provide an email, and ntoken!" }),
            };
        }

        console.log(email, ntoken);

        var params = {
            TableName: PROFILE_TABLE,
            FilterExpression: "#m = :email",
            ExpressionAttributeNames: {
                "#m": "email",
            },
            ExpressionAttributeValues: { ":email": email }
        };

        const userData = await dynamodb.scan(params).promise();


        if (userData.Count > 0) {
            const currentUserData = userData.Items[0];
            console.log(currentUserData);
            const updateUserParams = {
                TableName: PROFILE_TABLE,
                Key: {
                    'id': currentUserData.id,
                    'email': currentUserData.email
                },
                UpdateExpression: 'set #w = :w',
                ExpressionAttributeNames: {
                    '#w': 'ntoken',
                },
                ExpressionAttributeValues: {
                    ':w': ntoken,
                },
                ReturnValues: 'UPDATED_NEW'
            };
            const updatedData = await dynamodb.update(updateUserParams).promise();
            return {
                statusCode: 200,
                body: JSON.stringify({ "message": "updated" })
            };
        } else {
            return {
                statusCode: 200,
                body: JSON.stringify({ "message": "not found" })
            };
        }

    } catch (e) {
        console.error('Error ntoken request:', error);
        return {
            statusCode: 500,
            headers: utility.getResponseHeaders(),
            body: JSON.stringify({ message: error })
        };
    }
}

module.exports = { getUserInfo, updateUserInfo, addWatchlist, registerNtoken };
