'use strict';

const should = require('should');
const fs = require('fs');
const onerror = require('..');
const koa = require('koa');
const request = require('supertest');

describe('json.test.js', function() {
  it('should common error ok', function(done) {
    const app = koa();
    app.on('error', function() {});
    onerror(app);
    app.use(commonError);

    request(app.callback())
    .get('/')
    .set('Accept', 'application/json')
    .expect(500)
    .expect({ error: 'foo is not defined' }, done);
  });

  it('should stream error ok', function(done) {
    const app = koa();
    app.on('error', function() {});
    onerror(app);
    app.use(streamError);

    request(app.callback())
    .get('/')
    .set('Accept', 'application/json')
    .expect(404, function(err, res) {
      should.not.exist(err);
      res.body.error.should.be.a.String;
      res.body.error.should.containEql('ENOENT');
      done();
    });
  });

  it('should custom handler', function(done) {
    const app = koa();
    app.on('error', function() {});
    onerror(app, {
      json: function() {
        this.status = 500;
        this.body = {
          message: 'error',
        };
      },
    });
    app.use(commonError);

    request(app.callback())
    .get('/')
    .set('Accept', 'application/json')
    .expect(500)
    .expect({ message: 'error' }, done);
  });

  it('should show status error when err.message not present', function(done) {
    const app = koa();
    app.on('error', function() {});
    onerror(app);
    app.use(emptyError);

    request(app.callback())
    .get('/')
    .set('Accept', 'application/json')
    .expect(500)
    .expect({ error: 'Internal Server Error' }, done);
  });

  it('should wrap non-error object', function(done) {
    const app = koa();
    app.on('error', function() {});
    onerror(app);
    app.use(function*() {
      throw 1;
    });

    request(app.callback())
    .get('/')
    .set('Accept', 'application/json')
    .expect(500)
    .expect({ error: 'non-error thrown: 1' }, done);
  });

  it('should custom handler with ctx', function(done) {
    const app = koa();
    app.on('error', function() {});
    onerror(app, {
      json: (err, ctx) => {
        ctx.status = 500;
        ctx.body = {
          message: 'error',
        };
      },
    });
    app.use(commonError);

    request(app.callback())
    .get('/')
    .set('Accept', 'application/json')
    .expect(500)
    .expect({ message: 'error' }, done);
  });
});

function* emptyError() {
  const err = new Error('');
  err.expose = true;
  throw err;
}

function* commonError() {
  // eslint-disable-next-line
  foo();
}

function* streamError() {
  this.body = fs.createReadStream('not exist');
}
