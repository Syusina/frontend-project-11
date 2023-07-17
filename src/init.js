/* eslint-disable no-param-reassign */
import i18next from 'i18next';
import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import renderView from './view.js';
import resources from './locales/index.js';
import parser from './parser.js';

const validate = (url, urls) => {
  const schema = yup.string()
    .trim()
    .url()
    .notOneOf(urls)
    .required();
  return schema.validate(url, { abortEarly: false });
};

const processFeed = (xml) => {
  const feed = xml.querySelector('channel');
  const title = feed.querySelector('title').textContent;
  const description = feed.querySelector('description').textContent;
  return { title, description };
};

const processPosts = (xml) => {
  const posts = [...xml.querySelectorAll('item')]
    .map((item) => {
      const title = item.querySelector('title').textContent;
      const description = item.querySelector('description').textContent;
      const link = item.querySelector('link').textContent;
      const id = _.uniqueId();
      return {
        title, description, link, id,
      };
    });
  return posts;
};

const proxyRequest = (url) => {
  const request = new URL('https://allorigins.hexlet.app/get?');
  request.searchParams.set('disableCache', true);
  request.searchParams.set('url', url);
  return request.toString();
};

const getRss = (url) => axios.get(proxyRequest(url))
  .then((response) => response.data)
  .then((data) => ({ url, rss: parser(data.contents) }))
  .catch((err) => {
    throw err.message === 'Network Error' ? new Error('networkError') : err;
  });

const processRss = (data, state) => {
  const { url, rss } = data;
  const feed = processFeed(rss);
  const posts = processPosts(rss);
  state.urls.push(url);
  state.feeds.push(feed);
  state.posts.push(...posts);
};

const updateRss = (state, time) => {
  const { urls } = state;
  const rssLinks = urls.map(getRss);
  const oldPosts = state.posts;
  Promise.all(rssLinks).then((items) => {
    const newPosts = items.map(({ rss }) => processPosts(rss));
    const uniquePosts = newPosts
      .flat()
      .filter((newPost) => !oldPosts.some((oldPost) => oldPost.id === newPost.id));
    if (uniquePosts.length > 0) {
      state.posts.push(...uniquePosts);
    }
  });
  setTimeout((updateRss, time, state, time));
};

const elements = {
  form: document.querySelector('.rss-form'),
  submit: document.querySelector('button[type="submit"]'),
  input: document.querySelector('#url-input'),
  feedback: document.querySelector('.feedback'),
  feeds: document.querySelector('.feeds'),
  posts: document.querySelector('.posts'),
  modal: document.querySelector('#modal'),
};

const initState = {
  process: {
    status: 'idle',
  },
  form: {
    valid: true,
    submitted: false,
  },
  feedback: {
    message: '',
  },
  uiState: {
    activeModal: '',
    viewedPosts: [],
  },
  posts: [],
  feeds: [],
  urls: [],
  rssLoaded: false,
};

export default () => {
  yup.setLocale({
    string: {
      url: () => i18next.t('errors.invalidUrl'),
    },
    mixed: {
      notOneOf: () => i18next.t('errors.alreadyExists'),
      required: () => i18next.t('errors.required'),
    },
  });

  const defaultLang = 'ru';
  const delay = 5000;
  i18next.init({
    lng: defaultLang,
    debug: false,
    resources,
  })
    .then(() => {
      const utils = renderView(elements, i18next, initState);
      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        utils.process.status = 'sending';
        utils.feedback.message = '';
        const formData = new FormData(e.target);
        const url = formData.get('url');
        validate(url, utils.urls, utils)
          .then((validatedUrl) => {
            utils.form.valid = true;
            utils.form.submitted = true;
            return validatedUrl;
          })
          .then((validatedUrl) => getRss(validatedUrl))
          .then((data) => {
            processRss(data, utils);
            utils.process.status = 'filling';
            utils.rssLoaded = true;
            utils.feedback.message = i18next.t('success');
          })
          .catch((err) => {
            const { message } = err;
            utils.process.status = 'failed';
            utils.form.valid = false;
            if (message === 'parseError' || message === 'networkError') {
              utils.feedback.message = i18next.t(`errors.${message}`);
            } else {
              utils.feedback.message = message;
            }
          });
      });

      elements.posts.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
          utils.uiState.activeModal = e.target.dataset.id;
          utils.uiState.viewedPosts.push(e.target.dataset.id);
        }
        if (e.target.tagName === 'A') {
          utils.uiState.viewedPosts.push(e.target.dataset.id);
        }
      });
      updateRss(utils, delay);
    });
};
