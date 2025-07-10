const fs = require('fs');

// Read the reorganized JSON data
const data = JSON.parse(fs.readFileSync('reorganized_school_data.json', 'utf8'));

// Function to convert numeric values to boolean
function convertValuesToBoolean(obj) {
  for (const [theme, gqData] of Object.entries(obj)) {
    for (const [gq, indicatorData] of Object.entries(gqData)) {
      for (const [indicator, schoolData] of Object.entries(indicatorData)) {
        for (const [school, value] of Object.entries(schoolData)) {
          if (value === 1) {
            schoolData[school] = false;
          } else if (value === 2) {
            schoolData[school] = true;
          }
        }
      }
    }
  }
  return obj;
}

// Convert the values
const convertedData = convertValuesToBoolean(data);

// Write the converted data back to the file
fs.writeFileSync('reorganized_school_data.json', JSON.stringify(convertedData, null, 2));

console.log('Successfully converted numeric values to boolean values:');
console.log('- Value 1 → false');
console.log('- Value 2 → true');
console.log('Updated file: reorganized_school_data.json'); 