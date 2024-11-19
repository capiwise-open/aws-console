const { getWatchlist } = require("../../db/user_profile");
const util = require("./utils");
const https = require("https");

const getTrendingMarketExchangeList = async (event) => {
    // TO DECRYPT THE TOKEN
    const token = process.env.TOKEN_E;
    const token12 = process.env.TOKEN_12;

    try {

        // Function to make a GET request to the first API
        function getDataFromFirstAPI() {
            return new Promise((resolve, reject) => {
                const external_url = `https://eodhistoricaldata.com/api/screener?api_token=${token}&sort=avgvol_1d.desc&filters=[[%22market_capitalization%22,%22%3E%22,1000000],[%22exchange%22,%22=%22,%22us%22]]&limit=10`;

                const req = https.get(external_url, res => {
                    let data = '';

                    res.on('data', chunk => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        const value = JSON.parse(data).data;
                        resolve(value);
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

        function isAlphabetOnly(key) {
            // Regular expression pattern to match alphabetic characters
            const regex = /^[A-Za-z]+$/;
            return regex.test(key);
        }

        // Function to fetch data from both APIs in a loop
        async function fetchDataInLoop() {
            const dataArray = [];
            try {
                let existingWatchlistItems = await getWatchlist(event.queryStringParameters?.email);
                console.log("####################", existingWatchlistItems, event.queryStringParameters?.email);
                const dataFromFirstAPI = await getDataFromFirstAPI();
                const promises = [];
                for (let k = 0; k < 10; k++) {
                    if (isAlphabetOnly(dataFromFirstAPI[k].code)) {
                        promises.push((async () => {
                            const code = dataFromFirstAPI[k].code;
                            const [dataFromSecondAPI, logoFromThirdApi] = await Promise.all([
                                getDataFromSecondAPI(code),
                                getLogoDataFromThirdApi(code),
                            ]);
                            dataFromSecondAPI["logo"] = logoFromThirdApi?.url;
                            dataFromSecondAPI["isWatchlisted"] = existingWatchlistItems?.includes(code)

                            return dataFromSecondAPI;
                        })());
                    }
                }
                const results = await Promise.all(promises);
                dataArray.push(...results);
            } catch (error) {
                console.error('Error:', error);
            }
            return dataArray;
        }


        // const exchangeList = ["us", "shg", "pa", "she", "to", "nse", "lse", "v", "br", "sw"];
        const exchangeList = ["us", "nyse", "nasdaq"];

        try {
            const result = await fetchDataInLoop(exchangeList);
            return {
                statusCode: 200,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({
                    exchanges: exchangeList,
                    data: result
                }, null, 4)
            };
        } catch (error) {
            console.error('Error:', error);
            return {
                statusCode: 500,
                headers: util.getResponseHeaders(),
                body: JSON.stringify({ message: 'Internal Server Error' }, null, 4)
            };
        }
    } catch (e) {

    }
};

module.exports = {
    getTrendingMarketExchangeList
}