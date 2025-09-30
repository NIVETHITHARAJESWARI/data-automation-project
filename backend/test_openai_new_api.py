# test_openai_safe.py

import openai
import os

# 1️⃣ Read API key from environment variable
api_key = os.getenv("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")  # This must match the environment variable name
if not api_key:
    raise ValueError("Please set your OPENAI_API_KEY environment variable.")

openai.api_key = api_key

# 2️⃣ Create a chat completion
try:
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",  # Works for all accounts
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello! How are you?"}
        ]
    )

    # 3️⃣ Print the assistant's reply
    print("Assistant says:", response.choices[0].message.content)

except Exception as e:
    print("Error:", e)
