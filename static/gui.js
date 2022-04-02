function appendRow() {
    if (!document.querySelector('[data-template]')) return
    const clone = document.querySelector('[data-template]').cloneNode(true)

    function update() {
        const divs = document.getElementsByClassName('div-slider')
        for (let i = 0; i < divs.length; i++) {
            divs[i].remove()
        }

        const exprs = document.getElementsByClassName('expression')

        for (let j = 1; j < exprs.length; j++) {
            const expr = exprs[j].querySelector('input[name=expression]').value

            //console.log(expr)

            for (let i = 0; i < expr.length; i++) {
                if (isAlpha(expr[i]) && (!isAlpha(expr[i - 1]) || expr[i - 1] == undefined) && (!isAlpha(expr[i + 1]) || expr[i + 1] == undefined)) {
                    let s = document.getElementById(expr[i])
                    if (s == null) {
                        if (expr[i] != 'x') {
                            let slider = document.createElement('input')
                            let name = document.createElement('b')
                            let div = document.createElement('div')

                            name.innerHTML = expr[i]

                            div.setAttribute('class', 'div-slider')
                            div.setAttribute('id', 'div-' + expr[i])

                            console.log(expr)

                            slider.setAttribute('type', 'range')
                            slider.setAttribute('min', '-10')
                            slider.setAttribute('max', '10')
                            slider.setAttribute('value', '1')
                            slider.setAttribute('id', expr[i])
                            slider.setAttribute('class', 'slider')
                            slider.addEventListener('input', evt => {
                                alphas[evt.target.id] = evt.target.value
                                collectPointsFor(expr)
                                drawAll()
                            })

                            div.appendChild(name)
                            div.appendChild(slider)

                            document.querySelector('div[data-expressions]').appendChild(div)

                            alphas[expr[i]] = 1
                        }
                    } else {
                        alphas[expr[i]] = s.value
                    }
                }
            }

            collectPointsFor(expr)
        }

        drawAll()
    }

    clone.addEventListener('change', _ => {
        update()
    })

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

function setDefault(_) {
    state.scale = 1;
    state.error = '';

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
    fetch('/delete/' + id, {
        method: 'POST'
    })

    document.getElementById(id).remove()
    window.location.replace('/library')
}