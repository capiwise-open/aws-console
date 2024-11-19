const { getWatchlist } = require("../../db/user_profile");
const util = require("./utils");
const https = require("https");

// TO DECRYPT THE TOKEN
const token = process.env.TOKEN_E;
const token_12 = process.env.TOKEN_12;

const getETFStockSummary = async (event) => {
    const { queryStringParameters } = event;
    if (!queryStringParameters || !queryStringParameters.ticker) {
        return {
            statusCode: 400,
            headers: util.getResponseHeaders(),
            body: "Please provide a ticker!",
        };
    }

    const { ticker, email } = queryStringParameters;

    // TO GET FROMDATE, TODATE, CURRENT YEAR, FROMDATE FOR PERFORMANCE CALCULATION
    let date = new Date();
    const [currYYYY, currMM, currDD, perfFromDate] = util.yyyymmdd(date);
    const fromDate = `${currYYYY - 10}-${currMM}-${currDD}`;
    const toDate = `${currYYYY - 1}-12-31`;

    const sectors = {
        "Energy": "XLE.US",
        "Basic Materials": "XLB.US",
        "Industrials": "XLI.US",
        "Consumer Cyclicals": "XLY.US",
        "Consumer Defensive": "XLP.US",
        "Healthcare": "XLV.US",
        "Financial Services": "XLF.US",
        "Technology": "XLK.US",
        "Communication Services": "XTL.US",
        "Utilities": "XLU.US",
        "Real Estate": "XLRE.US"
    };

    // redis initialization
    // const redis = new Redis({
    //     port: 6379,
    //     host: "cw-dev-cluster.fmpkqs.0001.euc1.cache.amazonaws.com"
    // });

    try {
        // const redis_result = await redis.get(`etfSummary::${ticker}`);

        // if (redis_result === null) {
        // credit current usage and plan limit check and validation
        const current_usage_check = new Promise((resolve, reject) => {
            let dataString = "";
            const external_url = `https://api.twelvedata.com/api_usage?symbol=${ticker}&apikey=${token_12}`;

            const req = https.get(external_url, function (res) {
                res.on("data", (chunk) => {
                    dataString += chunk;
                });
                res.on("close", () => {
                    if (res.statusCode < 300) {
                        const temp = JSON.parse(dataString);
                        resolve({
                            statusCode: res.statusCode,
                            headers: util.getResponseHeaders(),
                            body: temp
                        });
                    } else {
                        resolve({
                            statusCode: res.statusCode,
                            headers: util.getResponseHeaders(),
                            body: dataString
                        });
                    }
                });
                req.on("error", (e) => {
                    resolve({
                        statusCode: 500,
                        headers: util.getResponseHeaders(),
                        body: {
                            message: "Something went wrong!"
                        }
                    });
                });
            })
        })

        current_credit = await current_usage_check;
        if (current_credit.statusCode >= 400) {
            return {
                statusCode: 500,
                headers: util.getResponseHeaders(),
                body: {
                    message: "API provider is on maintenance!, Please try again later."
                }
            };
        }
        const current = current_credit.body.current_usage;
        const limit = current_credit.body.plan_limit;
        console.log("current credit used", current)
        console.log("credit plan limit", limit)
        if (current + 54 > limit) {
            return {
                statusCode: 500,
                headers: util.getResponseHeaders(),
                body: {
                    message: "Current credit is over limit!, Please try again 1min later."
                }
            };
        }

        // TO GET ETF SUMMARY FROM FUNDAMENTAL API
        const response1 = new Promise((resolve, reject) => {
            let dataString = "";
            const external_url = `https://eodhistoricaldata.com/api/fundamentals/${ticker}?
api_token=${token}&
filter=
ETF_Data::TotalAssets,ETF_Data::NetExpenseRatio,ETF_Data::Inception_Date,ETF_Data::Company_Name,ETF_Data::Company_URL,ETF_Data::Valuations_Growth,
ETF_Data::Performance,ETF_Data::Market_Capitalisation,ETF_Data::Dividend_Paying_Frequency,ETF_Data::Yield,ETF_Data::Sector_Weights,ETF_Data::Top_10_Holdings`;

            const req = https.get(external_url, function (res) {
                res.on("data", (chunk) => {
                    dataString += chunk;
                });
                res.on("close", () => {
                    if (res.statusCode < 400) {
                        let finalClean = util.dataCleaning(dataString)
                        const temp = JSON.parse(finalClean);
                        resolve({
                            statusCode: res.statusCode,
                            headers: util.getResponseHeaders(),
                            body: temp
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
                    body: {
                        message: "Something went wrong!"
                    }
                });
            });
        });

        // TO GET YEARS RATE OF RETURNS AND 52-WEEKS PRICE PERFORMANCE
        const response2 = new Promise((resolve, reject) => {
            let dataString = "";
            const external_url = `https://api.twelvedata.com/time_series?symbol=${ticker}&apikey=${token_12}&interval=1day&outputsize=255`;

            const req = https.get(external_url, function (res) {
                res.on("data", (chunk) => {
                    dataString += chunk;
                });
                res.on("close", () => {
                    if (res.statusCode < 400) {
                        const temp = JSON.parse(dataString !== "" ? dataString : "{}");
                        resolve({
                            statusCode: res.statusCode,
                            headers: util.getResponseHeaders(),
                            body: temp
                        });
                    } else {
                        resolve({
                            statusCode: res.statusCode,
                            headers: util.getResponseHeaders(),
                            body: dataString
                        });
                    }
                });
                req.on("error", (e) => {
                    resolve({
                        statusCode: 500,
                        headers: util.getResponseHeaders(),
                        body: {
                            message: "Something went wrong!"
                        }
                    });
                });
            })
        })

        const response3 = new Promise((resolve, reject) => {
            let dataString = "";
            const external_url = `https://api.twelvedata.com/quote?symbol=${ticker}&apikey=${token_12}`;

            const req = https.get(external_url, function (res) {
                res.on("data", (chunk) => {
                    dataString += chunk;
                });
                res.on("close", () => {
                    if (res.statusCode < 400) {
                        const temp = JSON.parse(dataString);
                        resolve({
                            statusCode: res.statusCode,
                            headers: util.getResponseHeaders(),
                            body: temp
                        });
                    } else {
                        resolve({
                            statusCode: res.statusCode,
                            headers: util.getResponseHeaders(),
                            body: dataString
                        });
                    }
                });
                req.on("error", (e) => {
                    resolve({
                        statusCode: 500,
                        headers: util.getResponseHeaders(),
                        body: {
                            message: "Something went wrong!"
                        }
                    });
                });
            })
        })

        const response4 = new Promise((resolve, reject) => {
            let dataString = "";
            const external_url = `https://api.twelvedata.com/dividends?symbol=${ticker}&apikey=${token_12}&range=full`;

            const req = https.get(external_url, function (res) {
                res.on("data", (chunk) => {
                    dataString += chunk;
                });
                res.on("close", () => {
                    if (res.statusCode < 400) {
                        const temp = JSON.parse(dataString);
                        resolve({
                            statusCode: res.statusCode,
                            headers: util.getResponseHeaders(),
                            body: temp
                        });
                    } else {
                        resolve({
                            statusCode: res.statusCode,
                            headers: util.getResponseHeaders(),
                            body: dataString
                        });
                    }
                });
                req.on("error", (e) => {
                    resolve({
                        statusCode: 500,
                        headers: util.getResponseHeaders(),
                        body: {
                            message: "Something went wrong!"
                        }
                    });
                });
            })
        })

        const response5 = new Promise((resolve, reject) => {
            let dataString = "";
            const external_url = `https://api.twelvedata.com/profile?symbol=${ticker}&apikey=${token_12}`;

            const req = https.get(external_url, function (res) {
                res.on("data", (chunk) => {
                    dataString += chunk;
                });
                res.on("close", () => {
                    if (res.statusCode < 400) {
                        const temp = JSON.parse(dataString);
                        resolve({
                            statusCode: res.statusCode,
                            headers: util.getResponseHeaders(),
                            body: temp
                        });
                    } else {
                        resolve({
                            statusCode: res.statusCode,
                            headers: util.getResponseHeaders(),
                            body: dataString
                        });
                    }
                });
                req.on("error", (e) => {
                    resolve({
                        statusCode: 500,
                        headers: util.getResponseHeaders(),
                        body: {
                            message: "Something went wrong!"
                        }
                    });
                });
            })
        })

        const response6 = new Promise((resolve, reject) => {
            let dataString = "";
            const external_url = `https://eodhistoricaldata.com/api/fundamentals/${ticker}?api_token=${token}&filter=ETF_Data::Holdings,ETF_Data::Holdings_Count`;

            const req = https.get(external_url, function (res) {
                res.on("data", (chunk) => {
                    dataString += chunk;
                });
                res.on("close", () => {
                    if (res.statusCode < 400) {
                        let finalClean = util.dataCleaning(dataString)
                        const temp = JSON.parse(finalClean);
                        resolve({
                            statusCode: res.statusCode,
                            headers: util.getResponseHeaders(),
                            body: temp
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
                    body: {
                        message: "Something went wrong!"
                    }
                });
            });
        });

        const response7 = new Promise((resolve, reject) => {
            let dataString = "";
            // const external_url = `https://eodhistoricaldata.com/api/eod/${ticker}?api_token=${token}&period=m&fmt=json&order=d&from=${fromDate}`;
            const external_url = `https://eodhistoricaldata.com/api/eod/${ticker}?api_token=${token}&period=d&fmt=json&order=d&from=${fromDate}&to=${toDate}`;

            const req = https.get(external_url, function (res) {
                res.on("data", (chunk) => {
                    dataString += chunk;
                });
                res.on("close", () => {
                    if (res.statusCode < 400) {
                        const temp = JSON.parse(dataString);
                        // console.log("temp7", temp);
                        // let chance = 0, risk = 0;
                        // [chance, risk] = util.getRiskReturns(temp);
                        // const result = {
                        //   "ETF::Chance": chance,
                        //   "ETF::Risk": risk
                        // };
                        resolve({
                            statusCode: res.statusCode,
                            headers: util.getResponseHeaders(),
                            body: temp
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
                    body: {
                        message: "Something went wrong!"
                    }
                });
            });
        });

        try {
            var [result1, result2, result3, result4, result5, result6, result7] =
                await Promise.all([response1, response2, response3, response4, response5, response6, response7]);

            let expenseRatio_val = result1?.body["ETF_Data::NetExpenseRatio"];
            expenseRatio_val = expenseRatio_val ? (expenseRatio_val * 100) : null;
            const sector_weights = result1?.body["ETF_Data::Sector_Weights"];
            const top10_holdings = result1?.body["ETF_Data::Top_10_Holdings"];
            let max = -Infinity;
            let sector = null;
            let industry = null;
            const sectorExposure = [];

            if (sector_weights && top10_holdings) {
                for (let key in sector_weights) {
                    if (max < sector_weights[key]["Equity_%"]) {
                        max = parseFloat(sector_weights[key]["Equity_%"]);
                        sector = key;
                    }

                    sectorExposure.push(
                        {
                            "Sector": key,
                            "Assets_%": sector_weights[key]["Equity_%"]
                        }
                    )
                }
                industry = top10_holdings[Object.keys(top10_holdings)[0]]["Industry"];
            }

            sectorExposure.sort((a, b) => parseFloat(b["Assets_%"]) - parseFloat(a["Assets_%"]));

            let expenseRatio_val_index = null;
            let chance_index = 0, risk_index = 0;
            let performance_index = null;
            let yield_index = null, valuationsGrowth_index = null
            let dividendsHistory_index = []

            if (sector) {
                const index_res1 = new Promise((resolve, reject) => {
                    let dataString = "";
                    const external_url = `https://eodhistoricaldata.com/api/fundamentals/${sectors[sector]}?api_token=${token}
&filter=ETF_Data::Performance,ETF_Data::Yield,ETF_Data::Valuations_Growth,ETF_Data::NetExpenseRatio`;
                    const req = https.get(external_url, function (res) {
                        res.on("data", (chunk) => {
                            dataString += chunk;
                        });
                        res.on("close", () => {
                            if (res.statusCode < 400) {
                                const temp = JSON.parse(dataString);
                                resolve({
                                    statusCode: res.statusCode,
                                    headers: util.getResponseHeaders(),
                                    body: temp
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
                            body: {
                                message: "Something went wrong!"
                            }
                        });
                    });
                });

                const index_res2 = new Promise((resolve, reject) => {
                    let dataString = "";
                    // const external_url = `https://eodhistoricaldata.com/api/eod/${sectors[sector]}?api_token=${token}&period=m&fmt=json&order=d&from=${fromDate}`;
                    const external_url = `https://eodhistoricaldata.com/api/eod/${sectors[sector]}?api_token=${token}&period=d&fmt=json&order=d&from=${fromDate}&to=${toDate}`

                    const req = https.get(external_url, function (res) {
                        res.on("data", (chunk) => {
                            dataString += chunk;
                        });
                        res.on("close", () => {
                            if (res.statusCode < 400) {
                                const temp = JSON.parse(dataString);
                                // let chance = 0, risk = 0;
                                // [chance, risk] = util.getRiskReturns(temp);
                                // const result = {
                                //   "Index::Chance": chance,
                                //   "Index::Risk": risk
                                // };

                                resolve({
                                    statusCode: res.statusCode,
                                    headers: util.getResponseHeaders(),
                                    body: temp
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
                            body: {
                                message: "Something went wrong!"
                            }
                        });
                    });
                });

                const index_res3 = new Promise((resolve, reject) => {
                    let dataString = "";
                    const sym = sectors[sector].split(".")[0];
                    const external_url = `https://api.twelvedata.com/dividends?symbol=${sym}&apikey=${token_12}&range=full`;

                    const req = https.get(external_url, function (res) {
                        res.on("data", (chunk) => {
                            dataString += chunk;
                        });
                        res.on("close", () => {
                            if (res.statusCode < 400) {
                                const temp = JSON.parse(dataString);
                                resolve({
                                    statusCode: res.statusCode,
                                    headers: util.getResponseHeaders(),
                                    body: temp
                                });
                            } else {
                                resolve({
                                    statusCode: res.statusCode,
                                    headers: util.getResponseHeaders(),
                                    body: dataString
                                });
                            }
                        });
                        req.on("error", (e) => {
                            resolve({
                                statusCode: 500,
                                headers: util.getResponseHeaders(),
                                body: {
                                    message: "Something went wrong!"
                                }
                            });
                        });
                    })
                })
                const [index1, index2, index3] = await Promise.all([index_res1, index_res2, index_res3]);
                if (index1.statusCode < 400 && index2.statusCode < 400 && index3.statusCode < 400) {
                    expenseRatio_val_index = index1.body["ETF_Data::NetExpenseRatio"];
                    expenseRatio_val_index = expenseRatio_val_index ? (expenseRatio_val_index * 100) : null;
                    performance_index = index1.body["ETF_Data::Performance"];
                    yield_index = index1.body["ETF_Data::Yield"];
                    const dividendsFull = index3.body["dividends"];
                    const divHistoryAnnual = util.getDividendDetail(dividendsFull);
                    dividendsHistory_index = divHistoryAnnual;
                    valuationsGrowth_index = index1.body["ETF_Data::Valuations_Growth"];
                    if (index2?.body) {
                        [chance_index, risk_index] = util.getRiskReturns(index2?.body, divHistoryAnnual)
                    }
                }
            }

            let values = result2?.body?.values;
            let w52Perf
            let w52low
            let w52high
            if (values) {
                let lengthOfValues = values?.length;
                w52Perf = (values[0]?.close - values[lengthOfValues - 1]?.close) / values[lengthOfValues - 1]?.close * 100;
                [w52low, w52high] = util.getLowHighDate(values)
            }

            let top10holdings = result1?.body["ETF_Data::Top_10_Holdings"];
            let top10_holdings_weight
            if (top10holdings) {
                top10_holdings_weight = Object.keys(top10holdings).reduce(
                    (prev, key) => prev + top10holdings[key]["Assets_%"],
                    0
                );
            }

            const dividendsFull = result4?.body?.dividends;
            let divHistoryAnnual = []
            if (dividendsFull.length > 0) {
                divHistoryAnnual = util.getDividendDetail(dividendsFull);
            }

            let chance = 0, risk = 0;
            if (result7?.body) {
                [chance, risk] = util.getRiskReturns(result7?.body, divHistoryAnnual);
            }

            const holdings = result6?.body["ETF_Data::Holdings"];
            let industryExposure
            let countryExposure
            let regionExposure
            if (holdings) {
                let arr = Object.values(holdings);
                industryExposure = util.getExposures(arr, "Industry");
                countryExposure = util.getExposures(arr, "Country");
                regionExposure = util.getExposures(arr, "Region");
            }

            let growth10yr = []
            for (let i = 0; i < 11; i++) {
                growth10yr.push({
                    fiscal_date: (parseInt(currYYYY) + i).toString(),
                    self: 10000 * Math.pow(1 + chance / 100, i),
                    index: 10000 * Math.pow(1 + chance_index / 100, i),
                })
            }

            let growth5yr = growth10yr.slice(0, 6)

            let growth3yr = []
            let tmpYr = currYYYY.toString().slice(2, 4)
            for (let i = 0; i < 7; i++) {
                growth3yr.push({
                    fiscal_date: (i % 2 === 0 ? "Jan " : "Jul ") + (parseInt(tmpYr) + Math.floor(i / 2)).toString(),
                    self: 10000 * Math.pow(1 + chance / 200, i),
                    index: 10000 * Math.pow(1 + chance_index / 200, i),
                })
            }

            const orderedMonths = util.getMonthsStartingFrom(currMM)
            let growth1yr = []
            for (let i = 0; i < 12; i++) {
                growth1yr.push({
                    fiscal_date: orderedMonths[i],
                    self: 10000 * Math.pow(1 + chance / 1200, i),
                    index: 10000 * Math.pow(1 + chance_index / 1200, i),
                })
            }

            let feeself = 0;
            let feeindex = 0;
            for (let i = 1; i < 11; i++) {
                if (expenseRatio_val !== null) {
                    feeself += 10000 * Math.pow(1 + 9 / 100, i) * expenseRatio_val / 100
                }
                if (expenseRatio_val_index !== null) {
                    feeindex += 10000 * Math.pow(1 + 9 / 100, i) * expenseRatio_val_index / 100
                }
            }

            let result = {
                "isMarketOpen": result3?.body?.is_market_open,
                "asof": result3?.body?.datetime,
                "overview": {
                    "details": {
                        "name": result5?.body?.name ?? null,
                        "exchange": result5?.body?.exchange ?? null,
                        "symbol": result5?.body?.symbol ?? null,
                        "currency": result3?.body?.currency,
                    },
                    "statistics": {
                        "netAssets": result1?.body["ETF_Data::TotalAssets"] ?? null,
                        "NAV": result3?.body?.previous_close ?? null,
                        "forwardAnnualDividend": dividendsFull?.length > 0 ? dividendsFull[0]?.amount : null,
                        "pricePerformance52W": w52Perf ?? null,
                        "netExpenseRatio": expenseRatio_val ?? null,
                        "12monthsYield": result1?.body["ETF_Data::Yield"] ?? null,
                        "inceptionDate": result1?.body["ETF_Data::Inception_Date"] ?? null
                    },
                    "day1Range": {
                        "open": result3?.body?.open,
                        "high": result3?.body?.high,
                        "low": result3?.body?.low,
                        "close": result3?.body?.close,
                        "mid": result3?.body?.close,
                        "previousClose": result3?.body?.previous_close,
                        "change": result3?.body?.change,
                        "percentChange": result3?.body?.percent_change,
                        "volume": result3?.body?.volume,
                        "averageVolume": result3?.body?.average_volume
                    },
                    "weeks52Range": {
                        "weeks52High": w52high?.high ?? null,
                        "onHigh": w52high?.datetime ?? null,
                        "week252Low": w52low?.low ?? null,
                        "onLow": w52low?.datetime ?? null,
                    },
                    "riskreturnValuation": {
                        "self": {
                            "risk": risk,
                            "return": chance,
                        },
                        "index": {
                            "risk": risk_index,
                            "return": chance_index,
                        },
                    },
                    "fundFundamentals": {
                        "self": {
                            "p_earningsTTM": result1?.body["ETF_Data::Valuations_Growth"]["Valuations_Rates_Portfolio"]["Price/Prospective Earnings"] ?? null,
                            "p_book": result1?.body["ETF_Data::Valuations_Growth"]["Valuations_Rates_Portfolio"]["Price/Book"] ?? null,
                            "p_sale": result1?.body["ETF_Data::Valuations_Growth"]["Valuations_Rates_Portfolio"]["Price/Sales"] ?? null,
                            "p_cashflow": result1?.body["ETF_Data::Valuations_Growth"]["Valuations_Rates_Portfolio"]["Price/Cash Flow"] ?? null,
                            "30daysSECyield": null,
                            "distributionYieldTTM": null,
                        },
                        "index": {
                            "p_earningsTTM": valuationsGrowth_index?.Valuations_Rates_Portfolio["Price/Prospective Earnings"],
                            "p_book": valuationsGrowth_index?.Valuations_Rates_Portfolio["Price/Book"],
                            "p_sale": valuationsGrowth_index?.Valuations_Rates_Portfolio["Price/Sales"],
                            "p_cashflow": valuationsGrowth_index?.Valuations_Rates_Portfolio["Price/Cash Flow"],
                            "30daysSECyield": null,
                            "distributionYieldTTM": null,
                        },
                    },
                    "companyProfile": {
                        "biography": result5?.body?.description ?? null,
                        "topSector": sector,
                        "topIndustry": industry,
                        "sponsor": null,
                        "inception": result1?.body["ETF_Data::Inception_Date"] ?? null,
                        "country": result5?.body?.country ?? null,
                        "website": result1?.body["ETF_Data::Company_URL"] ?? null,
                    },
                },
                "performance": {
                    "avgAnnualReturns": {
                        "self": {
                            "Returns_1Y": result1?.body["ETF_Data::Performance"]["Returns_1Y"] ?? null,
                            "Returns_3Y": result1?.body["ETF_Data::Performance"]["Returns_3Y"] ?? null,
                            "Returns_5Y": result1?.body["ETF_Data::Performance"]["Returns_5Y"] ?? null,
                            "Returns_10Y": result1?.body["ETF_Data::Performance"]["Returns_10Y"] ?? null,
                            "Returns_YTD": result1?.body["ETF_Data::Performance"]["Returns_YTD"] ?? null,
                        },
                        "index": {
                            "Returns_1Y": performance_index["Returns_1Y"],
                            "Returns_3Y": performance_index["Returns_3Y"],
                            "Returns_5Y": performance_index["Returns_5Y"],
                            "Returns_10Y": performance_index["Returns_10Y"],
                            "Returns_YTD": performance_index["Returns_YTD"],
                        },
                    },
                    "riskreturnComparison": {
                        "self": {
                            "risk": risk,
                            "return": chance,
                        },
                        "index": {
                            "risk": risk_index,
                            "return": chance_index,
                        },
                    },
                    "hypotheticalGrowth": {
                        "growth1yr": growth1yr,
                        "growth3yr": growth3yr,
                        "growth5yr": growth5yr,
                        "growth10yr": growth10yr,
                    },
                },
                "portfolio": {
                    "top10holdings": {
                        "totalCount": result6.body["ETF_Data::Holdings_Count"],
                        "weight": parseFloat(top10_holdings_weight?.toFixed(2)),
                        "asOf": result3?.body?.datetime,
                        "holdings": top10holdings,
                    },
                    "holdings": holdings,
                    "portfolioComposition": {
                        "industryExposure": industryExposure,
                        "sectorExposure": sectorExposure,
                        "countryExposure": countryExposure,
                        "regionExposure": regionExposure,
                        "marketCapExposure": result1?.body["ETF_Data::Market_Capitalisation"] ?? [],
                    },
                },
                "dividends": {
                    "dividend": {
                        "dividendAmount": dividendsFull?.length > 0 ? dividendsFull[0]?.amount : null,
                        "payDate": dividendsFull?.length > 0 ? dividendsFull[0]?.payment_date : null,
                        "frequency": result1?.body["ETF_Data::Dividend_Paying_Frequency"] ?? "Quarterly",
                    },
                    "strenthDividendYield": {
                        "self": result1?.body["ETF_Data::Yield"] ?? null,
                        "marketAverage": yield_index,
                    },
                    "growthDividend": {
                        "selfDividends": divHistoryAnnual,
                        "indexDividends": dividendsHistory_index
                    }
                },
                "fees": {
                    "expenses": {
                        "expenseRatio": expenseRatio_val,
                        "expenseRatioIndex": expenseRatio_val_index,
                    },
                    "fees": {
                        "feeself": feeself === 0 ? null : feeself,
                        "feeindex": feeindex === 0 ? null : feeindex,
                    }
                },
                "isPerformanceEnabled": result1?.body["ETF_Data::Performance"]["Returns_1Y"] ? true : false,
                "isPortfolioEnabled": top10holdings && holdings ? true : false,
                "isDividendEnabled": dividendsFull?.length > 0 ? true : false,
                "isFeesEnabled": expenseRatio_val ? true : false
            }

            //redis update
            // try {
            //     const redisSet = await redis.set(`etfSummary::${ticker}`, JSON.stringify(result, null, 4), "EX", 900);
            //     console.log(redisSet);
            // } catch (error) {
            //     console.error(error);
            // }

            return {
                statusCode: result1.statusCode,
                headers: util.getResponseHeaders(),
                body: JSON.stringify(result, null, 4)
            };
        } catch (error) {
            return {
                statusCode: 500,
                headers: util.getResponseHeaders(),
                body: {
                    message: "Something went wrong!, Please try again later."
                }
            };
        }
        // } else {
        //     redis_result["isWatchlisted"] = isWatchlisted;
        //     return {
        //         statusCode: 200,
        //         headers: util.getResponseHeaders(),
        //         body: redis_result
        //     };
        // }

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
    getETFStockSummary
}