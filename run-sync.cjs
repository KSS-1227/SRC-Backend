#!/usr/bin/env node

/**
 * Run Content Sync Script
 * This script properly loads environment variables from the backend directory
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

// Import the sync content job
const contentSyncJob = require('./backend/jobs/syncContent');

// Run the sync job
async function runSync() {
  console.log('🔄 Starting content sync...');
  try {
    await contentSyncJob.run();
    console.log('✅ Content sync completed successfully');
  } catch (error) {
    console.error('❌ Content sync failed:', error.message);
    process.exit(1);
  }
}

runSync();