document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('play-modal');
  const modalTitle = modal.querySelector('.modal-title');
  const iframeWrapper = modal.querySelector('.game-iframe-wrapper');
  const linkWrapper = modal.querySelector('.scratch-link-wrapper');
  const closeBtn = modal.querySelector('.modal-close');
  const playButtons = document.querySelectorAll('.play-btn');

  // Open modal and load Scratch iframe
  playButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const card = button.closest('.game-card');
      const scratchId = card.getAttribute('data-scratch-id');
      const gameTitle = card.querySelector('h3').textContent;

      if (!scratchId) return;

      // Update modal title
      modalTitle.textContent = `Playing: ${gameTitle}`;

      // Create and inject the iframe
      // Note: Scratch embedding URL is https://scratch.mit.edu/projects/<ID>/embed
      iframeWrapper.innerHTML = `
        <iframe 
          src="https://scratch.mit.edu/projects/${scratchId}/embed" 
          allowtransparency="true" 
          width="485" 
          height="402" 
          frameborder="0" 
          scrolling="no" 
          allowfullscreen>
        </iframe>
      `;

      if (linkWrapper) {
        linkWrapper.innerHTML = `
          <a class="scratch-link" href="https://scratch.mit.edu/projects/${scratchId}" target="_blank" rel="noopener">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Open this project on the Scratch website
          </a>
        `;
      }

      // Show modal
      modal.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent main page scrolling
    });
  });

  // Close modal function
  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restore main page scrolling
    
    // Crucial: Clear iframe so the game sound stops playing in the background!
    setTimeout(() => {
      iframeWrapper.innerHTML = '';
      if (linkWrapper) {
        linkWrapper.innerHTML = '';
      }
    }, 300); // Wait for transition to finish
  };

  closeBtn.addEventListener('click', closeModal);

  // Close modal when clicking background overlay
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close modal on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Premium glow effect tracking the mouse
  const hero = document.querySelector('.hero');
  if (hero) {
    document.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element
      const y = e.clientY - rect.top;  // y position within the element
      
      // Update custom properties on body to adjust glowing radial gradient background
      document.body.style.setProperty('--mouse-x', `${x}px`);
      document.body.style.setProperty('--mouse-y', `${y}px`);
    });
  }
});
