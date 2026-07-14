import { useEffect } from 'react';

function SEO() {
  useEffect(() => {
    document.title = 'DevToolsDeck — Modern Developer Tools Platform';

    const setMeta = (name, content, property) => {
      const attr = property ? 'property' : 'name';
      const key = property || name;
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', 'Modern developer tools including JSON Formatter, API Tester, Diff Checker, XML Formatter, JWT Decoder and more. Fast, private, browser-based.');
    setMeta(null, 'DevToolsDeck — Modern Developer Tools Platform', 'og:title');
    setMeta(null, 'Modern developer tools including JSON Formatter, API Tester, Diff Checker, XML Formatter, JWT Decoder and more.', 'og:description');
    setMeta(null, 'website', 'og:type');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', 'DevToolsDeck — Modern Developer Tools Platform');
    setMeta('twitter:description', 'Modern developer tools including JSON Formatter, API Tester, Diff Checker, XML Formatter, JWT Decoder and more.');
    setMeta('theme-color', '#09090B');
  }, []);

  return null;
}

export default SEO;
