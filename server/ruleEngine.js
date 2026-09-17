import { get, query } from './db.js';

/**
 * Dynamically evaluates team compliance against an opportunity's rules.
 * Never hardcodes event rules globally; reads rules directly from DB.
 */
export async function evaluateTeamRules(teamId, targetOpportunityId = null) {
  const team = await get('SELECT id, name, opportunity_id FROM teams WHERE id = ?', [teamId]);
  if (!team) {
    return { isCompliant: false, errors: ['Team not found'], summary: 'Invalid Team' };
  }

  const opportunityId = targetOpportunityId || team.opportunity_id;
  if (!opportunityId) {
    return {
      isCompliant: true,
      errors: [],
      summary: 'Personal Project (No opportunity constraints applied)'
    };
  }

  const opportunity = await get('SELECT id, title FROM opportunities WHERE id = ?', [opportunityId]);
  const rules = await get('SELECT * FROM opportunity_rules WHERE opportunity_id = ?', [opportunityId]);

  if (!opportunity) {
    return { isCompliant: false, errors: ['Opportunity not found'], summary: 'Invalid Opportunity' };
  }

  // Fetch team members with profile details
  const members = await query(
    `SELECT tm.id as membership_id, tm.role_title, u.id as user_id, p.full_name, p.college, p.year_of_study, p.branch
     FROM team_members tm
     JOIN users u ON tm.user_id = u.id
     JOIN profiles p ON u.id = p.user_id
     WHERE tm.team_id = ?`,
    [teamId]
  );

  const memberCount = members.length;
  const errors = [];

  if (!rules) {
    return {
      isCompliant: true,
      errors: [],
      summary: `Compliant (${memberCount} member${memberCount !== 1 ? 's' : ''})`,
      memberCount
    };
  }

  // 1. Evaluate Team Size Constraints
  if (rules.exact_team_size !== null && rules.exact_team_size !== undefined) {
    if (memberCount !== rules.exact_team_size) {
      errors.push(`Requires exactly ${rules.exact_team_size} members (currently ${memberCount})`);
    }
  } else {
    if (rules.min_team_size && memberCount < rules.min_team_size) {
      errors.push(`Requires at least ${rules.min_team_size} members (currently ${memberCount})`);
    }
    if (rules.max_team_size && memberCount > rules.max_team_size) {
      errors.push(`Exceeds maximum allowed size of ${rules.max_team_size} members (currently ${memberCount})`);
    }
  }

  // 2. Evaluate Dynamic Composition Rules
  let compRules = [];
  try {
    compRules = JSON.parse(rules.composition_rules || '[]');
  } catch (e) {
    compRules = [];
  }

  for (const rule of compRules) {
    // rule format: { attribute: 'year_of_study', operator: 'exact'|'min'|'max', value: '2nd Year', count: 2 }
    const attr = rule.attribute || 'year_of_study';
    const matchingMembers = members.filter(m => String(m[attr]).toLowerCase() === String(rule.value).toLowerCase());
    const actualCount = matchingMembers.length;
    const targetCount = rule.count;
    const operator = rule.operator || 'exact';

    if (operator === 'exact' && actualCount !== targetCount) {
      errors.push(`Requires exactly ${targetCount} student${targetCount !== 1 ? 's' : ''} from ${rule.value} (currently ${actualCount})`);
    } else if (operator === 'min' && actualCount < targetCount) {
      errors.push(`Requires at least ${targetCount} student${targetCount !== 1 ? 's' : ''} from ${rule.value} (currently ${actualCount})`);
    } else if (operator === 'max' && actualCount > targetCount) {
      errors.push(`Cannot exceed ${targetCount} student${targetCount !== 1 ? 's' : ''} from ${rule.value} (currently ${actualCount})`);
    }
  }

  const isCompliant = errors.length === 0;
  const summary = isCompliant
    ? `Eligible & Compliant (${memberCount} member${memberCount !== 1 ? 's' : ''})`
    : `Ineligible: ${errors.join('; ')}`;

  return {
    isCompliant,
    errors,
    summary,
    memberCount,
    rulesConfigured: rules
  };
}
