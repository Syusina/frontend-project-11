/* eslint-disable no-param-reassign */
import i18next from 'i18next';
import * as yup from 'yup';
import renderView from './view.js';
import resources from './locales/index.js';
import getRss, { processFeed, processPosts } from './rss.js';

const validator = (url, urls, state) => {
  yup.setLocale({
    string: {
      url: () => i18next.t('errors.invalidUrl'),
    },
    mixed: {
      notOneOf: () => i18next.t('errors.alreadyExists'),
      required: () => i18next.t('errors.required'),
    },
  });
  const schema = yup.string()
    .trim()
    .url()
    .notOneOf(urls)
    .required();
  try {
    return schema.validate(url, { abortEarly: false });
  } catch (err) {
    state.feedback.message = err.message;
  }
  return null;
};

const processRss = (data, state) => {
  const { url, rss } = data;
  const feed = processFeed(rss);
  const posts = processPosts(rss);
  state.rssLoaded = true;
  state.urls.push(url);
  state.feeds.push(feed);
  state.posts.push(...posts);
  state.feedback.message = i18next.t('success');
};

const updateRss = (state, time) => {
  setTimeout(() => {
    const { urls } = state;
    const newRss = urls.map(getRss);
    const oldPosts = state.posts;
    Promise.all(newRss).then((item) => {
      const newPosts = item.map(({ rss }) => processPosts(rss));
      const uniquePosts = newPosts
        .flat()
        .filter((newPost) => !oldPosts.some((oldPost) => oldPost.id === newPost.id));
      if (uniquePosts.length > 0) {
        state.posts = [...uniquePosts, ...state.posts];
      }
    });
    updateRss(state, time);
  }, time);
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
  form: {
    valid: true,
    submitted: false,
  },
  feedback: {
    valid: false,
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
        utils.feedback.message = '';
        const formData = new FormData(e.target);
        const url = formData.get('url');
        validator(url, utils.urls, utils)
          .then((validatedUrl) => {
            utils.form.valid = true;
            utils.feedback.valid = true;
            utils.form.submitted = true;
            return validatedUrl;
          })
          .then((validatedUrl) => getRss(validatedUrl))
          .then((data) => processRss(data, utils))
          .catch((err) => {
            const { message } = err;
            utils.feedback.valid = false;
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
