export default (contents) => {
  const pars = new DOMParser();
  const xml = pars.parseFromString(contents, 'text/xml');
  const parseError = xml.querySelector('parsererror');
  if (parseError) {
    const error = new Error(parseError.textContent);
    error.isParsingError = true;
    throw error;
  } else {
    const title = xml.querySelector('title');
    const description = xml.querySelector('description');
    const feed = {
      title: title.textContent,
      description: description.textContent,
    };

    const posts = [...xml.querySelectorAll('item')]
      .map((item) => {
        const postTitle = item.querySelector('title');
        const postDescription = item.querySelector('description');
        const postLink = item.querySelector('link');
        return {
          title: postTitle.textContent,
          description: postDescription.textContent,
          link: postLink.textContent,
        };
      });
    return { feed, posts };
  }
};
