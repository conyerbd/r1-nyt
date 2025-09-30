import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const articlesContainerRef = useRef(null);
  
  // Smooth scrolling state
  const scrollVelocityRef = useRef(0);
  const scrollDirectionRef = useRef(0);
  const lastTickTimeRef = useRef(Date.now());
  const animationFrameRef = useRef(null);
  const scrollBufferRef = useRef([]);

  useEffect(() => {
    const fetchRSSFeed = async () => {
      try {
        // Using a CORS proxy to fetch the RSS feed
        const response = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'));
        const data = await response.json();
        
        // Parse the XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data.contents, 'text/xml');
        const items = xmlDoc.querySelectorAll('item');
        
        const parsedArticles = Array.from(items).slice(0, 15).map(item => ({
          title: item.querySelector('title')?.textContent || '',
          link: item.querySelector('link')?.textContent || '',
          description: item.querySelector('description')?.textContent || '',
          pubDate: item.querySelector('pubDate')?.textContent || '',
          category: item.querySelector('category')?.textContent || ''
        }));
        
        setArticles(parsedArticles);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch RSS feed');
        setLoading(false);
        console.error('Error fetching RSS:', err);
      }
    };

    fetchRSSFeed();
  }, []);

  // Smooth scrolling with momentum and buffering for Rabbit R1 device
  useEffect(() => {
    // Constants for smooth scrolling
    const BASE_VELOCITY = 2;        // Start slow
    const MAX_VELOCITY = 15;        // Max speed when accelerating
    const ACCELERATION = 0.8;       // How fast we speed up
    const DECELERATION = 0.92;      // How fast we slow down (0.92 = retain 92% velocity each frame)
    const VELOCITY_THRESHOLD = 0.1; // Stop scrolling below this velocity
    const TICK_TIMEOUT = 150;       // Time to consider scrolling stopped (ms)
    
    // Smooth animation loop using requestAnimationFrame
    const animateScroll = () => {
      if (!articlesContainerRef.current) return;
      
      const container = articlesContainerRef.current;
      const now = Date.now();
      const timeSinceLastTick = now - lastTickTimeRef.current;
      
      // Check if we've received scroll ticks recently
      if (scrollBufferRef.current.length > 0 && timeSinceLastTick < TICK_TIMEOUT) {
        // We're actively scrolling - accelerate velocity
        const direction = scrollDirectionRef.current;
        scrollVelocityRef.current = Math.min(
          scrollVelocityRef.current + ACCELERATION,
          MAX_VELOCITY
        );
        
        // Apply the scroll
        if (Math.abs(scrollVelocityRef.current) > VELOCITY_THRESHOLD) {
          container.scrollTop += direction * scrollVelocityRef.current;
        }
        
        // Continue animation
        animationFrameRef.current = requestAnimationFrame(animateScroll);
      } else if (Math.abs(scrollVelocityRef.current) > VELOCITY_THRESHOLD) {
        // No recent ticks, but we have momentum - decelerate
        scrollVelocityRef.current *= DECELERATION;
        
        // Apply remaining momentum
        const direction = scrollDirectionRef.current;
        container.scrollTop += direction * scrollVelocityRef.current;
        
        // Continue animation
        animationFrameRef.current = requestAnimationFrame(animateScroll);
      } else {
        // Velocity too low, stop animation
        scrollVelocityRef.current = 0;
        scrollDirectionRef.current = 0;
        scrollBufferRef.current = [];
        animationFrameRef.current = null;
      }
    };
    
    // Handle individual scroll tick
    const handleScrollTick = (direction) => {
      const now = Date.now();
      
      // Add tick to buffer
      scrollBufferRef.current.push({ time: now, direction });
      
      // Clean old ticks from buffer (older than 200ms)
      scrollBufferRef.current = scrollBufferRef.current.filter(
        tick => now - tick.time < 200
      );
      
      // Update direction
      scrollDirectionRef.current = direction;
      lastTickTimeRef.current = now;
      
      // Start velocity from base if not already scrolling
      if (scrollVelocityRef.current < BASE_VELOCITY) {
        scrollVelocityRef.current = BASE_VELOCITY;
      }
      
      // Start animation loop if not already running
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(animateScroll);
      }
    };

    // R1 scroll wheel events: directions are flipped!
    // "scrollUp" = wheel turns up = moves content DOWN (increase scrollTop)
    // "scrollDown" = wheel turns down = moves content UP (decrease scrollTop)
    const handleScrollDown = (event) => {
      event.preventDefault();
      handleScrollTick(-1); // scrollDown event = moves content UP
    };

    const handleScrollUp = (event) => {
      event.preventDefault();
      handleScrollTick(1); // scrollUp event = moves content DOWN
    };

    const handleKeyDown = (event) => {
      // Handle arrow keys for additional navigation support
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          handleScrollTick(-1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          handleScrollTick(1);
          break;
        default:
          break;
      }
    };

    // Add R1 scroll wheel event listeners
    window.addEventListener('scrollDown', handleScrollDown, { passive: false, capture: true });
    window.addEventListener('scrollUp', handleScrollUp, { passive: false, capture: true });
    document.addEventListener('scrollDown', handleScrollDown, { passive: false, capture: true });
    document.addEventListener('scrollUp', handleScrollUp, { passive: false, capture: true });
    
    // Add keyboard listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup event listeners and animation on component unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('scrollDown', handleScrollDown, { capture: true });
      window.removeEventListener('scrollUp', handleScrollUp, { capture: true });
      document.removeEventListener('scrollDown', handleScrollDown, { capture: true });
      document.removeEventListener('scrollUp', handleScrollUp, { capture: true });
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [articles]); // Re-run when articles are loaded

  if (loading) {
  return (
    <div className="viewport">
      <div className="App">
          <div className="loading">loading nyt stories...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="viewport">
        <div className="App">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="viewport">
      <div className="App">
        <div className="version">v1.0</div>
        <header className="app-header">
          <h1>The New York Times</h1>
          <p className="last-updated">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>
        <main className="articles-container" ref={articlesContainerRef}>
          {articles.map((article, index) => (
            <article key={index} className="article-card">
              <h2 className="article-title">{article.title}</h2>
              {article.category && (
                <span className="article-category">{article.category}</span>
              )}
              <p className="article-description" 
                 dangerouslySetInnerHTML={{ __html: article.description }} />
              <time className="article-date">
                {new Date(article.pubDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </article>
          ))}
        </main>
      </div>
    </div>
  );
}

export default App;