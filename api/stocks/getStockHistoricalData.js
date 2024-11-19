const util = require("./utils");
const https = require("https");

const getStockHistoricalData = async (event) => {
    const { queryStringParameters } = event;
    const validDuration = ["1d", "1w", "1m", "6m", "1y", "5y", "mx"];
    if (!queryStringParameters || !queryStringParameters.ticker) {
        return ({
            statusCode: 400,
            headers: util.getResponseHeaders(),
            body: "Please provide a ticker!",
        });
    }

    if (!validDuration.includes(queryStringParameters.period)) {
        return ({
            statusCode: 400,
            headers: util.getResponseHeaders(),
            body: "Please provide a valid period!",
        });
    }

    const duration = queryStringParameters.period;
    const ticker = queryStringParameters.ticker;
    // TO DECRYPT THE TOKEN
    const token = process.env.TOKEN_12;

    // TO GET HISTORICAL DATA FROM EOD HISTORICAL API
    const response = await new Promise((resolve, reject) => {
        let dataString = "";
        let external_url = "";

        switch (duration) {
            case "1d":
                external_url = `https://api.twelvedata.com/time_series?symbol=${ticker}&apikey=${token}&interval=5min&outputsize=78`;
                break;
            case "1w":
                external_url = `https://api.twelvedata.com/time_series?symbol=${ticker}&apikey=${token}&interval=30min&outputsize=65`;
                break;
            case "1m":
                external_url = `https://api.twelvedata.com/time_series?symbol=${ticker}&apikey=${token}&interval=2h&outputsize=84`;
                break;
            case "6m":
                external_url = `https://api.twelvedata.com/time_series?symbol=${ticker}&apikey=${token}&interval=1day&outputsize=125`;
                break;
            case "1y":
                external_url = `https://api.twelvedata.com/time_series?symbol=${ticker}&apikey=${token}&interval=1week&outputsize=50`;
                break;
            case "5y":
                external_url = `https://api.twelvedata.com/time_series?symbol=${ticker}&apikey=${token}&interval=1month&outputsize=60`;
                break;
            case "mx":
                external_url = `https://api.twelvedata.com/time_series?symbol=${ticker}&apikey=${token}&interval=1month&outputsize=180`;
                break;
            default:
                break;
        }

        const req = https.get(external_url, function (res) {
            res.on("data", (chunk) => {
                dataString += chunk;
            });
            res.on("close", () => {
                if (res.statusCode < 400) {
                    let result = JSON.parse(dataString)["values"];
                    const resultLength = result.length
                    result.reverse();
                    let viewLabels = [];
                    let firstDateTime = result[0].datetime;
                    let lastDateTime = result[resultLength - 1].datetime;
                    let startIndex = 0;

                    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                    function formatDate(date) {
                        let day = date.getDate();
                        let monthIndex = date.getMonth();
                        let monthName = months[monthIndex];
                        return `${day < 10 ? '0' + day : day} ${monthName}`;
                    }

                    function getYearFromDate(dateString) {
                        return new Date(dateString).getFullYear();
                    }

                    function getMonthNameFromDate(dateString) {
                        let date = new Date(dateString);
                        return months[date.getMonth()];
                    }

                    switch (duration) {
                        case "1d":
                            result.forEach((value, key) => {
                                if (key % 15 == 0) {
                                    viewLabels.push(value.datetime.split(' ')[1].substring(0, 5));
                                }
                            });
                            break;
                        case "1w":
                            let strTodate = new Date(firstDateTime);
                            let cDay = strTodate.toLocaleDateString('en-US', { weekday: 'short' }).split(',')[0];
                            startIndex = weekdays.indexOf(cDay);

                            for (let i = 0; i < 5; i++) {
                                let nextIndex = (startIndex + i) % 5;
                                let nextWeekday = weekdays[nextIndex];
                                viewLabels.push(nextWeekday);
                            }
                            break;
                        case "1m":
                            result.forEach((value, key) => {
                                if (key % 15 == 0) {
                                    let d = new Date(value.datetime);
                                    viewLabels.push(formatDate(d));
                                }
                            });
                            break;
                        case "6m":
                            let formattedDate6m = getMonthNameFromDate(firstDateTime);
                            startIndex = months.indexOf(formattedDate6m);

                            for (let i = 0; i < 6; i++) {
                                let nextIndex = (startIndex + i) % 12;
                                let month = months[nextIndex];
                                viewLabels.push(month);
                            }
                            break;
                        case "1y":
                            let formattedDate1y = getMonthNameFromDate(firstDateTime);
                            startIndex = months.indexOf(formattedDate1y);

                            for (let i = 0; i < 12; i += 2) {
                                let nextIndex = (startIndex + i) % 12;
                                let month = months[nextIndex];
                                viewLabels.push(month);
                            }
                            break;
                        case "5y":
                            lastDateTime = getYearFromDate(lastDateTime);
                            firstDateTime = getYearFromDate(firstDateTime);
                            for (let i = firstDateTime; i < lastDateTime; i++) {
                                viewLabels.push(String(i));
                            }
                            break;
                        case "mx":
                            lastDateTime = getYearFromDate(lastDateTime);
                            firstDateTime = getYearFromDate(firstDateTime);
                            let totalYears = [];
                            for (let i = firstDateTime; i <= lastDateTime; i++) {
                                totalYears.push(String(i));
                            }

                            const totalItems = totalYears.length;
                            const itemCount = 6;
                            const stepSize = Math.ceil((totalItems - 1) / (itemCount - 1));

                            for (let i = 0; i < itemCount && i * stepSize < totalItems; i++) {
                                let idx = i * stepSize;
                                if (i == itemCount - 1 && itemCount > 1) {
                                    viewLabels.push(totalYears[totalItems - 1]);
                                } else {
                                    viewLabels.push(totalYears[idx]);
                                }
                            }
                            break;
                        default:
                            break;
                    }

                    let final_result = {
                        viewLabels: viewLabels,
                        result: result
                    };

                    resolve({
                        statusCode: res.statusCode,
                        headers: util.getResponseHeaders(),
                        body: JSON.stringify(final_result, null, 4)
                    });
                } else {
                    resolve({
                        statusCode: res.statusCode,
                        headers: util.getResponseHeaders(),
                        body: dataString,
                    });
                }
            });
        });

        req.on("error", (e) => {
            resolve({
                statusCode: 500,
                headers: util.getResponseHeaders(),
                body: "Something went wrong!",
            });
        });
    });
    return response;
};

module.exports = {
    getStockHistoricalData
}