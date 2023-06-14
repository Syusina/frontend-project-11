import  './styles.scss';
import  'bootstrap';
import * as yup from 'yup';
import onChange from 'on-change';
import i18n from 'i18next';
import render from './view.js';

const validator = (url, urls) => {
  const schema = yup.string()
    .trim()
    .required()
    .url()
    .notOneOf(urls);
  return schema.validate(url);
};

const initialState = {
  status: '',
  error: '',
  feeds: [],
};

const elements = {
  form: document.querySelector('.rss-form'),
  urlInput: document.querySelector('#url-input'),
  feedback: document.querySelector('.feedback'),
};

const watchedState = onChange(initialState, () => {
  render(elements, watchedState)
});

export default async () => {
  const defaultLang = 'ru';
  const i18nInstance = i18n.createInstance();
}

elements.form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const inputUrl = formData.get('url');

  validator(inputUrl, initialState.feeds)
    .then((validUrl) => {
      watchedState.status = 'success';
      watchedState.feeds.push(validUrl);
      render(elements, watchedState);
    })
    .catch((error) => {
      watchedState.status = 'error';
      const { type } = error;
      switch (type) {
        case 'url': {
          watchedState.error = 'Ссылка должна быть валидным URL';
          break;
        }
        case 'required': {
          watchedState.error = 'Поле не должно быть пустым';
          break;
        }
        case 'notOneOf': {
          watchedState.error = 'Адрес уже существует';
          break;
        }
        case '???тут добавить название ошибки': {
          watchedState.error = 'Ошибка загрузки';
          break;
        }
        default: {
          throw new Error('Unknown error');
        }
      }
      
      render(elements, watchedState);
    }
  );

});
