const canvas = document.getElementById("drawBoard");
const ctx = canvas.getContext("2d");

const shapeDropdown = document.getElementById("select-contour");
const pointVal = document.getElementById("select-points");
const algorithmDropdown = document.getElementById("select-algorithm");

const uiPlayerPoints = document.getElementById("current_player");
const uiCurrentPlayer = document.getElementById("score-display");
const uiIntersectPreview = document.getElementById("about_to_intersect");

const serchDepthInput = document.getElementById("maxDepthInput")
const resetButton = document.getElementById("reset-button");

const COLOR_POINT = "#000000"
const COLOR_LINE = "#000000"
const COLOR_FRIEDNLY = "#00ff00"
const COLOR_OPPONENT = "#ff6666ff"
const COLOR_SELECTED = "#bb1be3ff"
const COLOR_INTERSECT = "#9c0000ff"

let pointSize = 10;
let selectPointSize = 15;
let lineWidth = 2;
let mouseMargin = 20;

let idCounter = 1;

let pointCount = pointVal.value; // Nomaina ar UI


const arena_x = 400;
const arena_y = 400;


const canvasW = canvas.width
const canvasH = canvas.height
const centerX = canvasW/2
const centerY = canvasH/2


let selectedShape = shapeDropdown.value // Nomaina ar UI
let selectedAlg = algorithmDropdown.value // Nomaina ar UI
let maximumDepth = serchDepthInput.value // Nomaina ar UI


let lines = [] // Līnijas, [sākuma punkts, beigu punkts, id], punkti doti pēc indeksa
let filledPoints = [] // masīvs, satur visus punktus un viņu id, pēc id nosaka vai pašreizējā spēlētāja vai nē 
let drawPoints = [] // masīvs, satur visus punktus un viņu pozīcijas
let highlightedPoint = undefined
let fromDrawPoint = undefined
let mousePos = {x: 0, y:0}


let currentPlayer = 0
let playerCount = 2
let players = ["human", "human"]
let playerScore = []
let playerLines = []


document.addEventListener("mousemove", (e)=>{
    const rect = canvas.getBoundingClientRect();
    mousePos = {x: e.clientX - rect.left, y:e.clientY - rect.top}

    let minX = mouseMargin*2
    let minY = mouseMargin*2
    let selPoint = undefined
    for (let i = 0; i < drawPoints.length; i++) {
        const el = drawPoints[i];
        let pX = mousePos.x -el[0]
        let pY = mousePos.y -el[1]
        if(Math.hypot(pX**2 + pY**2)< Math.hypot(minX**2, minY**2) && i != fromDrawPoint){//filledPoints[i] == 0 && i != fromDrawPoint){
            let invalidLines = 0
            for(let j=0; j<lines.length; j++){
                if(
                    fromDrawPoint==lines[j][0] && i==lines[j][1] ||
                    fromDrawPoint==lines[j][1] && i==lines[j][0]
                ){
                    invalidLines++ 
                    break
                }
            }
            if(invalidLines==0){
                selPoint = i
                minX = pX
                minY = pY
            }
        }
    }
    highlightedPoint = selPoint

})
document.addEventListener("mousedown", (e)=>{
    fromDrawPoint = highlightedPoint
    highlightedPoint = undefined
})
document.addEventListener("mouseup", (e)=>{
    if(fromDrawPoint != highlightedPoint && fromDrawPoint != undefined && highlightedPoint != undefined){
        makeAMove(fromDrawPoint, highlightedPoint)
    }
    fromDrawPoint = undefined
    highlightedPoint = undefined
})

let graph = {}

shapeDropdown.addEventListener("input", (e) => {
    selectedShape = e.target.value
    console.log(selectedShape)
    initGame()
})
pointVal.addEventListener("input", (e) => {
    let val = Number(e.target.value);
    if (val > 25) {
        val = 25;
    }
    if (val < 15) {
        val = 15;
    }
    if (isNaN(val)) {
        val = 15;
    }
    if (val % 1 !== 0) {
        val = Math.round(val);
    }
    pointCount = val;
    console.log(pointCount)
    initGame()
})
algorithmDropdown.addEventListener("input", (e) => {
    selectedAlg = e.target.value
    console.log(selectedAlg)
    initGame()
})
serchDepthInput.addEventListener("input", (e) => {
    let val = Number(e.target.value);
    if (val > 25) {
        val = 25;
    }
    if (val < 15) {
        val = 15;
    }
    if (isNaN(val)) {
        val = 15;
    }
    if (val % 1 !== 0) {
        val = Math.round(val);
    }
    maximumDepth = val
    console.log(maximumDepth)
    initGame()
})

resetButton.addEventListener("click", (e) => {
    initGame()
})

function line2id(line){
    return line[2]
}

function updScore(){
    let msg = ""
    for (let i = 0; i < playerCount; i++) {
        msg += `${players[i]}: ${playerScore[i]}\n`
        
    }
    uiPlayerPoints.textContent = msg
    uiCurrentPlayer.textContent = `Pašreiz iet: ${currentPlayer+1}. ${players[currentPlayer]}`
}

function updIntersectCount(count){
    uiIntersectPreview.textContent = count
}

function addFunctionalLine(from, to){
    playerLines[currentPlayer].add(idCounter)
    lines.push([from, to, idCounter])
    filledPoints[from] = idCounter
    filledPoints[to] = idCounter
    idCounter++
}

function point2id(start, end) {
    if (start > end) {
        [start, end] = [end, start]
    }
    return (start * (2 * pointCount - start - 1)) / 2 + (end - start - 1)
}


function id2point(id){
    // TODO
    for (let i = 0; i < pointCount; i++) {
        for (let j = i+1; j < pointCount; j++) {
            if(id === point2id(i,j)) return [i,j]
        }
        
    }

    throw new Error("Invalid move")
}


function getGamestate(){
    let state = 0n
    lines.forEach(line => {
        state |= (1n << BigInt(point2id(line[0], line[1])))
    });
    console.log("Found gamestate: ", state)
    return state
}

function calculateMiniMax(gamestate){

}


function isInside(point, start, end){
    if(start > end)
        return point > start || point < end
    else
        return point > start && point < end
}


function friendlyLine(id){
    return playerLines[currentPlayer].has(id)
}

function calculateIntersections(from, to){
    let intersections = []
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if(
            (from != line[0] && from != line[1] && to != line[0] && to != line[1]) && (
            (isInside(line[0], from, to) && !isInside(line[1], from, to)) ||
            (isInside(line[1], from, to) && !isInside(line[0], from, to)))
        ){
            intersections.push(line)
        }
    }
    return intersections
}

function initGame(){
    lines = []
    filledPoints = []
    drawPoints = []
    fromDrawPoint = undefined
    highlightedPoint = undefined
    playerPoints = 0
    pcPoints = 0

    for (let i = 0; i < pointCount; i++) {
        filledPoints.push(0) // Todo
    }
    
    playerLines = []
    playerScore = []
    for (let i = 0; i < playerCount; i++) {
        playerLines.push(new Set())
        playerScore.push(0)
    }

    const arena_x_2 = arena_x / 2
    const arena_y_2 = arena_y / 2
    switch(selectedShape){
        case "square":
            {
                let lSpace = 2*(arena_x + arena_y) / pointCount
                for (let i = 0; i < pointCount; i++) {
                    offset = i*lSpace
                    if(offset < arena_x){
                        drawPoints.push([centerX+offset - arena_x_2, centerY+arena_y_2])
                    }
                    else if (offset < arena_x+arena_y){
                        offset = offset - arena_x
                        drawPoints.push([centerX+arena_x_2, centerY+arena_y_2 - offset])
                    }
                    else if (offset < 2*arena_x+arena_y){
                        offset = offset - arena_x-arena_y
                        drawPoints.push([centerX+arena_x_2 - offset, centerY+-arena_y_2])
                    }
                    else{
                        offset = offset - 2*arena_x-arena_y
                        drawPoints.push([centerX-arena_x_2, centerY+offset-arena_y_2])
                    }
                }
            }
            break
        case "circle":
            {
                for (let i = 0; i < pointCount; i++) {
                    let deg = (i / pointCount)* Math.PI * 2
                    drawPoints.push([centerX+arena_x_2*Math.cos(deg), centerY+arena_y_2*Math.sin(deg)])
                }
            }
            break
        case "triangle":
            {
                let hypot = Math.sqrt((arena_x_2)**2 + arena_y**2)
                let lSpace = (arena_x + 2*hypot ) / pointCount
                let rat = arena_x_2 / arena_y
                for (let i = 0; i < pointCount; i++) {
                    offset = i*lSpace
                    if(offset < arena_x){
                        drawPoints.push([centerX+offset - arena_x_2, centerY+arena_y_2])
                    }
                    else if (offset < arena_x+hypot){
                        offset -= arena_x
                        let cY = offset / Math.sqrt(rat**2 + 1)
                        drawPoints.push([centerX+arena_x_2-cY*rat, centerY+arena_y_2 - cY])
                    }
                    else{
                        offset -= arena_x+hypot
                        let cY = offset / Math.sqrt(rat**2 + 1)
                        drawPoints.push([centerX-cY*rat, centerY-arena_y_2+cY])
                    }
                }
            }
            break
    }

    updScore()
}

function drawPoint(pos_x, pos_y, color){
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(pos_x, pos_y, pointSize, 0, 2 * Math.PI);
    ctx.fill();
}
function drawLine(fromX, fromY, toX, toY, col, dashed=[]){
    ctx.beginPath();
    ctx.strokeStyle = col;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dashed);
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.setLineDash([]);
}
function drawHighlight(x,y){
    ctx.beginPath();
    ctx.strokeStyle = COLOR_SELECTED;
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = lineWidth;
    ctx.arc(x, y, selectPointSize, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
}
function drawFrom(x,y){
    ctx.beginPath();
    ctx.strokeStyle = COLOR_FRIEDNLY;
    ctx.lineWidth = lineWidth;
    ctx.arc(x, y, selectPointSize, 0, 2 * Math.PI);
    ctx.stroke();
}

function drawLoop(){
    ctx.clearRect(0, 0, canvasW, canvasH);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const from = drawPoints[line[0]]
        const to = drawPoints[line[1]]
        const drawCol = friendlyLine(line2id(line)) ? COLOR_FRIEDNLY : COLOR_OPPONENT
        drawLine(from[0], from[1], to[0], to[1], drawCol)
    }

    if(fromDrawPoint != undefined && highlightedPoint != undefined) {
        let point = drawPoints[fromDrawPoint]
        let hPoint = drawPoints[highlightedPoint]
        drawLine(point[0], point[1], hPoint[0], hPoint[1], COLOR_FRIEDNLY, [10,10])
        const intersects = calculateIntersections(fromDrawPoint, highlightedPoint)
        for (let i = 0; i < intersects.length; i++) {
            const intersect = intersects[i];
            const i_f_p = drawPoints[intersect[0]]
            const i_t_p = drawPoints[intersect[1]]
            drawLine(i_f_p[0], i_f_p[1], i_t_p[0], i_t_p[1], COLOR_INTERSECT)
        }
        updIntersectCount(intersects.length)
    }
    else updIntersectCount(0)

    for (let i = 0; i < drawPoints.length; i++) {
        const coords = drawPoints[i];
        drawPoint(coords[0], coords[1], COLOR_POINT)
    }

    drawPoint(mousePos.x, mousePos.y, COLOR_SELECTED)

    
    if(fromDrawPoint != undefined) {
        let point = drawPoints[fromDrawPoint]
        drawFrom(point[0], point[1])
    }
    if(highlightedPoint != undefined) {
        let point = drawPoints[highlightedPoint]
        drawHighlight(point[0], point[1])
    }
    requestAnimationFrame(drawLoop)
}

function hasValidMoves(){
    let maxLineCount = pointCount*(pointCount-1)/2
    console.log("Has valid moves left: ", lines.length < maxLineCount)
    return lines.length < maxLineCount
}

function showResults(){
    // TODO
}

function chooseNextTurn(){
    let move = undefined
    switch(selectedAlg){
        case "minmax": 
            move = calculateMiniMax(getGamestate())
            break
        case "alpha-beta": 
            move = calculateAlphaBeta(getGamestate())
    }
    let chosenPoints = id2point(move2)
    console.log(`${selectedAlg}: Choosing ${chosenPoints[0]} ${chosenPoints[1]}`)
    makeAMove(chosenPoints[0], chosenPoints[1])

}

function makeAMove(from, to){
    for(i=0; i<lines.length; i++){
        if(
            from==lines[i][0] && to==lines[i][1] ||
            from==lines[i][1] && to==lines[i][0]
        ){
            return
        }
    }
    let intersects = calculateIntersections(from, to).length
    addFunctionalLine(from, to)
    playerScore[currentPlayer] += intersects?1:0
    onNextTurn()
}

function onNextTurn(){
    updScore()
    if(!hasValidMoves())
    {
        showResults()
        return
    }
    currentPlayer++
    if(currentPlayer == playerCount) currentPlayer == 0
    if(players[currentPlayer] != "human") chooseNextTurn()

}

drawLoop()
initGame()