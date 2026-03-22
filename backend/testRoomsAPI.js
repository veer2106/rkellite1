const axios = require('axios');

async function testRoomsAPI() {
    try {
        // First, login to get token
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'admin@cafedelicacy.com',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful, token received');

        // Test rooms endpoint
        console.log('\n2. Testing /api/rooms endpoint...');
        const roomsResponse = await axios.get('http://localhost:5001/api/rooms', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Rooms API working!');
        console.log(`   Found ${roomsResponse.data.count} rooms`);
        console.log(`   Room numbers: ${roomsResponse.data.data.map(r => r.roomNumber).join(', ')}`);

        // Test stats endpoint
        console.log('\n3. Testing /api/rooms/stats/overview endpoint...');
        const statsResponse = await axios.get('http://localhost:5001/api/rooms/stats/overview', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Stats API working!');
        console.log(`   Total Rooms: ${statsResponse.data.data.totalRooms}`);
        console.log(`   Available: ${statsResponse.data.data.availableRooms}`);
        console.log(`   Occupancy Rate: ${statsResponse.data.data.occupancyRate}%`);

        console.log('\n✨ All tests passed! The API is working correctly.');

    } catch (error) {
        console.error('\n❌ Error testing API:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message: ${error.response.data.message || error.response.data}`);
        } else {
            console.error(`   ${error.message}`);
        }
    }
}

testRoomsAPI();
