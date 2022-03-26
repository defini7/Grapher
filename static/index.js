let canvas, context, errorElement, appendBtnElement, drawBtnElement, state

let size = {
    width: 0,
    height: 0,
    x: 0,
    y: 0
}

let elems;

let startPan = {
    x: 0,
    y: 0
}

let panStarted = false;

let offset = {
    x: 0,
    y: 0
}

function appendRow() {
    if (!document.querySelector('[data-template]')) return
    const clone = document.querySelector('[data-template]').cloneNode(true)
    clone.querySelector('[data-delete]').addEventListener('click', _ => {
        clone.remove()
        drawAll()
    })
    clone.removeAttribute('hidden')
    document.querySelector('[data-expressions]').appendChild(clone)
    drawAll()
}

function drawAll() {
    clear()
    drawGrid(50)
    drawAxis()

    document.querySelector('[data-expressions]').querySelectorAll('.expression')
        .forEach(function (elem) {
            const expression = elem.querySelector('input[name="expression"]').value.toLowerCase() || ''
            const color = elem.querySelector('input[name="color"]').value || 'red'

            if (!expression) return

            try {
                drawGraph(expression, color)
            } catch (e) {
                console.log(e)
            }
        })
}

function clear() {
    const { x, y, width, height } = size
    context?.clearRect(-x, -y, width, height)
}

function restoreState() {
    try {
        const data = JSON.parse(localStorage.getItem('local-state') ?? '')

        if (typeof data == 'object' && !Array.isArray(data))
            return data

    } catch (e) {
        console.log(e)
    }
    return {}
}

function saveState() {
    localStorage.setItem('local-state', JSON.stringify({ ...state }));
}

function resize() {
    const { offsetWidth: width, offsetHeight: height } = canvas
    size.width = canvas.width = width
    size.height = canvas.height = height
    size.x = width * 0.5
    size.y = height * 0.5
    context?.translate(size.x, size.y)
    drawAll()
}

function drawAxis() {
    if (!context) return
    const { x, y } = size

    context.beginPath()
    context.lineWidth = 2
    context.strokeStyle = '#222'

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

function drawGrid(xSize = 10, ySize = xSize) {
    if (!context) return

    const { x, y } = size
    const { scale } = state

    context.lineWidth = 1

    xSize *= scale
    ySize *= scale
    context.beginPath()
    context.lineWidth = 1
    context.strokeStyle = '#eee'
    for (let gX = 0; gX < x; gX += xSize) {
        for (let gY = 0; gY < y; gY += ySize) {
            const dX = gX + xSize
            const dY = gY + ySize

            context.moveTo(gX + offset.x, gY + offset.y)
            context.lineTo(gX + offset.x, dY + offset.y)

            context.moveTo(gX + offset.x, gY + offset.y)
            context.lineTo(gX + offset.x, -dY + offset.y)

            context.moveTo(gX + offset.x, gY)
            context.lineTo(gX + offset.x, -dY)

            context.moveTo(gX + offset.x, gY)
            context.lineTo(gX + offset.x, dY)

            //////

            context.moveTo(-gX + offset.x, gY + offset.y)
            context.lineTo(-gX + offset.x, dY + offset.y)

            context.moveTo(-gX + offset.x, gY + offset.y)
            context.lineTo(-gX + offset.x, -dY + offset.y)

            context.moveTo(-gX + offset.x, gY)
            context.lineTo(-gX + offset.x, dY)

            context.moveTo(-gX + offset.x, gY)
            context.lineTo(-gX + offset.x, -dY)

            //////

            context.moveTo(gX + offset.x, gY + offset.y)
            context.lineTo(dX + offset.x, gY + offset.y)

            context.moveTo(gX + offset.x, gY + offset.y)
            context.lineTo(-dX + offset.x, gY + offset.y)

            context.moveTo(gX, gY + offset.y)
            context.lineTo(dX, gY + offset.y)

            context.moveTo(gX, gY + offset.y)
            context.lineTo(-dX, gY + offset.y)

            //////

            context.moveTo(gX + offset.x, -gY + offset.y)
            context.lineTo(dX + offset.x, -gY + offset.y)

            context.moveTo(gX + offset.x, -gY + offset.y)
            context.lineTo(-dX + offset.x, -gY + offset.y)

            context.moveTo(gX, -gY + offset.y)
            context.lineTo(dX, -gY + offset.y)

            context.moveTo(gX, -gY + offset.y)
            context.lineTo(-dX, -gY + offset.y)
        }
    }
    context.stroke()
    context.closePath()
}

function onDrawClick(e) {
    if (e instanceof KeyboardEvent) {
        if (e.key == 'Enter')
            onDrawClick();
    } else {
        state.error = '';
        drawAll();
    }
}

function drawGraph(expression, color = 'red', width = 3) {
    const { scale } = state
    if (!context || !expression) return

    const { x } = size
    const verticalSize = (x / (50 * scale))
    const points = 100 * verticalSize

    context.beginPath()
    context.strokeStyle = color
    context.lineWidth = width

    for (let i = 0; i <= points; i++) {
        try {
            let percent = (i / points * 2 - 1) * x * verticalSize
            let result = math.evaluate(expression, { x: percent * 0.01 }) * 100

            context[i ? 'lineTo' : 'moveTo'](percent * scale, -result * scale)
        } catch (e) {
            state.error = `${e}`
            break
        }
    }

    context.stroke()

    context.closePath()
}

function wheel(e) {
    let { scale } = state

    scale += e.deltaY * 0.02
    state.scale = Math.min(4, Math.max(scale, 0.5))
}

function getMousePos(canvas, evt) {
    let rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    }
}

window.onload = function () {
    canvas = document.getElementById('canvas')
    if (canvas) {
        context = canvas.getContext('2d')

        canvas.addEventListener('mousedown', function (evt) {
            startPan = getMousePos(canvas, evt)
            panStarted = true
        })

        canvas.addEventListener('mousemove', function (evt) {
            if (panStarted) {
                let mouse = getMousePos(canvas, evt)
                offset.x = mouse.x - startPan.x
                offset.y = mouse.y - startPan.y
            }
            drawAll()
        })

        canvas.addEventListener('mouseup', function (evt) {
            panStarted = false
        })
    }

    errorElement = document.querySelector('[data-error]')
    appendBtnElement = document.querySelector('[data-append]')
    drawBtnElement = document.querySelector('[data-draw]')

    state = new Proxy({
        scale: 1,
        ...restoreState()
    }, {
        get(target, key) {
            return target[key]
        },
        set(target, key, value) {
            target[key] = value
            saveState()

            if (key == 'scale')
                drawAll()

            return true
        }
    })

    if (context) {
        resize()
        addEventListener('resize', resize)
    }

    if (canvas) {
        canvas.addEventListener('wheel', wheel)
        errorElement.innerText = state.error
        appendBtnElement.addEventListener('click', appendRow)
        drawBtnElement.addEventListener('click', onDrawClick)
    }
}

function save() {
    let data = { expressions: [] }

    document.querySelector('[data-expressions]').querySelectorAll('.expression')
        .forEach(function (elem) {
            const expression = elem.querySelector('input[name="expression"]').value.toLowerCase() || ''
            const color = elem.querySelector('input[name="color"]').value || 'red'

            data.expressions.push({ exp: expression, col: color })
        })

    fetch('/save', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
    })
}

function load() {
    let ids = []

    const expressions = document.querySelector('div[id=all-expressions]').querySelectorAll('div')
    expressions.forEach(exp => {
        const inputs = exp.getElementsByTagName('input')
        const checkbox = inputs[inputs.length - 1]

        if (checkbox.checked) ids.push(checkbox.value)
    })

    document.getElementById('ids').value = ids.join(' ')

    document.getElementById('form-library').submit()
}

function delete_graph(id) {
    fetch('/delete/' + id, {
        method: 'POST'
    })
    document.getElementById(id).remove()
    window.location.replace('/library')
}