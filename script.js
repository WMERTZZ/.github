// script.js

const rssFeeds = [
  "https://www.boredpanda.com/rss",
  "https://rss.app/feeds/aDMytH2xyqR6dF2M.xml"
];

let allPosts = [];
let seenLinks = new Set();

// Generate a slug from the original URL (removing the domain)
function generateSlug(link) {
  try {
    let url = new URL(link);
    let slug = url.pathname;
    // Remove leading and trailing slashes
    slug = slug.replace(/^\\//, '').replace(/\\/$/, '');
    return slug || encodeURIComponent(link);
  } catch(e) {
    return encodeURIComponent(link);
  }
}

// Fetch and process RSS feeds
async function fetchRSS() {
  let posts = [];
  for (const feed of rssFeeds) {
    try {
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}`);
      const data = await response.json();
      if (data.items) {
        for (const item of data.items) {
          if (!seenLinks.has(item.link)) {
            seenLinks.add(item.link);
            // Generate a custom slug from the original URL
            item.slug = generateSlug(item.link);
            posts.push(item);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching feed:', feed, err);
    }
  }
  // Prepend new posts so they appear first
  allPosts = [...posts, ...allPosts];
  // Sort posts by publication date (newest first)
  allPosts.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  updateCategories();
  router(); // refresh view based on current route
}

// Build navigation categories from post categories
function updateCategories() {
  const categorySet = new Set();
  allPosts.forEach(post => {
    if (post.categories && post.categories.length > 0) {
      post.categories.forEach(cat => categorySet.add(cat));
    }
  });
  const categoriesEl = document.getElementById('categories');
  if (categoriesEl) {
    categoriesEl.innerHTML = '';
    categorySet.forEach(cat => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="#category/${encodeURIComponent(cat)}">${cat}</a>`;
      categoriesEl.appendChild(li);
    });
  }
}

// Render the home view with featured news, latest news, and hot gallery
function renderHome(filteredPosts = allPosts) {
  const newsList = document.getElementById('news-list');
  const featuredList = document.getElementById('featured-list');
  const hotGallery = document.getElementById('hot-gallery-list');
  
  if (!newsList || !featuredList || !hotGallery) return;
  
  // Clear containers
  newsList.innerHTML = '';
  featuredList.innerHTML = '';
  hotGallery.innerHTML = '';
  
  // Featured posts (first 3)
  filteredPosts.slice(0, 3).forEach(post => {
    const article = document.createElement('div');
    article.className = 'news-item featured';
    article.innerHTML = `
      <a href="#post/${post.slug}">
        <img src="${post.thumbnail || 'placeholder.jpg'}" alt="News Image">
        <h3>${post.title}</h3>
        <p>${post.contentSnippet || ''}</p>
        <small>${new Date(post.pubDate).toLocaleDateString()}</small>
      </a>
    `;
    featuredList.appendChild(article);
  });
  
  // Latest news (the rest)
  filteredPosts.slice(3).forEach(post => {
    const article = document.createElement('div');
    article.className = 'news-item';
    article.innerHTML = `
      <a href="#post/${post.slug}">
        <img src="${post.thumbnail || 'placeholder.jpg'}" alt="News Image">
        <h3>${post.title}</h3>
        <p>${post.contentSnippet || ''}</p>
        <small>${new Date(post.pubDate).toLocaleDateString()}</small>
      </a>
    `;
    newsList.appendChild(article);
  });
  
  // Hot Gallery (up to 50 posts)
  filteredPosts.slice(0, 50).forEach(post => {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    galleryItem.innerHTML = `
      <a href="#post/${post.slug}">
        <img src="${post.thumbnail || 'placeholder.jpg'}" alt="Gallery Image">
      </a>
    `;
    hotGallery.appendChild(galleryItem);
  });
}

// Render a full post view on your site with complete content
function renderPost(slug) {
  const post = allPosts.find(p => p.slug === slug);
  const mainEl = document.querySelector('main');
  if (!post) {
    mainEl.innerHTML = '<p>Post not found</p>';
    return;
  }
  
  // Render the full post (excluding author, including date and full content)
  mainEl.innerHTML = `
    <article class="full-post">
      <h2>${post.title}</h2>
      <p class="post-date">${new Date(post.pubDate).toLocaleString()}</p>
      <img src="${post.thumbnail || 'placeholder.jpg'}" alt="Post Image">
      <div class="post-content">${post.content}</div>
      <a href="#home" class="back-button">&larr; Back</a>
    </article>
  `;
}

// Simple client-side router based on URL hash
function router() {
  const hash = window.location.hash;
  if (hash.startsWith('#post/')) {
    // Extract slug from "#post/slug"
    const slug = hash.substring(6);
    renderPost(slug);
  } else if (hash.startsWith('#category/')) {
    const cat = decodeURIComponent(hash.split('/')[1]);
    const filteredPosts = allPosts.filter(post => post.categories && post.categories.includes(cat));
    renderHome(filteredPosts);
  } else {
    // Default home view
    renderHome();
  }
}

window.addEventListener('hashchange', router);

// Initial fetch and routing
fetchRSS();
router();

// Re-fetch new posts every 30 minutes
setInterval(fetchRSS, 1800000);
