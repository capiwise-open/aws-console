const utility = require("../../util");
const https = require("https");
const { getWatchlist } = require("../../db/user_profile");

const e_token = process.env.TOKEN_E;
const e_token12 = process.env.TOKEN_12;

const getTopEarningStocks = async (event) => {
    const { queryStringParameters } = event;
    if (!queryStringParameters || !queryStringParameters.category) {
        return {
            statusCode: 400,
            headers: util.getResponseHeaders(),
            body: "Please provide a category!",
        };
    }

    if (!queryStringParameters || !queryStringParameters.email) {
        return {
            statusCode: 400,
            headers: util.getResponseHeaders(),
            body: "Please provide an email!",
        };
    }
    try {
        let existingWatchlistItems = await getWatchlist(queryStringParameters?.email);
        if (!existingWatchlistItems || existingWatchlistItems.length == 0)
            throw new Error("watchlist empty");
        const response1 = await fetchFirstAPI(e_token, queryStringParameters?.category);

        if (response1.statusCode < 400) {
            const result1Array = await fetchDataInLoop(response1.body.data, e_token12, existingWatchlistItems);
            return {
                statusCode: response1.statusCode,
                headers: utility.getResponseHeaders(),
                body: JSON.stringify(result1Array, null, 4)
            };
        }
    } catch (e) {
        return {
            statusCode: 500,
            headers: utility.getResponseHeaders(),
            body: "Something went wrong!",
        };
    }
};

// {
//     "code": "SWZNF",
//     "name": "Schweizerische Nationalbank",
//     "last_day_data_date": "2024-06-14",
//     "adjusted_close": 4503.9302,
//     "refund_1d": 0,
//     "refund_1d_p": 0,
//     "refund_5d": 0,
//     "refund_5d_p": 0,
//     "exchange": "US",
//     "currency_symbol": "$",
//     "market_capitalization": 432318016,
//     "earnings_share": 320830.7,
//     "dividend_yield": null,
//     "sector": "Financial Services",
//     "industry": "Banks - Regional",
//     "avgvol_1d": 0,
//     "avgvol_200d": 0.4
// }

async function fetchFirstAPI(e_token, type) {
    return new Promise((resolve, reject) => {
        let dataString = "";
        let external_url = "";
        switch (type) {
            case "top":
                external_url = `https://eodhistoricaldata.com/api/screener?api_token=${e_token}&sort=earnings_share.desc&limit=10&offset=0&filters=[["exchange","=","us"]]`;
                break;
            case "trending":
                external_url = `https://eodhistoricaldata.com/api/screener?api_token=${e_token}&sort=avgvol_1d.desc&filters=[["market_capitalization",">",1000000],["exchange","=","us"]]&limit=10&offset=0`;
                break;
            case "active":
                external_url = `https://eodhistoricaldata.com/api/screener?api_token=${e_token}&sort=avgvol_1d.desc&filters=[["market_capitalization",">",1000000],["exchange","=","us"]]&limit=10&offset=0`;
                break;
            case "gainer":
                external_url = `https://eodhistoricaldata.com/api/screener?api_token=${e_token}&sort=refund_1d_p.desc&filters=[["market_capitalization",">",1000000],["exchange","=","us"]]&limit=10&offset=0`;
                break;
            case "looser":
                external_url = `https://eodhistoricaldata.com/api/screener?api_token=${e_token}&sort=refund_1d_p.asc&filters=[["market_capitalization",">",1000000],["exchange","=","us"]]&limit=10&offset=0`;
                break;
            default:
                external_url = `https://eodhistoricaldata.com/api/screener?api_token=${e_token}&sort=earnings_share.desc&limit=10&offset=0&filters=[["exchange","=","us"]]`;
                break;
        }

        const req = https.get(external_url, function (res) {
            res.on("data", (chunk) => {
                dataString += chunk;
            });
            res.on("close", () => {
                if (res.statusCode < 400) {
                    const temp = JSON.parse(dataString);
                    resolve({
                        statusCode: res.statusCode,
                        headers: utility.getResponseHeaders(),
                        body: temp
                    });
                } else {
                    resolve({
                        statusCode: res.statusCode,
                        headers: utility.getResponseHeaders(),
                        body: dataString
                    });
                }
            });
            req.on("error", (e) => {
                resolve({
                    statusCode: 500,
                    headers: utility.getResponseHeaders(),
                    body: "Something went wrong!",
                });
            });
        })
    });
}

// async function fetchDataFromSecondAPI(dataArray, e_token12, existingWatchlistItems) {
//   const requests = dataArray.map(item => getDataFromSecondAPI(item.code, e_token12));
//   const results = await Promise.all(requests.map(p => p.catch(e => e)));

//   return results.filter(result => !(result instanceof Error)).map(dataFromSecondAPI => {
//     if (dataFromSecondAPI.code !== 404) {
//       dataFromSecondAPI["isWatchlisted"] = existingWatchlistItems.includes(dataFromSecondAPI.symbol);
//       return dataFromSecondAPI;
//     }
//   }).filter(Boolean);
// }

function isAlphabetOnly(key) {
    // Regular expression pattern to match alphabetic characters
    const regex = /^[A-Za-z]+$/;
    return regex.test(key);
}

async function fetchDataInLoop(dataArray, e_token12, existingWatchlistItems) {
    let resultArray = [];
    try {
        const promises = [];
        for (let k = 0; k < 10; k++) {
            if (isAlphabetOnly(dataArray[k].code)) {
                promises.push((async () => {
                    const code = dataArray[k].code;
                    const [dataFromSecondAPI, typeFromApi, logoFromThirdApi] = await Promise.all([
                        getDataFromSecondAPI(code, e_token12),
                        getTypeDataFromApi(code, e_token12),
                        getLogoDataFromThirdApi(code, e_token12),
                    ]);
                    if (dataFromSecondAPI.code !== 404) {
                        dataFromSecondAPI["logo"] = logoFromThirdApi?.url;
                        dataFromSecondAPI["instrument_type"] = typeFromApi?.data[0]?.instrument_type;
                        dataFromSecondAPI["isWatchlisted"] = existingWatchlistItems.includes(code)

                        return dataFromSecondAPI;
                    }
                })());
            }
        }
        const results = await Promise.all(promises);
        resultArray.push(...results);
    } catch (error) {
        console.error('Error:', error);
    }
    return resultArray.filter(item => item !== null);
}

async function getDataFromSecondAPI(code, e_token12) {
    return new Promise((resolve, reject) => {
        const external_url = `https://api.twelvedata.com/quote?symbol=${code}&apikey=${e_token12}`;
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

async function getLogoDataFromThirdApi(code, e_token12) {
    return new Promise((resolve, reject) => {
        const external_url = `https://api.twelvedata.com/logo?symbol=${code}&apikey=${e_token12}`;
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

async function getTypeDataFromApi(code, e_token12) {
    return new Promise((resolve, reject) => {
        const external_url = `https://api.twelvedata.com/symbol_search?symbol=${code}&apikey=${e_token12}&outputsize=1`;
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

module.exports = { getTopEarningStocks };