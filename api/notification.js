const AWS = require('aws-sdk');
const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
let expo = new Expo({
    // accessToken: process.env.EXPO_ACCESS_TOKEN,
    useFcmV1: true // this can be set to true in order to use the FCM v1 API
});

const sendNotifications = async (notifications) => {
    try {
        console.log("sendNotifications", notifications);
        // Create the messages that you want to send to clients
        let messages = [];
        for (let not of notifications) {
            // const somePushTokens = ['ExponentPushToken[CGF5L0IOuoQHL_vkL9urD-]'];
            if (!Expo.isExpoPushToken(not.pushToken)) {
                console.error(`Push token ${not.pushToken} is not a valid Expo push token`);
                continue;
            }
            // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
            messages.push({
                to: not.pushToken,
                sound: 'default',
                title: not.title,
                body: not.subTitle,
                data: not.data,
            })
        }

        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];
        console.log("sendNotifications-chunks", chunks);
        // Send the chunks to the Expo push notification service. There are
        // different strategies you could use. A simple one is to send one chunk at a
        // time, which nicely spreads the load out over time:
        // (async () => {
            for (let chunk of chunks) {
                try {
                    let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                    console.log(ticketChunk);
                    tickets.push(...ticketChunk);
                    // NOTE: If a ticket contains an error code in ticket.details.error, you
                    // must handle it appropriately. The error codes are listed in the Expo
                    // documentation:
                    // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
                } catch (error) {
                    console.error(error);
                }
            }
        // })();

        let receiptIds = [];
        for (let ticket of tickets) {
            // NOTE: Not all tickets have IDs; for example, tickets for notifications
            // that could not be enqueued will have error information and no receipt ID.
            if (ticket.status === 'ok') {
                receiptIds.push(ticket.id);
            }
        }

        let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
        // (async () => {
            console.log("sendNotifications-receiptIdChunks", receiptIdChunks);
            // Like sending notifications, there are different strategies you could use
            // to retrieve batches of receipts from the Expo service.
            for (let chunk of receiptIdChunks) {
                try {
                    let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
                    console.log(receipts);

                    // The receipts specify whether Apple or Google successfully received the
                    // notification and information about an error, if one occurred.
                    for (let receiptId in receipts) {
                        let { status, message, details } = receipts[receiptId];
                        if (status === 'ok') {
                            continue;
                        } else if (status === 'error') {
                            console.error(
                                `There was an error sending a notification: ${message}`
                            );
                            if (details && details.error) {
                                // The error codes are listed in the Expo documentation:
                                // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
                                // You must handle the errors appropriately.
                                console.error(`The error code is ${details.error}`);
                            }
                        }
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        // })();
    } catch (e) { console.log(e) }
}

module.exports = {
    sendNotifications
}