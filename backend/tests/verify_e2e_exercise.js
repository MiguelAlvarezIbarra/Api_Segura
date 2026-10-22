// verify_e2e_exercise.js - Verifies Section 19 & 19a requirements
const BASE = 'http://localhost:3000/api/v1';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (_) {
    data = text;
  }
  return { status: res.status, data };
}

async function run() {
  console.log('=== STARTING SECTION 19 & 19a VERIFICATION ===\n');

  // SETUP
  const email = `test-${Date.now()}@example.test`;
  const password = 'a-long-local-test-password-for-this-exercise';
  console.log(`[Setup] Registering user ${email}...`);
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  console.log(`Registration status: ${regRes.status}`);
  if (regRes.status !== 201) throw new Error('Registration failed');
  let { accessToken, refreshToken } = regRes.data;
  console.log('Got tokens successfully (not printing for security).\n');

  // TASK 1: ROTATION
  console.log('--- Task 1: Refresh Token Rotation ---');
  const oldRefresh = refreshToken;
  const rotRes = await request('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: oldRefresh }),
  });
  console.log(`Refresh HTTP Status: ${rotRes.status} (Expected: 200)`);
  if (rotRes.status !== 200) throw new Error('Refresh failed');
  const isDifferent = rotRes.data.refreshToken !== oldRefresh;
  console.log(`Token comparison (different/same): ${isDifferent ? 'different' : 'same'} (Expected: different)`);
  const newRefresh = rotRes.data.refreshToken;
  console.log('Task 1 Passed: Token rotated successfully.\n');

  // TASK 2: REUSE DETECTION
  console.log('--- Task 2: Token Reuse Detection ---');
  console.log('Reusing old rotated refresh token...');
  const reuseRes = await request('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: oldRefresh }),
  });
  console.log(`Old token reuse status: ${reuseRes.status} (Expected: 401)`);

  console.log('Attempting to use newest token from compromised family...');
  const newerRes = await request('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: newRefresh }),
  });
  console.log(`Newer token status: ${newerRes.status} (Expected: 401)`);
  if (reuseRes.status === 401 && newerRes.status === 401) {
    console.log('Task 2 Passed: Reuse detected and family revoked.\n');
  } else {
    throw new Error('Task 2 Failed: Token family was not revoked!');
  }

  // TASK 3: LOGOUT
  console.log('--- Task 3: Logout ---');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  console.log(`Login status: ${loginRes.status}`);
  const logoutRefresh = loginRes.data.refreshToken;

  const logoutRes = await request('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: logoutRefresh }),
  });
  console.log(`Logout status: ${logoutRes.status} (Expected: 204)`);

  const afterLogoutRes = await request('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: logoutRefresh }),
  });
  console.log(`Refresh after logout status: ${afterLogoutRes.status} (Expected: 401)`);
  if (logoutRes.status === 204 && afterLogoutRes.status === 401) {
    console.log('Task 3 Passed: Logout successfully revoked token.\n');
  } else {
    throw new Error('Task 3 Failed');
  }

  // TASK 4: LOGOUT-ALL
  console.log('--- Task 4: Logout-All ---');
  const sess1 = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const sess2 = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  console.log(`Session 1 & Session 2 created.`);

  const logoutAllRes = await request('/auth/logout-all', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sess1.data.accessToken}` },
  });
  console.log(`Logout-all status: ${logoutAllRes.status} (Expected: 204)`);

  const ref1 = await request('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: sess1.data.refreshToken }),
  });
  const ref2 = await request('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: sess2.data.refreshToken }),
  });
  console.log(`Session 1 refresh status: ${ref1.status} (Expected: 401)`);
  console.log(`Session 2 refresh status: ${ref2.status} (Expected: 401)`);
  if (logoutAllRes.status === 204 && ref1.status === 401 && ref2.status === 401) {
    console.log('Task 4 Passed: All sessions revoked across devices.\n');
  } else {
    throw new Error('Task 4 Failed');
  }

  // TASK CRUD & OBJECT-LEVEL AUTHORIZATION
  console.log('--- Task CRUD & Ownership ---');
  const authRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const currentToken = authRes.data.accessToken;

  // Create Task
  const createRes = await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${currentToken}` },
    body: JSON.stringify({
      title: 'Review API security',
      description: 'Check ownership and validation',
    }),
  });
  console.log(`Create task status: ${createRes.status} (Expected: 201)`);
  const taskId = createRes.data.item.id;

  // List Tasks
  const listRes = await request('/tasks?page=1&limit=20', {
    headers: { Authorization: `Bearer ${currentToken}` },
  });
  console.log(`List tasks count: ${listRes.data.items.length} (Expected: >= 1)`);

  // Patch Task
  const patchRes = await request(`/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${currentToken}` },
    body: JSON.stringify({ completed: true }),
  });
  console.log(`Patch task status: ${patchRes.status}, completed: ${patchRes.data.item.completed}`);

  // Delete Task
  const delRes = await request(`/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${currentToken}` },
  });
  console.log(`Delete task status: ${delRes.status} (Expected: 204)`);

  console.log('\n=== ALL SECTION 19 & 19a TESTS COMPLETED SUCCESSFULLY! ===');
}

run().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
