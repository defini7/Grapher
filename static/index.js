let canvas, context, errorElement, appendBtnElement, drawBtnElement, state, elems

let size = {
    width: 0,
    height: 0,
    x: 0,
    y: 0
}

let startPan = {
    x: 0,
    y: 0
}

let panStarted = false

let offset = {
    x: 0,
    y: 0
}

let alphas = {
    'a': 0, 'b': 0, 'c': 0, 'd': 0, 'e': 0,
    'f': 0, 'g': 0, 'h': 0, 'i': 0, 'j': 0,
    'k': 0, 'l': 0, 'm': 0, 'n': 0, 'o': 0,
    'p': 0, 'q': 0, 'r': 0, 's': 0, 't': 0,
    'u': 0, 'v': 0, 'w': 0, 'x': 0, 'z': 0
}

function appendRow() {
    if (!document.querySelector('[data-template]')) return
    const clone = document.querySelector('[data-template]').cloneNode(true)

    clone.querySelector('input[name="expression"]').addEventListener('change', _ => {
        document.querySelectorAll('div[class=div-slider]')
            .forEach(elem => {
                elem.remove()
            })
    })

    clone.querySelector('[data-delete]').addEventListener('click', _ => {
        let expr = clone.querySelector('input[name="expression"]').value
        for (let i = 0; i < expr.length; i++) {
            let s = document.getElementById('div-' + expr[i])
            if (s != null) {
                s.remove()
            }
        }

        clone.remove()
        drawAll()
    })

    clone.removeAttribute('hidden')
    document.querySelector('[data-expressions]').appendChild(clone)
}

function getMousePos(canvas, evt) {
    let rect = canvas.getBoundingClientRect()
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    }
}

function drawAll() {
    clear()

    size.x += offset.x
    size.y += offset.y
    drawGrid(50)
    size.x -= offset.x
    size.y -= offset.y

    size.x -= offset.x
    size.y -= offset.y
    drawGrid(50)
    size.x += offset.x
    size.y += offset.y

    size.x += offset.x
    size.y -= offset.y
    drawGrid(50)
    size.x -= offset.x
    size.y += offset.y

    size.x -= offset.x
    size.y += offset.y
    drawGrid(50)
    size.x += offset.x
    size.y -= offset.y

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
    context.clearRect(-x, -y, width, height)
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
    localStorage.setItem('local-state', JSON.stringify({ ...state }))
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

function drawGrid(xSize = 10, ySize = xSize) {
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

            /* top left */

            // vertical
            context.moveTo(-dX + offset.x, offset.y)
            context.lineTo(-dX + offset.x, -dY + offset.y)

            // horizontal
            context.moveTo(offset.x, -dY + offset.y)
            context.lineTo(-x + offset.x, -dY + offset.y)

            /* top right */

            // vertical
            context.moveTo(dX + offset.x, offset.y)
            context.lineTo(dX + offset.x, -dY + offset.y)

            // horizontal
            context.moveTo(offset.x, -dY + offset.y)
            context.lineTo(x + offset.x, -dY + offset.y)

            /* bottom left */

            // vertical
            context.moveTo(-dX + offset.x, offset.y)
            context.lineTo(-dX + offset.x, dY + offset.y)

            // horizontal
            context.moveTo(offset.x, dY + offset.y)
            context.lineTo(-x + offset.x, dY + offset.y)

            /* bottom right */

            // vertical
            context.moveTo(dX + offset.x, offset.y)
            context.lineTo(dX + offset.x, dY + offset.y)

            // horizontal
            context.moveTo(offset.x, dY + offset.y)
            context.lineTo(x + offset.x, dY + offset.y)
        }
    }

    context.stroke()
    context.closePath()
}

function onDrawClick(e) {
    if (e instanceof KeyboardEvent) {
        if (e.key == 'Enter')
            onDrawClick()
    } else {
        state.error = ''
        drawAll()
    }
}

function isAlpha(val) {
    return /^[a-zA-Z]*$/gi.test(val)
}

function drawGraph(expression, color = 'red', width = 3) {
    const { scale } = state
    if (!context || !expression) return

    const { x } = size
    const verticalSize = x / (50 * scale)
    const points = 100 * verticalSize

    context.beginPath()
    context.strokeStyle = color
    context.lineWidth = width

    for (let i = 0; i < expression.length; i++) {
        if (isAlpha(expression[i]) && (!isAlpha(expression[i - 1]) || expression[i - 1] == undefined) && (!isAlpha(expression[i + 1]) || expression[i + 1] == undefined)) {
            let s = document.getElementById(expression[i])
            if (s == null) {
                if (expression[i] != 'x') {
                    let slider = document.createElement('input')
                    let name = document.createElement('b')
                    let div = document.createElement('div')

                    name.innerHTML = expression[i]

                    div.setAttribute('class', 'div-slider')
                    div.setAttribute('id', 'div-' + expression[i])

                    slider.setAttribute('type', 'range')
                    slider.setAttribute('min', '-10')
                    slider.setAttribute('max', '10')
                    slider.setAttribute('value', '0')
                    slider.setAttribute('id', expression[i])
                    slider.setAttribute('class', 'slider')
                    slider.addEventListener('input', _ => {
                        drawAll()
                    })

                    div.appendChild(name)
                    div.appendChild(slider)
                    document.querySelector('div[data-expressions]').appendChild(div)

                    alphas[expression[i]] = 0
                }
            } else {
                alphas[expression[i]] = s.value
            }
        }
    }

    for (let i = 0; i <= points; i++) {
        try {
            let percent = (i / points * 2 - 1) * x * verticalSize
            alphas.x = percent * 0.01
            let result = math.evaluate(expression, alphas) * 100

            context[i ? 'lineTo' : 'moveTo'](percent * scale + offset.x, -result * scale + offset.y)
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

    scale += e.deltaY * 0.005
    state.scale = Math.min(10, Math.max(scale, 0.4))
}

window.onload = function () {
    canvas = document.getElementById('canvas')

    if (canvas) {
        context = canvas.getContext('2d')

        canvas.addEventListener('mousedown', evt => {
            startPan = getMousePos(canvas, evt)
            panStarted = true
        })

        canvas.addEventListener('mousemove', evt => {
            if (panStarted) {
                let mouse = getMousePos(canvas, evt)
                offset.x -= startPan.x - mouse.x
                offset.y -= startPan.y - mouse.y
                drawAll()
                startPan = mouse
            }
        })

        canvas.addEventListener('mouseup', evt => {
            panStarted = false
        })
    }

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

            if (key == 'scale')
                drawAll()

            if (key == 'error') {
                if (value != '') {
                    document.querySelector('div[id=div-error]').removeAttribute('hidden')
                    document.querySelector('p[data-error]').innerHTML = state.error
                }
            }

            return true
        }
    })

    if (canvas) {
        resize()
        addEventListener('resize', resize)
        canvas.addEventListener('wheel', wheel)
        errorElement.innerText = state.error
        appendBtnElement.addEventListener('click', appendRow)
        drawBtnElement.addEventListener('click', onDrawClick)
    }

    document.querySelector('p[data-error]').addEventListener('animationend', () => {
        document.querySelector('div[id=div-error] input').removeAttribute('hidden')
    })
}

function save() {
    let data = { expressions: [] }

    document.querySelector('[data-expressions]').querySelectorAll('.expression')
        .forEach(elem => {
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

function deleteGraph(id) {
    fetch('/delete/' + id, {
        method: 'POST'
    })

    document.getElementById(id).remove()
    window.location.replace('/library')
}

function hideError() {
    document.querySelector('div[id=div-error]').setAttribute('hidden', '')
    document.querySelector('div[id=div-error] input').setAttribute('hidden', '')
}