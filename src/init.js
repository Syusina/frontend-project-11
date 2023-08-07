/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
import i18next from 'i18next';
import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import renderView from './view.js';
import resources from './locales/index.js';
import parser from './parser.js';

const validate = (url, urls = []) => {
  const schema = yup.string()
    .trim()
    .url()
    .notOneOf(urls)
    .required();
  return schema.validate(url, { abortEarly: false });
};

const proxyRequest = (link) => {
  const url = new URL('https://allorigins.hexlet.app/get?');
  url.searchParams.set('disableCache', true);
  url.searchParams.set('url', link);
  return url.toString();
};

const getHtml = (link) => {
  const url = proxyRequest(link);
  return axios.get(url).then((response) => response.data);
};

const normalizeUrl = (link) => (link.endsWith('/') ? link.slice(0, -1) : link);

const updateRss = (state, delay) => {
  const rssLinks = state.feeds.map((feed) => feed.url);
  const requests = rssLinks.map((request) => getHtml(request));
  const promise = Promise.all(requests);
  promise.then((responses) => responses.forEach((response) => {
    if (response.status === 'fulfilled') {
      const { contents } = response.value;
      const { feed, posts } = parser(contents);
      if (feed && posts) {
        const currentFeed = state.feeds.find(({ title }) => feed.title === title);
        const oldPostTitles = state.posts.map((post) => post.title);
        const newPosts = posts.filter(({ title }) => !oldPostTitles.includes(title));
        if (newPosts.length !== 0) {
          const postsId = newPosts.map((post) => {
            post.feedId = currentFeed.id;
            post.id = _.uniqueId();
            return post;
          });
          state.posts.unshift(...postsId);
        }
      }
    }
  }))
    .then(setTimeout(updateRss, delay, state, delay));
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
  formProcess: {
    status: 'idle',
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
      const view = renderView(elements, i18next, initState);
      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        view.formProcess.status = 'sending';
        view.feedback.message = '';

        const formData = new FormData(e.target);
        const url = normalizeUrl(formData.get('url').trim());
        const urls = view.feeds.map((feed) => feed.url);
        validate(url, urls)
          .then((validatedUrl) => getHtml(validatedUrl))
          .then(({ contents }) => {
            const rss = parser(contents);
            view.formProcess.status = 'uploaded';
            const feedId = _.uniqueId();
            rss.feed.id = feedId;
            rss.feed.url = url;
            const postsId = rss.posts.map((post) => {
              post.feedId = feedId;
              post.id = _.uniqueId();
              return post;
            });
            view.feeds.push(rss.feed);
            view.posts.unshift(...postsId);
            view.formProcess.status = 'success';
            view.feedback.message = i18next.t('success');
          })
          .catch((error) => {
            const { message } = error;
            view.formProcess.status = 'failed';
            if (message === 'Network Error') {
              view.feedback.message = i18next.t('errors.networkError');
            } else if (error.isParsingError) {
              view.feedback.message = i18next.t('errors.parseError');
            } else {
              view.feedback.message = i18next.t(`${message}`);
            }
          });
      });

      elements.posts.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
          view.uiState.activeModal = e.target.dataset.id;
          view.uiState.viewedPosts.push(e.target.dataset.id);
        }
        if (e.target.tagName === 'A') {
          view.uiState.viewedPosts.push(e.target.dataset.id);
        }
      });
      updateRss(view, delay);
    });
};
