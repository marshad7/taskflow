import os
import google.generativeai as genai
from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-2.5-flash")


def build_prompt(tasks):
    today = __import__("datetime").date.today().isoformat()

    if not tasks:
        return "The user has no tasks. Encourage them to add some and keep it brief."

    lines = []
    for t in tasks:
        due = t.get("due_date", "")
        due_str = f", due {due[:10]}" if due else ""
        lines.append(
            f"- [{t.get('priority', 'medium')} priority] {t.get('title', 'Untitled')}"
            f"{due_str} — status: {t.get('status', 'todo')}"
        )

    task_list = "\n".join(lines)

    return f"""Today is {today}. Here are the user's tasks:

{task_list}

Give them a focused, practical daily plan. Be direct and concise — no more than 150 words. Tell them exactly what to work on today and why, based on priority, due dates, and status. Use plain text, no markdown."""


@app.route("/plan", methods=["POST"])
def plan():
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Invalid JSON"}), 400

    tasks = data.get("tasks", [])
    response = model.generate_content(build_prompt(tasks))
    return jsonify({"plan": response.text})


@app.route("/health")
def health():
    return "ok"


if __name__ == "__main__":
    app.run(port=5001, debug=os.environ.get("FLASK_ENV") == "development")
