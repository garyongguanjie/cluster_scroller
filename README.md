# Cluster Scroller
Use claude sonnet 4 as an assistant to implement something similar to this.

https://github.blog/engineering/architecture-optimization/how-github-actions-renders-large-scale-logs/

## How the Cluster Scroller Works

This implementation demonstrates a high-performance virtual scrolling solution for rendering large datasets (100,000+ log entries) in a web browser without performance degradation. The solution is inspired by GitHub's approach to rendering large-scale logs and uses a clustering technique combined with virtual scrolling.

### Core Architecture

The cluster scroller consists of four main components:

1. **Data Generation Layer** - Creates mock log data
2. **Clustering System** - Groups logs into manageable chunks
3. **Virtual Scrolling Engine** - Manages DOM elements dynamically
4. **Visibility Monitoring** - Tracks what's currently in view

### Key Concepts

#### 1. Clustering
- **Cluster Size**: Logs are grouped into clusters of 50 entries each (`CLUSTER_SIZE = 50`)
- **Total Capacity**: Handles 100,000 log entries (`TOTAL_LOGS = 100000`)
- **Cluster Count**: Automatically calculated as `Math.ceil(totalLogs / clusterSize)` = 2,000 clusters

#### 2. Virtual Scrolling Strategy
The system uses a sophisticated virtual scrolling approach:

- **Initial Load**: Only the first 1-2 clusters are rendered with actual DOM elements
- **Placeholder Clusters**: Remaining clusters are rendered as lightweight placeholder divs with calculated heights
- **Dynamic Loading**: Clusters are converted from placeholders to actual content when they enter the viewport buffer zone
- **Memory Management**: Clusters outside the viewport are converted back to placeholders (except the first two reference clusters)

#### 3. Performance Optimizations

**Height Calculation**:
```javascript
// Reference height is measured from the first loaded cluster
referenceClusterHeight = firstCluster.offsetHeight;

// Placeholder heights are calculated proportionally
clusterHeight = (referenceClusterHeight * logsInCluster) / CLUSTER_SIZE;
```

**Intersection Observer**:
- Uses a 200px buffer zone above and below the viewport
- Triggers at 1% visibility threshold for smooth loading
- Debounced updates (150ms) to prevent excessive DOM manipulation

**Memory Efficiency**:
- Only visible clusters + buffer zone are kept in memory as DOM elements
- Placeholder clusters consume minimal memory (just height and basic styling)
- First two clusters remain loaded as reference points

### Implementation Details

#### Data Structure
Each log entry is a JavaScript object:
```javascript
{
    timestamp: Date,
    level: 'INFO' | 'WARN' | 'ERROR',
    message: string
}
```

#### DOM Structure
```html
<div class="table-body">
    <div class="log-cluster loaded-cluster" data-cluster-index="0">
        <div class="log-row">...</div>
        <!-- 50 log rows -->
    </div>
    <div class="log-cluster placeholder-cluster" data-cluster-index="1">
        <!-- Placeholder with calculated height -->
    </div>
    <!-- More clusters... -->
</div>
```

#### Cluster State Management
- **Loaded Clusters**: `Map<clusterIndex, DOMElement>` - Tracks clusters with actual content
- **Visible Clusters**: `Set<clusterIndex>` - Tracks clusters in viewport + buffer
- **Current Viewport**: `Set<clusterIndex>` - Currently active clusters

### Key Functions

#### Core Rendering
- `generateLogData()` - Creates mock log entries
- `renderLogData()` - Sets up initial virtual scroll structure
- `createClusterElement(index)` - Creates cluster with actual log rows
- `createPlaceholderCluster(index)` - Creates lightweight placeholder

#### Virtual Scrolling
- `initializeVirtualScrollObserver()` - Sets up Intersection Observer
- `handleVirtualScrollVisibility(entries)` - Processes visibility changes
- `loadCluster(index)` - Converts placeholder to loaded cluster
- `unloadCluster(index)` - Converts loaded cluster back to placeholder

#### Visibility Tracking
- `getVisibleClusters()` - Returns array of visible cluster indices
- `getVisibleLogIndices()` - Calculates which log entries are visible
- `updateClusterLoading()` - Manages cluster loading/unloading

### Performance Benefits

1. **Constant Memory Usage**: Memory consumption remains stable regardless of dataset size
2. **Smooth Scrolling**: 60fps scrolling performance even with 100k+ items
3. **Fast Initial Load**: Only renders what's immediately needed
4. **Responsive UI**: Debounced updates prevent UI blocking
5. **Scalable**: Can handle datasets of any size with consistent performance

### Usage in Your Codebase

To integrate this cluster scroller into your own project:

1. **Adapt the Data Structure**: Modify `generateLogData()` to use your actual data source
2. **Customize Cluster Size**: Adjust `CLUSTER_SIZE` based on your data complexity and performance requirements
3. **Modify Row Rendering**: Update `createLogRowElement()` to match your data format and styling
4. **Configure Buffer Zone**: Adjust `rootMargin` in the Intersection Observer options for your use case
5. **Style Integration**: Adapt the CSS classes to match your application's design system

### Configuration Options

```javascript
const CLUSTER_SIZE = 50;        // Logs per cluster (adjust based on row complexity)
const TOTAL_LOGS = 100000;      // Total dataset size
const DEBOUNCE_DELAY = 150;     // Debounce delay for cluster updates (ms)

// Intersection Observer options
const options = {
    rootMargin: '200px 0px 200px 0px',  // Buffer zone size
    threshold: 0.01                      // Visibility threshold
};
```

This implementation provides a robust foundation for rendering large datasets efficiently in web applications while maintaining smooth user experience and optimal memory usage.
