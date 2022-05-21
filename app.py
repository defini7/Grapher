from flask import render_template, session, redirect, request, flash, Flask, jsonify, url_for
from werkzeug.security import check_password_hash, generate_password_hash
import database as db
from functools import wraps
import os
from json import loads
from binascii import a2b_base64

app = Flask(__name__)
app.secret_key = os.urandom(24)

db.init_app(app)

app.app_context().push()


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get('user_id') is None:
            return redirect('/login')
        return f(*args, **kwargs)

    return decorated_function


@app.route('/', defaults={'ids': None})
@app.route('/<ids>', methods=['GET', 'POST'])
def index(ids):
    exps = []

    if ids is not None and ids != 'favicon.ico':
        dtb = db.get_db()
        ids = ids.split('-')

        if len(ids) > 0:
            exps = [dict(dtb.execute('SELECT * FROM graphs WHERE id = ?', (id,)).fetchall()[0]) for id in ids]

    return render_template('index.html', expressions=exps)


@app.route('/sign_in', methods=['GET', 'POST'])
def sign_in():
    session.clear()

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        if username is None or password is None:
            flash('Please provide all data!')
            return render_template('sign_in.html')

        dtb = db.get_db()

        userdata = dtb.execute('SELECT * FROM users WHERE name = ?', (username,)).fetchone()

        if userdata is None or not check_password_hash(userdata['password'], password):
            flash('Invalid name or password!')
            return render_template('sign_in.html')

        session['user_id'] = userdata['id']

        return redirect('/#')

    return render_template('sign_in.html')


@app.route('/sign_up', methods=['GET', 'POST'])
def sign_up():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        confirmation = request.form.get('confirmation')

        if not username or not password or not confirmation:
            flash('Please provide all data!')
            return render_template('sign_up.html')

        if password != confirmation:
            flash('Password and confirmation are different!')
            return render_template('sign_up.html')

        dtb = db.get_db()

        exist = dtb.execute('SELECT name FROM users WHERE name = ?', (username,)).fetchone()

        if exist:
            flash('User already exists!')
            return render_template('sign_up.html')

        dtb.execute('INSERT INTO users(name, password) VALUES(?, ?)', (username, generate_password_hash(password)))
        dtb.commit()

        return redirect('/sign_in')

    return render_template('sign_up.html')


@login_required
@app.route('/sign_out', methods=['GET', 'POST'])
def sign_out():
    session.clear()
    return redirect('/')


@login_required
@app.route('/change_password', methods=['GET', 'POST'])
def change_password():
    if request.method == 'POST':
        dtb = db.get_db()

        old_pass = request.form.get('old-pass')
        new_pass = request.form.get('new-pass')
        confirm_pass = request.form.get('confirm-pass')

        if not old_pass or not new_pass or not confirm_pass:
            flash('Please provide all data!')
            return render_template('change_password.html')

        user_id = session.get('user_id')
        user_pwd = dtb.execute('SELECT password FROM users WHERE id = ?', (user_id,)).fetchone()[0]

        if not check_password_hash(user_pwd, old_pass):
            flash('Invalid current password!')
            return render_template('change_password.html')

        if new_pass != confirm_pass:
            flash('Password and confirmation are different!')
            return render_template('change_password.html')

        dtb.execute('UPDATE users SET password = ? WHERE id = ?', (generate_password_hash(new_pass), user_id))
        dtb.commit()

        return redirect('/')

    return render_template('change_password.html')


@login_required
@app.post('/save')
def save():
    dtb = db.get_db()

    for e in loads(request.data)['expressions']:
        with open(os.path.join('static', 'img', str(e['date']) + '-' + str(session.get('user_id')) + '.png'),
                  'wb') as f:
            in_binary = a2b_base64(e['bin'].split(',')[1])
            f.write(in_binary)

        dtb.execute(
            'INSERT INTO graphs(user_id, name, expression, color) VALUES(?, ?, ?, ?)',
            (session.get('user_id'), e['date'], e['exp'], e['col'])
        )

    dtb.commit()

    return jsonify({})


@login_required
@app.route('/load/<id>', methods=['GET', 'POST'])
def load(id):
    dtb = db.get_db()
    graph = dtb.execute('SELECT * FROM graphs WHERE id = ? AND user_id = ?', (id, session.get('user_id'))).fetchone()[0]
    return jsonify(graph)


@login_required
@app.route('/library', methods=['GET', 'POST'])
def library():
    dtb = db.get_db()
    exps = [dict(r) for r in
            dtb.execute('SELECT * FROM graphs WHERE user_id = ?', (session.get('user_id'),)).fetchall()]

    if request.method == 'POST':
        ids = request.form.get('secret-field')
        return redirect('/' + ids.replace(' ', '-'))

    return render_template('library.html', expressions=exps)


@login_required
@app.post('/delete/<id>')
def delete(id):
    dtb = db.get_db()

    user_id = dtb.execute('SELECT user_id FROM graphs WHERE id = ?', (id,)).fetchone()[0]

    if user_id == session.get('user_id'):
        name = dtb.execute('SELECT name FROM graphs WHERE id = ?', (id,)).fetchone()[0]
        os.remove(os.getcwd() + url_for('static', filename='img/' + name + '-' + str(session.get('user_id')) + '.png'))

        dtb.execute('DELETE FROM graphs WHERE id = ?', (id,))
        dtb.commit()

    return jsonify({})


if __name__ == '__main__':
    app.run(host='192.168.1.10', port=5000)
