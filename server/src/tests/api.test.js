import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { connectDB, disconnectDB } from '../config/db';
import runSeed from '../../scripts/seedDemoDataInternal';

let adminToken = '';
let workerToken = '';
let villagerToken = '';
let createdSourceId = '';
let createdTestId = '';
let createdReportId = '';
let createdAlertId = '';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await connectDB();
  await runSeed();

  // Obtain authentic tokens for all three roles
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@safedrop.org', password: 'AdminSecurePass123!' });
  adminToken = adminRes.body.token;

  const workerRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'worker@safedrop.org', password: 'WorkerSecurePass123!' });
  workerToken = workerRes.body.token;

  const villagerRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'villager@safedrop.org', password: 'VillagerSecurePass123!' });
  villagerToken = villagerRes.body.token;
}, 30000);

afterAll(async () => {
  await disconnectDB();
});

describe('1. Health Check & Public Endpoints', () => {
  it('GET /api/health should return 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('healthy');
  });

  it('GET /api/water-sources should succeed for public visitors', async () => {
    const res = await request(app).get('/api/water-sources');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/water-sources?forMap=true returns geocoded India sources and supports filters', async () => {
    const res = await request(app).get('/api/water-sources?forMap=true&state=Maharashtra&limit=2000');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((source) => source.state === 'Maharashtra')).toBe(true);
    expect(res.body.data.every((source) => source.coordinates?.latitude !== undefined)).toBe(true);
  });

  it('GET /api/alerts should succeed for public visitors', async () => {
    const res = await request(app).get('/api/alerts?isPublic=true');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/articles should return educational content', async () => {
    const res = await request(app).get('/api/articles');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe('2. Authentication Workflows', () => {
  const uniqueEmail = `villager_new_${Date.now()}@example.com`;
  let newVillagerToken = '';

  it('POST /api/auth/register should create a villager account', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New Test Villager',
        email: uniqueEmail,
        password: 'ValidPassword123!',
        village: 'Rampur',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('villager');
    newVillagerToken = res.body.token;
  });

  it('POST /api/auth/register should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Villager',
        email: uniqueEmail,
        password: 'ValidPassword123!',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login with valid credentials should return token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: uniqueEmail,
        password: 'ValidPassword123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/auth/login with invalid password should fail (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: uniqueEmail,
        password: 'WrongPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me without token should return 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me with valid token should return user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${newVillagerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(uniqueEmail);
  });
});

describe('3. Role Authorization & Protected Routes', () => {
  it('Villager cannot access Admin user list (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${villagerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Admin can access Admin user list (200 OK)', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('4. Water Source Management', () => {
  it('Villager cannot create a water source (403)', async () => {
    const res = await request(app)
      .post('/api/water-sources')
      .set('Authorization', `Bearer ${villagerToken}`)
      .send({
        name: 'Unauthorized Pump',
        type: 'hand_pump',
        village: 'Rampur',
      });

    expect(res.status).toBe(403);
  });

  it('Health Worker can register a new water source', async () => {
    const res = await request(app)
      .post('/api/water-sources')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        name: 'East Ward Solar Borewell',
        type: 'borewell',
        village: 'Devgarh',
        address: 'Near East Primary School',
        latitude: 19.065,
        longitude: 73.018,
        description: 'New installation with deep aquifer casing',
        status: 'active',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBeDefined();
    createdSourceId = res.body.data._id;
  });

  it('GET /api/water-sources/:id should return details with coordinates', async () => {
    const res = await request(app).get(`/api/water-sources/${createdSourceId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('East Ward Solar Borewell');
    expect(res.body.data.coordinates.latitude).toBe(19.065);
  });

  it('Handles invalid MongoDB ID with 400 Bad Request', async () => {
    const res = await request(app).get('/api/water-sources/not-a-valid-id-1234');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('5. Water Testing & Risk Assessment Engine', () => {
  it('Health Worker can record water test with parameters', async () => {
    const res = await request(app)
      .post('/api/water-tests')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        sourceId: createdSourceId,
        testingMethod: 'field_kit',
        notes: 'Monthly compliance sample',
        parameters: [
          { parameter: 'ph', name: 'pH Value', value: 5.8, unit: 'pH' }, // Violates pH < 6.5
          { parameter: 'turbidity', name: 'Turbidity', value: 7.2, unit: 'NTU' }, // Violates Turbidity > 5.0
          { parameter: 'tds', name: 'Total Dissolved Solids', value: 380, unit: 'mg/L' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBeDefined();
    createdTestId = res.body.data._id;

    // Verify Risk Engine evaluation triggered flags
    expect(res.body.evaluation).toBeDefined();
    expect(res.body.evaluation.flagsGenerated).toBeGreaterThanOrEqual(1);
  });

  it('Risk flags should be retrievable by staff', async () => {
    const res = await request(app)
      .get('/api/risk/flags')
      .set('Authorization', `Bearer ${workerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe('6. Community Reporting Workflow', () => {
  it('keeps government configuration status restricted to staff', async () => {
    const anonymous = await request(app).get('/api/government/configuration');
    expect(anonymous.status).toBe(401);

    const staff = await request(app)
      .get('/api/government/configuration')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(staff.status).toBe(200);
    expect(typeof staff.body.data.governmentApiConfigured).toBe('boolean');
  });

  it('accepts a validated report without authentication and allows public status tracking', async () => {
    const submission = await request(app)
      .post('/api/reports/public')
      .send({
        fullName: 'Public Test Reporter',
        phone: '+919876543210',
        email: 'public.reporter@example.com',
        state: 'Maharashtra',
        district: 'Pune',
        village: 'Mulshi',
        address: 'Near the community water tank',
        waterSourceType: 'water_tank',
        concerns: ['dirty_or_muddy_water'],
        description: 'The water became cloudy after heavy rain yesterday.',
      });

    expect(submission.status).toBe(201);
    expect(submission.body.success).toBe(true);
    expect(submission.body.data.referenceId).toMatch(/^SD-\d{4}-\d{6}$/);
    expect(submission.body.data.officialSubmissionStatus).toBe('READY_FOR_OFFICIAL_SUBMISSION');

    const tracked = await request(app)
      .get(`/api/reports/track?referenceId=${submission.body.data.referenceId}`);
    expect(tracked.status).toBe(200);
    expect(tracked.body.data.referenceId).toBe(submission.body.data.referenceId);
    expect(tracked.body.data.fullName).toBeUndefined();
    expect(tracked.body.data.phone).toBeUndefined();
  });

  it('rejects invalid public report contact details and concern values', async () => {
    const res = await request(app)
      .post('/api/reports/public')
      .send({
        fullName: 'Invalid Reporter',
        phone: '12345',
        email: 'not-an-email',
        state: 'Maharashtra',
        district: 'Pune',
        village: 'Mulshi',
        address: 'Near the community water tank',
        concerns: ['not_a_supported_concern'],
        description: 'There is a problem with the water supply.',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toContain('Enter a valid Indian mobile number.');
    expect(res.body.errors).toContain('Enter a valid email address.');
    expect(res.body.errors).toContain('Select valid concern types.');
  });

  it('Villager can submit a community problem report', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${villagerToken}`)
      .send({
        sourceId: createdSourceId,
        village: 'Devgarh',
        category: 'unusual_odor',
        description: 'Water has a strange sulfur smell when pumping this morning.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBeDefined();
    createdReportId = res.body.data._id;
  });

  it('Villager can fetch own reports via /api/reports/mine', async () => {
    const res = await request(app)
      .get('/api/reports/mine')
      .set('Authorization', `Bearer ${villagerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((r) => r._id === createdReportId)).toBe(true);
  });

  it('Health Worker can update report status and add public response', async () => {
    const res = await request(app)
      .patch(`/api/reports/${createdReportId}/status`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        status: 'under_review',
        publicResponse: 'Inspection scheduled for tomorrow morning.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(['under_review', 'UNDER_REVIEW']).toContain(res.body.data.status);
  });

  it('Health Worker can add internal review note', async () => {
    const res = await request(app)
      .post(`/api/reports/${createdReportId}/notes`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        note: 'Assigned to Devgarh field technician Mr. Rao.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('7. Safety Alerts & Notifications', () => {
  it('Admin can publish a safety advisory alert', async () => {
    const res = await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Devgarh Water Filter Cleaning Advisory',
        message: 'Precautionary maintenance on ridge catchment line.',
        severity: 'medium',
        affectedVillage: 'Devgarh',
        recommendedAction: 'Filter or boil tap water through Saturday.',
        publishImmediately: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('published');
    createdAlertId = res.body.data._id;
  });

  it('Authenticated user receives notifications', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${villagerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('8. Analytics Endpoints', () => {
  it('GET /api/analytics/summary returns accurate real metrics', async () => {
    const res = await request(app).get('/api/analytics/summary');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sources.total).toBeGreaterThan(0);
    expect(res.body.data.reports.total).toBeGreaterThan(0);
    expect(res.body.data.tests.total).toBeGreaterThan(0);
  });

  it('GET /api/analytics/reports returns status & category breakdown', async () => {
    const res = await request(app).get('/api/analytics/reports');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.byStatus)).toBe(true);
    expect(Array.isArray(res.body.data.byCategory)).toBe(true);
  });
});
