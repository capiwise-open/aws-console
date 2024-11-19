const { signin, signup, resetPassword, signinWithGoogle } = require('./api/user/auth');
const { getNews } = require('./api/news/getNews');
const { getActiveStocks } = require('./api/stocks/getActiveStocks');
const { getTopEarningStocks } = require('./api/stocks/getTopEarningStocks');
const { getTopGainerStocks } = require('./api/stocks/getTopGainerStocks');
const { getUserInfo, updateUserInfo, addWatchlist, registerNtoken } = require('./api/user/profile');
const { getAlerts, updateAlert, deleteAlert } = require('./api/alerts/alert');
const { getWatchlist } = require('./api/stocks/getWatchlist');
const { getStockSummary } = require('./api/stocks/getStockSummary');
const { getTrendingMarketExchangeList } = require('./api/stocks/getTrendingMarketExchangeList');
const { getETFStockSummary } = require('./api/stocks/getETFStocks');
const { getStockSearch } = require('./api/stocks/getStockSearch');
const { getStockHistoricalData } = require('./api/stocks/getStockHistoricalData');
const { getNotifications, setNotification, addNotification } = require('./notifications');

exports.index = async (event) => {
  const { path, httpMethod } = event;
  const { queryStringParameters } = event;

  // const requestBody = JSON.parse(event.body);

  console.log(path, httpMethod, event);

  // Route requests based on path and method
  switch (path) {
    case '/auth/signin':
      return signin(event);
    case '/auth/signup':
      return signup(event);
    case '/auth/signin-google':
      return signinWithGoogle(event);
    // case '/auth/reset-password':
    //   return resetPassword(event);
    case '/user':
      if (httpMethod === 'GET') {
        return getUserInfo(event);
      } else if (httpMethod === 'POST') {
        return updateUserInfo(event);
      }
      break;
    case '/user/n-token':
      return registerNtoken(event);
    case '/user/add-watchlist':
      return addWatchlist(event);
    case '/news':
      if (httpMethod === 'GET') {
        return getNews(event);
      }
      break;
    case '/stocks/summary':
      return getStockSummary(event);
    case '/stocks/historical-data':
      return getStockHistoricalData(event);
    case '/stocks/trending-market-exchangelist':
      return getTrendingMarketExchangeList(event);
    case '/stocks/etf-stocks':
      return getETFStockSummary(event);
    case '/stocks/stock-search':
      return getStockSearch(event);
    case '/stocks/watchlist':
      return getWatchlist(event);
    case '/stocks/top-earning':
      return getTopEarningStocks(event);
    case '/stocks/top-gainer':
      return getTopGainerStocks(event);
    case '/alerts':
      if (httpMethod === 'GET') {
        return getAlerts(event);
      } else if (httpMethod === 'POST') {
        return updateAlert(event);
      } else if (httpMethod === 'DELETE') {
        return deleteAlert(event);
      }
      break;
    case '/stocks':
      if (httpMethod === 'GET') {
        if (queryStringParameters && queryStringParameters.type === 'active')
          return getActiveStocks(event);
      }
      break;
    case '/notification':
      if (httpMethod === 'GET')
        return getNotifications(event);
      else if (httpMethod === 'POST')
        return setNotification(event);
      else if (httpMethod === 'PUT')
        return addNotification(event);
      break;
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Go Serverless v4! Your function executed successfully!!!",
    }),
  };
};
