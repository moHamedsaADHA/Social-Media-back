import request from 'supertest';
import app from '../server.js';

describe('User endpoints (smoke)', () => {
  it('responds for unknown route without crashing', async () => {
    const res = await request(app).get('/__healthcheck_missing_route__');
    expect(res.statusCode).toBe(404);
  });
});
