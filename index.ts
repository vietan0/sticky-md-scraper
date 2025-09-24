import http from 'node:http';
import https from 'node:https';
import express from 'express';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

const allowlist = ['http://localhost:5173', 'https://sticky-md.web.app'];
const corsOptionsDelegate = function (req: any, callback: any) {
  let corsOptions;
  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true }; // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false }; // disable CORS for this request
  }
  callback(null, corsOptions); // callback expects two parameters: error and options
};

const AbortController = globalThis.AbortController;

const controller = new AbortController();
const timeout = setTimeout(() => {
  console.log('Aborting after 30s');
  controller.abort();
}, 30000);

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });
const agentSelector = function (_parsedURL: any) {
  if (_parsedURL.protocol == 'http:') {
    return httpAgent;
  } else {
    return httpsAgent;
  }
};

async function fetchStuffs(url: string) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 0));
    const res = await fetch(url, { agent: agentSelector, timeout: 30000 });
    const html = await res.text();
    const $ = cheerio.load(html);

    const getMetatag = (name: string) =>
      $(`meta[name=${name}]`).attr('content') ||
      $(`meta[name="og:${name}"]`).attr('content') ||
      $(`meta[name="twitter:${name}"]`).attr('content') ||
      $(`meta[property="og:${name}"]`).attr('content');

    const faviconRelative =
      $('link[rel="shortcut icon"]').attr('href') || $('link[rel="icon"]').attr('href');
    const faviconFull = new URL(url).origin + faviconRelative;

    const info = {
      url,
      title: $('title').first().text(),
      favicon: faviconFull,
      description: getMetatag('description'),
      image: getMetatag('image'),
      author: getMetatag('author'),
    };
    return info;
  } catch (err) {
    console.log(err);
  } finally {
    clearTimeout(timeout);
  }
}

app.get('/', (req, res) => {
  res.json({
    msg: 'Welcome to sticky-md-scraper! 🎉',
    instructions: "Send your url to '/api?url={insert_here}' as a GET request.",
  });
});

app.get('/api', cors(corsOptionsDelegate), async (req, res) => {
  const url = req.query.url as string;
  const data = await fetchStuffs(url);
  console.log(data);
  res.json(data);
});

app.listen(PORT, () => {
  return console.log(`Express is listening at http://localhost:${PORT} !`);
});
