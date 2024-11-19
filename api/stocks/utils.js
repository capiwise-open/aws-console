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

const getMonthsStartingFrom = (inputMonth) => {
    // Array of month names for easy access by index
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const startMonthIndex = parseInt(inputMonth, 10) - 1;
    let orderedMonths = [];

    for (let i = 0; i < 12; i++) {
        const currentMonthIndex = (startMonthIndex + i) % 12;
        orderedMonths.push(monthNames[currentMonthIndex]);
    }

    return orderedMonths;
}

const earningsClean = (inputArray) => {
    let grouped = {};
    inputArray.forEach(item => {
        const { date, eps_actual } = item;
        const key = `${date.substring(0, 7)}_${eps_actual}`;
        if (!grouped[key]) {
            grouped[key] = item;
        } else {
            if (new Date(item.date) < new Date(grouped[key].date)) {
                grouped[key] = item;
            }
        }
    });

    let results = Object.values(grouped);
    results = results.filter(item => item.eps_estimate && !(item.eps_actual && item.time === 'Time Not Supplied'));
    return results;
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

function getAmountByYear(year, dataArray) {
    const item = dataArray.find(item => item.year === year);
    return item ? item.amount : undefined;
}

const getRiskReturns = (tempArr, div) => {
    // CAGR % = {[(End of period price / Beginning of period price)^1/t] - 1} x 100
    // 10 YEARS RATE OF RETURNS
    if (!tempArr || tempArr.length === 0 || div.length === 0) {
        return [0, 0];
    }

    const items = findStartEndDates(tempArr)

    let num_pos = 0;
    let num_neg = 0;
    let total_chance = 0;
    let total_risk = 0;

    items.map(item => {
        const dividend = getAmountByYear(item?.year, div)
        if (dividend !== undefined) {
            const ret = (item?.endItem?.close + dividend - item?.startItem?.open) / item?.startItem?.open * 100

            if (ret > 0) {
                num_pos++;
                total_chance += ret;
            } else if (ret < 0) {
                num_neg++;
                total_risk += ret;
            }
        }
    })
    const chance = num_pos > 0 ? parseFloat((total_chance / num_pos).toFixed(2)) : 0;
    const risk = num_neg > 0 ? Math.abs(parseFloat((total_risk / num_neg).toFixed(2))) : 0;

    return [chance, risk];
}

const findStartEndDates = (data) => {
    const startEndDates = {};

    data.forEach(item => {
        const year = item.date.split('-')[0];
        if (!startEndDates[year]) {
            startEndDates[year] = { start: item.date, end: item.date };
        } else {
            if (item.date < startEndDates[year].start) {
                startEndDates[year].start = item.date;
            }
            if (item.date > startEndDates[year].end) {
                startEndDates[year].end = item.date;
            }
        }
    });

    const result = Object.keys(startEndDates).map(year => {
        const { start, end } = startEndDates[year];
        return {
            year,
            startItem: data.find(item => item.date === start),
            endItem: data.find(item => item.date === end)
        };
    });

    return result;
}

const getExposures = (arr, exposure) => {
    const res = [];

    arr.forEach(item => {
        const existingItem = res.find(el => el[exposure] === item[exposure]);

        if (existingItem) {
            // Ensure numeric addition
            existingItem["Assets_%"] = parseFloat(existingItem["Assets_%"]) + parseFloat(item["Assets_%"]);
        } else {
            // Directly use exposure variable to streamline creation of new items
            res.push({
                [exposure]: item[exposure],
                "Assets_%": parseFloat(item["Assets_%"]) // Ensure "Assets_%" is treated as a number
            });
        }
    });

    // Sort in descending order by "Assets_%" and return the top 10
    return res.sort((a, b) => b["Assets_%"] - a["Assets_%"]).slice(0, 10);
}

const getDividendDetail = (arr) => {
    const sumByYearObject = arr.reduce((acc, { ex_date, amount }) => {
        const year = ex_date.split('-')[0];
        if (!acc[year]) {
            acc[year] = 0;
        }
        acc[year] += amount;
        return acc;
    }, {});

    const sumByYearArray = Object.keys(sumByYearObject).sort().map(year => ({
        year,
        amount: sumByYearObject[year]
    })).reverse();
    return sumByYearArray.length > 11 ? sumByYearArray.slice(0, 11) : sumByYearArray;
}

const getDividendDetail2 = (data) => {
    const sumByYear = {};

    data.forEach(item => {
        const year = new Date(item.date).getFullYear();
        if (sumByYear[year]) {
            sumByYear[year] += item.value;
        } else {
            sumByYear[year] = item.value;
        }
    });

    return Object.keys(sumByYear).map(year => ({
        year: year,
        amount: sumByYear[year]
    }));
}

const fundamentalNetExpenseETF = (expense) => {
    if (expense < 0) return 0;    // Assuming negative values are invalid and score 0
    if (expense < 0.09) return 10;
    if (expense < 0.25) return 9;
    if (expense < 0.35) return 8;
    if (expense < 0.45) return 7;
    if (expense < 0.55) return 6;
    if (expense < 0.65) return 5;
    if (expense < 0.75) return 4;
    if (expense < 0.85) return 3;
    if (expense < 0.95) return 2;
    return 1; // If none of the above conditions are met, expense must be >= 0.95
}

const fundamentalPerformanceETF = (returns) => {
    if (returns >= 30) return 10;
    if (returns >= 15) return 9;
    if (returns >= 10) return 8;
    if (returns >= 8) return 7;
    if (returns >= 6) return 6;
    if (returns >= 4) return 5;
    if (returns >= 2) return 4;
    if (returns > 0) return 3;
    if (returns === 0) return 2;
    return 1; // This covers returns < 0
}

const fundamentalValuationStock = (valuation) => {
    if (valuation >= 50) return 0;
    if (valuation >= 40) return 1;
    if (valuation >= 30) return 2;
    if (valuation >= 20) return 3;
    if (valuation >= 10) return 4;
    if (valuation >= -10) return 5;
    if (valuation >= -20) return 6;
    if (valuation >= -30) return 7;
    if (valuation >= -40) return 8;
    if (valuation >= -50) return 9;
    return 10; // Covers valuation < -50
};

const fundamentalDividends = (divVal) => {
    if (divVal >= 9) return 10;
    if (divVal >= 8) return 9;
    if (divVal >= 7) return 8;
    if (divVal >= 6) return 7;
    if (divVal >= 5) return 6;
    if (divVal >= 4) return 5;
    if (divVal >= 3) return 4;
    if (divVal >= 2) return 3;
    if (divVal >= 1) return 2;
    if (divVal > 0) return 1;
    return 0;
};

const getDebtScore = (debtScore) => {
    if (!debtScore) return 10;
    if (debtScore < 0.05) return 9;
    if (debtScore < 0.1) return 8;
    if (debtScore < 0.5) return 7;
    if (debtScore < 0.9) return 6;
    if (debtScore < 1.1) return 5;
    if (debtScore < 1.4) return 4;
    if (debtScore < 2) return 3;
    if (debtScore < 2.4) return 2;
    return 1;
}

const getCashScore = (cashScore) => {
    if (!cashScore) return 10;
    if (cashScore > 200) return 9;
    if (cashScore > 100) return 8;
    if (cashScore > 80) return 7;
    if (cashScore > 60) return 6;
    if (cashScore > 50) return 5;
    if (cashScore > 40) return 4;
    if (cashScore > 25) return 3;
    if (cashScore > 10) return 2;
    return 1;
}

const fundamentalFinancialHealthStock = (debt_score, cash_and_cash_equivalents_score, equity_score) => {
    let debt = 0, cash = 0, equity = 0;
    debt = getDebtScore(debt_score);
    cash = getCashScore(cash_and_cash_equivalents_score);
    equity = getCashScore(equity_score);

    return Math.round((debt + cash + equity) / 3);
}

const calcScorePerf = (growthRate) => {
    if (typeof growthRate !== 'number' || isNaN(growthRate)) return 0; // Check for undefined or non-numeric input
    if (growthRate >= 20) return 10;
    if (growthRate >= 15) return 9;
    if (growthRate >= 10) return 8;
    if (growthRate >= 5) return 7;
    if (growthRate >= 2) return 6;
    if (growthRate >= -2) return 5;
    if (growthRate >= -5) return 4;
    if (growthRate >= -10) return 3;
    if (growthRate >= -20) return 2;
    return 1;
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
    earningsClean,
    getDividendDetail2,
    getMonthsStartingFrom,
    findStartEndDates
};
