const { AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { validateTournamentData } = require('../../validators');

const { CHART_CONFIG, DWZ_CONSTANTS, LIMITS } = require('../../constants');
const { logger } = require('../logger');

async function generateDWZChart(tournaments, playerName) {
    try {
        const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
        const chartJSNodeCanvas = new ChartJSNodeCanvas({
            width: CHART_CONFIG.WIDTH,
            height: CHART_CONFIG.HEIGHT,
            backgroundColour: CHART_CONFIG.BACKGROUND_COLOR
        });

        const validation = validateTournamentData(tournaments);
        if (!validation.isValid) return null;

        const sortedTournaments = _prepareTournamentData(tournaments);
        if (sortedTournaments.length < LIMITS.MIN_TOURNAMENTS_FOR_CHART) return null;

        const chartData = _prepareChartData(sortedTournaments);
        const configuration = _createChartConfiguration(chartData, playerName);
        return await _generateAndSaveChart(configuration, chartJSNodeCanvas);

    } catch (error) {
        logger.error('Error generating DWZ chart', { playerName, error: error.message });
        return null;
    }
}

function _prepareTournamentData(tournaments) {
    const normalized = tournaments.map((t, idx) => ({
        ...t,
        dwzneu: t.dwzneu != null ? t.dwzneu : t.dwzNew,
        dwzalt: t.dwzalt != null ? t.dwzalt : t.dwzOld,
        turniername: t.turniername || t.name,
        index: idx
    }));
    const filtered = normalized.filter(tournament => {
        const end = tournament.dwzneu;
        return end != null && end !== '0' && end !== '' && !isNaN(parseInt(end));
    });
    return filtered.sort((a, b) => a.index - b.index);
}

function _prepareChartData(sortedTournaments) {
    const labels = [];
    const dwzData = [];
    let chartStartIndex = 0;
    let startingDWZ = null;
    for (let i = 0; i < sortedTournaments.length; i++) {
        const tournament = sortedTournaments[i];
        if (tournament.dwzalt && tournament.dwzalt !== '0' && !isNaN(parseInt(tournament.dwzalt))) {
            startingDWZ = parseInt(tournament.dwzalt);
            chartStartIndex = i;
            break;
        }
    }
    if (startingDWZ === null) {
        startingDWZ = parseInt(sortedTournaments[0].dwzneu);
        chartStartIndex = 0;
    } else {
        labels.push('Start');
        dwzData.push(startingDWZ);
    }
    for (let i = chartStartIndex; i < sortedTournaments.length; i++) {
        const tournament = sortedTournaments[i];
        const shortName = _truncateTournamentName(tournament.turniername);
        labels.push(shortName);
        dwzData.push(parseInt(tournament.dwzneu));
    }
    return { labels, dwzData };
}

function _truncateTournamentName(name) {
    const maxLength = LIMITS.MAX_TOURNAMENT_NAME_LENGTH;
    return name.length > maxLength ? name.substring(0, maxLength - 3) + '...' : name;
}

function _createChartConfiguration(chartData, playerName) {
    const { labels, dwzData } = chartData;
    const minDWZ = Math.min(...dwzData);
    const maxDWZ = Math.max(...dwzData);
    const padding = Math.max(DWZ_CONSTANTS.MIN_CHART_PADDING, (maxDWZ - minDWZ) * DWZ_CONSTANTS.CHART_PADDING_PERCENTAGE);
    return {
        type: 'line',
        data: { labels, datasets: [{ data: dwzData, borderColor: CHART_CONFIG.LINE_COLOR }] },
        options: { responsive: false }
    };
}

async function _generateAndSaveChart(configuration, chartJSNodeCanvas) {
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    const fileName = `dwz_chart_${Date.now()}.png`;
    const filePath = path.join(process.cwd(), 'temp', fileName);
    if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, imageBuffer);
    const attachment = new AttachmentBuilder(filePath, { name: fileName });
    attachment.filePath = filePath;
    setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, CHART_CONFIG.CLEANUP_DELAY_MS);
    return attachment;
}

function generateDWZStatistics(tournaments) {
    if (!Array.isArray(tournaments) || tournaments.length === 0) return null;
    const valid = tournaments.filter(_isValidTournamentForStats).sort((a, b) => a.index - b.index);
    if (!valid.length) return null;
    const start = parseInt(valid[0].dwzalt);
    const current = parseInt(valid[valid.length - 1].dwzneu);
    const perf = _calculatePerformanceStats(valid);
    const game = _calculateGameStats(valid);
    return { startingDWZ: start, currentDWZ: current, totalChange: current - start, bestGain: perf.bestGain, worstLoss: perf.worstLoss, tournamentCount: valid.length, totalGames: game.totalGames, totalPoints: game.totalPoints, averageScore: game.averageScore };
}

function _isValidTournamentForStats(t) {
    return t && t.dwzalt && t.dwzneu && t.dwzalt !== '0' && t.dwzneu !== '0' && !isNaN(parseInt(t.dwzalt)) && !isNaN(parseInt(t.dwzneu));
}

function _calculatePerformanceStats(valid) {
    let best = -Infinity, worst = Infinity;
    valid.forEach(t => { const change = parseInt(t.dwzneu) - parseInt(t.dwzalt); if (change > best) best = change; if (change < worst) worst = change;});
    return { bestGain: best === -Infinity ? 0 : best, worstLoss: worst === Infinity ? 0 : worst };
}

function _calculateGameStats(valid) {
    let games = 0, points = 0;
    valid.forEach(t => { if (t.partien && t.punkte) { games += parseInt(t.partien) || 0; points += parseFloat(t.punkte) || 0; }});
    return { totalGames: games, totalPoints: points, averageScore: games ? (points / games * 100).toFixed(1) : 0 };
}

module.exports = { generateDWZChart, _prepareTournamentData, _prepareChartData, generateDWZStatistics };
