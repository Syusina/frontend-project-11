export default (contents) => {
  const pars = new DOMParser();
  const xml = pars.parseFromString(contents, 'text/xml');
  const parseError = xml.querySelector('parsererror');
  if (parseError) {
    throw new Error('parseError');
  }
  return xml;
};
