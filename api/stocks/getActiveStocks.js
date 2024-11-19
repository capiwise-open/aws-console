const https = require("https");
const utility = require("../../util");

const STOCK_API = "https://eodhistoricaldata.com";

// Function to handle user insertion
const getActiveStocks = async (event) => {
    // TO DECRYPT THE TOKEN
    const e_token = process.env.TOKEN_E;
    const e_token12 = process.env.TOKEN_12;
    try {
        const response2 = new Promise((resolve, reject) => {
            let dataString = "";
            const external_url = `${STOCK_API}/api/screener?api_token=${e_token}&screener='most_active'&limit=10&offset=0&filters=[["exchange","=","us"]]`;

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
        })

        function getDataFromSecondAPI(code) {
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
        var [result2] = await Promise.all([response2]);

        if (result2.statusCode < 400) {
            let result2Array = [];

            for (let k = 0; k < result2.body.data.length; k++) {
                const dataFromSecondAPI = await getDataFromSecondAPI(result2.body.data[k].code);
                if (result2.body.data[k].code !== 404) {
                    result2Array.push(dataFromSecondAPI);
                }
            }

            return {
                statusCode: result2.statusCode,
                headers: utility.getResponseHeaders(),
                body: JSON.stringify(result2Array, null, 4)
            };
        } else {
            return {
                statusCode: 500,
                headers: utility.getResponseHeaders(),
                body: "Something went wrong!",
            };
        }
    } catch (err) {
        throw new Error(err);
    }
};

// Export the User function
module.exports = { getActiveStocks };