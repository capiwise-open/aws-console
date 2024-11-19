const crypto = require('crypto');

const getResponseHeaders = () => {
    return {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
    };
};

const decrypt = (text) => {
    const algorithm = process.env.TOKEN_ALG;
    const ENCRYPTION_KEY = process.env.TOKEN_K;
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

const getIndex = (arr, condition, lastBegin) => {
    let index = 0;
    const lengthOfArr = arr.length;

    for (let i = lastBegin; i < lengthOfArr; i++) {
        if (arr[i]['date'] < condition) {
            index = i;
            break;
        }
    }

    return index;
}

const getLowHighDate = (arr) => {
    let max = -Infinity,
        keyMax,
        min = Infinity,
        keyMin;

    arr.forEach(function (v, k) {
        if (max < v.high) {
            max = v.high;
            keyMax = k;
        }
    });

    arr.forEach(function (v, k) {
        if (min > v.low) {
            min = v.low;
            keyMin = k;
        }
    });

    return [arr[keyMin], arr[keyMax]];
}

const dataCleaning = (dataStr) => {
    let firstReplaced = dataStr.replaceAll(':null,', ':0,');
    let cleaned = firstReplaced.replaceAll('"NA"', '0');
    return cleaned;
}

const yyyymmdd = (date) => {
    let _currYYYY = date.getFullYear();
    let _currMM = date.getMonth() + 1;
    let _currDD = date.getDate();

    _currMM = (_currMM > 9 ? '' : '0') + _currMM;
    _currDD = (_currDD > 9 ? '' : '0') + _currDD;

    let _time = date.getTime();
    _time -= 1000 * 60 * 60 * 24 * 7 * 52;
    let perfD = new Date(_time)

    let perfmm = perfD.getMonth() + 1;
    let perfdd = perfD.getDate();
    let perfyyyy = perfD.getFullYear();

    const _perfFromDate = [perfyyyy,
        (perfmm > 9 ? '' : '0') + perfmm,
        (perfdd > 9 ? '' : '0') + perfdd
    ].join('-');

    return [_currYYYY, _currMM, _currDD, _perfFromDate];
};

const getRecordDate = (exdate, date) => {
    let div = new Date(date);
    let exDiv = new Date(exdate);
    let diff = Math.ceil((div - exDiv) / (1000 * 60 * 60 * 24) / 2);
    let recordDate_init = new Date(exDiv.setDate(exDiv.getDate() + diff));

    let yyyy = recordDate_init.getFullYear();
    let mm = recordDate_init.getMonth() + 1;
    let dd = recordDate_init.getDate();

    const yyyymmdd = [yyyy,
        (mm > 9 ? '' : '0') + mm,
        (dd > 9 ? '' : '0') + dd
    ].join('-');

    return yyyymmdd;
};

const getRiskReturns = (tempArr, currYYYY, currMM, currDD) => {
    let yr_returns = {};
    const yr_end_index = 0;
    // CAGR % = {[(End of period price / Beginning of period price)^1/t] - 1} x 100
    // 10 YEARS RATE OF RETURNS
    let num_pos = 0;
    let num_neg = 0;
    let chance = 0;
    let risk = 0;

    let ret = 0;
    let start = 0;
    let last_begin = yr_end_index;
    for (let i = 1; i < 11; i++) {
        if (start >= 0) {
            if (i < 10) {
                start = getIndex(tempArr, `${currYYYY - i}-${currMM}-${currDD}`, last_begin) - 1;
                last_begin = start;
            } else {
                start = tempArr.length - 1;
            }
        } else {
            start = -1;
        }
        const deviation = 1.396;
        if (start > 0) {
            ret = parseFloat(((Math.pow((tempArr[yr_end_index].close / tempArr[start].close), 1 / i) - 1) * 100 + deviation).toFixed(2));
        } else {
            ret = 0;
        }
        if (ret > 0) {
            num_pos += 1;
            chance += ret;
        } else if (ret < 0) {
            num_neg += 1;
            risk += ret;
        }
        yr_returns[`yr${i}_Return`] = ret;
    }
    chance = num_pos > 0 ? parseFloat((chance / num_pos).toFixed(2)) : 0;
    risk = num_neg > 0 ? parseFloat((risk / num_neg).toFixed(2)) : 0;

    return [yr_returns, chance, risk];
}

const getExposures = (arr, exposure) => {
    const res = [];
    for (let i = 0; i < arr.length; i++) {
        const ind = res.findIndex(el => el[`${exposure}`] === arr[i][`${exposure}`]);

        if (ind === -1) {
            let item = {};
            if (exposure === "Industry") {
                item = {
                    "Industry": arr[i]["Industry"],
                    "Assets_%": arr[i]["Assets_%"]
                }
            } else if (exposure)

                switch (exposure) {
                    case "Industry":
                        item = {
                            "Industry": arr[i]["Industry"],
                            "Assets_%": arr[i]["Assets_%"]
                        };
                        break;
                    case "Sector":
                        item = {
                            "Sector": arr[i]["Sector"],
                            "Assets_%": arr[i]["Assets_%"]
                        };
                        break;
                    case "Country":
                        item = {
                            "Country": arr[i]["Country"],
                            "Assets_%": arr[i]["Assets_%"]
                        };
                        break;
                    case "Region":
                        item = {
                            "Region": arr[i]["Region"],
                            "Assets_%": arr[i]["Assets_%"]
                        };
                        break;
                    default:
                        break;
                }

            res.push(item);
        } else {
            res[ind]["Assets_%"] += arr[i]["Assets_%"];
        };
    };

    let result = res.length > 10 ?
        res.sort((a, b) => {
            return b["Assets_%"] - a["Assets_%"]
        }).slice(0, 10)
        :
        res.sort((a, b) => {
            return b["Assets_%"] - a["Assets_%"]
        });

    return result;
}

const getDividendDetail = (arr, currYYYY) => {
    let dividendsFull, dividendsYTD, dividendsOther, divHistoryAnnual = [];

    dividendsFull = arr;
    if (dividendsFull.length > 0) {

        let divIndexYTD = -1;
        let divFullLengh = dividendsFull.length;
        for (let i = 0; i < divFullLengh; i++) {
            if (dividendsFull[i]["ex_date"] < currYYYY.toString()) {
                divIndexYTD = i;
                break;
            }
        }
        dividendsYTD = dividendsFull.slice(0, divIndexYTD);
        dividendsOther = dividendsFull.slice(divIndexYTD,);

        divHistoryAnnual = [];
        let amountTemp = dividendsYTD.reduce((partialSum, _item) => partialSum + _item["amount"], 0)

        divHistoryAnnual[0] = {
            "year": currYYYY,
            "amount": amountTemp
        }
        for (let i = 0; i < dividendsOther.length / 4 - 1; i++) {
            amountTemp = dividendsOther[4 * i]["amount"] + dividendsOther[4 * i + 1]["amount"] + dividendsOther[4 * i + 2]["amount"] + dividendsOther[4 * i + 3]["amount"];
            divHistoryAnnual[i + 1] = {
                "year": currYYYY - i - 1,
                "amount": amountTemp
            }
        }
    }
    return divHistoryAnnual.length > 11 ? divHistoryAnnual.slice(0, 11) : divHistoryAnnual;
}

const fundamentalNetExpenseETF = (expense) => {
    if (expense >= 0.95) return 1;
    else if (expense >= 0.85 && expense < 0.95) return 2;
    else if (expense >= 0.75 && expense < 0.85) return 3;
    else if (expense >= 0.65 && expense < 0.75) return 4;
    else if (expense >= 0.55 && expense < 0.65) return 5;
    else if (expense >= 0.45 && expense < 0.55) return 6;
    else if (expense >= 0.35 && expense < 0.45) return 7;
    else if (expense >= 0.25 && expense < 0.35) return 8;
    else if (expense >= 0.09 && expense < 0.25) return 9;
    else if (expense >= 0 && expense < 0.09) return 10;
    else return 0;
}

const fundamentalPerformanceETF = (returns) => {
    if (returns < 0) return 1;
    else if (returns === 0) return 2;
    else if (returns > 0 && returns < 2) return 3;
    else if (returns >= 2 && returns < 4) return 4;
    else if (returns >= 4 && returns < 6) return 5;
    else if (returns >= 6 && returns < 8) return 6;
    else if (returns >= 8 && returns < 10) return 7;
    else if (returns >= 10 && returns < 15) return 8;
    else if (returns >= 15 && returns < 30) return 9;
    else if (returns >= 30) return 10;
    else return 0;
}

const fundamentalValuationStock = (valuation) => {
    if (valuation < -50) {
        return 10;
    } else if (valuation >= -50 && valuation < -40) {
        return 9;
    } else if (valuation >= -40 && valuation < -30) {
        return 8;
    } else if (valuation >= -30 && valuation < -20) {
        return 7;
    } else if (valuation >= -20 && valuation < -10) {
        return 6;
    } else if (valuation >= -10 && valuation < 10) {
        return 5;
    } else if (valuation >= 10 && valuation < 20) {
        return 4;
    } else if (valuation >= 20 && valuation < 30) {
        return 3;
    } else if (valuation >= 30 && valuation < 40) {
        return 2;
    } else if (valuation >= 40 && valuation < 50) {
        return 1;
    } else {
        return 0;
    }
}

const fundamentalDividends = (divVal) => {
    if (divVal >= 9) {
        return 10;
    } else if (divVal >= 8 && divVal < 9) {
        return 9;
    } else if (divVal >= 7 && divVal < 8) {
        return 8;
    } else if (divVal >= 6 && divVal < 7) {
        return 7;
    } else if (divVal >= 5 && divVal < 6) {
        return 6;
    } else if (divVal >= 4 && divVal < 5) {
        return 5;
    } else if (divVal >= 3 && divVal < 4) {
        return 4;
    } else if (divVal >= 2 && divVal < 3) {
        return 3;
    } else if (divVal >= 1 && divVal < 2) {
        return 2;
    } else if (divVal > 0 && divVal < 1) {
        return 1;
    } else {
        return 0;
    }
}

const fundamentalFinancialHealthStock = (debt_score, cash_and_cash_equivalents_score, equity_score) => {
    let debt, cash, equity = 0;

    if (debt_score >= 2.4) {
        debt = 1;
    } else if (debt_score >= 2 && debt_score < 2.4) {
        debt = 2;
    } else if (debt_score >= 1.4 && debt_score < 2) {
        debt = 3;
    } else if (debt_score >= 1.1 && debt_score < 1.4) {
        debt = 4;
    } else if (debt_score >= 0.9 && debt_score < 1.1) {
        debt = 5;
    } else if (debt_score >= 0.5 && debt_score < 0.9) {
        debt = 6;
    } else if (debt_score >= 0.1 && debt_score < 0.5) {
        debt = 7;
    } else if (debt_score >= 0.05 && debt_score < 0.1) {
        debt = 8;
    } else if (debt_score < 0.05) {
        debt = 9;
    } else if (!debt_score) {
        debt = 10;
    }

    if (cash_and_cash_equivalents_score <= 10) {
        cash = 1;
    } else if (cash_and_cash_equivalents_score > 10 && cash_and_cash_equivalents_score <= 25) {
        cash = 2;
    } else if (cash_and_cash_equivalents_score > 25 && cash_and_cash_equivalents_score <= 40) {
        cash = 3;
    } else if (cash_and_cash_equivalents_score > 40 && cash_and_cash_equivalents_score <= 60) {
        cash = 4;
    } else if (cash_and_cash_equivalents_score > 45 && cash_and_cash_equivalents_score <= 55) {
        cash = 5;
    } else if (cash_and_cash_equivalents_score > 60 && cash_and_cash_equivalents_score <= 80) {
        cash = 6;
    } else if (cash_and_cash_equivalents_score > 80 && cash_and_cash_equivalents_score <= 100) {
        cash = 7;
    } else if (cash_and_cash_equivalents_score > 100 && cash_and_cash_equivalents_score <= 200) {
        cash = 8;
    } else if (cash_and_cash_equivalents_score > 200) {
        cash = 9;
    } else if (!cash_and_cash_equivalents_score) {
        cash = 10;
    }

    if (equity_score <= 10) {
        equity = 1;
    } else if (equity_score > 10 && equity_score <= 25) {
        equity = 2;
    } else if (equity_score > 25 && equity_score <= 40) {
        equity = 3;
    } else if (equity_score > 40 && equity_score <= 60) {
        equity = 4;
    } else if (equity_score > 45 && equity_score <= 55) {
        equity = 5;
    } else if (equity_score > 60 && equity_score <= 80) {
        equity = 6;
    } else if (equity_score > 80 && equity_score <= 100) {
        equity = 7;
    } else if (equity_score > 100 && equity_score <= 200) {
        equity = 8;
    } else if (equity_score > 200) {
        equity = 9;
    } else if (!equity_score) {
        equity = 10;
    }

    return Math.round((debt + cash + equity) / 3);
}

const calcScorePerf = (growthRate) => {
    let score = 0;

    if (growthRate < -20) score = 1;
    else if (growthRate >= -20 && growthRate < -10) score = 2;
    else if (growthRate >= -10 && growthRate < -5) score = 3;
    else if (growthRate >= -5 && growthRate < -2) score = 4;
    else if (growthRate >= -2 && growthRate < 2) score = 5;
    else if (growthRate >= 2 && growthRate < 5) score = 6;
    else if (growthRate >= 5 && growthRate < 10) score = 7;
    else if (growthRate >= 10 && growthRate < 15) score = 8;
    else if (growthRate >= 15 && growthRate < 20) score = 9;
    else if (growthRate >= 20) score = 10;

    return score;
}

const fundamentalPerformanceStock = (epsGrowthRate, revenueGrowthRate, cashflowGrowthRate, netincomeGrowthRate) => {
    let scoreEPS, scoreRevenue, scoreCashFlow, scoreNetIncome = 0;

    scoreEPS = calcScorePerf(epsGrowthRate);
    scoreRevenue = calcScorePerf(revenueGrowthRate);
    scoreCashFlow = calcScorePerf(cashflowGrowthRate);
    scoreNetIncome = calcScorePerf(netincomeGrowthRate);

    return Math.round((scoreEPS + scoreRevenue + scoreCashFlow + scoreNetIncome) / 4);
}

const getGrowthRate = (startValue, endValue, yrs) => {
    return (Math.pow(Math.abs(endValue / startValue), 1 / yrs) - 1) * 100;
}

module.exports = {
    getResponseHeaders,
    decrypt,
    getIndex,
    getRecordDate,
    getLowHighDate,
    dataCleaning,
    yyyymmdd,
    getRiskReturns,
    fundamentalValuationStock,
    fundamentalDividends,
    fundamentalFinancialHealthStock,
    getExposures,
    getDividendDetail,
    getGrowthRate,
    fundamentalPerformanceStock,
    fundamentalNetExpenseETF,
    fundamentalPerformanceETF,
};
