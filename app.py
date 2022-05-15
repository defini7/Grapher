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
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function

@app.route('/', defaults={'ids': None})
@app.route('/<ids>', methods=["GET", "POST"])
def index(ids):
    exps = []

    if ids is not None and ids != 'favicon.ico':
        dtb = db.get_db()
        exps = [dict(dtb.execute('SELECT * FROM graphs WHERE id = ?', (id,)).fetchall()[0]) for id in ids.split('-')]

    return render_template('index.html', expressions=exps)

@app.route('/signin', methods=["GET", "POST"])
def signin():
    session.clear()

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        if username is None or password is None:
            flash('Please provide all data!')
            return render_template('signin.html')

        dtb = db.get_db()

        userdata = dtb.execute('SELECT * FROM users WHERE name = ?', (username,)).fetchone()

        if userdata is None or not check_password_hash(userdata['password'], password):
            flash('Invalid name or password!')
            return render_template('signin.html')

        session['user_id'] = userdata['id']

        return redirect('/#')

    return render_template('signin.html')

@app.route('/signup', methods=["GET", "POST"])
def signup():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        confirmation = request.form.get('confirmation')

        if not username or not password or not confirmation:
            flash('Please provide all data!')
            return render_template('signup.html')

        if password != confirmation:
            flash('Password and confirmation are different!')
            return render_template('signup.html')

        dtb = db.get_db()

        exist = dtb.execute('SELECT name FROM users WHERE name = ?', (username,)).fetchone()

        if exist:
            flash('User already exists!')
            return render_template('signup.html')

        dtb.execute('INSERT INTO users(name, password) VALUES(?, ?)', (username, generate_password_hash(password)))
        dtb.commit()

        return redirect('/signin')

    return render_template('signup.html')

@login_required
@app.route('/signout', methods=["GET", "POST"])
def signout():
    session.clear()
    return redirect('/')

@login_required
@app.post('/save')
def save():
    responce = loads(request.data)
    dtb = db.get_db()

    for e in responce['expressions']:
        with open(os.path.join('static', 'img', str(e['date']) + '-' + str(session.get('user_id')) + '.png'), 'wb') as f:
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
    exps = [dict(r) for r in dtb.execute('SELECT * FROM graphs WHERE user_id = ?', (session.get('user_id'),)).fetchall()]

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
        os.remove(os.getcwd() + url_for('static', filename='img/'+ name + '-' + str(session.get('user_id')) +'.png'))

        dtb.execute('DELETE FROM graphs WHERE id = ?', (id,))
        dtb.commit()

    return jsonify({})

if __name__ == "__main__":
    app.run()