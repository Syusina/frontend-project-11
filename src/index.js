import  './styles.scss';
import  'bootstrap';
import * as yup from 'yup';

const validator = (url, urls) => {
  const schema = yup.string()
    .trim()
    .required()
    .url()
    .notOneOf(urls);
  return schema.validate(url);
};

const initialState = {
  feeds: [],
};

const form = document.querySelector('.rss-form');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const inputUrl = formData.get('url');
  
  validator(inputUrl, initialState.feeds)
    .then((validUrl) => console.log(validUrl))
    .catch(() => console.log('777'));
});