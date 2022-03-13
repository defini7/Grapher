from datetime import datetime
from flask import render_template, session, redirect, request, flash, Flask
from werkzeug.security import check_password_hash, generate_password_hash
import database as db
from functools import wraps
import os
import json


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

@app.route('/', methods=["GET", "POST"])
def index():
    return render_template('index.html', expressions=[])

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

        return redirect('/')

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
@app.route('/save', methods=["POST"])
def save():
    responce = json.loads(request.data)
    dtb = db.get_db()

    for e in responce['expressions']:
        dtb.execute('INSERT INTO graphs(user_id, name, expression, color) VALUES(?, ?, ?, ?)', (session.get('user_id'), datetime.now().strftime('%Y-%m-%d %H-%M-%S'), e['exp'], e['col']))
        
    dtb.commit()

    return json.dumps({})

@login_required
@app.route('/load/<id>', methods=['GET', 'POST'])
def load(id):
    dtb = db.get_db()
    graph = [dict(r) for r in dtb.execute('SELECT * FROM graphs WHERE id = ? AND user_id = ?', (id, session.get('user_id'))).fetchall()][0]
    print(graph)
    return json.dumps(graph)

@login_required
@app.route('/library', methods=['GET', 'POST'])
def library():
    dtb = db.get_db()
    exps = [dict(r) for r in dtb.execute('SELECT * FROM graphs WHERE user_id = ?', (session.get('user_id'),)).fetchall()]

    return render_template('library.html', expressions=exps)

if __name__ == "__main__":
    app.run()