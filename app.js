import { calculateHeroScores } from './js/hudService.js';
import {getAllHeroes} from "./js/stratzApi.js";

// Форма: відправка запиту
const form = document.getElementById('queryForm');

// Завантаження даних із LocalStorage
window.addEventListener('load', () => {
    const storedPlayerId = localStorage.getItem('player_id');
    const storedPosition = localStorage.getItem('role');
    const storedApiKey = localStorage.getItem('api_key');
    const storedBrackets = JSON.parse(localStorage.getItem('bracket_ids')) || [];

    if (storedPlayerId) document.getElementById('player_id').value = storedPlayerId;
    if (storedPosition) document.getElementById('role').value = storedPosition;
    if (storedApiKey) document.getElementById('api_key').value = storedApiKey;

    const bracketInputs = document.querySelectorAll('input[name="bracket_id[]"]');
    bracketInputs.forEach(input => {
        if (storedBrackets.includes(input.value)) {
            input.checked = true;
        }
    });
});

form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Отримання значень із форми
    const playerId = document.getElementById('player_id').value;
    const position = document.getElementById('role').value;
    const apiKey = document.getElementById('api_key').value;

    // Збираємо вибрані брекети
    const bracketInputs = document.querySelectorAll('input[name="bracket_id[]"]:checked');
    const bracketIds = Array.from(bracketInputs).map(input => input.value);

    if (bracketIds.length === 0) {
        alert('Please select at least one bracket.');
        return;
    }

    // Збереження даних у LocalStorage
    localStorage.setItem('player_id', playerId);
    localStorage.setItem('role', position);
    localStorage.setItem('api_key', apiKey);
    localStorage.setItem('bracket_ids', JSON.stringify(bracketIds));

    try {
        // Виклик функції обчислення
        const heroScores = await calculateHeroScores(playerId, position, bracketIds, apiKey);
        const allheroes = await getAllHeroes(apiKey)
        // Відображення таблиці
        renderTable(heroScores,allheroes);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
});

// Функція відображення таблиці
function renderTable(data,heroes) {

    const tableBody = document.querySelector('#resultsTable tbody');
    tableBody.innerHTML = ''; // Очищення таблиці

    if (data.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="11">No data available</td>';
        tableBody.appendChild(row);
        return;
    }

    data.forEach((hero, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td style="line-height: 0;">
                <img src="https://cdn.dota2.com/apps/dota2/images/heroes/${heroes[hero.hero_id].shortName}_full.png" alt="${heroes[hero.hero_id].shortName}" style="width: 80px; height: auto;margin:-8px;">
            </td>
            <td>${hero.winrate ? (hero.winrate * 100).toFixed(2) + '%' : '-'}</td>
            <td>${hero.matchCount || '-'}</td>
            <td>${hero.my_winrate ? (hero.my_winrate * 100).toFixed(2) + '%' : '-'}</td>
            <td>${hero.my_matchCount || '-'}</td>
            <td>${hero.my_imp || '-'}</td>
            <td>${hero.parsed_balanced_imp || '-'}</td>
            <td>${hero.lane_outcome || '-'}</td>
            <td>${hero.score ? hero.score.toFixed(2) : '-'}</td>
            <td>${hero.your_gain || '-'}</td>
        `;
        tableBody.appendChild(row);
    });
}