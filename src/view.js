const render = (elements, initialState) => {
  const { status, error } = initialState;
  const { feedback, urlInput, form } = elements;
  console.log(error);

  switch (status) {
    case 'success': {
      feedback.innerHTML = 'RSS успешно загружен';
      feedback.classList.remove('text-danger');
      feedback.classList.add('text-success');
      form.reset();
      urlInput.focus();
      break;
    }
   
    case 'error': {
      feedback.classList.remove('text-success');
      feedback.classList.add('text-danger');
      urlInput.classList.add('is-invalid');
      feedback.innerHTML = error;
      break;
    }
    default: {
      break;
    }
  }
};

export default render;