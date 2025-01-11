import { calculateHeroScores } from './js/hudService.js';

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

        // Відображення таблиці
        renderTable(heroScores);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
});

// Функція відображення таблиці
function renderTable(data) {
    const tableBody = document.querySelector('#resultsTable tbody');
    tableBody.innerHTML = ''; // Очищення таблиці

    if (data.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4">No data available</td>';
        tableBody.appendChild(row);
        return;
    }

    data.forEach(hero => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${hero.heroId}</td>
            <td>${(hero.winrate * 100).toFixed(2)}%</td>
            <td>${hero.matchCount}</td>
            <td>${hero.score.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Приклад функції calculateHeroScores (має бути реалізована окремо)
// function calculateHeroScores(playerId, position, bracketIds, apiKey) {
//     // Реалізація вашої логіки для отримання та обчислення даних
//     // Повертає масив об'єктів з полями heroId, winrate, matchCount, score
// }
