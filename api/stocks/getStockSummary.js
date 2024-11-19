const util = require("./utils");
const https = require("https");
const { getWatchlist } = require("../../db/user_profile");

const token = process.env.TOKEN_12;
const eod_token = process.env.TOKEN_E;

const getStockSummary = async (event) => {
    const { queryStringParameters } = event;
    if (!queryStringParameters || !queryStringParameters.ticker) {
        return {
            statusCode: 400,
            headers: util.getResponseHeaders(),
            body: "Please provide a ticker!",
        };
    }

    if (!queryStringParameters || !queryStringParameters.email) {
        return {
            statusCode: 400,
            headers: util.getResponseHeaders(),
            body: "Please provide an email!",
        };
    }

    const { ticker, email } = queryStringParameters;

    let existingWatchlistItems = await getWatchlist(queryStringParameters?.email);

    const isWatchlisted = existingWatchlistItems.includes(ticker)

    // TO GET FROMDATE, TODATE, CURRENT YEAR, FROMDATE FOR PERFORMANCE CALCULATION
    let date = new Date();
    const [currYYYY, currMM, currDD, perfFromDate] = util.yyyymmdd(date);

    const sectors = {
        "Energy": "XLE",
        "Basic Materials": "XLB",
        "Industrials": "XLI",
        "Consumer Cyclical": "XLY",
        "Consumer Defensive": "XLP",
        "Healthcare": "XLV",
        "Financial Services": "XLF",
        "Technology": "XLK",
        "Communication Services": "XTL",
        "Utilities": "XLU",
        "Real Estate": "XLRE"
    };

    // redis initialization
    // const redis = new Redis({
    //     port: 6379,
    //     host: "cw-dev-cluster.fmpkqs.0001.euc1.cache.amazonaws.com"
    // });

    try {
        // const redis_result = await redis.get(`stockSummary::${ticker}`);

        // if (redis_result === null) {
        // credit current usage and plan limit check and validation
        const current_usage_check = new Promise((resolve, reject) => {
            let dataString = "";
            const external_url = `https://api.twelvedata.com/api_usage?symbol=${ticker}&apikey=${token}`;

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
                        },
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
        if (current + 104 > limit) {
            return {
                statusCode: 500,
                headers: util.getResponseHeaders(),
                body: {
                    message: "Current credit is over limit!, Please try again 1min later."
                }
            };
        }

        const responseQuote = new Promise((resolve, reject) => {
            let dataString = "";
            const external_url = `https://api.twelvedata.com/quote?symbol=${ticker}&apikey=${token}`;

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
                        },
                    });
                });
            })
        })

        const responseStatistics = new Promise((resolve, reject) => {
            let dataString = "";
            const external_url = `https://api.twelvedata.com/statistics?symbol=${ticker}&apikey=${token}`;

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
                        },
                    });
                });
            })
        })

        const responseProfile = new Promise((resolve, reject) => {
            let dataString = "";
            const external_url = `https://api.twelvedata.com/profile?symbol=${ticker}&apikey=${token}`;

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
                        },
                    });
                });
            })
        })

        const responseEarnings = new Promise((resolve, reject) => {
            let dataString = "";
            const external_url = `https://api.twelvedata.com/earnings?symbol=${ticker}&apikey=${token}&outputsize=1000`;

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
                        },
                    });
                });
            })
        })

        const responseFundamentals = new Promise((resolve, reject) => {
            let dataString = "";
            // const external_url = `https://api.twelvedata.com/balance_sheet?symbol=${ticker}&apikey=${token}`;
            const external_url = `https://eodhd.com/api/fundamentals/${ticker}.US?api_token=${eod_token}&fmt=json&filter=Financials::Balance_Sheet::yearly`;

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
                        },
                    });
                });
            })
        })

        const responseLogo = new Promise((resolve, reject) => {
            let dataString = "";
            const external_url = `https://api.twelvedata.com/logo?symbol=${ticker}&apikey=${token}`;

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
                        },
                    });
                });
            })
        })

        const responseDividends = new Promise((resolve, reject) => {
            let dataString = "";
            const external_url = `https://api.twelvedata.com/dividends?symbol=${ticker}&apikey=${token}&range=full`;

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
                        },
                    });
                });
            })
        })

        const responseTimeseries = new Promise((resolve, reject) => {
            let dataString = "";
            const external_url = `https://api.twelvedata.com/time_series?symbol=${ticker}&apikey=${token}&interval=1day&outputsize=255`;

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
                        },
                    });
                });
            })
        })

        const responseFundamentals2 = new Promise((resolve, reject) => {
            let dataString = "";
            // const external_url = `https://api.twelvedata.com/income_statement?symbol=${ticker}&apikey=${token}`;
            // const external_url = `https://eodhd.com/api/fundamentals/${ticker}.US?api_token=${eod_token}&fmt=json&filter=Financials::Income_Statement::yearly,Financials::Balance_Sheet::yearly`;
            const external_url = `https://eodhd.com/api/fundamentals/${ticker}.US?api_token=${eod_token}&fmt=json&filter=Financials::Income_Statement::yearly`;

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
                        },
                    });
                });
            })
        })
        try {
            var [result1, result2, result3, result4, result5, result6, result7, result8, result9] =
                await Promise.all([responseQuote, responseStatistics, responseProfile, responseEarnings, responseFundamentals, responseLogo, responseDividends, responseTimeseries, responseFundamentals2]);

            let indexTicker = result3.body.sector
            let divHistoryAnnual_index = []
            let annDivYieldIndustry = null

            if (indexTicker) {
                const sym = sectors[indexTicker];
                const index_res1_div = new Promise((resolve, reject) => {
                    let dataString = "";
                    // const external_url = `https://api.twelvedata.com/dividends?symbol=${sym}&apikey=${token}&range=full`;
                    const external_url = `https://eodhd.com/api/div/${sym}.US?from=${currYYYY - 10}-01-01&api_token=${eod_token}&fmt=json`;

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
                                },
                            });
                        });
                    })
                })
                const index_res2_stat = new Promise((resolve, reject) => {
                    let dataString = "";
                    // const external_url = `https://api.twelvedata.com/statistics?symbol=${sym}&apikey=${token}`;
                    const external_url = `https://eodhd.com/api/fundamentals/${sym}.US?api_token=${eod_token}&fmt=json&filter=ETF_Data::Yield`
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
                                },
                            });
                        });
                    })
                })

                const [index1, index2] = await Promise.all([index_res1_div, index_res2_stat]);
                if (index1.statusCode < 400 && index2.statusCode < 400) {
                    const dividendsFull = index1.body;
                    divHistoryAnnual_index = util.getDividendDetail2(dividendsFull).reverse();
                    annDivYieldIndustry = parseFloat(index2.body)
                }
            }

            const { address, city, state, zip, country } = result3?.body ?? {};
            let hq = result3?.body ? `${address}, ${city}${state ? `, ${state}` : ''}, ${zip}, ${country}` : "";
            let earningsTemp = result4.body?.earnings;
            let filtered = [];
            let earningsCurrYr = [];
            let filterTemp = []
            let pastPerformance;
            let sharesOutstanding = result2?.body?.statistics?.stock_statistics?.shares_outstanding;
            let earningsHistory = [];
            let earningsRetainedCurrYr = null
            let earningsRetainedPastYr = null
            let epsGrowthTTM = null
            let epsGrowthQrt = null

            if (earningsTemp) {
                filtered = util.earningsClean(earningsTemp)

                if (filtered?.length > 0) {
                    earningsCurrYr = filtered.slice(0, 4);
                    const num = earningsCurrYr.filter((element, index) => {
                        if (element.date > currYYYY.toString()) {
                            return true;
                        }
                        return false;
                    })?.length;

                    for (let i = 0; i < 4; i++) {
                        let qNum = (num - i) > 0 ? `Q${num - i} ${currYYYY}` : `Q${num - i + 4} ${currYYYY - 1}`;
                        earningsCurrYr[i]["quarter"] = qNum;
                    }
                }

                if (earningsTemp?.length > 0) {
                    filterTemp = earningsTemp.filter(obj => {
                        return obj["eps_actual"] != null && obj["date"] < `${currYYYY}`;
                    });

                    if (filterTemp?.length > 5) {
                        for (let i = 0; i < Math.min(6, Math.floor(filterTemp?.length / 4)); i++) {
                            if (filterTemp[4 * i]) {
                                earningsHistory[i] = {
                                    "year": currYYYY - i - 1,
                                    "earnings": Math.floor(sharesOutstanding * (filterTemp[4 * i]["eps_actual"] + filterTemp[4 * i + 1]["eps_actual"] + filterTemp[4 * i + 2]["eps_actual"] + filterTemp[4 * i + 3]["eps_actual"])),
                                }
                            }
                        }
                        if (earningsHistory?.length >= 6) {
                            pastPerformance = ((Math.pow(Math.abs(earningsHistory[0].earnings / earningsHistory[earningsHistory?.length - 1].earnings), 1 / 5) - 1) * 100).toFixed(2);
                        } else {
                            pastPerformance = null
                        }
                    }
                }
            }

            if (filtered?.length > 1) {
                earningsRetainedCurrYr = filtered.slice(1, 5).reduce((acc, curr) => acc + curr["eps_actual"], 0)
            }

            if (filtered?.length > 6) {
                earningsRetainedPastYr = filtered.slice(5, 9).reduce((acc, curr) => acc + curr["eps_actual"], 0)
            }

            if (earningsRetainedCurrYr && earningsRetainedPastYr) {
                epsGrowthTTM = parseFloat(((earningsRetainedCurrYr - earningsRetainedPastYr) / earningsRetainedPastYr * 100).toFixed(2));
            }

            if (filtered?.length > 5) {
                epsGrowthQrt = parseFloat(((filtered[1]["eps_actual"] - filtered[5]["eps_actual"]) / filtered[5]["eps_actual"] * 100).toFixed(2));
            }

            let balance_sheet = result5.body;
            let finHealthHistory = [];
            let debtLevel = 0
            let debtLevel5 = 0
            let debtCoverage = 0
            if (balance_sheet) {
                let balance_sheet_keys = Object.keys(balance_sheet)

                balance_sheet_keys.map((_item, index) => {
                    finHealthHistory[index] = {
                        "fiscal_date": balance_sheet[_item]["date"],
                        "debt": balance_sheet[_item]["totalStockholderEquity"],
                        "equity": balance_sheet[_item]["shortTermDebt"] ?? 0 + balance_sheet[_item]["longTermDebt"] ?? 0,
                        "cash_and_cash_equivalents": balance_sheet[_item]["cash"] ?? 0 + balance_sheet[_item]["cashAndEquivalents"] ?? 0,
                    }
                });
                let finLen = finHealthHistory?.length;
                debtLevel = parseFloat((finHealthHistory[0]["debt"] / finHealthHistory[0]["equity"] * 100).toFixed(2));
                debtLevel5 = parseFloat((finHealthHistory[finLen > 5 ? 5 : finLen - 1]["debt"] / finHealthHistory[finLen > 5 ? 5 : finLen - 1]["equity"] * 100).toFixed(2));
                debtCoverage = parseFloat((finHealthHistory[0]["debt"] / finHealthHistory[0]["cash_and_cash_equivalents"] * 100).toFixed(2));
            }

            const dividendsFull = result7.body?.dividends;
            let divHistoryAnnual
            let divCurrYr = null;
            let divLastYr = null;

            if (dividendsFull) {
                divHistoryAnnual = util.getDividendDetail(dividendsFull);
                if (dividendsFull?.length > 0) {
                    divCurrYr = dividendsFull.slice(0, 4).reduce((acc, curr) => acc + curr["amount"], 0)
                }

                if (dividendsFull?.length > 4) {
                    divLastYr = dividendsFull.slice(4, 8).reduce((acc, curr) => acc + curr["amount"], 0)
                }
            }

            let exDivDate = result2?.body?.statistics?.dividends_and_splits?.ex_dividend_date;
            let divDate = result2?.body?.statistics?.dividends_and_splits?.dividend_date;
            let recordDate = null;
            if (exDivDate != null && divDate != null) {
                recordDate = util.getRecordDate(exDivDate, divDate);
            }

            let annDivYield = result2?.body ? result2?.body?.statistics?.dividends_and_splits?.trailing_annual_dividend_yield * 100 : 0;
            // let incomeStatements = result9.body["Financials::Income_Statement::yearly"]
            let incomeStatements = result9?.body
            let revenue_history = [];

            if (incomeStatements) {
                let revenueskeys = Object.keys(incomeStatements);
                revenueskeys.slice(0, 6).map((_item, index) => {
                    revenue_history[index] = {
                        "year": incomeStatements[_item]["date"].split('-')[0],
                        "revenue": incomeStatements[_item]["totalRevenue"]
                    }
                })
            }

            let values = result8?.body?.values;
            let w52Perf
            let w52low
            let w52high
            if (values) {
                let lengthOfValues = values?.length;
                w52Perf = (values[0]?.close - values[lengthOfValues - 1]?.close) / values[lengthOfValues - 1]?.close * 100;
                [w52low, w52high] = util.getLowHighDate(values)
            }

            let final_result = {
                "profile": {
                    "name": result1?.body?.name ?? null,
                    "symbol": result1?.body?.symbol ?? null,
                    "exchange": result1?.body?.exchange ?? null,
                    "mic_code": result1?.body?.mic_code ?? null,
                    "currency": result1?.body?.currency ?? null,
                    "sector": result3?.body?.sector ?? null,
                    "industry": result3?.body?.industry ?? null,
                    "biography": result3?.body?.description ?? null,
                    "country": result3?.body?.country ?? null,
                    "CEO": result3?.body?.CEO ?? null,
                    "website": result3?.body?.website ?? null,
                    "headquarter": hq ?? null,
                    "logo": result6?.body?.url ?? null
                },
                "date": result1?.body?.datetime,
                "time": result1?.body?.timestamp,
                "isMarketOpen": result1?.body?.is_market_open,
                "day1Range": {
                    "open": result1?.body?.open,
                    "high": result1?.body?.high,
                    "low": result1?.body?.low,
                    "close": result1?.body?.close,
                    "mid": result1?.body?.close,
                    "previousClose": result1?.body?.previous_close,
                    "change": result1?.body?.change,
                    "percentChange": result1?.body?.percent_change,
                    "volume": result1?.body?.volume,
                    "averageVolume": result1?.body?.average_volume
                },
                "weeks52Range": {
                    "low": result1?.body?.fifty_two_week?.low ?? null,
                    "onLow": w52low ?? null,
                    "high": result1?.body?.fifty_two_week?.high ?? null,
                    "onHigh": w52high ?? null,
                    "mid": result1.body?.close ?? null,
                    "performance": w52Perf?.toFixed(2) ?? null,
                },
                "statistics": {
                    "sharesOutstanding": sharesOutstanding ?? null,
                    "marketCapitalization": result2?.body?.statistics?.valuations_metrics?.market_capitalization ?? null,
                    "dividendsYield": annDivYield ?? null,
                    "divExDate": result2?.body?.statistics?.dividends_and_splits?.ex_dividend_date ?? null,
                },
                "performance": {
                    "profitMargin": result2?.body?.statistics?.financials?.profit_margin * 100,
                    "pastPerformanceEarningsGrowth": pastPerformance,
                    "earningsHistory": earningsHistory,
                    "revenue_history": revenue_history,
                },
                "earnings": {
                    "peRatio": result2?.body?.statistics?.valuations_metrics?.trailing_pe ?? null,
                    "pegRatio": result2?.body?.statistics?.valuations_metrics?.peg_ratio ?? null,
                    "eps": result2?.body?.statistics?.financials?.income_statement?.diluted_eps_ttm ?? null,
                    "earningsHisCurrYr": earningsCurrYr,
                    "earningsRetainedCurrYr": earningsRetainedCurrYr,
                    "earningsRetainedPastYr": earningsRetainedPastYr,
                    "epsGrowthTTM": epsGrowthTTM,
                    "epsGrowthQrt": epsGrowthQrt,
                },
                "finHealth": {
                    "debtLevel": debtLevel,
                    "debtReducing": {
                        "latest": debtLevel,
                        "past5yrs": debtLevel5,
                    },
                    "debtCoverage": debtCoverage,
                    "finHealthHistory": finHealthHistory?.slice(0, 8) ?? [],
                },
                "dividends": {
                    "amount": dividendsFull?.length > 0 ? dividendsFull[0]?.amount : null,
                    "payDate": dividendsFull?.length > 0 ? (dividendsFull[0]?.ex_date ? dividendsFull[0]?.ex_date : dividendsFull[0]?.payment_date) : null,
                    "annDivRate": result2?.body?.statistics?.dividends_and_splits?.trailing_annual_dividend_rate ?? null,
                    "annDivYield": annDivYield,
                    "annDivYieldIndustry": annDivYieldIndustry,
                    "divCurrYr": divCurrYr,
                    "divLastYr": divLastYr,
                    "frequency": "Quarterly",
                    "divHistoryAnnual": divHistoryAnnual,
                },
                "dividends_industry": divHistoryAnnual_index,
                "events": {
                    "divPast": {
                        "amount": dividendsFull.length > 0 ? dividendsFull[0]?.amount : null,
                        "exdivDate": exDivDate ?? null,
                        "recordDate": recordDate ?? null,
                        "payDate": divDate ?? null,
                    },
                    "earningsPast": {
                        "quarter": earningsCurrYr[1]?.quarter ?? null,
                        "date": earningsCurrYr[1]?.date ?? null,
                        "eps": earningsCurrYr[1]?.eps_actual ?? null,
                    },
                    "earningsUpcoming": {
                        "quarter": earningsCurrYr[0]?.quarter ?? null,
                        "date": earningsCurrYr[0]?.date ?? null,
                        "eps": earningsCurrYr[0]?.eps_estimate ?? null,
                    },
                },
                "isDividendEnabled": dividendsFull?.length > 0 ? true : false,
                "isFinHealthEnabled": finHealthHistory?.length > 0 ? true : false,
                "isAnalysisEnabled": earningsHistory?.length > 0 && revenue_history?.length > 0 ? true : false,
            }

            //redis update
            // try {
            //     const redisSet = await redis.set(`stockSummary::${ticker}`, JSON.stringify(final_result, null, 4), "EX", 900);
            //     console.log(redisSet);
            // } catch (error) {
            //     console.error(error);
            // }

            final_result["isWatchlisted"] = isWatchlisted;

            return {
                statusCode: result1.statusCode,
                headers: util.getResponseHeaders(),
                body: JSON.stringify(final_result, null, 4)
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
    getStockSummary
}