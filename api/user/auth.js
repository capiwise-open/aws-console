const AWS = require('aws-sdk');
const { CognitoIdentityProviderClient, InitiateAuthCommand, ChangePasswordCommand } = require("@aws-sdk/client-cognito-identity-provider");
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const { COGNITO, AWS_CREDENTIAL } = require('../../conf');

const cognitoProvider = new AWS.CognitoIdentityServiceProvider({
    region: "eu-central-1"
});

const signup = async (event) => {
    const body = JSON.parse(event.body);
    const { password, email, phone, firstName, lastName } = body;

    const params = {
        ClientId: COGNITO.CLIENT_ID,
        Password: password,
        Username: email,
        UserAttributes: [
            {
                Name: 'email',
                Value: email,
            },
            {
                Name: 'given_name',
                Value: firstName,
            },
            {
                Name: 'family_name',
                Value: lastName,
            },
            {
                Name: 'phone_number',
                Value: phone,
            },
            {
                Name: "website",
                Value: "https://capiwise.com",
            }
        ],
    };

    try {
        await cognitoProvider.signUp(params).promise();
        return { statusCode: 200, body: JSON.stringify({ message: 'Sign up successful' }) };
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }


    // const checkParams = {
    //     UserPoolId: 'eu-central-1_QukrjlcsL',
    //     Username: email,
    // };

    // try {
    //     const response = await cognito.adminGetUser(checkParams).promise();

    //     if (response.UserStatus === 'UNCONFIRMED') {
    //         // Use async/await for consistency
    //         await cognito.resendConfirmationCode({ ClientId: params.ClientId, Username: email }).promise();
    //         return { statusCode: 200, body: JSON.stringify({ message: 'Confirmation code resent successfully', status: "success" }) };
    //     } else if (response.UserStatus === 'CONFIRMED') {
    //         return { statusCode: 200, body: JSON.stringify({ message: 'User already confirmed. Please log in', status: "error" }) };
    //     }
    // } catch (error) {
    //     if (error.name === 'UserNotFoundException') {
    //         // User not found, attempt to sign up
    //         try {
    //             await cognito.signUp(params).promise();
    //             return { statusCode: 200, body: JSON.stringify({ message: 'Sign up successful', status: "success" }) };
    //         } catch (signupError) {
    //             // Handle signup error
    //             return { statusCode: 400, body: JSON.stringify({ message: signupError.message, status: "error" }) };
    //         }
    //     } else {
    //         // Handle other errors
    //         return { statusCode: 500, body: JSON.stringify({ message: `Error: ${error.message}`, status: "error" }) };
    //     }
    // }
};

const signin = async (event) => {
    const body = JSON.parse(event.body);
    try {
        const { email, password } = body;

        const userPool = new AmazonCognitoIdentity.CognitoUserPool({
            UserPoolId: COGNITO.USER_POOL_ID,
            ClientId: COGNITO.CLIENT_ID
        })
        const authenticationData = {
            Username: email,
            Password: password,
        };
        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

        const userData = {
            Username: email,
            Pool: userPool,
        };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        const result = await new Promise((resolve, reject) => {
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: (result) => {
                    console.log('authentication success');
                    resolve({ statusCode: 200, body: JSON.stringify(result) });
                },
                onFailure: (err) => {
                    console.error('authentication failure', err);
                    reject({ statusCode: 400, body: JSON.stringify(err) });
                },
            });
        });


        const resBody = JSON.parse(result.body);
        console.log("result", resBody)

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Authentication successful",
                status: "success",
                userAttributes: resBody.idToken.payload, // Include user attributes in the response,
                token: resBody.idToken.jwtToken
            }),
        };

        // const params = {
        //     AuthFlow: 'USER_PASSWORD_AUTH',
        //     ClientId: COGNITO.CLIENT_ID,
        //     // UserPoolId: COGNITO.USER_POOL_ID,
        //     AuthParameters: {
        //         USERNAME: email,
        //         PASSWORD: password,
        //     },
        // };
        // try {
        //     const authResult = await cognitoProvider.initiateAuth(params).promise();
        //     return { statusCode: 200, body: JSON.stringify({ message: 'Sign in successful', data: authResult.AuthenticationResult }) };
        // } catch (error) {
        //     return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
        // }
    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e }) };
    }
};

const resetPassword = async (event) => {
    const body = JSON.parse(event.body);

    try {
        const { email, oldPassword, newPassword } = body;

        if (!email || !oldPassword || !newPassword) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Please provide all required parameters.", status: "error" }),
            };
        }

        const client = new CognitoIdentityProviderClient({ region: "eu-central-1" });

        const authParams = {
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: clientId,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: oldPassword,
            },
        };
        const authCommand = new InitiateAuthCommand(authParams);
        const authResponse = await client.send(authCommand);
        const accessToken = authResponse.AuthenticationResult.AccessToken;

        // Change the password
        const changePasswordParams = {
            AccessToken: accessToken,
            PreviousPassword: oldPassword,
            ProposedPassword: newPassword,
        };
        const changePasswordCommand = new ChangePasswordCommand(changePasswordParams);
        await client.send(changePasswordCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Password changed successfully.", status: "success" }),
        };
    } catch (error) {
        console.error("Error changing password:", error);
        return {
            statusCode: error.$metadata?.httpStatusCode || 500,
            body: JSON.stringify({ error: error.message, status: "error" }),
        };
    }
};

const getUser = async (email) => {
    try {
        const userPool = new AmazonCognitoIdentity.CognitoUserPool({
            UserPoolId: COGNITO.USER_POOL_ID,
            ClientId: COGNITO.CLIENT_ID
        })
        const userData = {
            Username: email,
            Pool: userPool,
        };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        return await cognitoUser?.getUserAttributes();
    } catch (e) {
        console.log(e);
    }
    return null;
}

// ////////////////////////// Google Authentication /////////////////////////////////////////

const signinWithPassword = async (email, password) => {
    const poolData = {
        UserPoolId: COGNITO.USER_POOL_ID,
        ClientId: COGNITO.CLIENT_ID
    };
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData)

    const authenticationData = {
        Username: email,
        Password: password,
    };
    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

    const userData = {
        Username: email,
        Pool: userPool,
    };
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    return new Promise((resolve, reject) => {
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: (result) => {
                console.log('authentication success');
                resolve({ statusCode: 200, body: JSON.stringify(result) });
            },
            onFailure: (err) => {
                console.error('authentication failure', err);
                reject({ statusCode: 400, body: JSON.stringify(err) });
            },
        });
    });
}

const signinWithGoogle = async (event) => {
    const body = JSON.parse(event.body);

    // Destructure and check for missing parameters more accurately
    const { email, phone, firstName, lastName, idToken } = body;
    // if (!email || !firstName || !lastName) {
    //     return {
    //         statusCode: 400,
    //         body: JSON.stringify({ message: "Please provide all required parameters.", status: "error" }),
    //     };
    // }

    // const tmpPWD = "JAc2n7IwtRlaBF1$981297uj@CP"
    // const userAttributes = [
    //     { Name: 'email', Value: email },
    //     { Name: 'given_name', Value: firstName },
    //     { Name: 'family_name', Value: lastName },
    //     { Name: "website", Value: "https://capiwise.com" }
    // ];
    // if (phone) userAttributes.push({ Name: 'phone_number', Value: phone });

    // const params = {
    //     ClientId: COGNITO.CLIENT_ID,
    //     Password: tmpPWD,
    //     Username: email,
    //     UserAttributes: userAttributes
    // };

    // const checkParams = {
    //     UserPoolId: COGNITO.USER_POOL_ID,
    //     Username: email,
    // };

    // const authenticationData = {
    //     Username: email,
    //     Password: password,
    // };
    // const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

    // const userData = {
    //     Username: email,
    //     Pool: userPool,
    // };
    // const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    try {
        AWS.config.region = AWS_CREDENTIAL.region;
        const cognitoIdentity = new AWS.CognitoIdentity();

        // AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        //     IdentityPoolId: COGNITO.IDENTITY_POOL_ID,
        //     Logins: {
        //         'accounts.google.com': idToken
        //     }
        // });

        // Obtain AWS credentials
        // AWS.config.credentials.get(function () {
        //     // Access AWS resources here.
        // });


        const params = {
            IdentityPoolId: COGNITO.IDENTITY_POOL_ID,
            Logins: {
                'accounts.google.com': idToken,
            },
        };

        const result = await new Promise((resolve, reject) => {
            // cognitoIdentity.getOpenIdToken(params, (err, data) => {
            cognitoIdentity.getOpenIdTokenForDeveloperIdentity(params, (err, data) => {
                if (err) {
                    console.error('Error getting OpenId token:', err);
                    reject({ error: err })
                    return;
                }

                const credentialsParams = {
                    IdentityId: data.IdentityId,
                    Logins: {
                        'accounts.google.com': idToken,
                    },
                };

                const credentials = new AWS.CognitoIdentityCredentials(credentialsParams);//AWS.config.credentials
                AWS.config.credentials = credentials;
                
                const poolData = {
                    UserPoolId: COGNITO.USER_POOL_ID,
                    ClientId: COGNITO.CLIENT_ID
                };
                const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData)
                const userData = {
                    Username: email,
                    Pool: userPool,
                };
                const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

                // Now you can use AWS services with the authenticated user
                console.log('Successfully authenticated with AWS:', credentials, data);
                resolve({ credentials })
            });
        });

        return {
            statusCode: 200,
            body: JSON.stringify(result),
        };
    } catch (e) {
        return {
            statusCode: 500,
            body: JSON.stringify(e),
        };
    }

    // try {
    //     const response = await cognitoProvider.adminGetUser(checkParams).promise();
    //     console.log("google-1", response);

    //     if (response.UserStatus === 'UNCONFIRMED') {
    //         await cognitoProvider.resendConfirmationCode({ ClientId: params.ClientId, Username: email }).promise();
    //         return { statusCode: 200, body: JSON.stringify({ message: 'Confirmation code resent successfully', status: "success" }) };
    //     } else if (response.UserStatus === 'CONFIRMED') {
    //         const result = await signinWithPassword(email, tmpPWD)
    //         const temp = JSON.parse(result.body).idToken
    //         return {
    //             statusCode: 200,
    //             body: JSON.stringify({
    //                 message: "Authentication successful",
    //                 status: "success",
    //                 userAttributes: temp.payload, // Include user attributes in the response,
    //                 token: temp.jwtToken
    //             }),
    //         };
    //     }
    // } catch (error) {
    //     console.log("google-2", error.name);
    //     if (error.name === 'UserNotFoundException') {
    //         // User not found, attempt to sign up
    //         try {
    //             const tmp = await cognitoProvider.signUp(params).promise();

    //             const data = await cognitoProvider.adminConfirmSignUp(checkParams).promise();
    //             console.log('User confirmed successfully:', data);
    //             const result = await signinWithPassword(email, tmpPWD);
    //             const temp = JSON.parse(result.body).idToken;
    //             console.log("google-2", tmp, result);
    //             return {
    //                 statusCode: 200, body: JSON.stringify({
    //                     message: 'Sign up successful',
    //                     status: "success",
    //                     userAttributes: temp.payload,
    //                     token: temp.jwtToken
    //                 })
    //             };
    //         } catch (signupError) {
    //             console.log("google-2", signupError);
    //             // Handle signup error
    //             return { statusCode: 400, body: JSON.stringify({ message: signupError.message, status: "error" }) };
    //         }
    //     } else {
    //         // Handle other errors
    //         return { statusCode: 500, body: JSON.stringify({ message: `Error: ${error.message}`, status: "error" }) };
    //     }
    // }
};

// /////////////////////////////////////////////////////////////////

module.exports = {
    signin,
    signup,
    resetPassword,
    getUser,
    signinWithGoogle
}