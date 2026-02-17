import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import { run } from "./utils/run";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

run(async () => {
	const url =
		"http://localhost:6006/iframe.html?id=cardbook-lists--all&viewMode=story";
	const screenshotDir = path.resolve(path.join(__dirname, "../../../exports"));
	console.log(`Save to ${screenshotDir}`);

	// Launch browser in headless mode
	const browser = await puppeteer.launch({
		headless: false,
		devtools: true, // Open DevTools automatically (optional)
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
		defaultViewport: {
			// TODO: Get these variables from the project data somehow maybe
			width: 850 * 3,
			height: 1050 * 3,
		},
	});
	const page = await browser.newPage();

	// Visit the URL
	console.log(`Visiting ${url}`);
	await page.goto(url, { waitUntil: "networkidle0" });

	// Remove .sb-main from the body
	console.log(`Finding body tag`);
	await page.evaluate(() => {
		const body = document.querySelector("body");
		if (body) {
			//body.classList.remove("sb-main-padded");
		}
	});

	// Find the .piece-list div and take screenshot
	console.log("Finding list of pieces");
	const pieceList = await page.$(".piece-list");

	if (pieceList) {
		const screenshotPath = path.join(screenshotDir, "piece-list.png");
		console.log(`Saving screenshot to ${screenshotPath}`);
		await pieceList.screenshot({
			path: screenshotPath,
			fullPage: false,
		});
		console.log(`Screenshot saved to ${screenshotPath}`);
	} else {
		console.error("Could not find .piece-list element");
	}

	// Close browser
	// await browser.close();
	await new Promise(() => {
		console.log("wait forever");
	});
});
