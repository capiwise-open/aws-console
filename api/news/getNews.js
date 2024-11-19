const https = require("node:https");
const utility = require("../../util");

const eToken = process.env.TOKEN_NEWS;

const getNews = async (event) => {
    const { queryStringParameters } = event;

    if (!queryStringParameters) {
        return {
            statusCode: 400,
            headers: utility.getResponseHeaders(),
            body: JSON.stringify({ message: "Please provide query params!" }),
        };
    }

    if (!eToken) {
        return {
            statusCode: 500,
            headers: utility.getResponseHeaders(),
            body: JSON.stringify({ message: "Server error: API token is missing." }),
        };
    }

    try {
        const { category, symbol } = queryStringParameters;
        // const type category = "top" | "business" | "health" | "technology" | "us" | "eu";

        let currentdate = new Date();
        const current = currentdate.toISOString();

        // Subtract one day
        currentdate.setDate(currentdate.getDate() - 1);

        // Convert back to an ISO string
        const oneDayBefore = currentdate.toISOString();

        // If you need to remove the milliseconds part and keep the format as in the given datetime
        const oneDayBeforeFormatted = oneDayBefore.replace(/\.\d{3}Z$/, '');
        const currentFormated = current.replace(/\.\d{3}Z$/, '');

        console.log(oneDayBeforeFormatted, currentFormated);

        try {
            // Construct the external URL with query parameters
            let externalUrl = ""

            if (category && category === "top") {
                externalUrl = `https://api.marketaux.com/v1/news/all?filter_entities=true&api_token=${eToken}&language=en&published_after=${oneDayBeforeFormatted}&published_before=${currentFormated}&sort=entity_match_score,entity_sentiment_score`;
            }
            if (category && category === "business") {
                externalUrl = `https://api.marketaux.com/v1/news/all?filter_entities=true&api_token=${eToken}&language=en&published_after=${oneDayBeforeFormatted}&published_before=${currentFormated}&sort=entity_match_score,entity_sentiment_score&industries=Industrials`;
            }
            if (category && category === "health") {
                externalUrl = `https://api.marketaux.com/v1/news/all?filter_entities=true&api_token=${eToken}&language=en&published_after=${oneDayBeforeFormatted}&published_before=${currentFormated}&sort=entity_match_score,entity_sentiment_score&industries=Healthcare`;
            }
            if (category && category === "technology") {
                externalUrl = `https://api.marketaux.com/v1/news/all?filter_entities=true&api_token=${eToken}&language=en&published_after=${oneDayBeforeFormatted}&published_before=${currentFormated}&sort=entity_match_score,entity_sentiment_score&industries=Technology`;
            }
            if (category && category === "us") {
                externalUrl = `https://api.marketaux.com/v1/news/all?filter_entities=true&api_token=${eToken}&language=en&published_after=${oneDayBeforeFormatted}&published_before=${currentFormated}&countries=us,ca&sort=entity_match_score,entity_sentiment_score`;
            }
            if (category && category === "eu") {
                externalUrl = `https://api.marketaux.com/v1/news/all?filter_entities=true&api_token=${eToken}&language=en&published_after=${oneDayBeforeFormatted}&published_before=${currentFormated}&countries=de,fr,gb,es,it,ch,nl&sort=entity_match_score,entity_sentiment_score`;
            }
            if (symbol) {
                externalUrl = `https://api.marketaux.com/v1/news/all?symbols=${symbol}&filter_entities=true&api_token=${eToken}&language=en&published_after=${oneDayBeforeFormatted}&published_before=${currentFormated}&sort=entity_match_score,entity_sentiment_score&entity_types=equity,index,etf`;
            }

            console.log("00", externalUrl);

            const r = await fetch(externalUrl);
            const r2 = await r.json();
            console.log(r2);

            return {
                statusCode: 200,
                headers: utility.getResponseHeaders(),
                body: JSON.stringify(r2, null, 4)
            };
        } catch (error) {
            console.log(error);
            return {
                statusCode: 500,
                headers: utility.getResponseHeaders(),
                body: JSON.stringify({ message: "Internal server error.", error }),
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            headers: utility.getResponseHeaders(),
            body: error
        }
    }
};

module.exports = { getNews };