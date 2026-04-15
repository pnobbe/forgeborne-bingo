const GUIDE_URL = '../data/demonic-pact-guide.txt';

const elements = {
  title: document.getElementById('guide-title'),
  subtitle: document.getElementById('guide-subtitle'),
  intro: document.getElementById('guide-intro'),
  sections: document.getElementById('guide-sections'),
  videoLink: document.getElementById('guide-video-link'),
  resetButton: document.getElementById('reset-progress'),
  progressRatio: document.getElementById('progress-ratio'),
  progressPercent: document.getElementById('progress-percent'),
  sectionRatio: document.getElementById('section-ratio'),
  nextStep: document.getElementById('next-step'),
};

const state = {
  guide: null,
  storageKey: '',
  checked: new Set(),
};

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'guide';
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function percent(value, total) {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

function computeChecksum(text) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function normalizeLine(line) {
  return line.replace(/\r/g, '').trim();
}

function isBlankLine(line) {
  return !normalizeLine(line);
}

function isDashedLine(line) {
  return normalizeLine(line).startsWith('-');
}

function getVideoUrl(line) {
  const match = line.match(/https?:\/\/\S+/i);
  return match ? match[0] : '';
}

function createIntroCard(title, body, chips = []) {
  const card = document.createElement('article');
  card.className = 'leagues-intro-card';
  card.innerHTML = `
    <p class="leagues-eyebrow">${escapeHtml(title)}</p>
    <h2>${escapeHtml(title)}</h2>
    <p>${escapeHtml(body)}</p>
  `;

  if (chips.length) {
    const list = document.createElement('ul');
    list.className = 'leagues-intro-list';
    chips.forEach((chip) => {
      const item = document.createElement('li');
      item.textContent = chip;
      list.appendChild(item);
    });
    card.appendChild(list);
  }

  return card;
}

function splitIntoBlocks(lines) {
  const blocks = [];
  let current = [];

  lines.forEach((line) => {
    if (isBlankLine(line)) {
      if (current.length) {
        blocks.push(current);
        current = [];
      }
      return;
    }

    current.push(normalizeLine(line));
  });

  if (current.length) {
    blocks.push(current);
  }

  return blocks;
}

function isGuideNote(content) {
  return content.startsWith('(') || /can do the following/i.test(content);
}

function parseBlockItems(lines, nextStepNumberStart) {
  const items = [];
  let stepNumber = nextStepNumberStart;

  lines.forEach((line) => {
    if (isDashedLine(line)) {
      const content = normalizeLine(line).slice(1).trim();
      if (isGuideNote(content)) {
        items.push({ type: 'note', text: content });
        return;
      }

      const id = `step-${String(stepNumber).padStart(3, '0')}-${slugify(content).slice(0, 48)}`;
      items.push({
        type: 'step',
        id,
        order: stepNumber,
        text: content,
      });
      stepNumber += 1;
      return;
    }

    items.push({ type: 'note', text: normalizeLine(line) });
  });

  return {
    items,
    nextStepNumber: stepNumber,
  };
}

function buildSections(blocks) {
  const sections = [];
  let phaseNumber = 1;
  let nextStepNumber = 1;

  blocks.forEach((block) => {
    if (!block.length) return;

    const firstLine = block[0];
    if (/^hunter contracts notes/i.test(firstLine)) {
      const items = block.slice(1).map((line, index) => ({
        type: 'step',
        id: `step-${String(nextStepNumber + index).padStart(3, '0')}-${slugify(line).slice(0, 48)}`,
        order: nextStepNumber + index,
        text: line,
      }));

      nextStepNumber += items.length;
      sections.push({
        title: 'Hunter Contracts Notes',
        summary: firstLine,
        items,
      });
      return;
    }

    const parsed = parseBlockItems(block, nextStepNumber);
    nextStepNumber = parsed.nextStepNumber;
    sections.push({
      title: `Phase ${String(phaseNumber).padStart(2, '0')}`,
      summary: '',
      items: parsed.items,
    });
    phaseNumber += 1;
  });

  return sections.filter((section) => section.items.length > 0);
}

function parseGuide(text) {
  const normalizedText = text;
  const lines = normalizedText.split('\n');
  const nonEmptyLines = lines.map(normalizeLine).filter(Boolean);
  const title = nonEmptyLines[0] || 'Demonic Pact Guide';
  const subtitle = nonEmptyLines[1] || '';
  const videoLine = nonEmptyLines.find((line) => /youtube\.com|youtu\.be/i.test(line)) || '';
  const videoUrl = getVideoUrl(videoLine);
  const firstStepIndex = lines.findIndex((line) => isDashedLine(line));
  const introLines = firstStepIndex === -1 ? lines : lines.slice(0, firstStepIndex);
  const bodyLines = firstStepIndex === -1 ? [] : lines.slice(firstStepIndex);

  let relicSummary = '';
  let routeNotes = [];

  introLines.forEach((line, index) => {
    const current = normalizeLine(line);
    if (!current) return;

    if (/^My relics/i.test(current)) {
      relicSummary = normalizeLine(introLines[index + 1] || '');
      return;
    }

    if (
      current !== title
      && current !== subtitle
      && current !== videoLine
      && !/^My relics/i.test(current)
      && current !== relicSummary
      && !/^Notes on the route/i.test(current)
    ) {
      routeNotes.push(current);
    }
  });

  routeNotes = [...new Set(routeNotes)];

  return {
    title,
    subtitle,
    videoUrl,
    relics: relicSummary ? relicSummary.split(/,\s*/).filter(Boolean) : [],
    routeNotes,
    sections: buildSections(splitIntoBlocks(bodyLines)),
    checksum: computeChecksum(normalizedText),
  };
}

function loadCheckedState() {
  if (!state.storageKey) return;

  try {
    const raw = window.localStorage.getItem(state.storageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state.checked = new Set(Array.isArray(parsed.checked) ? parsed.checked : []);
  } catch {
    state.checked = new Set();
  }
}

function saveCheckedState() {
  if (!state.storageKey) return;
  window.localStorage.setItem(state.storageKey, JSON.stringify({ checked: [...state.checked] }));
}

function getAllSteps() {
  return state.guide.sections.flatMap((section) => section.items.filter((item) => item.type === 'step'));
}

function updateProgress() {
  const allSteps = getAllSteps();
  const completedSteps = allSteps.filter((step) => state.checked.has(step.id)).length;
  const trackableSections = state.guide.sections.filter((section) => section.items.some((item) => item.type === 'step'));
  const completedSections = trackableSections.filter((section) => {
    const steps = section.items.filter((item) => item.type === 'step');
    return steps.length > 0 && steps.every((step) => state.checked.has(step.id));
  }).length;
  const nextUnchecked = allSteps.find((step) => !state.checked.has(step.id));

  elements.progressRatio.textContent = `${completedSteps} / ${allSteps.length}`;
  elements.progressPercent.textContent = percent(completedSteps, allSteps.length);
  elements.sectionRatio.textContent = `${completedSections} / ${trackableSections.length}`;
  elements.nextStep.textContent = nextUnchecked
    ? `#${nextUnchecked.order}: ${nextUnchecked.text}`
    : 'Everything checked.';

  document.querySelectorAll('[data-step-id]').forEach((node) => {
    const checked = state.checked.has(node.dataset.stepId);
    node.classList.toggle('is-checked', checked);
    node.classList.toggle('is-next', nextUnchecked?.id === node.dataset.stepId);
    const checkbox = node.querySelector('input[type="checkbox"]');
    if (checkbox) {
      checkbox.checked = checked;
    }
  });

  document.querySelectorAll('[data-section-index]').forEach((node) => {
    const sectionIndex = Number(node.dataset.sectionIndex);
    const section = state.guide.sections[sectionIndex];
    const steps = section.items.filter((item) => item.type === 'step');
    const completed = steps.filter((step) => state.checked.has(step.id)).length;
    const ratio = node.querySelector('[data-role="section-ratio"]');
    const percentNode = node.querySelector('[data-role="section-percent"]');

    if (ratio) {
      ratio.textContent = `${completed} / ${steps.length || 0}`;
    }
    if (percentNode) {
      percentNode.textContent = steps.length ? percent(completed, steps.length) : 'Notes';
    }
  });
}

function createStepNode(item) {
  const article = document.createElement('article');
  article.className = 'leagues-step';
  article.dataset.stepId = item.id;

  const label = document.createElement('label');
  label.className = 'leagues-step__label';

  const checkbox = document.createElement('input');
  checkbox.className = 'leagues-step__checkbox';
  checkbox.type = 'checkbox';
  checkbox.checked = state.checked.has(item.id);
  checkbox.setAttribute('aria-label', `Mark step ${item.order} complete`);
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      state.checked.add(item.id);
    } else {
      state.checked.delete(item.id);
    }
    saveCheckedState();
    updateProgress();
  });

  const content = document.createElement('div');
  content.className = 'leagues-step__content';
  content.innerHTML = `
    <p class="leagues-step__meta">Step ${item.order}</p>
    <p class="leagues-step__text">${escapeHtml(item.text)}</p>
  `;

  label.append(checkbox, content);
  article.appendChild(label);
  return article;
}

function createNoteNode(text) {
  const article = document.createElement('article');
  article.className = 'leagues-note';
  article.innerHTML = `
    <p class="leagues-note__label">Route Note</p>
    <p class="leagues-note__body">${escapeHtml(text)}</p>
  `;
  return article;
}

function renderIntro() {
  elements.intro.replaceChildren();

  const cards = [];
  if (state.guide.routeNotes.length) {
    cards.push(createIntroCard('Route Notes', 'Read these before starting the checklist.', state.guide.routeNotes));
  }
  if (state.guide.relics.length) {
    cards.push(createIntroCard('Relics Used', 'The route leans toward these relic picks, but the guide notes that you can still adapt it.', state.guide.relics));
  }

  cards.forEach((card) => elements.intro.appendChild(card));
}

function renderSections() {
  elements.sections.replaceChildren();

  state.guide.sections.forEach((section, sectionIndex) => {
    const sectionNode = document.createElement('section');
    sectionNode.className = 'leagues-section';
    sectionNode.dataset.sectionIndex = String(sectionIndex);

    const header = document.createElement('header');
    header.className = 'leagues-section__header';
    header.innerHTML = `
      <div>
        <p class="leagues-section__eyebrow">Guide Section</p>
        <h2 class="leagues-section__title">${escapeHtml(section.title)}</h2>
        ${section.summary ? `<p class="leagues-section__summary">${escapeHtml(section.summary)}</p>` : ''}
      </div>
      <div class="leagues-section__progress">
        <strong class="leagues-section__count" data-role="section-ratio">0 / 0</strong>
        <span class="leagues-section__percent" data-role="section-percent">0%</span>
      </div>
    `;

    const items = document.createElement('div');
    items.className = 'leagues-section__items';
    section.items.forEach((item) => {
      items.appendChild(item.type === 'step' ? createStepNode(item) : createNoteNode(item.text));
    });

    sectionNode.append(header, items);
    elements.sections.appendChild(sectionNode);
  });
}

function renderGuide() {
  elements.title.textContent = state.guide.title;
  elements.subtitle.textContent = state.guide.subtitle;

  if (state.guide.videoUrl) {
    elements.videoLink.href = state.guide.videoUrl;
    elements.videoLink.hidden = false;
  }

  renderIntro();
  renderSections();
  updateProgress();
}

function handleReset() {
  if (!window.confirm('Reset all saved checklist progress for this guide on this browser?')) {
    return;
  }

  state.checked.clear();
  saveCheckedState();
  updateProgress();
}

async function init() {
  try {
    const response = await fetch(GUIDE_URL, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    state.guide = parseGuide(text);
    state.storageKey = `forgeborne.leagues.${slugify(state.guide.title)}.${state.guide.checksum}`;
    loadCheckedState();
    renderGuide();
  } catch (error) {
    elements.title.textContent = 'Unable to load guide';
    elements.subtitle.textContent = 'The checklist data could not be fetched.';
    elements.intro.replaceChildren(createIntroCard('Load Error', String(error.message || error), []));
    elements.resetButton.disabled = true;
  }
}

elements.resetButton.addEventListener('click', handleReset);

init();
