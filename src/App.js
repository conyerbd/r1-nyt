import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [logs, setLogs] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [scrollPosition, setScrollPosition] = useState(0);
  const logContainerRef = useRef(null);
  const scrollTestRef = useRef(null);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
    setLogs(prev => [...prev, `${timestamp}: ${message}`].slice(-100)); // Keep last 100 logs
  };

  // Comprehensive device detection on mount
  useEffect(() => {
    addLog('=== DEVICE DETECTION START ===');
    
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    };

    // Check for R1-specific APIs
    const r1Objects = [
      'PluginMessageHandler',
      'closeWebView',
      'TouchEventHandler',
      'creationStorage',
      'creationSensors',
      'rabbitOS',
      'r1Device',
      'r1SDK',
      'rabbitSDK',
      'android',
      'webkit'
    ];

    r1Objects.forEach(obj => {
      if (window[obj]) {
        info[obj] = 'EXISTS';
        addLog(`✓ Found: window.${obj}`);
        // Log methods if it's an object
        if (typeof window[obj] === 'object') {
          const methods = Object.keys(window[obj]);
          addLog(`  Methods: ${methods.join(', ')}`);
        }
      }
    });

    // Check for special properties
    if (window.rabbitOS || window.r1Device || window.r1SDK) {
      addLog('R1 DEVICE DETECTED!');
    } else {
      addLog('No R1-specific objects found');
    }

    setDeviceInfo(info);
    addLog('=== DEVICE DETECTION END ===');
    addLog('');
    addLog('Now try scrolling...');
  }, []);

  // Listen for EVERY possible event type
  useEffect(() => {
    const allEventTypes = [
      // Standard wheel events
      'wheel', 'mousewheel', 'DOMMouseScroll',
      // R1 custom events - THE ACTUAL ONES
      'scrollUp', 'scrollDown',
      // Touch events
      'touchstart', 'touchmove', 'touchend', 'touchcancel',
      // Pointer events
      'pointerdown', 'pointermove', 'pointerup', 'pointercancel',
      // Mouse events
      'mousedown', 'mousemove', 'mouseup',
      // Key events
      'keydown', 'keyup', 'keypress',
      // Gesture events (WebKit)
      'gesturestart', 'gesturechange', 'gestureend',
      // Custom potential R1 events
      'r1scroll', 'r1wheel', 'r1input', 'rabbitscroll',
      'scrollwheel', 'scroll-wheel', 'wheelscroll',
      // Side button events (from polyfills)
      'sideClick', 'longPressStart', 'longPressEnd'
    ];

    const handlers = {};

    allEventTypes.forEach(eventType => {
      const handler = (e) => {
        let details = `type=${e.type}`;
        
        // Add target information
        let targetInfo = 'unknown';
        if (e.target === window) targetInfo = 'window';
        else if (e.target === document) targetInfo = 'document';
        else if (e.target === scrollTestRef.current) targetInfo = 'container';
        else if (e.target?.nodeName) targetInfo = e.target.nodeName;
        details += `, target=${targetInfo}`;
        
        // Add relevant details based on event type
        if (e.deltaY !== undefined) details += `, deltaY=${e.deltaY}`;
        if (e.deltaX !== undefined) details += `, deltaX=${e.deltaX}`;
        if (e.wheelDelta !== undefined) details += `, wheelDelta=${e.wheelDelta}`;
        if (e.detail !== undefined) details += `, detail=${e.detail}`;
        if (e.key) details += `, key=${e.key}`;
        if (e.touches) details += `, touches=${e.touches.length}`;
        
        // Only log non-container scroll events to reduce noise
        if (e.type !== 'scroll' || e.target !== scrollTestRef.current) {
          addLog(`EVENT: ${details}`);
        }
        
        // Handle scrolling based on event type
        if (scrollTestRef.current) {
          let scrollAmount = 0;
          
          // R1 custom events: directions are flipped!
          // "scrollUp" = wheel turns up = moves content DOWN (increase scrollTop)
          // "scrollDown" = wheel turns down = moves content UP (decrease scrollTop)
          if (e.type === 'scrollDown') {
            scrollAmount = -40; // scrollDown event = moves content UP
            addLog(`→ SCROLLDOWN: applying -40`);
          } else if (e.type === 'scrollUp') {
            scrollAmount = 40; // scrollUp event = moves content DOWN
            addLog(`→ SCROLLUP: applying +40`);
          }
          // Standard wheel events (for web testing)
          else if (e.deltaY !== undefined && e.type === 'wheel') {
            scrollAmount = e.deltaY > 0 ? 40 : -40;
          } else if (e.wheelDelta !== undefined) {
            scrollAmount = e.wheelDelta < 0 ? 40 : -40;
          } else if (e.detail !== undefined && e.type === 'DOMMouseScroll') {
            scrollAmount = e.detail > 0 ? 40 : -40;
          }
          
          if (scrollAmount !== 0) {
            const oldScroll = scrollTestRef.current.scrollTop;
            scrollTestRef.current.scrollTop += scrollAmount;
            const newScroll = scrollTestRef.current.scrollTop;
            addLog(`  Applied: ${oldScroll} → ${newScroll}`);
          }
        }
      };

      handlers[eventType] = handler;

      // Add listeners at different levels
      window.addEventListener(eventType, handler, { passive: false, capture: true });
      document.addEventListener(eventType, handler, { passive: false, capture: true });
    });

    addLog(`Listening for ${allEventTypes.length} event types...`);

    return () => {
      allEventTypes.forEach(eventType => {
        window.removeEventListener(eventType, handlers[eventType], { capture: true });
        document.removeEventListener(eventType, handlers[eventType], { capture: true });
      });
    };
  }, []);

  // Monitor scroll position
  useEffect(() => {
    const container = scrollTestRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollPosition(container.scrollTop);
      addLog(`Scroll position: ${container.scrollTop}px`);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if messages are being sent via postMessage or other mechanisms
  useEffect(() => {
    const handleMessage = (e) => {
      addLog(`MESSAGE received: ${JSON.stringify(e.data)}`);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="viewport">
      <div className="App">
        <header className="debug-header">
          <h1>R1 Scroll Debug <span className="version">v2.8</span></h1>
          <div className="debug-info">
            Scroll: {scrollPosition}px | Events: {logs.length}
          </div>
        </header>

        <div className="device-info">
          <div className="info-title">Device Info:</div>
          <div className="info-content">
            {deviceInfo.userAgent && (
              <div className="info-item">UA: {deviceInfo.userAgent.substring(0, 30)}...</div>
            )}
            <div className="info-item">
              Screen: {deviceInfo.screenWidth}x{deviceInfo.screenHeight}
            </div>
            <div className="info-item">
              Viewport: {deviceInfo.innerWidth}x{deviceInfo.innerHeight}
            </div>
            {Object.keys(deviceInfo).filter(k => !['userAgent', 'platform', 'screenWidth', 'screenHeight', 'innerWidth', 'innerHeight'].includes(k)).map(key => (
              <div key={key} className="info-item r1-api">
                {key}: {deviceInfo[key]}
              </div>
            ))}
          </div>
        </div>

        <div className="scroll-test-area" ref={scrollTestRef}>
          <div className="test-content">
            <h3>Scrollable Test Area</h3>
            <p>Try using the scroll wheel now...</p>
            <p>Any detected events will appear in the log below.</p>
            {[...Array(50)].map((_, i) => (
              <div key={i} className="test-item">
                Line {i + 1} - Test scrolling content
              </div>
            ))}
          </div>
        </div>

        <div className="log-container" ref={logContainerRef}>
          <div className="log-header">
            Event Log: ({logs.length} events)
            <button className="clear-btn" onClick={() => setLogs([])}>Clear</button>
          </div>
          <div className="log-content">
            {logs.length === 0 ? (
              <div className="log-empty">Waiting for events...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={`log-entry ${log.includes('EVENT:') ? 'log-event' : ''}`}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="instructions">
          <div>🔍 Listening for ALL event types</div>
          <div>🎯 Try: scroll wheel, touch, keys, clicks</div>
          <div>📝 All events will be logged above</div>
        </div>
      </div>
    </div>
  );
}

export default App;