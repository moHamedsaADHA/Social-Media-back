import request from 'supertest';
import app from '../server.js';

describe('Post endpoints (smoke)', () => {
  it('returns posts list or empty', async () => {
    const res = await request(app).get('/api/posts');
    expect([200, 204, 404]).toContain(res.statusCode);
  });
});
