
const DIRECTUS_URL = 'https://base.spotgp.com';
const EMAIL = 'YOUR_ADMIN_EMAIL';
const PASSWORD = 'YOUR_ADMIN_PASSWORD';

// R2 Config
const ACCOUNT_ID = 'YOUR_R2_ACCOUNT_ID';
const ACCESS_KEY = 'YOUR_R2_ACCESS_KEY';
const SECRET_KEY = 'YOUR_R2_SECRET_KEY';
const BUCKET = 'spotgp';

async function deploy() {
    try {
        console.log("Authenticating...");
        const loginRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error("Login failed");

        const { access_token } = loginData.data;
        console.log("Authenticated.");

        // 1. Create Flow
        const flowPayload = {
            name: "Saphira R2 Signer (Auto)",
            icon: "cloud_done",
            color: "#2EC551",
            status: "active",
            trigger: "webhook",
            options: { method: "POST", async: false } // Synchronous
        };

        console.log("Creating Flow...");
        const flowRes = await fetch(`${DIRECTUS_URL}/flows`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(flowPayload)
        });

        const flowData = await flowRes.json();
        if (flowData.errors) {
            console.error("Flow Creation Error:", JSON.stringify(flowData.errors));
            return;
        }
        const flowId = flowData.data.id;
        console.log("Flow ID:", flowId);

        // 2. The Script (Pure JS AWS V4)
        const scriptCode = `
            module.exports = function(data) {
                try {
                    const crypto = require('crypto');
                    
                    // --- CONFIG ---
                    const ACCESS_KEY = '${ACCESS_KEY}';
                    const SECRET_KEY = '${SECRET_KEY}';
                    const BUCKET = '${BUCKET}';
                    const ACCOUNT_ID = '${ACCOUNT_ID}';
                    const REGION = 'auto';
                    const EXPIRES = 300; 
                    
                    const payload = data.$trigger.body || {};
                    const fileName = payload.fileName;
                    
                    if (!fileName) throw new Error("Missing fileName");
                    
                    // Helper: HMAC-SHA256
                    const hmac = (key, string) => crypto.createHmac('sha256', key).update(string).digest();
                    const sha256 = (string) => crypto.createHash('sha256').update(string).digest('hex');
                    
                    // --- V4 SIGNING LOGIC ---
                    const now = new Date();
                    const amzDate = now.toISOString().replace(/[:-]|\\.\\d{3}/g, ''); 
                    const dateStamp = amzDate.slice(0, 8); 
                    
                    const objectKey = 'uploads/' + Date.now() + '-' + fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const host = \`\${BUCKET}.\${ACCOUNT_ID}.r2.cloudflarestorage.com\`;
                    
                    const endpoint = \`https://\${host}/\${objectKey}\`;
                    
                    const method = 'PUT';
                    const service = 's3';
                    const algorithm = 'AWS4-HMAC-SHA256';
                    
                    const canonicalUri = '/' + objectKey;
                    const credentialScope = \`\${dateStamp}/\${REGION}/\${service}/aws4_request\`;
                    
                    const queryParams = [
                        'X-Amz-Algorithm=' + algorithm,
                        'X-Amz-Credential=' + encodeURIComponent(ACCESS_KEY + '/' + credentialScope),
                        'X-Amz-Date=' + amzDate,
                        'X-Amz-Expires=' + EXPIRES,
                        'X-Amz-SignedHeaders=host'
                    ];
                    
                    const canonicalQueryString = queryParams.join('&');
                    const canonicalHeaders = 'host:' + host + '\\n';
                    const signedHeaders = 'host';
                    const payloadHash = 'UNSIGNED-PAYLOAD'; 
                    
                    const canonicalRequest = method + '\\n' +
                                           canonicalUri + '\\n' +
                                           canonicalQueryString + '\\n' +
                                           canonicalHeaders + '\\n' +
                                           signedHeaders + '\\n' +
                                           payloadHash;
                                           
                    const stringToSign = algorithm + '\\n' +
                                       amzDate + '\\n' +
                                       credentialScope + '\\n' +
                                       sha256(canonicalRequest);
                                       
                    // Signing Key
                    const kDate = hmac('AWS4' + SECRET_KEY, dateStamp);
                    const kRegion = hmac(kDate, REGION);
                    const kService = hmac(kRegion, service);
                    const kSigning = hmac(kService, 'aws4_request');
                    
                    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
                    
                    const finalUrl = \`https://\${host}\${canonicalUri}?\${canonicalQueryString}&X-Amz-Signature=\${signature}\`;
                    
                    return {
                        signedUrl: finalUrl,
                        key: objectKey
                    };
                    
                } catch(e) {
                    return { error: e.message, stack: e.stack };
                }
            }
        `;

        // 3. Add Operation
        console.log("Adding Operation...");
        const opPayload = {
            name: "Generate Signature",
            key: "sign_logic",
            flow: flowId,
            type: "exec",
            position_x: 1,
            position_y: 1,
            options: { code: scriptCode }
        };

        const opRes = await fetch(`${DIRECTUS_URL}/operations`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(opPayload)
        });

        const opData = await opRes.json();
        if (opData.errors) {
            console.error("Operation Error:", JSON.stringify(opData.errors));
            return;
        }
        const opId = opData.data.id;
        console.log("Operation Created:", opId);

        // 4. LINK Trigger -> Operation
        console.log("Linking Flow to Operation...");
        const linkRes = await fetch(`${DIRECTUS_URL}/flows/${flowId}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ operation: opId })
        });

        if (!linkRes.ok) {
            console.error("Link Error:", await linkRes.text());
            return;
        }

        console.log("✅ Flow Configured!");
        const webhookUrl = `${DIRECTUS_URL}/flows/trigger/${flowId}`;
        console.log(`Webhook URL: ${webhookUrl}`);

        // 5. Test
        console.log("Testing...");
        const testRes = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: "test-auto-deploy.jpg" })
        });

        const contentType = testRes.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const testData = await testRes.json();
            console.log("Test Result:", JSON.stringify(testData, null, 2));

            if (testData.signedUrl) {
                console.log("\n>>> SUCCESS! Use this Webhook URL in r2-storage.ts: <<<");
                console.log(webhookUrl);
            }
        } else {
            console.log("Test returned non-JSON:", await testRes.text());
        }

    } catch (e) {
        console.error("Script Error:", e);
    }
}

deploy();
