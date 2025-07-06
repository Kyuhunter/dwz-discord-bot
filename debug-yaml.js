const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

console.log('Testing YAML loading...');

const enPath = path.join(__dirname, 'translations/en.yaml');
const dePath = path.join(__dirname, 'translations/de.yaml');

console.log('Paths:');
console.log('EN:', enPath);
console.log('DE:', dePath);

console.log('\nFile existence:');
console.log('EN exists:', fs.existsSync(enPath));
console.log('DE exists:', fs.existsSync(dePath));

if (fs.existsSync(enPath)) {
  console.log('\nReading English file...');
  const enContent = fs.readFileSync(enPath, 'utf8');
  console.log('Content length:', enContent.length);
  console.log('First 100 chars:', JSON.stringify(enContent.substring(0, 100)));
  
  console.log('\nParsing with yaml.load...');
  try {
    const parsed = yaml.load(enContent);
    console.log('Type of parsed:', typeof parsed);
    console.log('Is object:', typeof parsed === 'object');
    console.log('Is null:', parsed === null);
    console.log('Keys:', parsed ? Object.keys(parsed) : 'No keys');
    console.log('Has commands:', parsed && 'commands' in parsed);
  } catch (error) {
    console.log('Error:', error.message);
  }
}

if (fs.existsSync(dePath)) {
  console.log('\nReading German file...');
  const deContent = fs.readFileSync(dePath, 'utf8');
  console.log('Content length:', deContent.length);
  
  console.log('Parsing with yaml.load...');
  try {
    const parsed = yaml.load(deContent);
    console.log('Type of parsed:', typeof parsed);
    console.log('Has commands:', parsed && 'commands' in parsed);
  } catch (error) {
    console.log('Error:', error.message);
  }
}
