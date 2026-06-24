import { formatter } from '@lingui/format-po';

export default {
  locales: ['en', 'es'],
  sourceLocale: 'en',
  catalogs: [{
    path: 'src/locales/{locale}/messages',
    include: ['src'],
  }],
  format: formatter({ lineNumbers: false }),
};
