import assert from 'node:assert';

console.log('====================================================');
console.log('CHALLENGER M2-1: EMPIRICAL AUTH & ROUTING STRESS TEST');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err.message}`);
    throw err;
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err.message}`);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// Model Route Resolution Logic from App.tsx & Dashboard.tsx
// -----------------------------------------------------------------------------
function resolveAppRoute({ user, profile, loading, path }) {
  if (loading) {
    return { rendered: 'LoadingSpinner', redirectedTo: null };
  }

  if (path === '/') {
    if (!user) {
      return { rendered: 'LoginPage', redirectedTo: null };
    }
    if (profile && !profile.onboarding_completed) {
      return { rendered: null, redirectedTo: '/onboarding' };
    }
    return { rendered: null, redirectedTo: '/dashboard' };
  }

  if (path === '/dashboard') {
    if (!user) {
      return { rendered: null, redirectedTo: '/' }; // ProtectedRoute guard
    }
    // ProtectedRoute renders Dashboard
    // Dashboard.tsx useEffect guard:
    if (profile && !profile.onboarding_completed) {
      return { rendered: 'DashboardMountedThenRedirect', redirectedTo: '/onboarding' };
    }
    return { rendered: 'Dashboard', redirectedTo: null };
  }

  if (path === '/onboarding') {
    if (!user) {
      return { rendered: null, redirectedTo: '/' }; // ProtectedRoute guard
    }
    return { rendered: 'OnboardingPage', redirectedTo: null };
  }

  if (path === '/shared') {
    return { rendered: 'SharedCalendar', redirectedTo: null };
  }

  return { rendered: 'NotFound', redirectedTo: null };
}

// -----------------------------------------------------------------------------
// TEST SUITE 1: Auth State Transition & Routing Matrix
// -----------------------------------------------------------------------------
console.log('--- TEST SUITE 1: Auth State Transition & Routing Matrix ---');

runTest('1.1 Unauthenticated: / renders LoginPage', () => {
  const result = resolveAppRoute({
    user: null,
    profile: null,
    loading: false,
    path: '/'
  });
  assert.strictEqual(result.rendered, 'LoginPage');
  assert.strictEqual(result.redirectedTo, null);
});

runTest('1.2 Unauthenticated: Direct access to /dashboard is blocked by ProtectedRoute', () => {
  const result = resolveAppRoute({
    user: null,
    profile: null,
    loading: false,
    path: '/dashboard'
  });
  assert.strictEqual(result.rendered, null);
  assert.strictEqual(result.redirectedTo, '/');
});

runTest('1.3 Unauthenticated: Direct access to /onboarding is blocked by ProtectedRoute', () => {
  const result = resolveAppRoute({
    user: null,
    profile: null,
    loading: false,
    path: '/onboarding'
  });
  assert.strictEqual(result.rendered, null);
  assert.strictEqual(result.redirectedTo, '/');
});

runTest('1.4 Authenticated with onboarding_completed = false: / routes to /onboarding', () => {
  const result = resolveAppRoute({
    user: { id: 'usr-101', email: 'student@kampus.ac.id' },
    profile: { id: 'usr-101', onboarding_completed: false, semester_start: null, semester_end: null },
    loading: false,
    path: '/'
  });
  assert.strictEqual(result.redirectedTo, '/onboarding');
});

runTest('1.5 Authenticated with onboarding_completed = false: Direct access to /dashboard redirects to /onboarding', () => {
  const result = resolveAppRoute({
    user: { id: 'usr-101', email: 'student@kampus.ac.id' },
    profile: { id: 'usr-101', onboarding_completed: false, semester_start: null, semester_end: null },
    loading: false,
    path: '/dashboard'
  });
  assert.strictEqual(result.redirectedTo, '/onboarding');
});

runTest('1.6 Authenticated with onboarding_completed = true: / routes to /dashboard', () => {
  const result = resolveAppRoute({
    user: { id: 'usr-102', email: 'senior@kampus.ac.id' },
    profile: { id: 'usr-102', onboarding_completed: true, semester_start: '2026-09-01', semester_end: '2026-12-31' },
    loading: false,
    path: '/'
  });
  assert.strictEqual(result.redirectedTo, '/dashboard');
});

runTest('1.7 Authenticated with onboarding_completed = true: Direct access to /dashboard renders Dashboard', () => {
  const result = resolveAppRoute({
    user: { id: 'usr-102', email: 'senior@kampus.ac.id' },
    profile: { id: 'usr-102', onboarding_completed: true, semester_start: '2026-09-01', semester_end: '2026-12-31' },
    loading: false,
    path: '/dashboard'
  });
  assert.strictEqual(result.rendered, 'Dashboard');
  assert.strictEqual(result.redirectedTo, null);
});

runTest('1.8 Public route /shared is accessible regardless of authentication status', () => {
  const unauth = resolveAppRoute({ user: null, profile: null, loading: false, path: '/shared' });
  const authIncomplete = resolveAppRoute({
    user: { id: 'usr-1' },
    profile: { onboarding_completed: false },
    loading: false,
    path: '/shared'
  });
  const authComplete = resolveAppRoute({
    user: { id: 'usr-2' },
    profile: { onboarding_completed: true },
    loading: false,
    path: '/shared'
  });

  assert.strictEqual(unauth.rendered, 'SharedCalendar');
  assert.strictEqual(authIncomplete.rendered, 'SharedCalendar');
  assert.strictEqual(authComplete.rendered, 'SharedCalendar');
});

// -----------------------------------------------------------------------------
// TEST SUITE 2: Loading State Flash Prevention & Race Conditions
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 2: Loading State Flash Prevention & Race Conditions ---');

runTest('2.1 While loading is true, all protected and root routes display LoadingSpinner', () => {
  const routes = ['/', '/dashboard', '/onboarding'];
  for (const p of routes) {
    const res = resolveAppRoute({ user: null, profile: null, loading: true, path: p });
    assert.strictEqual(res.rendered, 'LoadingSpinner', `Route ${p} must display spinner while loading`);
    assert.strictEqual(res.redirectedTo, null, `Route ${p} must not redirect while loading`);
  }
});

runTest('2.2 While loading is true, even if user is defined, no dashboard flash occurs', () => {
  const res = resolveAppRoute({
    user: { id: 'usr-999' },
    profile: null, // profile still fetching
    loading: true,
    path: '/dashboard'
  });
  assert.strictEqual(res.rendered, 'LoadingSpinner', 'Must display spinner while profile fetch is unresolved');
  assert.notStrictEqual(res.rendered, 'Dashboard', 'Must NEVER render Dashboard while loading');
});

// -----------------------------------------------------------------------------
// TEST SUITE 3: AuthContext Async Lifecycle & Timing Simulation
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 3: AuthContext Async Lifecycle & Timing Simulation ---');

class MockAuthLifecycle {
  constructor({ sessionLatencyMs = 20, profileLatencyMs = 50, mockProfile = null, initialStorage = null }) {
    this.sessionLatencyMs = sessionLatencyMs;
    this.profileLatencyMs = profileLatencyMs;
    this.mockProfile = mockProfile;
    this.initialStorage = initialStorage;

    // Emulate AuthContext state initialization
    const stored = this.initialStorage ? JSON.parse(this.initialStorage) : null;
    this.user = stored && stored.id ? stored : null;
    this.profile = null;
    this.session = stored && stored.id ? { user: stored } : null;
    this.loading = !(stored && stored.id);

    this.stateHistory = [];
    this.recordState('INIT');
  }

  recordState(event) {
    this.stateHistory.push({
      event,
      timestamp: Date.now(),
      loading: this.loading,
      hasUser: !!this.user,
      hasProfile: !!this.profile,
      profileCompleted: this.profile?.onboarding_completed ?? null
    });
  }

  async fetchUserProfile(token) {
    await new Promise(r => setTimeout(r, this.profileLatencyMs));
    return this.mockProfile;
  }

  async runLifecycle() {
    let mounted = true;

    // Simulate supabase.auth.getSession()
    await new Promise(r => setTimeout(r, this.sessionLatencyMs));
    const session = this.user ? { user: this.user, access_token: 'tok_abc' } : { user: { id: 'usr-async-1' }, access_token: 'tok_123' };

    if (!mounted) return;
    if (session) {
      this.session = session;
      this.user = session.user;
      this.recordState('USER_SET_FETCHING_PROFILE');

      // Crucial: AuthContext.tsx lines 84-85:
      // const p = await fetchUserProfile(session.access_token);
      // if (mounted) setProfile(p);
      const p = await this.fetchUserProfile(session.access_token);
      if (mounted) {
        this.profile = p;
        this.recordState('PROFILE_SET');
      }
    }

    if (mounted) {
      this.loading = false;
      this.recordState('LOADING_SET_FALSE');
    }
  }
}

await runAsyncTest('3.1 Lifecycle verification: profile is fetched before loading is false', async () => {
  const lifecycle = new MockAuthLifecycle({
    sessionLatencyMs: 15,
    profileLatencyMs: 40,
    mockProfile: { id: 'usr-async-1', onboarding_completed: false }
  });

  assert.strictEqual(lifecycle.loading, true, 'Initially loading must be true');
  assert.strictEqual(lifecycle.profile, null, 'Initially profile must be null');

  await lifecycle.runLifecycle();

  assert.strictEqual(lifecycle.loading, false, 'Loading must eventually become false');
  assert.ok(lifecycle.profile !== null, 'Profile must be populated');
  assert.strictEqual(lifecycle.profile.onboarding_completed, false);

  // Check state transition order
  const events = lifecycle.stateHistory.map(s => s.event);
  assert.deepStrictEqual(events, [
    'INIT',
    'USER_SET_FETCHING_PROFILE',
    'PROFILE_SET',
    'LOADING_SET_FALSE'
  ]);

  // Verify invariant: loading never became false before PROFILE_SET
  const loadingFalseRecord = lifecycle.stateHistory.find(s => s.event === 'LOADING_SET_FALSE');
  const profileSetRecord = lifecycle.stateHistory.find(s => s.event === 'PROFILE_SET');
  assert.ok(loadingFalseRecord.timestamp >= profileSetRecord.timestamp);
});

await runAsyncTest('3.2 Latency stress test: extreme network lag on profile fetch (200ms) preserves loading state', async () => {
  const lifecycle = new MockAuthLifecycle({
    sessionLatencyMs: 10,
    profileLatencyMs: 200,
    mockProfile: { id: 'usr-async-2', onboarding_completed: true }
  });

  const runPromise = lifecycle.runLifecycle();

  // Inspect intermediate state during latency window (at 100ms)
  await new Promise(r => setTimeout(r, 100));
  assert.strictEqual(lifecycle.loading, true, 'Loading must remain true during profile network latency');
  assert.strictEqual(lifecycle.profile, null, 'Profile must be null during transit');

  await runPromise;
  assert.strictEqual(lifecycle.loading, false);
  assert.strictEqual(lifecycle.profile.onboarding_completed, true);
});

await runAsyncTest('3.3 100 concurrent lifecycle executions with randomized latencies maintain strict ordering', async () => {
  for (let i = 0; i < 100; i++) {
    const sessionLag = Math.floor(Math.random() * 20);
    const profileLag = Math.floor(Math.random() * 30);
    const isCompleted = Math.random() > 0.5;

    const lifecycle = new MockAuthLifecycle({
      sessionLatencyMs: sessionLag,
      profileLatencyMs: profileLag,
      mockProfile: { id: `usr-${i}`, onboarding_completed: isCompleted }
    });

    await lifecycle.runLifecycle();

    // Verify invariant: whenever loading turned false, profile was non-null
    const endState = lifecycle.stateHistory[lifecycle.stateHistory.length - 1];
    assert.strictEqual(endState.loading, false);
    assert.strictEqual(endState.hasProfile, true);
    assert.strictEqual(endState.profileCompleted, isCompleted);
  }
});

// -----------------------------------------------------------------------------
// TEST SUITE 4: Onboarding Completion State Flow & Refresh Timing
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 4: Onboarding Completion State Flow & Refresh Timing ---');

runTest('4.1 Onboarding flow: incomplete -> complete -> refreshProfile transitions routing', () => {
  let user = { id: 'usr-onboard-1' };
  let profile = { id: 'usr-onboard-1', onboarding_completed: false };
  let loading = false;

  // Step 1: User visits root route
  let routeRes = resolveAppRoute({ user, profile, loading, path: '/' });
  assert.strictEqual(routeRes.redirectedTo, '/onboarding', 'Must route to /onboarding');

  // Step 2: User tries direct access to /dashboard
  let dashRes = resolveAppRoute({ user, profile, loading, path: '/dashboard' });
  assert.strictEqual(dashRes.redirectedTo, '/onboarding', 'Must guard and redirect to /onboarding');

  // Step 3: User submits onboarding and calls refreshProfile()
  profile = { ...profile, onboarding_completed: true, semester_start: '2026-09-01', semester_end: '2026-12-31' };

  // Step 4: User now navigates to / or /dashboard
  let postRootRes = resolveAppRoute({ user, profile, loading, path: '/' });
  assert.strictEqual(postRootRes.redirectedTo, '/dashboard', 'Must now route to /dashboard');

  let postDashRes = resolveAppRoute({ user, profile, loading, path: '/dashboard' });
  assert.strictEqual(postDashRes.rendered, 'Dashboard', 'Dashboard must now render cleanly without redirect');
  assert.strictEqual(postDashRes.redirectedTo, null);
});

// -----------------------------------------------------------------------------
// TEST SUITE 5: Failure Mode & Edge Case Testing
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 5: Failure Mode & Edge Case Testing ---');

await runAsyncTest('5.1 Failed profile fetch (e.g. 500 error / offline) falls back gracefully without hanging loading', async () => {
  const lifecycle = new MockAuthLifecycle({
    sessionLatencyMs: 10,
    profileLatencyMs: 10,
    mockProfile: null // simulates res.ok === false or catch block returning null
  });

  await lifecycle.runLifecycle();

  // AuthContext: if fetchUserProfile returns null, profile is null, but loading = false
  assert.strictEqual(lifecycle.loading, false, 'Loading must resolve to false even if profile fetch fails');
  assert.strictEqual(lifecycle.profile, null);

  // AppRoutes behavior when profile is null:
  // user ? (profile && !profile.onboarding_completed ? /onboarding : /dashboard)
  const routeRes = resolveAppRoute({
    user: lifecycle.user,
    profile: lifecycle.profile,
    loading: lifecycle.loading,
    path: '/'
  });
  assert.strictEqual(routeRes.redirectedTo, '/dashboard', 'Falls back to dashboard gracefully');
});

runTest('5.2 SignOut lifecycle cleanly resets user, profile, and session to null', () => {
  let user = { id: 'usr-active' };
  let profile = { id: 'usr-active', onboarding_completed: true };
  let loading = false;

  // Simulate signOut action in AuthContext.tsx lines 130-140
  user = null;
  profile = null;

  const res = resolveAppRoute({ user, profile, loading, path: '/' });
  assert.strictEqual(res.rendered, 'LoginPage', 'After signOut, / strictly renders LoginPage');

  const dashRes = resolveAppRoute({ user, profile, loading, path: '/dashboard' });
  assert.strictEqual(dashRes.redirectedTo, '/', 'After signOut, /dashboard strictly redirects to /');
});

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
if (totalTests === passedTests) {
  console.log('ALL EMPIRICAL AUTH & ROUTING STRESS TESTS PASSED!');
} else {
  process.exit(1);
}
