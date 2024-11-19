const AWS = require('aws-sdk');
const sqs = new AWS.SQS();
const sns = new AWS.SNS();
const newsQueueUrl = 'https://sqs.eu-central-1.amazonaws.com/007429368410/cw-service-news';

const add2Sqs = async (data) => {

    // Define the message body and other parameters
    const params = {
        QueueUrl: newsQueueUrl,
        MessageBody: JSON.stringify({
            ...data,
            text: 'Hello, this is a test message!',
            timestamp: new Date().toISOString(),
        }),
    };

    try {
        // Send the message to the SQS queue
        const result = await sqs.sendMessage(params).promise();
        console.log(`Message sent to SQS queue with MessageId: ${result.MessageId}`);
        return 0;
    } catch (error) {
        return -1;
    }
}

const handler = async (event) => {
    console.log(event);
    for (const record of event.Records) {
        const messageBody = record.body;
/*
        // Process the message
        console.log('Message received from SQS:', messageBody);

        // Define the parameters for the SNS publish action
        const params = {
            Message: `New message received: ${messageBody}`,
            Subject: 'New SQS Message',
            TopicArn: 'arn:aws:sns:eu-central-1:007429368410:cw-service-sns'
        };

        try {
            // Publish the message to SNS
            const data = await sns.publish(params).promise();
            console.log(`Message sent to SNS topic with MessageID: ${data.MessageId}`);
        } catch (err) {
            console.error(`Error sending message to SNS: ${err}`);
        }
*/
    }

    return {
        statusCode: 200,
        body: JSON.stringify('Messages processed successfully'),
    };

}

module.exports = {
    add2Sqs,
    handler
}