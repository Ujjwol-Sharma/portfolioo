// Set current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

/* ==========================================================================
   Theme Management (Dark/Light Mode)
   ========================================================================== */
const themeToggle = document.getElementById('themeToggle');
const htmlElement = document.documentElement;
const themeIcon = themeToggle.querySelector('i');

// Check for saved theme preference
const savedTheme = localStorage.getItem('portfolio-theme');
if (savedTheme) {
    htmlElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

themeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('portfolio-theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    if (theme === 'light') {
        themeIcon.className = 'fas fa-sun';
    } else {
        themeIcon.className = 'fas fa-moon';
    }
}

/* ==========================================================================
   Smooth Scrolling for Navigation Links
   ========================================================================== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Update active state in nav
            document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

/* ==========================================================================
   Scroll Reveal Animations & Skill Bars
   ========================================================================== */
const revealElements = document.querySelectorAll('.reveal');
const skillBars = document.querySelectorAll('.skill-bar-fill');

const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const scrollObserver = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
        if (!entry.isIntersecting) {
            return;
        } else {
            // Add active class to fade in
            entry.target.classList.add('active');
            
            // If it's a skill card, animate the progress bar
            if (entry.target.classList.contains('glass-card') && entry.target.querySelector('.skill-bar-fill')) {
                const bar = entry.target.querySelector('.skill-bar-fill');
                const targetWidth = bar.getAttribute('data-width');
                // Small delay for staggered effect
                setTimeout(() => {
                    bar.style.width = targetWidth;
                }, 300);
            }
            
            // Optional: Stop observing once revealed
            // observer.unobserve(entry.target);
        }
    });
}, revealOptions);

revealElements.forEach(el => {
    scrollObserver.observe(el);
});

/* ==========================================================================
   Custom Cursor Glow (Optional Micro-interaction)
   ========================================================================== */
// Removed global glow div to prevent lag on lower-end devices, 
// relying on CSS box-shadow glow effects instead for better performance.

/* ==========================================================================
   Contact Form Validation & UI State
   ========================================================================== */
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn.querySelector('.btn-text');
const spinner = submitBtn.querySelector('.spinner');

if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        // Basic HTML5 validation is handled by the browser because of 'required' attributes.
        // We add this event listener to provide UI feedback BEFORE it sends to FormSubmit.
        
        // Show loading state
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        submitBtn.style.opacity = '0.7';
        submitBtn.style.cursor = 'not-allowed';
        
        // FormSubmit handles the actual sending and captcha. 
        // We let the default HTML form submission proceed to FormSubmit.co
    });
}
