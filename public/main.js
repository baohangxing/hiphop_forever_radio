let canvas,
    c,
    canvasgl,
    radio,
    animation,
    w,
    h,
    w2,
    h2,
    txt,
    pos,
    ini,
    fin,
    iAnim,
    u,
    listAnimations,
    lastAnim,
    lastCtx,
    time,
    pause;

function init() {
    iAnim = 0;
    count = 0;

    radio = new Radio();

    canvas = document.createElement('canvas');
    canvas.width = w = innerWidth;
    canvas.height = h = innerHeight;

    canvasgl = canvas.cloneNode(false);
    canvasgl.style.display = 'none';

    c = canvas.getContext('2d');

    w2 = w >> 1;
    h2 = h >> 1;

    document.body.appendChild(canvas);
    document.body.appendChild(canvasgl);

    listAnimations = [
        { index: 0, anim: Animation01 },
        { index: 1, anim: Animation02 },
    ];

    radio.togglePlay();
    selectAnimation();
    addEvents();
    update();
}

function selectAnimation() {
    time = Math.random() * 7000 + 7000;
    let currentAnimation =
        listAnimations[Math.floor(Math.random() * listAnimations.length)];
    console.log(currentAnimation);
    if (lastAnim !== currentAnimation.index) {
        lastAnim = currentAnimation.index;
        let anim = new currentAnimation.anim();
        if (lastCtx !== anim.context) {
            lastCtx = anim.context;
        }
        animation = anim;
    }
}

function update(t) {
    u = requestAnimationFrame(update);

    radio.analyser.getByteTimeDomainData(radio.data);

    animation.show(t);

    if (!ini) ini = Date.now();
    fin = Date.now();

    if (fin - ini > time) {
        iAnim = (iAnim + 1) % listAnimations.length;
        selectAnimation();
        ini = null;
    }
}

function togglePlay(e) {
    e.preventDefault();
    radio.togglePlay();
    if (!animation) selectAnimation();
    cancelAnimationFrame(u);
    update();
}

function addEvents() {
    window.addEventListener('resize', () => {
        canvas.width = w = innerWidth;
        canvas.height = h = innerHeight;
        w2 = w >> 1;
        h2 = h >> 1;
        cancelAnimationFrame(u);
        update();
    });
}

window.onload = () => {
    init();
};
