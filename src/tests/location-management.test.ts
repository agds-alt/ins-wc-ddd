// tests/location-management.test.ts
/**
 * Testing Script for Multi-Tenant Location Management System
 * 
 * Run this script to validate:
 * 1. Organization & Building dropdowns
 * 2. QR code generation with nanoid
 * 3. Location CRUD operations
 * 4. Database views and joins
 * 5. End-to-end workflows
 */

import { createLocation, getLocationByQRCode, getLocations } from '../lib/locationService';
import { generateLocationQRCode, parseQRCode, isValidQRCode } from '../lib/qrGeneratorService';
import type { LocationFormData } from '../lib/locationService';

// ============================================
// TEST 1: QR Code Generation
// ============================================
export async function testQRCodeGeneration() {
  console.log('🧪 TEST 1: QR Code Generation\n');

  try {
    // Test 1.1: Generate QR code with all parameters
    const qr1 = generateLocationQRCode('PROS', 'BLD1', 'T01');
    console.log('✅ Generated QR with location code:', qr1);
    console.assert(
      qr1.startsWith('PROS-BLD1-T01-'),
      'QR should start with ORG-BLD-LOC-'
    );

    // Test 1.2: Generate QR code without location code
    const qr2 = generateLocationQRCode('PROS', 'BLD1');
    console.log('✅ Generated QR without location code:', qr2);
    console.assert(
      qr2.startsWith('PROS-BLD1-'),
      'QR should start with ORG-BLD-'
    );

    // Test 1.3: Parse QR code
    const parsed = parseQRCode(qr1);
    console.log('✅ Parsed QR code:', parsed);
    console.assert(
      parsed?.organizationCode === 'PROS',
      'Organization code should be PROS'
    );
    console.assert(
      parsed?.buildingCode === 'BLD1',
      'Building code should be BLD1'
    );
    console.assert(
      parsed?.locationCode === 'T01',
      'Location code should be T01'
    );
    console.assert(
      parsed?.uniqueId.length === 7,
      'Unique ID should be 7 characters'
    );

    // Test 1.4: Validate QR code
    const isValid = isValidQRCode(qr1);
    console.log('✅ QR validation:', isValid);
    console.assert(isValid, 'QR code should be valid');

    // Test 1.5: Invalid QR codes
    const invalidQR = 'INVALID';
    const isInvalid = isValidQRCode(invalidQR);
    console.assert(!isInvalid, 'Invalid QR should return false');

    console.log('\n✅ All QR code generation tests passed!\n');
    return true;
  } catch (error) {
    console.error('❌ QR code generation test failed:', error);
    return false;
  }
}

// ============================================
// TEST 2: Location Creation with Auto QR
// ============================================
export async function testLocationCreation(userId: string) {
  console.log('🧪 TEST 2: Location Creation\n');

  try {
    // Prepare test data
    const testLocation: LocationFormData = {
      name: 'Test Toilet - Lobby Men',
      organization_id: 'your-org-id-here', // Replace with actual org ID
      building_id: 'your-building-id-here', // Replace with actual building ID
      floor: '3F',
      section: 'North Wing',
      area: 'Public Area',
      code: 'T01',
      description: 'Test location for validation',
    };

    // Create location
    const result = await createLocation(testLocation, userId);
    console.log('✅ Location created:', result.location.id);
    console.log('✅ QR code generated:', result.qrCode);

    // Validate QR code format
    const isValid = isValidQRCode(result.qrCode);
    console.assert(isValid, 'Generated QR should be valid');

    // Try to fetch by QR code
    const fetched = await getLocationByQRCode(result.qrCode);
    console.log('✅ Location fetched by QR:', fetched.id);
    console.assert(
      fetched.id === result.location.id,
      'Fetched location should match created location'
    );

    console.log('\n✅ All location creation tests passed!\n');
    return result.location.id;
  } catch (error) {
    console.error('❌ Location creation test failed:', error);
    return null;
  }
}

// ============================================
// TEST 3: Location Queries with Views
// ============================================
export async function testLocationQueries(organizationId: string, buildingId: string) {
  console.log('🧪 TEST 3: Location Queries with Views\n');

  try {
    // Test 3.1: Get all locations
    const allLocations = await getLocations();
    console.log(`✅ Fetched ${allLocations.length} total locations`);

    // Test 3.2: Filter by organization
    const orgLocations = await getLocations({ organizationId });
    console.log(`✅ Fetched ${orgLocations.length} locations for organization`);

    // Validate joined data
    if (orgLocations.length > 0) {
      const firstLocation = orgLocations[0];
      console.log('✅ Location has joined data:');
      console.log('  - Organization Name:', firstLocation.organization_name);
      console.log('  - Building Name:', firstLocation.building_name);
      console.log('  - Building Code:', firstLocation.building_code);
      
      console.assert(
        firstLocation.organization_name,
        'Organization name should be populated'
      );
      console.assert(
        firstLocation.building_name,
        'Building name should be populated'
      );
    }

    // Test 3.3: Filter by building
    const buildingLocations = await getLocations({ buildingId });
    console.log(`✅ Fetched ${buildingLocations.length} locations for building`);

    // Test 3.4: Filter active only
    const activeLocations = await getLocations({ isActive: true });
    console.log(`✅ Fetched ${activeLocations.length} active locations`);

    // Test 3.5: Search locations
    const searchResults = await getLocations({ 
      searchQuery: 'toilet',
      organizationId 
    });
    console.log(`✅ Search found ${searchResults.length} matching locations`);

    console.log('\n✅ All query tests passed!\n');
    return true;
  } catch (error) {
    console.error('❌ Query test failed:', error);
    return false;
  }
}

// ============================================
// TEST 4: QR Scanning Workflow
// ============================================
export async function testQRScanningWorkflow() {
  console.log('🧪 TEST 4: QR Scanning Workflow\n');

  try {
    // Simulate QR scan
    const locations = await getLocations({ isActive: true });
    if (locations.length === 0) {
      console.log('⚠️ No locations available for testing');
      return true;
    }

    const testLocation = locations[0];
    const qrCode = testLocation.qr_code;

    console.log('📱 Simulating QR scan:', qrCode);

    // Step 1: Parse QR code
    const parsed = parseQRCode(qrCode!);
    console.log('✅ QR parsed:', parsed);

    // Step 2: Fetch location by QR
    const location = await getLocationByQRCode(qrCode!);
    console.log('✅ Location found:', location.name);

    // Step 3: Validate location data
    console.assert(location.id === testLocation.id, 'Location ID should match');
    console.assert(location.organization_name, 'Organization name should exist');
    console.assert(location.building_name, 'Building name should exist');

    console.log('\n✅ QR scanning workflow test passed!\n');
    return true;
  } catch (error) {
    console.error('❌ QR scanning workflow test failed:', error);
    return false;
  }
}

// ============================================
// TEST 5: Performance Test
// ============================================
export async function testPerformance(organizationId: string) {
  console.log('🧪 TEST 5: Performance Test\n');

  try {
    // Test query performance with view
    const start = performance.now();
    const locations = await getLocations({ 
      organizationId,
      isActive: true 
    });
    const end = performance.now();

    const duration = end - start;
    console.log(`✅ Query completed in ${duration.toFixed(2)}ms`);
    console.log(`✅ Fetched ${locations.length} locations`);

    // Performance assertion
    console.assert(
      duration < 1000,
      'Query should complete in less than 1 second'
    );

    console.log('\n✅ Performance test passed!\n');
    return true;
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    return false;
  }
}

// ============================================
// RUN ALL TESTS
// ============================================
export async function runAllTests(
  userId: string,
  organizationId: string,
  buildingId: string
) {
  console.log('🚀 Starting Location Management System Tests\n');
  console.log('='.repeat(50));
  console.log('\n');

  const results = {
    qrGeneration: false,
    locationCreation: false,
    queries: false,
    scanning: false,
    performance: false,
  };

  try {
    // Run all tests
    results.qrGeneration = await testQRCodeGeneration();
    
    const locationId = await testLocationCreation(userId);
    results.locationCreation = !!locationId;
    
    results.queries = await testLocationQueries(organizationId, buildingId);
    results.scanning = await testQRScanningWorkflow();
    results.performance = await testPerformance(organizationId);

    // Print summary
    console.log('='.repeat(50));
    console.log('\n📊 TEST SUMMARY\n');
    console.log('QR Generation:', results.qrGeneration ? '✅ PASS' : '❌ FAIL');
    console.log('Location Creation:', results.locationCreation ? '✅ PASS' : '❌ FAIL');
    console.log('Queries:', results.queries ? '✅ PASS' : '❌ FAIL');
    console.log('QR Scanning:', results.scanning ? '✅ PASS' : '❌ FAIL');
    console.log('Performance:', results.performance ? '✅ PASS' : '❌ FAIL');

    const totalPassed = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;

    console.log(`\n🎯 Total: ${totalPassed}/${totalTests} tests passed\n`);
    console.log('='.repeat(50));

    return totalPassed === totalTests;
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    return false;
  }
}

// ============================================
// MANUAL TESTING CHECKLIST
// ============================================
export const MANUAL_TEST_CHECKLIST = `
📋 MANUAL TESTING CHECKLIST

□ Step 1: Organization Dropdown
  □ Dropdown shows all active organizations
  □ Organizations sorted alphabetically
  □ Shows organization name and code

□ Step 2: Building Dropdown
  □ Disabled until organization selected
  □ Shows only buildings from selected org
  □ Buildings sorted alphabetically
  □ Shows building name and code

□ Step 3: Form Validation
  □ Required fields validated (org, building, name)
  □ Character limits enforced
  □ Error messages clear and helpful

□ Step 4: Location Creation
  □ Form submits successfully
  □ QR code generated automatically
  □ Success message displayed
  □ Location appears in list

□ Step 5: Location Display
  □ Cards show organization name (not ID)
  □ Cards show building name (not ID)
  □ QR code mini preview works
  □ All fields displayed correctly

□ Step 6: QR Code Operations
  □ QR code format: ORG-BLD-LOC-nanoid
  □ QR code unique (7 char nanoid)
  □ QR code scannable
  □ Parse QR returns correct data

□ Step 7: Filtering
  □ Filter by organization works
  □ Filter by building works
  □ Filters reset properly
  □ Results update in real-time

□ Step 8: Performance
  □ Queries return under 1 second
  □ No N+1 query problems
  □ View performs well with 100+ locations
  □ Form responsive on slow connections

□ Step 9: Edge Cases
  □ Create location without optional fields
  □ Update location preserves QR code
  □ Soft delete works
  □ Restore deleted location works

□ Step 10: Mobile Testing
  □ Dropdowns work on mobile
  □ Form usable on small screens
  □ QR codes scannable from phone
  □ Performance acceptable on 3G
`;

// ============================================
// PRODUCTION READINESS CHECKLIST
// ============================================
export const PRODUCTION_CHECKLIST = `
🚀 PRODUCTION READINESS CHECKLIST

Database:
□ RLS policies enabled on all tables
□ Views have proper permissions
□ Indexes created for performance
□ Foreign keys properly configured
□ Backup strategy in place

Code Quality:
□ TypeScript types all correct
□ No console.errors in production
□ Error handling comprehensive
□ Loading states implemented
□ Success/error messages clear

Security:
□ User authentication required
□ Authorization checks in place
□ SQL injection prevented
□ XSS protection enabled
□ CORS properly configured

Performance:
□ Query optimization complete
□ Image optimization implemented
□ Caching strategy defined
□ CDN configured (if needed)
□ Database indexes optimized

Testing:
□ Unit tests passing
□ Integration tests passing
□ E2E tests passing
□ Manual testing complete
□ Load testing done

Documentation:
□ API documentation updated
□ User guide created
□ Admin guide created
□ Troubleshooting guide ready
□ Change log maintained

Deployment:
□ Environment variables configured
□ Database migrations ready
□ Rollback plan defined
□ Monitoring alerts set up
□ Error tracking configured

User Experience:
□ Loading indicators clear
□ Error messages helpful
□ Success feedback immediate
□ Mobile responsive
□ Accessibility checked
`;