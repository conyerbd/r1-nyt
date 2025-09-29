import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [logs, setLogs] = useState([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [testMethod, setTestMethod] = useState('all');
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
    setLogs(prev => [...prev, `${timestamp}: ${message}`].slice(-50)); // Keep last 50 logs
  };

  // Test Method 1: Document-level wheel event with passive: false
  useEffect(() => {
    if (testMethod !== 'method1' && testMethod !== 'all') return;

    const handleWheel = (e) => {
      addLog(`M1 wheel: deltaY=${e.deltaY}, deltaX=${e.deltaX}, deltaMode=${e.deltaMode}`);
      e.preventDefault();
      e.stopPropagation();
      
      if (scrollTestRef.current) {
        scrollTestRef.current.scrollTop += e.deltaY > 0 ? 30 : -30;
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    addLog('Method 1 activated: document wheel (passive:false, capture:true)');

    return () => {
      document.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [testMethod]);

  // Test Method 2: Document-level wheel event with passive: true
  useEffect(() => {
    if (testMethod !== 'method2' && testMethod !== 'all') return;

    const handleWheel = (e) => {
      addLog(`M2 wheel: deltaY=${e.deltaY}, deltaX=${e.deltaX}`);
      
      if (scrollTestRef.current) {
        scrollTestRef.current.scrollTop += e.deltaY > 0 ? 30 : -30;
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: true });
    addLog('Method 2 activated: document wheel (passive:true)');

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, [testMethod]);

  // Test Method 3: Window-level wheel event
  useEffect(() => {
    if (testMethod !== 'method3' && testMethod !== 'all') return;

    const handleWheel = (e) => {
      addLog(`M3 window wheel: deltaY=${e.deltaY}`);
      e.preventDefault();
      
      if (scrollTestRef.current) {
        scrollTestRef.current.scrollTop += e.deltaY > 0 ? 30 : -30;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    addLog('Method 3 activated: window wheel');

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [testMethod]);

  // Test Method 4: Legacy mousewheel event
  useEffect(() => {
    if (testMethod !== 'method4' && testMethod !== 'all') return;

    const handleMouseWheel = (e) => {
      addLog(`M4 mousewheel: wheelDelta=${e.wheelDelta}`);
      e.preventDefault();
      
      if (scrollTestRef.current) {
        scrollTestRef.current.scrollTop += e.wheelDelta < 0 ? 30 : -30;
      }
    };

    document.addEventListener('mousewheel', handleMouseWheel, { passive: false });
    addLog('Method 4 activated: mousewheel event');

    return () => {
      document.removeEventListener('mousewheel', handleMouseWheel);
    };
  }, [testMethod]);

  // Test Method 5: Firefox DOMMouseScroll event
  useEffect(() => {
    if (testMethod !== 'method5' && testMethod !== 'all') return;

    const handleDOMMouseScroll = (e) => {
      addLog(`M5 DOMMouseScroll: detail=${e.detail}`);
      e.preventDefault();
      
      if (scrollTestRef.current) {
        scrollTestRef.current.scrollTop += e.detail > 0 ? 30 : -30;
      }
    };

    document.addEventListener('DOMMouseScroll', handleDOMMouseScroll, { passive: false });
    addLog('Method 5 activated: DOMMouseScroll');

    return () => {
      document.removeEventListener('DOMMouseScroll', handleDOMMouseScroll);
    };
  }, [testMethod]);

  // Test Method 6: Container-level wheel event
  useEffect(() => {
    if (testMethod !== 'method6' && testMethod !== 'all') return;

    const container = scrollTestRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      addLog(`M6 container wheel: deltaY=${e.deltaY}`);
      e.preventDefault();
      e.stopPropagation();
      
      container.scrollTop += e.deltaY > 0 ? 30 : -30;
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    addLog('Method 6 activated: container wheel');

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [testMethod]);

  // Arrow key listener for comparison
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        addLog(`Key: ${e.key}`);
        e.preventDefault();
        
        if (scrollTestRef.current) {
          scrollTestRef.current.scrollTop += e.key === 'ArrowDown' ? 30 : -30;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    addLog('Keyboard listener activated');

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Monitor scroll position
  useEffect(() => {
    const container = scrollTestRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollPosition(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Test Method 7: R1 Custom Events (scrollUp/scrollDown)
  useEffect(() => {
    if (testMethod !== 'method7' && testMethod !== 'all') return;

    const handleScrollUp = () => {
      addLog('M7 R1 scrollUp event!');
      if (scrollTestRef.current) {
        scrollTestRef.current.scrollTop -= 30;
      }
    };

    const handleScrollDown = () => {
      addLog('M7 R1 scrollDown event!');
      if (scrollTestRef.current) {
        scrollTestRef.current.scrollTop += 30;
      }
    };

    window.addEventListener('scrollUp', handleScrollUp);
    window.addEventListener('scrollDown', handleScrollDown);
    addLog('Method 7 activated: R1 custom scrollUp/scrollDown events');

    return () => {
      window.removeEventListener('scrollUp', handleScrollUp);
      window.removeEventListener('scrollDown', handleScrollDown);
    };
  }, [testMethod]);

  // Touch events for debugging
  useEffect(() => {
    const handleTouch = (e) => {
      addLog(`Touch: ${e.type}`);
    };

    document.addEventListener('touchstart', handleTouch);
    document.addEventListener('touchmove', handleTouch);
    document.addEventListener('touchend', handleTouch);

    return () => {
      document.removeEventListener('touchstart', handleTouch);
      document.removeEventListener('touchmove', handleTouch);
      document.removeEventListener('touchend', handleTouch);
    };
  }, []);

  return (
    <div className="viewport">
      <div className="App">
        <header className="debug-header">
          <h1>Scroll Wheel Debug</h1>
          <div className="debug-info">
            Scroll Pos: {scrollPosition}px
          </div>
        </header>

        <div className="debug-controls">
          <button 
            className={testMethod === 'all' ? 'active' : ''}
            onClick={() => { setTestMethod('all'); addLog('Testing all methods'); }}
          >
            All
          </button>
          <button 
            className={testMethod === 'method1' ? 'active' : ''}
            onClick={() => { setTestMethod('method1'); addLog('Testing method 1'); }}
          >
            M1
          </button>
          <button 
            className={testMethod === 'method2' ? 'active' : ''}
            onClick={() => { setTestMethod('method2'); addLog('Testing method 2'); }}
          >
            M2
          </button>
          <button 
            className={testMethod === 'method3' ? 'active' : ''}
            onClick={() => { setTestMethod('method3'); addLog('Testing method 3'); }}
          >
            M3
          </button>
          <button 
            className={testMethod === 'method4' ? 'active' : ''}
            onClick={() => { setTestMethod('method4'); addLog('Testing method 4'); }}
          >
            M4
          </button>
          <button 
            className={testMethod === 'method5' ? 'active' : ''}
            onClick={() => { setTestMethod('method5'); addLog('Testing method 5'); }}
          >
            M5
          </button>
          <button 
            className={testMethod === 'method6' ? 'active' : ''}
            onClick={() => { setTestMethod('method6'); addLog('Testing method 6'); }}
          >
            M6
          </button>
          <button 
            className={testMethod === 'method7' ? 'active' : ''}
            onClick={() => { setTestMethod('method7'); addLog('Testing method 7'); }}
          >
            M7
          </button>
          <button onClick={() => { setLogs([]); addLog('Logs cleared'); }}>
            Clear
          </button>
        </div>

        <div className="scroll-test-area" ref={scrollTestRef}>
          <div className="test-content">
            <h3>Test Scrollable Content</h3>
            <p>Try scrolling with the scroll wheel...</p>
            {[...Array(30)].map((_, i) => (
              <div key={i} className="test-item">
                Item {i + 1} - This is test content to scroll through
              </div>
            ))}
          </div>
        </div>

        <div className="log-container" ref={logContainerRef}>
          <div className="log-header">Event Log:</div>
          <div className="log-content">
            {logs.length === 0 ? (
              <div className="log-empty">Waiting for events...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="log-entry">{log}</div>
              ))
            )}
          </div>
        </div>

        <div className="method-legend">
          <div>M1: doc wheel (passive:false, capture)</div>
          <div>M2: doc wheel (passive:true)</div>
          <div>M3: window wheel</div>
          <div>M4: mousewheel</div>
          <div>M5: DOMMouseScroll</div>
          <div>M6: container wheel</div>
          <div className="highlight">M7: R1 custom scrollUp/Down ⭐</div>
        </div>
      </div>
    </div>
  );
}

export default App;