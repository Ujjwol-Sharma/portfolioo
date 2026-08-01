// Custom Cursor Glow Effect
document.addEventListener('mousemove', (e) => {
    const glow = document.querySelector('.cursor-glow');
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
});

// Smooth Scrolling for Anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Real Form Submission using FormSubmit (Temporarily disabled for initial activation)
/*
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = this.querySelector('button');
    const originalText = btn.innerHTML;
    
    // Animate button
    btn.innerHTML = 'Sending...';
    btn.style.opacity = '0.7';
    
    // Get values
    const nameVal = document.getElementById("name").value;
    const emailVal = document.getElementById("email").value;
    const messageVal = document.getElementById("message").value;

    fetch("https://formsubmit.co/ajax/intumintuchintu76@gmail.com", {
        method: "POST",
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            name: nameVal,
            email: emailVal,
            message: messageVal,
            _replyto: emailVal,
            _subject: "New Message from Portfolio Website!"
        })
    })
    .then(response => response.json())
    .then(data => {
        btn.innerHTML = 'Message Sent! ✨';
        btn.style.background = 'linear-gradient(90deg, #00ff88, #00aaff)';
        btn.style.opacity = '1';
        this.reset();
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 3000);
    })
    .catch(error => {
        btn.innerHTML = 'Error Sending ❌';
        btn.style.opacity = '1';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 3000);
    });
});
*/

// Simple Scroll Animation (Fade in on scroll)
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('section').forEach(section => {
    if (section.id !== 'home') {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(section);
    }
});
