// ===== DATA GENERATION SECTION =====
const logLevels = ['INFO', 'WARN', 'ERROR'];
const sampleMessages = [
    'Application started successfully',
    'User authentication completed',
    'Database connection established',
    'Failed to connect to external API service. Retrying in 30 seconds. This is a longer message that should wrap to multiple lines to demonstrate the dynamic row height functionality.',
    'Memory usage is at 85% capacity',
    'Invalid input received from user: expected number but got string. Please check the input validation logic in the frontend components.',
    'Cache cleared successfully',
    'New user registered: john.doe@example.com',
    'File upload completed: document.pdf (2.3MB)',
    'Critical error: Unable to process payment transaction. Payment gateway returned error code 500. Customer ID: 12345, Transaction ID: TXN-789456123. Please investigate immediately as this affects customer experience and revenue.',
    'Session expired for user ID 98765',
    'Backup process initiated',
    'Configuration file updated with new parameters including timeout values, retry counts, and connection pool settings. All services will be restarted to apply these changes.',
    'Email notification sent successfully',
    'Rate limit exceeded for API endpoint /api/v1/users. Client IP: 192.168.1.100 has made 1000 requests in the last hour, which exceeds the limit of 500 requests per hour.',
    'System maintenance scheduled for tonight at 2:00 AM EST',
    'Data synchronization completed',
    'Warning: Disk space is running low on server node-03. Current usage: 92% of 500GB. Please clean up old log files or add more storage capacity.',
    'User logout successful',
    'Performance metrics collected and stored'
];

// Global data array to store all log entries
let logData = [];

// Configuration
const CLUSTER_SIZE = 50; // Number of logs per cluster
const TOTAL_LOGS = 10000; // Total number of logs to generate

/**
 * Generates log data and populates the logData array
 * Each log entry is a JSON object with timestamp, level, and message
 */
function generateLogData() {
    console.log(`Generating ${TOTAL_LOGS} log entries...`);
    const startTime = performance.now();
    
    logData = []; // Clear existing data
    
    for (let i = 0; i < TOTAL_LOGS; i++) {
        // Randomly select log level and message
        const level = logLevels[Math.floor(Math.random() * logLevels.length)];
        const message = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
        
        // Create timestamp going backwards in time (newest first)
        const timestamp = new Date(Date.now() - (i * 1000) - Math.random() * 60000);
        
        // Create log entry as JSON object
        const logEntry = {
            timestamp: timestamp,
            level: level,
            message: message
        };
        
        logData.push(logEntry);
        
        // Log progress every 1000 entries
        if ((i + 1) % 1000 === 0) {
            console.log(`Generated ${i + 1} log entries...`);
        }
    }
    
    const endTime = performance.now();
    console.log(`Data generation completed! Generated ${TOTAL_LOGS} log entries in ${(endTime - startTime).toFixed(2)}ms`);
    
    return logData;
}

// ===== DOM MANIPULATION SECTION =====

/**
 * Formats a date object to a readable string
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatTime(date) {
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Creates a DOM element for a single log row
 * @param {Object} logEntry - Log entry object with timestamp, level, and message
 * @returns {HTMLElement} DOM element representing the log row
 */
function createLogRowElement(logEntry) {
    const row = document.createElement('div');
    row.className = 'log-row';
    
    // Create time column
    const timeCell = document.createElement('div');
    timeCell.className = 'log-cell time-cell time-column';
    timeCell.textContent = formatTime(logEntry.timestamp);
    
    // Create log level column
    const levelCell = document.createElement('div');
    levelCell.className = 'log-cell level-cell';
    const levelSpan = document.createElement('span');
    levelSpan.className = `log-level ${logEntry.level}`;
    levelSpan.textContent = logEntry.level;
    levelCell.appendChild(levelSpan);
    
    // Create message column
    const messageCell = document.createElement('div');
    messageCell.className = 'log-cell message-cell log-message';
    messageCell.textContent = logEntry.message;
    
    // Append all cells to row
    row.appendChild(timeCell);
    row.appendChild(levelCell);
    row.appendChild(messageCell);
    
    return row;
}

/**
 * Renders the log data to the DOM using clusterization for performance
 */
function renderLogData() {
    const tbody = document.getElementById('logTableBody');
    console.log(`Rendering ${logData.length} log entries with clusterization (${CLUSTER_SIZE} logs per cluster)...`);
    const startTime = performance.now();
    
    // Clear existing content
    tbody.innerHTML = '';
    
    let currentCluster = null;
    let logsInCurrentCluster = 0;
    
    for (let i = 0; i < logData.length; i++) {
        // Create a new cluster if needed
        if (logsInCurrentCluster === 0) {
            currentCluster = document.createElement('div');
            currentCluster.className = 'log-cluster';
        }
        
        // Create row element from log data
        const row = createLogRowElement(logData[i]);
        currentCluster.appendChild(row);
        logsInCurrentCluster++;
        
        // When cluster is full, append it to tbody and reset
        if (logsInCurrentCluster === CLUSTER_SIZE) {
            tbody.appendChild(currentCluster);
            logsInCurrentCluster = 0;
            currentCluster = null;
        }
    }
    
    // Append any remaining logs in the last cluster
    if (currentCluster && logsInCurrentCluster > 0) {
        tbody.appendChild(currentCluster);
    }
    
    const endTime = performance.now();
    const clustersCreated = Math.ceil(logData.length / CLUSTER_SIZE);
    console.log(`Rendering completed! Rendered ${logData.length} rows in ${clustersCreated} clusters in ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`Performance improvement: ${CLUSTER_SIZE} DOM operations reduced to ${clustersCreated} operations`);
}

/**
 * Initializes the application by generating data and rendering it
 */
function initializeApplication() {
    generateLogData();
    renderLogData();
}

// Initialize the application when the page loads
window.addEventListener('load', initializeApplication);
