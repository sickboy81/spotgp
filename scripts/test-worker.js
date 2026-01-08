
const WORKER_URL = 'https://saphira-signer.egeohub101.workers.dev';

async function testWorker() {
    try {
        console.log(`Pinging ${WORKER_URL}...`);
        const res = await fetch(WORKER_URL);
        const text = await res.text();
        console.log('Response:', text);

        if (res.ok && text.includes('Saphira Signer')) {
            console.log('✅ Worker is UP and Running!');

            // Test Sign (Mock)
            console.log('Testing Sign endpoint...');
            const signRes = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: 'test.jpg', contentType: 'image/jpeg' })
            });
            const signData = await signRes.json();
            console.log('Sign Data:', signData);
        } else {
            console.log('❌ Worker response unexpected.');
        }

    } catch (e) {
        console.error('❌ Connection failed:', e.message);
    }
}

testWorker();
