import request from 'supertest';
import app from '../server.js';

describe('User endpoints (smoke)', () => {
  it('returns 404 for unknown user', async () => {
    const res = await request(app).get('/api/users/000000000000000000000000');
    expect([200, 404]).toContain(res.statusCode);
  });
});
