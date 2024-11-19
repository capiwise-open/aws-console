const AWS = require('aws-sdk');
const { getAllUsers, getAllAlerts, getWatchlist } = require('./db/user_profile');
const { sendNotifications } = require('./api/notification');
const { add2Sqs } = require('./sqs');

const eToken = process.env.TOKEN_NEWS;

const fetchTopNews = async (symbols, limit) => {
    try {
        const url = `https://api.marketaux.com/v1/news/all?symbols=${symbols?.join(',')}&filter_entities=true&limit=${limit}&api_token=${eToken}`;
        console.log("fetchTopNews", url);
        const r = await fetch(url);
        const r2 = await r.json();
        return r2;
    } catch (e) {
        console.log("fetchTopNews", e);
    }
}

exports.newsHandler = async (event) => {
    try {
        const users = await getAllUsers();
        console.log("newsHandler", users);

        const notifications = [];
        for (user of users) {
            try {
                const watchlist = await getWatchlist(user.email);
                console.log("newsHandler", watchlist);
                if (!watchlist || watchlist.length <= 0)
                    continue;
                const news = await fetchTopNews(watchlist, 2);
                if (!news || !news.data || news?.data?.length <= 0)
                    continue;
                console.log("newsHandler", news.data);
                let newsData = news.data[0];
                if (JSON.stringify(newsData).length > 4096) {
                    newsData.entities = newsData.entities?.map((e) => ({ ...e, highlights: [] }))
                    while (JSON.stringify(newsData).length > 4096 && newsData.entities.length > 0) {
                        newsData.entities.pop();
                    }
                }
                const notification = {
                    pushToken: user.ntoken,
                    title: newsData?.title,
                    data: {
                        type: "NEWS",
                        news: newsData
                    }
                };
                !!user.ntoken && notifications.push(notification);
                // add2Sqs(notification);
                !!user.ntoken && await sendNotifications([notification]);
            } catch (e) { console.log(e) }
        }
        console.log("notifications", notifications);
        // sendNotifications(notifications);
        return {
            statusCode: 200,
            body: JSON.stringify('Hello from Lambda!'),
        };
    } catch (e) { }
}