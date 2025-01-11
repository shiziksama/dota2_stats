const cache = {
    get(key) {
        const cachedData = localStorage.getItem(key);
        return cachedData ? JSON.parse(cachedData) : null;
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    delete(key) {
        localStorage.removeItem(key);
    },
    clear() {
        localStorage.clear();
    }
};

// Отримати WinDays зі Stratz із кешем
export const fetchWinDays = async (bracketId, position, apiKey) => {
    const cacheKey = `fetchWinDays:${bracketId}:${position}:${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) return cachedData;
    try {
        const requestBody = JSON.stringify({
            query: `
                {
                    heroStats {
                        winDay(
                            take: 7,
                            positionIds: [${position}],
                            bracketIds: [${bracketId}],
                            gameModeIds: [ALL_PICK_RANKED]
                        ) {
                            heroId,
                            matchCount,
                            winCount
                        }
                    }
                }
            `,
        });

        const response = await fetch('https://api.stratz.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: requestBody,
        });

        const { data } = await response.json();
        const result = (data?.heroStats?.winDay || []).reduce((acc, item) => {
            acc[item.heroId] = {
                matchCount: item.matchCount,
                winCount: item.winCount,
            };
            return acc;
        }, {});

        cache.set(cacheKey, result); // Збереження в кеш
        return result;
    } catch (error) {
        console.error(`Помилка у fetchWinDays (bracketId: ${bracketId}, position: ${position}):`, error);
        return {};
    }
};

// Отримати HeroStats зі Stratz із кешем
export const fetchHeroStats = async (playerId, position, apiKey) => {
    const cacheKey = `fetchHeroStats:${playerId}:${position}:${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) return cachedData;

    try {
        const sixMonthsAgo = Math.floor(new Date().setMonth(new Date().getMonth() - 6) / 1000);
        const requestBody = JSON.stringify({
            query: `
                {
                    player(steamAccountId: ${playerId}) {
                        heroesPerformance(
                            request: {
                                positionIds: [${position}],
                                startDateTime: ${sixMonthsAgo},
                                take: 5000
                            },
                            take: 150
                        ) {
                            heroId
                            winCount
                            matchCount
                            imp
                        }
                    }
                }
            `,
        });

        const response = await fetch('https://api.stratz.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: requestBody,
        });

        const { data } = await response.json();
        const result = (data?.player?.heroesPerformance || []).reduce((acc, item) => {
            acc[item.heroId] = {
                my_matchCount: item.matchCount,
                my_winrate: parseFloat(item.winCount / item.matchCount).toFixed(3),
                my_imp: item.imp,
            };
            return acc;
        }, {});

        cache.set(cacheKey, result); // Збереження в кеш
        return result;
    } catch (error) {
        console.error(`Помилка у fetchHeroStats (playerId: ${playerId}, position: ${position}):`, error);
        return {};
    }
};

// Отримати всі ID героїв зі Stratz із кешем
export const getAllHeroes = async (apiKey) => {
    const cacheKey = `getALlHeroes:${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) return cachedData;

    try {
        const response = await fetch('https://api.stratz.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                query: "{ heroStats { stats { heroId } } }",
            }),
        });

        const data = await response.json();
        const result = data?.data?.heroStats?.stats.map(hero => hero.heroId) || [];

        cache.set(cacheKey, result); // Збереження в кеш
        return result;
    } catch (error) {
        console.error('Помилка у getAllHeroes:', error);
        return [];
    }
};
