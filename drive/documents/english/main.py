import json
import os
import requests

with open("./json/words.json", "r") as file:
    words = json.load(file)

words_set: set[str] = set(words)

encrypted = "8cfdb18fe722929be89607beed58bab8aeb32b0939ff96b8"
when = "2025-01-27T12:41:36.901Z"

print("Count words")
words_folder = "./json/words"
words_files = os.listdir(words_folder)
existing: set[str] = set(
    [
        f.replace(".json", "")
        for f in words_files
        if os.path.isfile(os.path.join(words_folder, f))
    ]
)
print("Left words")
left_words_set: set[str] = words_set - existing
left_words: list[str] = [item for item in list(left_words_set) if item.startswith("u")]
left_words.sort()
left_words.reverse()
print(len(left_words))
for word in left_words:
    try:
        url = f"https://www.wordsapi.com/mashape/words/{word}?when={when}&encrypted={encrypted}"
        print(url)
        response = requests.get(url)
        word_json: dict = response.json()
        with open(f"./json/words/{word}.json", "w") as word_json_file:
            json.dump(word_json, word_json_file, indent=2)
    except Exception:
        print("error", word)
