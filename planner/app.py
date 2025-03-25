import sqlite3
from flask import Flask, g

app = Flask(__name__)

DATABASE = 'tasks.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

@app.route('/')
def index():
    # Example of using the database
    db = get_db()
    db.execute('CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY, task TEXT, completed BOOLEAN)')
    db.commit()
    return "Hello, welcome to Fenn's To-Do Dashboard!"

if __name__ == "__main__":
    app.run(debug=True)
