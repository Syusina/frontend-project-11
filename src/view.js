import onChange from 'on-change';

const renderForm = (state, elements) => {
  const { form, input } = elements;
  if (!state.formProcess.status === 'uploaded') {
    input.classList.add('is-invalid');
  } else {
    input.classList.remove('is-invalid');
    form.reset();
    input.focus();
  }
};

const renderFeedback = (state, elements) => {
  const { feedback } = elements;
  if (state.formProcess.status === 'success') {
    feedback.classList.remove('text-danger');
    feedback.classList.add('text-success');
  } else {
    feedback.classList.remove('text-success');
    feedback.classList.add('text-danger');
  }
  feedback.textContent = state.feedback.message;
};

const renderFeeds = (state) => {
  const listGroup = document.querySelector('.feeds .card .list-group');
  state.feeds.forEach((feed) => {
    const item = document.createElement('li');
    item.classList.add('list-group-item', 'border-0', 'border-end-0');
    listGroup.appendChild(item);
    const itemTitle = document.createElement('h3');
    itemTitle.classList.add('h6', 'm-0');
    itemTitle.textContent = feed.title;
    item.appendChild(itemTitle);
    const itemDesc = document.createElement('p');
    itemDesc.classList.add('m-0', 'small-text-black-50');
    itemDesc.textContent = feed.description;
    item.appendChild(itemDesc);
  });
};

const renderPosts = (state, i18n) => {
  const listGroup = document.querySelector('.posts .card .list-group');
  state.posts.forEach((post) => {
    const { title, link, id } = post;
    const item = document.createElement('li');
    item.classList.add(
      'list-group-item',
      'd-flex',
      'justify-content-between',
      'align-items-start',
      'border-0',
      'border-end-0',
    );

    const itemLink = document.createElement('a');
    const button = document.createElement('button');

    itemLink.classList.add('fw-bold');
    itemLink.setAttribute('target', '_blank');
    itemLink.setAttribute('rel', 'noopener noreferrer');
    itemLink.dataset.id = id;
    itemLink.href = link;
    itemLink.textContent = title;
    if (state.uiState.viewedPosts.includes(id)) {
      itemLink.classList.remove('fw-bold');
      itemLink.classList.add('fw-normal', 'link-secondary');
    }
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.textContent = i18n.t('view');
    button.setAttribute('type', 'button');
    button.setAttribute('data-id', post.id);
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');

    item.append(itemLink, button);
    listGroup.appendChild(item);
  });
};

const renderModal = (state, elements) => {
  const modalTitle = elements.modal.querySelector('.modal-title');
  const modalBody = elements.modal.querySelector('.modal-body');
  const modalLink = elements.modal.querySelector('.full-article');
  const id = state.uiState.activeModal;
  const { title, link, description } = state.posts.find(
    (post) => post.id === id,
  );
  modalTitle.textContent = title;
  modalBody.textContent = description;
  modalLink.href = link;
};

const renderContainer = (state, type, i18n) => {
  const parent = document.querySelector(`.${type}`);
  parent.innerHTML = '';
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');
  parent.appendChild(card);
  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');
  const cardTitle = document.createElement('h2');
  cardTitle.classList.add('card-title', 'h4');
  cardTitle.textContent = i18n.t(type);
  const listGroup = document.createElement('ul');
  listGroup.classList.add('list-group', 'border-0', 'rounded-0');
  card.append(cardBody, cardTitle, listGroup);
  switch (type) {
    case 'feeds':
      renderFeeds(state);
      break;
    case 'posts':
      renderPosts(state, i18n);
      break;
    default:
      break;
  }
};

const renderView = (elements, i18n, initialState) => {
  const watchedState = onChange(initialState, (path) => {
    switch (path) {
      case 'formProcess':
        renderForm(watchedState, elements);
        break;
      case 'feedback.message':
        renderFeedback(watchedState, elements);
        break;
      case 'feeds':
        renderContainer(watchedState, 'feeds', i18n);
        break;
      case 'uiState.viewedPosts':
      case 'posts':
        renderContainer(watchedState, 'posts', i18n);
        break;
      case 'uiState.activeModal':
        renderModal(watchedState, elements);
        break;
      default:
        break;
    }
  });

  return watchedState;
};

export default renderView;
