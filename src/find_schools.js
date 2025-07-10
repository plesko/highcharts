const fs = require('fs');

// Read the JSON data
const data = JSON.parse(fs.readFileSync('school_theme_question_copy.json', 'utf8'));

const targetIndicator = "District/Campus has an Instructional Framework for RLA";
const schoolsWithValue2 = [];

// Check each school
for (const [schoolName, schoolData] of Object.entries(data)) {
  // Navigate to the specific indicator in the Instruction > GQ 4 section
  const instruction = schoolData.Instruction;
  if (instruction && instruction["GQ 4: Are research-based instructional strategies being implemented?"]) {
    const indicators = instruction["GQ 4: Are research-based instructional strategies being implemented?"];
    
    for (const indicator of indicators) {
      if (indicator["Key Indicator"] === targetIndicator) {
        if (indicator["Value"] === 2) {
          schoolsWithValue2.push(schoolName);
        }
        break;
      }
    }
  }
}

console.log(`Schools with value 2 for "${targetIndicator}":`);
schoolsWithValue2.forEach(school => console.log(`- ${school}`));
console.log(`Total: ${schoolsWithValue2.length} schools`); 