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
const TOTAL_LOGS = 100000; // Total number of logs to generate
const DEBOUNCE_DELAY = 150; // Debounce delay in milliseconds for cluster updates

// Cluster visibility tracking
let clusterObserver = null;
let visibleClusters = new Set();
let totalClustersCount = 0;
let debounceTimer = null;

// Virtual scrolling state
let referenceClusterHeight = 0;
let loadedClusters = new Map(); // Map of cluster index to DOM element
let currentViewportClusters = new Set(); // Currently visible clusters + buffer

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
 * Renders the log data to the DOM using virtual scrolling for performance
 */
function renderLogData() {
    const tbody = document.getElementById('logTableBody');
    console.log(`Rendering ${logData.length} log entries with virtual scrolling (${CLUSTER_SIZE} logs per cluster)...`);
    const startTime = performance.now();
    
    // Clear existing content
    tbody.innerHTML = '';
    loadedClusters.clear();
    
    // Calculate total clusters count
    totalClustersCount = Math.ceil(logData.length / CLUSTER_SIZE);
    
    // Step 1: Load only the first and second cluster into DOM
    const firstCluster = createClusterElement(0);
    const secondCluster = totalClustersCount > 1 ? createClusterElement(1) : null;
    
    tbody.appendChild(firstCluster);
    if (secondCluster) {
        tbody.appendChild(secondCluster);
    }
    
    // Step 2: Get the height of the first cluster (after DOM insertion)
    setTimeout(() => {
        referenceClusterHeight = firstCluster.offsetHeight;
        console.log(`Reference cluster height: ${referenceClusterHeight}px`);
        
        // Step 3: Create empty placeholder clusters for the rest
        for (let i = (secondCluster ? 2 : 1); i < totalClustersCount; i++) {
            const placeholderCluster = createPlaceholderCluster(i);
            tbody.appendChild(placeholderCluster);
        }
        
        const endTime = performance.now();
        console.log(`Virtual scrolling setup completed! ${totalClustersCount} clusters created in ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`Only ${secondCluster ? 2 : 1} clusters loaded with actual content, ${totalClustersCount - (secondCluster ? 2 : 1)} are placeholders`);
        
        // Initialize cluster visibility monitoring
        initializeVirtualScrollObserver();
        updateDebugInfo();
    }, 0);
}

/**
 * Creates a cluster element with actual log data
 * @param {number} clusterIndex - Index of the cluster to create
 * @returns {HTMLElement} DOM element representing the cluster
 */
function createClusterElement(clusterIndex) {
    const cluster = document.createElement('div');
    cluster.className = 'log-cluster loaded-cluster';
    cluster.setAttribute('data-cluster-index', clusterIndex);
    
    const startIndex = clusterIndex * CLUSTER_SIZE;
    const endIndex = Math.min(startIndex + CLUSTER_SIZE, logData.length);
    
    // Create log rows for this cluster
    for (let i = startIndex; i < endIndex; i++) {
        const row = createLogRowElement(logData[i]);
        cluster.appendChild(row);
    }
    
    // Store in loaded clusters map
    loadedClusters.set(clusterIndex, cluster);
    
    return cluster;
}

/**
 * Creates a placeholder cluster with fixed height
 * @param {number} clusterIndex - Index of the cluster to create
 * @returns {HTMLElement} DOM element representing the placeholder cluster
 */
function createPlaceholderCluster(clusterIndex) {
    const cluster = document.createElement('div');
    cluster.className = 'log-cluster placeholder-cluster';
    cluster.setAttribute('data-cluster-index', clusterIndex);
    
    // Calculate height based on number of logs in this cluster
    const startIndex = clusterIndex * CLUSTER_SIZE;
    const endIndex = Math.min(startIndex + CLUSTER_SIZE, logData.length);
    const logsInCluster = endIndex - startIndex;
    
    // Use proportional height based on reference cluster height
    let clusterHeight;
    if (clusterIndex === totalClustersCount - 1 && logsInCluster < CLUSTER_SIZE) {
        // Last cluster might have fewer logs
        clusterHeight = Math.round((referenceClusterHeight * logsInCluster) / CLUSTER_SIZE);
    } else {
        // Full cluster
        clusterHeight = referenceClusterHeight;
    }
    
    cluster.style.height = `${clusterHeight}px`;
    cluster.style.backgroundColor = '#f9f9f9'; // Light background to indicate placeholder
    cluster.style.border = '1px dashed #ddd';
    cluster.style.display = 'flex';
    cluster.style.alignItems = 'center';
    cluster.style.justifyContent = 'center';
    cluster.style.color = '#999';
    cluster.style.fontSize = '14px';
    
    // Add placeholder text
    const placeholderText = document.createElement('div');
    placeholderText.textContent = `Cluster ${clusterIndex} (${logsInCluster} logs) - Scroll to load`;
    cluster.appendChild(placeholderText);
    
    return cluster;
}

/**
 * Initializes the application by generating data and rendering it
 */
function initializeApplication() {
    generateLogData();
    renderLogData();
    setupJumpControls();
}

// ===== VIRTUAL SCROLLING SECTION =====

/**
 * Initializes the virtual scroll observer to monitor cluster visibility
 */
function initializeVirtualScrollObserver() {
    // Disconnect existing observer if any
    if (clusterObserver) {
        clusterObserver.disconnect();
    }
    
    // Create new Intersection Observer with buffer zone
    const options = {
        root: document.getElementById('tableWrapper'), // Use the scrollable container as root
        rootMargin: '200px 0px 200px 0px', // 200px buffer above and below viewport
        threshold: 0.1 // Trigger when 1% of cluster is visible
    };
    
    clusterObserver = new IntersectionObserver(handleVirtualScrollVisibility, options);
    
    // Observe all cluster elements
    const clusters = document.querySelectorAll('.log-cluster');
    clusters.forEach(cluster => {
        clusterObserver.observe(cluster);
    });
    
    addDebugMessage(`Initialized virtual scroll observer for ${clusters.length} clusters`, 'info');
    console.log(`Virtual scroll observer initialized for ${clusters.length} clusters`);
}

/**
 * Handles virtual scroll visibility changes
 * @param {IntersectionObserverEntry[]} entries - Array of intersection entries
 */
function handleVirtualScrollVisibility(entries) {
    let needsUpdate = false;
    
    entries.forEach(entry => {
        const clusterIndex = parseInt(entry.target.getAttribute('data-cluster-index'));
        
        if (entry.isIntersecting) {
            // Cluster entered viewport + buffer zone
            if (!visibleClusters.has(clusterIndex)) {
                visibleClusters.add(clusterIndex);
                addDebugMessage(`Cluster ${clusterIndex} entered buffer zone`, 'enter');
                console.log(`Cluster ${clusterIndex} entered buffer zone`);
                needsUpdate = true;
            }
        } else {
            // Cluster left viewport + buffer zone
            if (visibleClusters.has(clusterIndex)) {
                visibleClusters.delete(clusterIndex);
                addDebugMessage(`Cluster ${clusterIndex} left buffer zone`, 'exit');
                console.log(`Cluster ${clusterIndex} left buffer zone`);
                needsUpdate = true;
            }
        }
    });
    
    if (needsUpdate) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            updateClusterLoading();
        }, DEBOUNCE_DELAY);
    }
    
    // Update debug display
    updateDebugInfo();
}

/**
 * Updates which clusters should be loaded based on current visibility
 */
function updateClusterLoading() {
    const tbody = document.getElementById('logTableBody');
    const newViewportClusters = new Set(visibleClusters);
    
    // Load clusters that are now in viewport but weren't before
    newViewportClusters.forEach(clusterIndex => {
        if (!currentViewportClusters.has(clusterIndex)) {
            loadCluster(clusterIndex);
        }
    });
    
    // Unload clusters that are no longer in viewport
    currentViewportClusters.forEach(clusterIndex => {
        if (!newViewportClusters.has(clusterIndex)) {
            unloadCluster(clusterIndex);
        }
    });
    
    // Update current viewport clusters
    currentViewportClusters = newViewportClusters;
    
    // Log current state
    const loadedCount = Array.from(currentViewportClusters).filter(index => 
        loadedClusters.has(index)
    ).length;
    addDebugMessage(`Loaded clusters: ${loadedCount}/${totalClustersCount}`, 'info');
}

/**
 * Loads a cluster with actual log data
 * @param {number} clusterIndex - Index of the cluster to load
 */
function loadCluster(clusterIndex) {
    // Skip if already loaded
    if (loadedClusters.has(clusterIndex)) {
        return;
    }
    
    const tbody = document.getElementById('logTableBody');
    const existingCluster = tbody.querySelector(`[data-cluster-index="${clusterIndex}"]`);
    
    if (existingCluster && existingCluster.classList.contains('placeholder-cluster')) {
        // Replace placeholder with loaded cluster
        const loadedCluster = createClusterElement(clusterIndex);
        tbody.replaceChild(loadedCluster, existingCluster);
        
        // Start observing the new cluster
        clusterObserver.observe(loadedCluster);
        
        addDebugMessage(`Loaded cluster ${clusterIndex}`, 'info');
        console.log(`Loaded cluster ${clusterIndex} with actual data`);
    }
}

/**
 * Unloads a cluster and replaces it with a placeholder
 * @param {number} clusterIndex - Index of the cluster to unload
 */
function unloadCluster(clusterIndex) {
    // Don't unload the first two clusters (keep them always loaded for reference)
    if (clusterIndex <= 1) {
        return;
    }
    
    const tbody = document.getElementById('logTableBody');
    const existingCluster = tbody.querySelector(`[data-cluster-index="${clusterIndex}"]`);
    
    if (existingCluster && existingCluster.classList.contains('loaded-cluster')) {
        // Replace loaded cluster with placeholder
        const placeholderCluster = createPlaceholderCluster(clusterIndex);
        tbody.replaceChild(placeholderCluster, existingCluster);
        
        // Remove from loaded clusters map
        loadedClusters.delete(clusterIndex);
        
        // Start observing the new placeholder
        clusterObserver.observe(placeholderCluster);
        
        addDebugMessage(`Unloaded cluster ${clusterIndex}`, 'info');
        console.log(`Unloaded cluster ${clusterIndex} and replaced with placeholder`);
    }
}

// ===== CLUSTER VISIBILITY MONITORING SECTION =====

/**
 * Initializes the Intersection Observer to monitor cluster visibility (legacy function)
 */
function initializeClusterObserver() {
    // Disconnect existing observer if any
    if (clusterObserver) {
        clusterObserver.disconnect();
    }
    
    // Create new Intersection Observer
    const options = {
        root: document.getElementById('tableWrapper'), // Use the scrollable container as root
        rootMargin: '0px',
        threshold: 0.01 // Trigger when 10% of cluster is visible
    };
    
    clusterObserver = new IntersectionObserver(handleClusterVisibility, options);
    
    // Observe all cluster elements
    const clusters = document.querySelectorAll('.log-cluster');
    clusters.forEach(cluster => {
        clusterObserver.observe(cluster);
    });
    
    addDebugMessage(`Initialized cluster observer for ${clusters.length} clusters`, 'info');
    console.log(`Cluster observer initialized for ${clusters.length} clusters`);
}

/**
 * Handles cluster visibility changes
 * @param {IntersectionObserverEntry[]} entries - Array of intersection entries
 */
function handleClusterVisibility(entries) {
    entries.forEach(entry => {
        const clusterIndex = parseInt(entry.target.getAttribute('data-cluster-index'));
        
        if (entry.isIntersecting) {
            // Cluster entered viewport
            if (!visibleClusters.has(clusterIndex)) {
                visibleClusters.add(clusterIndex);
                addDebugMessage(`Cluster ${clusterIndex} entered viewport`, 'enter');
                console.log(`Cluster ${clusterIndex} entered viewport`);
            }
        } else {
            // Cluster left viewport
            if (visibleClusters.has(clusterIndex)) {
                visibleClusters.delete(clusterIndex);
                addDebugMessage(`Cluster ${clusterIndex} left viewport`, 'exit');
                console.log(`Cluster ${clusterIndex} left viewport`);
            }
        }
    });
    
    // Get visible log indices and add to debug log
    const visibleIndices = getVisibleLogIndices();
    if (visibleIndices.startIndex !== -1) {
        const logCount = visibleIndices.endIndex - visibleIndices.startIndex;
        addDebugMessage(`Visible log indices: ${visibleIndices.startIndex} to ${visibleIndices.endIndex - 1} (${logCount} logs)`, 'info');
        console.log(`Visible log indices: start=${visibleIndices.startIndex}, end=${visibleIndices.endIndex} (${logCount} logs)`);
    } else {
        addDebugMessage(`No logs currently visible`, 'info');
        console.log(`No logs currently visible`);
    }
    
    // Update debug display
    updateDebugInfo();
}

/**
 * Updates the debug information display
 */
function updateDebugInfo() {
    const totalClustersElement = document.getElementById('totalClusters');
    const visibleClustersElement = document.getElementById('visibleClusters');
    const visibleCountElement = document.getElementById('visibleCount');
    
    if (totalClustersElement) {
        totalClustersElement.textContent = totalClustersCount;
    }
    
    if (visibleClustersElement) {
        const sortedVisible = Array.from(visibleClusters).sort((a, b) => a - b);
        visibleClustersElement.textContent = `[${sortedVisible.join(', ')}]`;
    }
    
    if (visibleCountElement) {
        visibleCountElement.textContent = visibleClusters.size;
    }
}

/**
 * Adds a debug message to the debug log
 * @param {string} message - The message to add
 * @param {string} type - The type of message ('enter', 'exit', 'info')
 */
function addDebugMessage(message, type = 'info') {
    const debugLogContent = document.getElementById('debugLogContent');
    if (!debugLogContent) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `debug-message ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    messageElement.textContent = `[${timestamp}] ${message}`;
    
    debugLogContent.appendChild(messageElement);
    
    // Auto-scroll to bottom
    debugLogContent.scrollTop = debugLogContent.scrollHeight;
    
    // Limit to last 100 messages to prevent memory issues
    const messages = debugLogContent.children;
    if (messages.length > 100) {
        debugLogContent.removeChild(messages[0]);
    }
}

/**
 * Returns an array of currently visible cluster indices
 * @returns {number[]} Array of visible cluster indices
 */
function getVisibleClusters() {
    return Array.from(visibleClusters).sort((a, b) => a - b);
}

/**
 * Calculates which data log indices are currently in view
 * @returns {Object} Object with startIndex (inclusive) and endIndex (exclusive) of visible logs
 */
function getVisibleLogIndices() {
    if (visibleClusters.size === 0) {
        return { startIndex: -1, endIndex: -1 };
    }
    
    const sortedVisibleClusters = Array.from(visibleClusters).sort((a, b) => a - b);
    const firstVisibleCluster = sortedVisibleClusters[0];
    const lastVisibleCluster = sortedVisibleClusters[sortedVisibleClusters.length - 1];
    
    // Calculate start index (inclusive)
    const startIndex = firstVisibleCluster * CLUSTER_SIZE;
    
    // Calculate end index (exclusive)
    // For the last cluster, we need to check if it's a full cluster or partial
    let endIndex;
    if (lastVisibleCluster === totalClustersCount - 1) {
        // This is the last cluster, so end index is the total number of logs
        endIndex = logData.length;
    } else {
        // This is not the last cluster, so it's a full cluster
        endIndex = (lastVisibleCluster + 1) * CLUSTER_SIZE;
    }
    
    return { startIndex, endIndex };
}

/**
 * Scrolls to a specific row by temporarily disabling virtual scrolling
 * @param {number} rowIndex - Index of the row to scroll to (0-based)
 */
function scrollToRow(rowIndex) {
    // Validate input
    if (rowIndex < 0 || rowIndex >= logData.length) {
        alert(`Invalid row index. Please enter a number between 0 and ${logData.length - 1}`);
        return;
    }
    
    const clusterIndex = Math.floor(rowIndex / CLUSTER_SIZE);
    const rowIndexInCluster = rowIndex % CLUSTER_SIZE;
    
    addDebugMessage(`Jumping to row ${rowIndex} (cluster ${clusterIndex}, row ${rowIndexInCluster})`, 'info');
    
    // 1. Temporarily disable intersection observer
    if (clusterObserver) {
        clusterObserver.disconnect();
        addDebugMessage('Cluster observer disabled for navigation', 'info');
    }
    
    // 2. Pre-load the target cluster (and neighbors for safety)
    loadCluster(clusterIndex);
    if (clusterIndex > 0) loadCluster(clusterIndex - 1);
    if (clusterIndex < totalClustersCount - 1) loadCluster(clusterIndex + 1);
    
    // 3. Wait for DOM to update
    setTimeout(() => {
        // 4. Scroll to the specific row
        const cluster = document.querySelector(`[data-cluster-index="${clusterIndex}"]`);
        if (cluster && cluster.children[rowIndexInCluster]) {
            const targetRow = cluster.children[rowIndexInCluster];
            targetRow.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center'
            });
            
            // 5. Highlight the row
            highlightRow(targetRow);
            addDebugMessage(`Successfully jumped to row ${rowIndex}`, 'info');
            
            // 6. Re-enable intersection observer after scroll completes
            setTimeout(() => {
                initializeVirtualScrollObserver();
                addDebugMessage('Cluster observer re-enabled', 'info');
            }, 1000); // Wait for smooth scroll animation
        } else {
            addDebugMessage(`Failed to find row ${rowIndex}`, 'info');
            // Re-enable observer even if failed
            setTimeout(() => {
                initializeVirtualScrollObserver();
            }, 100);
        }
    }, 150); // Wait for cluster loading
}

/**
 * Highlights a row element temporarily
 * @param {HTMLElement} rowElement - The row element to highlight
 */
function highlightRow(rowElement) {
    // Add highlight class
    rowElement.classList.add('highlighted-row');
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
        rowElement.classList.remove('highlighted-row');
    }, 3000);
}

/**
 * Sets up event listeners for the jump controls
 */
function setupJumpControls() {
    const jumpButton = document.getElementById('jumpToRowBtn');
    const rowInput = document.getElementById('rowIndexInput');
    
    if (jumpButton && rowInput) {
        jumpButton.addEventListener('click', () => {
            const rowIndex = parseInt(rowInput.value);
            if (!isNaN(rowIndex)) {
                scrollToRow(rowIndex);
            }
        });
        
        // Allow Enter key to trigger jump
        rowInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const rowIndex = parseInt(rowInput.value);
                if (!isNaN(rowIndex)) {
                    scrollToRow(rowIndex);
                }
            }
        });
    }
}

// Initialize the application when the page loads
window.addEventListener('load', initializeApplication);
