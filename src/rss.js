import axios from 'axios';

const parser = (contents) => {
  const pars = new DOMParser();
  const xml = pars.parseFromString(contents, 'text/xml');
  const parseError = xml.querySelector('parsererror');
  if (parseError) {
    throw new Error('parseError');
  }
  return xml;
};

export const processPosts = (xml) => {
  const posts = [];
  const items = xml.querySelectorAll('item');
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

export const processFeed = (xml) => {
  const feed = xml.querySelector('channel');
  const title = feed.querySelector('title').textContent;
  const description = feed.querySelector('description').textContent;
  return { title, description };
};

export default (url) => {
  const proxyUrl = new URL('get', 'https://allorigins.hexlet.app');
  proxyUrl.searchParams.set('disableCache', true);
  proxyUrl.searchParams.set('url', url);
  return axios
    .get(proxyUrl)
    .then((response) => response.data)
    .then((data) => ({ url, rss: parser(data.contents) }))
    .catch((err) => {
      throw err.message === 'Network Error' ? new Error('networkError') : err;
    });
};

