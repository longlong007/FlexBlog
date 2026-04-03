// ============================================
// Blog App - Main JavaScript
// ============================================

// State
const state = {
  data: null,
  currentView: 'home',
  currentTopic: null,
  currentPost: null,
  searchQuery: '',
  selectedSearchIndex: 0
};

// DOM Elements
const elements = {
  topicSelect: document.getElementById('topicSelect'),
  categoryTree: document.getElementById('categoryTree'),
  topicsGrid: document.getElementById('topicsGrid'),
  recentPosts: document.getElementById('recentPosts'),
  topicView: document.getElementById('topicView'),
  topicHeader: document.getElementById('topicHeader'),
  topicCategories: document.getElementById('topicCategories'),
  topicPosts: document.getElementById('topicPosts'),
  postView: document.getElementById('postView'),
  articleContent: document.getElementById('articleContent'),
  articleToc: document.getElementById('articleToc'),
  aboutView: document.getElementById('aboutView'),
  homeView: document.getElementById('homeView'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebarOverlay'),
  menuBtn: document.getElementById('menuBtn'),
  sidebarClose: document.getElementById('sidebarClose'),
  searchBtn: document.getElementById('searchBtn'),
  searchModal: document.getElementById('searchModal'),
  searchInput: document.getElementById('searchInput'),
  searchResults: document.getElementById('searchResults'),
  searchClose: document.getElementById('searchClose'),
  readingProgress: document.getElementById('readingProgress'),
  backToTop: document.getElementById('backToTop')
};

// ============================================
// Initialize
// ============================================
async function init() {
  try {
    const response = await fetch('data/posts.json');
    state.data = await response.json();
    
    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    const topic = params.get('topic');
    const post = params.get('post');
    
    if (post) {
      renderPost(post);
    } else if (topic) {
      renderTopic(topic);
    } else {
      renderHome();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Initial UI updates
    updateTopicSelect();
    updateSidebarTree();
    updateBackToTop();
    
  } catch (error) {
    console.error('Failed to initialize:', error);
  }
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = e.target.getAttribute('href');
      if (href === '#about') {
        e.preventDefault();
        renderAbout();
      } else if (href === '/') {
        e.preventDefault();
        renderHome();
        history.pushState(null, '', window.location.pathname);
      }
    });
  });
  
  // Sidebar
  elements.menuBtn?.addEventListener('click', toggleSidebar);
  elements.sidebarClose?.addEventListener('click', closeSidebar);
  elements.sidebarOverlay?.addEventListener('click', closeSidebar);
  
  // Topic select
  elements.topicSelect?.addEventListener('change', (e) => {
    if (e.target.value) {
      renderTopic(e.target.value);
    } else {
      renderHome();
    }
  });
  
  // Search
  elements.searchBtn?.addEventListener('click', openSearch);
  elements.searchClose?.addEventListener('click', closeSearch);
  elements.searchModal?.addEventListener('click', (e) => {
    if (e.target === elements.searchModal) closeSearch();
  });
  elements.searchInput?.addEventListener('input', debounce(handleSearch, 200));
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // CMD/CTRL + K for search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
    // Escape to close
    if (e.key === 'Escape') {
      if (elements.searchModal?.classList.contains('hidden') === false) {
        closeSearch();
      }
    }
    // Arrow keys for search navigation
    if (!elements.searchModal?.classList.contains('hidden')) {
      const results = elements.searchResults?.querySelectorAll('.search-result-item');
      if (results && results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          state.selectedSearchIndex = Math.min(state.selectedSearchIndex + 1, results.length - 1);
          updateSearchSelection(results);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          state.selectedSearchIndex = Math.max(state.selectedSearchIndex - 1, 0);
          updateSearchSelection(results);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          results[state.selectedSearchIndex]?.click();
        }
      }
    }
  });
  
  // Scroll
  window.addEventListener('scroll', handleScroll);
  
  // Back to top
  elements.backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  
  // Popstate
  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const topic = params.get('topic');
    const post = params.get('post');
    
    if (post) {
      renderPost(post);
    } else if (topic) {
      renderTopic(topic);
    } else {
      renderHome();
    }
  });
}

// ============================================
// Render Functions
// ============================================
function renderHome() {
  state.currentView = 'home';
  state.currentTopic = null;
  state.currentPost = null;
  
  showView('home');
  renderTopicsGrid();
  renderRecentPosts();
  closeSidebar();
}

function renderTopic(topicId) {
  const topic = state.data.topics.find(t => t.id === topicId);
  if (!topic) return renderHome();
  
  state.currentView = 'topic';
  state.currentTopic = topicId;
  state.currentPost = null;
  
  showView('topic');
  
  // Header
  elements.topicHeader.innerHTML = `
    <div class="topic-header-icon">${topic.icon}</div>
    <h1 class="topic-header-title">${topic.name}</h1>
    <p class="topic-header-desc">${topic.description}</p>
  `;
  
  // Categories
  renderTopicCategories(topic);
  
  // All posts in this topic
  renderTopicPosts(topicId);
  
  closeSidebar();
  updateURL({ topic: topicId });
}

function renderTopicCategories(topic) {
  const categories = flattenCategories(topic.categories);
  
  if (categories.length === 0) {
    elements.topicCategories.innerHTML = '';
    return;
  }
  
  elements.topicCategories.innerHTML = categories.map(cat => `
    <div class="topic-category" data-path="${cat.path}">
      <div class="topic-category-header">
        <span class="topic-category-icon">📁</span>
        <span class="topic-category-name">${cat.name}</span>
        <span class="topic-category-path">${cat.path}</span>
      </div>
    </div>
  `).join('');
}

function renderTopicPosts(topicId) {
  const posts = Object.entries(state.data.posts)
    .filter(([_, post]) => post.topic === topicId)
    .map(([id, post]) => ({ id, ...post }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (posts.length === 0) {
    elements.topicPosts.innerHTML = '<p class="empty-state">该分类下暂无文章</p>';
    return;
  }
  
  elements.topicPosts.innerHTML = posts.map(post => createPostCardHTML(post)).join('');
  attachPostCardListeners(elements.topicPosts);
}

function renderPost(postId) {
  const post = state.data.posts[postId];
  if (!post) return renderHome();
  
  state.currentView = 'post';
  state.currentTopic = post.topic;
  state.currentPost = postId;
  
  showView('post');
  
  // Article content
  const topic = state.data.topics.find(t => t.id === post.topic);
  
  elements.articleContent.innerHTML = `
    <header class="article-header">
      <h1 class="article-title">${post.title}</h1>
      <div class="article-meta">
        <span class="article-date">${formatDate(post.date)}</span>
        <div class="article-tags">
          ${post.tags?.map(tag => `<span class="tag">${tag}</span>`).join('') || ''}
        </div>
      </div>
    </header>
    <div class="article-content">
      ${post.content || `<p>${post.summary || '暂无内容'}</p>`}
    </div>
  `;
  
  // Table of contents
  renderTOC();
  
  closeSidebar();
  updateURL({ post: postId, topic: post.topic });
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderTOC() {
  const content = elements.articleContent.querySelector('.article-content');
  const headings = content?.querySelectorAll('h2, h3') || [];
  
  if (headings.length === 0) {
    elements.articleToc.innerHTML = '';
    return;
  }
  
  const tocItems = Array.from(headings).map((heading, index) => {
    const id = `heading-${index}`;
    heading.id = id;
    return `
      <a href="#${id}" class="toc-item level-${heading.tagName.toLowerCase()}">
        ${heading.textContent}
      </a>
    `;
  }).join('');
  
  elements.articleToc.innerHTML = `
    <div class="toc-card">
      <h3 class="toc-title">目录</h3>
      <div class="toc-list">${tocItems}</div>
    </div>
  `;
  
  // Smooth scroll for TOC links
  elements.articleToc.querySelectorAll('.toc-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.getAttribute('href').slice(1);
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function renderAbout() {
  state.currentView = 'about';
  showView('about');
  updateURL({});
  closeSidebar();
}

// ============================================
// UI Components
// ============================================
function renderTopicsGrid() {
  const topics = state.data.topics || [];
  
  elements.topicsGrid.innerHTML = topics.map(topic => {
    const postCount = Object.values(state.data.posts).filter(p => p.topic === topic.id).length;
    return `
      <div class="topic-card" data-topic="${topic.id}">
        <div class="topic-card-icon">${topic.icon}</div>
        <h3 class="topic-card-title">${topic.name}</h3>
        <p class="topic-card-desc">${topic.description}</p>
        <span class="topic-card-count">${postCount} 篇文章</span>
      </div>
    `;
  }).join('');
  
  // Attach listeners
  elements.topicsGrid.querySelectorAll('.topic-card').forEach(card => {
    card.addEventListener('click', () => {
      renderTopic(card.dataset.topic);
    });
    
    // Glow effect on mouse move
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
    });
  });
}

function renderRecentPosts() {
  const posts = Object.entries(state.data.posts)
    .map(([id, post]) => ({ id, ...post }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  
  if (posts.length === 0) {
    elements.recentPosts.innerHTML = '<p class="empty-state">暂无文章</p>';
    return;
  }
  
  elements.recentPosts.innerHTML = posts.map(post => createPostCardHTML(post)).join('');
  attachPostCardListeners(elements.recentPosts);
}

function createPostCardHTML(post) {
  return `
    <a href="?post=${post.id}&topic=${post.topic}" class="post-card" data-post="${post.id}">
      <h3 class="post-card-title">${post.title}</h3>
      <div class="post-card-meta">
        <span class="post-card-date">${formatDate(post.date)}</span>
        <div class="post-card-tags">
          ${post.tags?.slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('') || ''}
        </div>
      </div>
    </a>
  `;
}

function attachPostCardListeners(container) {
  container.querySelectorAll('.post-card').forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      renderPost(card.dataset.post);
    });
  });
}

function updateTopicSelect() {
  if (!elements.topicSelect) return;
  
  const currentValue = state.currentTopic || '';
  
  elements.topicSelect.innerHTML = `
    <option value="">选择主题</option>
    ${state.data.topics.map(topic => `
      <option value="${topic.id}" ${topic.id === currentValue ? 'selected' : ''}>
        ${topic.icon} ${topic.name}
      </option>
    `).join('')}
  `;
}

function updateSidebarTree(topicId = null) {
  const activeTopic = topicId || state.currentTopic;
  
  elements.categoryTree.innerHTML = state.data.topics.map(topic => {
    const isActive = topic.id === activeTopic;
    return renderCategoryItem(topic, isActive, 0);
  }).join('');
  
  // Attach toggle listeners
  elements.categoryTree.querySelectorAll('.category-header[data-has-children]').forEach(header => {
    header.addEventListener('click', () => {
      const children = header.nextElementSibling;
      const toggle = header.querySelector('.category-toggle');
      children?.classList.toggle('collapsed');
      toggle?.classList.toggle('collapsed');
    });
  });
  
  // Attach post item listeners
  elements.categoryTree.querySelectorAll('.post-item').forEach(item => {
    item.addEventListener('click', () => {
      renderPost(item.dataset.post);
    });
  });
}

function renderCategoryItem(category, isActive, depth) {
  const hasChildren = category.children && category.children.length > 0;
  const posts = category.posts || [];
  const topic = state.data.topics.find(t => t.categories?.includes(category) || t.categories?.some(c => c.id === category.id));
  
  let html = `
    <div class="category-item">
      <div class="category-header ${isActive ? 'active' : ''}" 
           data-has-children="${hasChildren || posts.length > 0}"
           data-category="${category.id}">
        <span class="category-toggle ${hasChildren || posts.length > 0 ? '' : 'collapsed'}" style="opacity: ${hasChildren || posts.length > 0 ? 1 : 0}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"></path>
          </svg>
        </span>
        <span class="category-icon">${category.icon || '📁'}</span>
        <span class="category-name">${category.name}</span>
        <span class="category-count">${posts.length}</span>
      </div>
  `;
  
  if (hasChildren) {
    html += `<div class="category-children ${isActive ? '' : 'collapsed'}">`;
    category.children.forEach(child => {
      html += renderCategoryItem(child, false, depth + 1);
    });
    html += `</div>`;
  }
  
  if (posts.length > 0) {
    html += `<div class="category-children ${isActive ? '' : 'collapsed'}">`;
    posts.forEach(postId => {
      const post = state.data.posts[postId];
      if (post) {
        const isPostActive = state.currentPost === postId;
        html += `
          <div class="post-item ${isPostActive ? 'active' : ''}" data-post="${postId}">
            ${post.title}
          </div>
        `;
      }
    });
    html += `</div>`;
  }
  
  html += `</div>`;
  return html;
}

// ============================================
// Sidebar
// ============================================
function toggleSidebar() {
  elements.sidebar?.classList.toggle('open');
  elements.sidebarOverlay?.classList.toggle('open');
}

function closeSidebar() {
  elements.sidebar?.classList.remove('open');
  elements.sidebarOverlay?.classList.remove('open');
}

// ============================================
// Search
// ============================================
function openSearch() {
  elements.searchModal?.classList.remove('hidden');
  elements.searchInput?.focus();
  state.selectedSearchIndex = 0;
}

function closeSearch() {
  elements.searchModal?.classList.add('hidden');
  elements.searchInput.value = '';
  state.searchQuery = '';
  state.selectedSearchIndex = 0;
  elements.searchResults.innerHTML = '<p class="search-hint-text">输入关键词开始搜索</p>';
}

function handleSearch() {
  const query = elements.searchInput?.value.trim().toLowerCase() || '';
  state.searchQuery = query;
  state.selectedSearchIndex = 0;
  
  if (!query) {
    elements.searchResults.innerHTML = '<p class="search-hint-text">输入关键词开始搜索</p>';
    return;
  }
  
  const results = Object.entries(state.data.posts)
    .filter(([id, post]) => {
      return post.title.toLowerCase().includes(query) ||
             post.summary?.toLowerCase().includes(query) ||
             post.tags?.some(tag => tag.toLowerCase().includes(query));
    })
    .slice(0, 10)
    .map(([id, post]) => ({ id, ...post }));
  
  if (results.length === 0) {
    elements.searchResults.innerHTML = '<p class="search-hint-text">没有找到相关文章，换个关键词试试？</p>';
    return;
  }
  
  elements.searchResults.innerHTML = results.map((post, index) => `
    <div class="search-result-item ${index === 0 ? 'selected' : ''}" data-post="${post.id}">
      <div class="search-result-title">${highlightMatch(post.title, query)}</div>
      <div class="search-result-meta">${formatDate(post.date)} · ${post.tags?.join(', ') || ''}</div>
    </div>
  `).join('');
  
  elements.searchResults.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      renderPost(item.dataset.post);
      closeSearch();
    });
  });
}

function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function updateSearchSelection(results) {
  results.forEach((item, index) => {
    item.classList.toggle('selected', index === state.selectedSearchIndex);
  });
}

// ============================================
// View Management
// ============================================
function showView(viewName) {
  document.querySelectorAll('.view').forEach(view => {
    view.classList.add('hidden');
  });
  document.getElementById(`${viewName}View`)?.classList.remove('hidden');
  
  // Update nav
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === (viewName === 'home' ? '/' : `#${viewName}`));
  });
}

// ============================================
// Utilities
// ============================================
function updateURL(params) {
  const url = new URL(window.location);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
  });
  history.pushState(null, '', url);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function flattenCategories(categories, parentPath = '') {
  if (!categories) return [];
  
  const result = [];
  categories.forEach(cat => {
    const path = parentPath ? `${parentPath}/${cat.name}` : cat.name;
    result.push({ ...cat, path });
    if (cat.children) {
      result.push(...flattenCategories(cat.children, path));
    }
  });
  return result;
}

function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function handleScroll() {
  // Reading progress
  if (state.currentView === 'post') {
    const article = document.querySelector('.article-content');
    if (article) {
      const rect = article.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const articleTop = rect.top + window.scrollY;
      const articleHeight = rect.height;
      const scrolled = window.scrollY - articleTop + windowHeight;
      const progress = Math.min(Math.max(scrolled / articleHeight, 0), 1);
      elements.readingProgress.style.width = `${progress * 100}%`;
    }
  } else {
    elements.readingProgress.style.width = '0%';
  }
  
  updateBackToTop();
}

function updateBackToTop() {
  const shouldShow = window.scrollY > 300;
  elements.backToTop?.classList.toggle('hidden', !shouldShow);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
