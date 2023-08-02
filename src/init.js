/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
import i18next from 'i18next';
import * as yup from 'yup';
import axios from 'axios';
import renderView from './view.js';
import resources from './locales/index.js';
import parser, { processFeed, processPosts } from './parser.js';

const validate = (url, urls) => {
  const schema = yup.string()
    .trim()
    .url()
    .notOneOf(urls)
    .required();
  return schema.validate(url, { abortEarly: false });
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
    throw err.message === 'Network Error' ? new Error('networkError') : new Error('parseError');
  });

const processRss = (data, state) => {
  const { url, rss } = data;
  const newFeed = processFeed(rss);
  const posts = processPosts(rss);
  state.feeds.push(newFeed);
  state.posts.push(...posts);
  state.feeds.map((feed) => feed.url = url);
};

const updateRss = (state, time) => {
  const rssLinks = state.feeds.map((feed) => feed.url);
  const requests = rssLinks.map((request) => getRss(request));
  const oldPosts = state.posts;
  Promise.all(requests).then((items) => {
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
        const url = formData.get('url');
        const urls = view.feeds.map((feed) => feed.url);
        validate(url, urls)
          .then((validatedUrl) => {
            view.formProcess.status = 'uploaded';
            return validatedUrl;
          })
          .then((validatedUrl) => getRss(validatedUrl))
          .then((data) => {
            processRss(data, view);
            view.formProcess.status = 'success';
            view.feedback.message = i18next.t('success');
          })
          .catch((err) => {
            const { message } = err;
            view.formProcess.status = 'failed';
            if (message === 'parseError' || message === 'networkError') {
              view.feedback.message = i18next.t(`errors.${message}`);
            } else {
              view.feedback.message = message;
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
