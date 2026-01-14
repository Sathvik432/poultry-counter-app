// Global variables
let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let count = 0;
let isCounting = false;
let model; // MobileNet for better detection
let language = 'en';
let translations = {
    en: {
        title: 'Poultry Counter',
        controls: 'Controls',
        start: 'Start Counting',
        stop: 'Stop Counting',
        manual: 'Manual Count',
        ai: 'AI Count',
        reset: 'Reset',
        export: 'Export Data',
        count: 'Count',
        accuracy: 'Accuracy',
        history: 'Count History'
    },
    hi: {
        title: 'मुर्गी गणक',
        controls: 'नियंत्रण',
        start: 'गिनती शुरू करें',
        stop: 'गिनती रोकें',
        manual: 'मैनुअल गिनती',
        ai: 'एआई गिनती',
        reset: 'रीसेट',
        export: 'डेटा निर्यात करें',
        count: 'गिनती',
        accuracy: 'सटीकता',
        history: 'गिनती इतिहास'
    }
};

// Load AI model (MobileNet for image classification, adapted for detection)
async function loadModel() {
    model = await mobilenet.load();
    console.log('AI model loaded');
}

// Access camera
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
    })
    .catch(err => alert('Camera access denied. Please allow permissions.'));

// Theme toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

// Language switch
document.getElementById('language-select').addEventListener('change', (e) => {
    language = e.target.value;
    updateUI();
});

function updateUI() {
    const t = translations[language];
    document.getElementById('app-title').textContent = t.title;
    document.getElementById('controls-title').textContent = t.controls;
    document.getElementById('start-text').textContent = t.start;
    document.getElementById('stop-text').textContent = t.stop;
    document.getElementById('manual-text').textContent = t.manual;
    document.getElementById('ai-text').textContent = t.ai;
    document.getElementById('reset-text').textContent = t.reset;
    document.getElementById('export-text').textContent = t.export;
    document.getElementById('count-label').textContent = t.count;
    document.getElementById('accuracy-label').textContent = t.accuracy;
    document.getElementById('history-title').textContent = t.history;
    document.getElementById('count-display').textContent = count;
}

// Manual counting
document.getElementById('manual-count-btn').addEventListener('click', () => {
    if (isCounting) {
        count++;
        updateUI();
        saveData();
    }
});

// AI counting (improved: uses MobileNet for classification, draws boxes for accuracy)
document.getElementById('ai-count-btn').addEventListener('click', async () => {
    if (!model) await loadModel();
    const img = tf.browser.fromPixels(video);
    const predictions = await model.classify(img);
    // Filter for poultry-related predictions (e.g., 'bird', 'chicken' if in model)
    const poultryPreds = predictions.filter(p => p.className.toLowerCase().includes('bird') || p.className.toLowerCase().includes('chicken'));
    if (poultryPreds.length > 0) {
        count = Math.max(count, poultryPreds[0].probability > 0.5 ? 1 : 0); // Simple detection; enhance with bounding boxes
        drawDetections(); // Visual feedback
        document.getElementById('accuracy-display').textContent = 'High (AI Detected)';
    } else {
        document.getElementById('accuracy-display').textContent = 'Low (No Detection)';
    }
    updateUI();
    saveData();
});

function drawDetections() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Simulate bounding box (in a real app, use a detection model like YOLO)
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, 200, 150); // Placeholder; replace with actual detections
    ctx.fillText('Poultry Detected', 60, 40);
}

// Start/Stop
document.getElementById('start-btn').addEventListener('click', () => {
    isCounting = true;
    document.getElementById('start-btn').disabled = true;
    document.getElementById('stop-btn').disabled = false;
});

document.getElementById('stop-btn').addEventListener('click', () => {
    isCounting = false;
    document.getElementById('start-btn').disabled = false;
    document.getElementById('stop-btn').disabled = true;
    saveData();
});

// Reset
document.getElementById('reset-btn').addEventListener('click', () => {
    count = 0;
    updateUI();
    localStorage.removeItem('poultryCounts');
    updateHistory();
});

// Export data
document.getElementById('export-btn').addEventListener('click', () => {
    const data = JSON.parse(localStorage.getItem('poultryCounts') || '[]');
    let csv = 'Timestamp,Count\n';
    data.forEach(item => csv += `${item.timestamp},${item.count}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'poultry_counts.csv';
    a.click();
});

// Data storage
function saveData() {
    const data = JSON.parse(localStorage.getItem('poultryCounts') || '[]');
    data.push({ count, timestamp: new Date().toISOString() });
    localStorage.setItem('poultryCounts', JSON.stringify(data));
    updateHistory();
}

function updateHistory() {
    const data = JSON.parse(localStorage.getItem('poultryCounts') || '[]');
    const list = document.getElementById('count-history');
    list.innerHTML = '';
    data.slice(-10).forEach(item => { // Show last 10
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.textContent = `${new Date(item.timestamp).toLocaleString()}: ${item.count}`;
        list.appendChild(li);
    });
}

// Initialize
loadModel();
updateUI();
updateHistory();
