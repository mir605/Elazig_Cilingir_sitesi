#!/usr/bin/env node

/**
 * Simple Performance Check for MURAT OTO ANAHTAR
 */

const https = require('https');

async function checkPerformance() {
    console.log('🚀 Checking site performance...\n');
    
    const domain = 'www.elazigcilingir.net';
    const testUrls = [
        `https://${domain}`,
        `https://${domain}/css/style.css`,
        `https://${domain}/js/script.js`
    ];

    for (const url of testUrls) {
        try {
            const start = Date.now();
            const result = await makeRequest(url);
            const duration = Date.now() - start;
            
            console.log(`✅ ${url}`);
            console.log(`   Status: ${result.statusCode}`);
            console.log(`   Time: ${duration}ms`);
            console.log(`   Compression: ${result.headers['content-encoding'] || 'none'}`);
            console.log(`   Cache: ${result.headers['cache-control'] || 'none'}`);
            console.log('');
        } catch (error) {
            console.log(`❌ ${url} - Error: ${error.message}\n`);
        }
    }
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, { method: 'HEAD' }, (res) => {
            resolve({
                statusCode: res.statusCode,
                headers: res.headers
            });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('Timeout')));
        req.end();
    });
}

checkPerformance().catch(console.error);
