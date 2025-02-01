/* Doesn't work, returns a 404 BADTEST*/
function testHttpGet() {
  const scriptId = "1DZnlERwr4XjPlw03n4nlgsv5q9Vw3eYCsZB3B3IWrOZaiTleOeA8hpxA";
  const url = "https://script.google.com/macros/s/" + scriptId + "/exec"; 
  const response = UrlFetchApp.fetch(url); 
  Logger.log(response.getContentText()); 
}
