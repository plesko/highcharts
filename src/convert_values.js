const fs = require('fs');

// Read the original JSON data
const data = JSON.parse(fs.readFileSync('school_theme_question_copy.json', 'utf8'));

// Function to convert numeric values to boolean
function convertValuesToBoolean(obj) {
  for (const [school, themes] of Object.entries(obj)) {
    for (const [theme, questions] of Object.entries(themes)) {
      for (const [gq, indicators] of Object.entries(questions)) {
        for (const indicator of indicators) {
          if (indicator["Value"] === 1) {
            indicator["Value"] = false;
          } else if (indicator["Value"] === 2) {
            indicator["Value"] = true;
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
fs.writeFileSync('school_theme_question_copy.json', JSON.stringify(convertedData, null, 2));

console.log('Successfully converted numeric values to boolean values:');
console.log('- Value 1 → false');
console.log('- Value 2 → true'); 