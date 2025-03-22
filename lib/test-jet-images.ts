/**
 * Test file for jet image utilities
 */

import { getJetImagePaths, getPrimaryJetImage } from './utils/jet-images';

console.log('Testing jet image utils...');

// Test for a known manufacturer and model
console.log('Gulfstream G650 images:', getJetImagePaths('Gulfstream', 'G650'));

// Test for a known manufacturer but unknown model
console.log('Gulfstream Unknown model images:', getJetImagePaths('Gulfstream', 'Unknown'));

// Test for an unknown manufacturer
console.log('Unknown manufacturer images:', getJetImagePaths('Unknown', 'Unknown'));

console.log('Tests completed.'); 