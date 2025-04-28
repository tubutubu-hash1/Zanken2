// 結果を保存する配列
const results = [];
const playerMoves = []; // プレイヤーの手の履歴を保存

// ランダムに手を選択
function randomMove() {
    const moves = ["グー", "チョキ", "パー"];
    return moves[Math.floor(Math.random() * moves.length)];
}

// マルコフ連鎖による次の手の予測
function buildTransitionMatrix(moves, order) {
    const transitionMatrix = {};
    for (let i = 0; i < moves.length - order; i++) {
        const state = moves.slice(i, i + order).join(",");
        const nextMove = moves[i + order];
        if (!transitionMatrix[state]) {
            transitionMatrix[state] = { "グー": 0, "チョキ": 0, "パー": 0 };
        }
        transitionMatrix[state][nextMove]++;
    }
    return transitionMatrix;
}

function predictNextMove(moves, order) {
    const state = moves.slice(-order).join(",");
    const transitionMatrix = buildTransitionMatrix(moves, order);

    if (transitionMatrix[state]) {
        const nextMoves = transitionMatrix[state];
        let maxMove = null;
        let maxCount = -1;
        for (const move in nextMoves) {
            if (nextMoves[move] > maxCount) {
                maxMove = move;
                maxCount = nextMoves[move];
            }
        }
        return maxMove;
    } else {
        return randomMove(); // データがない場合はランダムに手を選択
    }
}

// 頻度ベースの予測
function predictMoveByFrequency(moves) {
    const moveCounts = { "グー": 0, "チョキ": 0, "パー": 0 };
    for (const move of moves) {
        moveCounts[move]++;
    }
    let maxMove = null;
    let maxCount = -1;
    for (const move in moveCounts) {
        if (moveCounts[move] > maxCount) {
            maxMove = move;
            maxCount = moveCounts[move];
        }
    }
    return maxMove || randomMove();
}

// コンピュータの手を決定
function decideComputerMove(moves, order = 9) {
    if (moves.length < order) {
        return randomMove();
    }
    const predictedMoveByMarkov = predictNextMove(moves, order);
    const predictedMoveByFrequency = predictMoveByFrequency(moves);

    // マルコフ連鎖と頻度ベースの予測を併用
    const predictedMove = predictedMoveByMarkov || predictedMoveByFrequency;
    const counterMoves = { "グー": "パー", "チョキ": "グー", "パー": "チョキ" };
    return counterMoves[predictedMove] || randomMove();
}

// 勝敗判定
function judge(player, computer) {
    if (player === computer) {
        return "引き分け";
    } else if (
        (player === "グー" && computer === "チョキ") ||
        (player === "チョキ" && computer === "パー") ||
        (player === "パー" && computer === "グー")
    ) {
        return "勝ち";
    } else {
        return "負け";
    }
}

// ゲームを実行
function playGame(playerHand) {
    const computerHand = decideComputerMove(playerMoves, 3);
    const result = judge(playerHand, computerHand);

    // 結果を画面に表示
    document.getElementById('result').textContent = `あなた: ${playerHand}, AI: ${computerHand}, 結果: ${result}`;

    // 履歴と結果を保存
    playerMoves.push(playerHand);
    results.push({ playerHand, computerHand, result });

    // 統計を更新
    updateStatistics();
}

// 統計の更新
function updateStatistics() {
    const totalGames = results.length;
    const wins = results.filter(result => result.result === '勝ち').length;
    const draws = results.filter(result => result.result === '引き分け').length;
    const losses = results.filter(result => result.result === '負け').length;

    const nonDrawGames = totalGames - draws;
    const winRate = nonDrawGames > 0 ? ((wins / nonDrawGames) * 100).toFixed(2) : 0;

    document.getElementById('total-games').textContent = `総ゲーム数: ${totalGames}`;
    document.getElementById('win-count').textContent = `勝数: ${wins}`;
    document.getElementById('draw-count').textContent = `引き分け数: ${draws}`;
    document.getElementById('loss-count').textContent = `負け数: ${losses}`;
    document.getElementById('win-rate').textContent = `勝率（引き分け除外）: ${winRate}%`;
}

// 結果をExcelファイルで保存
function downloadResults() {
    if (results.length === 0) {
        alert('保存する結果がありません');
        return;
    }
    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'じゃんけん結果');
    XLSX.writeFile(workbook, 'janken_results.xlsx');
}

// ゲームをリセット
function resetGame() {
    results.length = 0;
    playerMoves.length = 0;
    document.getElementById('result').textContent = '';
    updateStatistics();
}

// ファイル読み込み数を表示するための変数
let loadedFileCount = 0;

// 複数のExcelファイルを読み込んで履歴に追加
function uploadAndLoadExcel(event) {
    const files = event.target.files;
    if (!files.length) {
        alert('ファイルを選択してください');
        return;
    }

    let filesProcessed = 0;
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            jsonData.forEach(row => {
                if (row['player']) {
                    playerMoves.push(row['player']);
                }
            });

            filesProcessed++;
            loadedFileCount++;

            // 全部読み終わったら表示更新
            if (filesProcessed === files.length) {
                updateLoadedFileCount();
                alert(`ファイルを${files.length}個読み込みました。履歴に合計${playerMoves.length}手追加しました`);
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

// 読み込んだファイル数を更新して表示
function updateLoadedFileCount() {
    document.getElementById('loaded-files').textContent = `読み込んだファイル数: ${loadedFileCount}個`;
}
