import sqlite3
import click
from flask import g, current_app
from flask.cli import with_appcontext
import os

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(
            os.path.abspath('graphs.db'),
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row

    return g.db


def close_db(e=None):
    db = g.pop('db', None)

    if db is not None:
        db.close()


def init_db():
    db = get_db()

    schema = current_app.open_resource('schema.sql')
    db.executescript(schema.read().decode('utf-8'))
    schema.close()


@click.command('init-db')
@with_appcontext
def init_db_command():
    init_db()
    click.echo('Database was successfuly initialized!')


def init_app(app):
    app.teardown_appcontext(close_db)
    app.cli.add_command(init_db_command)
