let canvas = null
let context = null
let state = null

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
    'a': 1, 'b': 1, 'c': 1, 'd': 1, 'e': 1,
    'f': 1, 'g': 1, 'h': 1, 'i': 1, 'j': 1,
    'k': 1, 'l': 1, 'm': 1, 'n': 1, 'o': 1,
    'p': 1, 'q': 1, 'r': 1, 's': 1, 't': 1,
    'u': 1, 'v': 1, 'w': 1, 'x': 1, 'z': 1
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

        canvas.addEventListener('mouseup', _ => {
            panStarted = false
        })

        let errorElement = document.querySelector('[data-error]')
        let appendBtnElement = document.querySelector('[data-append]')

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

        setDefault()

        resize()
        addEventListener('resize', resize)
        canvas.addEventListener('wheel', wheel)
        errorElement.innerText = state.error
        appendBtnElement.addEventListener('click', appendRow)

        errorElement.addEventListener('animationend', () => {
            document.querySelector('div[id=div-error] button').removeAttribute('hidden')
        })

        document.querySelector('[data-draw]').addEventListener('click', updateGraphs)

        updateGraphs()
    }
}