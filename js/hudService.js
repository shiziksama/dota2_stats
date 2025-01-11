import * as stratzApi from './stratzApi.js';
export async function calculateHeroScores(playerId, position, bracketIds, apiKey) {
    const brackets = {};

    // Отримання статистики для кожного рангу
    for (const name of bracketIds) {
        brackets[name] = await stratzApi.fetchWinDays(name, position, apiKey);
    }

    let result = {};

    // Об'єднання статистики з усіх рангу
    for (const bracket of Object.values(brackets)) {
        for (const [heroId, heroStats] of Object.entries(bracket)) {
            result[heroId] = result[heroId] || { matchCount: 0, winCount: 0, hero_id: parseInt(heroId) };
            result[heroId].matchCount += heroStats.matchCount;
            result[heroId].winCount += heroStats.winCount;
            result[heroId].winrate = parseFloat((result[heroId].winCount / result[heroId].matchCount).toFixed(3));
        }
    }

    // Додавання статистики гравця
    const heroStats = await stratzApi.fetchHeroStats(playerId, position, apiKey);
    for (const [heroId, heroStat] of Object.entries(heroStats)) {
        result[heroId] = { ...result[heroId], ...heroStat };
    }

    // Розрахунок середнього впливу (impact)
    const totalMyMatchCount = Object.values(result).reduce((sum, hero) => sum + (hero.my_matchCount || 0), 0);
    const avgImp = totalMyMatchCount !== 0
        ? Object.values(result).reduce((sum, hero) => {
        return sum + (hero.my_imp || 0) * (hero.my_matchCount || 0);
    }, 0) / totalMyMatchCount
        : 0;

    // Мінімальна кількість матчів
    const totalMatchCount = Object.values(result).reduce((sum, hero) => sum + hero.matchCount, 0);
    const minMatchCount = Math.round(totalMatchCount / 10 / 40);

    // Обробка кожного героя
    result = Object.values(result).map(hero => {
        const oneBadGame = hero.my_imp < 0 && hero.my_matchCount < 3;
        let myScore = 1;
        hero.parsed_balanced_imp=hero.my_imp-avgImp;

        if (hero.my_imp && !oneBadGame) {
            myScore = 1 + (hero.my_imp - avgImp) / 100 / 2;
            if (hero.my_matchCount > 3) {
                myScore *= 1 + (hero.my_winrate - 0.5) / 2;
            }
        }

        hero.score = myScore * hero.winrate;

        return hero;
    }).filter(hero => hero.my_imp || hero.matchCount > minMatchCount);

    // Сортування героїв за рейтингом
    result.sort((a, b) => b.score - a.score);

    // Повернення ID героїв
    return result;
}