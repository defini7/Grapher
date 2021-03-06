let graphs = new Map()
let inputWasChanged = false

function collectPointsFor(expr) {
    const { scale } = state

    const { x } = size
    const verticalSize = x / (50 * scale)
    const points_count = 1000 * verticalSize

    let points = []

    for (let i = 0; i <= points_count; i++) {
        try {
            let percent = (i / points_count * 2 - 1) * x * verticalSize
            alphas.x = percent * 0.01

            let result = math.evaluate(expr, alphas) * 100

            points.push({
                x: percent,
                y: -result
            })

        } catch (e) {
            if (inputWasChanged) {
                state.error = `${e}`
                inputWasChanged = false
            }
            break
        }
    }

    graphs.set(expr, points)
}

function drawGraph(expr, color = 'red', width = 3) {
    if (!context) return

    context.beginPath()
    context.strokeStyle = color
    context.lineWidth = width

    const points = graphs.get(expr)

    for (let i = 0; i < points.length; i++) {
        context[i ? 'lineTo' : 'moveTo'](points[i].x * state.scale + offset.x, points[i].y * state.scale + offset.y)
    }

    context.stroke()
    context.closePath()
}

function clear() {
    const { x, y, width, height } = size
    context.clearRect(-x, -y, width, height)
}

function drawAxis() {
    if (!context) return
    const { x, y } = size

    context.lineWidth = 2
    context.strokeStyle = '#222'

    context.beginPath()

    context.moveTo(-x, offset.y)
    context.lineTo(-x + offset.x, offset.y)

    context.moveTo(-x + offset.x, offset.y)
    context.lineTo(x + offset.x, offset.y)

    context.moveTo(x + offset.x, offset.y)
    context.lineTo(x, offset.y)

    context.moveTo(offset.x, -y)
    context.lineTo(offset.x, -y + offset.y)

    context.moveTo(offset.x, -y + offset.y)
    context.lineTo(offset.x, y + offset.y)

    context.moveTo(offset.x, y + offset.y)
    context.lineTo(offset.x, y)

    context.stroke()
    context.closePath()
}

function drawGrid(xSize = 10, ySize = 10) {
    if (!context) return

    const { x, y } = size
    const { scale } = state

    xSize *= scale
    ySize *= scale

    context.lineWidth = 1
    context.strokeStyle = '#eee'
    context.beginPath()

    for (let gX = 0; gX < x; gX += xSize) {
        for (let gY = 0; gY < y; gY += ySize) {
            const dX = gX + xSize
            const dY = gY + ySize

            context.moveTo(-dX + offset.x, offset.y)
            context.lineTo(-dX + offset.x, -dY + offset.y)

            context.moveTo(offset.x, -dY + offset.y)
            context.lineTo(-x + offset.x, -dY + offset.y)

            context.moveTo(dX + offset.x, offset.y)
            context.lineTo(dX + offset.x, -dY + offset.y)

            context.moveTo(offset.x, -dY + offset.y)
            context.lineTo(x + offset.x, -dY + offset.y)

            context.moveTo(-dX + offset.x, offset.y)
            context.lineTo(-dX + offset.x, dY + offset.y)

            context.moveTo(offset.x, dY + offset.y)
            context.lineTo(-x + offset.x, dY + offset.y)

            context.moveTo(dX + offset.x, offset.y)
            context.lineTo(dX + offset.x, dY + offset.y)

            context.moveTo(offset.x, dY + offset.y)
            context.lineTo(x + offset.x, dY + offset.y)
        }
    }

    context.stroke()
    context.closePath()
}


function resize() {
    const { offsetWidth: width, offsetHeight: height } = canvas

    size.width = canvas.width = width
    size.height = canvas.height = height

    size.x = width * 0.5
    size.y = height * 0.5

    context.translate(size.x, size.y)
    drawAll()
}

function drawAll() {
    clear()

    size.x += offset.x
    size.y += offset.y
    drawGrid(50, 50)
    size.x -= offset.x
    size.y -= offset.y

    size.x -= offset.x
    size.y -= offset.y
    drawGrid(50, 50)
    size.x += offset.x
    size.y += offset.y

    size.x += offset.x
    size.y -= offset.y
    drawGrid(50, 50)
    size.x -= offset.x
    size.y += offset.y

    size.x -= offset.x
    size.y += offset.y
    drawGrid(50, 50)
    size.x += offset.x
    size.y -= offset.y

    drawAxis()

    document.querySelector('[data-expressions]').querySelectorAll('.expression')
        .forEach(function (elem) {
            const expression = elem.querySelector('input[name="expression"]').value || ''
            const color = elem.querySelector('input[name="color"]').value || 'red'

            if (!expression) return

            try {
                drawGraph(expression, color)
            } catch (e) {
                console.log(e)
            }
        })
}
