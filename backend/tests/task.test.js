'use strict';

const request = require('supertest');
const { app } = require('../src/app');
const { prisma } = require('../src/repositories/task.repository');

describe('Task API & Ownership Enforcement', () => {
  let userA, userB;
  let tokenA, tokenB;

  beforeAll(async () => {
    const emailA = `usera-${Date.now()}@example.test`;
    const emailB = `userb-${Date.now()}@example.test`;
    const password = 'a-very-long-test-password';

    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: emailA, password });
    tokenA = resA.body.accessToken;

    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: emailB, password });
    tokenB = resB.body.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('User A can create a task', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'User A Secret Task',
        description: 'Details for user A',
      });

    expect(res.status).toBe(201);
    expect(res.body.item).toBeDefined();
    expect(res.body.item.title).toBe('User A Secret Task');
  });

  test('User B cannot see User A task in list', async () => {
    const resB = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(resB.status).toBe(200);
    expect(resB.body.items).toHaveLength(0);
  });

  test('User B cannot update User A task (IDOR protection)', async () => {
    const createRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Task to defend' });

    const taskId = createRes.body.item.id;

    const attackRes = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ completed: true });

    expect(attackRes.status).toBe(404);
  });

  test('User B cannot delete User A task', async () => {
    const createRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Task to keep safe' });

    const taskId = createRes.body.item.id;

    const deleteRes = await request(app)
      .delete(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(deleteRes.status).toBe(404);
  });

  test('Requires authentication for protected routes', async () => {
    const res = await request(app).get('/api/v1/tasks');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
});
