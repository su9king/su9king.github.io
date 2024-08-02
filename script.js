document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('background-video');
    const image = document.getElementById('background-image');
    const section5 = document.getElementById('section5');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                video.style.opacity = '0';
                image.style.opacity = '1';
            } else {
                video.style.opacity = '1';
                image.style.opacity = '0';
            }
        });
    }, {
        threshold: 0.5 // 섹션의 절반 이상이 화면에 보일 때 트리거
    });

    observer.observe(section5);
});

