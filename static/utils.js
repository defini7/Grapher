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

function getMousePos(canvas, evt) {
    let rect = canvas.getBoundingClientRect()
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    }
}

function isAlpha(val) {
    return /^[a-zA-Z]*$/gi.test(val)
}

function setDefaultAlphas() {
    for (key in alphas) {
        alphas[key] = 1
    }
}

function wheel(e) {
    let { scale } = state

    scale += e.deltaY * 0.005
    setScale(scale)
}

function setScale(value) {
    state.scale = Math.min(10, Math.max(value, 0.4))
}

function save() {
    let data = { expressions: [] }

    document.querySelector('[data-expressions]').querySelectorAll('.expression')
        .forEach(elem => {
            const expression = elem.querySelector('input[name="expression"]').value.toLowerCase() || ''
            const color = elem.querySelector('input[name="color"]').value || '#00000'

            clear()
            setDefaultAlphas()
            collectPointsFor(expression)
            drawGraph(expression, color, 10)

            const url = canvas.toDataURL()
            console.log(url)

            data.expressions.push({ exp: expression, col: color, date: Date.now(), bin: url })
        })
        
    fetch('/save', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
    })

    drawAll()
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

function saveState() {
    localStorage.setItem('local-state', JSON.stringify({ ...state }))
}