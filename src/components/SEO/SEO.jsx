import { useEffect } from 'react';

const DEFAULT_TITLE = 'DevToolsDeck | Free, Fast & Secure Online Developer Utilities';
const DEFAULT_DESC = 'Free online developer tools — JSON Formatter, Diff Checker, API Tester, JWT Decoder, SQL Formatter, Excel Compare & more. 100% client-side, no data leaves your browser.';

function SEO({ title, description }) {
  useEffect(() => {
    const pageTitle = title || DEFAULT_TITLE;
    const pageDesc = description || DEFAULT_DESC;

    document.title = pageTitle;

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

    setMeta('description', pageDesc);
    setMeta(null, pageTitle, 'og:title');
    setMeta(null, pageDesc, 'og:description');
    setMeta(null, 'website', 'og:type');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', pageTitle);
    setMeta('twitter:description', pageDesc);
    setMeta('theme-color', '#09090B');
  }, [title, description]);

  return null;
}

export default SEO;
