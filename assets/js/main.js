(function () {
    const startForm = document.getElementById("startForm");
    const gameBoard = document.getElementById("board");
    const countdownTimer = document.getElementById("countdown");
    const leaderboardTable = document.querySelector("#leaderboard tbody");
    const difficultyText = document.getElementById("difficultyText");

    var timer;
    var numOfWrongMoves;
    var totalMoves;
    var timerId;
    var lastSelection;
    var disableBoard;

    const EASY_TIMER_MIN = 4;
    const HARD_TIMER_MIN = 6;

    const EASY_BOARD_SIZE = 4;
    const HARD_BOARD_SIZE = 6;

    const config = {};

    const matchedPairs = [];

    function startTimer() {
        timer = config.timer;
        countdownTimer.innerText = `${Math.floor(timer / 60)}:${(timer % 60)
            .toString()
            .padStart(2, "0")}`;
        timerId = setInterval(() => {
            timer -= 1;
            countdownTimer.innerText = `${Math.floor(timer / 60)}:${(timer % 60)
                .toString()
                .padStart(2, "0")}`;
            if (!timer) {
                clearInterval(timerId);
                gameBoard.parentElement.style.display = "none";
                document.getElementById("loseScreen").style.display = "block";
            }
        }, 1000);
        countdownTimer.style.display = "block";
    }

    function checkPairs(num) {
        totalMoves += 1;
        if (!lastSelection) {
            lastSelection = num;
            return 0;
        }
        if (lastSelection === num) {
            return 1;
        }
        numOfWrongMoves += 1;
        return -1;
    }

    function hideNumbers() {
        disableBoard = true;
        setTimeout(() => {
            document.querySelectorAll("button.show").forEach((btn) => {
                btn.innerText = "";
                btn.classList.remove("show");
                lastSelection = null;
            });
            disableBoard = false;
        }, 1000);
    }

    function loadLeaderboard(difficulty) {
        let leaderboard = JSON.parse(
            localStorage.getItem("leaderboard") || "[]"
        );
        if (!leaderboard.length) {
            leaderboardTable.parentElement.style.display = "none";
            return;
        }
        leaderboardTable.innerHTML = "";
        leaderboard = leaderboard
            .filter((d) => d.difficulty === difficulty)
            .sort((a, b) => {
                return (
                    a.wrongMoves +
                    a.timeToComplete -
                    (b.wrongMoves + b.timeToComplete)
                );
            })
            .splice(0, 10);
        leaderboardTable.append(
            ...leaderboard.map((data, idx) => {
                const row = document.createElement("tr");
                const rankCol = document.createElement("td");
                rankCol.innerText = idx + 1;
                row.append(
                    rankCol,
                    ...Object.values(data).map((value) => {
                        const col = document.createElement("td");
                        col.innerText = value;
                        return col;
                    })
                );
                return row;
            })
        );
    }

    function matchedPair(num) {
        matchedPairs.push(num);
        document.querySelectorAll("button.show").forEach((btn) => {
            btn.classList.add("match");
            btn.classList.remove("show");
        });
        lastSelection = null;
        if (checkResult()) {
            clearInterval(timerId);
            const result = {
                name: config.name,
                difficulty: config.difficulty,
                wrongMoves: numOfWrongMoves,
                moves: totalMoves,
                timeToComplete: config.timer - timer,
            };
            const leaderboard = JSON.parse(
                localStorage.getItem("leaderboard") || "[]"
            );
            leaderboard.push(result);
            localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
            localStorage.removeItem("currentState");
            gameBoard.parentElement.style.display = "none";
            document.getElementById("winScreen").style.display = "block";
        }
    }

    function checkResult() {
        return matchedPairs.length === config.boardSize ** 2 / 2;
    }

    function generateNumbers(boardSize) {
        const nums = [];
        while (nums.length !== boardSize ** 2) {
            const randomNum = Math.round(Math.random() * 100);
            if (!nums.includes(randomNum) && randomNum >= 10) {
                nums.push(randomNum);
                nums.unshift(randomNum);
            }
        }
        nums.sort(() => Math.random() > 0.5);
        localStorage.setItem("previousNums", JSON.stringify(nums));
        return nums;
    }

    function hidePreview() {
        for (const btn of gameBoard.children) {
            btn.innerText = "";
        }
        startTimer(config.timer);
    }

    function loadGameboard(config) {
        const nums = generateNumbers(config.boardSize);
        gameBoard.append(
            ...nums.map((num, idx) => {
                const btn = document.createElement("button");
                btn.innerText = num;
                btn.addEventListener("click", (e) => {
                    if (disableBoard) return;
                    if (e.target.classList.contains("match")) return;
                    if (e.target.classList.contains("show")) return;

                    btn.innerText = nums[idx];
                    btn.classList.add("show");
                    const answer = checkPairs(nums[idx]);
                    if (answer === -1) {
                        hideNumbers();
                    } else if (answer === 1) {
                        matchedPair(nums[idx]);
                    }
                });
                return btn;
            })
        );
        gameBoard.style.maxWidth = `calc(50px * ${config.boardSize})`;
        document.getElementById("game").style.display = "block";
        disableBoard = true;
        setTimeout(() => {
            hidePreview();
            disableBoard = false;
        }, 5000);
        totalMoves = 0;
        numOfWrongMoves = 0;
    }

    startForm.addEventListener("submit", (e) => {
        difficulty = startForm.elements["difficulty"].value;
        config.name = startForm.elements["name"].value;
        config.difficulty = difficulty;
        config.timer =
            (difficulty === "easy" ? EASY_TIMER_MIN : HARD_TIMER_MIN) * 60;
        config.boardSize =
            difficulty === "easy" ? EASY_BOARD_SIZE : HARD_BOARD_SIZE;
        startForm.style.display = "none";
        loadGameboard(config);
        e.preventDefault();
    });

    document
        .getElementById("toggleDifficulty")
        .addEventListener("click", () => {
            const diff = difficultyText.innerText.toLowerCase();
            if (diff === "easy") {
                loadLeaderboard("hard");
                difficultyText.innerText = "hard";
            } else {
                loadLeaderboard("easy");
                difficultyText.innerText = "easy";
            }
        });

    document.addEventListener("DOMContentLoaded", () => {
        loadLeaderboard("easy");
    });
})();
