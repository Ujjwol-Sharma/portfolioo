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
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // Stop normal form submission
        
        // Show loading state
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        submitBtn.style.opacity = '0.7';
        submitBtn.disabled = true;
        submitBtn.style.cursor = 'not-allowed';
        
        // Reset messages
        formMessage.textContent = '';
        formMessage.style.display = 'none';
        
        // Gather data
        const formData = new FormData(contactForm);
        const payload = {
            name: formData.get('name'),
            email: formData.get('email'),
            message: formData.get('message')
        };
        
        try {
            // Send using EmailJS
            const SERVICE_ID = 'service_2uxwqov';
            const TEMPLATE_ID = 'template_bqqte4a';
            
            await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, contactForm);
            
            // Success
            formMessage.textContent = 'Message sent successfully! I will get back to you soon.';
            formMessage.style.color = '#4ade80'; // green
            formMessage.style.display = 'block';
            contactForm.reset();
        } catch (error) {
            console.error('EmailJS error:', error);
            // EmailJS errors usually have a 'text' property with the exact reason
            const errorMsg = error.text || error.message || JSON.stringify(error);
            formMessage.textContent = 'Error: ' + errorMsg;
            formMessage.style.color = '#f87171'; // red
            formMessage.style.display = 'block';
        } finally {
            // Restore button state
            btnText.style.display = 'block';
            spinner.style.display = 'none';
            submitBtn.style.opacity = '1';
            submitBtn.disabled = false;
            submitBtn.style.cursor = 'pointer';
        }
    });
}

/* ==========================================================================
   Premium Background Interactions
   ========================================================================== */
const blob1 = document.querySelector('.blob-1');
const blob2 = document.querySelector('.blob-2');

if (blob1 && blob2) {
    let mouseX = 0;
    let mouseY = 0;
    let currentX1 = 0;
    let currentY1 = 0;
    let currentX2 = 0;
    let currentY2 = 0;

    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
        // Normalize mouse coordinates to roughly -50 to 50
        mouseX = (e.clientX / window.innerWidth - 0.5) * 100;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 100;
    });

    // Smooth animation loop for the glow blobs
    function animateBackground() {
        // Scroll parallax factor
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollOffset = scrollY * 0.05;

        // Smoothly interpolate towards target mouse position (easing)
        currentX1 += (mouseX - currentX1) * 0.05;
        currentY1 += (mouseY - currentY1) * 0.05;
        
        currentX2 += (-mouseX - currentX2) * 0.03; // Inverse direction for blob 2
        currentY2 += (-mouseY - currentY2) * 0.03;

        // Apply transforms
        blob1.style.transform = `translate(${currentX1}%, ${currentY1 + scrollOffset}%)`;
        blob2.style.transform = `translate(${currentX2}%, ${currentY2 - (scrollOffset * 0.5)}%)`;

        requestAnimationFrame(animateBackground);
    }
    
    // Start animation loop
    animateBackground();
}
