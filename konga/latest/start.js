const fetch = require('node-fetch');
const spawn = require('cross-spawn');
const https = require('https');

const { env } = process;
const logger = console;
const agent = new https.Agent({
  rejectUnauthorized: false
});
const config = {
  baseUrl: env.BASE_URL || 'http://localhost:1338',
  opHost: env.OP_HOST || 'https://localhost:8080',
  oxdWeb: env.OXD_WEB || 'https://localhost:8443'
};

env.NODE_TLS_REJECT_UNAUTHORIZED = true;

function main() {
  return fetch(config.oxdWeb + '/register-site', {
    agent,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      op_host: config.opHost,
      authorization_redirect_uri: config.baseUrl,
      post_logout_redirect_uri: config.baseUrl,
      scope: ['openid', 'oxd', 'permission'],
      grant_types: ['authorization_code', 'client_credentials'],
      client_name: 'KONGA_GG_UI_CLIENT'
    })
  })
    .then(res => {
      if (res.ok) {
        return res.json().then(body => {
          spawn.sync('/bin/sh', ['/opt/app/start.sh'], {
            stdio: 'inherit',
            env: {
              ...process.env,
              CLIENT_ID: body.client_id,
              CLIENT_SECRET: body.client_secret,
              OXD_ID: body.oxd_id
            }
          });
        });
      }
      logger.info(`Error: Unable to create the konga oxd client used to call the oxd-server endpoints
Please check oxd-server logs.`);
      spawn.sync('/bin/sh', ['/opt/app/start.sh'], { stdio: 'inherit' });
    })
    .catch(err => {
      logger.error(err);
      process.exit(1);
    });
}

main();
