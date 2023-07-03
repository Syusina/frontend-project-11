import axios from 'axios';

const parseRss = (data) => {
  const parser = new DOMParser();
  const parsedRss = parser.parseFromString(data, 'text/xml');
  const parseError = parsedRss.querySelector('parsererror');
  if (parseError) {
    throw new Error('parseError');
  }
  return parsedRss;
};

export const processPosts = (rss) => {
  const items = rss.querySelectorAll('item');
  const posts = [];
  items.forEach((item) => {
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;
    const id = item.querySelector('guid').textContent;
    posts.push({
      title, description, link, id,
    });
  });
  return posts;
};

export const processFeed = (rss) => {
  const feed = rss.querySelector('channel');
  const title = feed.querySelector('title').textContent;
  const description = feed.querySelector('description').textContent;
  return { title, description };
};

const getRss = (url) => {
  const proxyUrl = new URL('get', 'https://allorigins.hexlet.app');
  proxyUrl.searchParams.set('disableCache', true);
  proxyUrl.searchParams.set('url', url);
  return axios
    .get(proxyUrl)
    .then((response) => response.data)
    .then((data) => ({ url, rss: parseRss(data.contents) }))
    .catch((err) => {
      throw err.message === 'Network Error' ? new Error('networkError') : err;
    });
};

export default getRss;
