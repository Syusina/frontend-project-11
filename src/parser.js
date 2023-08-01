import _ from 'lodash';

export default (contents) => {
  const pars = new DOMParser();
  const xml = pars.parseFromString(contents, 'text/xml');
  const parseError = xml.querySelector('parsererror');
  if (parseError) {
    throw new Error(parseError.textContent);
  }
  return xml;
};

export const processFeed = (xml) => {
  const title = xml.querySelector('title');
  const description = xml.querySelector('description');
  const url = xml.querySelector('link');
  const feed = {
    title: title.textContent,
    description: description.textContent,
    url: url.textContent,
  };
  return feed;
};

export const processPosts = (xml) => {
  const posts = [...xml.querySelectorAll('item')]
    .map((item) => {
      const title = item.querySelector('title');
      const description = item.querySelector('description');
      const link = item.querySelector('link');
      const id = _.uniqueId();
      return {
        title: title.textContent,
        description: description.textContent,
        link: link.textContent,
        id,
      };
    });
  return posts;
};
