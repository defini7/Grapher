let canvas, context, errorElement, appendBtnElement, drawBtnElement, state

let size = {
    width: 0,
    height: 0,
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

    state.error = ''

    document.querySelector('[data-expressions]').querySelectorAll('.expression')
        .forEach(function (elem) {
            const expression = elem.querySelector('input[name="expression"]').value.toLowerCase() || ''
            const color = elem.querySelector('input[name="color"]').value || 'red'

            if (!expression) return

            try {
                drawGraph(expression, color)
            } catch (e) {
                state.error += `${e}`
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

    } catch (e) { }
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

    context.moveTo(-x, 0)
    context.lineTo(x, 0)

    context.moveTo(0, -y)
    context.lineTo(0, y)

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

            context.moveTo(gX, gY)
            context.lineTo(gX, dY)

            context.moveTo(gX, gY)
            context.lineTo(gX, -dY)

            context.moveTo(-gX, gY)
            context.lineTo(-gX, dY)

            context.moveTo(-gX, gY)
            context.lineTo(-gX, -dY)

            context.moveTo(gX, gY)
            context.lineTo(dX, gY)

            context.moveTo(gX, gY)
            context.lineTo(-dX, gY)

            context.moveTo(gX, -gY)
            context.lineTo(dX, -gY)

            context.moveTo(gX, -gY)
            context.lineTo(-dX, -gY)
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

window.onload = function () {
    canvas = document.getElementById('canvas')
    context = canvas.getContext('2d')

    errorElement = document.querySelector('[data-error]')
    appendBtnElement = document.querySelector('[data-append]')
    drawBtnElement = document.querySelector('[data-draw]')

    state = new Proxy({
        scale: 1,
        error: '',
        ...restoreState()
    }, {
        get(target, key) {
            return target[key]
        },
        set(target, key, value) {
            target[key] = value
            saveState()

            switch (key) {
                case 'scale': {
                    drawAll()
                    break
                }

                case 'error': {
                    if (value) {
                        errorElement.removeAttribute('hidden')
                    }
                    else {
                        errorElement.hidden = true
                        errorElement.innerText = value
                    }
                    break
                }
            }

            return true
        }
    })

    resize()
    addEventListener('resize', resize)
    canvas.addEventListener('wheel', wheel)
    errorElement.innerText = state.error
    appendBtnElement.addEventListener('click', appendRow)
    drawBtnElement.addEventListener('click', onDrawClick)
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

async function load() {
    console.log('All works')
    const responce = await fetch('/load', {
        method: 'GET',
    })

    if (responce.ok) {
        responce.json().then(result => result.forEach(graph => {
            appendRow()
            let elems = document.querySelector('[data-expressions]').querySelectorAll('.expression')
            elems[elems.length - 1].querySelector('input[name="expression"]').value = graph.expression
            elems[elems.length - 1].querySelector('input[name="color"]').value = graph.color
        }))

        let old_elems = document.querySelector('[data-expressions]').querySelectorAll('.expression')
        window.location.href = '/'
        document.querySelector('[data-expressions]').querySelectorAll('.expression') = old_elems
    }
}