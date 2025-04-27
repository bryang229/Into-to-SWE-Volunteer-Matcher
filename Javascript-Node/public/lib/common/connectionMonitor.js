// Monitors browser network status and Firestore reconnection state

import { getFirestore, onSnapshot, doc } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

// Create the status banner (hidden by default)
const statusBanner = document.createElement('div');
statusBanner.id = 'connectionStatus';
statusBanner.textContent = 'Connection lost. Trying to reconnect...';
statusBanner.className = 'connection-status-banner';
document.body.appendChild(statusBanner);

let isConnected = true;
let networkInterval = null;

export function monitorConnection({ dotId } = {}) {
  const db = getFirestore();

  // Listen for browser offline/online events first
  window.addEventListener('offline', () => {
    handleDisconnected();
  });

  window.addEventListener('online', () => {
    handleConnected(true);
  });

  // Visibility change for pausing/resuming connection checks
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopNetworkCheck();
    } else {
      startNetworkCheck();
    }
  });

  // Dummy Firestore document to force connection metadata
  const dummyDoc = doc(db, 'system/connectionTest');

  onSnapshot(dummyDoc, {
    includeMetadataChanges: true
  }, (snapshot) => {
    const metadata = snapshot.metadata;
    if (metadata.hasPendingWrites || !snapshot.exists) {
      handleDisconnected();
    } else {
      handleConnected(false);
    }
  }, (error) => {
    console.warn('Connection monitoring error:', error);
    handleDisconnected();
  });

  startNetworkCheck();
}

let globalDotId = null; // Default


function updateDot(isOnline) {
  if (!globalDotId) return;

  const dot = document.getElementById(globalDotId);
  if (!dot) return;

  if (isOnline) {
    dot.classList.remove('offline');
  } else {
    dot.classList.add('offline');
  }
}

function handleDisconnected() {
    if (!isConnected) {
      return;
    }
    isConnected = false;
  
    statusBanner.textContent = 'Connection lost. Trying to reconnect...';
    statusBanner.style.backgroundColor = '#FFA500';
    statusBanner.classList.add('show');
  
    updateDot(false); // Set dot to orange (offline)
  }
  
  function handleConnected(fromBrowser) {
    if (isConnected && !fromBrowser) {
      return;
    }
    isConnected = true;
  
    if (fromBrowser) {
      statusBanner.textContent = 'Connected';
      statusBanner.style.backgroundColor = '#28a745';
      statusBanner.classList.add('show');
  
      setTimeout(() => {
        statusBanner.classList.remove('show');
      }, 1200);
    } else {
      statusBanner.classList.remove('show');
    }
  
    updateDot(true); // Set dot to green (online)
  }

function startNetworkCheck() {
  if (networkInterval) return;
  networkInterval = setInterval(() => {
    if (!navigator.onLine) {
      handleDisconnected();
    }
  }, 2000);
}

function stopNetworkCheck() {
  if (networkInterval) {
    clearInterval(networkInterval);
    networkInterval = null;
  }
}
