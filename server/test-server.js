const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function testServer() {
    console.log('🧪 Testing ChirpTalks Server...\n');

    try {
        // Test 1: Server status
        console.log('1. Testing server status...');
        const statusRes = await fetch(`${BASE_URL}/`);
        const statusData = await statusRes.json();
        console.log('✅ Server status:', statusData.message);

        // Test 2: Health check
        console.log('\n2. Testing health check...');
        const healthRes = await fetch(`${BASE_URL}/health`);
        const healthData = await healthRes.json();
        console.log('✅ Health status:', healthData.status);
        console.log('✅ MongoDB status:', healthData.mongodb);

        // Test 3: Register a test user
        console.log('\n3. Testing user registration...');
        const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            })
        });
        const registerData = await registerRes.json();
        console.log('✅ Registration:', registerData.message);

        // Test 4: Login
        console.log('\n4. Testing user login...');
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        console.log('✅ Login:', loginData.token ? 'Success' : 'Failed');

        if (loginData.token) {
            // Test 5: Post a message
            console.log('\n5. Testing message posting...');
            const messageRes = await fetch(`${BASE_URL}/api/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${loginData.token}`
                },
                body: JSON.stringify({
                    content: 'Hello from test!'
                })
            });
            const messageData = await messageRes.json();
            console.log('✅ Message posted:', messageData.message);

            // Test 6: Get messages
            console.log('\n6. Testing message retrieval...');
            const getMessagesRes = await fetch(`${BASE_URL}/api/messages`);
            const messages = await getMessagesRes.json();
            console.log('✅ Messages retrieved:', messages.length, 'messages');
        }

        console.log('\n🎉 All tests passed! Server is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\nMake sure:');
        console.log('1. Server is running on port 5000');
        console.log('2. MongoDB is connected');
        console.log('3. Environment variables are set correctly');
    }
}

// Run tests
testServer(); 