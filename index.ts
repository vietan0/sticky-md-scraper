import express from 'express';
import cheerio from 'cheerio';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

async function fetchStuffs(url: string) {
  const res = await fetch(url);
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
}

app.get('/', (req, res) => {
  res.json({
    msg: 'Welcome to sticky-md-scraper! 🎉',
    instructions: "Send your url to '/api?url={insert_here}' as a GET request.",
  });
});

app.get('/api', async (req, res) => {
  const url = req.query.url as string;
  const data = await fetchStuffs(url);
  console.log(data);
  res.json(data);
});

app.listen(PORT, () => {
  return console.log(`Express is listening at http://localhost:${PORT} !`);
});
