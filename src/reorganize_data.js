const fs = require('fs');

// Read the original JSON data
const data = JSON.parse(fs.readFileSync('../school_theme_question.json', 'utf8'));

// Reorganize data into the new structure
function reorganizeData(originalData) {
  const reorganizedData = {
    "Conditions": {},
    "Instruction": {},
    "Support": {}
  };
  
  // Process each school
  for (const [schoolName, themes] of Object.entries(originalData)) {
    for (const [theme, questions] of Object.entries(themes)) {
      for (const [gq, indicators] of Object.entries(questions)) {
        for (const indicator of indicators) {
          const keyIndicator = indicator["Key Indicator"];
          const response = indicator["Value"];
          
          // Initialize structure if it doesn't exist
          if (!reorganizedData[theme][gq]) {
            reorganizedData[theme][gq] = {};
          }
          if (!reorganizedData[theme][gq][keyIndicator]) {
            reorganizedData[theme][gq][keyIndicator] = {};
          }
          
          // Add school response
          reorganizedData[theme][gq][keyIndicator][schoolName] = response;
        }
      }
    }
  }
  
  return reorganizedData;
}

// Reorganize the data
const reorganizedData = reorganizeData(data);

// Write the reorganized data to a new file
fs.writeFileSync('reorganized_school_data.json', JSON.stringify(reorganizedData, null, 2));

console.log('Successfully reorganized data into new structure:');
console.log('Theme > Guiding Question > Key Indicator > Schools with responses');
console.log('File saved as: reorganized_school_data.json');

// Show a sample of the structure
console.log('\nSample structure:');
const sampleTheme = Object.keys(reorganizedData)[0];
const sampleGQ = Object.keys(reorganizedData[sampleTheme])[0];
const sampleIndicator = Object.keys(reorganizedData[sampleTheme][sampleGQ])[0];

console.log(`${sampleTheme}:`);
console.log(`  ${sampleGQ}:`);
console.log(`    ${sampleIndicator}:`);
console.log(`      ${Object.keys(reorganizedData[sampleTheme][sampleGQ][sampleIndicator])[0]}: ${reorganizedData[sampleTheme][sampleGQ][sampleIndicator][Object.keys(reorganizedData[sampleTheme][sampleGQ][sampleIndicator])[0]]}`); 