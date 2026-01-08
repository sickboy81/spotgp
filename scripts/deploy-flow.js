
const DIRECTUS_URL = 'https://base.spotgp.com';
const EMAIL = 'egeohub101@gmail.com';
const PASSWORD = '041052.11setemB';

async function deployFlow() {
    try {
        console.log('Authenticating...');
        // 1. Login
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginData));
        const token = loginData.data.access_token;

        console.log('Login OK. Creating Flow...');

        // 2. Create Flow
        const flowPayload = {
            name: "Test Saphira Signer",
            icon: "lock",
            color: "#6644FF",
            status: "active",
            trigger: "webhook",
            options: {
                method: "POST",
                async: false // Response required
            }
        };

        const flowRes = await fetch(`${DIRECTUS_URL}/flows`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(flowPayload)
        });

        const flowData = await flowRes.json();

        if (!flowRes.ok) {
            console.error('Flow creation failed:', JSON.stringify(flowData));
            // Check if it already exists?
            if (flowData.errors?.[0]?.code === 'RECORD_NOT_UNIQUE') {
                console.log("Flow might already exist, proceeding...");
                // In real logic we would fetch it, but for test just fail or manual check
                return;
            }
            return;
        }

        const flowId = flowData.data.id;
        console.log(`Flow created! ID: ${flowId}`);

        // 3. Add Script Operation
        // Simple script to test crypto availability
        const scriptCode = `
            module.exports = function(data) {
                try {
                    const crypto = require('crypto');
                    const hash = crypto.createHash('sha256').update('test').digest('hex');
                    return { 
                        msg: "Script ran successfully", 
                        hash: hash,
                        crypto_available: true
                    };
                } catch(e) {
                    return { error: e.message, crypto_available: false };
                }
            }
        `;

        const opPayload = {
            name: "Signer Logic",
            key: "signer_logic",
            flow: flowId,
            type: "exec", // "Run Script" type
            position_x: 1,
            position_y: 1,
            options: {
                code: scriptCode
            }
        };

        const opRes = await fetch(`${DIRECTUS_URL}/operations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(opPayload)
        });

        const opData = await opRes.json();
        if (!opRes.ok) {
            console.error('Operation creation failed:', JSON.stringify(opData));
        } else {
            console.log('Script Operation added!');
            console.log(`Webhook URL: ${DIRECTUS_URL}/flows/trigger/${flowId}`);

            // 4. Test Trigger
            console.log('Testing trigger...');
            // Wait a moment for registration
            await new Promise(r => setTimeout(r, 2000));

            const triggerRes = await fetch(`${DIRECTUS_URL}/flows/trigger/${flowId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test: "Hello" })
            });

            // Webhook triggers might return 204 or data depending on config
            // But we set async: false, so it should return the operation result (if set as response)
            // Wait, we didn't set the "Response Body" operation. 
            // By default async: false returns the payload of the last operation? Check docs.
            // Actually, usually you need a "Response" operation or it returns empty.

            if (triggerRes.status === 204) {
                console.log("Trigger returned 204 No Content (Expected if no response op). Check logs in Dashboard.");
            } else {
                const text = await triggerRes.text();
                console.log('Trigger Response Body:', text);
            }
        }
    } catch (e) {
        console.error("Script error:", e);
    }
}

deployFlow();
