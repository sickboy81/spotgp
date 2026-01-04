// Complete end-to-end test simulating frontend behavior
const URL = 'https://base.spotgp.com';

async function testFullFlow() {
    console.log('='.repeat(60));
    console.log('🧪 COMPLETE AUTH FLOW TEST');
    console.log('='.repeat(60));

    // 1. Test unauthenticated request (should fail)
    console.log('\n📋 Step 1: Unauthenticated request (should be 401)');
    const noAuthRes = await fetch(`${URL}/users/me`);
    console.log(`  /users/me (no auth): ${noAuthRes.status} ${noAuthRes.status === 401 ? '✅ Expected' : '⚠️ Unexpected'}`);

    // 2. Login as test user
    console.log('\n📋 Step 2: Login as joanamaria@jm.com');
    const loginRes = await fetch(`${URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'joanamaria@jm.com', password: 'Joanamaria1' })
    });

    if (!loginRes.ok) {
        console.log('  ❌ Login failed!');
        return;
    }

    const { data: { access_token } } = await loginRes.json();
    console.log(`  ✅ Login successful! Token: ${access_token.substring(0, 20)}...`);

    // 3. Test authenticated requests
    const authHeaders = { 'Authorization': `Bearer ${access_token}` };

    console.log('\n📋 Step 3: Authenticated requests');

    const tests = [
        { name: '/users/me', url: `${URL}/users/me?fields=*,role.name` },
        { name: 'profiles', url: `${URL}/items/profiles?limit=1` },
        { name: 'profiles (filter by user)', url: `${URL}/items/profiles?filter[user][_eq]=26438ac6-9d0e-4050-8a93-3f5906d5ca32` },
        { name: 'media', url: `${URL}/items/media?limit=1` },
        { name: 'conversations', url: `${URL}/items/conversations?limit=1` },
        { name: 'notifications', url: `${URL}/items/notifications?limit=1` },
    ];

    let allPassed = true;
    for (const t of tests) {
        const res = await fetch(t.url, { headers: authHeaders });
        const ok = res.ok;
        allPassed = allPassed && ok;
        console.log(`  ${ok ? '✅' : '❌'} ${t.name}: ${res.status}`);
        if (!ok) {
            const err = await res.json().catch(() => ({}));
            console.log(`      Error: ${err.errors?.[0]?.message || 'Unknown'}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    if (allPassed) {
        console.log('🎉 ALL TESTS PASSED!');
        console.log('='.repeat(60));
        console.log('\nThe backend is working correctly.');
        console.log('If you still see 401 errors in the browser:');
        console.log('1. Press F12 → Application → Storage → Clear site data');
        console.log('2. Refresh the page (F5)');
        console.log('3. Login again with: joanamaria@jm.com / Joanamaria1');
    } else {
        console.log('❌ SOME TESTS FAILED');
        console.log('='.repeat(60));
    }
}

testFullFlow().catch(console.error);
