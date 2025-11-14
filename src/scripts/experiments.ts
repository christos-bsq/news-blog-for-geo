const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function initExperiments() {
  const article = document.querySelector<HTMLElement>('#article-js');
  const payload = document.getElementById('post-content');

  if (!article || !(payload instanceof HTMLScriptElement)) {
    return;
  }

  if (article.dataset.rendered === 'true') {
    return;
  }

  const delay = Number(article.dataset.clientDelayMs ?? '0');

  try {
    const data = JSON.parse(payload.textContent ?? '{}');
    const html = data.html ?? '';

    if (delay > 0) {
      await wait(delay);
    }

    article.innerHTML = html;
    article.dataset.rendered = 'true';
  } catch (error) {
    console.error('Failed to hydrate experiment payload', error);
  }
}
