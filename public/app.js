const statsGrid = document.getElementById('stats-grid');
const baseRules = document.getElementById('base-rules');
const decayRules = document.getElementById('decay-rules');
const boardGrid = document.getElementById('board-grid');
const boardGridScroller = boardGrid?.parentElement || null;
const boardSummary = document.getElementById('board-summary');
const boardRulesList = document.getElementById('board-rules-list');
const boardMeta = document.getElementById('board-meta');
const teamsGrid = document.getElementById('teams-grid');
const participantsList = document.getElementById('participants-list');
const boardTitle = document.getElementById('board-title');
const boardDescription = document.getElementById('board-description');
const teamTemplate = document.getElementById('team-template');
const playerTemplate = document.getElementById('player-template');
const participantTemplate = document.getElementById('participant-template');
const boardTileTemplate = document.getElementById('board-tile-template');
const boardCompletionTemplate = document.getElementById('board-completion-template');
const tabButtons = document.querySelectorAll('[data-tab]');
const tabPanels = document.querySelectorAll('[data-panel]');
const infoChips = document.querySelectorAll('.info-chip');
const VALID_TABS = new Set(['teams', 'board', 'participants']);
const participantMobileLayoutQuery = window.matchMedia('(max-width: 720px)');

const boardDetail = {
  root: document.getElementById('board-detail'),
  art: document.getElementById('board-detail-art'),
  icon: document.getElementById('board-detail-icon'),
  coordinate: document.getElementById('board-detail-coordinate'),
  title: document.getElementById('board-detail-title'),
  description: document.getElementById('board-detail-description'),
  contextWrap: document.getElementById('board-detail-context-wrap'),
  objective: document.getElementById('board-detail-objective'),
  verification: document.getElementById('board-detail-verification'),
  targetsWrap: document.getElementById('board-detail-targets-wrap'),
  targetsLabel: document.getElementById('board-detail-targets-label'),
  targets: document.getElementById('board-detail-targets'),
  requirementsWrap: document.getElementById('board-detail-requirements-wrap'),
  requirements: document.getElementById('board-detail-requirements'),
  completionNotch: document.getElementById('board-detail-completion-notch'),
  verificationWrap: document.getElementById('board-detail-verification-wrap'),
  trackerWrap: document.getElementById('board-detail-tracker-wrap'),
  trackerLabel: document.getElementById('board-detail-tracker-label'),
  tracker: document.getElementById('board-detail-tracker'),
};

const boardPopover = {
  root: document.getElementById('board-popover'),
  backdrop: document.getElementById('board-popover-backdrop'),
  dialog: document.getElementById('board-popover-dialog'),
  close: document.getElementById('board-popover-close'),
};

const boardItemPreview = {
  root: document.getElementById('board-item-preview'),
  card: document.getElementById('board-item-preview-card'),
  imageWrap: document.getElementById('board-item-preview-image-wrap'),
  image: document.getElementById('board-item-preview-image'),
  status: document.getElementById('board-item-preview-status'),
  title: document.getElementById('board-item-preview-title'),
  extract: document.getElementById('board-item-preview-extract'),
};

const boardInteractionQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

const boardState = {
  data: null,
  teamsData: null,
  selectedTileId: null,
  openTileId: null,
  tilesById: new Map(),
  tileNodesById: new Map(),
  popoverAnchorTileId: null,
  itemPreviewCache: new Map(),
  itemPreviewRequestId: 0,
  itemPreviewAnchor: null,
  itemPreviewPoint: null,
  itemPreviewHideTimeoutId: null,
};

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

function applyBoardCompletionTheme(node, theme) {
  node.dataset.godTheme = theme.key;
  applyThemeVariables(node, 'board-team', theme);
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

// Bingo event window — UTC boundaries
const BINGO_START = Date.UTC(2026, 2, 18, 11, 30);  // 18 Mar 2026 11:30 UTC
const BINGO_END   = Date.UTC(2026, 3,  1, 11, 30);  // 1 Apr 2026 11:30 UTC

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

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatRank(value) {
  // Ranks may be fractional (average ties), display as integer when whole
  const rounded = Math.round(value * 2) / 2; // keep .5 halves
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function formatUtcDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return `${new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    hour12: false,
  }).format(date)} UTC`;
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function toDataToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}

function toDisplayLabel(value, fallback = 'Unknown') {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  return raw
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const BOARD_COLUMN_LABELS = ['B', 'I', 'N', 'G', 'O'];

function formatBoardCoordinate(position = {}) {
  const row = position.row ?? 1;
  const column = position.column ?? 1;
  const columnLabel = BOARD_COLUMN_LABELS[column - 1] || `C${column}`;
  return `${columnLabel}${row}`;
}

function getBoardTileIconUrl(tile) {
  if (tile?.id === 'free-tile-tbd') {
    return getBoardRefIconUrl(BOARD_TILE_HERO_REFS['free-tile-tbd']);
  }
  const key = tile?.icon?.key;
  return key ? `${METRIC_ICON_BASE}/${key}.png` : null;
}

function getBoardTileArtUrl(tile) {
  if (tile?.art?.background_url) return tile.art.background_url;
  const key = tile?.art?.background_key;
  return key ? `${BOSS_BACKGROUND_BASE}/${key}.png` : null;
}

function getTrackedBoardTeams(boardData = boardState.data) {
  const teams = boardData?.teams_tracked;
  if (Array.isArray(teams) && teams.length) return teams;
  if (Array.isArray(boardState.teamsData?.teams)) {
    return boardState.teamsData.teams.map((team) => team.name);
  }
  return [];
}

function getBoardTrackedTeamCount(boardData = boardState.data) {
  const trackedTeams = getTrackedBoardTeams(boardData);
  if (trackedTeams.length) return trackedTeams.length;
  return boardState.teamsData?.summary?.team_count || 0;
}

function normalizeBoardCompletion(completion, index) {
  if (!completion || typeof completion !== 'object') return null;

  const statusToken = toDataToken(completion.status || 'verified');
  const confirmedStatuses = new Set(['verified', 'confirmed', 'accepted', 'complete', 'completed']);

  return {
    id: completion.id || `${completion.team || 'team'}-${completion.player || 'player'}-${index}`,
    team: completion.team || '',
    player: completion.player || completion.by_player || 'Unknown player',
    completedAt: completion.completed_at || completion.claimed_at || '',
    proofUrl: completion.proof_url || completion.proof || '',
    note: completion.note || '',
    statusToken,
    statusLabel: completion.status ? toDisplayLabel(completion.status) : 'Verified',
    isConfirmed: !completion.status || confirmedStatuses.has(statusToken),
  };
}

function getBoardTileCompletionState(tile, boardData = boardState.data) {
  const trackedTeams = getTrackedBoardTeams(boardData);
  const trackedTeamSet = new Set(trackedTeams);
  if (tile?.id === 'free-tile-tbd') {
    const completions = trackedTeams.map((teamName, index) => normalizeBoardCompletion({
      id: `free-tile-${toDataToken(teamName)}`,
      team: teamName,
      player: 'Blessed Frog',
      status: 'verified',
      completed_at: boardData?.updated_at || '',
      note: 'Automatically unlocked free tile.',
    }, index)).filter(Boolean);

    return {
      key: trackedTeams.length ? 'cleared' : 'active',
      label: trackedTeams.length ? 'Cleared' : 'Free',
      detail: trackedTeams.length
        ? `All ${trackedTeams.length} teams start with this tile`
        : 'Automatically unlocked free tile',
      teamCount: trackedTeams.length,
      completedTeams: [...trackedTeams],
      completions,
      verifiedClaimCount: completions.length,
    };
  }

  const completions = (tile?.competition?.completions || [])
    .map(normalizeBoardCompletion)
    .filter(Boolean)
    .sort((left, right) => {
      const leftTime = left.completedAt ? Date.parse(left.completedAt) : NaN;
      const rightTime = right.completedAt ? Date.parse(right.completedAt) : NaN;
      if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return 0;
      if (Number.isNaN(leftTime)) return 1;
      if (Number.isNaN(rightTime)) return -1;
      return rightTime - leftTime;
    });

  const completedTeams = [];
  const seenTeams = new Set();

  completions.forEach((completion) => {
    if (!completion.isConfirmed || !completion.team || seenTeams.has(completion.team)) return;
    if (trackedTeamSet.size && !trackedTeamSet.has(completion.team)) return;
    seenTeams.add(completion.team);
    completedTeams.push(completion.team);
  });

  const teamCount = getBoardTrackedTeamCount(boardData);
  const verifiedClaimCount = completions.filter((completion) => completion.isConfirmed).length;

  if (!completedTeams.length) {
    return {
      key: 'open',
      label: 'Open',
      detail: 'No verified teams yet',
      teamCount,
      completedTeams,
      completions,
      verifiedClaimCount,
    };
  }

  if (teamCount > 0 && completedTeams.length >= teamCount) {
    return {
      key: 'cleared',
      label: 'Cleared',
      detail: `All ${teamCount} teams complete`,
      teamCount,
      completedTeams,
      completions,
      verifiedClaimCount,
    };
  }

  return {
    key: 'active',
    label: `${pluralize(completedTeams.length, 'team')} done`,
    detail: teamCount > 0
      ? `${completedTeams.length} of ${teamCount} teams complete`
      : `${pluralize(completedTeams.length, 'team')} complete`,
    teamCount,
    completedTeams,
    completions,
    verifiedClaimCount,
  };
}

function sortBoardTiles(tiles = []) {
  return [...tiles].sort((left, right) => {
    const leftRow = left?.position?.row ?? Number.MAX_SAFE_INTEGER;
    const rightRow = right?.position?.row ?? Number.MAX_SAFE_INTEGER;
    if (leftRow !== rightRow) return leftRow - rightRow;
    const leftColumn = left?.position?.column ?? Number.MAX_SAFE_INTEGER;
    const rightColumn = right?.position?.column ?? Number.MAX_SAFE_INTEGER;
    return leftColumn - rightColumn;
  });
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

function normalizeBoardItemRefs(tileRefs) {
  return Object.fromEntries(Object.entries(tileRefs).map(([tileId, refs]) => [
    tileId,
    refs.map((ref) => normalizeBoardItemRef(ref)).filter((ref) => ref.match),
  ]));
}

function normalizeBoardItemRef(ref) {
  if (typeof ref === 'string') {
    return {
      match: ref,
      matchLower: ref.toLowerCase(),
      display: ref,
      page: ref,
      image: ref,
      imageUrl: '',
      tileVisualKind: '',
      metricKey: '',
    };
  }

  const match = ref?.match || ref?.image || '';
  const image = ref?.image || match;
  const page = ref?.page || image;
  const display = ref?.display || match;
  return {
    match,
    matchLower: match.toLowerCase(),
    display,
    page,
    image,
    imageUrl: ref?.imageUrl || '',
    tileVisualKind: ref?.tileVisualKind || '',
    metricKey: ref?.metricKey || '',
  };
}

function getBoardTileItemRefs(tile) {
  return [
    ...(BOARD_TILE_ENCOUNTER_REFS[tile?.id] || []),
    ...(BOARD_TILE_ITEM_REFS[tile?.id] || []),
  ];
}

function getBoardItemIconUrl(itemName) {
  return `${WIKI_IMAGE_BASE}/${encodeURIComponent(String(itemName || '').replace(/\s+/g, '_'))}.png`;
}

function getBoardMetricIconUrl(metricKey) {
  return `${METRIC_ICON_BASE}/${metricKey}.png`;
}

function getBoardRefIconUrl(ref) {
  if (ref?.imageUrl) return ref.imageUrl;
  if (ref?.metricKey) return getBoardMetricIconUrl(ref.metricKey);
  return getBoardItemIconUrl(ref?.image);
}

function getBoardItemWikiUrl(itemName) {
  return `https://oldschool.runescape.wiki/w/${encodeURIComponent(String(itemName || '').replace(/\s+/g, '_'))}`;
}

function getBoardItemSummaryApiUrl(itemName) {
  return `https://oldschool.runescape.wiki/api.php?action=query&prop=extracts|pageimages&exintro=1&explaintext=1&pithumbsize=320&titles=${encodeURIComponent(String(itemName || '').replace(/\s+/g, '_'))}&format=json&origin=*`;
}

function getBoardItemParseApiUrl(itemName) {
  return `https://oldschool.runescape.wiki/api.php?action=parse&page=${encodeURIComponent(String(itemName || '').replace(/\s+/g, '_'))}&prop=text&section=0&format=json&origin=*`;
}

function isBoardItemBoundary(char) {
  return !char || !/[A-Za-z0-9]/.test(char);
}

function clearBoardItemPreviewHideTimeout() {
  if (!boardState.itemPreviewHideTimeoutId) return;
  window.clearTimeout(boardState.itemPreviewHideTimeoutId);
  boardState.itemPreviewHideTimeoutId = null;
}

function setBoardItemPreviewLayout(mode = 'side') {
  if (!boardItemPreview.root) return;
  boardItemPreview.root.dataset.layout = mode;
}

function getBoardItemPreviewLayoutFromDimensions(width, height) {
  if (!width || !height) return 'side';
  return (width / height) >= 1.3 ? 'stacked' : 'side';
}

function updateBoardItemPreviewLayoutFromImage() {
  if (!boardItemPreview.root || !boardItemPreview.imageWrap || boardItemPreview.imageWrap.hidden) return;

  const image = boardItemPreview.image;
  const naturalWidth = image.naturalWidth || 0;
  const naturalHeight = image.naturalHeight || 0;
  setBoardItemPreviewLayout(getBoardItemPreviewLayoutFromDimensions(naturalWidth, naturalHeight));
}

function scheduleBoardItemPreviewHide() {
  clearBoardItemPreviewHideTimeout();
  boardState.itemPreviewHideTimeoutId = window.setTimeout(() => {
    hideBoardItemPreview();
  }, 120);
}

function setBoardItemPreviewContent({
  title = '',
  extract = '',
  imageUrl = '',
  pageUrl = '',
  kind = 'item',
  imageWidth = 0,
  imageHeight = 0,
} = {}) {
  if (!boardItemPreview.root) return;

  boardItemPreview.root.dataset.kind = kind;
  boardItemPreview.title.textContent = title;
  boardItemPreview.extract.textContent = extract || 'No wiki extract available.';
  boardItemPreview.status.textContent = pageUrl ? 'OSRS Wiki preview' : 'Loading wiki preview';

  if (imageUrl) {
    boardItemPreview.imageWrap.hidden = false;
    setBoardItemPreviewLayout(getBoardItemPreviewLayoutFromDimensions(imageWidth, imageHeight));
    boardItemPreview.image.src = imageUrl;
    boardItemPreview.image.alt = title ? `${title} render` : '';
  } else {
    boardItemPreview.imageWrap.hidden = true;
    boardItemPreview.image.removeAttribute('src');
    boardItemPreview.image.alt = '';
    setBoardItemPreviewLayout('text-only');
  }
}

function getBoardItemPreviewAnchorRect(anchor, point) {
  if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) {
    return {
      left: point.x,
      right: point.x,
      top: point.y,
      bottom: point.y,
      width: 0,
      height: 0,
    };
  }

  return anchor?.getBoundingClientRect?.() || null;
}

function positionBoardItemPreview(anchor, point = null) {
  if (!boardItemPreview.root || !anchor) return;

  const gap = 14;
  const viewportPadding = 12;
  const anchorRect = getBoardItemPreviewAnchorRect(anchor, point);
  if (!anchorRect) return;
  const previewRect = boardItemPreview.root.getBoundingClientRect();
  const previewWidth = previewRect.width || 320;
  const previewHeight = previewRect.height || 200;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = anchorRect.left;
  let horizontal = 'left';
  if (left + previewWidth > viewportWidth - viewportPadding) {
    left = Math.max(viewportPadding, anchorRect.right - previewWidth);
    horizontal = 'right';
  }
  left = Math.max(viewportPadding, Math.min(left, viewportWidth - viewportPadding - previewWidth));

  let top = anchorRect.bottom + gap;
  let vertical = 'below';
  if (top + previewHeight > viewportHeight - viewportPadding) {
    top = Math.max(viewportPadding, anchorRect.top - previewHeight - gap);
    vertical = 'above';
  }

  boardItemPreview.root.dataset.x = horizontal;
  boardItemPreview.root.dataset.y = vertical;
  const anchorX = point?.x ?? (anchorRect.left + (anchorRect.width / 2));
  const arrowX = Math.max(18, Math.min(previewWidth - 30, anchorX - left));
  boardItemPreview.root.style.setProperty('--board-item-preview-arrow-x', `${Math.round(arrowX)}px`);
  boardItemPreview.root.style.left = `${Math.round(left)}px`;
  boardItemPreview.root.style.top = `${Math.round(top)}px`;
}

function showBoardItemPreview(anchor) {
  if (!boardItemPreview.root || !anchor) return;
  clearBoardItemPreviewHideTimeout();
  boardState.itemPreviewAnchor = anchor;
  boardItemPreview.root.hidden = false;
  boardItemPreview.root.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    positionBoardItemPreview(anchor, boardState.itemPreviewPoint);
  });
}

function hideBoardItemPreview() {
  if (!boardItemPreview.root) return;
  clearBoardItemPreviewHideTimeout();
  boardState.itemPreviewAnchor = null;
  boardState.itemPreviewPoint = null;
  boardItemPreview.root.hidden = true;
  boardItemPreview.root.setAttribute('aria-hidden', 'true');
}

function normalizeBoardItemPreviewResponse(data, fallbackTitle, pageUrl) {
  const pages = Object.values(data?.query?.pages || {});
  const page = pages.find((entry) => entry && !entry.missing) || null;
  if (!page) {
    return {
      title: fallbackTitle,
      extract: 'No wiki extract available.',
      imageUrl: '',
      imageWidth: 0,
      imageHeight: 0,
      pageUrl,
      kind: 'item',
    };
  }

  return {
    title: page.title || fallbackTitle,
    extract: page.extract || 'No wiki extract available.',
    imageUrl: page.thumbnail?.source || '',
    imageWidth: page.thumbnail?.width || 0,
    imageHeight: page.thumbnail?.height || 0,
    pageUrl,
    kind: 'item',
  };
}

function applyBoardRefPreviewOverrides(preview, ref) {
  if (!ref?.imageUrl) return preview;
  return {
    ...preview,
    imageUrl: ref.imageUrl,
  };
}

async function resolveBoardItemRedirectPage(itemName) {
  const response = await fetch(getBoardItemParseApiUrl(itemName), { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  const markup = data?.parse?.text?.['*'] || '';
  const redirectMatch = markup.match(/href="\/w\/([^"]+)"/i);
  if (!redirectMatch) return itemName;
  return decodeURIComponent(redirectMatch[1]).replace(/_/g, ' ');
}

async function loadBoardItemPreview(ref) {
  const cacheKey = ref.page;
  if (boardState.itemPreviewCache.has(cacheKey)) {
    return boardState.itemPreviewCache.get(cacheKey);
  }

  const pageUrl = getBoardItemWikiUrl(ref.page);
  const previewPromise = fetch(getBoardItemSummaryApiUrl(ref.page), { cache: 'force-cache' })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(async (data) => {
      const preview = applyBoardRefPreviewOverrides(
        normalizeBoardItemPreviewResponse(data, ref.display, pageUrl),
        ref,
      );
      if (preview.extract !== 'No wiki extract available.' || preview.imageUrl) {
        return preview;
      }

      const redirectedPage = await resolveBoardItemRedirectPage(ref.page);
      if (!redirectedPage || redirectedPage === ref.page) {
        return preview;
      }

      const redirectedResponse = await fetch(getBoardItemSummaryApiUrl(redirectedPage), { cache: 'force-cache' });
      if (!redirectedResponse.ok) {
        return preview;
      }

      const redirectedData = await redirectedResponse.json();
      return applyBoardRefPreviewOverrides(
        normalizeBoardItemPreviewResponse(redirectedData, ref.display, pageUrl),
        ref,
      );
    })
    .catch(() => ({
      title: ref.display,
      extract: 'Open the OSRS Wiki page for the full article.',
      imageUrl: getBoardRefIconUrl(ref),
      imageWidth: 0,
      imageHeight: 0,
      pageUrl,
    }));

  boardState.itemPreviewCache.set(cacheKey, previewPromise);
  return previewPromise;
}

function beginBoardItemPreview(anchor, ref, point = null) {
  if (!boardItemPreview.root || !anchor || !ref?.page) return;

  const requestId = ++boardState.itemPreviewRequestId;
  const kind = ref.metricKey ? 'encounter' : 'item';
  boardState.itemPreviewPoint = point;
  setBoardItemPreviewContent({
    title: ref.display,
    extract: 'Loading wiki extract...',
    imageUrl: getBoardRefIconUrl(ref),
    imageWidth: 0,
    imageHeight: 0,
    pageUrl: getBoardItemWikiUrl(ref.page),
    kind,
  });
  boardItemPreview.root.dataset.state = 'loading';
  showBoardItemPreview(anchor);

  loadBoardItemPreview(ref).then((preview) => {
    if (requestId !== boardState.itemPreviewRequestId) return;
    if (boardState.itemPreviewAnchor !== anchor) return;
    boardItemPreview.root.dataset.state = 'ready';
    setBoardItemPreviewContent({ ...preview, kind });
    positionBoardItemPreview(anchor, boardState.itemPreviewPoint);
  });
}

function bindBoardItemPreviewEvents(node, ref) {
  if (!node || !ref?.page) return;

  node.addEventListener('mouseenter', (event) => {
    if (!boardInteractionQuery.matches) return;
    beginBoardItemPreview(node, ref, { x: event.clientX, y: event.clientY });
  });

  node.addEventListener('mousemove', (event) => {
    if (!boardInteractionQuery.matches) return;
    boardState.itemPreviewPoint = { x: event.clientX, y: event.clientY };
    if (boardState.itemPreviewAnchor !== node || boardItemPreview.root.hidden) return;
    positionBoardItemPreview(node, boardState.itemPreviewPoint);
  });

  node.addEventListener('focus', () => {
    boardState.itemPreviewPoint = null;
    beginBoardItemPreview(node, ref, null);
  });

  node.addEventListener('mouseleave', () => {
    scheduleBoardItemPreviewHide();
  });

  node.addEventListener('blur', () => {
    scheduleBoardItemPreviewHide();
  });
}

function findNextBoardItemMatch(text, refs, startIndex = 0) {
  const lowerText = text.toLowerCase();
  let bestMatch = null;

  refs.forEach((ref) => {
    let matchIndex = lowerText.indexOf(ref.matchLower, startIndex);
    while (matchIndex !== -1) {
      const before = text[matchIndex - 1] || '';
      const after = text[matchIndex + ref.match.length] || '';
      if (isBoardItemBoundary(before) && isBoardItemBoundary(after)) {
        const nextMatch = {
          index: matchIndex,
          length: ref.match.length,
          ref,
        };

        if (
          !bestMatch
          || nextMatch.index < bestMatch.index
          || (nextMatch.index === bestMatch.index && nextMatch.length > bestMatch.length)
        ) {
          bestMatch = nextMatch;
        }
        break;
      }

      matchIndex = lowerText.indexOf(ref.matchLower, matchIndex + ref.match.length);
    }
  });

  return bestMatch;
}

function createBoardItemReferenceNode(ref, options = {}) {
  const { allowLinks = true, showIcon = true } = options;
  const itemRef = document.createElement(allowLinks ? 'a' : 'span');
  itemRef.className = `board-item-ref${allowLinks ? ' board-item-ref--link' : ''}`;
  itemRef.dataset.itemPage = ref.page;
  const labelText = String(ref?.display || '');
  const firstWhitespaceIndex = labelText.search(/\s/);
  const leadText = firstWhitespaceIndex === -1 ? labelText : labelText.slice(0, firstWhitespaceIndex);
  const trailingText = firstWhitespaceIndex === -1 ? '' : labelText.slice(firstWhitespaceIndex);

  if (allowLinks) {
    itemRef.href = getBoardItemWikiUrl(ref.page);
    itemRef.target = '_blank';
    itemRef.rel = 'noopener noreferrer';
    bindBoardItemPreviewEvents(itemRef, ref);
  }

  const lead = document.createElement('span');
  lead.className = 'board-item-ref__lead';

  if (showIcon) {
    const icon = document.createElement('img');
    icon.className = 'board-item-ref__icon';
    icon.src = getBoardRefIconUrl(ref);
    icon.alt = '';
    icon.loading = 'lazy';
    icon.decoding = 'async';
    icon.setAttribute('aria-hidden', 'true');
    icon.addEventListener('error', () => {
      icon.hidden = true;
    }, { once: true });
    lead.appendChild(icon);
  }

  const leadLabel = document.createElement('span');
  leadLabel.className = 'board-item-ref__label board-item-ref__label--lead';
  leadLabel.textContent = leadText;
  lead.appendChild(leadLabel);

  itemRef.appendChild(lead);

  if (trailingText) {
    const trailingLabel = document.createElement('span');
    trailingLabel.className = 'board-item-ref__label board-item-ref__label--rest';
    trailingLabel.textContent = trailingText;
    itemRef.appendChild(trailingLabel);
  }

  return itemRef;
}

function createBoardDetailTargetCard(ref) {
  const target = document.createElement(ref?.page ? 'a' : 'div');
  target.className = 'board-detail__target';

  if (ref?.page) {
    target.href = getBoardItemWikiUrl(ref.page);
    target.target = '_blank';
    target.rel = 'noopener noreferrer';
    bindBoardItemPreviewEvents(target, ref);
  }

  const iconWrap = document.createElement('span');
  iconWrap.className = 'board-detail__target-icon-wrap';

  const icon = document.createElement('img');
  icon.className = 'board-detail__target-icon';
  icon.src = getBoardRefIconUrl(ref);
  icon.alt = '';
  icon.loading = 'lazy';
  icon.decoding = 'async';
  icon.setAttribute('aria-hidden', 'true');
  icon.addEventListener('error', () => {
    iconWrap.hidden = true;
  }, { once: true });
  iconWrap.appendChild(icon);
  target.appendChild(iconWrap);

  const label = document.createElement('span');
  label.className = 'board-detail__target-label';
  label.textContent = ref?.display || 'Unknown target';
  target.appendChild(label);

  return target;
}

function createBoardRichTextFragment(text, tile, options = {}) {
  const fragment = document.createDocumentFragment();
  const content = String(text || '');
  const refs = getBoardTileItemRefs(tile);

  if (!content || !refs.length) {
    fragment.appendChild(document.createTextNode(content));
    return fragment;
  }

  let cursor = 0;
  while (cursor < content.length) {
    const match = findNextBoardItemMatch(content, refs, cursor);
    if (!match) {
      fragment.appendChild(document.createTextNode(content.slice(cursor)));
      break;
    }

    if (match.index > cursor) {
      fragment.appendChild(document.createTextNode(content.slice(cursor, match.index)));
    }

    fragment.appendChild(
      createBoardItemReferenceNode(match.ref, options),
    );
    cursor = match.index + match.length;
  }

  return fragment;
}

function setBoardRichText(element, text, tile, options = {}) {
  if (!element) return;
  element.replaceChildren(createBoardRichTextFragment(text, tile, options));
}

function appendBoardRichListItem(parent, text, tile, options = {}) {
  const item = document.createElement('li');
  item.appendChild(createBoardRichTextFragment(text, tile, options));
  parent.appendChild(item);
}

function createBoardSummaryCard(label, value, caption) {
  const card = document.createElement('article');
  card.className = 'board-summary-card';
  card.innerHTML = `
    <p class="board-summary-card__label">${label}</p>
    <strong class="board-summary-card__value">${value}</strong>
    <p class="board-summary-card__caption">${caption}</p>
  `;
  return card;
}

function createBoardMetaChip(text) {
  const chip = document.createElement('span');
  chip.className = 'board-meta__chip';
  chip.textContent = text;
  return chip;
}

const METRIC_ICON_BASE = 'assets/wom/metrics';
const METRIC_ICON_SMALL_BASE = 'assets/wom/metrics_small';
const BOSS_BACKGROUND_BASE = 'assets/wom/backgrounds';
const UNAVAILABLE_BOSS_BACKGROUNDS = new Set(['mimic']);
const WIKI_IMAGE_BASE = 'https://oldschool.runescape.wiki/images';
const BOARD_TILE_ITEM_REFS = normalizeBoardItemRefs({
  'any-gwd-hilt': [
    'Armadyl hilt',
    'Bandos hilt',
    'Saradomin hilt',
    'Zamorak hilt',
    'Ancient hilt',
  ],
  'dt2-vestige-progress': [
    'Ultor vestige',
    'Bellator vestige',
    'Venator vestige',
    'Magus vestige',
    { match: 'Gold ring', display: 'Gold ring', image: 'Gold ring', page: 'Gold ring' },
    { match: 'Gold rings', display: 'Gold ring', image: 'Gold ring', page: 'Gold ring' },
  ],
  'gotr-needle-or-lantern': [
    'Abyssal needle',
    'Abyssal lantern',
    { match: 'Lantern', display: 'Abyssal lantern', image: 'Abyssal lantern', page: 'Abyssal lantern' },
    'Colossal pouch',
  ],
  'double-synapse-or-claw': [
    'Tormented synapse',
    { match: 'Tormented synapses', display: 'Tormented synapse', image: 'Tormented synapse', page: 'Tormented synapse' },
    { match: 'Synapse', display: 'Tormented synapse', image: 'Tormented synapse', page: 'Tormented synapse' },
    { match: 'Synapses', display: 'Tormented synapse', image: 'Tormented synapse', page: 'Tormented synapse' },
    'Burning claw',
    'Burning claws',
    'Emberlight',
    'Purging staff',
    'Scorching bow',
  ],
  'huey-wand-or-tome': [
    'Dragon hunter wand',
    'Tome of earth',
    { match: 'Earth rune', display: 'Earth rune', image: 'Earth rune', page: 'Earth rune' },
    { match: 'Earth runes', display: 'Earth rune', image: 'Earth rune', page: 'Earth rune' },
  ],
  'dragon-warhammer': ['Dragon warhammer'],
  'tempoross-unique-no-barrel-box': [
    'Tome of water',
    'Big harpoonfish',
    'Dragon harpoon',
    'Tiny tempor',
    'Fish barrel',
    'Tackle box',
    { match: 'Barrel', display: 'Fish barrel', image: 'Fish barrel', page: 'Fish barrel' },
    { match: 'Box', display: 'Tackle box', image: 'Tackle box', page: 'Tackle box' },
  ],
  'doom-any-unique': [
    'Mokhaiotl cloth',
    'Eye of ayak (uncharged)',
    'Avernic treads',
    'Dom',
  ],
  'three-unsired': [
    'Unsired',
    { match: 'Unsireds', display: 'Unsired', image: 'Unsired', page: 'Unsired' },
    'Abyssal orphan',
  ],
  'twinflame-staff-from-scratch': [
    'Twinflame staff',
    'Fire element staff crown',
    'Ice element staff crown',
  ],
  'toa-any-purple': [
    "Osmumten's fang",
    { match: "Tumeken's shadow", display: "Tumeken's Shadow", image: "Tumeken's shadow", page: "Tumeken's shadow" },
    { match: "Tumeken's shadow (uncharged)", display: "Tumeken's Shadow", image: "Tumeken's shadow", page: "Tumeken's shadow" },
    "Elidinis' ward",
    'Lightbearer',
    { match: 'Masori armour', display: 'Masori armour', image: 'Masori body', page: 'Masori armour' },
    { match: 'Masori armour pieces', display: 'Masori armour', image: 'Masori body', page: 'Masori armour' },
    'Masori mask',
    'Masori body',
    'Masori chaps',
    'Thread of elidinis',
  ],
  'enhanced-crystal-weapon-seed': [
    'Enhanced crystal weapon seed',
    { match: 'Bow of Faerdhinen', display: 'Bow of Faerdhinen', image: 'Bow of faerdhinen', page: 'Bow of Faerdhinen' },
    { match: 'Blade of Saeldor', display: 'Blade of Saeldor', image: 'Blade of saeldor', page: 'Blade of Saeldor' },
  ],
  'all-three-dk-rings': [
    'Berserker ring',
    'Seers ring',
    'Archers ring',
  ],
  'vorkath-any-unique': [
    'Dragonbone necklace',
    'Jar of decay',
    'Vorki',
    'Draconic visage',
    'Skeletal visage',
    { match: 'Vorkath head', display: "Vorkath's head", image: 'Vorkath\'s head', page: "Vorkath's head" },
    { match: "Vorkath's head", display: "Vorkath's head", image: 'Vorkath\'s head', page: "Vorkath's head" },
  ],
  'zulrah-any-unique': [
    'Tanzanite fang',
    'Magic fang',
    'Serpentine visage',
    'Tanzanite mutagen',
    'Magma mutagen',
    'Jar of swamp',
    'Pet snakeling',
  ],
  'cox-any-purple': [
    'Dexterous prayer scroll',
    'Arcane prayer scroll',
    'Twisted buckler',
    'Dragon hunter crossbow',
    "Dinh's bulwark",
    'Ancestral hat',
    'Ancestral robe top',
    'Ancestral robe bottom',
    'Kodai insignia',
    'Elder maul',
    'Twisted bow',
  ],
  'wintertodt-tome-phoenix-or-axe': [
    'Tome of fire',
    'Phoenix',
    'Dragon axe',
    'Warm gloves',
    { match: 'Tome', display: 'Tome of fire', image: 'Tome of fire', page: 'Tome of fire' },
    { match: 'Axe', display: 'Dragon axe', image: 'Dragon axe', page: 'Dragon axe' },
    { match: 'Torch', display: 'Bruma torch', image: 'Bruma torch', page: 'Bruma torch' },
    { match: 'Burnt page', display: 'Burnt page', image: 'Burnt page', page: 'Burnt page' },
    { match: 'Burnt pages', display: 'Burnt page', image: 'Burnt page', page: 'Burnt page' },
  ],
  'three-voidwaker-pieces': [
    'Voidwaker blade',
    'Voidwaker hilt',
    'Voidwaker gem',
  ],
  'medium-clue-boot-unique': [
    'Ranger boots',
    'Wizard boots',
    'Climbing boots (g)',
    'Holy sandals',
    'Spiked manacles',
  ],
  'two-zenyte-shards': [
    'Zenyte shard',
    { match: 'Zenyte shards', display: 'Zenyte shard', image: 'Zenyte shard', page: 'Zenyte shard' },
  ],
  'kq-head': [
    'Kq head',
    'Tattered kq head',
  ],
  'yama-oathplate-piece': [
    'Oathplate helm',
    'Oathplate chest',
    'Oathplate legs',
    'Forgotten lockbox',
    {
      match: 'Oathplate shards',
      display: 'Oathplate shards',
      image: 'Oathplate shards_20',
      page: 'Oathplate shards',
      imageUrl: 'https://oldschool.runescape.wiki/images/Oathplate_shards_20.png',
    },
  ],
});
const BOARD_TILE_ENCOUNTER_REFS = normalizeBoardItemRefs({
  'any-gwd-hilt': [
    { match: 'God Wars Dungeon boss', display: 'God Wars Dungeon', image: 'God Wars Dungeon', page: 'God Wars Dungeon', metricKey: 'general_graardor' },
    { match: 'God Wars Dungeon bosses', display: 'God Wars Dungeon', image: 'God Wars Dungeon', page: 'God Wars Dungeon', metricKey: 'general_graardor' },
    { match: 'God Wars Dungeon', display: 'God Wars Dungeon', image: 'God Wars Dungeon', page: 'God Wars Dungeon', metricKey: 'general_graardor' },
    { match: 'Nex', display: 'Nex', image: 'Nex', page: 'Nex', metricKey: 'nex' },
  ],
  'dt2-vestige-progress': [
    { match: 'DT2 boss', display: 'Desert Treasure II bosses', image: 'Vardorvis', page: 'Desert Treasure II', metricKey: 'vardorvis' },
    { match: 'DT2 bosses', display: 'Desert Treasure II bosses', image: 'Vardorvis', page: 'Desert Treasure II', metricKey: 'vardorvis' },
    { match: 'Vardorvis', display: 'Vardorvis', image: 'Vardorvis', page: 'Vardorvis', metricKey: 'vardorvis' },
    { match: 'The Whisperer', display: 'The Whisperer', image: 'The Whisperer', page: 'The Whisperer', metricKey: 'the_whisperer' },
    { match: 'The Leviathan', display: 'The Leviathan', image: 'The Leviathan', page: 'The Leviathan', metricKey: 'the_leviathan' },
    { match: 'Duke Sucellus', display: 'Duke Sucellus', image: 'Duke Sucellus', page: 'Duke Sucellus', metricKey: 'duke_sucellus' },
  ],
  'gotr-needle-or-lantern': [
    { match: 'Guardians of the Rift', display: 'Guardians of the Rift', image: 'Guardians of the Rift', page: 'Guardians of the Rift', metricKey: 'runecrafting' },
    { match: 'Rewards Guardian', display: 'Rewards Guardian', image: 'Rewards Guardian', page: 'Rewards Guardian', metricKey: 'runecrafting' },
  ],
  'double-synapse-or-claw': [
    { match: 'Tormented Demon', display: 'Tormented Demon', image: 'Tormented Demon', page: 'Tormented Demon', metricKey: 'combat' },
    { match: 'Tormented Demons', display: 'Tormented Demon', image: 'Tormented Demon', page: 'Tormented Demon', metricKey: 'combat' },
  ],
  'huey-wand-or-tome': [
    { match: 'Hueycoatl', display: 'The Hueycoatl', image: 'The Hueycoatl', page: 'The Hueycoatl', metricKey: 'the_hueycoatl' },
    { match: 'The Hueycoatl', display: 'The Hueycoatl', image: 'The Hueycoatl', page: 'The Hueycoatl', metricKey: 'the_hueycoatl' },
  ],
  'dragon-warhammer': [
    { match: 'Lizardman shaman', display: 'Lizardman shaman', image: 'Lizardman shaman', page: 'Lizardman shaman', metricKey: 'combat' },
    { match: 'Lizardman shamans', display: 'Lizardman shaman', image: 'Lizardman shaman', page: 'Lizardman shaman', metricKey: 'combat' },
  ],
  'tempoross-unique-no-barrel-box': [
    { match: 'Tempoross', display: 'Tempoross', image: 'Tempoross', page: 'Tempoross', metricKey: 'fishing' },
  ],
  'doom-any-unique': [
    { match: 'Doom of Mokhaiotl', display: 'Doom of Mokhaiotl', image: 'Doom of Mokhaiotl', page: 'Doom of Mokhaiotl', metricKey: 'araxxor' },
  ],
  'three-unsired': [
    { match: 'Abyssal Sire', display: 'Abyssal Sire', image: 'Abyssal Sire', page: 'Abyssal Sire', metricKey: 'abyssal_sire' },
  ],
  'full-barrows-set': [
    { match: 'Barrows', display: 'Barrows', image: 'Barrows', page: 'Barrows', metricKey: 'barrows_chests' },
    { match: 'Ahrim', display: "Ahrim's equipment", image: "Ahrim's hood", page: "Ahrim the Blighted's equipment" },
    { match: 'Dharok', display: "Dharok's equipment", image: "Dharok's helm", page: "Dharok the Wretched's equipment" },
    { match: 'Guthan', display: "Guthan's equipment", image: "Guthan's helm", page: "Guthan the Infested's equipment" },
    { match: 'Karil', display: "Karil's equipment", image: "Karil's coif", page: "Karil the Tainted's equipment" },
    { match: 'Torag', display: "Torag's equipment", image: "Torag's helm", page: "Torag the Corrupted's equipment" },
    { match: 'Verac', display: "Verac's equipment", image: "Verac's helm", page: "Verac the Defiled's equipment" },
  ],
  'twinflame-staff-from-scratch': [
    { match: 'Royal Titans', display: 'Royal Titans', image: 'Royal Titans', page: 'Royal Titans', metricKey: 'the_royal_titans' },
  ],
  'toa-any-purple': [
    { match: 'ToA', display: 'Tombs of Amascut', image: 'Tombs of Amascut', page: 'Tombs of Amascut', metricKey: 'tombs_of_amascut' },
    { match: 'Tombs of Amascut', display: 'Tombs of Amascut', image: 'Tombs of Amascut', page: 'Tombs of Amascut', metricKey: 'tombs_of_amascut' },
  ],
  'enhanced-crystal-weapon-seed': [
    { match: 'The Gauntlet', display: 'The Gauntlet', image: 'The Gauntlet', page: 'The Gauntlet', metricKey: 'the_gauntlet' },
    { match: 'Corrupted Gauntlet', display: 'The Corrupted Gauntlet', image: 'The Corrupted Gauntlet', page: 'The Corrupted Gauntlet', metricKey: 'the_corrupted_gauntlet' },
  ],
  'all-three-dk-rings': [
    { match: 'Dagannoth Kings', display: 'Dagannoth Kings', image: 'Dagannoth Kings', page: 'Dagannoth Kings', metricKey: 'dagannoth_rex' },
    { match: 'Dagannoth Rex', display: 'Dagannoth Rex', image: 'Dagannoth Rex', page: 'Dagannoth Rex', metricKey: 'dagannoth_rex' },
    { match: 'Dagannoth Prime', display: 'Dagannoth Prime', image: 'Dagannoth Prime', page: 'Dagannoth Prime', metricKey: 'dagannoth_prime' },
    { match: 'Dagannoth Supreme', display: 'Dagannoth Supreme', image: 'Dagannoth Supreme', page: 'Dagannoth Supreme', metricKey: 'dagannoth_supreme' },
    { match: 'Rex', display: 'Dagannoth Rex', image: 'Dagannoth Rex', page: 'Dagannoth Rex', metricKey: 'dagannoth_rex' },
    { match: 'Prime', display: 'Dagannoth Prime', image: 'Dagannoth Prime', page: 'Dagannoth Prime', metricKey: 'dagannoth_prime' },
    { match: 'Supreme', display: 'Dagannoth Supreme', image: 'Dagannoth Supreme', page: 'Dagannoth Supreme', metricKey: 'dagannoth_supreme' },
  ],
  'vorkath-any-unique': [
    { match: 'Vorkath', display: 'Vorkath', image: 'Vorkath', page: 'Vorkath', metricKey: 'vorkath' },
  ],
  'zulrah-any-unique': [
    { match: 'Zulrah', display: 'Zulrah', image: 'Zulrah', page: 'Zulrah', metricKey: 'zulrah' },
  ],
  'cox-any-purple': [
    { match: 'Chambers of Xeric', display: 'Chambers of Xeric', image: 'Chambers of Xeric', page: 'Chambers of Xeric', metricKey: 'chambers_of_xeric' },
    { match: 'Challenge Mode', display: 'Chambers of Xeric: Challenge Mode', image: 'Chambers of Xeric: Challenge Mode', page: 'Chambers of Xeric: Challenge Mode', metricKey: 'chambers_of_xeric_challenge_mode' },
  ],
  'wintertodt-tome-phoenix-or-axe': [
    { match: 'Wintertodt', display: 'Wintertodt', image: 'Wintertodt', page: 'Wintertodt', metricKey: 'firemaking' },
  ],
  'two-zenyte-shards': [
    { match: 'demonic gorilla', display: 'Demonic gorilla', image: 'Demonic gorilla', page: 'Demonic gorilla', metricKey: 'combat' },
    { match: 'demonic gorillas', display: 'Demonic gorilla', image: 'Demonic gorilla', page: 'Demonic gorilla', metricKey: 'combat' },
    { match: 'tortured gorilla', display: 'Tortured gorilla', image: 'Tortured gorilla', page: 'Tortured gorilla', metricKey: 'combat' },
    { match: 'tortured gorillas', display: 'Tortured gorilla', image: 'Tortured gorilla', page: 'Tortured gorilla', metricKey: 'combat' },
  ],
  'kq-head': [
    { match: 'Kalphite Queen', display: 'Kalphite Queen', image: 'Kalphite Queen', page: 'Kalphite Queen', metricKey: 'kalphite_queen' },
  ],
  'yama-oathplate-piece': [
    { match: 'Yama', display: 'Yama', image: 'Yama', page: 'Yama', metricKey: 'yama' },
  ],
});

const BOARD_TILE_TARGET_REFS = normalizeBoardItemRefs({
  'any-gwd-hilt': [
    'Armadyl hilt',
    'Bandos hilt',
    'Saradomin hilt',
    'Zamorak hilt',
    'Ancient hilt',
  ],
  'dt2-vestige-progress': [
    'Ultor vestige',
    'Bellator vestige',
    'Venator vestige',
    'Magus vestige',
    { match: 'Gold ring', display: 'Gold ring', image: 'Gold ring', page: 'Gold ring' },
  ],
  'gotr-needle-or-lantern': [
    'Abyssal needle',
    'Abyssal lantern',
  ],
  'double-synapse-or-claw': [
    'Tormented synapse',
    'Burning claw',
  ],
  'huey-wand-or-tome': [
    'Dragon hunter wand',
    'Tome of earth',
  ],
  'dragon-warhammer': ['Dragon warhammer'],
  'tempoross-unique-no-barrel-box': [
    'Tome of water',
    'Big harpoonfish',
    'Dragon harpoon',
    'Tiny tempor',
  ],
  'doom-any-unique': [
    'Mokhaiotl cloth',
    'Eye of ayak (uncharged)',
    'Avernic treads',
    'Dom',
  ],
  'three-unsired': ['Unsired'],
  'full-barrows-set': [
    { match: 'Ahrim', display: "Ahrim's equipment", image: "Ahrim's hood", page: "Ahrim the Blighted's equipment" },
    { match: 'Dharok', display: "Dharok's equipment", image: "Dharok's helm", page: "Dharok the Wretched's equipment" },
    { match: 'Guthan', display: "Guthan's equipment", image: "Guthan's helm", page: "Guthan the Infested's equipment" },
    { match: 'Karil', display: "Karil's equipment", image: "Karil's coif", page: "Karil the Tainted's equipment" },
    { match: 'Torag', display: "Torag's equipment", image: "Torag's helm", page: "Torag the Corrupted's equipment" },
    { match: 'Verac', display: "Verac's equipment", image: "Verac's helm", page: "Verac the Defiled's equipment" },
  ],
  'twinflame-staff-from-scratch': [
    'Fire element staff crown',
    'Ice element staff crown',
  ],
  'toa-any-purple': [
    "Osmumten's fang",
    { match: "Tumeken's shadow", display: "Tumeken's Shadow", image: "Tumeken's shadow", page: "Tumeken's shadow" },
    "Elidinis' ward",
    'Lightbearer',
    { match: 'Masori armour', display: 'Masori armour', image: 'Masori body', page: 'Masori armour' },
  ],
  'enhanced-crystal-weapon-seed': ['Enhanced crystal weapon seed'],
  'all-three-dk-rings': [
    'Berserker ring',
    'Seers ring',
    'Archers ring',
  ],
  'vorkath-any-unique': [
    'Dragonbone necklace',
    'Jar of decay',
    'Vorki',
    'Draconic visage',
    'Skeletal visage',
  ],
  'zulrah-any-unique': [
    'Tanzanite fang',
    'Magic fang',
    'Serpentine visage',
    'Tanzanite mutagen',
    'Magma mutagen',
    'Jar of swamp',
    'Pet snakeling',
  ],
  'cox-any-purple': [
    'Dexterous prayer scroll',
    'Arcane prayer scroll',
    'Twisted buckler',
    'Dragon hunter crossbow',
    "Dinh's bulwark",
    'Ancestral hat',
    'Ancestral robe top',
    'Ancestral robe bottom',
    'Kodai insignia',
    'Elder maul',
    'Twisted bow',
  ],
  'wintertodt-tome-phoenix-or-axe': [
    'Tome of fire',
    'Phoenix',
    'Dragon axe',
  ],
  'three-voidwaker-pieces': [
    'Voidwaker blade',
    'Voidwaker hilt',
    'Voidwaker gem',
  ],
  'medium-clue-boot-unique': [
    'Ranger boots',
    'Wizard boots',
    'Climbing boots (g)',
    'Holy sandals',
    'Spiked manacles',
  ],
  'two-zenyte-shards': ['Zenyte shard'],
  'kq-head': [
    'Kq head',
  ],
  'yama-oathplate-piece': [
    'Oathplate helm',
    'Oathplate chest',
    'Oathplate legs',
    {
      match: 'Oathplate shards',
      display: 'Oathplate shards',
      image: 'Oathplate shards_20',
      page: 'Oathplate shards',
      imageUrl: 'https://oldschool.runescape.wiki/images/Oathplate_shards_20.png',
    },
  ],
});

function repeatBoardRef(ref, count) {
  return Array.from({ length: count }, () => ref);
}

const BOARD_TILE_GRID_SKILL_REFS = [
  { match: 'Agility', display: 'Agility', image: 'Agility', page: 'Agility', metricKey: 'agility' },
  { match: 'Herblore', display: 'Herblore', image: 'Herblore', page: 'Herblore', metricKey: 'herblore' },
  { match: 'Hunter', display: 'Hunter', image: 'Hunter', page: 'Hunter', metricKey: 'hunter' },
  { match: 'Runecraft', display: 'Runecraft', image: 'Runecraft', page: 'Runecraft', metricKey: 'runecrafting' },
  { match: 'Woodcutting', display: 'Woodcutting', image: 'Woodcutting', page: 'Woodcutting', metricKey: 'woodcutting' },
].map((ref) => normalizeBoardItemRef(ref));

const BOARD_TILE_HERO_REFS = {
  'doom-any-unique': normalizeBoardItemRef({
    match: 'Burrow hole',
    display: 'Burrow hole',
    image: 'Burrow hole',
    page: 'Burrow hole',
    imageUrl: 'https://oldschool.runescape.wiki/images/Burrow_hole_%28unique%29.png',
    tileVisualKind: 'hero-scene',
  }),
  'cox-any-purple': normalizeBoardItemRef({
    match: 'Ancient chest',
    display: 'Ancient chest',
    image: 'Ancient chest',
    page: 'Ancient chest',
    imageUrl: 'https://oldschool.runescape.wiki/images/thumb/Ancient_chest.png/250px-Ancient_chest.png?7727b',
    tileVisualKind: 'hero-scene',
  }),
  'toa-any-purple': normalizeBoardItemRef({
    match: 'Tombs of Amascut chest',
    display: 'Tombs of Amascut chest',
    image: 'Chest (Tombs of Amascut, open)',
    page: 'Chest (Tombs of Amascut)',
    imageUrl: 'https://oldschool.runescape.wiki/images/Chest_%28Tombs_of_Amascut%2C_open%29.png?a0d1e',
    tileVisualKind: 'hero-scene',
  }),
  'zulrah-any-unique': normalizeBoardItemRef({
    match: 'Zulrah',
    display: 'Zulrah',
    image: 'Zulrah',
    page: 'Zulrah',
    imageUrl: 'https://oldschool.runescape.wiki/images/Zulrah_%28serpentine%29.png?29a54',
    tileVisualKind: 'hero-scene',
  }),
  'vorkath-any-unique': normalizeBoardItemRef({
    match: 'Vorkath',
    display: 'Vorkath',
    image: 'Vorkath',
    page: 'Vorkath',
    imageUrl: 'https://oldschool.runescape.wiki/images/Vorkath.png?1ce3f',
    tileVisualKind: 'hero-scene',
  }),
  'yama-oathplate-piece': normalizeBoardItemRef({
    match: 'Oathplate armour',
    display: 'Oathplate armour',
    image: 'Oathplate armour',
    page: 'Oathplate armour',
    imageUrl: 'https://oldschool.runescape.wiki/images/Oathplate_armour_equipped_male.png?0e07a',
    tileVisualKind: 'hero-scene',
  }),
  'kq-head': normalizeBoardItemRef({
    match: 'Kq head',
    display: 'Kq head',
    image: 'Kq head',
    page: 'Kq head',
  }),
  'two-zenyte-shards': normalizeBoardItemRef({
    match: 'Zenyte shard',
    display: 'Zenyte shard',
    image: 'Zenyte shard',
    page: 'Zenyte shard',
  }),
  'medium-clue-boot-unique': normalizeBoardItemRef({
    match: 'Medium clue scroll',
    display: 'Medium clue scroll',
    image: 'Clue scroll (medium)',
    page: 'Clue scroll (medium)',
    imageUrl: 'https://oldschool.runescape.wiki/images/Clue_scroll_%28medium%29_detail.png',
    tileVisualKind: 'hero-scene',
  }),
  'enhanced-crystal-weapon-seed': normalizeBoardItemRef({
    match: 'Gauntlet reward chest',
    display: 'Gauntlet reward chest',
    image: 'Reward Chest (The Gauntlet, open)',
    page: 'Reward Chest (The Gauntlet)',
    imageUrl: 'https://oldschool.runescape.wiki/images/thumb/Reward_Chest_%28The_Gauntlet%2C_open%29.png/1280px-Reward_Chest_%28The_Gauntlet%2C_open%29.png?5b4ec',
    tileVisualKind: 'hero-scene',
  }),
  'enhanced-crystal-weapon-seed-overlay': normalizeBoardItemRef({
    match: 'Enhanced crystal weapon seed',
    display: 'Enhanced crystal weapon seed',
    image: 'Enhanced crystal weapon seed',
    page: 'Enhanced crystal weapon seed',
    imageUrl: 'https://oldschool.runescape.wiki/images/thumb/Enhanced_crystal_weapon_seed_detail.png/130px-Enhanced_crystal_weapon_seed_detail.png?48996',
    tileVisualKind: 'hero-overlay',
  }),
  'free-tile-tbd': normalizeBoardItemRef({
    match: 'Free tile trophy',
    display: 'Free tile trophy',
    image: 'Free tile trophy',
    page: 'Free tile',
    imageUrl: 'https://oldschool.runescape.wiki/images/Frog_%28Kiss_the_frog%2C_crown%29.png?11aaf',
    tileVisualKind: 'hero-scene',
  }),
  'twinflame-staff-from-scratch': normalizeBoardItemRef({
    match: 'Twinflame staff',
    display: 'Twinflame staff',
    image: 'Twinflame staff',
    page: 'Twinflame staff',
    imageUrl: 'https://oldschool.runescape.wiki/images/thumb/Twinflame_staff_detail.png/1280px-Twinflame_staff_detail.png?e1e78',
    tileVisualKind: 'hero-scene',
  }),
  'dragon-warhammer': normalizeBoardItemRef({
    match: 'Dragon warhammer',
    display: 'Dragon warhammer',
    image: 'Dragon warhammer',
    page: 'Dragon warhammer',
    imageUrl: 'https://oldschool.runescape.wiki/images/thumb/Dragon_warhammer_detail.png/1024px-Dragon_warhammer_detail.png?7f65a',
  }),
  'tempoross-unique-no-barrel-box': normalizeBoardItemRef({
    match: 'Tempoross',
    display: 'Tempoross',
    image: 'Tempoross',
    page: 'Tempoross',
    imageUrl: 'https://oldschool.runescape.wiki/images/Tempoross.png',
    tileVisualKind: 'hero-scene',
  }),
  'wintertodt-tome-phoenix-or-axe': normalizeBoardItemRef({
    match: 'Burning brazier',
    display: 'Burning brazier',
    image: 'Burning brazier',
    page: 'Brazier',
    imageUrl: 'https://oldschool.runescape.wiki/images/Burning_brazier_%28Wintertodt%29.png?903ba',
    tileVisualKind: 'hero-scene',
  }),
  'gotr-needle-or-lantern': normalizeBoardItemRef({
    match: 'The Great Guardian',
    display: 'The Great Guardian',
    image: 'The Great Guardian',
    page: 'The Great Guardian',
    imageUrl: 'https://oldschool.runescape.wiki/images/The_Great_Guardian.png',
    tileVisualKind: 'hero-scene',
  }),
  'three-unsired': normalizeBoardItemRef({
    match: 'Abyssal Sire',
    display: 'Abyssal Sire',
    image: 'Abyssal Sire',
    page: 'Abyssal Sire',
    imageUrl: 'https://oldschool.runescape.wiki/images/Abyssal_Sire.png',
    tileVisualKind: 'hero-scene',
  }),
  'huey-wand-or-tome': normalizeBoardItemRef({
    match: 'The Hueycoatl',
    display: 'The Hueycoatl',
    image: 'The Hueycoatl',
    page: 'The Hueycoatl',
    imageUrl: 'https://oldschool.runescape.wiki/images/The_Hueycoatl.png',
    tileVisualKind: 'hero-scene',
  }),
};

const BOARD_TILE_DISPLAY_CONFIG = {
  'any-gwd-hilt': {
    title: 'Obtain Any Godsword Hilt',
    groups: [
      { type: 'icons', refs: BOARD_TILE_TARGET_REFS['any-gwd-hilt'], columns: 3, iconSize: '2.18rem', gap: '6px' },
    ],
  },
  'dt2-vestige-progress': {
    title: 'Progress a Vestige Drop Three Times ',
    groups: [
      { type: 'icons', refs: BOARD_TILE_TARGET_REFS['dt2-vestige-progress'].slice(0, 4), columns: 2, iconSize: '2.08rem', gap: '6px' },
    ],
  },
  'gotr-needle-or-lantern': {
    title: 'Loot Abyssal Needle or Abyssal Lantern',
    groups: [
      { type: 'icons', refs: BOARD_TILE_TARGET_REFS['gotr-needle-or-lantern'].slice(0, 2), columns: 2, iconSize: '3rem' },
    ],
  },
  'double-synapse-or-claw': {
    title: 'Loot Two Tormented Synapses or Burning Claws',
    groups: [
      { type: 'icons', refs: BOARD_TILE_TARGET_REFS['double-synapse-or-claw'], columns: 2, iconSize: '2.95rem' },
    ],
  },
  'huey-wand-or-tome': {
    title: 'Loot Dragon Hunter Wand or Tome of Earth',
    groups: [
      { type: 'icons', refs: BOARD_TILE_TARGET_REFS['huey-wand-or-tome'], columns: 2, iconSize: '3.1rem' },
    ],
  },
  'dragon-warhammer': {
    title: 'Loot Dragon Warhammer',
    groups: [
      { type: 'icons', refs: [BOARD_TILE_HERO_REFS['dragon-warhammer']], columns: 1, iconSize: '3.55rem' },
    ],
  },
  'tempoross-unique-no-barrel-box': {
    title: 'Loot Any Eligible Unique from Tempoross',
    groups: [
      { type: 'icons', refs: [BOARD_TILE_HERO_REFS['tempoross-unique-no-barrel-box']], columns: 1, iconSize: '3.55rem' },
    ],
  },
  'doom-any-unique': {
    title: 'Loot Any Doom of Mokhaiotl Unique',
    groups: [
      { type: 'icons', refs: [BOARD_TILE_HERO_REFS['doom-any-unique']], columns: 1, iconSize: '3.48rem' },
    ],
  },
  'three-unsired': {
    title: 'Loot Three Unsired',
    groups: [
      { type: 'icons', refs: [BOARD_TILE_HERO_REFS['three-unsired']], columns: 1, iconSize: '3.55rem' },
    ],
  },
  'full-barrows-set': {
    title: 'Complete Any Barrows Set',
    groups: [
      { type: 'icons', refs: BOARD_TILE_TARGET_REFS['full-barrows-set'], columns: 3, iconSize: '2.08rem', gap: '7px' },
    ],
  },
  'twinflame-staff-from-scratch': {
    title: 'Loot Both Twinflame Staff Pieces',
    groups: [
      { type: 'icons', refs: [BOARD_TILE_HERO_REFS['twinflame-staff-from-scratch']], columns: 1, iconSize: '3.55rem' },
    ],
  },
  'toa-any-purple': {
    title: 'Loot Any Tombs of Amascut Purple',
    groups: [
      { type: 'icons', refs: [BOARD_TILE_HERO_REFS['toa-any-purple']], columns: 1, iconSize: '3.45rem' },
    ],
  },
  'free-tile-tbd': {
    title: 'Blessed by a frog',
    groups: [
      { type: 'icons', refs: [BOARD_TILE_HERO_REFS['free-tile-tbd']], columns: 1, iconSize: '3.2rem' },
    ],
  },
  'enhanced-crystal-weapon-seed': {
    title: 'Loot Enhanced Crystal Weapon Seed',
    groups: [
      {
        type: 'stack',
        stackKind: 'enhanced-seed',
        refs: [
          BOARD_TILE_HERO_REFS['enhanced-crystal-weapon-seed'],
          BOARD_TILE_HERO_REFS['enhanced-crystal-weapon-seed-overlay'],
        ],
        iconSize: '3.52rem',
      },
    ],
  },
  'all-three-dk-rings': {
    title: 'Loot All Three Dagannoth King Rings',
    groups: [
      { type: 'icons', refs: BOARD_TILE_TARGET_REFS['all-three-dk-rings'], columns: 3, iconSize: '2.54rem' },
    ],
  },
  'vorkath-any-unique': {
    title: 'Loot Any Vorkath Unique',
    groups: [
      { type: 'icons', refs: [BOARD_TILE_HERO_REFS['vorkath-any-unique']], columns: 1, iconSize: '3.55rem' },
    ],
  },
  'zulrah-any-unique': {
    title: 'Loot Any Zulrah Unique',
    groups: [
      { type: 'icons', refs: [BOARD_TILE_HERO_REFS['zulrah-any-unique']], columns: 1, iconSize: '3.55rem' },
    ],
  },
  'cox-any-purple': {
    title: 'Loot Any Chambers of Xeric Purple',
    groups: [
      { type: 'icons', refs: [BOARD_TILE_HERO_REFS['cox-any-purple']], columns: 1, iconSize: '3.42rem' },
    ],
  },
  'wintertodt-tome-phoenix-or-axe': {
    title: 'Loot Any Eligible Unique from Wintertodt',
    groups: [
      { type: 'icons', refs: [BOARD_TILE_HERO_REFS['wintertodt-tome-phoenix-or-axe']], columns: 1, iconSize: '3.55rem' },
    ],
  },
  'three-voidwaker-pieces': {
    title: 'Loot Three Voidwaker Pieces',
    groups: [
      { type: 'icons', refs: BOARD_TILE_TARGET_REFS['three-voidwaker-pieces'], columns: 3, iconSize: '2.4rem' },
    ],
  },
  'medium-clue-boot-unique': {
    title: 'Loot Any Medium Clue Boot Unique',
    groups: [
      { type: 'icons', refs: [BOARD_TILE_HERO_REFS['medium-clue-boot-unique']], columns: 1, iconSize: '3.35rem' },
    ],
  },
  'two-zenyte-shards': {
    title: 'Loot Two Zenyte Shards',
    groups: [
      { type: 'icons', refs: [BOARD_TILE_HERO_REFS['two-zenyte-shards']], columns: 1, iconSize: '3.28rem' },
    ],
  },
  'kq-head': {
    title: 'Loot the Kalphite Queen Head',
    groups: [
      { type: 'icons', refs: [BOARD_TILE_HERO_REFS['kq-head']], columns: 1, iconSize: '3.55rem' },
    ],
  },
  'twelve-million-non-combat-xp': {
    title: 'Gain 12 Million Non-Combat Experience',
    groups: [
      { type: 'callout', text: '12 MILLION\nXP', className: 'board-tile__callout--xp' },
    ],
  },
  'yama-oathplate-piece': {
    title: 'Loot Any Oathplate Piece',
    groups: [
      { type: 'icons', refs: BOARD_TILE_TARGET_REFS['yama-oathplate-piece'].slice(0, 3), columns: 3, iconSize: '2.7rem' },
    ],
  },
};

const BOARD_TILE_RULE_NOTES = {
  'any-gwd-hilt': [
    'Only one qualifying hilt is needed.',
  ],
  'dt2-vestige-progress': [
    'The tile needs three total vestige-table rolls.',
    'Each qualifying vestige or qualifying gold ring counts as one roll.',
    'Any mix of vestiges and gold rings counts toward the three required rolls.',
    'Those rolls may be split across teammates and different DT2 bosses.',
  ],
  'gotr-needle-or-lantern': [
    'The qualifying item must be gained from Rewards Guardian searches during the event window.',
    'Abyssal pearl exchanges do not count for this tile.',
  ],
  'double-synapse-or-claw': [
    'Any mix counts: 2 synapses, 2 claws, or 1 of each.',
    'The two qualifying drops may be split across teammates unless rules later restrict this.',
  ],
  'dragon-warhammer': [
    'Pre-owned dragon warhammers do not count.',
  ],
  'tempoross-unique-no-barrel-box': [
    'Fish barrel and tackle box do not count.',
    'Pre-owned items do not count.',
  ],
  'doom-any-unique': [
    'Mokhaiotl cloth requires delve 2+, Eye of ayak delve 3+, Avernic treads delve 4+, and Dom delve 6+.',
    'A unique seen in the burrow warning but lost by dying deeper does not count.',
    'Pre-owned items do not count.',
  ],
  'three-unsired': [
    'Three total unsired drops are required.',
    'The three drops may be split across teammates unless rules later restrict this.',
    'Redeeming unsireds later is allowed; the tile tracks drops, not rewards.',
  ],
  'full-barrows-set': [
    'A full set needs helm or hood, body, legs or skirt, and weapon from the same brother.',
    'Pieces may be split across teammates.',
    'Pre-owned items do not count.',
  ],
  'twinflame-staff-from-scratch': [
    'Both crowns must be fresh event-window drops.',
    'The two crowns may be split across teammates.',
    'Only the two crowns matter for this tile; assembling the staff is not required.',
    'Pre-owned crowns do not count.',
  ],
  'toa-any-purple': [
    'Jewels, thread of elidinis, pet, kits, and other non-purple rewards do not count.',
  ],
  'free-tile-tbd': [
    'This tile is automatically unlocked for every team.',
    'No gameplay action, proof, or verification is required.',
  ],
  'enhanced-crystal-weapon-seed': [
    'Drops from either the Gauntlet or Corrupted Gauntlet count.',
    'Reverted or pre-owned seeds do not count.',
  ],
  'all-three-dk-rings': [
    'The full trio is required: Berserker, Seers, and Archers rings.',
    'The rings may be split across teammates unless rules later restrict this.',
    'Pre-owned rings do not count.',
  ],
  'vorkath-any-unique': [
    'Vorkath\'s head does not count.',
    'Pre-owned items do not count.',
  ],
  'zulrah-any-unique': [
    'Pre-owned items do not count.',
  ],
  'cox-any-purple': [
    'Non-purple raid rewards do not count.',
  ],
  'wintertodt-tome-phoenix-or-axe': [
    'Warm gloves, Bruma torch, burnt pages, and other non-qualifying crate rewards do not count.',
    'Pre-owned Wintertodt uniques do not count.',
  ],
  'three-voidwaker-pieces': [
    'Any combination counts, including duplicates.',
    'The three pieces may be split across teammates.',
    'Pre-owned pieces do not count.',
  ],
  'medium-clue-boot-unique': [
    'Pre-owned items do not count.',
  ],
  'two-zenyte-shards': [
    'Any mix of demonic gorilla and tortured gorilla drops counts.',
    'The two shards may be split across teammates.',
    'Pre-owned zenyte shards do not count.',
  ],
  'kq-head': [
    'Tattered kq head does not count.',
  ],
  'twelve-million-non-combat-xp': [
    'Attack, Strength, Defence, Hitpoints, Ranged, Prayer, and Magic do not count.',
    'Sailing counts toward the tracker.',
    'The 12,000,000 XP total may be split across any number of team members.',
  ],
  'yama-oathplate-piece': [
    'Direct Yama drops and forgotten lockbox outcomes sourced from Yama both count.',
    'A collective 450 Oathplate shards sourced from Yama also counts.',
    'If claiming with shards, provide proof that the 450 shards were earned during the event and were not pre-owned.',
    'Pre-owned Oathplate pieces do not count.',
  ],
};

const BOARD_TILE_TARGET_LABELS = {
  'any-gwd-hilt': 'Eligible Hilts',
  'dt2-vestige-progress': 'Eligible Drops',
  'gotr-needle-or-lantern': 'Eligible Rewards',
  'double-synapse-or-claw': 'Eligible Drops',
  'huey-wand-or-tome': 'Eligible Rewards',
  'tempoross-unique-no-barrel-box': 'Eligible Rewards',
  'doom-any-unique': 'Eligible Uniques',
  'full-barrows-set': 'Eligible Sets',
  'toa-any-purple': 'Eligible Purples',
  'all-three-dk-rings': 'Required Rings',
  'vorkath-any-unique': 'Eligible Uniques',
  'zulrah-any-unique': 'Eligible Uniques',
  'cox-any-purple': 'Eligible Purples',
  'wintertodt-tome-phoenix-or-axe': 'Eligible Rewards',
  'three-voidwaker-pieces': 'Eligible Pieces',
  'medium-clue-boot-unique': 'Eligible Boots',
  'yama-oathplate-piece': 'Eligible Rewards',
};

const BOARD_TILE_HIDE_CONTEXT_WITH_TARGETS = new Set([
  'any-gwd-hilt',
  'dt2-vestige-progress',
  'gotr-needle-or-lantern',
  'huey-wand-or-tome',
  'tempoross-unique-no-barrel-box',
  'doom-any-unique',
  'full-barrows-set',
  'toa-any-purple',
  'all-three-dk-rings',
  'vorkath-any-unique',
  'zulrah-any-unique',
  'cox-any-purple',
  'wintertodt-tome-phoenix-or-axe',
  'three-voidwaker-pieces',
  'medium-clue-boot-unique',
  'yama-oathplate-piece',
]);

function getBoardDetailTargetsLabel(tileId) {
  return BOARD_TILE_TARGET_LABELS[tileId] || 'Qualifying Targets';
}

function shouldHideBoardDetailContext(tile, targets) {
  if (!tile?.id) return false;
  if (!Array.isArray(targets) || targets.length === 0) return false;
  return BOARD_TILE_HIDE_CONTEXT_WITH_TARGETS.has(tile.id);
}

function getBoardTileDisplayConfig(tile) {
  return BOARD_TILE_DISPLAY_CONFIG[tile?.id] || null;
}

function getBoardTileDisplayTitle(tile) {
  return getBoardTileDisplayConfig(tile)?.title || tile?.title || 'Untitled tile';
}

function createBoardTileIconTile(ref) {
  const iconTile = document.createElement('span');
  iconTile.className = 'board-tile__icon-tile';
  iconTile.title = ref?.display || '';
  if (ref?.tileVisualKind) {
    iconTile.dataset.visualKind = ref.tileVisualKind;
  }

  const icon = document.createElement('img');
  icon.src = getBoardRefIconUrl(ref);
  icon.alt = ref?.display || '';
  icon.loading = 'lazy';
  icon.decoding = 'async';
  icon.addEventListener('error', () => {
    iconTile.hidden = true;
  }, { once: true });

  iconTile.appendChild(icon);
  return iconTile;
}

function createBoardTileIconGrid(group) {
  const grid = document.createElement('div');
  grid.className = 'board-tile__icon-grid';
  const refs = Array.isArray(group?.refs) ? group.refs : [];
  grid.dataset.count = String(refs.length);
  if (group?.columns) {
    grid.style.setProperty('--board-tile-icon-columns', String(group.columns));
  }
  if (group?.iconSize) {
    grid.style.setProperty('--board-tile-icon-size', group.iconSize);
  }
  if (group?.gap) {
    grid.style.setProperty('--board-tile-icon-gap', group.gap);
  }

  refs.forEach((ref) => {
    grid.appendChild(createBoardTileIconTile(ref));
  });

  return grid;
}

function createBoardTileVisualGroup(group) {
  if (!group || typeof group !== 'object') return null;

  if (group.type === 'callout') {
    const callout = document.createElement('span');
    callout.className = 'board-tile__callout';
    if (group.className) {
      callout.classList.add(group.className);
    }
    callout.textContent = group.text || '';
    return callout;
  }

  if (group.type === 'counter') {
    const counter = document.createElement('span');
    counter.className = 'board-tile__counter';
    counter.textContent = group.text || '';
    return counter;
  }

  if (group.type === 'or') {
    const divider = document.createElement('span');
    divider.className = 'board-tile__or';
    divider.textContent = group.text || 'OR';
    return divider;
  }

  if (group.type === 'icons') {
    const refs = Array.isArray(group.refs) ? group.refs : [];
    if (!refs.length) return null;

    const wrap = document.createElement('div');
    wrap.className = 'board-tile__icon-group';

    if (group.label) {
      const label = document.createElement('span');
      label.className = 'board-tile__group-label';
      label.textContent = group.label;
      wrap.appendChild(label);
    }

    wrap.appendChild(createBoardTileIconGrid(group));
    return wrap;
  }

  if (group.type === 'stack') {
    const refs = Array.isArray(group.refs) ? group.refs : [];
    if (!refs.length) return null;

    const stack = document.createElement('div');
    stack.className = 'board-tile__stack';
    if (group.stackKind) {
      stack.dataset.stackKind = group.stackKind;
    }

    refs.forEach((ref, index) => {
      const layer = createBoardTileIconTile(ref);
      layer.classList.add('board-tile__stack-layer');
      layer.dataset.layer = String(index + 1);
      if (group?.iconSize) {
        layer.style.setProperty('--board-tile-icon-size', group.iconSize);
      }
      stack.appendChild(layer);
    });

    return stack;
  }

  return null;
}

function renderBoardTileVisual(tileNode, tile) {
  const visual = qs(tileNode, '.board-tile__visual');
  visual.innerHTML = '';

  const config = getBoardTileDisplayConfig(tile);
  const groups = Array.isArray(config?.groups) ? config.groups : [];

  if (groups.length) {
    groups.forEach((group) => {
      const node = createBoardTileVisualGroup(group);
      if (node) visual.appendChild(node);
    });
    return;
  }

  const fallbackIconUrl = getBoardTileIconUrl(tile);
  if (fallbackIconUrl) {
    const fallbackRef = normalizeBoardItemRef({
      match: tile.title || 'Tile icon',
      display: tile.title || 'Tile icon',
      image: tile.title || 'Tile icon',
      page: tile.title || 'Tile icon',
      metricKey: tile.icon?.key || '',
    });
    visual.appendChild(createBoardTileIconGrid({ refs: [fallbackRef], columns: 1, iconSize: '3.15rem' }));
    return;
  }

  const callout = document.createElement('span');
  callout.className = 'board-tile__counter';
  callout.textContent = 'Tile';
  visual.appendChild(callout);
}

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

function getThemeForBoardTeamName(teamName) {
  const trackedTeams = boardState.teamsData?.teams || [];
  let index = trackedTeams.findIndex((team) => team.name === teamName);
  if (index !== -1) {
    return getThemeForTeam(trackedTeams[index], index);
  }

  const boardTeams = getTrackedBoardTeams();
  index = boardTeams.findIndex((team) => team === teamName);
  if (index !== -1) {
    return getThemeForTeam({ name: teamName }, index);
  }

  return getThemeForTeam({ name: teamName }, 0);
}

function getBoardTeamDisplayName(teamName) {
  if (!teamName) return 'Unknown team';
  if (!TEAM_NAME_TO_GOD_KEY[teamName]) return teamName;
  return getThemeForBoardTeamName(teamName).title;
}

function getBoardTileTracking(tileId) {
  return boardState.teamsData?.board_tracking?.tiles?.[tileId] || null;
}

function clearBoardDetailTracker() {
  if (!boardDetail.trackerWrap || !boardDetail.tracker) return;
  boardDetail.trackerWrap.hidden = true;
  boardDetail.tracker.innerHTML = '';
  if (boardDetail.trackerLabel) boardDetail.trackerLabel.textContent = 'Live Tracker';
}

function createTrackerText(className, text) {
  const node = document.createElement('p');
  node.className = className;
  node.textContent = text;
  return node;
}

function renderNonCombatXpTracker(tile, tracking) {
  if (!boardDetail.trackerWrap || !boardDetail.tracker || !tracking) return;

  boardDetail.tracker.innerHTML = '';
  if (boardDetail.trackerLabel) boardDetail.trackerLabel.textContent = 'WOM Progress Tracker';
  boardDetail.trackerWrap.hidden = false;

  const includedSkills = Array.isArray(tracking.included_skills)
    ? tracking.included_skills.map((skill) => toDisplayLabel(skill)).join(', ')
    : '';
  const intro = `Tracks ${formatXp(tracking.target_xp || 0)} total XP gained since event start across ${includedSkills || 'qualifying non-combat skills'}.`;
  boardDetail.tracker.appendChild(createTrackerText('board-detail__tracker-intro', intro));

  const teams = Array.isArray(tracking.teams) ? tracking.teams : [];
  if (!teams.length) {
    boardDetail.tracker.appendChild(createTrackerText('board-detail__tracker-empty', 'No WOM tracker data is available for this tile yet.'));
    return;
  }

  const teamsWrap = document.createElement('div');
  teamsWrap.className = 'board-detail__tracker-teams';

  teams.forEach((teamEntry) => {
    const teamNode = document.createElement('article');
    teamNode.className = 'board-detail__tracker-team';

    const head = document.createElement('div');
    head.className = 'board-detail__tracker-team-head';

    const teamName = document.createElement('strong');
    teamName.className = 'board-detail__tracker-team-name';
    teamName.textContent = getBoardTeamDisplayName(teamEntry.team);

    const total = document.createElement('span');
    total.className = 'board-detail__tracker-team-total';
    total.textContent = `${formatNumber(teamEntry.total_xp || 0)} / ${formatNumber(teamEntry.target_xp || tracking.target_xp || 0)} XP`;

    head.append(teamName, total);

    const progress = document.createElement('div');
    progress.className = 'board-detail__tracker-progress';
    progress.setAttribute('role', 'progressbar');
    progress.setAttribute('aria-label', `${getBoardTeamDisplayName(teamEntry.team)} non-combat XP progress`);
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', String(teamEntry.target_xp || tracking.target_xp || 0));
    progress.setAttribute('aria-valuenow', String(teamEntry.total_xp || 0));

    const progressBar = document.createElement('div');
    progressBar.className = 'board-detail__tracker-progress-bar';
    const ratio = Math.max(0, Math.min(1, (teamEntry.total_xp || 0) / Math.max(1, teamEntry.target_xp || tracking.target_xp || 0)));
    progressBar.style.width = formatPercent(ratio);
    progress.appendChild(progressBar);

    const meta = document.createElement('div');
    meta.className = 'board-detail__tracker-team-meta';
    const progressLabel = document.createElement('span');
    progressLabel.textContent = teamEntry.is_complete
      ? 'Tile target reached'
      : `${formatNumber(teamEntry.remaining_xp || 0)} XP remaining`;
    const shareLabel = document.createElement('span');
    shareLabel.textContent = formatPercent(ratio);
    meta.append(progressLabel, shareLabel);

    const playersWrap = document.createElement('div');
    playersWrap.className = 'board-detail__tracker-players';
    const players = Array.isArray(teamEntry.players) ? teamEntry.players.filter((player) => (player.total_xp || 0) > 0) : [];
    players.forEach((player) => {
      const playerRow = document.createElement('div');
      playerRow.className = 'board-detail__tracker-player';

      const playerName = document.createElement('span');
      playerName.className = 'board-detail__tracker-player-name';
      playerName.textContent = player.username;

      const playerTotal = document.createElement('span');
      playerTotal.className = 'board-detail__tracker-player-total';
      playerTotal.textContent = formatNumber(player.total_xp || 0);

      playerRow.append(playerName, playerTotal);
      playersWrap.appendChild(playerRow);
    });

    if (!playersWrap.childElementCount) {
      playersWrap.appendChild(createTrackerText('board-detail__tracker-empty', 'No qualifying XP logged yet.'));
    }

    teamNode.append(head, progress, meta, playersWrap);
    teamsWrap.appendChild(teamNode);
  });

  boardDetail.tracker.appendChild(teamsWrap);
}

function renderBoardDetailTracker(tile) {
  const tracking = getBoardTileTracking(tile?.id);
  if (tile?.id === 'twelve-million-non-combat-xp' && tracking) {
    renderNonCombatXpTracker(tile, tracking);
    return;
  }

  clearBoardDetailTracker();
}

function renderBoardCompletionNotch(container, completionState, options = {}) {
  if (!container) return;

  const { decorative = false } = options;
  container.innerHTML = '';
  const trackedTeams = getTrackedBoardTeams();

  trackedTeams.forEach((teamName) => {
    const theme = getThemeForBoardTeamName(teamName);
    const completion = completionState.completions.find((entry) => entry.team === teamName && entry.isConfirmed) || null;
    const teamBadge = document.createElement('span');
    teamBadge.className = 'board-completion-notch__badge';
    teamBadge.dataset.completed = completion ? 'true' : 'false';
    teamBadge.title = completion
      ? `${theme.title}: completed at ${formatUtcDateTime(completion.completedAt)}`
      : `${theme.title}: not completed`;
    teamBadge.setAttribute('aria-label', completion
      ? `${theme.title} completed this tile`
      : `${theme.title} has not completed this tile`);
    if (decorative) teamBadge.setAttribute('aria-hidden', 'true');

    const icon = document.createElement('img');
    icon.className = 'board-completion-notch__image';
    icon.src = theme.crest;
    icon.alt = decorative ? '' : `${theme.title} signet`;

    teamBadge.appendChild(icon);
    container.appendChild(teamBadge);
  });
}

function prefersHoverBoardPopover() {
  return Boolean(boardInteractionQuery.matches);
}

function clearBoardPopoverInlinePosition() {
  if (!boardPopover.dialog) return;
  boardPopover.dialog.style.removeProperty('top');
  boardPopover.dialog.style.removeProperty('left');
  boardPopover.dialog.style.removeProperty('right');
  boardPopover.dialog.style.removeProperty('bottom');
}

function isBoardPopoverOpen() {
  return Boolean(boardPopover.root?.classList.contains('is-open'));
}

function moveBoardDetailToPopover() {
  if (!boardPopover.dialog || !boardDetail.root) return;
  if (boardDetail.root.parentElement !== boardPopover.dialog) {
    boardPopover.dialog.appendChild(boardDetail.root);
  }
}

function getVisibleBoardDetailFolds() {
  return [];
}

function applyBoardDetailFoldDefaults() {
  return undefined;
}

function openBoardPopover(options = {}) {
  if (!boardPopover.root) return;

  const mode = 'modal';
  boardPopover.root.hidden = false;
  boardPopover.root.classList.add('is-open');
  boardPopover.root.dataset.mode = mode;
  boardPopover.backdrop.hidden = false;
  boardPopover.close.hidden = false;
  boardPopover.dialog.setAttribute('aria-modal', 'true');
  document.body.classList.add('board-popover-open');

  clearBoardPopoverInlinePosition();

  if (options.focus !== false) {
    requestAnimationFrame(() => {
      applyBoardDetailFoldDefaults();
      (boardPopover.close || boardPopover.dialog)?.focus();
    });
  } else {
    requestAnimationFrame(() => {
      applyBoardDetailFoldDefaults();
    });
  }
}

function closeBoardPopover(options = {}) {
  if (!boardPopover.root) return;

  const wasOpen = isBoardPopoverOpen();
  boardPopover.root.classList.remove('is-open');
  boardPopover.root.hidden = true;
  boardPopover.root.dataset.mode = 'modal';
  boardPopover.backdrop.hidden = true;
  boardPopover.close.hidden = true;
  boardPopover.dialog.setAttribute('aria-modal', 'false');
  clearBoardPopoverInlinePosition();
  boardState.popoverAnchorTileId = null;
  document.body.classList.remove('board-popover-open');

  if (wasOpen && options.restoreFocus !== false) {
    boardState.tileNodesById.get(boardState.selectedTileId)?.focus();
  }
}

function setupBoardPopover() {
  if (!boardPopover.root) return;
  if (boardPopover.root.parentElement !== document.body) {
    document.body.appendChild(boardPopover.root);
  }
  boardPopover.root.classList.remove('is-open');
  boardPopover.root.hidden = true;
  boardPopover.root.dataset.mode = 'modal';
  boardPopover.backdrop.hidden = true;
  boardPopover.close.hidden = true;
  boardPopover.dialog.setAttribute('aria-modal', 'false');
  document.body.classList.remove('board-popover-open');

  boardPopover.root.addEventListener('click', (event) => {
    if (event.target.closest('#board-popover-close')) {
      event.preventDefault();
      setBoardTileSelection(null, { updateUrl: getTabFromUrl() === 'board' });
      return;
    }

    if (event.target === boardPopover.backdrop) {
      setBoardTileSelection(null, { updateUrl: getTabFromUrl() === 'board' });
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isBoardPopoverOpen()) return;
    event.preventDefault();
    setBoardTileSelection(null, { updateUrl: getTabFromUrl() === 'board' });
  });

  window.addEventListener('resize', () => {
    applyBoardDetailFoldDefaults();
  });
}

function setupBoardItemPreview() {
  if (!boardItemPreview.root) return;

  if (boardItemPreview.root.parentElement !== document.body) {
    document.body.appendChild(boardItemPreview.root);
  }

  boardItemPreview.image?.addEventListener('load', () => {
    updateBoardItemPreviewLayoutFromImage();
    if (!boardState.itemPreviewAnchor || boardItemPreview.root.hidden) return;
    positionBoardItemPreview(boardState.itemPreviewAnchor, boardState.itemPreviewPoint);
  });

  boardItemPreview.root.addEventListener('mouseenter', () => {
    clearBoardItemPreviewHideTimeout();
  });

  boardItemPreview.root.addEventListener('mouseleave', () => {
    scheduleBoardItemPreviewHide();
  });

  window.addEventListener('scroll', () => {
    if (!boardState.itemPreviewAnchor || boardItemPreview.root.hidden) return;
    positionBoardItemPreview(boardState.itemPreviewAnchor, boardState.itemPreviewPoint);
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (!boardState.itemPreviewAnchor || boardItemPreview.root.hidden) return;
    positionBoardItemPreview(boardState.itemPreviewAnchor, boardState.itemPreviewPoint);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideBoardItemPreview();
    }
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('.board-item-ref--link')) return;
    if (event.target.closest('#board-item-preview')) return;
    hideBoardItemPreview();
  });
}

function renderBoardDetailEmpty(message, title = 'Board detail') {
  if (!boardDetail.root) return;

  boardDetail.root.dataset.status = 'open';
  boardDetail.root.style.removeProperty('--board-detail-art');
  boardDetail.icon.hidden = true;
  boardDetail.icon.removeAttribute('src');
  boardDetail.icon.alt = '';
  boardDetail.coordinate.textContent = '';
  boardDetail.title.textContent = title;
  boardDetail.description.textContent = message;
  boardDetail.contextWrap.hidden = false;
  boardDetail.description.hidden = false;
  boardDetail.objective.textContent = 'Select a tile to inspect the challenge definition and completion history.';
  boardDetail.verification.textContent = 'Board tracking data will appear here once the board file loads.';
  renderBoardCompletionNotch(boardDetail.completionNotch, { completions: [] });
  boardDetail.targetsWrap.hidden = true;
  if (boardDetail.targetsLabel) boardDetail.targetsLabel.textContent = 'Qualifying Targets';
  boardDetail.targets.dataset.count = '0';
  boardDetail.targets.innerHTML = '';
  boardDetail.requirementsWrap.hidden = true;
  boardDetail.requirements.innerHTML = '';
  clearBoardDetailTracker();
}

function renderBoardMeta(boardData) {
  boardTitle.textContent = boardData.title || 'Forgeborne Bingo Board';
  boardDescription.textContent = boardData.description || 'Open any tile to see the target, proof requirements, and which teams have already locked it in.';
  boardMeta.innerHTML = '';

  const metaItems = [
    boardData.version ? `Board v${boardData.version}` : 'Board draft',
    boardData.updated_at ? `Updated ${formatUtcDateTime(boardData.updated_at)}` : 'Updated time unknown',
    `${pluralize(getBoardTrackedTeamCount(boardData), 'team')} tracked`,
  ];

  metaItems.forEach((item) => {
    boardMeta.appendChild(createBoardMetaChip(item));
  });
}

function renderBoardSummary(boardData) {
  boardSummary.innerHTML = '';

  const tiles = boardData.tiles || [];
  const completionStates = tiles.map((tile) => getBoardTileCompletionState(tile, boardData));
  const activeTiles = completionStates.filter((state) => state.completedTeams.length > 0).length;
  const fullyClearedTiles = completionStates.filter((state) => state.key === 'cleared').length;
  const verifiedClaims = completionStates.reduce((sum, state) => sum + state.verifiedClaimCount, 0);

  const cards = [
    ['Tiles', String(tiles.length), 'Challenge squares on the current board'],
    ['Claimed Tiles', String(activeTiles), 'Tiles with at least one verified team completion'],
    ['Verified Claims', String(verifiedClaims), 'Total verified completions across the whole board'],
    ['Fully Cleared', String(fullyClearedTiles), fullyClearedTiles > 0 ? `${pluralize(fullyClearedTiles, 'tile')} completed by every tracked team` : 'No tile is fully cleared yet'],
  ];

  cards.forEach(([label, value, caption]) => {
    boardSummary.appendChild(createBoardSummaryCard(label, value, caption));
  });
}

function renderBoardRules(boardData) {
  boardRulesList.innerHTML = '';
  (boardData.rules || []).forEach((rule) => {
    appendListItem(boardRulesList, rule);
  });
}

function makeBoardPlaceholderTile(row, column) {
  const placeholder = document.createElement('div');
  placeholder.className = 'board-tile board-tile--empty';
  placeholder.innerHTML = `
    <div class="board-completion-notch board-tile__completion-notch" aria-hidden="true"></div>
    <span class="board-tile__topline">
      <span class="board-tile__coordinate">${formatBoardCoordinate({ row, column })}</span>
    </span>
    <div class="board-tile__visual">
      <span class="board-tile__callout">Open</span>
    </div>
    <strong class="board-tile__title">Open Slot</strong>
  `;
  return placeholder;
}

function renderBoardTileDetail(tile) {
  const completionState = getBoardTileCompletionState(tile);
  const iconUrl = getBoardTileIconUrl(tile);
  const artUrl = getBoardTileArtUrl(tile);
  const objectiveText = String(tile.objective || '').trim();
  const descriptionText = String(tile.description || '').trim();
  const missionText = objectiveText || descriptionText || 'No challenge description has been defined for this tile yet.';
  const targets = Array.isArray(BOARD_TILE_TARGET_REFS[tile.id]) ? BOARD_TILE_TARGET_REFS[tile.id] : [];
  const hideContext = shouldHideBoardDetailContext(tile, targets);
  const supportingText = !hideContext && descriptionText && descriptionText !== objectiveText
    ? descriptionText
    : '';

  boardDetail.root.dataset.status = completionState.key;
  boardDetail.root.dataset.difficulty = toDataToken(tile.difficulty || 'unknown');

  if (artUrl) {
    boardDetail.root.style.setProperty('--board-detail-art', `url('${artUrl}')`);
  } else {
    boardDetail.root.style.removeProperty('--board-detail-art');
  }

  if (iconUrl) {
    boardDetail.icon.hidden = false;
    boardDetail.icon.src = iconUrl;
    boardDetail.icon.alt = tile.icon?.alt || `${tile.title} icon`;
  } else {
    boardDetail.icon.hidden = true;
    boardDetail.icon.removeAttribute('src');
    boardDetail.icon.alt = '';
  }

  boardDetail.coordinate.textContent = formatBoardCoordinate(tile.position);
  setBoardRichText(boardDetail.title, getBoardTileDisplayTitle(tile), tile);
  renderBoardCompletionNotch(boardDetail.completionNotch, completionState);
  setBoardRichText(boardDetail.objective, missionText, tile);
  setBoardRichText(boardDetail.description, supportingText, tile);
  boardDetail.contextWrap.hidden = !supportingText;
  boardDetail.description.hidden = !supportingText;
  setBoardRichText(boardDetail.verification, tile.verification || 'No verification notes have been added yet.', tile);

  boardDetail.targets.innerHTML = '';
  boardDetail.targetsWrap.hidden = targets.length === 0;
  if (boardDetail.targetsLabel) boardDetail.targetsLabel.textContent = getBoardDetailTargetsLabel(tile.id);
  boardDetail.targets.dataset.count = String(targets.length);
  targets.forEach((target) => {
    boardDetail.targets.appendChild(createBoardDetailTargetCard(target));
  });

  boardDetail.requirements.innerHTML = '';
  const requirements = Array.isArray(BOARD_TILE_RULE_NOTES[tile.id])
    ? BOARD_TILE_RULE_NOTES[tile.id]
    : [];
  boardDetail.requirementsWrap.hidden = requirements.length === 0;
  requirements.forEach((requirement) => {
    appendBoardRichListItem(boardDetail.requirements, requirement, tile);
  });

  renderBoardDetailTracker(tile);

}

function updateUrlForBoardSelection(tileId) {
  const url = new URL(window.location.href);
  if (tileId) {
    url.searchParams.set('tab', 'board');
    url.searchParams.set('tile', tileId);
  } else {
    url.searchParams.delete('tile');
  }
  window.history.replaceState({}, '', url);
}

function setBoardTileSelection(tileId, options = {}) {
  if (tileId == null) {
    boardState.selectedTileId = null;
    boardState.openTileId = null;
    boardState.popoverAnchorTileId = null;

    boardState.tileNodesById.forEach((node) => {
      node.classList.remove('is-selected');
      node.setAttribute('aria-pressed', 'false');
    });

    closeBoardPopover({ restoreFocus: false });

    if (options.updateUrl !== false && getTabFromUrl() === 'board') {
      updateUrlForBoardSelection(null);
    }

    return;
  }

  const nextTileId = boardState.tilesById.has(tileId)
    ? tileId
    : sortBoardTiles(Array.from(boardState.tilesById.values()))[0]?.id;

  if (!nextTileId) {
    renderBoardDetailEmpty('No board tiles are available yet.');
    closeBoardPopover({ restoreFocus: false });
    return;
  }

  boardState.selectedTileId = nextTileId;
  boardState.openTileId = nextTileId;
  boardState.popoverAnchorTileId = nextTileId;

  boardState.tileNodesById.forEach((node, currentTileId) => {
    const isSelected = currentTileId === nextTileId;
    node.classList.toggle('is-selected', isSelected);
    node.setAttribute('aria-pressed', String(isSelected));
  });

  renderBoardTileDetail(boardState.tilesById.get(nextTileId));

  moveBoardDetailToPopover();
  openBoardPopover({
    focus: options.focusPopover,
    tileId: nextTileId,
  });

  if (options.updateUrl !== false) {
    updateUrlForBoardSelection(nextTileId);
  }

  if (options.focusTile) {
    boardState.tileNodesById.get(nextTileId)?.focus();
  }
}

function renderBoard(boardData, teamsData = boardState.teamsData) {
  if (!boardGrid) return;

  boardState.data = boardData;
  if (teamsData) {
    boardState.teamsData = teamsData;
  }

  renderBoardMeta(boardData);
  renderBoardSummary(boardData);
  renderBoardRules(boardData);

  boardGrid.innerHTML = '';
  boardState.tilesById = new Map();
  boardState.tileNodesById = new Map();

  const rows = Math.max(1, Number(boardData.layout?.rows) || 5);
  const columns = Math.max(1, Number(boardData.layout?.columns) || 5);
  boardGrid.dataset.rows = String(rows);
  boardGrid.dataset.columns = String(columns);
  boardGrid.style.setProperty('--board-columns', String(columns));
  boardGrid.style.setProperty('--board-min-width', `${Math.max(columns * 9.5, 44)}rem`);

  const tilesByPosition = new Map();
  sortBoardTiles(boardData.tiles || []).forEach((tile) => {
    if (!tile?.id) return;
    const row = Number(tile.position?.row);
    const column = Number(tile.position?.column);
    if (!row || !column || row > rows || column > columns) return;
    tilesByPosition.set(`${row}:${column}`, tile);
    boardState.tilesById.set(tile.id, tile);
  });

  for (let row = 1; row <= rows; row += 1) {
    const tilesRow = document.createElement('div');
    tilesRow.className = 'board-grid__row';
    tilesRow.dataset.row = String(row);

    for (let column = 1; column <= columns; column += 1) {
      const tile = tilesByPosition.get(`${row}:${column}`);
      if (!tile) {
        tilesRow.appendChild(makeBoardPlaceholderTile(row, column));
        continue;
      }

      const completionState = getBoardTileCompletionState(tile, boardData);
      const tileNode = boardTileTemplate.content.firstElementChild.cloneNode(true);
      tileNode.dataset.tileId = tile.id;
      tileNode.dataset.status = completionState.key;
      tileNode.setAttribute('aria-haspopup', 'dialog');
      tileNode.setAttribute('aria-pressed', 'false');

      const artUrl = getBoardTileArtUrl(tile);
      if (artUrl) {
        tileNode.dataset.hasArt = 'true';
        tileNode.style.setProperty('--board-tile-art', `url('${artUrl}')`);
      } else {
        tileNode.removeAttribute('data-has-art');
        tileNode.style.removeProperty('--board-tile-art');
      }

      qs(tileNode, '.board-tile__coordinate').textContent = formatBoardCoordinate(tile.position);
      renderBoardCompletionNotch(qs(tileNode, '.board-tile__completion-notch'), completionState, { decorative: true });
      renderBoardTileVisual(tileNode, tile);
      setBoardRichText(qs(tileNode, '.board-tile__title'), getBoardTileDisplayTitle(tile), tile, { allowLinks: false, showIcon: false });

      tileNode.addEventListener('focus', () => {
        boardState.selectedTileId = tile.id;
      });

      tileNode.addEventListener('click', () => {
        if (boardState.openTileId === tile.id) {
          setBoardTileSelection(null, { updateUrl: true });
          return;
        }

        setBoardTileSelection(tile.id, {
          focusPopover: true,
          updateUrl: true,
        });
      });

      tilesRow.appendChild(tileNode);
      boardState.tileNodesById.set(tile.id, tileNode);
    }

    boardGrid.appendChild(tilesRow);
  }

  if (!boardState.tilesById.size) {
    const emptyState = document.createElement('div');
    emptyState.className = 'board-empty-state';
    emptyState.textContent = 'No board tiles have been defined yet.';
    boardGrid.appendChild(emptyState);
    renderBoardDetailEmpty('No board tiles have been defined yet.');
    closeBoardPopover({ restoreFocus: false });
    return;
  }

  const shouldRestoreTile = getTabFromUrl() === 'board';
  const nextTileId = shouldRestoreTile
    ? (getBoardTileFromUrl() || boardState.selectedTileId)
    : null;
  setBoardTileSelection(nextTileId, { updateUrl: false, focusPopover: false });
}

function renderBoardError(message) {
  if (!boardGrid) return;
  boardTitle.textContent = 'Forgeborne Bingo Board';
  boardDescription.textContent = 'Board data could not be loaded.';
  boardMeta.innerHTML = '';
  boardMeta.appendChild(createBoardMetaChip('Board unavailable'));
  boardMeta.appendChild(createBoardMetaChip('Check public/data/board.json'));
  boardSummary.innerHTML = '';
  boardRulesList.innerHTML = '';
  boardGrid.innerHTML = '';

  const emptyState = document.createElement('div');
  emptyState.className = 'board-empty-state';
  emptyState.textContent = `Could not load board data: ${message}`;
  boardGrid.appendChild(emptyState);
  renderBoardDetailEmpty(`Could not load board data: ${message}`, 'Board unavailable');
  closeBoardPopover({ restoreFocus: false });
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

function getBoardTileFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('tile') || null;
}

function updateUrlForTab(tabName) {
  const url = new URL(window.location.href);
  url.searchParams.set('tab', tabName);
  if (tabName !== 'board') {
    url.searchParams.delete('tile');
  }
  window.history.replaceState({}, '', url);
}

function setActiveTab(tabName, options = {}) {
  const shouldUpdateUrl = options.updateUrl ?? true;
  const safeTabName = VALID_TABS.has(tabName) ? tabName : 'teams';

  if (safeTabName !== 'board') {
    closeBoardPopover({ restoreFocus: false });
  } else if (boardState.tilesById.size) {
    const tileIdFromUrl = getBoardTileFromUrl();
    if (tileIdFromUrl && boardState.tilesById.has(tileIdFromUrl)) {
      setBoardTileSelection(tileIdFromUrl, { updateUrl: false, focusPopover: false });
    }
  }

  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === safeTabName;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', String(isActive));
    button.tabIndex = isActive ? 0 : -1;
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
    boardState.teamsData = data;
    renderStats(data);
    renderRules(data);
    renderTeams(data);
    if (boardState.data) {
      renderBoard(boardState.data, data);
    }
    renderParticipants(data);
  } catch (error) {
    console.error('loadTeams failed:', error);
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = `Could not load team data: ${error.message}`;
    teamsGrid.appendChild(emptyState);
  }
}

async function loadBoard() {
  try {
    const response = await fetch('data/board.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    renderBoard(data, boardState.teamsData);
  } catch (error) {
    console.error('loadBoard failed:', error);
    renderBoardError(error.message);
  }
}

setupTabs();
setupBoardPopover();
setupBoardItemPreview();
setupInfoChips();
startCountdown();

if (typeof participantMobileLayoutQuery.addEventListener === 'function') {
  participantMobileLayoutQuery.addEventListener('change', syncParticipantResponsiveLayout);
} else if (typeof participantMobileLayoutQuery.addListener === 'function') {
  participantMobileLayoutQuery.addListener(syncParticipantResponsiveLayout);
}

if (typeof boardInteractionQuery.addEventListener === 'function') {
  boardInteractionQuery.addEventListener('change', () => {
    closeBoardPopover({ restoreFocus: false });
    hideBoardItemPreview();
  });
} else if (typeof boardInteractionQuery.addListener === 'function') {
  boardInteractionQuery.addListener(() => {
    closeBoardPopover({ restoreFocus: false });
    hideBoardItemPreview();
  });
}

loadTeams();
loadBoard();
