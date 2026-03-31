// sidepanel.js

let isUserPro = false; // Initial state

document.addEventListener('DOMContentLoaded', () => {
  // --- AUTH / PRO GATING LOGIC ---
  const authModal = document.getElementById('auth-modal');
  const btnHeaderAuth = document.getElementById('btn-header-auth');
  const authStatusText = document.getElementById('auth-status-text');
  const closeAuthModal = document.getElementById('close-auth-modal');
  const loginView = document.getElementById('auth-login-view');
  const signupView = document.getElementById('auth-signup-view');
  const switchToSignup = document.getElementById('switch-to-signup');
  const switchToLogin = document.getElementById('switch-to-login');
  
  const lockSocial = document.getElementById('lock-social-preview');
  const lockSerpBulk = document.getElementById('lock-serp-bulk');

  // Check storage for saved session
  chrome.storage.local.get(['isUserPro', 'userName'], (result) => {
    isUserPro = result.isUserPro || false;
    updateProUI(isUserPro, result.userName);
  });

  function updateProUI(isPro, name) {
    isUserPro = isPro;
    if (isPro) {
        if (authStatusText) authStatusText.innerText = (name || "USER").toUpperCase();
        if (lockSocial) lockSocial.style.display = 'none';
        if (lockSerpBulk) lockSerpBulk.style.display = 'none';
        
        // New Tab Locks
        const lockKeywords = document.getElementById('lock-keywords');
        const lockLinks = document.getElementById('lock-links-tab');
        const lockImages = document.getElementById('lock-images-tab');
        if (lockKeywords) lockKeywords.style.display = 'none';
        if (lockLinks) lockLinks.style.display = 'none';
        if (lockImages) lockImages.style.display = 'none';
    } else {
        if (authStatusText) authStatusText.innerText = "LOGIN";
        if (lockSocial) lockSocial.style.display = 'flex';
        if (lockSerpBulk) lockSerpBulk.style.display = 'flex';

        // New Tab Locks
        const lockKeywords = document.getElementById('lock-keywords');
        const lockLinks = document.getElementById('lock-links-tab');
        const lockImages = document.getElementById('lock-images-tab');
        if (lockKeywords) lockKeywords.style.display = 'flex';
        if (lockLinks) lockLinks.style.display = 'flex';
        if (lockImages) lockImages.style.display = 'flex';
    }

    // Refresh UI with existing data if a scan has already been performed
    if (typeof currentAuditData !== 'undefined' && currentAuditData !== null) {
        if (typeof displayMetadata === 'function') displayMetadata(currentAuditData.meta);
        if (typeof displayKeywords === 'function') displayKeywords(currentAuditData.text, currentAuditData.meta);
        if (typeof displayLinks === 'function') displayLinks();
        
        const activeImgBtn = document.querySelector('[data-img-filter].active');
        const imgFilter = activeImgBtn ? activeImgBtn.getAttribute('data-img-filter') : 'all';
        if (typeof displayImages === 'function') displayImages(imgFilter);
    }
  }

  // Global Listeners for "Pro Unlock" buttons
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-open-auth')) {
        if (authModal) authModal.style.display = 'flex';
    }
  });

  if (btnHeaderAuth) btnHeaderAuth.addEventListener('click', () => {
    if (isUserPro) {
        // Simple logout for demo
        if (confirm("Log out of Blueprint SEO?")) {
            chrome.storage.local.set({ isUserPro: false, userName: '' }, () => {
                updateProUI(false);
            });
        }
    } else {
        if (authModal) authModal.style.display = 'flex';
    }
  });

  if (closeAuthModal) closeAuthModal.addEventListener('click', () => {
    authModal.style.display = 'none';
    // Clear form inputs when closing modal
    const authInputs = authModal.querySelectorAll('.auth-input');
    authInputs.forEach(input => input.value = '');
  });
  if (switchToSignup) switchToSignup.addEventListener('click', () => {
    loginView.style.display = 'none';
    signupView.style.display = 'block';
  });
  if (switchToLogin) switchToLogin.addEventListener('click', () => {
    signupView.style.display = 'none';
    loginView.style.display = 'block';
  });

  // Mock Login/Signup Submit
  const btnLoginSubmit = document.getElementById('btn-login-submit');
  if (btnLoginSubmit) btnLoginSubmit.addEventListener('click', () => {
    // Get email from auth form
    const emailInput = loginView.querySelector('input[type="email"]');
    const email = emailInput ? emailInput.value.trim() : '';
    const userName = email.split('@')[0] || 'John Doe';
    
    chrome.storage.local.set({ isUserPro: true, userName: userName }, () => {
        updateProUI(true, userName);
        authModal.style.display = 'none';
        // Clear all inputs in auth modal
        const authInputs = authModal.querySelectorAll('.auth-input');
        authInputs.forEach(input => input.value = '');
        // Show brief success feedback
        showAuthSuccess('Successfully logged in as ' + userName.toUpperCase());
    });
  });

  const btnSignupSubmit = document.getElementById('btn-signup-submit');
  if (btnSignupSubmit) btnSignupSubmit.addEventListener('click', () => {
    // Get name from signup form
    const nameInput = signupView.querySelector('input[type="text"]');
    const userName = nameInput ? nameInput.value.trim() : 'New User';
    
    chrome.storage.local.set({ isUserPro: true, userName: userName }, () => {
        updateProUI(true, userName);
        authModal.style.display = 'none';
        // Clear all inputs in auth modal
        const authInputs = authModal.querySelectorAll('.auth-input');
        authInputs.forEach(input => input.value = '');
        // Show brief success feedback
        showAuthSuccess('Account created! Welcome, ' + userName.toUpperCase());
    });
  });

  // Success notification helper
  function showAuthSuccess(message) {
    const header = document.querySelector('.main-header');
    if (!header) return;
    
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed; top:70px; right:16px; background:rgba(100,255,218,0.1); border:1px solid var(--accent-cyan); color:var(--accent-cyan); padding:12px 16px; border-radius:8px; font-size:12px; font-weight:600; z-index:10000; animation:slideIn 0.3s ease-out; max-width:280px;';
    toast.innerText = '✓ ' + message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // --- EXISTING CORE LOGIC ---
  // Navigation Drawer Logic
  const btnMenu = document.getElementById('btn-menu');
  const btnCloseMenu = document.getElementById('btn-close-menu');
  const navDrawer = document.getElementById('nav-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');

  let lastLinksScanned = [];
  let lastImagesScanned = [];
  let lastLinkStatuses = {}; // Map to store HTTP status codes

  const openDrawer = () => {
    navDrawer.classList.add('open');
    drawerOverlay.classList.add('show');
  };

  const closeDrawer = () => {
    navDrawer.classList.remove('open');
    drawerOverlay.classList.remove('show');
  };

  btnMenu.addEventListener('click', openDrawer);
  btnCloseMenu.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  // Tab Switching Logic (Vertical Menu)
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      
      navItems.forEach(i => i.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      
      item.classList.add('active');
      const targetPane = document.getElementById(tabId);
      if (targetPane) {
        targetPane.classList.add('active');
        // Scroll to top when switching tabs
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
          contentArea.scrollTop = 0;
        }
      }

      closeDrawer();
    });
  });

  // Global Inspector Toggle (Updated from 1.0)
  const modeToggle = document.getElementById('header-mode-toggle');
  
  // Quick Action Buttons
  const btnDivs = document.getElementById('btn-toggle-divs');
  const btnHeadings = document.getElementById('btn-toggle-headings');
  const btnImages = document.getElementById('btn-toggle-images');
  const btnSpaces = document.getElementById('btn-toggle-spaces');
  const btnNoFollow = document.getElementById('btn-toggle-nofollow');
  const btnAlts = document.getElementById('btn-toggle-alts');

  const serpToggle = document.getElementById('toggle-serp-insights');
  const serpAutoToggle = document.getElementById('toggle-serp-auto');

  // Load saved states
  chrome.storage.local.get(['blueprintMode', 'highlightDivs', 'highlightHeadings', 'highlightImages', 'showSpaces', 'measureSpacing', 'serpInsights', 'serpAutoAudit', 'theme', 'highlightNoFollow', 'showAltOverlay'], (result) => {
    if (modeToggle) modeToggle.checked = !!result.blueprintMode;
    
    // Apply theme
    if (result.theme === 'light') {
      document.body.classList.add('theme-light');
      const themeBtn = document.getElementById('btn-theme-toggle');
      if (themeBtn) {
        themeBtn.querySelector('.sun-icon').style.display = 'none';
        themeBtn.querySelector('.moon-icon').style.display = 'block';
      }
    }
    
    // Default serpInsights to true if it hasn't been set yet
    const serpActive = result.serpInsights !== undefined ? result.serpInsights : true;
    if (serpToggle) serpToggle.checked = serpActive;
    if (result.serpInsights === undefined) {
      chrome.storage.local.set({ serpInsights: true });
    }

    if (serpAutoToggle) serpAutoToggle.checked = !!result.serpAutoAudit;

    // Set active states for buttons
    if (result.highlightDivs && btnDivs) btnDivs.classList.add('active');
    if (result.highlightHeadings && btnHeadings) btnHeadings.classList.add('active');
    if (result.highlightImages && btnImages) btnImages.classList.add('active');
    if (result.showSpaces && btnSpaces) btnSpaces.classList.add('active');
    if (result.highlightNoFollow && btnNoFollow) btnNoFollow.classList.add('active');
    if (result.showAltOverlay && btnAlts) btnAlts.classList.add('active');

    if (modeToggle) updateInspectorUI(modeToggle.checked);
  });

  if (serpToggle) {
    serpToggle.addEventListener('change', () => {
      chrome.storage.local.set({ serpInsights: serpToggle.checked });
    });
  }

  if (serpAutoToggle) {
    serpAutoToggle.addEventListener('change', () => {
      chrome.storage.local.set({ serpAutoAudit: serpAutoToggle.checked });
    });
  }

  modeToggle.addEventListener('change', () => {
    const isActive = modeToggle.checked;
    chrome.storage.local.set({ 
      blueprintMode: isActive,
      measureSpacing: isActive 
    });
    updateInspectorUI(isActive);
  });

  // Toggle Functionality for Pills
  const setupPill = (btn, storageKey) => {
    btn.addEventListener('click', () => {
      const isActive = btn.classList.toggle('active');
      chrome.storage.local.set({ [storageKey]: isActive });
    });
  };

  setupPill(btnDivs, 'highlightDivs');
  setupPill(btnHeadings, 'highlightHeadings');
  setupPill(btnImages, 'highlightImages');
  setupPill(btnSpaces, 'showSpaces');
  if (btnNoFollow) setupPill(btnNoFollow, 'highlightNoFollow');
  if (btnAlts) setupPill(btnAlts, 'showAltOverlay');

  // Theme Toggle Logic
  const themeBtn = document.getElementById('btn-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('theme-light');
      const sunIcon = themeBtn.querySelector('.sun-icon');
      const moonIcon = themeBtn.querySelector('.moon-icon');
      
      if (isLight) {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
        chrome.storage.local.set({ theme: 'light' });
      } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
        chrome.storage.local.set({ theme: 'dark' });
      }
    });
  }

  function updateInspectorUI(isActive) {
    const liveInfo = document.getElementById('live-info-section');
    const emptyInfo = document.getElementById('empty-inspector');
    if (isActive) {
      if (liveInfo) liveInfo.style.display = 'block';
      if (emptyInfo) emptyInfo.style.display = 'none';
    } else {
      if (liveInfo) liveInfo.style.display = 'none';
      if (emptyInfo) emptyInfo.style.display = 'block';
    }
  }

  // Listen for Live Inspector Updates
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "UPDATE_INSPECTOR_LIVE" && modeToggle.checked) {
      const info = request.info;
      const tagBadge = document.getElementById('tag-badge');
      const inspectIds = document.getElementById('inspect-ids');
      const inspectDims = document.getElementById('inspect-dimensions');
      const inspectFont = document.getElementById('inspect-font');
      const inspectSizeColor = document.getElementById('inspect-size-color');
      const assetBox = document.getElementById('inspect-asset-info');
      const inspectAlt = document.getElementById('inspect-alt');

      if (tagBadge) tagBadge.innerText = info.tag;
      if (inspectIds) inspectIds.innerText = `${info.id} ${info.classes}`.trim() || 'No ID or Class';
      if (inspectDims) inspectDims.innerText = info.dimensions;
      if (inspectFont) inspectFont.innerText = info.fontFam;
      if (inspectSizeColor) inspectSizeColor.innerText = `${info.fontSize} / ${info.fontColor}`;

      if (assetBox) {
        if (info.tag === 'IMG') {
          assetBox.style.display = 'block';
          if (inspectAlt) inspectAlt.innerText = info.alt ? `"${info.alt}"` : '(No alt text found)';
        } else {
          assetBox.style.display = 'none';
        }
      }
    }
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.theme) {
      const isLight = changes.theme.newValue === 'light';
      document.body.classList.toggle('theme-light', isLight);
      const themeBtn = document.getElementById('btn-theme-toggle');
      if (themeBtn) {
        themeBtn.querySelector('.sun-icon').style.display = isLight ? 'none' : 'block';
        themeBtn.querySelector('.moon-icon').style.display = isLight ? 'block' : 'none';
      }
    }
  });

  // Collapsible Batch Highlights (REMOVED - Not needed for Grid)

  // Heading Analysis Logic
  const resultsDiv = document.getElementById('analysis-results');
  const emptyDiv = document.getElementById('empty-scan');
  const headingTree = document.getElementById('heading-tree');
  const headingCounts = document.getElementById('heading-counts');
  const suggestionList = document.getElementById('suggestion-list');

  function displayHeadings(headings) {
    if (!resultsDiv) return;
    resultsDiv.style.display = 'block';
    if (emptyDiv) emptyDiv.style.display = 'none';

    // 1. Clear previous
    headingTree.innerHTML = '';
    headingCounts.innerHTML = '';
    suggestionList.innerHTML = '';

    // 2. Counts
    const counts = { H1: 0, H2: 0, H3: 0, H4: 0, H5: 0, H6: 0 };
    headings.forEach(h => {
        if (counts.hasOwnProperty(h.tag)) {
            counts[h.tag]++;
        }
    });

    Object.entries(counts).forEach(([tag, count]) => {
      const card = document.createElement('div');
      card.className = 'stat-card';
      card.innerHTML = `
        <span class="stat-val">${count}</span>
        <span class="stat-label">${tag}</span>
      `;
      headingCounts.appendChild(card);
    });

    // 3. Tree
    if (headings.length === 0) {
      headingTree.innerHTML = '<div class="empty-state">No headings found on this page.</div>';
    } else {
      headings.forEach(h => {
        const item = document.createElement('div');
        item.className = 'heading-item';
        // Indent based on level
        item.style.marginLeft = `${(h.level - 1) * 15}px`;
        item.innerHTML = `
          <span class="h-tag">${h.tag}</span>
          <span class="h-text">${h.text || '<em>(Empty Heading)</em>'}</span>
        `;
        headingTree.appendChild(item);
      });
    }

    // 4. Analysis Suggestions
    const suggestions = [];

    // H1 Checks
    if (counts.H1 === 0) {
      suggestions.push("<strong>Missing H1:</strong> Every page should have exactly one H1 tag for SEO.");
    } else if (counts.H1 > 1) {
      suggestions.push(`<strong>Multiple H1s (${counts.H1}):</strong> Avoid using more than one H1. Combine them or demote secondary ones to H2.`);
    } else {
      suggestions.push("<strong>H1 Check:</strong> Perfect! You have exactly one H1.");
    }

    // Hierarchy Checks
    let brokenHierarchy = false;
    for (let i = 0; i < headings.length - 1; i++) {
        if (headings[i+1].level > headings[i].level + 1) {
            brokenHierarchy = true;
            break;
        }
    }
    if (brokenHierarchy) {
        suggestions.push("<strong>Hierarchy Skip:</strong> Found a jump in heading levels (e.g., H2 to H4). Try to follow a sequential order.");
    }

    // Length Checks
    const longHeadings = headings.filter(h => h.text.length > 70);
    if (longHeadings.length > 0) {
        suggestions.push(`<strong>Long Headings:</strong> Found ${longHeadings.length} headings over 70 characters. Keep them concise.`);
    }

    // Suggestion Count (Contextual)
    if (headings.length < 3) {
        suggestions.push("<strong>Content Depth:</strong> Consider adding more subheadings (H2, H3) to organize your content for better readability.");
    }

    suggestions.forEach(s => {
      const li = document.createElement('li');
      li.innerHTML = s;
      suggestionList.appendChild(li);
    });
  }

  // Metadata & Social Logic
  const metaResultsDiv = document.getElementById('metadata-results');
  const emptyMetaDiv = document.getElementById('empty-metadata');

  function displayMetadata(data) {
    if (!data) return;
    const metaResultsDiv = document.getElementById('metadata-results');
    const emptyMetaDiv = document.getElementById('empty-metadata');
    if (metaResultsDiv) metaResultsDiv.style.display = 'block';
    if (emptyMetaDiv) emptyMetaDiv.style.display = 'none';

    // 1. Core Metadata
    const titleVal = document.getElementById('meta-title');
    const titleCount = document.getElementById('title-count');
    const descVal = document.getElementById('meta-desc');
    const descCount = document.getElementById('desc-count');
    const canonicalVal = document.getElementById('meta-canonical');

    if (titleVal) titleVal.innerText = data.title || "No Title Found";
    const tLen = data.title?.length || 0;
    if (titleCount) {
        titleCount.innerText = tLen;
        updateBadge(titleCount, tLen, 50, 60);
    }

    if (descVal) descVal.innerText = data.description || "No Description Found";
    const dLen = data.description?.length || 0;
    if (descCount) {
        descCount.innerText = dLen;
        updateBadge(descCount, dLen, 120, 160);
    }

    if (canonicalVal) canonicalVal.innerText = data.canonical || "No Canonical Tag Found";

    // 2. NEW: Google SERP Mockup Population
    const serpUrlHost = document.getElementById('serp-url-host');
    const serpMobileSite = document.getElementById('serp-mobile-site');
    const serpDTitle = document.getElementById('serp-d-title');
    const serpMTitle = document.getElementById('serp-m-title');
    const serpDDesc = document.getElementById('serp-d-desc');
    const serpMDesc = document.getElementById('serp-m-desc');

    let host = 'yoursite.com';
    try {
        host = data.canonical ? new URL(data.canonical).hostname : 'yoursite.com';
    } catch(e) {}

    if (serpUrlHost) serpUrlHost.innerText = host;
    if (serpMobileSite) serpMobileSite.innerText = host;

    const finalTitle = data.title || "No Title Found";
    const finalDesc = data.description || "Enhance your CTR by adding a meta description. Google usually displays up to 160 characters here.";

    if (serpDTitle) serpDTitle.innerText = finalTitle;
    if (serpMTitle) serpMTitle.innerText = finalTitle;
    if (serpDDesc) serpDDesc.innerText = finalDesc;
    if (serpMDesc) serpMDesc.innerText = finalDesc;

    // 3. NEW: Social Preview Mockup Population
    const fbImage = document.getElementById('fb-image');
    const fbUrl = document.getElementById('fb-url');
    const fbTitle = document.getElementById('fb-title');
    const fbDesc = document.getElementById('fb-desc');

    const twImage = document.getElementById('tw-image');
    const twUrl = document.getElementById('tw-url');
    const twTitle = document.getElementById('tw-title');
    const twDesc = document.getElementById('tw-desc');

    if (fbUrl) fbUrl.innerText = host;
    if (twUrl) twUrl.innerText = host;

    const socialTitle = data.og?.title || data.twitter?.title || finalTitle;
    const socialDesc = data.og?.description || data.twitter?.description || finalDesc;
    const socialImg = data.og?.image || data.twitter?.image || data.favicon || '';

    if (fbTitle) fbTitle.innerText = socialTitle;
    if (twTitle) twTitle.innerText = socialTitle;
    if (fbDesc) fbDesc.innerText = socialDesc;
    if (twDesc) twDesc.innerText = socialDesc;

    if (fbImage) fbImage.style.backgroundImage = socialImg ? `url(${socialImg})` : 'none';
    if (twImage) twImage.style.backgroundImage = socialImg ? `url(${socialImg})` : 'none';

    // 4. NEW: Detailed Robots & Lang Section
    const robotsVal = document.getElementById('meta-robots-val');
    const langVal = document.getElementById('meta-lang-val');
    if (robotsVal) robotsVal.innerText = data.robots || 'index, follow';
    if (langVal) langVal.innerText = data.lang || 'Not Specified';

    // 3. NEW: Hreflang Tags
    const hreflangSection = document.getElementById('hreflang-section');
    const hreflangList = document.getElementById('hreflang-list');
    const hreflangCount = document.getElementById('hreflang-count');

    if (hreflangSection && hreflangList) {
      if (data.hreflangs && data.hreflangs.length > 0) {
        hreflangSection.style.display = 'block';
        hreflangCount.innerText = data.hreflangs.length;
        hreflangList.innerHTML = data.hreflangs.map(h => `
          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:4px 8px; border-radius:4px; font-size:10px;">
            <span style="color:var(--accent-cyan); font-weight:700;">${h.lang}</span>
            <span style="color:var(--text-grey); width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:right;">${h.href}</span>
          </div>
        `).join('');
      } else {
        hreflangSection.style.display = 'none';
      }
    }

    // 4. Social Preview (OG)
    const ogImageContainer = document.getElementById('og-image');
    const ogTitleEl = document.getElementById('og-title');
    const ogDescEl = document.getElementById('og-desc');
    const ogSiteEl = document.getElementById('og-site');

    const ogTitle = isUserPro ? (data.og?.title || data.title || 'No Title Shared') : "🛡️ SOCIAL PREVIEW [PRO]";
    const ogDesc = isUserPro ? (data.og?.description || data.description || 'Preview descriptive text...') : "Upgrade to Pro to see exactly how your description and rich media will appear on Facebook, X, and WhatsApp.";
    const ogImage = isUserPro ? (data.og?.image || data.favicon || null) : null;
    let ogSiteStr = "Pro Feature Restricted";
    if (isUserPro) {
        try {
            ogSiteStr = data.og?.site_name || (data.canonical ? new URL(data.canonical).hostname : host);
        } catch(e) { ogSiteStr = host; }
    }
    const ogSite = ogSiteStr;

    if (ogTitleEl) ogTitleEl.innerText = ogTitle;
    if (ogDescEl) ogDescEl.innerText = ogDesc;
    if (ogSiteEl) ogSiteEl.innerText = ogSite;

    if (ogImageContainer) {
      if (ogImage) {
        ogImageContainer.innerHTML = `<img src="${ogImage}" style="width:100%; height:100%; object-fit:cover;" onerror="this.parentElement.innerHTML='<span>Image Load Error</span>'" />`;
      } else {
        ogImageContainer.innerHTML = '<span>No Social Image Found</span>';
      }
    }

    // 3. Technical Audit Stats
    const wordCountEl = document.getElementById('audit-wordcount');
    const readingTimeEl = document.getElementById('readingtime'); // old ID? check HTML
    const auditReadingTimeEl = document.getElementById('audit-readingtime');

    if (wordCountEl) wordCountEl.innerText = data.audit?.wordCount || 0;
    const readingTime = Math.ceil((data.audit?.wordCount || 0) / 200);
    if (auditReadingTimeEl) auditReadingTimeEl.innerText = `${readingTime} min`;

    // 4. Schema Detection with Modal Interaction
    const schemaList = document.getElementById('schema-list');
    if (schemaList) {
        schemaList.innerHTML = '';
        if (data.schemas && data.schemas.length > 0) {
          data.schemas.forEach(s => {
            const badge = document.createElement('span');
            badge.className = 'schema-badge';
            badge.style.cursor = 'pointer';
            badge.title = 'Click to inspect JSON';
            badge.innerText = s.type;
            badge.onclick = () => showSchemaModal(s);
            schemaList.appendChild(badge);
          });
        } else {
          schemaList.innerHTML = '<span style="color: var(--text-grey); font-size: 11px;">No JSON-LD Schema detected.</span>';
        }
    }

    // 5. SEO Insights (Populates the "SEO Health & Insights" section)
    displayInsights(data);
  }

  function showSchemaModal(schema) {
    const modal = document.getElementById('schema-modal');
    const title = document.getElementById('schema-details-title');
    const jsonEl = document.getElementById('schema-json');
    const copyBtn = document.getElementById('btn-copy-schema-code');
    
    if (modal && title && jsonEl) {
      title.innerText = `Type: ${schema.type}`;
      let formatted = schema.json;
      try {
        formatted = JSON.stringify(JSON.parse(schema.json), null, 2);
      } catch(e) {}
      
      jsonEl.innerText = formatted;
      modal.style.display = 'block';

      if (copyBtn) {
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(formatted).then(() => {
            const originalHtml = copyBtn.innerHTML;
            copyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#64ffda" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
            setTimeout(() => copyBtn.innerHTML = originalHtml, 2000);
          });
        };
      }
    }
  }

  // Close Schema Modal
  document.getElementById('close-schema-modal')?.addEventListener('click', () => {
    document.getElementById('schema-modal').style.display = 'none';
  });
  window.addEventListener('click', (e) => {
    if (e.target.id === 'schema-modal') document.getElementById('schema-modal').style.display = 'none';
  });

  function displayInsights(data) {
    const insightsDiv = document.getElementById('meta-insights');
    if (!insightsDiv || !data) return;
    insightsDiv.innerHTML = '';
    
    const insights = [];

    // Helper for SVG icons
    const getIcon = (type) => {
      const svgs = {
        good: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="#64ffda" stroke-width="3" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        warn: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="#ffab00" stroke-width="2.5" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        bad: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="#ff5252" stroke-width="2.5" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        image: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="#ffab00" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
        rocket: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="#64ffda" stroke-width="2" fill="none"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4.5c1.62-1.62 5-2.5 5-2.5"></path><path d="M12 15v5s3.03-.55 4.5-2c1.62-1.62 2.5-5 2.5-5"></path></svg>'
      };
      return svgs[type] || svgs.warn;
    };

    // 1. Meta Insights
    const tLen = data.title?.length || 0;
    if (tLen === 0) insights.push({ type: 'bad', icon: getIcon('bad'), text: 'Missing Title Tag!', help: 'Google will show a generic title, hurting click-through rate.' });
    else if (tLen < 30) insights.push({ type: 'warn', icon: getIcon('warn'), text: 'Title is too short.', help: 'Aim for 50-60 characters for maximum SEO benefit.' });
    else if (tLen > 65) insights.push({ type: 'bad', icon: getIcon('bad'), text: 'Title too long.', help: 'Title will be truncated in search results.' });
    else insights.push({ type: 'good', icon: getIcon('good'), text: 'Title is optimized.', help: 'Perfect length for desktop and mobile search.' });

    const dLen = data.description?.length || 0;
    if (dLen === 0) insights.push({ type: 'bad', icon: getIcon('bad'), text: 'Missing Meta Description!', help: 'Increases bounce rate as users cannot see a summary of the page.' });
    else if (dLen < 120) insights.push({ type: 'warn', icon: getIcon('warn'), text: 'Description is brief.', help: 'Add more selling points to reach 120-160 characters.' });
    else if (dLen > 165) insights.push({ type: 'bad', icon: getIcon('bad'), text: 'Description too long.', help: 'Descriptions will be cut off in search results.' });
    else insights.push({ type: 'good', icon: getIcon('good'), text: 'Meta Description is optimized.', help: 'Great for attracting clicks.' });

    // Indexibility Check
    const robotsText = String(data.robots || '').toLowerCase();
    const isNoIndex = robotsText.includes('noindex');
    if (isNoIndex) {
      insights.push({ type: 'bad', icon: getIcon('bad'), text: 'No-Index found!', help: 'Search engines are BLOCKED from indexing this page.' });
    } else {
      insights.push({ type: 'good', icon: getIcon('rocket'), text: 'Page is Indexable.', help: 'Search engines can crawl and index this page.' });
    }

    // Canonical Check
    if (!data.canonical) insights.push({ type: 'warn', icon: getIcon('warn'), text: 'Missing Canonical Tag.', help: 'This can cause duplicate content issues.' });
    
    // Social Image Check
    if (!data.og?.image) insights.push({ type: 'warn', icon: getIcon('image'), text: 'Missing Social Image.', help: 'Page will look boring when shared on social media.' });

    // Render
    insights.forEach(item => {
      const el = document.createElement('div');
      el.className = `insight-item ${item.type}`;
      el.innerHTML = `
        <div style="flex-shrink: 0; margin-top: 2px;">${item.icon}</div>
        <div>
          <strong>${item.text}</strong>
          <span class="help-text">${item.help}</span>
        </div>
      `;
      insightsDiv.appendChild(el);
    });
  }

  // Keyword Logic
  const keywordResults = document.getElementById('keyword-results');
  const emptyKeywords = document.getElementById('empty-keywords');
  const keywordList = document.getElementById('keyword-list');
  const keywordCorrelation = document.getElementById('keyword-correlation');

  const STOP_WORDS = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of', 'with', 'by', 'as', 'it', 'its', 'that', 'this', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did']);

  function displayKeywords(text, meta) {
    keywordResults.style.display = 'block';
    emptyKeywords.style.display = 'none';
    keywordList.innerHTML = '';
    
    if (!isUserPro) {
      keywordList.innerHTML = '<div style="text-align:center; padding: 30px; border: 1px dashed var(--border-blue); border-radius: 12px; background: rgba(0,0,0,0.2);"><div style="color:#FFD700; font-size: 18px; margin-bottom:10px;">🛡️ PRO</div><div style="font-size:11px; font-weight: 800; color:#fff; text-transform: uppercase; margin-bottom: 5px;">Density Analyzer Locked</div><div style="font-size:10px; color:var(--text-grey); line-height: 1.4;">Unlock 2-word focus phrase extraction and full correlation auditing.</div></div>';
      return;
    }

    const words = text.split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w));
    
    // 1. Calculate Single Word Density
    const singleCounts = {};
    words.forEach(w => singleCounts[w] = (singleCounts[w] || 0) + 1);

    // 2. Calculate Bigrams (2-word phrases)
    const bigrams = [];
    for (let i = 0; i < words.length - 1; i++) {
      bigrams.push(`${words[i]} ${words[i+1]}`);
    }
    const bigramCounts = {};
    bigrams.forEach(b => bigramCounts[b] = (bigramCounts[b] || 0) + 1);

    // 3. Merged top sets
    const sortedSingles = Object.entries(singleCounts).sort((a,b) => b[1] - a[1]).slice(0, 8);
    const sortedBigrams = Object.entries(bigramCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);

    const title = meta?.title?.toLowerCase() || '';
    
    // 4. Render
    [...sortedSingles, ...sortedBigrams].sort((a,b) => b[1] - a[1]).forEach(([kw, count]) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.padding = '8px';
      row.style.background = 'rgba(255,255,255,0.03)';
      row.style.borderRadius = '6px';

      const inTitle = title.includes(kw);
      
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
          <span style="font-size: 11px; font-weight: 700; color: var(--text-white);">${kw}</span>
          ${inTitle ? '<span class="badge" style="background: rgba(100, 255, 218, 0.1); color: var(--accent-cyan); font-size: 8px; font-weight: 800; border: 1px solid var(--accent-cyan);">IN TITLE</span>' : ''}
        </div>
        <div style="font-size: 11px; color: var(--accent-cyan); font-weight: 800; opacity: 0.8;">${count}x</div>
      `;
      keywordList.appendChild(row);
    });

    // 5. Correlation Sugestions
    const topKey = sortedSingles[0]?.[0];
    if (topKey && !title.includes(topKey)) {
        keywordCorrelation.innerHTML = `Your most used word is <strong>"${topKey}"</strong>, but it is NOT in your Meta Title. Consider including it for better keyword relevance.`;
    } else {
        keywordCorrelation.innerHTML = "Great job! Your top focus keywords are well-correlated with your page's meta metadata.";
    }
  }

  function updateBadge(el, count, min, max) {
    el.className = 'badge';
    if (count === 0) el.classList.add('bad');
    else if (count >= min && count <= max) el.classList.add('good');
    else if (count < min) el.classList.add('warn');
    else el.classList.add('bad');
  }

  // --- MASTER UNIVERSAL SCAN LOGIC ---
  const btnScanUniversal = document.getElementById('btn-scan-universal');
  const urlInput = document.getElementById('universal-url-input');
  
  // Dashboard Items
  const btnCopyReport = document.getElementById('btn-copy-report');
  const dashboardResults = document.getElementById('dashboard-results');
  const emptyDashboard = document.getElementById('empty-dashboard');
  const fixesList = document.getElementById('fixes-list');
  const breakdownList = document.getElementById('breakdown-list');
  const scoreVal = document.getElementById('health-score-val');
  const scoreCircle = document.getElementById('score-circle');

  let currentAuditData = null;

  // Pre-fill URL on Load
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab && tab.url && tab.url.startsWith('http')) {
      if (urlInput && !urlInput.value) urlInput.value = tab.url;
    }
  });

  const btnClearInput = document.getElementById('btn-clear-input');

  function updateVitals(vitals, links) {
    if (!vitals) return;
    const lcpEl = document.getElementById('vital-lcp');
    const clsEl = document.getElementById('vital-cls');
    const ratioEl = document.getElementById('vital-link-ratio');

    // Dashboard Gauges
    const gaugeLcpFill = document.getElementById('gauge-fill-lcp');
    const gaugeLcpVal = document.getElementById('gauge-val-lcp');
    const gaugeClsFill = document.getElementById('gauge-fill-cls');
    const gaugeClsVal = document.getElementById('gauge-val-cls');
    const gaugeFidFill = document.getElementById('gauge-fill-fid');
    const gaugeFidVal = document.getElementById('gauge-val-fid');

    const circumference = 188.4;

    const setGauge = (fill, valEl, value, unit, thresholds) => {
        if (!fill || !valEl) return;
        valEl.innerText = value > 0 ? `${value.toFixed(unit === 's' ? 2 : 3)}${unit}` : '---';
        
        // Percent calculation for the gauge (simplification)
        let percent = 0;
        if (value > 0) {
            if (unit === 's') percent = Math.min(100, (value / thresholds[1]) * 100);
            else percent = Math.min(100, (value / thresholds[1]) * 100);
        }
        
        // Google's 0-100 logic (inverted for gauges: more fill = worse?)
        // Actually, let's just show the fill based on health: Green = Full, Red = Empty? 
        // Or better: Red-to-Green arc.
        const offset = circumference - (Math.min(1, value / thresholds[1]) * circumference);
        fill.style.strokeDashoffset = isNaN(offset) ? circumference : offset;
        fill.style.stroke = value < thresholds[0] ? '#64ffda' : (value < thresholds[1] ? '#ffab00' : '#ff5252');
    };

    if (lcpEl) {
      const lcp = vitals.lcp || 0;
      setGauge(gaugeLcpFill, gaugeLcpVal, lcp, 's', [2.5, 4.0]);
      lcpEl.innerText = lcp > 0 ? `${lcp.toFixed(2)}s` : '---';
      lcpEl.style.color = lcp < 2.5 ? 'var(--accent-cyan)' : (lcp < 4 ? '#ffab00' : '#ff5252');
    }
    if (clsEl) {
      const cls = vitals.cls || 0;
      setGauge(gaugeClsFill, gaugeClsVal, cls, '', [0.1, 0.25]);
      clsEl.innerText = cls.toFixed(3);
      clsEl.style.color = cls < 0.1 ? 'var(--accent-cyan)' : (cls < 0.25 ? '#ffab00' : '#ff5252');
    }
    
    const fid = vitals.fid || 0;
    setGauge(gaugeFidFill, gaugeFidVal, fid, 'ms', [100, 300]);

    if (ratioEl && links) {
      const internal = links.filter(l => l.type === 'Internal').length;
      const total = links.length;
      const ratio = total > 0 ? Math.round((internal / total) * 100) : 100;
      ratioEl.innerText = `${ratio}%`;
      ratioEl.style.color = ratio > 60 ? 'var(--accent-cyan)' : '#ffab00';
    }
  }

  if (btnScanUniversal) btnScanUniversal.addEventListener('click', runFullAudit);
  if (btnCopyReport) btnCopyReport.addEventListener('click', copyFullReport);
  if (btnClearInput) {
    btnClearInput.addEventListener('click', () => {
      urlInput.value = '';
      urlInput.focus();
    });
  }

  async function runFullAudit() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Auto-detect URL if field is empty
    if (urlInput && !urlInput.value.trim() && tab && tab.url) {
      urlInput.value = tab.url;
    }
    
    let scanUrl = urlInput ? urlInput.value.trim() : (tab ? tab.url : '');

    // If typing a new URL, navigate the tab first
    if (scanUrl && scanUrl !== tab.url && (scanUrl.startsWith('http'))) {
        btnScanUniversal.innerText = 'Navigating...';
        await chrome.tabs.update(tab.id, { url: scanUrl });
        // Give it a moment to start loading
        setTimeout(() => runFullAudit(), 2000); 
        return;
    }

    btnScanUniversal.innerText = 'Analyzing...';
    
    // Trigger all individual data gathers
    chrome.tabs.sendMessage(tab.id, { action: "GET_METADATA" }, (metaRes) => {
      chrome.tabs.sendMessage(tab.id, { action: "GET_HEADINGS" }, (headRes) => {
        chrome.tabs.sendMessage(tab.id, { action: "GET_KEYWORDS" }, (kwRes) => {
          chrome.tabs.sendMessage(tab.id, { action: "GET_LINKS" }, (linkRes) => {
            chrome.tabs.sendMessage(tab.id, { action: "GET_IMAGES" }, (imgRes) => {
              btnScanUniversal.innerText = 'Scan Page';
              
              // Check if all responses have the required data
              if (metaRes && metaRes.metadata && headRes && headRes.headings && kwRes && kwRes.text && linkRes && linkRes.links && imgRes && imgRes.images) {
                lastLinksScanned = linkRes.links;
                lastImagesScanned = imgRes.images;
                currentAuditData = { 
                  meta: metaRes.metadata, 
                  headings: headRes.headings, 
                  text: kwRes.text, 
                  links: linkRes.links,
                  images: imgRes.images,
                  url: scanUrl 
                };
                
                // Pre-fill tabs (don't pass parameters - functions get filters from HTML)
                if (typeof displayMetadata === 'function') displayMetadata(metaRes.metadata);
                if (typeof displayKeywords === 'function') displayKeywords(kwRes.text, metaRes.metadata);
                if (typeof displayLinks === 'function') displayLinks();
                if (typeof displayHeadings === 'function') displayHeadings(headRes.headings);
                if (typeof displayImages === 'function') {
                  // Reset to 'all' filter by default
                  const imgFilterBtns = document.querySelectorAll('[data-img-filter]');
                  imgFilterBtns.forEach(b => b.classList.remove('active'));
                  const allBtn = document.querySelector('[data-img-filter="all"]');
                  if (allBtn) allBtn.classList.add('active');
                  displayImages('all');
                }
                
                if (metaRes.metadata && metaRes.metadata.vitals) {
                    updateVitals(metaRes.metadata.vitals, linkRes.links);
                }

                processDashboard(metaRes.metadata, headRes.headings, kwRes.text, linkRes.links, imgRes.images, scanUrl);
                
                // Update Metadata Tab Counters (New IDs from UX Polish)
                const intCount = linkRes.links.filter(l => l.type === 'Internal').length;
                const extCount = linkRes.links.filter(l => l.type === 'External').length;
                const miscCount = linkRes.links.length - (intCount + extCount);

                if (document.getElementById('link-internal')) document.getElementById('link-internal').innerText = intCount;
                if (document.getElementById('link-external')) document.getElementById('link-external').innerText = extCount;
                if (document.getElementById('link-misc')) document.getElementById('link-misc').innerText = miscCount;

                const imgCountEl = document.getElementById('img-total');
                const imgAltEl = document.getElementById('img-noalt');
                if (imgCountEl) imgCountEl.innerText = imgRes.images.length;
                if (imgAltEl) imgAltEl.innerText = imgRes.images.filter(i => !i.alt).length;
                
                // Auto-switch to metadata tab to show results
                const metaTab = document.querySelector('[data-tab=\"metadata\"]');
                const metaPane = document.getElementById('metadata');
                if (metaTab && metaPane) {
                  const navItems = document.querySelectorAll('.nav-item');
                  const tabPanes = document.querySelectorAll('.tab-pane');
                  navItems.forEach(item => item.classList.remove('active'));
                  tabPanes.forEach(pane => pane.classList.remove('active'));
                  metaTab.classList.add('active');
                  metaPane.classList.add('active');
                  // Scroll to top when showing results
                  const contentArea = document.querySelector('.content-area');
                  if (contentArea) {
                    contentArea.scrollTop = 0;
                  }
                }
                
                // Show success toast
                showAuthSuccess('✓ Scan completed successfully!');

                // Update specific badge states on dashboard
                setTimeout(() => checkSiteArchitecture(metaRes.metadata), 500);

              } else {
                // Log what failed for debugging
                console.error('Scan failed. Response data:', {
                  metaRes: metaRes?.metadata ? 'OK' : 'MISSING',
                  headRes: headRes?.headings ? 'OK' : 'MISSING',
                  kwRes: kwRes?.text ? 'OK' : 'MISSING',
                  linkRes: linkRes?.links ? 'OK' : 'MISSING',
                  imgRes: imgRes?.images ? 'OK' : 'MISSING'
                });
                alert("Could not reach page content. If you just navigated, please wait a moment and click Scan again.");
              }
            });
          });
        });
      });
    });
  }

  function updateDashboardBadge(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerText = text;
    el.className = text === 'Found' ? 'badge' : 'badge missing';
  }

  function processDashboard(meta, headings, text, links, images, url) {
    if (!dashboardResults) return;
    dashboardResults.style.display = 'block';
    if (emptyDashboard) emptyDashboard.style.display = 'none';
    fixesList.innerHTML = '';
    breakdownList.innerHTML = '';

    const fixes = [];
    const health = {
        meta: 100,
        headings: 100,
        images: 100,
        density: 100
    };

    // 1. Meta Audit
    if (!meta.title) { fixes.push({ type: 'bad', text: "Missing Title Tag" }); health.meta -= 50; }
    else if (meta.title.length < 50 || meta.title.length > 65) { fixes.push({ type: 'warn', text: "Title Length unoptimized" }); health.meta -= 20; }
    
    if (!meta.description) { fixes.push({ type: 'bad', text: "Missing Meta Description" }); health.meta -= 40; }
    if (!meta.canonical) { fixes.push({ type: 'warn', text: "Missing Canonical Tag" }); health.meta -= 10; }

    // 2. Headings Audit
    const h1Count = headings.filter(h => h.tag === 'H1').length;
    if (h1Count === 0) { fixes.push({ type: 'bad', text: "No H1 Tag found" }); health.headings -= 60; }
    else if (h1Count > 1) { fixes.push({ type: 'warn', text: `Multiple H1s (${h1Count})` }); health.headings -= 30; }

    // 3. Image Audit
    const missingAlt = images ? images.filter(i => !i.alt).length : (meta?.audit?.images?.missingAlt || 0);
    if (missingAlt > 0) {
        fixes.push({ type: 'bad', text: `${missingAlt} Images missing Alt Text` });
        health.images = Math.max(0, 100 - (missingAlt * 10));
    }

    // 4. Keyword Audit
    const words = (text || "").split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w));
    const counts = {};
    words.forEach(w => counts[w] = (counts[w] || 0) + 1);
    const topKey = Object.entries(counts).sort((a,b) => b[1] - a[1])[0]?.[0];
    const title = meta?.title?.toLowerCase() || '';
    if (topKey && !title.includes(topKey)) {
        fixes.push({ type: 'warn', text: `Primary keyword "${topKey}" not in Title` });
        health.density -= 20;
    }

    // 5. NEW: Indexability Badge Logic
    const isNoIndex = String(meta.robots || '').toLowerCase().includes('noindex');
    const indexStatusCard = document.getElementById('index-status-card');
    const indexStatusIcon = document.getElementById('index-status-icon');
    const indexStatusText = document.getElementById('index-status-text');
    const indexBadge = document.getElementById('index-badge');

    if (indexStatusCard) {
      if (isNoIndex) {
        indexStatusCard.style.borderLeftColor = '#ff5252';
        if (indexStatusIcon) {
          indexStatusIcon.style.background = 'rgba(255, 82, 82, 0.1)';
          indexStatusIcon.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ff5252" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        }
        if (indexStatusText) indexStatusText.innerText = 'No-Index Found';
        if (indexBadge) {
          indexBadge.className = 'badge bad';
          indexBadge.innerText = 'Blocked';
        }
      } else {
        indexStatusCard.style.borderLeftColor = 'var(--accent-cyan)';
        if (indexStatusIcon) {
          indexStatusIcon.style.background = 'rgba(100, 255, 218, 0.1)';
          indexStatusIcon.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--accent-cyan)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        }
        if (indexStatusText) indexStatusText.innerText = 'Indexable';
        if (indexBadge) {
          indexBadge.className = 'badge good';
          indexBadge.innerText = 'Active';
        }
      }
    }

    // Stores calculated fixes for copy function
    currentAuditData.calculatedFixes = fixes;

    // Detailed Fix Guide Data
    const FIX_GUIDE = {
      "Missing Title Tag": {
        category: "On-Page SEO",
        threat: "Search engines will have to guess your page's purpose, leading to poor rankings and confusing search results.",
        howToFix: [
          "Locate <head> in your HTML.",
          "Add a <title> tag with keywords.",
          "Keep length between 50-60 chars."
        ],
        links: [{ text: "Google Title Guidelines", url: "https://developers.google.com/search/docs/appearance/title-links" }]
      },
      "Title Length unoptimized": {
        category: "Content Quality",
        threat: "Titles too short miss keyword opportunities; titles too long generate truncated (...) search results which hurt CTR.",
        howToFix: [
          "Adjust title to be 50-60 chars.",
          "Place primary keywords at the start."
        ]
      },
      "Missing Meta Description": {
        category: "On-Page SEO",
        threat: "Without a description, Google pulls random text snippets which often look unprofessional and reduce clicks.",
        howToFix: [
          "Add <meta name='description' content='...'> to head.",
          "Write a unique summary (120-160 chars)."
        ],
        links: [{ text: "Meta Description SEO Guide", url: "https://yoast.com/meta-descriptions/" }]
      },
      "Missing Canonical Tag": {
        category: "Technical SEO",
        threat: "Search engines may index multiple versions of the same URL (e.g. with params), splitting your ranking power (link equity).",
        howToFix: [
          "Add <link rel='canonical' href='YOUR_URL'> to head.",
          "Ensure it points to the primary version."
        ]
      },
      "No H1 Tag found": {
        category: "Content Structure",
        threat: "The H1 tells Google the main topic. Without it, the semantic structure of your page is severely weakened.",
        howToFix: [
          "Wrap your main page title in an <h1> tag.",
          "Ensure there is only one H1 per page."
        ]
      },
      "Multiple H1s": {
        category: "Technical Structure",
        threat: "Multiple H1s confuse search crawlers about which subject is the primary focus of the page.",
        howToFix: [
          "Choose one primary header for H1.",
          "Demote other H1s to H2 or H3."
        ]
      },
      "Images missing Alt Text": {
        category: "Accessibility & SEO",
        threat: "Images without alt text cannot be ranked in Google Images and make the site difficult for screen readers to interpret.",
        howToFix: [
          "Inspect the Images tab in Blueprint.",
          "Add alt='description' to all <img> tags."
        ]
      },
      "Primary keyword": {
        category: "Relevancy",
        threat: "Your most common word isn't in the page title. This signals a lack of topical focus to search engines.",
        howToFix: [
          "Include the primary keyword in your Title Tag.",
          "Make sure it appears naturally in heading tags."
        ]
      }
    };

    // Render Fixes with Accordion
    if (fixes.length === 0) {
        fixesList.innerHTML = '<div class="insight-item good"><strong>No issues found!</strong> Your page is doing great.</div>';
    } else {
        fixes.forEach((f, idx) => {
            const el = document.createElement('div');
            el.className = `insight-item ${f.type} accordion-item`;
            
            // Try to find the guide entry
            const matchKey = Object.keys(FIX_GUIDE).find(key => f.text.includes(key));
            const guide = matchKey ? FIX_GUIDE[matchKey] : null;

            el.innerHTML = `
              <div class="accordion-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%; cursor: pointer;">
                <strong>${f.text}</strong>
                <svg class="chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform 0.3s;">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              <div class="accordion-content" style="display: none; width: 100%; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); margin-top: 8px;">
                ${guide ? `
                  <div style="margin-bottom: 12px;">
                    <div class="meta-label">Affected URL</div>
                    <div style="font-size: 10px; color: var(--accent-cyan); word-break: break-all;">${url || 'Current Page'}</div>
                  </div>
                  <div style="margin-bottom: 12px;">
                    <div class="meta-label">Technical Threat</div>
                    <div style="font-size: 11px; color: var(--text-grey); line-height: 1.5;">${guide.threat}</div>
                  </div>
                  <div style="margin-bottom: 12px;">
                    <div class="meta-label">How to Fix</div>
                    <ul style="margin: 4px 0 0 0; padding-left: 15px; font-size: 11px; color: var(--text-white); line-height: 1.6;">
                      ${guide.howToFix.map(step => `<li>${step}</li>`).join('')}
                    </ul>
                  </div>
                  ${guide.links ? `
                    <div>
                      <div class="meta-label">Useful Resources</div>
                      <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
                        ${guide.links.map(link => `<a href="${link.url}" target="_blank" style="color: var(--accent-cyan); text-decoration: none; font-size: 11px;">→ ${link.text}</a>`).join('')}
                      </div>
                    </div>
                  ` : ''}
                ` : `<div style="color: var(--text-grey); font-size: 11px;">Expand to see more details...</div>`}
              </div>
            `;

            el.querySelector('.accordion-header').addEventListener('click', () => {
              const content = el.querySelector('.accordion-content');
              const chevron = el.querySelector('.chevron');
              const isOpen = content.style.display === 'block';
              
              content.style.display = isOpen ? 'none' : 'block';
              chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
              el.classList.toggle('active', !isOpen);
            });

            fixesList.appendChild(el);
        });
    }

    // Render Summary Counts
    const badCount = fixes.filter(f => f.type === 'bad').length;
    const warnCount = fixes.filter(f => f.type === 'warn').length;
    const goodCount = 30; // Base "helping" factors (meta present, etc.)

    document.getElementById('summary-bad-count').innerText = badCount;
    document.getElementById('summary-warn-count').innerText = warnCount;
    document.getElementById('summary-good-count').innerText = goodCount;
    document.getElementById('last-scanned-url-text').innerText = `Audit Report for: ${url || 'active page'}`;

    // Render Breakdown
    const stats = [
        { label: 'Metadata', val: Math.max(0, health.meta) },
        { label: 'Structure', val: Math.max(0, health.headings) },
        { label: 'Images', val: Math.max(0, health.images) },
        { label: 'Keywords', val: Math.max(0, health.density) },
        { label: 'Links', val: links ? Math.min(100, (links.filter(l => l.type === 'Internal').length + 5) * 10) : 0 }
    ];

    stats.forEach(s => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
            <span class="stat-val">${s.val}%</span>
            <span class="stat-label">${s.label}</span>
        `;
        breakdownList.appendChild(card);
    });

    // 5. Overall Score Animation
    const linksScore = stats[4].val;
    const totalScore = Math.round(
      (health.meta * 0.25) + 
      (health.headings * 0.2) + 
      (health.images * 0.2) + 
      (health.density * 0.2) + 
      (linksScore * 0.15)
    );
    const finalScore = Math.max(0, Math.min(100, totalScore));
    currentAuditData.totalScore = finalScore;
    
    scoreVal.innerText = `${finalScore}%`;
    const offset = 282.7 - (282.7 * finalScore / 100);
    scoreCircle.style.strokeDashoffset = offset;
    
    // Change circle color based on score
    if (finalScore > 80) scoreCircle.setAttribute('stroke', 'var(--accent-cyan)');
    else if (finalScore > 50) scoreCircle.setAttribute('stroke', '#ffab00');
    else scoreCircle.setAttribute('stroke', '#ff5252');

    // 6. Update Technical Vitals
    try {
        const securityEl = document.getElementById('vital-security');
        if (securityEl) {
            securityEl.innerText = meta?.vitals?.isHttps ? 'HTTPS' : 'HTTP';
            securityEl.style.color = meta?.vitals?.isHttps ? 'var(--accent-cyan)' : '#ff5252';
        }

        const speedEl = document.getElementById('vital-speed');
        if (speedEl) {
            const loadSecsRaw = meta?.vitals?.loadTime || 0;
            const loadSecs = Number(loadSecsRaw).toFixed(2);
            speedEl.innerText = loadSecs > 0 ? `${loadSecs}s` : 'Ready';
            speedEl.style.color = (Number(loadSecs) < 3 && Number(loadSecs) >= 0) ? 'var(--accent-cyan)' : '#ffab00';
        }

        const assetCountEl = document.getElementById('vital-asset-count');
        if (assetCountEl && meta?.vitals?.resources) {
            assetCountEl.innerText = (meta.vitals.resources.scripts || 0) + (meta.vitals.resources.styles || 0);
        }

        if (meta?.stats && meta.stats.htmlSize) {
            const ratio = ((meta.stats.textSize / meta.stats.htmlSize) * 100).toFixed(1);
            const ratioEl = document.getElementById('vital-ratio');
            if (ratioEl) {
                ratioEl.innerText = `${ratio}%`;
                ratioEl.style.color = ratio > 10 ? 'var(--accent-cyan)' : '#ffab00';
            }
        }
    } catch(e) { console.warn("Vitals summary error:", e); }

    if (meta?.vitals?.resources?.list) {
        analyzeHeavyAssets(meta.vitals.resources.list);
    }
    
    // 8. NEW: Architecture Summary Grid
    updateArchitectureGrid(meta, headings, links, images);

    // 9. Site-wide Architecture Check
    checkSiteArchitecture(meta);
  }

  function updateArchitectureGrid(meta, headings, links, images) {
    const h1Count = headings.filter(h => h.tag === 'H1').length;
    const h2Count = headings.filter(h => h.tag === 'H2').length;
    
    const gH1 = document.getElementById('grid-h1');
    const gH2 = document.getElementById('grid-h2');
    const gImgs = document.getElementById('grid-imgs');
    const gLinks = document.getElementById('grid-links');

    if (gH1) gH1.innerText = h1Count;
    if (gH2) gH2.innerText = h2Count;
    if (gImgs) gImgs.innerText = images ? images.length : (meta.audit?.images?.total || 0);
    if (gLinks) gLinks.innerText = links ? links.length : (meta.audit?.links?.internal + meta.audit?.links?.external || 0);

    // Color code H1
    if (gH1) gH1.style.color = (h1Count === 1) ? 'var(--accent-cyan)' : '#ff5252';
  }

  async function analyzeHeavyAssets(resources) {
    const listEl = document.getElementById('heavy-assets-list');
    const sectionEl = document.getElementById('heavy-assets-section');
    if (!listEl || !resources || resources.length === 0) return;

    sectionEl.style.display = 'block';
    listEl.innerHTML = '<div style="font-size:10px; color:var(--text-grey);">Scanning weights...</div>';

    // To avoid hitting dozens of resources, we pick top candidates (all scripts/styles and first 10 images)
    const candidates = resources.slice(0, 30); 
    
    const results = [];
    const promises = candidates.map(async (res) => {
      try {
        const response = await fetch(res.url, { method: 'HEAD' });
        const size = response.headers.get('content-length');
        if (size) {
          results.push({ ...res, size: parseInt(size) });
        }
      } catch (e) { /* skip fails */ }
    });

    await Promise.allSettled(promises);
    
    // Sort by size and take top 5
    const top5 = results.sort((a, b) => b.size - a.size).slice(0, 5);
    
    listEl.innerHTML = '';
    if (top5.length === 0) {
        listEl.innerHTML = '<div style="font-size:10px; color:var(--text-grey);">No large resources detected.</div>';
    } else {
        top5.forEach(asset => {
            const kb = (asset.size / 1024).toFixed(1);
            const fileName = asset.url.split('/').pop().split('?')[0] || 'unknown';
            
            const div = document.createElement('div');
            div.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:rgba(255,171,0,0.05); padding:6px 10px; border-radius:6px; border:1px solid rgba(255,171,0,0.1);';
            div.innerHTML = `
                <div style="flex:1; min-width:0; margin-right:10px;">
                    <div style="font-size:10px; font-weight:700; color:var(--text-white); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${fileName}</div>
                    <div style="font-size:8px; color:var(--text-grey);">${asset.type}</div>
                </div>
                <div style="font-size:11px; font-weight:800; color:#ffab00;">${kb} KB</div>
            `;
            listEl.appendChild(div);
        });
    }
  }

  function copyFullReport() {
    // Check if user is pro
    if (!isUserPro) {
      const originalText = btnCopyReport.innerHTML;
      btnCopyReport.innerHTML = '🛡️ PRO Feature';
      setTimeout(() => btnCopyReport.innerHTML = originalText, 2000);
      return;
    }

    if (!currentAuditData) return;
    
    const { meta, headings, links, images, text, url } = currentAuditData;
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    
    // Extract domain from URL
    let domain = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    
    // Calculate statistics
    const totalImages = images?.length || 0;
    const brokenImages = images?.filter(img => img.isBroken)?.length || 0;
    const imagesWithoutAlt = images?.filter(img => !img.alt)?.length || 0;
    const totalLinks = links?.length || 0;
    const externalLinks = links?.filter(link => link.type === 'external')?.length || 0;
    const internalLinks = links?.filter(link => link.type === 'internal')?.length || 0;
    const noFollowLinks = links?.filter(link => link.isNoFollow)?.length || 0;
    
    const h1Count = headings?.filter(h => h.tag === 'H1')?.length || 0;
    const h2Count = headings?.filter(h => h.tag === 'H2')?.length || 0;
    const h3Count = headings?.filter(h => h.tag === 'H3')?.length || 0;
    
    const wordCount = text?.split(/\s+/).length || 0;
    
    // Generate comprehensive HTML report
    const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blueprint SEO Report - ${domain}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; }
        header { 
            border-bottom: 3px solid #667eea;
            margin-bottom: 30px;
            padding-bottom: 20px;
        }
        h1 { color: #667eea; margin-bottom: 10px; font-size: 32px; }
        .report-info { 
            display: flex; 
            justify-content: space-between; 
            flex-wrap: wrap;
            gap: 20px;
            color: #666;
            font-size: 14px;
        }
        .report-info div { display: flex; flex-direction: column; }
        .report-info label { font-weight: 600; color: #333; }
        
        section { margin: 30px 0; }
        section h2 { 
            color: #667eea;
            font-size: 20px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e0e0e0;
        }
        
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .stat-card { 
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            border-radius: 4px;
        }
        .stat-card .label { font-size: 12px; color: #666; text-transform: uppercase; font-weight: 600; }
        .stat-card .value { font-size: 28px; font-weight: bold; color: #667eea; margin-top: 8px; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { 
            background: #667eea; 
            color: white; 
            padding: 12px; 
            text-align: left;
            font-weight: 600;
        }
        td { 
            padding: 10px 12px; 
            border-bottom: 1px solid #e0e0e0;
        }
        tr:nth-child(even) { background: #f8f9fa; }
        
        .heading-item {
            margin: 10px 0;
            padding: 10px;
            background: #f8f9fa;
            border-left: 3px solid #ffa500;
            border-radius: 3px;
        }
        
        .link-item {
            margin: 8px 0;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 3px;
            word-break: break-all;
            font-size: 13px;
        }
        
        .image-item {
            margin: 8px 0;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 3px;
            font-size: 13px;
        }
        
        .broken { color: #e74c3c; font-weight: 600; }
        .warning { color: #f39c12; font-weight: 600; }
        .success { color: #27ae60; font-weight: 600; }
        
        footer { 
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #999;
            font-size: 12px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🚀 Blueprint SEO Audit Report</h1>
            <div class="report-info">
                <div>
                    <label>Website URL</label>
                    <span>${url}</span>
                </div>
                <div>
                    <label>Generated Date</label>
                    <span>${dateStr} at ${timeStr}</span>
                </div>
                <div>
                    <label>Report Type</label>
                    <span>Comprehensive Audit</span>
                </div>
            </div>
        </header>

        <!-- METADATA SECTION -->
        <section>
            <h2>📋 Page Metadata</h2>
            <div class="grid">
                <div class="stat-card">
                    <div class="label">Page Title</div>
                    <div class="value" style="font-size: 16px; overflow-wrap: break-word;">${meta?.title || 'Not set'}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Meta Description</div>
                    <div class="value" style="font-size: 14px; overflow-wrap: break-word;">${meta?.description || 'Not set'}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Word Count</div>
                    <div class="value">${wordCount.toLocaleString()}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Canonical URL</div>
                    <div class="value" style="font-size: 12px; overflow-wrap: break-word;">${meta?.canonical || 'Not set'}</div>
                </div>
            </div>
        </section>

        <!-- HEADINGS STRUCTURE SECTION -->
        <section>
            <h2>🏷️ Heading Structure</h2>
            <div class="grid">
                <div class="stat-card">
                    <div class="label">Total Headings</div>
                    <div class="value">${headings?.length || 0}</div>
                </div>
                <div class="stat-card">
                    <div class="label">H1 Tags</div>
                    <div class="value">${h1Count}</div>
                </div>
                <div class="stat-card">
                    <div class="label">H2 Tags</div>
                    <div class="value">${h2Count}</div>
                </div>
                <div class="stat-card">
                    <div class="label">H3 Tags</div>
                    <div class="value">${h3Count}</div>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <h3 style="color: #333; margin-bottom: 10px;">All Headings:</h3>
                ${headings && headings.length > 0 ? headings.map(h => `
                    <div class="heading-item">
                        <strong style="color: #667eea;">${h.tag}</strong> - ${h.text}
                    </div>
                `).join('') : '<p style="color: #999;">No headings found</p>'}
            </div>
        </section>

        <!-- LINKS SECTION -->
        <section>
            <h2>🔗 Link Audit</h2>
            <div class="grid">
                <div class="stat-card">
                    <div class="label">Total Links</div>
                    <div class="value">${totalLinks}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Internal Links</div>
                    <div class="value" class="success">${internalLinks}</div>
                </div>
                <div class="stat-card">
                    <div class="label">External Links</div>
                    <div class="value" class="warning">${externalLinks}</div>
                </div>
                <div class="stat-card">
                    <div class="label">NoFollow Links</div>
                    <div class="value">${noFollowLinks}</div>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <h3 style="color: #333; margin-bottom: 10px;">Link Details:</h3>
                ${links && links.length > 0 ? `
                    <table>
                        <thead>
                            <tr>
                                <th>URL</th>
                                <th>Type</th>
                                <th>NoFollow</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${links.map(link => `
                                <tr>
                                    <td style="font-size: 13px; word-break: break-all;">${link.href}</td>
                                    <td>${link.type === 'internal' ? '<span class="success">Internal</span>' : '<span class="warning">External</span>'}</td>
                                    <td>${link.isNoFollow ? '✓' : '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p style="color: #999;">No links found</p>'}
            </div>
        </section>

        <!-- IMAGES SECTION -->
        <section>
            <h2>🖼️ Image Audit</h2>
            <div class="grid">
                <div class="stat-card">
                    <div class="label">Total Images</div>
                    <div class="value">${totalImages}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Missing Alt Text</div>
                    <div class="value broken">${imagesWithoutAlt}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Broken Images</div>
                    <div class="value broken">${brokenImages}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Optimized Images</div>
                    <div class="value success">${totalImages - imagesWithoutAlt - brokenImages}</div>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <h3 style="color: #333; margin-bottom: 10px;">Image Details:</h3>
                ${images && images.length > 0 ? images.map(img => `
                    <div class="image-item">
                        <strong>Alt:</strong> ${img.alt || '<span class="broken">Missing</span>'} | 
                        <strong>Src:</strong> ${img.src.substring(0, 60)}... | 
                        <strong>Status:</strong> ${img.isBroken ? '<span class="broken">Broken</span>' : '<span class="success">OK</span>'}
                    </div>
                `).join('') : '<p style="color: #999;">No images found</p>'}
            </div>
        </section>

        <!-- RECOMMENDATIONS SECTION -->
        <section>
            <h2>⚡ Quick Recommendations</h2>
            <ul style="margin-left: 20px; color: #666;">
                ${h1Count === 0 ? '<li style="color: #e74c3c;">❌ Add an H1 tag - Every page should have exactly one H1</li>' : h1Count > 1 ? '<li style="color: #f39c12;">⚠️ Multiple H1 tags detected - Consider having only one H1 per page</li>' : '<li style="color: #27ae60;">✓ H1 tag properly configured</li>'}
                ${imagesWithoutAlt > 0 ? `<li style="color: #e74c3c;">❌ ${imagesWithoutAlt} images missing alt text - Add descriptive alt text for accessibility and SEO</li>` : '<li style="color: #27ae60;">✓ All images have alt text</li>'}
                ${!meta?.canonical ? '<li style="color: #f39c12;">⚠️ Canonical URL not set - Add canonical tag to prevent duplicate content issues</li>' : '<li style="color: #27ae60;">✓ Canonical URL properly set</li>'}
                ${wordCount < 300 ? '<li style="color: #f39c12;">⚠️ Low word count (${wordCount} words) - Consider expanding content for better SEO</li>' : wordCount > 3000 ? '<li style="color: #f39c12;">⚠️ Very high word count (${wordCount} words) - Keep readers engaged</li>' : '<li style="color: #27ae60;">✓ Content length is optimal</li>'}
                ${externalLinks === 0 && totalLinks > 0 ? '<li style="color: #f39c12;">⚠️ No external links detected - Consider adding authoritative external references</li>' : ''}
            </ul>
        </section>

        <footer>
            <p>🚀 Blueprint SEO Extension | Professional Audit Report</p>
            <p>This comprehensive report was generated by the Blueprint SEO extension for detailed website analysis.</p>
        </footer>
    </div>
</body>
</html>
    `;

    // Create blob and trigger download
    const blob = new Blob([htmlReport], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    const fileName = `blueprint-seo-report-${domain.replace(/\./g, '-')}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.html`;
    
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    // Show success message
    const originalText = btnCopyReport.innerHTML;
    btnCopyReport.innerHTML = '✅ Report Downloaded!';
    setTimeout(() => btnCopyReport.innerHTML = originalText, 2000);
  }

  async function checkSiteArchitecture(meta) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;
    
    const url = new URL(tab.url);
    const origin = url.origin;

    const updateStatus = (id, found) => {
        const el = document.getElementById(id);
        if (found) {
            el.innerText = 'Found';
            el.className = 'badge good';
        } else {
            el.innerText = 'Missing';
            el.className = 'badge bad';
        }
    };

    // Check Robots
    fetch(`${origin}/robots.txt`).then(r => updateStatus('site-robots', r.ok)).catch(() => updateStatus('site-robots', false));
    
    // Check Sitemap (Try common variants)
    fetch(`${origin}/sitemap.xml`).then(r => {
        if (r.ok) updateStatus('site-sitemap', true);
        else return fetch(`${origin}/sitemap_index.xml`);
    }).then(r => {
        if (r && r.ok) updateStatus('site-sitemap', true);
        else if (r) updateStatus('site-sitemap', false);
    }).catch(() => updateStatus('site-sitemap', false));

    // Check Favicon (from meta OR root)
    if (meta.favicon) {
        updateStatus('site-favicon', true);
    } else {
        fetch(`${origin}/favicon.ico`).then(r => updateStatus('site-favicon', r.ok)).catch(() => updateStatus('site-favicon', false));
    }
  }

  // --- LINKS AUDIT LOGIC ---
  const linksList = document.getElementById('links-list');
  const linksStats = document.getElementById('links-stats');
  const linksResults = document.getElementById('links-results');
  const emptyLinks = document.getElementById('empty-links');
  const selectLinkFilter = document.getElementById('select-link-filter');
  const selectStatusFilter = document.getElementById('select-status-filter');
  const btnCheckLinks = document.getElementById('btn-check-links');
  const btnCopyLinksList = document.getElementById('btn-copy-links-list');
  const btnExportLinks = document.getElementById('btn-export-links');
  const btnHighlightFilteredLinks = document.getElementById('btn-highlight-filtered-links');

  if (selectLinkFilter) {
    selectLinkFilter.addEventListener('change', () => {
      displayLinks();
    });
  }

  if (selectStatusFilter) {
    selectStatusFilter.addEventListener('change', () => {
      displayLinks();
    });
  }

  if (btnCheckLinks) btnCheckLinks.addEventListener('click', checkLinksStatus);
  if (btnCopyLinksList) btnCopyLinksList.addEventListener('click', () => copyLinksList());
  if (btnExportLinks) btnExportLinks.addEventListener('click', exportToCSV);
  if (btnHighlightFilteredLinks) btnHighlightFilteredLinks.addEventListener('click', toggleBatchHighlightLinks);

  let isBatchHighlightingLinks = false;
  async function toggleBatchHighlightLinks() {
    if (lastLinksScanned.length === 0) return;
    
    isBatchHighlightingLinks = !isBatchHighlightingLinks;
    btnHighlightFilteredLinks.classList.toggle('primary', isBatchHighlightingLinks);
    btnHighlightFilteredLinks.innerHTML = isBatchHighlightingLinks ? `
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg> Hide` : `
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg> Show`;

    // Filter which links to highlight based on UI selection
    const typeFilter = selectLinkFilter ? selectLinkFilter.value : 'all';
    const statusFilter = selectStatusFilter ? selectStatusFilter.value : 'all';

    const filteredHrefs = lastLinksScanned.filter(l => {
        const matchesType = typeFilter === 'all' || (typeFilter === 'internal' && l.type === 'Internal') || (typeFilter === 'external' && l.type === 'External');
        if (!matchesType) return false;
        
        if (statusFilter === 'all') return true;
        const s = lastLinkStatuses[l.href] || '';
        if (statusFilter === 'success') return s.includes('200') || s.includes('OK');
        if (statusFilter === 'redirect') return s.startsWith('3');
        if (statusFilter === 'error') return s === 'Error' || s.startsWith('4') || s.startsWith('5');
        if (statusFilter === 'checking') return s === 'Checking' || !s;
        return true;
    }).map(l => l.href);

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (hrefs, isActive) => {
          document.querySelectorAll('a').forEach(a => {
            if (isActive && hrefs.includes(a.href)) {
              a.style.outline = '3px dashed #64ffda';
              a.style.outlineOffset = '2px';
              a.style.backgroundColor = 'rgba(100, 255, 218, 0.1)';
            } else {
              a.style.outline = '';
              a.style.outlineOffset = '';
              a.style.backgroundColor = '';
            }
          });
        },
        args: [filteredHrefs, isBatchHighlightingLinks]
      });
    });
  }

  async function checkLinksStatus() {
    if (lastLinksScanned.length === 0) return;
    
    // Switch to loading state
    const originalText = btnCheckLinks.innerText;
    btnCheckLinks.innerText = 'Checking...';
    btnCheckLinks.disabled = true;

    // Use currently active filters to determine which links to check
    const typeFilter = selectLinkFilter ? selectLinkFilter.value : 'all';
    const statusFilter = selectStatusFilter ? selectStatusFilter.value : 'all';

    const filtered = lastLinksScanned.filter(l => {
        // Only check links that match the current UI filter to save time
        const matchesType = typeFilter === 'all' || (typeFilter === 'internal' && l.type === 'Internal') || (typeFilter === 'external' && l.type === 'External');
        return matchesType; // We check everything of this type
    });

    // Check each filtered link (HEAD request is faster and saves bandwidth)
    const promises = filtered.map(async (link) => {
      try {
        const response = await fetch(link.href, { method: 'HEAD', mode: 'no-cors' });
        // 'no-cors' might hide the actual status if cross-origin, but for same-origin it works.
        // For external links with true CORS restrictions, status will be 0.
        lastLinkStatuses[link.href] = response.ok ? '200 OK' : (response.status || 'Checking');
      } catch (e) {
        lastLinkStatuses[link.href] = 'Error';
      }
      displayLinks(); // Re-render as we get results
    });

    await Promise.allSettled(promises);
    btnCheckLinks.innerText = 'Done!';
    setTimeout(() => {
      btnCheckLinks.innerText = 'Check';
      btnCheckLinks.disabled = false;
    }, 2000);
  }

  function exportToCSV() {
    if (lastLinksScanned.length === 0) return;
    
    let csv = "Text,URL,Type,Follow/Nofollow\n";
    lastLinksScanned.forEach(l => {
        const text = (l.text || '[No Text]').replace(/,/g, '');
        const href = l.href.replace(/,/g, '');
        csv += `${text},${href},${l.type},${l.isNoFollow ? 'Nofollow' : 'Follow'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blueprint-links-${new Date().getTime()}.csv`;
    a.click();
  }


  function displayLinks() {
    if (!linksResults) return;
    linksResults.style.display = 'block';
    emptyLinks.style.display = 'none';

    const typeFilter = selectLinkFilter ? selectLinkFilter.value : 'all';
    const statusFilter = selectStatusFilter ? selectStatusFilter.value : 'all';

    // Update Stats (Calculation moved here)
    if (lastLinksScanned && lastLinksScanned.length > 0) {
      const internal = lastLinksScanned.filter(l => l.type === 'Internal').length;
      const external = lastLinksScanned.filter(l => l.type === 'External').length;
      const total = lastLinksScanned.length;

      linksStats.innerHTML = `
          <div class="stat-card"><span class="stat-val">${total}</span><span class="stat-label">Total</span></div>
          <div class="stat-card"><span class="stat-val">${internal}</span><span class="stat-label">Internal</span></div>
          <div class="stat-card"><span class="stat-val">${external}</span><span class="stat-label">External</span></div>
      `;
    }

    linksList.innerHTML = '';
    
    if (!isUserPro) {
        linksList.innerHTML = '<div style="text-align:center; padding: 25px; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px solid var(--border-blue); margin: 20px 10px;"><div style="color:#FFD700; font-size: 16px; margin-bottom:10px;">⭐ PRO</div><div style="font-size:11px; font-weight: 800; color:#fff; text-transform: uppercase; margin-bottom: 5px;">Link Details Locked</div><div style="font-size:10px; color:var(--text-grey); line-height: 1.4;">Subscribe to view full anchor data, internal/external mapping and HTTP status codes.</div></div>';
        return;
    }

    const filtered = lastLinksScanned.filter(l => {
      // 1. Type Filter
      const matchesType = typeFilter === 'all' || (typeFilter === 'internal' && l.type === 'Internal') || (typeFilter === 'external' && l.type === 'External');
      if (!matchesType) return false;

      // 2. Status Filter
      if (statusFilter === 'all') return true;
      const s = lastLinkStatuses[l.href] || '';
      if (statusFilter === 'success') return s.includes('200') || s.includes('OK');
      if (statusFilter === 'redirect') return s.startsWith('3');
      if (statusFilter === 'error') return s === 'Error' || s.startsWith('4') || s.startsWith('5');
      if (statusFilter === 'checking') return s === 'Checking' || !s;
      
      return true;
    });

    filtered.forEach(link => {
      const row = document.createElement('div');
      row.className = 'link-row';
      
      const typeClass = link.type === 'Internal' ? 'good' : 'warn';
      const nofollowTag = link.isNoFollow ? `<span class="link-tag bad" style="background: rgba(255, 82, 82, 0.1); color: #ff5252; border: 1px solid #ff5252;">Nofollow</span>` : `<span class="link-tag good" style="background: rgba(0, 230, 118, 0.1); color: #00e676; border: 1px solid #00e676;">Follow</span>`;
      
      const status = lastLinkStatuses[link.href];
      let statusHtml = '';
      if (status) {
          const statusStr = String(status);
          const sClass = statusStr.includes('200') ? 'success' : (statusStr === 'Error' ? 'fail' : 'loading');
          statusHtml = `<div class="link-status-badge ${sClass}">${statusStr}</div>`;
      }

      row.innerHTML = `
        ${statusHtml}
        <span class="link-text">${link.text || '[No Text]'}</span>
        <a href="${link.href}" class="link-url" target="_blank">${link.href}</a>
        <div class="link-meta">
          <div>
            <span class="link-tag ${typeClass}" style="opacity: 0.8;">${link.type}</span>
            ${nofollowTag}
          </div>
          <button class="btn-highlight-link" data-href="${link.href}">Highlight</button>
        </div>
      `;

      // Add highlight event
      row.querySelector('.btn-highlight-link').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (targetHref) => {
              const el = Array.from(document.querySelectorAll('a')).find(a => a.href === targetHref);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.style.outline = '4px solid #64ffda';
                el.style.outlineOffset = '2px';
                setTimeout(() => el.style.outline = '', 3000);
              }
            },
            args: [link.href]
          });
        });
      });

      linksList.appendChild(row);
    });
  }

  function copyLinksList() {
    if (lastLinksScanned.length === 0) return;
    
    const typeFilter = selectLinkFilter ? selectLinkFilter.value : 'all';
    const statusFilter = selectStatusFilter ? selectStatusFilter.value : 'all';

    const filtered = lastLinksScanned.filter(l => {
        const matchesType = typeFilter === 'all' || (typeFilter === 'internal' && l.type === 'Internal') || (typeFilter === 'external' && l.type === 'External');
        if (!matchesType) return false;
        
        if (statusFilter === 'all') return true;
        const s = lastLinkStatuses[l.href] || '';
        if (statusFilter === 'success') return s.includes('200') || s.includes('OK');
        if (statusFilter === 'redirect') return s.startsWith('3');
        if (statusFilter === 'error') return s === 'Error' || s.startsWith('4') || s.startsWith('5');
        if (statusFilter === 'checking') return s === 'Checking' || !s;
        return true;
    });

    const text = filtered.map(l => `${l.text}\t${l.href}\t${l.type}\t${l.isNoFollow ? 'Nofollow' : 'Follow'}`).join('\n');
    navigator.clipboard.writeText(text);
  }

  // --- IMAGE AUDIT LOGIC ---
  const imgList = document.getElementById('images-list');
  const imgStatsGrid = document.getElementById('images-stats-grid');
  const imgResults = document.getElementById('images-results');
  const emptyImages = document.getElementById('empty-images');
  const imgFilterBtns = document.querySelectorAll('[data-img-filter]');

  imgFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      imgFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-img-filter');
      displayImages(filter);
    });
  });


  function displayImages(filter) {
    if (!imgList) return;
    imgResults.style.display = 'block';
    emptyImages.style.display = 'none';

    // Update Stats (Calculation moved here)
    if (lastImagesScanned && lastImagesScanned.length > 0) {
        const total = lastImagesScanned.length;
        const missingAlt = lastImagesScanned.filter(i => !i.alt).length;
        const missingTitle = lastImagesScanned.filter(i => !i.title).length;
        const broken = lastImagesScanned.filter(i => i.isBroken).length;

        imgStatsGrid.innerHTML = `
          <div class="stat-card">
            <span class="stat-val">${total}</span>
            <span class="stat-label">Total Images</span>
          </div>
          <div class="stat-card">
            <span class="stat-val" style="color: ${missingAlt > 0 ? '#ff5252' : '#00e676'}">${missingAlt}</span>
            <span class="stat-label">Missing Alt</span>
          </div>
          <div class="stat-card">
            <span class="stat-val" style="color: ${broken > 0 ? '#ff5252' : '#00e676'}">${broken}</span>
            <span class="stat-label">Broken</span>
          </div>
          <div class="stat-card">
            <span class="stat-val" style="color: ${missingTitle > 0 ? '#ffab00' : '#00e676'}">${missingTitle}</span>
            <span class="stat-label">No Title</span>
          </div>
        `;
        imgStatsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    }
    imgList.innerHTML = '';
    const filtered = lastImagesScanned.filter(img => {
      if (filter === 'all') return true;
      if (filter === 'missing') return !img.alt;
      if (filter === 'broken') return img.isBroken;
      if (filter === 'no-title') return !img.title;
      return true;
    });
    
    if (!isUserPro) {
      imgList.innerHTML = '<div style="text-align:center; padding: 25px; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px solid var(--accent-cyan); margin: 20px 10px;"><div style="color:var(--accent-cyan); font-size: 16px; margin-bottom:10px;">💎 PRO</div><div style="font-size:11px; font-weight: 800; color:#fff; text-transform: uppercase; margin-bottom: 5px;">Image Details Locked</div><div style="font-size:10px; color:var(--text-grey); line-height: 1.4;">Unlock advanced image auditing, broken link detection, and full ALT tag mapping.</div></div>';
      return;
    }

    filtered.forEach(img => {
      const row = document.createElement('div');
      row.className = 'img-row';
      const altTag = img.alt ? `<span class="img-tag good" style="background: rgba(0, 230, 118, 0.1); color: #00e676; border: 1px solid #00e676; padding: 1px 4px; font-size: 8px; border-radius: 2px; text-transform: uppercase;">Alt Found</span>` : `<span class="img-tag missing" style="background: rgba(255, 82, 82, 0.1); color: #ff5252; border: 1px solid #ff5252; padding: 1px 4px; font-size: 8px; border-radius: 2px; text-transform: uppercase;">Alt Missing</span>`;
      const titleTag = img.title ? `<span class="img-tag good" style="background: rgba(0, 230, 118, 0.1); color: #00e676; border: 1px solid #00e676; padding: 1px 4px; font-size: 8px; border-radius: 2px; text-transform: uppercase;">Title Found</span>` : `<span class="img-tag missing" style="background: rgba(255, 171, 0, 0.1); color: #ffab00; border: 1px solid #ffab00; padding: 1px 4px; font-size: 8px; border-radius: 2px; text-transform: uppercase;">Title Missing</span>`;
      const brokenTag = img.isBroken ? `<span class="img-tag bad" style="background: #ff5252; color: #fff; border: 1px solid #ff5252; padding: 1px 4px; font-size: 8px; border-radius: 2px; text-transform: uppercase; font-weight:800;">BROKEN</span>` : '';

      const imgId = `img-size-${Math.random().toString(36).substr(2, 9)}`;

      row.innerHTML = `
        <img src="${img.src}" class="img-preview" style="border: ${img.isBroken ? '2px solid #ff5252' : 'none'}" />
        <div class="img-info">
          <span class="img-alt">${img.alt || '(No Alt)'} | <span id="${imgId}" style="color: var(--accent-cyan); font-weight: 500;">Calculating size...</span></span>
          <span class="img-meta-info" style="font-size: 9px; color: var(--text-grey);">${img.width}x${img.height} (File: ${img.naturalWidth}x${img.naturalHeight})</span>
          <span class="img-url" style="font-size: 8px; color: var(--accent-cyan); word-break: break-all; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; margin-top:2px;">${img.src}</span>
          <div class="img-meta-tags" style="display: flex; gap: 4px; margin-top: 5px; align-items:center;">
            ${brokenTag}
            ${altTag}
            ${titleTag}
            <button class="btn-highlight-img" style="background: transparent; border: 1px solid var(--accent-cyan); color: var(--accent-cyan); font-size: 8px; padding: 2px 6px; border-radius: 4px; cursor: pointer;">Highlight</button>
          </div>
        </div>
      `;

      // Async size check
      fetch(img.src, { method: 'HEAD' })
        .then(response => {
           const size = response.headers.get('content-length');
           if (size) {
             const kb = (size / 1024).toFixed(1);
             document.getElementById(imgId).innerText = `${kb} KB`;
           } else {
             document.getElementById(imgId).innerText = 'Size N/A';
           }
        })
        .catch(() => {
          document.getElementById(imgId).innerText = 'Size N/A';
        });

      // Highlight event
      row.querySelector('.btn-highlight-img').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (targetSrc) => {
              const el = Array.from(document.querySelectorAll('img')).find(i => i.src === targetSrc);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.style.outline = '5px solid #64ffda';
                el.style.outlineOffset = '3px';
                el.style.boxShadow = '0 0 20px rgba(100, 255, 218, 0.6)';
                setTimeout(() => {
                  el.style.outline = '';
                  el.style.boxShadow = '';
                }, 3000);
              }
            },
            args: [img.src]
          });
        });
      });

      imgList.appendChild(row);
    });
  }

  function copyImagesList() {
    if (lastImagesScanned.length === 0) return;
    const text = lastImagesScanned.map(i => `${i.alt || '[Missing]'}\t${i.src}\t${i.width}x${i.height}`).join('\n');
    navigator.clipboard.writeText(text);
  }

  // --- EDUCATIONAL TOOLTIP LOGIC ---
  const tooltip = document.getElementById('seo-tooltip');
  const tooltipTitle = document.getElementById('tooltip-title');
  const tooltipText = document.getElementById('tooltip-text');

  const SEO_GLOSSARY = {
    'TITLE': {
      title: 'Title Tag SEO',
      text: 'The most important on-page SEO factor. Aim for 50-60 characters. Place your primary keywords at the beginning.'
    },
    'DESC': {
      title: 'Meta Description',
      text: 'A summary for search results. While it doesn\'t affect ranking directly, it\'s crucial for high click-through rates (CTR).'
    },
    'CANONICAL': {
      title: 'Canonical URL',
      text: 'Indicates the "original" version of a page. Prevents Google from penalizing you for duplicate content across URLs.'
    },
    'ROBOTS': {
      title: 'Robots.txt',
      text: 'Contains instructions for search crawlers. Use it to hide private pages or save crawl budget on unimportant folders.'
    },
    'SITEMAP': {
      title: 'Sitemap.xml',
      text: 'A structured list of all your URLs. It ensures search engines don\'t miss any of your valuable content.'
    },
    'HTTPS': {
        title: 'Security (HTTPS)',
        text: 'Encrypted communication between server and client. Vital for user trust and a confirmed Google ranking factor.'
    },
    'LOADTIME': {
        title: 'Page Load Time',
        text: 'The total time to download and render the page. Aim for under 2 seconds for optimal SEO.'
    },
    'LCP': {
        title: 'Largest Contentful Paint',
        text: 'Measures when the largest visible element (image or text block) is rendered. Target: < 2.5 seconds.'
    },
    'CLS': {
        title: 'Cumulative Layout Shift',
        text: 'Measures visual stability. High values mean elements jump around as the page loads. Target: < 0.1.'
    },
    'RATIO': {
      title: 'Content Ratio',
      text: 'Compares visible text to HTML code. A higher ratio (>15%) signals a content-rich page that is useful to humans.'
    },
    'ASSETS': {
      title: 'External Assets',
      text: 'The number of external CSS and JS files. Minimizing these reduces server requests and improves speed.'
    },
    'HEAVY_ASSETS': {
      title: 'Heavyweight Assets',
      text: 'Large files (images/scripts) that slow down the page. Compressing these is the fastest way to improve your PageSpeed score.'
    },
    'HEADINGS': {
      title: 'Heading Hierarchy',
      text: 'Headings (H1-H6) help Google understand content structure. Use only one H1 per page and follow a logical order.'
    },
    'KEYWORDS': {
      title: 'Keyword Density',
      text: 'How often a word appears. For SEO, ensure your target keyword appears in the first 100 words and has 1-2% density.'
    }
  };

  // 1. Initial State
  if (tooltip) {
    tooltip.style.position = 'fixed';
    tooltip.style.display = 'none';
    tooltip.style.opacity = '0';
    tooltip.style.pointerEvents = 'none';
  }

  // Helper to show tooltip correctly
  function showTip(btn) {
    const tipEl = document.getElementById('seo-tooltip');
    if (!tipEl) return;

    const type = btn.getAttribute('data-tip');
    const info = SEO_GLOSSARY[type];
    if (!info) return;

    const titleEl = document.getElementById('tooltip-title');
    const textEl = document.getElementById('tooltip-text');
    
    if (titleEl) titleEl.innerText = info.title;
    if (textEl) textEl.innerText = info.text;

    // Reset styles for measurement
    tipEl.style.display = 'block';
    tipEl.style.visibility = 'hidden';
    tipEl.style.opacity = '0';
    tipEl.style.zIndex = '99999';
    
    requestAnimationFrame(() => {
        const rect = btn.getBoundingClientRect();
        const tHeight = tipEl.offsetHeight;
        const tWidth = tipEl.offsetWidth;
        
        let left = rect.left - (tWidth / 2) + (rect.width / 2);
        let top = rect.top - tHeight - 12;

        // Screen edge protection
        if (left < 10) left = 10;
        if (left + tWidth > window.innerWidth - 10) left = window.innerWidth - tWidth - 10;
        
        if (top < 10) {
            top = rect.bottom + 12;
            tipEl.classList.add('tip-below');
        } else {
            tipEl.classList.remove('tip-below');
        }

        tipEl.style.left = `${left}px`;
        tipEl.style.top = `${top}px`;
        tipEl.style.opacity = '1';
        tipEl.style.visibility = 'visible';
    });
  }

  // Global delegates for all .info-btn
  document.addEventListener('mouseover', (e) => {
    const btn = e.target.closest('.info-btn');
    if (btn) {
        showTip(btn);
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('.info-btn')) {
        const tipEl = document.getElementById('seo-tooltip');
        if (tipEl) {
            tipEl.style.display = 'none';
            tipEl.style.opacity = '0';
            tipEl.style.visibility = 'hidden';
        }
    }
  });

  document.addEventListener('scroll', () => {
    tooltip.style.display = 'none';
  }, true);

  // Fallback: Click to persistent toggle
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.info-btn');
    if (btn) {
        showTip(btn);
    } else if (!e.target.closest('#seo-tooltip')) {
        tooltip.style.display = 'none';
    }
  });

  // --- SERP TAB SWITCHING ---
  const serpTabs = document.querySelectorAll('.serp-tab-btn');
  serpTabs.forEach(btn => {
    btn.addEventListener('click', () => {
        serpTabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.getAttribute('data-view');
        const desktopView = document.getElementById('serp-desktop-view');
        const mobileView = document.getElementById('serp-mobile-view');
        if (desktopView) desktopView.style.display = view === 'desktop' ? 'block' : 'none';
        if (mobileView) mobileView.style.display = view === 'mobile' ? 'block' : 'none';
    });
  });

  // --- SOCIAL TAB SWITCHING ---
  const socialTabs = document.querySelectorAll('.social-tab-btn');
  socialTabs.forEach(btn => {
    btn.addEventListener('click', () => {
        socialTabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const social = btn.getAttribute('data-social');
        const fbView = document.getElementById('facebook-view');
        const twView = document.getElementById('twitter-view');
        if (fbView) fbView.style.display = social === 'facebook' ? 'block' : 'none';
        if (twView) twView.style.display = social === 'twitter' ? 'block' : 'none';
    });
  });
});
