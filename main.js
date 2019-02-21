const puppeteer = require('puppeteer');

var fs = require('fs');
var config = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));

var sendNotification = function(data) {
  var headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Authorization": "Basic " + config["onesignal"]["restApiKey"]
  };
  
  var options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers
  };
  
  var https = require('https');
  var req = https.request(options, function(res) {  
    res.on('data', function(data) {
      console.log("Response:");
      console.log(JSON.parse(data));
    });
  });
  
  req.on('error', function(e) {
    console.log("ERROR:");
    console.log(e);
  });
  
  req.write(JSON.stringify(data));
  req.end();
};

(async () => {
	const browser = await puppeteer.launch({headless : false, slowMo: 1});
	const page = await browser.newPage();
	await page.goto('https://bank.barclays.co.uk/');
	try {
		await page.waitForSelector("#logged-on-message", { timeout: 2000 });
		// Do logged in stuff
	} catch (error) {
		// Not logged in, check if form partially field
		try {
			await page.waitForSelector("#surname0", { timeout: 2000 });

			await page.click("#surname0");
			await page.keyboard.type(config["bankDetails"]["surname"]);

			await page.click("#login-bootstrap > div > div.ng-scope > div > div:nth-child(1) > div.col-6-s.col-6-xs.col-12 > div:nth-child(1) > div:nth-child(4) > section > form > div > div > div > div:nth-child(4) > div > div > span");

			await page.click("#cardNumber0");
			await page.keyboard.type(config["bankDetails"]["cardNo"]);

			await page.click("#login-bootstrap > div > div.ng-scope > div > div:nth-child(1) > div.col-6-s.col-6-xs.col-12 > div:nth-child(1) > div:nth-child(4) > section > form > div > div > div > div:nth-child(9) > div > div.checkbox-control");

			await page.click("#login-bootstrap > div > div.ng-scope > div > div:nth-child(1) > div.col-6-s.col-6-xs.col-12 > div:nth-child(1) > div:nth-child(4) > section > form > div > div > div > div:nth-child(11) > div > button");

		} catch(error) {
			console.log("Nothing");
		}

		await page.waitForSelector("#passcode0");
		await page.click("#passcode0");
		await page.keyboard.type(config["bankDetails"]["passcode"]);

		var i;
		var total;
		
		var pass = config["bankDetails"]["password"];

		numbers = await page.evaluate(() => { return document.getElementById("label-memorableCharacters").innerHTML.match(/\d+/g).map(Number); });
		
		await page.click("#psw-mWordChar > div:nth-child(2) > div");

		var noDown = pass.charCodeAt(numbers[0]-1);

		if(noDown > 96) {
			noDown = noDown - 96;
		} else {
			noDown = noDown - 22;
		}

		for(i = 0; i < noDown; i++) {
			await page.keyboard.press('ArrowDown');
		}

		await page.click("#psw-mWordChar > div:nth-child(3) > div");

		var noDown = pass.charCodeAt(numbers[1]-1);

		if(noDown > 96) {
			noDown = noDown - 96;
		} else {
			noDown = noDown - 22;
		}

		for(i = 0; i < noDown; i++) {
			await page.keyboard.press('ArrowDown');
		}

		await page.click("#btn-login-authSFA");
	}
    
    while(true) {
    	try {
		    await page.waitForSelector("#a0 a");
		    await page.click("#a0 a")[0];

		    await page.waitForSelector("#pending-txns");
		    await page.click("#pending-txns");

		    await page.waitForSelector("#pendingTxnOffLoad tbody tr");
		    
		    lastTransDetails = await page.evaluate(() => {
		    	lastTransactionDetails = {
		    		"dateTime" : document.querySelectorAll("#pendingTxnOffLoad tbody tr")[0].children[1].innerText,
		    		"title" : document.querySelectorAll("#pendingTxnOffLoad tbody tr")[0].children[3].innerText,
		    		"amount" : document.querySelectorAll("#pendingTxnOffLoad tbody tr")[0].children[4].innerText
		    	};
		    	return lastTransactionDetails;
		    });
	        

		    var message = { 
				app_id: config["onesignal"]["appID"],
				contents: {"en": lastTransDetails["title"] + lastTransDetails["dateTime"] + lastTransDetails["amount"]},
				included_segments: ["All"],
				headings : {"en" : "New transaction"},
				small_icon : "ic_menu_share"
			};

			sendNotification(message);

		    console.log(lastTransDetails);
		} catch(error) {
			conosle.log(error);
		}

	    await page.waitFor(10000);

	    await page.reload();
	}

    // await page.evaluate(() => { document.getElementById(a0).getElementsByTagName("a")[0].click(); });

	// await page.screenshot({path: 'example.png'});

	// await browser.close();
})();
