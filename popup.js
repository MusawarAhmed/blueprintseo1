document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('mode-toggle');
  const highlightDivsToggle = document.getElementById('highlight-divs-toggle');
  const highlightHeadingsToggle = document.getElementById('highlight-headings-toggle');
  const highlightImagesToggle = document.getElementById('highlight-images-toggle');

  // Load current state
  chrome.storage.local.get(['blueprintMode', 'highlightDivs', 'highlightHeadings', 'highlightImages'], (result) => {
    toggle.checked = !!result.blueprintMode;
    highlightDivsToggle.checked = !!result.highlightDivs;
    highlightHeadingsToggle.checked = !!result.highlightHeadings;
    highlightImagesToggle.checked = !!result.highlightImages;
  });

  // Handle toggle change
  toggle.addEventListener('change', () => {
    chrome.storage.local.set({ blueprintMode: toggle.checked });
  });

  highlightDivsToggle.addEventListener('change', () => {
    chrome.storage.local.set({ highlightDivs: highlightDivsToggle.checked });
  });

  highlightHeadingsToggle.addEventListener('change', () => {
    chrome.storage.local.set({ highlightHeadings: highlightHeadingsToggle.checked });
  });

  highlightImagesToggle.addEventListener('change', () => {
    chrome.storage.local.set({ highlightImages: highlightImagesToggle.checked });
  });
});
