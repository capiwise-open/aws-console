const AWS = require('aws-sdk');
const { getAllUsers, getAllAlerts, getWatchlist } = require('./db/user_profile');
const { updateAlert, disableAlert, triggerAlert } = require('./api/alerts/alert');
const pnNotify = require('./api/notification');
const emailNotify = require('./api/email');
const { addNotification } = require('./db/notifications');

const token = process.env.TOKEN_12;

const fetchStockChanges = async (alerts) => {
    const changes = [];
    await Promise.all(alerts.map(async (alert, index) => {
        if (changes.findIndex(c => c.symbol === alert.identifier) < 0) {
            try {
                const external_url = `https://api.twelvedata.com/quote?symbol=${alert.identifier}&apikey=${token}`;
                const r = await fetch(external_url);
                const r2 = await r.json();
                changes.push({
                    symbol: alert.identifier,
                    change: r2
                });
            } catch (e) { }
        }
    }));
    return changes;
}

exports.alertHandler = async (event) => {
    try {
        const users = await getAllUsers();
        const alerts = (await getAllAlerts())?.filter(alert => alert.status === true && alert.isDeleted !== true);

        // gather summaries should be fetched
        const stockChanges = await fetchStockChanges(alerts);

        console.log("alertHandler", users);
        console.log("alertHandler", alerts);
        console.log("alertHandler", stockChanges);
        // gather push-notifications with checking every alerts
        const notifications = [];
        const emails = [];
        const expiredAlerts = [];
        alerts.forEach(alert => {
            try {
                const stockChange = stockChanges.find(s => s.symbol === alert.identifier)
                const ntoken = users.find(user => user.email === alert.user_id)?.ntoken;
                if (!!ntoken && !!stockChange) {
                    let notification;
                    if (alert.signal === 'price') {
                        if (alert.condition === 'above' && alert.value <= stockChange.change.close)
                            notification = {
                                pushToken: ntoken,
                                data: { action: "stock-change", symbol: alert.identifier },
                                title: "The value you assigned has been reached",
                                subTitle: `${alert.identifier} is now ${alert.condition} ${'$' + stockChange.change.close}`,
                            };
                        if (alert.condition === 'below' && alert.value >= stockChange.change.close)
                            notification = {
                                pushToken: ntoken,
                                data: { action: "stock-change", symbol: alert.identifier },
                                title: "The value you assigned has been reached",
                                subTitle: `${alert.identifier} is now ${alert.condition} ${'$' + stockChange.change.close}`,
                            };
                    } else {
                        if (alert.condition === 'above' && alert.value <= stockChange.change.percent_change)
                            notification = {
                                pushToken: ntoken,
                                data: { action: "stock-change", symbol: alert.identifier },
                                title: "The value you assigned has been reached",
                                subTitle: `${alert.identifier} is now ${alert.condition} ${stockChange.change.percent_change + '%'}`,
                            };
                        if (alert.condition === 'below' && alert.value >= stockChange.change.percent_change)
                            notification = {
                                pushToken: ntoken,
                                data: { action: "stock-change", symbol: alert.identifier },
                                title: "The value you assigned has been reached",
                                subTitle: `${alert.identifier} is now ${alert.condition} ${stockChange.change.percent_change + '%'}`,
                            };
                    }
                    if (notification != null) {
                        // triggered
                        console.log("triggerAlert");
                        triggerAlert({
                            body: JSON.stringify({
                                ...alert,
                                status: false,
                                triggered_at: new Date().toISOString()
                            })
                        });
                        if (alert.notification === true) {
                            notifications.push({
                                ...notification,
                                data: {
                                    type: "ALERT",
                                    user_id: alert.user_id,
                                    etf: alert.etf,
                                    alert_id: alert.id,
                                    symbol: alert.identifier
                                }
                            });
                        }
                        if (alert.email === true) {
                            emails.push({ alert });
                        }
                    }
                }
            } catch (e) { }
            // check alerts' expiration
            if (!expiredAlerts.find(v => v.id === alert.id)) {
                if (alert.type === "dod" && (new Date().getTime() - new Date(alert.createdAt).getTime()) > (24 * 3600 * 1000)) {
                    expiredAlerts.push(alert);
                }
                if (alert.type === "gtc" && (new Date().getTime() - new Date(alert.createdAt).getTime()) > (180 * 24 * 3600 * 1000)) {
                    expiredAlerts.push(alert);
                }
            }
        });

        // send alert email
        console.log("notifications", notifications);
        (async () => {
            for (let email of emails) {
                await emailNotify.sendAlertTriggered(email.alert);
            };
        })();
        // send alert pn
        (async () => {
            for (let not of notifications) {
                await addNotification(not, not.data.user_id);
            }
        })();
        await pnNotify.sendNotifications(notifications);
        // disable alerts
        try {
            console.log("expiredAlerts", expiredAlerts)
            for (let alert of expiredAlerts) {
                await disableAlert(alert.id);
                if (alert.email === true)
                    await emailNotify.sendAlertExpired(alert);
            }
        } catch (e) { }
        const response = {
            statusCode: 200,
            body: JSON.stringify('Hello from Lambda!'),
        };
        return response;
    } catch (e) {
        console.log("alertHandler", e);
    }
};


const checkNewAlertCondition = async (alert) => {
    try {
        console.log("checkNewAlertCondition", alert);
        const users = await getAllUsers();
        console.log("checkNewAlertCondition", users);
        const alerts = [alert];

        // gather summaries should be fetched
        const stockChanges = await fetchStockChanges(alerts);

        console.log("checkNewAlertCondition", users);
        console.log("checkNewAlertCondition", alerts);
        console.log("checkNewAlertCondition", stockChanges);
        // gather push-notifications with checking every alerts
        const notifications = [];
        const emails = [];
        const expiredAlerts = [];
        alerts.forEach(alert => {
            try {
                const stockChange = stockChanges.find(s => s.symbol === alert.identifier)
                const ntoken = users.find(user => user.email === alert.user_id)?.ntoken;
                if (!!ntoken && !!stockChange) {
                    let notification;
                    if (alert.signal === 'price') {
                        if (alert.condition === 'above' && alert.value <= stockChange.change.close)
                            notification = {
                                pushToken: ntoken,
                                data: { action: "stock-change", symbol: alert.identifier },
                                title: "The value you assigned has been reached",
                                subTitle: `${alert.identifier} is now ${alert.condition} ${'$' + stockChange.change.close}`,
                            };
                        if (alert.condition === 'below' && alert.value >= stockChange.change.close)
                            notification = {
                                pushToken: ntoken,
                                data: { action: "stock-change", symbol: alert.identifier },
                                title: "The value you assigned has been reached",
                                subTitle: `${alert.identifier} is now ${alert.condition} ${'$' + stockChange.change.close}`,
                            };
                    } else {
                        if (alert.condition === 'above' && alert.value <= stockChange.change.percent_change)
                            notification = {
                                pushToken: ntoken,
                                data: { action: "stock-change", symbol: alert.identifier },
                                title: "The value you assigned has been reached",
                                subTitle: `${alert.identifier} is now ${alert.condition} ${stockChange.change.percent_change + '%'}`,
                            };
                        if (alert.condition === 'below' && alert.value >= stockChange.change.percent_change)
                            notification = {
                                pushToken: ntoken,
                                data: { action: "stock-change", symbol: alert.identifier },
                                title: "The value you assigned has been reached",
                                subTitle: `${alert.identifier} is now ${alert.condition} ${stockChange.change.percent_change + '%'}`,
                            };
                    }
                    if (notification != null) {
                        // triggered
                        console.log("triggerAlert");
                        triggerAlert({
                            body: JSON.stringify({
                                ...alert,
                                status: false,
                                triggered_at: new Date().toISOString()
                            })
                        });
                        if (alert.notification === true) {
                            notifications.push({
                                ...notification,
                                data: {
                                    type: "ALERT",
                                    user_id: alert.user_id,
                                    etf: alert.etf,
                                    alert_id: alert.id,
                                    symbol: alert.identifier
                                }
                            });
                        }
                        if (alert.email === true) {
                            emails.push({ alert });
                        }
                    }
                }
            } catch (e) { }
            // check alerts' expiration
            if (!expiredAlerts.find(v => v.id === alert.id)) {
                if (alert.type === "dod" && (new Date().getTime() - new Date(alert.createdAt).getTime()) > (24 * 3600 * 1000)) {
                    expiredAlerts.push(alert);
                }
                if (alert.type === "gtc" && (new Date().getTime() - new Date(alert.createdAt).getTime()) > (180 * 24 * 3600 * 1000)) {
                    expiredAlerts.push(alert);
                }
            }
        });

        // send alert email
        console.log("notifications", notifications);
        (async () => {
            for (let email of emails) {
                await emailNotify.sendAlertTriggered(email.alert);
            };
        })();
        // send alert pn
        (async () => {
            for (let not of notifications) {
                await addNotification(not, not.data.user_id);
            }
        })();
        await pnNotify.sendNotifications(notifications);
        // disable alerts
        try {
            console.log("expiredAlerts", expiredAlerts)
            for (let alert of expiredAlerts) {
                await disableAlert(alert.id);
                if (alert.email === true)
                    await emailNotify.sendAlertExpired(alert);
            }
        } catch (e) { }
    } catch (e) {
        console.log("alertHandler", e);
    }
};

exports.newalertHandler = async (event) => {
    if (!!event.Records) {
        for (let record of event.Records) {
            if (record.eventName === "INSERT") {
                console.log(record.dynamodb);
                const recordImage = AWS.DynamoDB.Converter.unmarshall(
                    record.dynamodb.NewImage
                );
                console.log(recordImage);
                if (recordImage.email === true)
                    await emailNotify.sendAlertConfirmation(recordImage);
                await checkNewAlertCondition(recordImage);
            }
        }
    }
}

