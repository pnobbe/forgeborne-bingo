const heroMeta = document.getElementById('hero-meta');
const statsGrid = document.getElementById('stats-grid');
const baseRules = document.getElementById('base-rules');
const decayRules = document.getElementById('decay-rules');
const teamsGrid = document.getElementById('teams-grid');
const teamTemplate = document.getElementById('team-template');
const playerTemplate = document.getElementById('player-template');

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
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

function renderMeta(data) {
  const spread = data.summary.weight_max - data.summary.weight_min;
  const metaItems = [
    `Generated ${formatDate(data.generated_at)}`,
    `Source ${data.participants_file}`,
    `Weight spread ${formatNumber(spread)}`,
  ];

  metaItems.forEach((text) => {
    const pill = document.createElement('span');
    pill.textContent = text;
    heroMeta.appendChild(pill);
  });
}

function renderStats(data) {
  const spread = data.summary.weight_max - data.summary.weight_min;
  const stats = [
    ['Teams', data.summary.team_count, 'Balanced groups generated'],
    ['Players', data.summary.participant_count, 'Pulled from the participant list'],
    ['Team Size', data.team_size, 'Maximum players per team'],
    ['Weight Spread', formatNumber(spread), 'Difference between heaviest and lightest team'],
  ];

  stats.forEach(([label, value, caption]) => {
    statsGrid.appendChild(createStatCard(label, value, caption));
  });
}

function renderRules(data) {
  appendListItem(baseRules, `${data.weighting.ehp_multiplier} base point per 1 EHP`);
  appendListItem(baseRules, `${data.weighting.ehb_multiplier} base points per 1 EHB`);

  data.weighting.decay_multipliers.forEach((multiplier, index) => {
    appendListItem(decayRules, `${index}-${index + 1} months ago: ${formatNumber(multiplier)}x multiplier`);
  });
}

function renderTeams(data) {
  if (!data.teams.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No teams available yet. Run the generator to populate site data.';
    teamsGrid.appendChild(emptyState);
    return;
  }

  data.teams.forEach((team, index) => {
    const teamNode = teamTemplate.content.firstElementChild.cloneNode(true);
    teamNode.style.animationDelay = `${index * 80}ms`;
    teamNode.querySelector('.team-label').textContent = `Roster ${String(index + 1).padStart(2, '0')}`;
    teamNode.querySelector('.team-name').textContent = team.name;
    teamNode.querySelector('.team-total').textContent = `${formatNumber(team.total_weight)} total`;

    const roster = teamNode.querySelector('.team-roster');

    team.players.forEach((player) => {
      const playerNode = playerTemplate.content.firstElementChild.cloneNode(true);
      playerNode.querySelector('.player-name').textContent = player.username;
      playerNode.querySelector('.player-subline').textContent = `EHP ${formatNumber(player.ehp)} / EHB ${formatNumber(player.ehb)}`;
      playerNode.querySelector('.metric-base').textContent = formatNumber(player.base_points);
      playerNode.querySelector('.metric-bonus').textContent = formatNumber(player.bonus_points);
      playerNode.querySelector('.metric-total').textContent = formatNumber(player.total_weight);
      roster.appendChild(playerNode);
    });

    teamsGrid.appendChild(teamNode);
  });
}

async function loadTeams() {
  try {
    const response = await fetch('data/teams.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    renderMeta(data);
    renderStats(data);
    renderRules(data);
    renderTeams(data);
  } catch (error) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = `Could not load team data: ${error.message}`;
    teamsGrid.appendChild(emptyState);
  }
}

loadTeams();
