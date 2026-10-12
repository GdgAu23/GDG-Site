// Markdown for posts, project stories and event notes. Raw HTML is escaped and
// links/images are limited to http(s) or site paths, so admin input can't inject script.
import { Marked } from 'marked';
import { esc, safeUrl } from './util.js';

const md = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    html({ text }) { return esc(text); },
    link({ href, title, tokens }) {
      const url = safeUrl(href);
      const inner = this.parser.parseInline(tokens);
      if (!url) return inner;
      const external = /^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${esc(url)}"${title ? ` title="${esc(title)}"` : ''}${external}>${inner}</a>`;
    },
    image({ href, text }) {
      const url = safeUrl(href);
      return url ? `<img src="${esc(url)}" alt="${esc(text)}" loading="lazy" decoding="async">` : '';
    },
  },
});

export const renderMarkdown = (src) => md.parse(String(src || ''));
