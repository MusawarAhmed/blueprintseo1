let isInspectorActive = false;
let isInspectorLocked = false;
let overlay = null;
let pill = null;
let lastRightClickedElement = null;
let currentVitals = { lcp: 0, cls: 0, fid: 0, inp: 0 };

// Core Web Vitals Monitoring
if ('PerformanceObserver' in window) {
  try {
    // 1. LCP (Largest Contentful Paint)
    new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) currentVitals.lcp = entries[entries.length - 1].startTime / 1000;
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // 2. CLS (Cumulative Layout Shift)
    new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) currentVitals.cls += entry.value;
        }
    }).observe({ type: 'layout-shift', buffered: true });

    // 3. FID (First Input Delay)
    new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
            const entry = entries[entries.length - 1];
            currentVitals.fid = entry.processingStart - entry.startTime;
        }
    }).observe({ type: 'first-input', buffered: true });
  } catch (e) {
    console.warn('Vitals Observe failed:', e);
  }
}

const TAG_COLORS = {
  // Headings (Red)
  H1: '#ff4d4d', H2: '#ff4d4d', H3: '#ff4d4d', H4: '#ff4d4d', H5: '#ff4d4d', H6: '#ff4d4d',
  // Interactive/Links (Green)
  A: '#2ecc71', BUTTON: '#2ecc71', INPUT: '#2ecc71', SELECT: '#2ecc71', TEXTAREA: '#2ecc71',
  // Containers/Divs (Blue)
  DIV: '#3498db', SECTION: '#3498db', ARTICLE: '#3498db', HEADER: '#3498db', FOOTER: '#3498db', NAV: '#3498db', MAIN: '#3498db', ASIDE: '#3498db',
  // Images (Orange)
  IMG: '#e67e22', VIDEO: '#e67e22', CANVAS: '#e67e22', SVG: '#e67e22',
  // Text/Spans (Teal)
  P: '#1abc9c', SPAN: '#1abc9c', B: '#1abc9c', I: '#1abc9c', STRONG: '#1abc9c', EM: '#1abc9c', LI: '#1abc9c'
};

const DEFAULT_COLOR = '#95a5a6';

function createOverlay() {
  if (overlay) return;

  overlay = document.createElement('div');
  overlay.id = 'hover-blueprint-overlay';

  pill = document.createElement('div');
  pill.id = 'hover-blueprint-pill';

  spacingContainer = document.createElement('div');
  spacingContainer.id = 'hover-blueprint-spacing-container';

  overlay.appendChild(pill);
  overlay.appendChild(spacingContainer);
  document.body.appendChild(overlay);
}

function updateOverlay(target) {
  if (!target || target === overlay || overlay.contains(target) || target === document.documentElement || target === document.body) {
    if (overlay) overlay.style.display = 'none';
    return;
  }

  const rect = target.getBoundingClientRect();
  const tagName = target.tagName;
  const color = TAG_COLORS[tagName] || DEFAULT_COLOR;

  // Position and display
  if (isInspectorLocked) return;
  
  if (!isInspectorActive && !isMeasureSpacingActive) {
    if (overlay) overlay.style.display = 'none';
    return;
  }
  
  overlay.style.display = 'block';
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.top = `${rect.top}px`;
  overlay.style.left = `${rect.left}px`;
  
  // Conditionally hide border if not in full inspect mode
  overlay.style.borderColor = isInspectorActive ? color : 'transparent';

  // Measurement Logic
  spacingContainer.innerHTML = '';
  if (isMeasureSpacingActive) {
    const style = window.getComputedStyle(target);
    const mTop = parseInt(style.marginTop);
    const pTop = parseInt(style.paddingTop);
    const mBottom = parseInt(style.marginBottom);
    const pBottom = parseInt(style.paddingBottom);
    const mLeft = parseInt(style.marginLeft);
    const pLeft = parseInt(style.paddingLeft);
    const mRight = parseInt(style.marginRight);
    const pRight = parseInt(style.paddingRight);

    if (mTop > 0) {
        const mLabel = document.createElement('div');
        mLabel.className = 'spacing-label margin-top';
        mLabel.style.height = `${mTop}px`;
        mLabel.style.top = `-${mTop}px`;
        mLabel.innerHTML = `<span>${mTop}</span>`;
        spacingContainer.appendChild(mLabel);
    }
    if (pTop > 0) {
        const pLabel = document.createElement('div');
        pLabel.className = 'spacing-label padding-top';
        pLabel.style.height = `${pTop}px`;
        pLabel.innerHTML = `<span>${pTop}</span>`;
        spacingContainer.appendChild(pLabel);
    }
    if (mBottom > 0) {
        const mLabel = document.createElement('div');
        mLabel.className = 'spacing-label margin-bottom';
        mLabel.style.height = `${mBottom}px`;
        mLabel.style.bottom = `-${mBottom}px`;
        mLabel.innerHTML = `<span>${mBottom}</span>`;
        spacingContainer.appendChild(mLabel);
    }
    if (pBottom > 0) {
        const pLabel = document.createElement('div');
        pLabel.className = 'spacing-label padding-bottom';
        pLabel.style.height = `${pBottom}px`;
        pLabel.style.bottom = `0`; // Position relative to the element's bottom edge
        pLabel.innerHTML = `<span>${pBottom}</span>`;
        spacingContainer.appendChild(pLabel);
    }
    if (mLeft > 0) {
        const mLabel = document.createElement('div');
        mLabel.className = 'spacing-label margin-left';
        mLabel.style.width = `${mLeft}px`;
        mLabel.style.left = `-${mLeft}px`;
        mLabel.innerHTML = `<span>${mLeft}</span>`;
        spacingContainer.appendChild(mLabel);
    }
    if (pLeft > 0) {
        const pLabel = document.createElement('div');
        pLabel.className = 'spacing-label padding-left';
        pLabel.style.width = `${pLeft}px`;
        pLabel.innerHTML = `<span>${pLeft}</span>`;
        spacingContainer.appendChild(pLabel);
    }
    if (mRight > 0) {
        const mLabel = document.createElement('div');
        mLabel.className = 'spacing-label margin-right';
        mLabel.style.width = `${mRight}px`;
        mLabel.style.right = `-${mRight}px`;
        mLabel.innerHTML = `<span>${mRight}</span>`;
        spacingContainer.appendChild(mLabel);
    }
    if (pRight > 0) {
        const pLabel = document.createElement('div');
        pLabel.className = 'spacing-label padding-right';
        pLabel.style.width = `${pRight}px`;
        pLabel.style.right = `0`; // Position relative to the element's right edge
        pLabel.innerHTML = `<span>${pRight}</span>`;
        spacingContainer.appendChild(pLabel);
    }
  }

  // Content and styling
  pill.innerText = `${tagName} <${tagName.toLowerCase()}>`;
  pill.style.backgroundColor = color;
  
  // SEND LIVE INFO TO SIDEPANEL
  const style = window.getComputedStyle(target);
  const info = {
    tag: tagName,
    id: target.id ? `#${target.id}` : '',
    classes: target.className && typeof target.className === 'string' ? `.${target.className.trim().split(/\s+/).join('.')}` : '',
    dimensions: `${Math.round(rect.width)} x ${Math.round(rect.height)} px`,
    fontFam: style.fontFamily.split(',')[0].replace(/['"]/g, ''),
    fontSize: style.fontSize,
    fontColor: style.color,
    alt: target.tagName === 'IMG' ? target.alt : null
  };
  chrome.runtime.sendMessage({ action: "UPDATE_INSPECTOR_LIVE", info });

  // Reposition pill if it goes off screen top
  if (rect.top < 30) {
    overlay.classList.add('pill-bottom');
  } else {
    overlay.classList.remove('pill-bottom');
  }
}

function handleMouseOver(e) {
  if (!isInspectorActive) return;
  updateOverlay(e.target);
}

function handleMouseLeave() {
  if (overlay) overlay.style.display = 'none';
}

let highlightContainer = null;

function updateHighlights() {
  // 1. Clear ALL existing containers first
  if (highlightContainer) {
    highlightContainer.remove();
    highlightContainer = null;
  }
  const noFollowCont = document.getElementById('hover-blueprint-nofollow-container');
  if (noFollowCont) noFollowCont.remove();
  
  const altCont = document.getElementById('hover-blueprint-alt-container');
  if (altCont) altCont.remove();

  // 2. Fetch all states at once to rebuild
  chrome.storage.local.get(['highlightDivs', 'highlightHeadings', 'highlightImages', 'highlightNoFollow', 'showAltOverlay'], (result) => {
    const activeTags = [];
    if (result.highlightDivs) activeTags.push('DIV');
    if (result.highlightHeadings) activeTags.push('H1', 'H2', 'H3', 'H4', 'H5', 'H6');
    if (result.highlightImages) activeTags.push('IMG', 'VIDEO', 'CANVAS', 'SVG');

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // --- REBUILD MAIN HIGHLIGHTS (Pills/Boxes) ---
    if (activeTags.length > 0) {
        highlightContainer = document.createElement('div');
        highlightContainer.id = 'hover-blueprint-highlight-container';
        highlightContainer.style.cssText = 'position:absolute; top:0; left:0; pointer-events:none; z-index:999999998;';
        document.body.appendChild(highlightContainer);

        const selectors = activeTags.join(',');
        const elements = document.querySelectorAll(selectors);
        const fragment = document.createDocumentFragment();

        elements.forEach(el => {
          if (el.id?.startsWith('hover-blueprint')) return;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;

          const tagName = el.tagName;
          const color = TAG_COLORS[tagName] || DEFAULT_COLOR;

          const item = document.createElement('div');
          item.className = 'hover-blueprint-highlight-item';
          item.style.cssText = `position:absolute; border:2px dashed ${color}; box-sizing:border-box; width:${rect.width}px; height:${rect.height}px; top:${rect.top + scrollY}px; left:${rect.left + scrollX}px;`;

          const p = document.createElement('div');
          p.className = 'hover-blueprint-highlight-pill';
          p.innerText = `${tagName} <${tagName.toLowerCase()}>`;
          p.style.cssText = `position:absolute; background-color:${color}; color:white; font-size:10px; font-weight:800; padding:1px 4px; border-radius:2px; top:${rect.top < 20 ? '0' : '-18px'}; left:-2px; white-space:nowrap; font-family:Inter, sans-serif;`;

          item.appendChild(p);
          fragment.appendChild(item);
        });
        highlightContainer.appendChild(fragment);
    }

    // --- REBUILD NOFOLLOW HIGHLIGHTS ---
    if (result.highlightNoFollow) {
        const container = document.createElement('div');
        container.id = 'hover-blueprint-nofollow-container';
        container.style.cssText = 'position:absolute; top:0; left:0; pointer-events:none; z-index:999999997;';
        document.body.appendChild(container);

        const noFollowLinks = Array.from(document.querySelectorAll('a[rel*="nofollow"]'));
        const fragment = document.createDocumentFragment();

        noFollowLinks.forEach(link => {
          const rect = link.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;

          const highlight = document.createElement('div');
          highlight.style.cssText = `position:absolute; border:2px dashed #ff5252; background:rgba(255, 82, 82, 0.1); width:${rect.width + 4}px; height:${rect.height + 4}px; top:${rect.top + scrollY - 2}px; left:${rect.left + scrollX - 2}px; border-radius:2px;`;

          const label = document.createElement('span');
          label.innerText = 'NOFOLLOW';
          label.style.cssText = 'position:absolute; top:-14px; left:0; background:#ff5252; color:white; font-size:8px; font-weight:800; padding:1px 3px; border-radius:2px;';
          
          highlight.appendChild(label);
          fragment.appendChild(highlight);
        });
        container.appendChild(fragment);
    }

    // --- REBUILD ALT OVERLAYS ---
    if (result.showAltOverlay) {
        const container = document.createElement('div');
        container.id = 'hover-blueprint-alt-container';
        container.style.cssText = 'position:absolute; top:0; left:0; pointer-events:none; z-index:999999998;';
        document.body.appendChild(container);

        const images = Array.from(document.querySelectorAll('img'));
        const fragment = document.createDocumentFragment();

        images.forEach(img => {
          const rect = img.getBoundingClientRect();
          if (rect.width < 20 || rect.height < 20) return;

          const overlay = document.createElement('div');
          overlay.style.cssText = `position:absolute; width:${rect.width}px; top:${rect.top + scrollY}px; left:${rect.left + scrollX}px; display:flex; justify-content:center;`;

          const label = document.createElement('span');
          label.innerText = img.alt ? `ALT: ${img.alt}` : 'MISSING ALT';
          label.style.cssText = `background:${img.alt ? 'rgba(0,0,0,0.75)' : 'rgba(255,82,82,0.9)'}; color:white; font-size:10px; font-weight:700; padding:4px 8px; border-radius:0 0 8px 8px; max-width:90%; text-align:center; box-shadow:0 4px 6px rgba(0,0,0,0.1); backdrop-filter:blur(4px);`;
          
          overlay.appendChild(label);
          fragment.appendChild(overlay);
        });
        container.appendChild(fragment);
    }
  });
}

function init() {
  chrome.storage.local.get(['blueprintMode', 'highlightDivs', 'highlightHeadings', 'highlightImages', 'showSpaces', 'measureSpacing'], (result) => {
    isInspectorActive = !!result.blueprintMode;
    isMeasureSpacingActive = !!result.measureSpacing;
    if (isInspectorActive || isMeasureSpacingActive) {
      createOverlay();
    }
    updateHighlights();
    document.body.classList.toggle('show-blueprint-spaces', !!result.showSpaces);
  });

  initSERPAnalyzer();

  document.addEventListener('mouseover', (e) => {
    if (isInspectorActive || isMeasureSpacingActive) {
      updateOverlay(e.target);
    }
  });

  document.addEventListener('mouseleave', handleMouseLeave);

  document.addEventListener('click', (e) => {
    if (isInspectorActive || isMeasureSpacingActive) {
      // Prevent navigation while inspecting
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
  
  window.addEventListener('scroll', () => {
    if ((isInspectorActive || isMeasureSpacingActive) && overlay && overlay.style.display === 'block') {
      const hoveredElement = document.elementFromPoint(lastMousePos.x, lastMousePos.y);
      updateOverlay(hoveredElement);
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (isInspectorActive && overlay && overlay.style.display === 'block') {
      const hoveredElement = document.elementFromPoint(lastMousePos.x, lastMousePos.y);
      updateOverlay(hoveredElement);
    }
    
    // Refresh Highlights if active
    updateHighlights();
  });
}

let lastMousePos = { x: 0, y: 0 };
document.addEventListener('mousemove', (e) => {
  lastMousePos.x = e.clientX;
  lastMousePos.y = e.clientY;
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.blueprintMode || changes.measureSpacing || changes.highlightNoFollow || changes.showAltOverlay) {
    if (changes.blueprintMode) isInspectorActive = changes.blueprintMode.newValue;
    if (changes.measureSpacing) isMeasureSpacingActive = changes.measureSpacing.newValue;
    
    if (isInspectorActive || isMeasureSpacingActive) {
      createOverlay();
    } else if (overlay) {
      overlay.style.display = 'none';
    }
  }
  if (changes.highlightDivs || changes.highlightHeadings || changes.highlightImages || changes.highlightNoFollow || changes.showAltOverlay) {
    updateHighlights();
  }
  if (changes.showSpaces) {
    document.body.classList.toggle('show-blueprint-spaces', changes.showSpaces.newValue);
  }
  if (changes.theme) {
    const modal = document.getElementById('hover-blueprint-font-popup');
    if (modal) {
      const isLight = changes.theme.newValue === 'light';
      modal.classList.toggle('theme-light', isLight);
      const themeBtn = modal.querySelector('#font-theme-toggle');
      if (themeBtn) {
        themeBtn.querySelector('.sun-icon').style.display = isLight ? 'none' : 'block';
        themeBtn.querySelector('.moon-icon').style.display = isLight ? 'block' : 'none';
      }
    }
  }
});

// Font Details Functionality
document.addEventListener('contextmenu', (e) => {
  lastRightClickedElement = e.target;
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_FONT_DETAILS") {
    if (lastRightClickedElement) {
      showFontDetailsPopup(lastRightClickedElement);
    }
  } else if (request.action === "GET_HEADINGS") {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
      tag: h.tagName,
      text: h.innerText.trim(),
      level: parseInt(h.tagName.substring(1))
    }));
    sendResponse({ headings });
  } else if (request.action === "GET_METADATA") {
    const getMeta = (name) => document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)?.getAttribute('content') || null;
    
    const metadata = {
      title: document.title,
      description: getMeta('description'),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
      robots: getMeta('robots') || 'index, follow',
      googlebot: getMeta('googlebot'),
      bingbot: getMeta('bingbot'),
      lang: document.documentElement.lang || 'Not Specified',
      hreflangs: Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map(link => ({
        lang: link.getAttribute('hreflang'),
        href: link.getAttribute('href')
      })),
      viewport: getMeta('viewport'),
      charset: document.characterSet || 'UTF-8',
      favicon: document.querySelector('link[rel*="icon"]')?.href || null,
      stats: {
        htmlSize: document.documentElement.outerHTML.length,
        textSize: document.body.innerText.length
      },
      og: {
        title: getMeta('og:title'),
        description: getMeta('og:description'),
        image: getMeta('og:image'),
        site_name: getMeta('og:site_name')
      },
      twitter: {
        title: getMeta('twitter:title'),
        description: getMeta('twitter:description'),
        image: getMeta('twitter:image'),
        card: getMeta('twitter:card') || 'summary_large_image'
      },
      schemas: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => {
        try {
          const data = JSON.parse(s.innerText);
          const getTypes = (obj) => {
            if (!obj) return [];
            if (Array.isArray(obj)) return obj.flatMap(getTypes);
            let types = [];
            if (obj['@type']) types.push(obj['@type']);
            if (obj['@graph'] && Array.isArray(obj['@graph'])) types.push(...obj['@graph'].flatMap(getTypes));
            return types;
          };
          const types = [...new Set(getTypes(data))].filter(t => typeof t === 'string' && t.length > 0);
          return { type: types.length > 0 ? types.join(', ') : 'Schema Object', json: s.innerText };
        } catch (e) {
          return { type: 'Invalid JSON-LD', json: s.innerText };
        }
      }).flat(),
      // NEW AUDIT DATA
      audit: {
        wordCount: document.body.innerText.split(/\s+/).filter(w => w.length > 0).length,
        links: Array.from(document.querySelectorAll('a[href]')).map(a => {
          let type = 'External';
          try {
            const url = new URL(a.href);
            if (!['http:', 'https:'].includes(url.protocol)) {
               type = 'Special';
            } else {
               const currentHost = window.location.hostname.replace('www.', '');
               const linkHost = url.hostname.replace('www.', '');
               type = (linkHost === currentHost || linkHost.endsWith('.' + currentHost)) ? 'Internal' : 'External';
            }
          } catch (e) {
            type = 'Special';
          }
          return {
            text: a.innerText.trim(),
            href: a.href,
            type: type,
            isNoFollow: a.rel?.includes('nofollow')
          };
        }),
        images: {
          total: document.images.length,
          missingAlt: Array.from(document.images).filter(img => !img.alt || img.alt.trim() === '').length,
          broken: Array.from(document.images).filter(img => img.naturalWidth === 0 && img.complete).length
        }
      },
      // NEW TECHNICAL VITALS
      vitals: {
        isHttps: window.location.protocol === 'https:',
        loadTime: (performance.timing.loadEventEnd - performance.timing.navigationStart) / 1000,
        lcp: currentVitals.lcp,
        cls: currentVitals.cls,
        fid: currentVitals.fid,
        resources: {
          scripts: document.querySelectorAll('script[src]').length,
          styles: document.querySelectorAll('link[rel="stylesheet"]').length,
          images: document.querySelectorAll('img').length,
          list: [
            ...Array.from(document.querySelectorAll('script[src]')).map(s => ({ type: 'Script', url: s.src })),
            ...Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(s => ({ type: 'Style', url: s.href })),
            ...Array.from(document.querySelectorAll('img[src]')).map(s => ({ type: 'Image', url: s.src }))
          ]
        }
      }
    };
    sendResponse({ metadata });
  } else if (request.action === "UNLOCK_INSPECTOR") {
    isInspectorLocked = false;
  } else if (request.action === "GET_KEYWORDS") {
    // Get visible text from the body
    const bodyText = document.body.innerText
      .toLowerCase()
      .replace(/[^\w\sа-яА-Я]/g, ' ') // Remove non-word chars (and support cyrillic if any)
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    sendResponse({ text: bodyText });
  } else if (request.action === "GET_LINKS") {
    const origin = window.location.origin;
    const links = Array.from(document.querySelectorAll('a')).map(a => {
      // Determine link type
      let type = 'Internal';
      try {
        const linkUrl = new URL(a.href);
        if (linkUrl.origin !== origin) type = 'External';
        if (a.href.startsWith('mailto:')) type = 'Email';
        if (a.href.startsWith('tel:')) type = 'Phone';
      } catch(e) {
        type = 'Invalid';
      }

      // Get anchor text
      let anchorText = a.innerText.trim();
      if (!anchorText) {
        const img = a.querySelector('img');
        if (img && img.alt) anchorText = `[IMG ALT: ${img.alt}]`;
        else if (img) anchorText = '[IMG NO ALT]';
        else anchorText = '[No Anchor Text]';
      }

      return {
        href: a.href,
        text: anchorText,
        type: type,
        rel: a.rel || '',
        isNoFollow: a.rel?.includes('nofollow'),
        target: a.name || a.id || null
      };
    });
    sendResponse({ links });
  } else if (request.action === "GET_IMAGES") {
    const images = Array.from(document.querySelectorAll('img')).map(img => {
      return {
        src: img.src,
        alt: img.alt || null,
        title: img.title || null,
        width: img.clientWidth,
        height: img.clientHeight,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        isBroken: img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0),
        isExternal: !img.src.includes(window.location.hostname) && img.src.startsWith('http')
      };
    }).filter(img => img.src && !img.src.startsWith('chrome-extension://'));
    sendResponse({ images });
  }
  return true; // Keep channel open for async sendResponse
});

function showFontDetailsPopup(el) {
  // Remove existing popup if any
  const existing = document.getElementById('hover-blueprint-font-modal-container');
  if (existing) existing.remove();

  const style = window.getComputedStyle(el);
  const fontName = style.fontFamily.replace(/['"]/g, '');
  const fontSize = style.fontSize;
  const fontWeight = style.fontWeight;
  const lineHeight = style.lineHeight;
  const fontColor = style.color;
  const padding = style.padding;
  const margin = style.margin;

  const container = document.createElement('div');
  container.id = 'hover-blueprint-font-modal-container';
  
  const backdrop = document.createElement('div');
  backdrop.className = 'font-modal-backdrop';
  
  const modal = document.createElement('div');
  modal.id = 'hover-blueprint-font-popup';
  modal.className = 'centered-modal';
  
  // Apply saved theme
  chrome.storage.local.get(['theme'], (result) => {
    if (result.theme === 'light') {
      modal.classList.add('theme-light');
      const sunIcon = modal.querySelector('.sun-icon');
      const moonIcon = modal.querySelector('.moon-icon');
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
    }
  });

  const header = document.createElement('div');
  header.className = 'font-popup-header';
  header.innerHTML = `
    <div class="font-popup-title">
      <div class="font-icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
      </div>
      <span>Blueprint SEO - Font Details</span>
    </div>
    <div class="font-popup-controls">
      <button class="theme-icon-button" id="font-theme-toggle" title="Toggle Light/Dark Mode">
        <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        <svg class="moon-icon" style="display: none;" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
      </button>
      <button class="font-popup-close">&times;</button>
    </div>
  `;

  const content = document.createElement('div');
  content.className = 'font-popup-content';
  
  const fields = [
    { label: 'Font name', value: fontName },
    { label: 'Font size', value: fontSize },
    { label: 'Font weight', value: fontWeight },
    { label: 'Line height', value: lineHeight },
    { label: 'Font color', value: fontColor, isColor: true },
    { label: 'Padding', value: padding },
    { label: 'Margin', value: margin }
  ];

  let fieldsHtml = '<div class="font-fields-container">';
  fields.forEach(f => {
    if (f.value && f.value !== 'normal' && f.value !== '0px') {
        fieldsHtml += `
          <div class="font-field">
            <span class="font-field-label">${f.label}</span>
            <span class="font-field-value">${f.value} ${f.isColor ? `<span class="color-preview" style="background-color: ${f.value}"></span>` : ''}</span>
          </div>
        `;
    }
  });
  fieldsHtml += '</div>';

  const cssSnippet = `font-family: ${style.fontFamily};\nfont-size: ${fontSize};\nfont-weight: ${fontWeight};\nline-height: ${lineHeight};\ncolor: ${fontColor};${padding !== '0px' ? `\npadding: ${padding};` : ''}${margin !== '0px' ? `\nmargin: ${margin};` : ''}`;

  content.innerHTML = `
    ${fieldsHtml}
    <div class="css-snippet-section">
      <div class="css-snippet-header">
        <span>CSS Snippet</span>
        <button class="copy-button">
          <svg style="margin-right: 4px" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Copy
        </button>
      </div>
      <pre class="css-code"><code>${cssSnippet}</code></pre>
    </div>
  `;

  modal.appendChild(header);
  modal.appendChild(content);
  container.appendChild(backdrop);
  container.appendChild(modal);
  document.body.appendChild(container);

  // Theme Toggle Logic (Icon Button)
  const themeBtn = modal.querySelector('#font-theme-toggle');
  const sunIcon = themeBtn.querySelector('.sun-icon');
  const moonIcon = themeBtn.querySelector('.moon-icon');

  themeBtn.addEventListener('click', () => {
    const isLightNow = modal.classList.toggle('theme-light');
    if (isLightNow) {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
      chrome.storage.local.set({ theme: 'light' });
    } else {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
      chrome.storage.local.set({ theme: 'dark' });
    }
  });

  // Close events
  const close = () => container.remove();
  modal.querySelector('.font-popup-close').addEventListener('click', close);
  backdrop.addEventListener('click', close);

  // Copy event
  modal.querySelector('.copy-button').addEventListener('click', () => {
    navigator.clipboard.writeText(cssSnippet).then(() => {
      const btn = modal.querySelector('.copy-button');
      const originalText = btn.innerHTML;
      btn.innerText = 'Copied!';
      setTimeout(() => btn.innerHTML = originalText, 2000);
    });
  });
}

function initSERPAnalyzer() {
  if (!window.location.hostname.includes('google.') || !window.location.pathname.includes('/search')) return;

  chrome.storage.local.get(['serpInsights'], (result) => {
    if (result.serpInsights) {
      setTimeout(injectSERPControls, 1000);
      
      let throttleTimer;
      const observer = new MutationObserver(() => {
        if (throttleTimer) clearTimeout(throttleTimer);
        throttleTimer = setTimeout(injectSERPControls, 500);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });
}

function injectSERPControls() {
  // Common Google search result containers
  const results = document.querySelectorAll('.MjjYud, .tF2Cxc, div.g');
  
  chrome.storage.local.get(['serpAutoAudit'], (storage) => {
    results.forEach((result) => {
      // BUG FIX: Prevent dual injection for nested results by checking for marker class
      if (
        result.classList.contains('hover-blueprint-done') || 
        result.querySelector('.hover-blueprint-done') || 
        result.closest('.hover-blueprint-done') ||
        result.querySelector('.blueprint-serp-box')
      ) return;

      if (result.offsetHeight < 10) return;

      const titleLink = result.querySelector('h3 a, .yuRUbf a, a[data-ved][href^="http"]');
      if (!titleLink || !titleLink.href || titleLink.href.includes('google.com/search')) return;

      // Mark as processed immediately
      result.classList.add('hover-blueprint-done');

      const box = document.createElement('div');
      box.className = 'blueprint-serp-box';
      box.innerHTML = `
        <div class="serp-box-header">
          <span class="serp-box-logo">BLUEPRINT <span class="v">v2</span></span>
          <button class="serp-scan-btn" data-url="${titleLink.href}">
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M1 12s4-8 11-8 11-8 11-8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Audit Headings
          </button>
        </div>
        <div class="serp-box-content" style="display:none"></div>
      `;
      
      result.appendChild(box);

      const auditBtn = box.querySelector('.serp-scan-btn');
      auditBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const btn = this;
        const content = box.querySelector('.serp-box-content');
        const url = btn.getAttribute('data-url');

        btn.innerText = 'Scanning...';
        btn.disabled = true;

        chrome.runtime.sendMessage({ action: "FETCH_SERP_DATA", url }, (response) => {
          if (response && response.success) {
            btn.style.display = 'none';
            content.style.display = 'block';
            if (response.headings && response.headings.length > 0) {
              content.innerHTML = response.headings.map(h => `
                <div class="serp-h-item h-${h.tag.toLowerCase()}">
                  <span class="serp-h-tag">${h.tag}</span> ${h.text}
                </div>
              `).join('');
            } else {
              content.innerHTML = `
                <div style="font-size:11px; color:#ffab00; padding: 10px; background: rgba(255,171,0,0.1); border-radius: 6px; border: 1px dashed rgba(255,171,0,0.3); display: flex; align-items: center; gap: 8px;">
                   <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                   No headings (H1-H6) found on this page.
                </div>`;
            }
          } else {
            btn.innerText = 'Audit Failed (Try Again)';
            btn.disabled = false;
          }
        });
      });

      // AUTO-AUDIT FEATURE
      if (storage.serpAutoAudit) {
        auditBtn.click();
      }
    });
  });
}

init();
