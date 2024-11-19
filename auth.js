const { PreSignUpTriggerEvent, PreSignUpTriggerHandler } = require('aws-lambda');
const { CognitoIdentityServiceProvider } = require('aws-sdk');

const cognito = new CognitoIdentityServiceProvider();

const knownProviderNames = {
    google: 'Google',
    facebook: 'Facebook'
};

const getProviderName = async (userPoolId, providerName) => {
    if (knownProviderNames[providerName]) {
        return knownProviderNames[providerName];
    }

    const { Providers } = await cognito.listIdentityProviders({ UserPoolId: userPoolId }).promise();
    for (const provider of Providers) {
        if (provider.ProviderName.toLowerCase() === providerName.toLowerCase()) {
            return provider.ProviderName;
        }
    }
};

const tryMergeUserAccounts = async (event) => {
    const { triggerSource, userPoolId, userName, request } = event;
    console.log("tryMergeUserAccounts", triggerSource, userPoolId, userName, request);
    const { email } = event.request.userAttributes;
    const [provider, ...providerValues] = userName.split('_');
    const providerValue = providerValues.join('_');

    console.log("tryMergeUserAccounts", provider, providerValue);

    // merge social provider with existing cognito user by email
    if (provider.length > 0 && providerValue.length > 0) {
        const [{ Users }, providerName] = await Promise.all([
            cognito
                .listUsers({
                    UserPoolId: userPoolId,
                    AttributesToGet: ['email'],
                    Filter: `email = "${email}"`,
                    Limit: 1
                })
                .promise(),
            getProviderName(userPoolId, provider)
        ]);
        
        console.log("tryMergeUserAccounts", Users, providerName);
        if (providerName && Users.length > 0) {
            for (const user of Users) {
                await cognito
                    .adminLinkProviderForUser({
                        UserPoolId: userPoolId,
                        DestinationUser: {
                            ProviderName: 'Cognito',
                            ProviderAttributeValue: user.Username
                        },
                        SourceUser: {
                            ProviderName: providerName,
                            ProviderAttributeName: 'Cognito_Subject',
                            ProviderAttributeValue: providerValue
                        }
                    })
                    .promise();
            }

            // return true to indicate users were merged
            return true;
        }
    }

    return false;
};

const presignupHandler = async (event, _, callback) => {
    // continue the flow only if did not link providers
    const wereUsersMerged = await tryMergeUserAccounts(event);
    return wereUsersMerged ? undefined : callback(null, event);
};

module.exports = {
    presignupHandler
}