// ============================================================================
// GLOBAL VARIABLES
// ============================================================================
let chart;
let currentLevel = 'home';
let navigationStack = [];
let allData;
let originalJsonData;

// ============================================================================
// DATA TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Get individual school data for a specific indicator
 * @param {string} gqName - The guiding question name
 * @param {string} indicatorName - The indicator name
 * @returns {Object} School responses for the indicator
 */
function getSchoolDataForIndicator(gqName, indicatorName) {
  console.log('Looking for data:', { gqName, indicatorName });
  
  const gqData = originalJsonData[gqName];
  if (gqData && gqData.category) {
    const indicator = gqData[indicatorName];
    if (indicator) {
      console.log('Found school data:', indicator);
      return indicator;
    }
  }
  
  console.log('GQ or indicator not found:', { gqName, indicatorName });
  return {};
}

// ============================================================================
// NAVIGATION FUNCTIONS
// ============================================================================

/**
 * Go back to previous level
 */
function goBack() {
  if (navigationStack.length > 0) {
    navigationStack.pop();
    updateChart();
  }
}

/**
 * Go to home view
 */
function goHome() {
  navigationStack = [];
  updateChart();
}

/**
 * Handle browser back/forward button
 */
function handlePopState(event) {
  if (event.state && event.state.navigationStack) {
    navigationStack = event.state.navigationStack;
    updateChart();
  } else {
    navigationStack = [];
    updateChart();
  }
}

/**
 * Update URL with current navigation state
 */
function updateURL() {
  const state = { navigationStack: navigationStack };
  const url = navigationStack.length > 0 ? 
    `#${navigationStack.map(item => item.name).join('/')}` : 
    '#';
  
  window.history.pushState(state, '', url);
}

/**
 * Update breadcrumb navigation
 */
function updateBreadcrumb() {
  const breadcrumb = document.getElementById('breadcrumb');
  let breadcrumbHTML = '<span class="breadcrumb-item clickable" onclick="goHome()">Home</span>';
  
  navigationStack.forEach((item, index) => {
    breadcrumbHTML += ' > ';
    if (index === navigationStack.length - 1) {
      // Current level - not clickable
      breadcrumbHTML += `<span class="breadcrumb-item active">${item.name}</span>`;
    } else {
      // Previous level - clickable
      breadcrumbHTML += `<span class="breadcrumb-item clickable" onclick="navigateToLevel(${index})">${item.name}</span>`;
    }
  });
  
  breadcrumb.innerHTML = breadcrumbHTML;
}

/**
 * Navigate to a specific level in the breadcrumb
 */
function navigateToLevel(levelIndex) {
  navigationStack = navigationStack.slice(0, levelIndex + 1);
  updateChart();
}

// ============================================================================
// COLOR FUNCTIONS
// ============================================================================

/**
 * Get theme color based on theme name
 */
function getThemeColor(theme) {
  switch (theme) {
    case 'Conditions': return '#4A90E2'; // Blue
    case 'Instruction': return '#7ED321'; // Green
    case 'Support': return '#F5A623'; // Orange
    default: return '#9B9B9B'; // Gray
  }
}

/**
 * Get darker theme color for headers
 */
function getDarkerThemeColor(theme) {
  switch (theme) {
    case 'Conditions': return '#357ABD'; // Darker blue
    case 'Instruction': return '#6BB01A'; // Darker green
    case 'Support': return '#E0941A'; // Darker orange
    default: return '#7A7A7A'; // Darker gray
  }
}

/**
 * Get border color based on theme
 */
function getBorderColor(theme) {
  return '#FFFFFF'; // White borders for all themes
}

/**
 * Get hover border color based on theme
 */
function getHoverBorderColor(theme) {
  return '#FFFFFF'; // White borders for hover states
}

// ============================================================================
// CHART FUNCTIONS
// ============================================================================

/**
 * Get subtitle text based on current level
 */
function getSubtitleText(type) {
  switch (type) {
    case 'theme': return 'Click on a guiding question or indicator to drill down';
    case 'gq': return 'Click on an indicator to see individual schools';
    case 'indicator': return 'Click on a school to see all responses';
    default: return 'Click on a category to explore';
  }
}

/**
 * Update the chart based on current navigation state
 */
function updateChart() {
  updateBreadcrumb();
  updateURL();
  
  // Update button states
  const backBtn = document.getElementById('backBtn');
  backBtn.disabled = navigationStack.length === 0;
  
  if (navigationStack.length === 0) {
    renderHomeView();
  } else {
    renderDrillDownView();
  }
}

/**
 * Render the home view with all themes
 */
function renderHomeView() {
  currentLevel = 'home';
  
  // Organize data by theme
  const themeData = {};
  
  for (const [gqName, gqData] of Object.entries(originalJsonData)) {
    const category = gqData.category;
    
    if (!themeData[category]) {
      themeData[category] = [];
    }
    
    // Calculate total true responses for this guiding question
    let totalTrue = 0;
    let totalPossible = 0;
    
    for (const [indicatorName, schoolData] of Object.entries(gqData)) {
      if (indicatorName !== 'category') {
        const schoolCount = Object.keys(schoolData).length;
        totalPossible += schoolCount;
        
        for (const response of Object.values(schoolData)) {
          if (response === true) {
            totalTrue += 1;
          }
        }
      }
    }
    
    themeData[category].push({
      name: gqName,
      trueCount: totalTrue,
      totalPossible: totalPossible
    });
  }
  
  // Create chart data
  const data = [];
  const order = ['Conditions', 'Instruction', 'Support'];
  
  order.forEach(theme => {
    if (themeData[theme]) {
      const totalTrue = themeData[theme].reduce((sum, gq) => sum + gq.trueCount, 0);
      const totalPossible = themeData[theme].reduce((sum, gq) => sum + gq.totalPossible, 0);
      const percentage = totalPossible > 0 ? Math.round((totalTrue / totalPossible) * 100) : 0;
      
      data.push({
        id: theme.toLowerCase(),
        name: theme,
        value: totalTrue,
        color: getThemeColor(theme),
        isTheme: true,
        totalPossible: totalPossible,
        percentage: percentage
      });
    }
  });
  
  if (chart) {
    chart.destroy();
  }
  
  chart = Highcharts.chart('container', {
    accessibility: {
      enabled: false
    },
    series: [{
      type: 'treemap',
      layoutAlgorithm: 'squarified',
      data: data,
      allowDrillToNode: true,
      cursor: 'pointer',
      interactByLeaf: true,
      allowTraversingTree: true,
      alternateStartingDirection: true,
      dataLabels: {
        enabled: true,
        format: '{point.name}<br/><span style="font-size: 0.8em; opacity: 0.8;">{point.percentage}%</span>',
        style: {
          textOutline: 'none'
        }
      },
      borderRadius: 2,
      levels: [{
        level: 1,
        layoutAlgorithm: 'squarified',
        dataLabels: {
          enabled: true,
          style: {
            fontSize: '1.2em',
            fontWeight: 'bold',
            color: 'var(--highcharts-neutral-color-100, #000)'
          }
        },
        borderWidth: 2,
        borderColor: '#FFFFFF'
      }]
    }],
    title: { text: 'District ESF Performance Overview' },
    subtitle: { text: 'Click on a category to explore guiding questions and indicators' },
    tooltip: {
      formatter: function() {
        const percentage = this.point.totalPossible > 0 ? 
          Math.round((this.point.value / this.point.totalPossible) * 100) : 0;
        return `<b>${this.point.name}</b><br>True Responses: ${this.point.value}/${this.point.totalPossible} (${percentage}%)`;
      }
    },
    plotOptions: {
      treemap: {
        states: { 
          hover: { 
            brightness: -0.1,
            borderColor: function() {
              const theme = this.options.name || 'Conditions';
              return getHoverBorderColor(theme);
            }
          } 
        },
        point: {
          events: {
            click: function() {
              console.log('Point clicked:', this.name, 'Options:', this.options);
              
              if (this.options.isTheme) {
                // Theme clicked - navigate to theme view
                navigationStack.push({ name: this.name, type: 'theme' });
                updateChart();
              } else if (this.options.isHeader) {
                // Guiding question header clicked - navigate to GQ view
                navigationStack.push({ name: this.name, type: 'gq' });
                updateChart();
              }
            }
          }
        }
      }
    }
  });
  
  console.log('Chart created successfully');
}

/**
 * Render drill-down view based on current navigation level
 */
function renderDrillDownView() {
  const currentItem = navigationStack[navigationStack.length - 1];
  let data = [];
  
  if (currentItem.type === 'theme') {
    // Show key indicators grouped by guiding question for this theme
    // First, organize the data by theme and guiding question
    const organizedData = {};
    
    // Process each guiding question from the original data
    for (const [gqName, gqData] of Object.entries(originalJsonData)) {
      const category = gqData.category;
      
      if (category === currentItem.name) {
        if (!organizedData[gqName]) {
          organizedData[gqName] = {};
        }
        
        // Process each indicator in this guiding question
        for (const [indicatorName, schoolData] of Object.entries(gqData)) {
          if (indicatorName !== 'category') {
            // Count true values for this indicator
            let trueCount = 0;
            for (const response of Object.values(schoolData)) {
              if (response === true) {
                trueCount += 1;
              }
            }
            
            organizedData[gqName][indicatorName] = trueCount;
          }
        }
      }
    }
    
    let idCounter = 1;
    
    // Create data with grouped indicators
    for (const [gqName, gqIndicators] of Object.entries(organizedData)) {
      // Add guiding question as a group header
      const gqTotal = Object.values(gqIndicators).reduce((sum, value) => sum + value, 0);
      const gqId = `gq-${idCounter++}`;
      const gqColor = getDarkerThemeColor(currentItem.name);
      
      data.push({
        id: gqId,
        name: gqName,
        value: gqTotal,
        color: gqColor,
        isHeader: true
      });
      
      // Add indicators under this guiding question
      for (const [indicatorName, indicatorValue] of Object.entries(gqIndicators)) {
        const themeColor = getThemeColor(currentItem.name);
        const fullKey = `${gqName} - ${indicatorName}`;
        
        data.push({
          id: `indicator-${idCounter++}`,
          name: `${indicatorName}<br/><span style="font-size: 0.8em; opacity: 0.8;">${indicatorValue} schools</span>`,
          value: indicatorValue,
          parent: gqId,
          fullKey: fullKey,
          color: themeColor,
          isHeader: false,
          borderColor: getBorderColor(currentItem.name)
        });
      }
    }
  } else if (currentItem.type === 'gq') {
    // Show only indicators for this specific guiding question
    // Find the theme by looking at the category in the original data
    const gqData = originalJsonData[currentItem.name];
    const themeName = gqData ? gqData.category : null;
    
    if (!themeName || !gqData) {
      console.error('Could not find theme for GQ:', currentItem.name);
      return;
    }
    
    let idCounter = 1;
    for (const [indicatorName, schoolData] of Object.entries(gqData)) {
      if (indicatorName !== 'category') {
        // Count true values
        let trueCount = 0;
        for (const response of Object.values(schoolData)) {
          if (response === true) {
            trueCount += 1;
          }
        }
        
        const themeColor = getThemeColor(themeName);
        const fullKey = `${currentItem.name} - ${indicatorName}`;
        
        data.push({
          id: `indicator-${idCounter++}`,
          name: `${indicatorName}<br/><span style="font-size: 0.8em; opacity: 0.8;">${trueCount} schools</span>`,
          value: trueCount,
          fullKey: fullKey,
          color: themeColor,
          isHeader: false,
          borderColor: getBorderColor(themeName)
        });
      }
    }
  } else if (currentItem.type === 'indicator') {
    // Show individual schools for this key indicator
    const indicatorKey = currentItem.fullKey || currentItem.name;
    
    console.log('Rendering indicator level for:', indicatorKey);
    console.log('Navigation stack:', navigationStack);
    
    // Extract GQ and indicator name from the key
    const parts = indicatorKey.split(' - ');
    const gqName = parts[0];
    const indicatorName = parts.slice(1).join(' - ');
    
    console.log('Extracted GQ name:', gqName);
    console.log('Extracted indicator name:', indicatorName);
    
    // Get school data for this specific indicator
    const schoolData = getSchoolDataForIndicator(gqName, indicatorName);
    
    let idCounter = 1;
    for (const [school, value] of Object.entries(schoolData)) {
      // Color based on response value
      const schoolColor = value ? '#76C876' : '#D07777'; // Soft green for true, soft red for false
      
      data.push({
        id: `school-${idCounter++}`,
        name: school,
        value: 1, // Give each school equal visual weight
        color: schoolColor,
        schoolResponse: value, // Store the actual boolean response
        borderColor: '#FFFFFF' // White border for all schools
      });
    }
  }
  
  if (chart) {
    chart.destroy();
  }
  
  chart = Highcharts.chart('container', {
    accessibility: {
      enabled: false
    },
    series: [{
      type: 'treemap',
      layoutAlgorithm: 'squarified',
      data: data,
      allowDrillToNode: true,
      cursor: 'pointer',
      interactByLeaf: true,
      allowTraversingTree: true,
      alternateStartingDirection: true,
      dataLabels: {
        headers: true,
        enabled: true,
        format: '{point.name}',
        style: {
            textOutline: 'none'
        }
      },
      borderRadius: 2,
      nodeSizeBy: 'leaf',
      levels: [{
        level: 1,
        layoutAlgorithm: 'squarified',
        groupPadding: 8,
        dataLabels: {
          headers: true,
          enabled: true,
          style: {
            fontSize: '.75em',
            fontWeight: 'normal',
            color: 'var(--highcharts-neutral-color-100, #000)'
          }
        },
        borderWidth: 2,
        colorByPoint: true
      }, {
        level: 2,
        groupPadding: 8,
        dataLabels: {
            enabled: true,
            inside: true
        },
        borderWidth: 2
      }, {
        level: 3,
        groupPadding: 8,
        dataLabels: {
            enabled: true,
            inside: true
        },
        borderWidth: 2
      }]
    }],
    title: { text: `${currentItem.name}` },
    subtitle: { text: getSubtitleText(currentItem.type) },
    tooltip: {
      formatter: function() {
        if (currentItem.type === 'indicator') {
          const response = this.point.schoolResponse ? 'True' : 'False';
          const status = this.point.schoolResponse ? '✅' : '❌';
          return `<b>${this.point.name}</b><br>${status} Response: ${response}`;
        } else {
          if (this.point.options.parent) {
            // Individual indicator
            return `<b>${this.point.name}</b><br>Schools with True: ${this.point.value}`;
          } else {
            // Guiding question header
            return `<b>${this.point.name}</b><br>Total Schools with True: ${this.point.value}`;
          }
        }
      }
    },
    plotOptions: {
      treemap: {
        states: { 
          hover: { 
            brightness: -0.1,
            borderColor: function() {
              if (this.options.isHeader) return undefined;
              const currentItem = this.series.chart.navigationStack?.[this.series.chart.navigationStack.length - 1];
              if (!currentItem) return undefined;
              
              if (currentItem.type === 'indicator') {
                // School level - use white border
                return '#FFFFFF';
              } else {
                // Indicator level - use white border
                return '#FFFFFF';
              }
            }
          } 
        },
        point: {
          events: {
            click: function() {
              console.log('Point clicked:', this.name, 'Current type:', currentItem.type, 'Options:', this.options);
              
              if (currentItem.type === 'indicator') {
                // School level - show modal with all school responses
                showSchoolModal(this.name);
                return;
              }
              
              if (currentItem.type === 'theme') {
                // Check if this is a guiding question header or an individual indicator
                if (this.options.isHeader) {
                  // This is a guiding question header - show only indicators for this GQ
                  navigationStack.push({ name: this.name, type: 'gq' });
                  updateChart();
                } else if (this.options.parent) {
                  // This is an individual indicator
                  const fullKey = this.options.fullKey || this.name;
                  const parts = fullKey.split(' - ');
                  const gqName = parts[0];
                  const indicatorName = parts.slice(1).join(' - ');
                  
                  // Add guiding question to navigation stack if not already there
                  if (navigationStack.length === 0 || navigationStack[navigationStack.length - 1].name !== gqName) {
                    navigationStack.push({ name: gqName, type: 'gq' });
                  }
                  
                  navigationStack.push({ name: indicatorName, type: 'indicator', fullKey: fullKey });
                  updateChart();
                }
              } else if (currentItem.type === 'gq') {
                // Clicking on an indicator from the GQ level
                const fullKey = this.options.fullKey || this.name;
                const parts = fullKey.split(' - ');
                const gqName = parts[0];
                const indicatorName = parts.slice(1).join(' - ');
                
                // Add guiding question to navigation stack if not already there
                if (navigationStack.length === 0 || navigationStack[navigationStack.length - 1].name !== gqName) {
                  navigationStack.push({ name: gqName, type: 'gq' });
                }
                
                navigationStack.push({ name: indicatorName, type: 'indicator', fullKey: fullKey });
                updateChart();
              }
            }
          }
        }
      }
    }
  });
}

// ============================================================================
// MODAL FUNCTIONS
// ============================================================================

/**
 * Show school detail modal with all responses
 * @param {string} schoolName - The name of the school
 */
function showSchoolModal(schoolName) {
  console.log('Showing modal for school:', schoolName);
  
  // Generate the table HTML
  const tableHTML = generateSchoolTable(schoolName);
  
  // Update modal content
  document.getElementById('modalTitle').textContent = `${schoolName} - All Responses`;
  document.getElementById('modalBody').innerHTML = tableHTML;
  
  // Show modal
  document.getElementById('schoolModal').style.display = 'block';
}

/**
 * Close the school detail modal
 */
function closeSchoolModal() {
  document.getElementById('schoolModal').style.display = 'none';
}

/**
 * Generate HTML table for school responses
 * @param {string} schoolName - The name of the school
 * @returns {string} HTML table string
 */
function generateSchoolTable(schoolName) {
  if (!originalJsonData) {
    return '<p>No data available</p>';
  }
  
  // Group data by category and guiding question
  const organizedData = {};
  
  for (const [gqName, gqData] of Object.entries(originalJsonData)) {
    const category = gqData.category;
    
    if (!organizedData[category]) {
      organizedData[category] = {};
    }
    
    if (!organizedData[category][gqName]) {
      organizedData[category][gqName] = {};
    }
    
    // Get school response for each indicator
    for (const [indicatorName, schoolData] of Object.entries(gqData)) {
      if (indicatorName !== 'category' && schoolData[schoolName] !== undefined) {
        organizedData[category][gqName][indicatorName] = schoolData[schoolName];
      }
    }
  }
  
  let tableHTML = '<table class="school-table">';
  tableHTML += '<thead><tr><th>Category</th><th>Guiding Question</th><th>Key Indicator</th><th>Response</th></tr></thead><tbody>';
  
  // Track rowspans for category and guiding question columns
  const categoryRowspans = {};
  const gqRowspans = {};
  
  // Calculate rowspans
  for (const [category, gqData] of Object.entries(organizedData)) {
    let categoryTotalRows = 0;
    for (const [gqName, indicators] of Object.entries(gqData)) {
      const indicatorCount = Object.keys(indicators).length;
      if (indicatorCount > 0) {
        categoryTotalRows += indicatorCount;
        gqRowspans[`${category}-${gqName}`] = indicatorCount;
      }
    }
    if (categoryTotalRows > 0) {
      categoryRowspans[category] = categoryTotalRows;
    }
  }
  
  // Generate table rows
  let categoryRowspanUsed = {};
  let gqRowspanUsed = {};
  
  for (const [category, gqData] of Object.entries(organizedData)) {
    for (const [gqName, indicators] of Object.entries(gqData)) {
      const indicatorKeys = Object.keys(indicators);
      if (indicatorKeys.length === 0) continue;
      
      for (let i = 0; i < indicatorKeys.length; i++) {
        const indicatorName = indicatorKeys[i];
        const response = indicators[indicatorName];
        
        tableHTML += '<tr>';
        
        // Category column with rowspan
        if (!categoryRowspanUsed[category]) {
          tableHTML += `<td class="category-header" rowspan="${categoryRowspans[category]}">${category}</td>`;
          categoryRowspanUsed[category] = true;
        }
        
        // Guiding question column with rowspan
        const gqKey = `${category}-${gqName}`;
        if (!gqRowspanUsed[gqKey]) {
          tableHTML += `<td class="gq-header" rowspan="${gqRowspans[gqKey]}">${gqName}</td>`;
          gqRowspanUsed[gqKey] = true;
        }
        
        // Indicator and response columns
        tableHTML += `<td>${indicatorName}</td>`;
        tableHTML += `<td class="response-${response ? 'true' : 'false'}">${response ? 'True' : 'False'}</td>`;
        
        tableHTML += '</tr>';
      }
    }
  }
  
  tableHTML += '</tbody></table>';
  return tableHTML;
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Export the current chart
 * @param {string} format - The export format (png, pdf, csv)
 */
function exportChart(format) {
  if (chart) {
    if (format === 'csv') {
      chart.downloadCSV();
    } else {
      chart.exportChart({
        type: format,
        filename: `treemap_${new Date().toISOString().split('T')[0]}`
      });
    }
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Load and initialize the chart
fetch('reorganized_school_data.json')
  .then(response => {
    if (!response.ok) throw new Error('Failed to load JSON');
    return response.json();
  })
  .then(json => {
    console.log('JSON loaded:', json);
    originalJsonData = json; // Store original data
    
    // Set up browser navigation
    window.addEventListener('popstate', handlePopState);
    
    // Set up modal close on outside click
    window.addEventListener('click', function(event) {
      const modal = document.getElementById('schoolModal');
      if (event.target === modal) {
        closeSchoolModal();
      }
    });
    
    // Initialize chart
    updateChart();
  })
  .catch(err => {
    console.error('Error:', err);
    document.getElementById('container').innerText = 'Error loading chart: ' + err.message;
  }); 