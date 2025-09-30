import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const articlesContainerRef = useRef(null);
  const lastScrollTimeRef = useRef(Date.now());

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

  // Scroll wheel and keyboard functionality for Rabbit R1 device
  useEffect(() => {
    const scrollContainer = (direction) => {
      if (articlesContainerRef.current) {
        const container = articlesContainerRef.current;
        
        // Calculate velocity-based scroll amount
        const now = Date.now();
        const timeDelta = now - lastScrollTimeRef.current;
        lastScrollTimeRef.current = now;
        
        // Determine scroll amount based on velocity
        // Fast scrolling (< 100ms between events) = larger jumps (30-40px)
        // Medium scrolling (100-300ms) = medium jumps (20-30px)
        // Slow scrolling (> 300ms) = small jumps (10-20px)
        let scrollAmount;
        if (timeDelta < 100) {
          scrollAmount = 35; // Fast
        } else if (timeDelta < 300) {
          scrollAmount = 22; // Medium
        } else {
          scrollAmount = 12; // Slow/deliberate
        }
        
        container.scrollBy({
          top: direction * scrollAmount,
          behavior: 'smooth'
        });
      }
    };

    // R1 scroll wheel events: directions are flipped!
    // "scrollUp" = wheel turns up = moves content DOWN (increase scrollTop)
    // "scrollDown" = wheel turns down = moves content UP (decrease scrollTop)
    const handleScrollDown = (event) => {
      event.preventDefault();
      scrollContainer(-1); // scrollDown event = moves content UP
    };

    const handleScrollUp = (event) => {
      event.preventDefault();
      scrollContainer(1); // scrollUp event = moves content DOWN
    };

    const handleKeyDown = (event) => {
      // Handle arrow keys for additional navigation support
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          scrollContainer(-1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          scrollContainer(1);
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

    // Cleanup event listeners on component unmount
    return () => {
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