(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const states = new WeakMap();
  document.querySelectorAll('.faq-list details').forEach(details => {
    const summary = details.querySelector('summary');
    const answer = details.querySelector('.faq-answer');
    if (!summary || !answer) return;
    summary.addEventListener('click', event => {
      event.preventDefault();
      const previous = states.get(details);
      const desired = !(previous?.desired ?? details.open);
      const height = details.open ? answer.getBoundingClientRect().height : 0;
      previous?.animation?.cancel();
      if (reduced.matches || !answer.animate) {
        details.open = desired;
        states.set(details, {desired});
        return;
      }
      details.open = true;
      const animation = answer.animate([
        {height: height + 'px', opacity: height ? 1 : 0},
        {height: (desired ? answer.scrollHeight : 0) + 'px', opacity: desired ? 1 : 0}
      ], {duration: 260, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both'});
      states.set(details, {desired, animation});
      animation.finished.then(() => {
        if (states.get(details)?.animation !== animation) return;
        details.open = desired;
        animation.cancel();
        states.set(details, {desired});
      }).catch(() => {});
    });
  });
  const faq = document.querySelector('.faq-section');
  if (faq && !reduced.matches && 'IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      faq.animate([{opacity: .65, transform: 'translateY(8px)'}, {opacity: 1, transform: 'none'}], {duration: 420, easing: 'cubic-bezier(.16,1,.3,1)'});
      reveal.disconnect();
    }, {threshold: .1});
    reveal.observe(faq);
  }
})();
