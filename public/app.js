const statsGrid = document.getElementById('stats-grid');
const baseRules = document.getElementById('base-rules');
const decayRules = document.getElementById('decay-rules');
const teamsGrid = document.getElementById('teams-grid');
const participantsList = document.getElementById('participants-list');
const teamTemplate = document.getElementById('team-template');
const playerTemplate = document.getElementById('player-template');
const participantTemplate = document.getElementById('participant-template');
const tabButtons = document.querySelectorAll('[data-tab]');
const tabPanels = document.querySelectorAll('[data-panel]');
const infoChips = document.querySelectorAll('.info-chip');
const VALID_TABS = new Set(['teams', 'participants']);
const participantMobileLayoutQuery = window.matchMedia('(max-width: 720px)');

const GOD_THEMES = [
  {
    key: 'saradomin',
    name: 'Saradomin',
    title: 'The Azure Concord',
    shortLabel: 'Order and wisdom',
    flavor: 'Knights of Saradomin',
    doctrineTitle: 'Order Above Fury',
    doctrineMeta: 'Measured force, clear lines, and patient pressure.',
    teamLabel: 'Team 01',
    participantTitle: 'Saradominist',
    colors: {
      accent: [91, 136, 214],
      deep: [35, 60, 108],
      glow: [210, 231, 255],
      sigil: [239, 219, 146],
    },
    css: {
      accent: '91, 136, 214',
      deep: '35, 60, 108',
      glow: '210, 231, 255',
      sigil: '239, 219, 146',
      border: 'rgba(165, 197, 247, 0.32)',
      badgeBg: 'rgba(19, 29, 48, 0.66)',
      badgeGlow: 'rgba(124, 168, 245, 0.22)',
    },
    crest: 'assets/gods/saradomin-signet.svg',
    banner: 'assets/gods/saradomin-banner.svg',
    rosterBanner: 'assets/gods/saradomin-roster.svg',
    opposed: 'Zamorak',
  },
  {
    key: 'zamorak',
    name: 'Zamorak',
    title: 'The Ashen Covenant',
    shortLabel: 'Chaos and ambition',
    flavor: 'Zealots of Zamorak',
    doctrineTitle: 'Change Through Fire',
    doctrineMeta: 'Pressure, volatility, and hard swings of fortune.',
    teamLabel: 'Team 02',
    participantTitle: 'Zamorakian',
    colors: {
      accent: [186, 59, 48],
      deep: [74, 15, 18],
      glow: [255, 198, 184],
      sigil: [235, 111, 84],
    },
    css: {
      accent: '186, 59, 48',
      deep: '74, 15, 18',
      glow: '255, 198, 184',
      sigil: '235, 111, 84',
      border: 'rgba(220, 110, 91, 0.3)',
      badgeBg: 'rgba(45, 12, 15, 0.72)',
      badgeGlow: 'rgba(214, 80, 62, 0.24)',
    },
    crest: 'assets/gods/zamorak-signet.svg',
    banner: 'assets/gods/zamorak-banner.svg',
    rosterBanner: 'assets/gods/zamorak-roster.svg',
    opposed: 'Saradomin',
  },
  {
    key: 'armadyl',
    name: 'Armadyl',
    title: 'The Empyrean Wing',
    shortLabel: 'Law and justice',
    flavor: 'Talons of Armadyl',
    doctrineTitle: 'Justice From Above',
    doctrineMeta: 'Precision, elevation, and clean execution.',
    teamLabel: 'Team 03',
    participantTitle: 'Armadylean',
    colors: {
      accent: [139, 186, 212],
      deep: [55, 88, 112],
      glow: [232, 245, 255],
      sigil: [205, 232, 247],
    },
    css: {
      accent: '139, 186, 212',
      deep: '55, 88, 112',
      glow: '232, 245, 255',
      sigil: '205, 232, 247',
      border: 'rgba(176, 213, 233, 0.3)',
      badgeBg: 'rgba(24, 36, 46, 0.66)',
      badgeGlow: 'rgba(165, 214, 239, 0.2)',
    },
    crest: 'assets/gods/armadyl-signet.svg',
    banner: 'assets/gods/armadyl-banner.svg',
    rosterBanner: 'assets/gods/armadyl-roster.svg',
    opposed: 'Bandos',
  },
  {
    key: 'bandos',
    name: 'Bandos',
    title: 'The War March',
    shortLabel: 'War and obedience',
    flavor: 'Warband of Bandos',
    doctrineTitle: 'Glory Through Battle',
    doctrineMeta: 'Impact, attrition, and overwhelming momentum.',
    teamLabel: 'Team 04',
    participantTitle: 'Bandosian',
    colors: {
      accent: [124, 145, 84],
      deep: [56, 69, 39],
      glow: [226, 212, 159],
      sigil: [171, 191, 111],
    },
    css: {
      accent: '124, 145, 84',
      deep: '56, 69, 39',
      glow: '226, 212, 159',
      sigil: '171, 191, 111',
      border: 'rgba(165, 182, 111, 0.26)',
      badgeBg: 'rgba(31, 33, 22, 0.74)',
      badgeGlow: 'rgba(163, 177, 102, 0.18)',
    },
    crest: 'assets/gods/bandos-signet.svg',
    banner: 'assets/gods/bandos-banner.svg',
    rosterBanner: 'assets/gods/bandos-roster.svg',
    opposed: 'Armadyl',
  },
];

const TEAM_NAME_TO_GOD_KEY = {
  'Team 1': 'saradomin',
  'Team 2': 'zamorak',
  'Team 3': 'armadyl',
  'Team 4': 'bandos',
  'Team 01': 'saradomin',
  'Team 02': 'zamorak',
  'Team 03': 'armadyl',
  'Team 04': 'bandos',
};

function getThemeForTeam(team, index) {
  const byName = TEAM_NAME_TO_GOD_KEY[team.name];
  if (byName) {
    return GOD_THEMES.find((theme) => theme.key === byName) || GOD_THEMES[index % GOD_THEMES.length];
  }
  return GOD_THEMES[index % GOD_THEMES.length];
}

function applyThemeVariables(node, prefix, theme) {
  node.style.setProperty(`--${prefix}-accent-rgb`, theme.css.accent);
  node.style.setProperty(`--${prefix}-deep-rgb`, theme.css.deep);
  node.style.setProperty(`--${prefix}-glow-rgb`, theme.css.glow);
  node.style.setProperty(`--${prefix}-sigil-rgb`, theme.css.sigil);
  node.style.setProperty(`--${prefix}-border-color`, theme.css.border);
  node.style.setProperty(`--${prefix}-badge-bg`, theme.css.badgeBg);
  node.style.setProperty(`--${prefix}-badge-glow`, theme.css.badgeGlow);
}

function applyTeamTheme(node, theme) {
  node.dataset.godTheme = theme.key;
  applyThemeVariables(node, 'team', theme);
}

function applyParticipantTheme(node, theme) {
  node.dataset.godTheme = theme.key;
  applyThemeVariables(node, 'participant-team', theme);
  node.style.setProperty('--participant-banner-url', `url('${theme.rosterBanner}')`);
}

// Player type badge icons — all served from local assets
const PLAYER_TYPE_ICONS = {
  ironman:                `assets/player-types/ironman.png`,
  hardcore_ironman:       `assets/player-types/hardcore_ironman.png`,
  ultimate_ironman:       `assets/player-types/ultimate_ironman.png`,
  group_ironman:          `assets/player-types/group_ironman.png`,
  hardcore_group_ironman: `assets/player-types/hardcore_group_ironman.png`,
  unranked_group_ironman: `assets/player-types/unranked_group_ironman.png`,
};
function playerTypeIcon(type) {
  return PLAYER_TYPE_ICONS[type] ?? `assets/player-types/ironman.png`;
}

// Bingo event window — UTC midnight boundaries
const BINGO_START = Date.UTC(2026, 2, 18);  // 18 Mar 2026 00:00 UTC
const BINGO_END   = Date.UTC(2026, 3,  1);  // 1 Apr 2026 00:00 UTC

function formatCountdown(ms) {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (days > 0)    parts.push(`${days}d`);
  if (hours > 0)   parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

function tickCountdown() {
  const el = document.getElementById('hero-countdown');
  if (!el) return;
  const now = Date.now();
  if (now < BINGO_START) {
    const t = formatCountdown(BINGO_START - now);
    el.textContent = `Starts in ${t}`;
  } else if (now < BINGO_END) {
    const t = formatCountdown(BINGO_END - now);
    el.textContent = `Ends in ${t}`;
  } else {
    el.textContent = 'Event ended';
    return; // no need to keep ticking
  }
}

function startCountdown() {
  tickCountdown();
  setInterval(tickCountdown, 1000);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatXp(value) {
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'm';
  if (value >= 1_000) return (value / 1_000).toFixed(0) + 'k';
  return String(value);
}

function formatRank(value) {
  // Ranks may be fractional (average ties), display as integer when whole
  const rounded = Math.round(value * 2) / 2; // keep .5 halves
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function createStatCard(label, value, caption) {
  const card = document.createElement('article');
  card.className = 'stat-card';
  card.innerHTML = `
    <h3>${label}</h3>
    <p class="stat-value">${value}</p>
    <p class="stat-caption">${caption}</p>
  `;
  return card;
}

function appendListItem(parent, text) {
  const item = document.createElement('li');
  item.textContent = text;
  parent.appendChild(item);
}

const METRIC_ICON_BASE = 'assets/wom/metrics';
const METRIC_ICON_SMALL_BASE = 'assets/wom/metrics_small';
const BOSS_BACKGROUND_BASE = 'assets/wom/backgrounds';
const UNAVAILABLE_BOSS_BACKGROUNDS = new Set(['mimic']);

/*
 * makeMetricValue(metric, formattedValue, options)
 *
 * Builds a reusable metric-value component: an inline-flex <span> containing
 * a 13×13 metric icon immediately followed by the formatted value text.
 *
 * metric  — 'ehb' | 'ehp'
 * value   — already-formatted string (e.g. "1,270.52")
 * options.pill — if true, adds score-pill classes so the border wraps
 *                both the icon and the number
 *
 * Returns a DOM Element (not a string) so it can be appended directly
 * or used with replaceWith/replaceChildren.
 */
function makeMetricValue(metric, value, { pill = false } = {}) {
  const span = document.createElement('span');
  const classes = ['metric-value', `metric-value--${metric}`];
  if (pill) classes.push('score-pill', `score-pill--${metric}`);
  span.className = classes.join(' ');

  const img = document.createElement('img');
  img.src = `${METRIC_ICON_BASE}/${metric}.png`;
  img.alt = '';
  img.width = 13;
  img.height = 13;
  img.loading = 'lazy';
  img.setAttribute('aria-hidden', 'true');

  const strong = document.createElement('strong');
  strong.textContent = value;

  span.appendChild(img);
  span.appendChild(strong);
  return span;
}

/*
 * setMetricValue(node, selector, metric, formattedValue, options)
 *
 * Convenience wrapper: finds selector within node, clears it, and appends
 * a fresh makeMetricValue() component.
 */
function setMetricValue(node, selector, metric, value, options = {}) {
  const el = qs(node, selector);
  el.replaceChildren(makeMetricValue(metric, value, options));
}

function qs(node, selector) {
  const el = node.querySelector(selector);
  if (!el) throw new Error(`querySelector('${selector}') returned null`);
  return el;
}

function qsa(node, selector) {
  return Array.from(node.querySelectorAll(selector));
}

function syncParticipantResponsiveLayout() {
  const useMobileLayout = participantMobileLayoutQuery.matches;

  qsa(participantsList, '.participant-card').forEach((participantNode) => {
    const top = participantNode.querySelector('.participant-card__top');
    const identity = participantNode.querySelector('.participant-card__identity');
    const summary = participantNode.querySelector('.participant-card__summary');
    const totals = participantNode.querySelector('.participant-card__totals');
    const signet = participantNode.querySelector('.participant-team-signet');
    const typeBadge = participantNode.querySelector('.player-type-badge');
    const name = participantNode.querySelector('.participant-name');
    const badges = participantNode.querySelector('.participant-badges');
    let nameplate = participantNode.querySelector('.participant-card__nameplate');

    if (!top || !identity || !summary || !totals || !signet || !typeBadge || !name) return;

    if (useMobileLayout) {
      if (signet.parentElement !== top) {
        top.insertBefore(signet, top.firstChild);
      }

      if (!nameplate) {
        nameplate = document.createElement('div');
        nameplate.className = 'participant-card__nameplate';
      }

      if (typeBadge.parentElement !== nameplate) {
        nameplate.appendChild(typeBadge);
      }

      if (name.parentElement !== nameplate) {
        nameplate.appendChild(name);
      }

      if (nameplate.parentElement !== identity) {
        identity.appendChild(nameplate);
      }

      if (summary) {
        top.insertBefore(totals, summary);
      } else if (totals.parentElement !== top) {
        top.appendChild(totals);
      }

      return;
    }

    const restoreAnchor = badges && badges.parentElement === identity ? badges : null;

    if (signet.parentElement !== identity) {
      identity.insertBefore(signet, identity.firstChild);
    }

    if (typeBadge.parentElement !== identity) {
      identity.insertBefore(typeBadge, restoreAnchor);
    }

    if (name.parentElement !== identity) {
      identity.insertBefore(name, restoreAnchor);
    }

    if (nameplate) {
      nameplate.remove();
    }

    if (totals.parentElement !== summary) {
      summary.appendChild(totals);
    }
  });
}

function animateBreakdownOpen(panel) {
  panel.hidden = false;
  panel.classList.add('is-open');
  panel.style.transition = 'none';
  panel.style.maxHeight = '0px';

  requestAnimationFrame(() => {
    panel.style.transition = '';
    panel.style.maxHeight = `${panel.scrollHeight}px`;
  });

  const onEnd = (event) => {
    if (event.propertyName !== 'max-height') return;
    panel.style.maxHeight = 'none';
    panel.removeEventListener('transitionend', onEnd);
  };

  panel.addEventListener('transitionend', onEnd);
}

function animateBreakdownClose(panel) {
  if (panel.hidden) return;

  const startHeight = panel.scrollHeight;
  panel.style.transition = 'none';
  panel.style.maxHeight = `${startHeight}px`;

  requestAnimationFrame(() => {
    panel.style.transition = '';
    panel.classList.remove('is-open');
    panel.style.maxHeight = '0px';
  });

  const onEnd = (event) => {
    if (event.propertyName !== 'max-height') return;
    panel.hidden = true;
    panel.style.maxHeight = '';
    panel.removeEventListener('transitionend', onEnd);
  };

  panel.addEventListener('transitionend', onEnd);
}

function closeParticipantBreakdowns(participantNode) {
  qsa(participantNode, '.score-toggle').forEach((button) => {
    button.setAttribute('aria-expanded', 'false');
  });
  qsa(participantNode, '.score-breakdown').forEach((panel) => {
    animateBreakdownClose(panel);
  });
  participantNode.dataset.activeMetric = '';
}

function renderStats(data) {
  const spread = data.summary.rating_max - data.summary.rating_min;
  statsGrid.innerHTML = '';
  const stats = [
    ['Teams', data.summary.team_count, 'Balanced groups generated'],
    ['Players', data.summary.participant_count, 'Pulled from the participant list'],
    ['Team Size', data.team_size, 'Target players per team'],
    ['Rating Spread', formatNumber(spread), 'Difference between highest and lowest team rating'],
  ];

  stats.forEach(([label, value, caption]) => {
    statsGrid.appendChild(createStatCard(label, value, caption));
  });
}

function renderRules(data) {
  baseRules.innerHTML = '';
  decayRules.innerHTML = '';

  const s = data.scoring;
  appendListItem(baseRules, `EHB rating = EHB gained (last ${s.window_months} mo) + lifetime EHB / ${s.lifetime_divisor}`);
  appendListItem(baseRules, `EHP rating = (EHP gained (last ${s.window_months} mo) + lifetime EHP / ${s.lifetime_divisor}) / ${s.skilling_divisor}`);
  appendListItem(baseRules, 'Total rating = EHB rating + EHP rating');

  appendListItem(decayRules, `Lifetime contribution = lifetime metric / ${s.lifetime_divisor}`);
  appendListItem(decayRules, `Skilling contribution is divided by ${s.skilling_divisor}`);
  appendListItem(decayRules, 'Combat stays direct; skilling counts as a smaller, cleaner fraction');
}

function padLeading(value, referenceStr, char = '0') {
  const s = String(value);
  return s.length >= referenceStr.length ? s : char.repeat(referenceStr.length - s.length) + s;
}

function topEntryByValue(items = [], key) {
  return items.reduce((best, item) => {
    if (!item || typeof item[key] !== 'number') return best;
    if (!best || item[key] > best[key]) return item;
    return best;
  }, null);
}

function aggregateTopEntry(players, collectionKey, valueKey) {
  const totals = new Map();

  players.forEach((player) => {
    (player[collectionKey] || []).forEach((item) => {
      if (!item || typeof item[valueKey] !== 'number') return;
      const existing = totals.get(item.key);
      if (existing) {
        existing.total += item[valueKey];
        return;
      }
      totals.set(item.key, {
        key: item.key,
        name: item.name,
        total: item[valueKey],
      });
    });
  });

  return Array.from(totals.values()).sort((a, b) => b.total - a.total)[0] || null;
}

function getIdealTeamGridColumns(teamCount) {
  if (teamCount <= 1) return 1;
  if (teamCount <= 3) return teamCount;
  const rows = Math.max(2, Math.round(Math.sqrt(teamCount)));
  return Math.ceil(teamCount / rows);
}

function getThemeForParticipant(data, participant) {
  const teamIndex = data.teams.findIndex((team) => team.name === participant.team);
  const matchingTeam = teamIndex === -1 ? { name: participant.team } : data.teams[teamIndex];
  return getThemeForTeam(matchingTeam, teamIndex === -1 ? 0 : teamIndex);
}

function setTeamHighlight(node, type, { title, meta, iconUrl = null, iconAlt = '' }) {
  qs(node, `.team-${type}-focus`).textContent = title;
  qs(node, `.team-${type}-meta`).textContent = meta;

  const iconWrap = qs(node, `.team-highlight--${type} .team-highlight__icon-wrap`);
  const icon = qs(node, `.team-highlight__icon--${type}`);
  if (iconUrl) {
    iconWrap.hidden = false;
    icon.src = iconUrl;
    icon.alt = iconAlt;
  } else {
    iconWrap.hidden = true;
    icon.removeAttribute('src');
    icon.alt = '';
  }
}

function setTeamSignet(node, selector, theme, label) {
  const signet = qs(node, selector);
  const icon = signet.tagName === 'IMG' ? signet : qs(signet, 'img');
  icon.src = theme.crest;
  icon.alt = `${label} signet`;
}

function applyFavoriteBadges(node, player) {
  const topBoss = (player.bosses || [])[0];
  const bossBadge = qs(node, '.participant-favorite-badge--boss');
  const bossIcon = qs(node, '.participant-favorite-badge__icon--boss');
  if (topBoss) {
    bossBadge.hidden = false;
    bossBadge.dataset.tooltip = topBoss.name;
    bossBadge.setAttribute('aria-label', `Most bossed: ${topBoss.name}`);
    bossIcon.src = `${METRIC_ICON_BASE}/${topBoss.key}.png`;
    bossIcon.alt = `${topBoss.name} icon`;
  } else {
    bossBadge.hidden = true;
    bossBadge.removeAttribute('data-tooltip');
    bossBadge.removeAttribute('aria-label');
    bossIcon.removeAttribute('src');
    bossIcon.alt = '';
  }

  const topSkill = (player.skills || [])[0];
  const skillBadge = qs(node, '.participant-favorite-badge--skill');
  const skillIcon = qs(node, '.participant-favorite-badge__icon--skill');
  if (topSkill) {
    skillBadge.hidden = false;
    skillBadge.dataset.tooltip = topSkill.name;
    skillBadge.setAttribute('aria-label', `Most trained: ${topSkill.name}`);
    skillIcon.src = `${METRIC_ICON_BASE}/${topSkill.key}.png`;
    skillIcon.alt = `${topSkill.name} icon`;
  } else {
    skillBadge.hidden = true;
    skillBadge.removeAttribute('data-tooltip');
    skillBadge.removeAttribute('aria-label');
    skillIcon.removeAttribute('src');
    skillIcon.alt = '';
  }
}

function applyTeamBanner(node, theme) {
  node.style.setProperty('--team-banner-url', `url('${theme.banner}')`);
}

function renderTeams(data) {
  teamsGrid.innerHTML = '';
  if (!data.teams.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No teams available yet. Run the generator to populate site data.';
    teamsGrid.appendChild(emptyState);
    return;
  }

  const allPlayers = data.teams.flatMap(team => team.players);
  const maxRatingStr = formatNumber(Math.max(...allPlayers.map(player => player.total_rating)));
  teamsGrid.dataset.teamCount = String(data.teams.length);
  teamsGrid.dataset.columns = String(getIdealTeamGridColumns(data.teams.length));
  // Use rem-based widths so ch resolution doesn't depend on font-size differences.
  // IBM Plex Mono at 0.75rem ≈ 0.46rem/char; pill has 14px (0.875rem) padding.
  const ratingWidth = `${(maxRatingStr.length * 0.46 + 0.875).toFixed(2)}rem`;

  data.teams.forEach((team, index) => {
    const theme = getThemeForTeam(team, index);
    const teamNode = teamTemplate.content.firstElementChild.cloneNode(true);
    teamNode.style.animationDelay = `${index * 80}ms`;
    teamNode.dataset.teamIndex = String(index + 1);
    applyTeamTheme(teamNode, theme);
    applyTeamBanner(teamNode, theme);
    qs(teamNode, '.team-label').textContent = theme.teamLabel;
    qs(teamNode, '.team-name').textContent = theme.title;
    qs(teamNode, '.team-card__flavor').textContent = theme.flavor;
    qs(teamNode, '.team-total__value').innerHTML = '<img src="assets/icon-rating.svg" alt="" width="13" height="13" loading="lazy">' + formatNumber(team.total_rating);
    qs(teamNode, '.team-player-count').textContent = `${team.player_count} members`;
    qs(teamNode, '.team-average-rating').innerHTML = '<img src="assets/icon-rating.svg" alt="" width="12" height="12" loading="lazy">' + `${formatNumber(team.total_rating / team.player_count)} avg rating`;
    setTeamSignet(teamNode, '.team-card__crest-icon', theme, theme.name);

    const teamTopBoss = aggregateTopEntry(team.players, 'lifetime_bosses', 'ehb');
    const teamTopSkill = aggregateTopEntry(team.players, 'lifetime_skills', 'ehp');

    setTeamHighlight(teamNode, 'boss', teamTopBoss
      ? {
          title: teamTopBoss.name,
          meta: `${formatNumber(teamTopBoss.total)} total lifetime EHB`,
          iconUrl: `${METRIC_ICON_BASE}/${teamTopBoss.key}.png`,
          iconAlt: `${teamTopBoss.name} icon`,
        }
      : {
          title: 'No boss focus',
          meta: 'No notable bossing data available',
        });

    setTeamHighlight(teamNode, 'skill', teamTopSkill
      ? {
          title: teamTopSkill.name,
          meta: `${formatNumber(teamTopSkill.total)} total lifetime EHP`,
          iconUrl: `${METRIC_ICON_BASE}/${teamTopSkill.key}.png`,
          iconAlt: `${teamTopSkill.name} icon`,
        }
      : {
          title: 'No skill focus',
          meta: 'No notable skilling data available',
        });

    delete teamNode.dataset.artMode;

    const roster = qs(teamNode, '.team-roster');
    roster.style.setProperty('--roster-rating-width', `max(6.3rem, ${ratingWidth})`);

    team.players.forEach((player) => {
      const playerNode = playerTemplate.content.firstElementChild.cloneNode(true);
      applyParticipantTheme(playerNode, theme);

      const type = (player.player_type || 'regular').toLowerCase();
      const typeBadge = qs(playerNode, '.player-type-badge');
      typeBadge.src = playerTypeIcon(type);
      typeBadge.alt = type;
      applyFavoriteBadges(playerNode, player);

      const topBoss = (player.bosses || [])[0];
      if (topBoss && !UNAVAILABLE_BOSS_BACKGROUNDS.has(topBoss.key)) {
        const bgUrl =
          `${BOSS_BACKGROUND_BASE}/${topBoss.key}.png`;
        playerNode.style.setProperty('--boss-bg', `url('${bgUrl}')`);
      }

      qs(playerNode, '.player-name').textContent = player.username;
      qs(playerNode, '.metric-overall-rank').textContent = formatRank(
        player.rating_rank ?? player.overall_rank
      );
      qs(playerNode, '.metric-total').innerHTML = '<img src="assets/icon-rating.svg" alt="" width="12" height="12" loading="lazy">' + formatNumber(player.total_rating);
      qs(playerNode, '.metric-share').textContent = `${((player.total_rating / team.total_rating) * 100).toFixed(1)}%`;

      roster.appendChild(playerNode);
    });

    teamsGrid.appendChild(teamNode);
  });
}

function renderParticipants(data) {
  if (!data.participants.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No participant details available yet.';
    participantsList.appendChild(emptyState);
    return;
  }

  const participantThemeMap = new Map(
    data.teams.map((team, index) => [team.name, getThemeForTeam(team, index)])
  );

  function makeEmptyItem(text) {
    const li = document.createElement('li');
    li.className = 'breakdown-item breakdown-item--empty';
    li.textContent = text;
    return li;
  }

  /*
   * Build a merged boss/skill row.
   *   iconKey        — WOM metric key for the icon
   *   name           — display name
   *   ltKc           — lifetime kill count / xp (string, already formatted)
   *   ltVal          — lifetime ehb / ehp (string, already formatted)
   *   rcKc           — recent gain kc/xp (string with '+' prefix, or null)
   *   rcVal          — recent gain ehb/ehp (string with '+' prefix, or null)
   */
  function makeBreakdownItem(iconKey, name, ltKc, ltVal, rcKc, rcVal) {
    const li = document.createElement('li');
    li.className = 'breakdown-item';
    const iconUrl =
      `${METRIC_ICON_SMALL_BASE}/${iconKey}.png`;

    const activityClass = rcKc
      ? 'breakdown-item__activity'
      : 'breakdown-item__activity breakdown-item__activity--empty';
    const metricClass = rcVal
      ? 'breakdown-item__metric'
      : 'breakdown-item__metric breakdown-item__metric--empty';

    li.innerHTML =
      `<img class="breakdown-item__icon" src="${iconUrl}" alt="" width="16" height="16" loading="lazy">` +
      `<span class="breakdown-item__name">${name}</span>` +
      `<span class="${activityClass}"><span class="breakdown-item__lifetime">${ltKc}</span><span class="breakdown-item__recent">${rcKc ?? '—'}</span></span>` +
      `<span class="${metricClass}"><span class="breakdown-item__lifetime">${ltVal}</span><span class="breakdown-item__recent">${rcVal ?? '—'}</span></span>`;
    return li;
  }

  data.participants.forEach((participant) => {
    const theme = participantThemeMap.get(participant.team) || getThemeForParticipant(data, participant);
    const participantNode = participantTemplate.content.firstElementChild.cloneNode(true);
    applyParticipantTheme(participantNode, theme);
    setTeamSignet(participantNode, '.participant-team-signet', theme, theme.name);

    // Player type badge
    const type = (participant.player_type || 'regular').toLowerCase();
    const typeBadge = qs(participantNode, '.player-type-badge');
    typeBadge.src = playerTypeIcon(type);
    typeBadge.alt = type;

    applyFavoriteBadges(participantNode, participant);

    // Header
    qs(participantNode, '.participant-name').textContent = participant.username;
    qs(participantNode, '.participant-overall-rank').textContent = formatRank(
        participant.rating_rank ?? participant.overall_rank
      );
    qs(participantNode, '.participant-total').innerHTML = '<img src="assets/icon-rating.svg" alt="" width="15" height="15" loading="lazy">' + formatNumber(participant.total_rating);

    // Activity score row — EHB/EHP gained (plain, no pill)
    setMetricValue(participantNode, '.participant-ehb-gained', 'ehb', formatNumber(participant.ehb_gained));
    setMetricValue(participantNode, '.participant-ehp-gained', 'ehp', formatNumber(participant.ehp_gained));
    // Lifetime contribution — plain text, no icon
    qsa(participantNode, '.participant-ehb-bonus').forEach((el) => {
      el.textContent = formatNumber(participant.ehb_lifetime_bonus);
    });
    qsa(participantNode, '.participant-ehp-bonus').forEach((el) => {
      el.textContent = formatNumber(participant.ehp_lifetime_bonus);
    });
    // Per-metric scores — header (no pill), breakdown footer total (pill)
    setMetricValue(participantNode, '.participant-ehb-score', 'ehb', formatNumber(participant.ehb_score));
    setMetricValue(participantNode, '.participant-ehp-score', 'ehp', formatNumber(participant.ehp_score));
    // Lifetime values in formula strip (plain, no pill)
    setMetricValue(participantNode, '.participant-ehb', 'ehb', formatNumber(participant.ehb));
    qs(participantNode, '.participant-ehb-rank').textContent = `#${formatRank(participant.ehb_rank)}`;
    setMetricValue(participantNode, '.participant-ehp', 'ehp', formatNumber(participant.ehp));
    qs(participantNode, '.participant-ehp-rank').textContent = `#${formatRank(participant.ehp_rank)}`;

    // Build merged EHB breakdown (lifetime bosses + recent gains joined by key)
    const ehbList = qs(participantNode, '.breakdown-list--ehb');
    const recentBossMap = new Map((participant.bosses || []).map(b => [b.key, b]));
    const lifetimeBosses = participant.lifetime_bosses || [];
    const ehbRows = lifetimeBosses.filter(b => {
      const rc = recentBossMap.get(b.key);
      return b.kills > 0 || (rc && rc.kills > 0);
    });
    if (ehbRows.length === 0) {
      ehbList.appendChild(makeEmptyItem('No boss kill data available.'));
    } else {
      ehbRows.forEach((boss) => {
        const rc = recentBossMap.get(boss.key);
        ehbList.appendChild(makeBreakdownItem(
          boss.key, boss.name,
          formatNumber(boss.kills),
          formatNumber(boss.ehb),
          rc ? `+${formatNumber(rc.kills)}`  : null,
          rc ? `+${formatNumber(rc.ehb)}`   : null,
        ));
      });
    }

    // Build merged EHP breakdown (lifetime skills + recent gains joined by key)
    const ehpList = qs(participantNode, '.breakdown-list--ehp');
    const recentSkillMap = new Map((participant.skills || []).map(s => [s.key, s]));
    const lifetimeSkills = participant.lifetime_skills || [];
    const ehpRows = lifetimeSkills.filter(s => {
      const rc = recentSkillMap.get(s.key);
      return s.xp > 0 || (rc && rc.xp > 0);
    });
    if (ehpRows.length === 0) {
      ehpList.appendChild(makeEmptyItem('No skilling data available.'));
    } else {
      ehpRows.forEach((skill) => {
        const rc = recentSkillMap.get(skill.key);
        ehpList.appendChild(makeBreakdownItem(
          skill.key, skill.name,
          formatXp(skill.xp),
          formatNumber(skill.ehp),
          rc ? `+${formatXp(rc.xp)}`        : null,
          rc ? `+${formatNumber(rc.ehp)}`   : null,
        ));
      });
    }

    const topRegion = qs(participantNode, '.participant-card__top');

    topRegion.addEventListener('click', (event) => {
      if (event.target.closest('.score-toggle')) return;
      if (!participantNode.dataset.activeMetric) return;
      closeParticipantBreakdowns(participantNode);
    });

    // Wire up Combat / Skilling toggle buttons
    qsa(participantNode, '.score-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const metric = btn.dataset.controls; // 'ehb' or 'ehp'
        const panel = qs(participantNode, `[data-breakdown="${metric}"]`);
        const isOpen = btn.getAttribute('aria-expanded') === 'true';

        // Close all panels + reset all toggle states for this card
        closeParticipantBreakdowns(participantNode);

        // If it was closed, open it; if it was open, leave everything closed
        if (!isOpen) {
          btn.setAttribute('aria-expanded', 'true');
          animateBreakdownOpen(panel);
          participantNode.dataset.activeMetric = metric;
        }
      });
    });

    participantsList.appendChild(participantNode);
  });

  syncParticipantResponsiveLayout();
}

function getTabFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const requestedTab = params.get('tab');
  return VALID_TABS.has(requestedTab) ? requestedTab : 'teams';
}

function updateUrlForTab(tabName) {
  const url = new URL(window.location.href);
  url.searchParams.set('tab', tabName);
  window.history.replaceState({}, '', url);
}

function setActiveTab(tabName, options = {}) {
  const shouldUpdateUrl = options.updateUrl ?? true;
  const safeTabName = VALID_TABS.has(tabName) ? tabName : 'teams';

  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === safeTabName;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  tabPanels.forEach((panel) => {
    const isActive = panel.dataset.panel === safeTabName;
    panel.classList.toggle('is-active', isActive);
    panel.hidden = !isActive;
  });

  if (shouldUpdateUrl) {
    updateUrlForTab(safeTabName);
  }
}

function setupTabs() {
  const buttons = Array.from(tabButtons);

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      setActiveTab(button.dataset.tab);
    });

    button.addEventListener('keydown', (event) => {
      let next = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        next = buttons[(index + 1) % buttons.length];
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        next = buttons[(index - 1 + buttons.length) % buttons.length];
      } else if (event.key === 'Home') {
        next = buttons[0];
      } else if (event.key === 'End') {
        next = buttons[buttons.length - 1];
      }
      if (next) {
        event.preventDefault();
        next.focus();
        setActiveTab(next.dataset.tab);
      }
    });
  });

  window.addEventListener('popstate', () => {
    setActiveTab(getTabFromUrl(), { updateUrl: false });
  });

  setActiveTab(getTabFromUrl(), { updateUrl: false });
}

function setInfoChipOpenState(chip, isOpen) {
  chip.classList.toggle('is-open', isOpen);

  const button = chip.querySelector('.info-chip__button');
  if (button) {
    button.setAttribute('aria-expanded', String(isOpen));
  }
}

function closeInfoChips(exceptChip = null) {
  infoChips.forEach((chip) => {
    if (chip === exceptChip) return;
    setInfoChipOpenState(chip, false);
  });
}

function setupInfoChips() {
  if (!infoChips.length) return;

  infoChips.forEach((chip) => {
    const button = chip.querySelector('.info-chip__button');
    if (!button) return;

    button.setAttribute('aria-expanded', 'false');

    button.addEventListener('click', (event) => {
      const willOpen = !chip.classList.contains('is-open');

      if (window.matchMedia('(max-width: 720px)').matches) {
        event.preventDefault();
      }

      closeInfoChips(chip);
      setInfoChipOpenState(chip, willOpen);
    });
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('.info-chip')) return;
    closeInfoChips();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeInfoChips();
    }
  });

  window.addEventListener('resize', () => {
    closeInfoChips();
  });
}

async function loadTeams() {
  try {
    const response = await fetch('data/teams.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    renderStats(data);
    renderRules(data);
    renderTeams(data);
    renderParticipants(data);
  } catch (error) {
    console.error('loadTeams failed:', error);
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = `Could not load team data: ${error.message}`;
    teamsGrid.appendChild(emptyState);
  }
}

setupTabs();
setupInfoChips();
startCountdown();

if (typeof participantMobileLayoutQuery.addEventListener === 'function') {
  participantMobileLayoutQuery.addEventListener('change', syncParticipantResponsiveLayout);
} else if (typeof participantMobileLayoutQuery.addListener === 'function') {
  participantMobileLayoutQuery.addListener(syncParticipantResponsiveLayout);
}

loadTeams();
