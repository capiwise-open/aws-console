const https = require("https");
const utility = require("./../../util");
const { getWatchlist } = require("../../db/user_profile");

const top100Stocks = [
    "AAPL",
    "MSFT",
    "AMZN",
    "GOOG",
    "FB",
    "TSLA",
    "JNJ",
    "V",
    "WMT",
    "JPM",
    "PG",
    "UNH",
    "MA",
    "HD",
    "NVDA",
    "BAC",
    "PFE",
    "XOM",
    "NFLX",
    "ADBE",
    "INTC",
    "CMCSA",
    "VZ",
    "CSCO",
    "T",
    "CVX",
    "ORCL",
    "MRK",
    "KO",
    "ABT",
    "PEP",
    "CRM",
    "ABBV",
    "MCD",
    "TMO",
    "NKE",
    "LLY",
    "AVGO",
    "ACN",
    "COST",
    "DIS",
    "WFC",
    "HON",
    "C",
    "BA",
    "AMGN",
    "GS",
    "AXP",
    "MDT",
    "MS",
    "CAT",
    "MMM",
    "SCHW",
    "NEE",
    "GILD",
    "PG",
    "LOW",
    "PM",
    "UNP",
    "SBUX",
    "LIN",
    "QCOM",
    "MO",
    "LMT",
    "USB",
    "IBM",
    "BMY",
    "GE",
    "RTX",
    "DUK",
    "AMD",
    "DE",
    "GM",
    "TGT",
    "TXN",
    "CVS",
    "GS",
    "MDLZ",
    "AMT",
    "ADP",
    "F",
    "COP",
    "CL",
    "SO",
    "KHC",
    "EL",
    "SPG",
    "APD",
    "D",
    "ECL",
    "SHW",
    "BIIB",
    "SLB",
    "PNC",
    "BKNG",
    "MMC",
    "ISRG",
    "FIS",
    "REGN"
]

const fetchData = (url) => new Promise((resolve, reject) => {
    https.get(url, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
});

const getWeekRangeFromDate = (inputDateStr) => {
    const inputDate = new Date(inputDateStr + "T00:00:00"); // Adding time part to ensure consistent parsing
    const dayOfWeek = inputDate.getDay();

    // Calculate the start date of the week (Sunday)
    const startDate = new Date(inputDate);
    startDate.setDate(inputDate.getDate() - dayOfWeek);

    // Calculate the end date of the week (Saturday)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const format = (date) => date.toISOString().split("T")[0];

    return { start: format(startDate), end: format(endDate) };
}

const getDatesBetween = (startDateStr, endDateStr) => {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    let currentDate = new Date(startDate);
    const dates = [];

    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate = new Date(currentDate.setHours(0, 0, 0, 0));
    }

    return dates;
}

const getTopGainerStocks = async (event) => {
    const { queryStringParameters } = event;

    // Check if query parameters exist
    if (!queryStringParameters || !queryStringParameters.date) {
        return {
            statusCode: 400,
            headers: utility.getResponseHeaders(),
            body: JSON.stringify({ message: "Please provide date!" }),
        };
    }

    if (!queryStringParameters || !queryStringParameters.email) {
        return {
            statusCode: 400,
            headers: util.getResponseHeaders(),
            body: JSON.stringify({ message: "Please provide email!" }),
        };
    }

    // redis initialization
    // const redis = new Redis({
    //     port: 6379,
    //     host: "cw-dev-cluster.fmpkqs.0001.euc1.cache.amazonaws.com"
    // });

    try {
        let existingWatchlistItems = await getWatchlist(queryStringParameters.email);

        const inputDate = queryStringParameters.date;
        const range = getWeekRangeFromDate(inputDate)
        const dateRange = getDatesBetween(range.start, range.end)
        console.log("dateRange: ", dateRange);

        const e_token = process.env.TOKEN_E ?? "64345cf30e4434.02379125";
        const e_token12 = process.env.TOKEN_12;

        const currentYear = new Date().getFullYear();
        // const redis_result = await redis.get(`allEarnings`);

        let results;

        // if (redis_result === null) {
        results = await Promise.allSettled(top100Stocks.map(stock =>
            fetchData(`https://eodhd.com/api/fundamentals/${stock}?filter=Earnings&api_token=${e_token}&fmt=json`)
        ));

        const resultsByStock = [];

        results.forEach((result, index) => {
            if (result.status === "fulfilled") {
                const stock = top100Stocks[index];
                resultsByStock.push({ [stock]: result.value.History })
            }
        });
        //redis update
        // try {
        //     const redisSet = await redis.set(`allEarnings`, JSON.stringify(resultsByStock, null, 4), "EX", 86400);
        //     console.log(redisSet);
        // } catch (error) {
        //     console.error(error);
        // }
        // } else {
        //     results = JSON.parse(redis_result)
        // }
        const dateGroups = {};
        dateRange.map((date, index) => {
            dateGroups[date] = []
        })

        results.forEach((result, index) => {
            const resultKey = Object.keys(result)
            Object.entries(result[resultKey[0]]).forEach(([key, value]) => {
                // Assuming `value.reportDate` exists and is in 'YYYY-MM-DD' format
                if (key.startsWith(currentYear.toString()) && dateRange.includes(value.reportDate)) {
                    dateGroups[value.reportDate].push(resultKey[0]);
                }
            });
        });

        let enrichedResults
        if (dateGroups[inputDate].length > 0) {
            enrichedResults = await Promise.all(dateGroups[inputDate].map(async (item) => {
                const quoteData = await fetchData(`https://api.twelvedata.com/quote?symbol=${item}&apikey=${e_token12}`);
                const logoData = await fetchData(`https://api.twelvedata.com/logo?symbol=${item}&apikey=${e_token12}`);
                const typeData = await fetchData(`https://api.twelvedata.com/symbol_search?symbol=${item}&apikey=${e_token12}&outputsize=1`)

                quoteData["logo"] = logoData?.url;
                quoteData["instrument_type"] = typeData?.data[0]?.instrument_type;
                quoteData["isWatchlisted"] = existingWatchlistItems?.includes(item)
                return { ...quoteData };
            }));
        } else {
            enrichedResults = []
        }

        console.log("enrichedResults: ", enrichedResults)

        return {
            statusCode: 200,
            headers: utility.getResponseHeaders(),
            body: JSON.stringify({
                dateGroups: dateGroups,
                items: enrichedResults
            }, null, 4)
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers: util.getResponseHeaders(),
            body: err
        }
    }
};

// Export the User function
module.exports = { getTopGainerStocks };