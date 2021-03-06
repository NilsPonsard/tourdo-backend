import { Team } from "../database/entities/teams.ts";
import { Tournament, TournamentTeam, TournamentType } from "../database/entities/tournaments.ts";

/**
 * This functions generates the matches for a tournament. If the tournament type is unsupported the function returns ```{ capacity: tournament.max_teams, matches: [] }```
 */
export function GenerateMatches(
    tournament: Tournament,
    teams: { team: Team; team_number: number }[]
) {
    switch (tournament.type) {
        case TournamentType.RoundRobin:
            return generateRoundRobinMatches(tournament, teams);
        case TournamentType.SimpleElimination:
            return generateSimpleEliminationMatches(tournament, teams);
        default:
            return { capacity: tournament.max_teams, matches: [] };
    }
}
/**
 * Generate matches for a round robin tournament :
 *
 * Each team should play against every other team.
 *
 */
function generateRoundRobinMatches(tournament: Tournament, teams: TournamentTeam[]) {
    const matches = [];

    teams.sort((a, b) => a.team_number - b.team_number);

    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            //TODO : manage dates

            matches.push({
                team1_id: teams[i].team.id,
                team2_id: teams[j].team.id,
                date: tournament.start_date,
                row: i,
                column: j,
            });
        }
    }

    return { matches, capacity: teams.length };
}
/**
 * Generate matches for a simple elimination tournament
 *
 * First get the power of 2 the upper nearest of the number of teams -> capacity.
 * Then generate the first column of matches with the teams
 * Then generate the other columns with no teams, each new column having half of the matches of the previous one, updating the row and column.
 *
 *
 */
function generateSimpleEliminationMatches(tournament: Tournament, teams: TournamentTeam[]) {
    const matches = [];

    teams.sort((a, b) => a.team_number - b.team_number);

    let capacity = 2;

    let rounds = 1;

    while (capacity < teams.length) {
        capacity *= 2;
        rounds++;
    }

    let matchesByColumn = capacity / 2;
    let column = 0;

    while (matchesByColumn >= 1) {
        for (let i = 0; i < matchesByColumn; i++) {
            let team1_id = null;
            let team2_id = null;

            if (column == 0) {
                team1_id = teams[i * 2] ? teams[i * 2].team.id : null;
                team2_id = teams[i * 2 + 1] ? teams[i * 2 + 1].team.id : null;
            }

            matches.push({
                team1_id,
                team2_id,
                date: tournament.start_date,
                row: i,
                column,
            });
        }

        column += 1;
        matchesByColumn /= 2;
    }

    return { capacity, matches };
}
