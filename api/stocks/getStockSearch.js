const { getWatchlist } = require("../../db/user_profile");
const util = require("./utils");
const https = require("https");

const getStockSearch = async (event) => {
    const { queryStringParameters } = event;
    if (!queryStringParameters || !queryStringParameters.ticker) {
        return ({
            statusCode: 400,
            headers: util.getResponseHeaders(),
            body: "Please provide a ticker!",
        });
    }

    if (!queryStringParameters.limit) {
        return ({
            statusCode: 400,
            headers: util.getResponseHeaders(),
            body: "Please provide a limit!",
        });
    }

    if (!queryStringParameters.email) {
        return ({
            statusCode: 400,
            headers: util.getResponseHeaders(),
            body: "Please provide an email!",
        });
    }

    const ticker = queryStringParameters.ticker;
    const limit = queryStringParameters.limit;
    const email = queryStringParameters.email;

    const token = process.env.TOKEN_E;
    const token12 = process.env.TOKEN_12;
    let existingWatchlistItems = await getWatchlist(email);

    // Function to make a GET request to the first API
    function getDataFromFirstAPI() {
        return new Promise((resolve, reject) => {
            // const external_url = `https://api.twelvedata.com/symbol_search?symbol=${ticker}&apikey=${token12}&outputsize=30`;
            const external_url = `https://eodhd.com/api/search/${ticker}?api_token=${token}&fmt=json&exchange=us&limit=10`;

            const req = https.get(external_url, res => {
                let data = '';

                res.on('data', chunk => {
                    data += chunk;
                });

                res.on('end', () => {
                    const temp = JSON.parse(data);
                    let filtered = temp?.filter(obj => {
                        return obj["Type"] === "Common Stock" || obj["Type"] === "ETF";
                    });

                    let result = filtered.slice(0, limit);
                    resolve(result);
                });
            });

            req.on('error', error => {
                reject(error);
            });

            req.end();
        });
    }

    // Function to make a GET request to the second API for quote
    function getDataFromSecondAPI(code) {
        return new Promise((resolve, reject) => {
            const external_url = `https://api.twelvedata.com/quote?symbol=${code}&apikey=${token12}`;
            const req = https.get(external_url, res => {
                let data = '';

                res.on('data', chunk => {
                    data += chunk;
                });

                res.on('end', () => {
                    resolve(JSON.parse(data));
                });
            });

            req.on('error', error => {
                reject(error);
            });

            req.end();
        });
    }

    // Function to make a GET request to the third API for logo
    function getLogoDataFromThirdApi(code) {
        return new Promise((resolve, reject) => {
            const external_url = `https://api.twelvedata.com/logo?symbol=${code}&apikey=${token12}`;
            const req = https.get(external_url, res => {
                let data = '';

                res.on('data', chunk => {
                    data += chunk;
                });

                res.on('end', () => {
                    resolve(JSON.parse(data));
                });
            });

            req.on('error', error => {
                reject(error);
            });

            req.end();
        });
    }

    async function fetchDataInLoop() {
        const dataArray = [];
        try {
            const dataFromFirstAPI = await getDataFromFirstAPI();
            const promises = [];

            for (let k = 0; k < limit; k++) {
                const code = dataFromFirstAPI[k]?.Code;
                if (code) {
                    promises.push((async () => {

                        const [dataFromSecondAPI, logoFromThirdApi] = await Promise.all([
                            getDataFromSecondAPI(code),
                            getLogoDataFromThirdApi(code),
                        ]);
                        dataFromSecondAPI["logo"] = logoFromThirdApi?.url;
                        dataFromSecondAPI["instrument_type"] = dataFromFirstAPI[k]?.Type;
                        // dataFromSecondAPI["isWatchlisted"] = existingWatchlistItems.includes(code);
                        return dataFromSecondAPI;
                    })());
                }
            }
            const results = await Promise.all(promises);
            dataArray.push(...results);
            console.log(dataArray)
        } catch (error) {
            console.error('Error:', error);
        }
        return dataArray;
    }

    function isWatchlisted(res, existingWatchlistItems) {
        const watchlistSet = new Set(existingWatchlistItems);

        for (let item of res) {
            item.isWatchlisted = watchlistSet.has(item.symbol);
        }

        return res;
    }

    // const redis = new Redis({
    //     port: 6379,
    //     host: "cw-dev-cluster.fmpkqs.0001.euc1.cache.amazonaws.com"
    // });

    let final_result;

    try {
        // const redis_result = await redis.get(`search::${ticker}-${limit}`);

        // console.log("redis_result", redis_result)

        // if (redis_result === null) {
        // TO GET STOCK SEARCH RESULT WITH ETF/STOCK FILTERS
        const response = await fetchDataInLoop();

        console.log("response", response)
        final_result = isWatchlisted(response, existingWatchlistItems)

        // try {
        //     const redisSet = await redis.set(`search::${ticker}-${limit}`, JSON.stringify(response, null, 4), "EX", 1800);
        //     console.log(redisSet);
        // } catch (error) {
        //     console.error(error);
        // }
        // } else {
        //     const res = JSON.parse(redis_result)
        //     console.log("before", res)
        //     final_result = isWatchlisted(res, existingWatchlistItems)
        //     console.log("after", final_result)
        // }
        return {
            statusCode: 200,
            headers: util.getResponseHeaders(),
            body: JSON.stringify(final_result, null, 4)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: util.getResponseHeaders(),
            body: error
        }
    } finally {
        // redis.disconnect();
    }
};

module.exports = {
    getStockSearch
}