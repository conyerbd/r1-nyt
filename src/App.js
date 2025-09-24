import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const articlesContainerRef = useRef(null);

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
        const scrollAmount = 60; // Pixels to scroll per step
        const newScrollTop = container.scrollTop + (direction * scrollAmount);
        
        // Smooth scroll to new position
        container.scrollTo({
          top: newScrollTop,
          behavior: 'smooth'
        });
      }
    };

    const handleWheel = (event) => {
      event.preventDefault();
      // Determine scroll direction based on wheel delta
      const scrollDirection = event.deltaY > 0 ? 1 : -1;
      scrollContainer(scrollDirection);
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

    const articlesContainer = articlesContainerRef.current;

    if (articlesContainer) {
      articlesContainer.addEventListener('wheel', handleWheel, { passive: false });
      // Add keydown listener to the container, and make it focusable
      articlesContainer.setAttribute('tabindex', '0');
      articlesContainer.addEventListener('keydown', handleKeyDown);
      articlesContainer.focus();
    }

    // Cleanup event listeners on component unmount
    return () => {
      if (articlesContainer) {
        articlesContainer.removeEventListener('wheel', handleWheel);
        articlesContainer.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []); // Run this effect only once after the component mounts

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
              <h2 className="article-title">
                <a href={article.link} target="_blank" rel="noopener noreferrer">
                  {article.title}
                </a>
              </h2>
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