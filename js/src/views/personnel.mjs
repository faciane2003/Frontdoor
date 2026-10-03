// Group the roster by responsibility; IRM and Backup IRM lead the page.
import { filtered, escapeHtml, renderEmpty } from '../core/utils.mjs';

function renderProfile(profile, leadership = false) {
  const initials = profile.name.split(' ').map(part => part[0]).join('');
  return `<article class="personnel-card ${leadership ? `personnel-leader ${profile.role === 'IRM' ? 'personnel-irm' : 'personnel-backup'}` : ''}" aria-labelledby="${escapeHtml(profile.id)}-name">
    <header class="personnel-card-header"><div class="personnel-avatar" aria-hidden="true">${escapeHtml(initials)}</div><div><p class="personnel-rank">${escapeHtml(profile.role)}</p><h4 id="${escapeHtml(profile.id)}-name">${escapeHtml(profile.name)}</h4></div></header>
    <h5>Talents</h5><ul class="personnel-talents">${profile.talents.map(talent => `<li>${escapeHtml(talent)}</li>`).join('')}</ul>
  </article>`;
}

export function renderPersonnel() {
  const profiles = filtered('personnel');
  const leaders = profiles.filter(profile => ['IRM', 'Backup IRM'].includes(profile.role));
  const tiers = ['Tier 3', 'Tier 2', 'Tier 1'];
  document.querySelector('#personnel-list').innerHTML = `
    <div class="personnel-intro"><div><p class="personnel-eyebrow">TEAM ROSTER</p><h3>Personnel</h3></div><span class="personnel-count">${profiles.length} profiles</span></div>
    ${profiles.length ? `${leaders.length ? `<div class="personnel-leadership">${leaders.map(profile => renderProfile(profile, true)).join('')}</div>` : ''}
      ${tiers.map(tier => {
        const members = profiles.filter(profile => profile.role === tier);
        return members.length ? `<section class="personnel-tier" aria-labelledby="personnel-${tier.replace(' ', '-').toLowerCase()}"><h3 id="personnel-${tier.replace(' ', '-').toLowerCase()}">${tier}</h3><div class="personnel-grid">${members.map(profile => renderProfile(profile)).join('')}</div></section>` : '';
      }).join('')}` : renderEmpty('No personnel match your search.')}`;
}
