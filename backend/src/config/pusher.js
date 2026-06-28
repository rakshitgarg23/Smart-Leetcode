const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || 'placeholder',
  key: process.env.PUSHER_KEY || 'placeholder',
  secret: process.env.PUSHER_SECRET || 'placeholder',
  cluster: process.env.PUSHER_CLUSTER || 'mt1',
  useTLS: true
});

module.exports = pusher;
