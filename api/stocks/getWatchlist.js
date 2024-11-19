const https = require("https");
const utility = require('../../util');
const user = require("../../db/user_profile");

// Simplified function to make HTTPS GET requests
const fetchData = (url) => new Promise((resolve, reject) => {
    https.get(url, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
});

// Function to handle fetching a user's watchlist
const getWatchlist = async (event) => {
    const e_token = process.env.TOKEN_12;
    const token = process.env.TOKEN_E;
    try {
        const { queryStringParameters } = event;
        if (!queryStringParameters || !queryStringParameters.email) {
            return {
                statusCode: 400,
                headers: utility.getResponseHeaders(),
                body: JSON.stringify({ message: "Please provide an email!" }),
            };
        }

        const watchlistArray = await user.getWatchlist(queryStringParameters.email);
        if (!watchlistArray || watchlistArray.length == 0) {
            return {
                statusCode: 500,
                headers: utility.getResponseHeaders(),
                body: JSON.stringify({ message: 'WatchList is empty or in an unexpected format', data: [] })
            };
        }

        if (queryStringParameters?.watchlist) {
            const isWatchlisted = watchlistArray.includes(queryStringParameters?.watchlist)
            return {
                statusCode: 200,
                headers: utility.getResponseHeaders(),
                body: JSON.stringify({ message: 'WatchList fetched and checked successfully', data: isWatchlisted })
            }
        }
        console.log(queryStringParameters.email, watchlistArray);
        const enrichedResults = await Promise.all(watchlistArray?.map((item) => {
            return new Promise(async (res, rej) => {
                try {
                    const quoteData = await fetchData(`https://api.twelvedata.com/quote?symbol=${item}&apikey=${e_token}`);
                    const logoData = await fetchData(`https://api.twelvedata.com/logo?symbol=${item}&apikey=${e_token}`);
                    const typeData = await fetchData(`https://api.twelvedata.com/symbol_search?symbol=${item}&apikey=${e_token}&outputsize=1`)
                    const trendingData = await fetchData(`https://eodhistoricaldata.com/api/screener?api_token=${token}&sort=avgvol_1d.desc&filters=[[%22market_capitalization%22,%22%3E%22,1000000],[%22exchange%22,%22=%22,%22us%22]]&limit=10`)
                    // console.log(quoteData, logoData, typeData, trendingData);

                    quoteData["logo"] = logoData?.url;
                    quoteData["type"] = typeData?.data[0]?.instrument_type;
                    const diff = parseFloat(quoteData["close"]) - parseFloat(quoteData["open"])
                    const stat = diff >= 0 ? true : false;
                    quoteData["isGained"] = stat;
                    quoteData["isLost"] = !stat;
                    quoteData["isTrending"] = trendingData?.data?.some(itemT => itemT.code === item);
                    console.log(item)
                    res({ ...quoteData });
                } catch (e) {
                    console.log("$$", item)
                    res({});
                }
            });
        }));
        console.log(enrichedResults);

        return {
            statusCode: 200,
            headers: utility.getResponseHeaders(),
            body: JSON.stringify({ message: 'WatchList fetched and enriched successfully', data: enrichedResults })
        }
    } catch (e) {
        return {
            statusCode: 500,
            headers: utility.getResponseHeaders(),
            body: JSON.stringify({ message: 'WatchList fetched and enriched failed', error: e })
        }
    }
};

// Export the Get_WatchList function
module.exports = { getWatchlist };