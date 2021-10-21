const { protect } = require('../middleware/protect');
const { PERMISSIONS } = require('../constants/permissions');

const renderConf = (app) => {
  // Set views for routes
  app.get('/', (req, res, next) => {
    if (req.cookies.token) {
      res.redirect('/dashboard');
    } else {
      res.render('index', { title: 'Passave | Password Manager' });
    }
  });

  app.get('/dashboard', protect(PERMISSIONS.ONLY_USERS), (req, res, next) => {
    res.render('dashboard', { title: 'Passave | Dashboard' });
  });

  app.get('/sign-in', (req, res, next) => {
    if (req.cookies.token) {
      res.redirect('/dashboard');
    } else {
      res.render('sign-in', { title: 'Passave | Sign In' });
    }
  });

  app.get('/sign-up', (req, res, next) => {
    if (req.cookies.token) {
      res.redirect('/dashboard');
    } else {
      res.render('sign-up', { title: 'Passave | Sign Up' });
    }
  });

  app.get('/faq', (req, res, next) => {
    res.render('faq', { title: 'Passave | F.A.Q' });
  });

  app.get('/terms', (req, res, next) => {
    res.render('terms', { title: 'Passave | Terms & Conditions' });
  });

  app.get('/forgot', (req, res, next) => {
    if (req.cookies.token) {
      res.redirect('/dashboard');
    } else {
      res.render('forgot', { title: 'Passave | Forgot Password?' });
    }
  });

  app.get('/postSignup', (req, res, next) => {
    res.render('postSignup', {
      title: 'Passave | Post Sign up',
    });
  });

  app.get('/404', (req, res, next) => {
    res.render('404', { title: 'Passave | 404 Error' });
  });

  app.get('*', (req, res, next) => {
    res.redirect('/404');
  });
};

module.exports = renderConf;
