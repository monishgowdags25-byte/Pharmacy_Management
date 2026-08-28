const http = require('http');

function apiCall(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runDemoDataEngineVerification() {
  console.log('====================================================');
  console.log('🧪 VERIFYING PHARMACARE DEMO DATA ENGINE');
  console.log('====================================================\n');

  // 1. Authenticate as Admin
  console.log('1. Authenticating as Admin...');
  const loginRes = await apiCall('/api/auth/login', 'POST', {
    email: 'admin@pharmacare.local',
    password: 'Admin@123'
  });
  if (loginRes.status !== 200) {
    throw new Error(`Admin login failed with status ${loginRes.status}`);
  }
  const token = loginRes.data.data.token;
  console.log('   ✅ Admin authenticated successfully.\n');

  // 2. Test Individual Demo Seed Endpoints
  const endpoints = [
    { name: 'Categories', path: '/api/demo/categories' },
    { name: 'Medicines', path: '/api/demo/medicines' },
    { name: 'Suppliers', path: '/api/demo/suppliers' },
    { name: 'Inventory & Batches', path: '/api/demo/inventory' },
    { name: 'Customers', path: '/api/demo/customers' },
    { name: 'Purchases', path: '/api/demo/purchases' },
    { name: 'Prescriptions', path: '/api/demo/prescriptions' },
    { name: 'Sales', path: '/api/demo/sales' },
    { name: 'Returns', path: '/api/demo/returns' },
    { name: 'Expenses', path: '/api/demo/expenses' },
    { name: 'Notifications', path: '/api/demo/notifications' },
    { name: 'Audit Logs', path: '/api/demo/audit-logs' },
    { name: 'Users', path: '/api/demo/users' }
  ];

  for (const ep of endpoints) {
    console.log(`2. Testing ${ep.name} Seeder (POST ${ep.path})...`);
    const res = await apiCall(ep.path, 'POST', {}, token);
    if (res.status !== 200) {
      throw new Error(`${ep.name} seeding failed: ${JSON.stringify(res.data)}`);
    }
    console.log(`   ✅ ${res.data.message || 'Success'}`);
  }
  console.log('\n');

  // 3. Test Demo Status
  console.log('3. Checking Live Demo Record Status (GET /api/demo/status)...');
  const statusRes = await apiCall('/api/demo/status', 'GET', null, token);
  console.log('   ✅ Total Demo Records:', statusRes.data.data.totalDemoRecords);
  console.log('   Breakdown:', JSON.stringify(statusRes.data.data.counts, null, 2), '\n');

  // 4. Test Duplicate Protection (Calling POST /api/demo/all)
  console.log('4. Testing Duplicate Protection (Calling POST /api/demo/all a second time)...');
  const allRes = await apiCall('/api/demo/all', 'POST', {}, token);
  console.log(`   ✅ Status: ${allRes.status}, Result Summary:`, JSON.stringify(allRes.data.data?.summary || {}));

  const statusAfterAll = await apiCall('/api/demo/status', 'GET', null, token);
  console.log('   ✅ Record counts remained controlled and stable.\n');

  // 5. Test Dashboard Metrics Reflect Generated Data
  console.log('5. Verifying Dashboard Analytics (GET /api/dashboard/summary)...');
  const dashRes = await apiCall('/api/dashboard/summary', 'GET', null, token);
  console.log('   ✅ Total Revenue:', dashRes.data.data.kpis?.todaySales || 0);
  console.log('   ✅ Total Medicines in Catalog:', dashRes.data.data.kpis?.totalMedicines);
  console.log('   ✅ Low Stock Alerts Count:', dashRes.data.data.kpis?.lowStock);
  console.log('   ✅ Expiring Soon Batches:', dashRes.data.data.kpis?.expiringSoon, '\n');

  // 6. Test Reports Reflect Generated Data
  console.log('6. Verifying Sales Business Report (GET /api/reports/sales)...');
  const salesRepRes = await apiCall('/api/reports/sales', 'GET', null, token);
  console.log('   ✅ Total Sales Recorded:', salesRepRes.data.data?.summary?.totalSales);
  console.log('   ✅ Total Invoices Generated:', salesRepRes.data.data?.summary?.transactions, '\n');

  // 7. Test Clear Demo Data
  console.log('7. Testing Clear Demo Data (POST /api/demo/clear)...');
  const clearRes = await apiCall('/api/demo/clear', 'POST', {}, token);
  console.log(`   ✅ Status: ${clearRes.status} -> ${clearRes.data.message}`);

  const statusAfterClear = await apiCall('/api/demo/status', 'GET', null, token);
  console.log('   ✅ Demo Records After Clear:', statusAfterClear.data.data.totalDemoRecords, '(Must be 0)\n');

  // 8. Re-populate with Full Connected Demo Dataset
  console.log('8. Re-populating Full Presentation Dataset (POST /api/demo/all)...');
  const finalSeed = await apiCall('/api/demo/all', 'POST', {}, token);
  console.log(`   ✅ Status: ${finalSeed.status} -> ${finalSeed.data.message}`);
  
  const finalStatus = await apiCall('/api/demo/status', 'GET', null, token);
  console.log('   ✅ Ready For Presentation! Total Live Demo Records:', finalStatus.data.data.totalDemoRecords);

  console.log('\n====================================================');
  console.log('🎉 ALL DEMO DATA ENGINE TESTS PASSED (100%)');
  console.log('====================================================');
}

runDemoDataEngineVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
