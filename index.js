const cheerio = require('cheerio');
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

const loadUrl = async(url) => {
	const browser = await puppeteer.launch({
	  headless: false
	});

    const page = await browser.newPage();
    await page.goto(url);

    await page.waitForSelector('#footcontainer')
    console.log('Footcontainer load successful');

    let bodyHTML = await page.evaluate(() => document.body.innerHTML);
    return bodyHTML;
    await browser.close();

}

app.get('/', async (req, res) => {
	const url = 'https://readcomiconline.to/';
	const body = await loadUrl(url);
	console.log(body);
});

app.get('/search/:comicTitle', async(req, res) => {
	const comicTitle = req.params.comicTitle;

	const browser = await puppeteer.launch({
	  headless: false
	});

    const page = await browser.newPage();

    await page.goto('https://readcomiconline.to/');

    await page.waitForSelector('#headnav')

	const SEARCH_SELECTOR = '#keyword';

	const INPUT_SELECTOR = '#imgSearch';

	await page.click(SEARCH_SELECTOR);

	await page.keyboard.type(comicTitle);

	await page.click(INPUT_SELECTOR);

	await page.waitForNavigation();

	let body = await page.evaluate(() => document.body.innerHTML);

	const $ = cheerio.load(body);

	const results = [];

	const result = $('.listing > tbody:nth-child(1) tr').each((i, item) => {
        const $item = $(item);
        const comicName = $item.find('td > a').text().trim();
        const comicLink = $item.find('td > a').attr('href');
        const comic = {
            title: comicName,
            linkRaw: comicLink,
            link: `http://localhost:4000${comicLink}`
        }
        results.push(comic);
    });

    const resultsSliced = results.slice(2, results.length);

    res.send(resultsSliced);

})

app.get('/comic/:comicTitle', async (req, res) => {
	const comicTitle = req.params.comicTitle;

	const url = `https://readcomiconline.to/comic/${comicTitle}`;

	const body = await loadUrl(url);

	const $ = cheerio.load(body);

	const title = $('.bigChar').text().trim();

	const summary = $('div.bigBarContainer:nth-child(1) > div:nth-child(2) > div:nth-child(1) > p:nth-child(10)').text().trim();
	
	const publisher = $('div.bigBarContainer:nth-child(1) > div:nth-child(2) > div:nth-child(1) > p:nth-child(4) > a:nth-child(2)').text().trim();
	
	const writer = $('div.bigBarContainer:nth-child(1) > div:nth-child(2) > div:nth-child(1) > p:nth-child(5) > a:nth-child(2)').text().trim();
	
	const artist = $('div.bigBarContainer:nth-child(1) > div:nth-child(2) > div:nth-child(1) > p:nth-child(6) > a:nth-child(2)').text().trim();
	
	const publicDate = $('div.bigBarContainer:nth-child(1) > div:nth-child(2) > div:nth-child(1) > p:nth-child(7)').text().trim();

	// Crawler Chapter !!!
	
	const chapters = [];

	const listChapters = $('html body div#containerRoot div#container div#leftside div.bigBarContainer div.barContent.episodeList div table.listing tbody tr').each((i, item) => {
        const $item = $(item);
        const chapterTitle = $item.find('td > a').text().trim();
        const chatpterLink = $item.find('td > a').attr('href');
        const chapter = {
            title: chapterTitle,
            link: chatpterLink
        }
        chapters.push(chapter);
    });

	const chapterSliced = chapters.slice(2, chapters.length);
	
	const comic = {
		title,
		publisher,
		writer,
		artist,
		publicDate,
		summary,
		chapters: chapterSliced
    };

    res.send(comic);
})

app.listen('4000', () => {
	console.log('Server is Running ...');
})