function updateGraphs() {
    const divs = document.getElementsByClassName('div-slider')
    for (let i = 0; i < divs.length; i++) {
        divs[i].remove()
    }

    const expressions = document.getElementsByClassName('expression')

    for (let j = 1; j < expressions.length; j++) {
        const e = expressions[j].querySelector('input[name=expression]').value

        for (let i = 0; i < e.length; i++) {
            if (isAlpha(e[i]) && (!isAlpha(e[i - 1]) || e[i - 1] === undefined) && (!isAlpha(e[i + 1]) || e[i + 1] === undefined)) {
                let s = document.getElementById(e[i])
                if (s == null) {
                    if (e[i] !== 'x') {
                        let slider = document.createElement('input')
                        let name = document.createElement('b')
                        let div = document.createElement('div')
                        let value = document.createElement('b')

                        name.innerHTML = e[i]

                        div.setAttribute('class', 'div-slider')
                        div.setAttribute('id', 'div-' + e[i])

                        slider.setAttribute('type', 'range')
                        slider.setAttribute('min', '-10')
                        slider.setAttribute('max', '10')
                        slider.setAttribute('step', '0.1')
                        slider.setAttribute('value', '1')
                        slider.setAttribute('id', e[i])
                        slider.setAttribute('class', 'slider')
                        slider.addEventListener('input', evt => {
                            value.innerHTML = slider.value
                            alphas[evt.target.id] = evt.target.value
                            collectPointsFor(e)
                            drawAll()
                        })

                        value.innerHTML = slider.value
                        value.setAttribute('class', 'div-b-slider-value')

                        div.appendChild(name)
                        div.appendChild(slider)
                        div.appendChild(value)

                        document.querySelector('div[data-expressions]').appendChild(div)

                        alphas[e[i]] = 1
                    }
                } else {
                    alphas[e[i]] = s.value
                }
            }
        }

        collectPointsFor(e)
    }

    drawAll()
}

function appendRow() {
    if (!document.querySelector('[data-template]')) return
    const clone = document.querySelector('[data-template]').cloneNode(true)

    clone.querySelector('[data-delete]').addEventListener('click', _ => {
        const expr = clone.querySelector('input[name="expression"]').value
        for (let i = 0; i < expr.length; i++) {
            let s = document.getElementById('div-' + expr[i])
            if (s != null) s.remove()
        }

        clone.remove()
        drawAll()
    })

    clone.removeAttribute('hidden')
    document.querySelector('[data-expressions]').appendChild(clone)
}

function setDefault() {
    state.scale = 1
    state.error = ''

    offset.x = 0
    offset.y = 0

    size.width = 0
    size.height = 0

    size.x = 0
    size.y = 0

    startPan.x = 0
    startPan.y = 0

    panStarted = false

    resize()
}

function hideError() {
    document.querySelector('div[id=div-error]').setAttribute('hidden', '')
    document.querySelector('div[id=div-error] button').setAttribute('hidden', '')
}

function deleteGraph(id) {
    document.getElementById(id).remove()

    fetch('/delete/' + id, {
        method: 'POST'
    })
}