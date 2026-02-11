/**
 * Generate SRI Hashes for CDN Resources
 * This script generates Subresource Integrity hashes for external resources
 * 
 * Usage: node generate-sri.js
 */

const crypto = require('crypto');
const https = require('https');

// CDN resources to generate SRI for
const resources = [
  {
    name: 'Ionic CSS',
    url: 'https://cdn.jsdelivr.net/npm/@ionic/core/css/ionic.bundle.css',
    type: 'css'
  },
  {
    name: 'Chart.js',
    url: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
    type: 'js'
  },
  {
    name: 'Ionic ESM',
    url: 'https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.esm.js',
    type: 'js'
  },
  {
    name: 'Ionic NoModule',
    url: 'https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.js',
    type: 'js'
  }
];

/**
 * Fetch resource and generate SRI hash
 */
function generateSRI(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to fetch ${url}: ${response.statusCode}`));
        return;
      }

      const hash = crypto.createHash('sha384');
      
      response.on('data', (chunk) => {
        hash.update(chunk);
      });

      response.on('end', () => {
        const digest = hash.digest('base64');
        resolve(`sha384-${digest}`);
      });

      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Generate SRI for all resources
 */
async function generateAllSRI() {
  console.log('Generating SRI hashes for CDN resources...\n');

  for (const resource of resources) {
    try {
      console.log(`Fetching: ${resource.name}`);
      console.log(`URL: ${resource.url}`);
      
      const sri = await generateSRI(resource.url);
      
      console.log(`SRI: ${sri}`);
      
      // Generate HTML snippet
      if (resource.type === 'css') {
        console.log(`\nHTML:\n<link rel="stylesheet" href="${resource.url}"\n      integrity="${sri}"\n      crossorigin="anonymous"/>\n`);
      } else {
        console.log(`\nHTML:\n<script src="${resource.url}"\n        integrity="${sri}"\n        crossorigin="anonymous"></script>\n`);
      }
      
      console.log('---\n');
    } catch (error) {
      console.error(`Error generating SRI for ${resource.name}:`, error.message);
    }
  }
}

// Run
generateAllSRI().catch(console.error);

