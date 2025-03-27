import asyncio
from aiohttp import ClientSession
import json
import nest_asyncio
import pandas
import tqdm.asyncio
from tqdm.notebook import tqdm as tqdm_notebook

person_file = open("data/person_ids_03_13_2023.json", "r")
person_file_content = person_file.read()
json_lines = person_file_content.split("\n")
print(len(json_lines))
actors: list[dict] = []
for json_line in json_lines:
    if json_line == "":
        continue
    try:
        actor = json.loads(json_line)
        actors.append(actor)
    except Exception:
        print("Error", json_line)
print(len(actors))
actors_data_frame = pandas.DataFrame(actors)
sorted_actors_data_frame = actors_data_frame.sort_values(by=["popularity"], ascending=False)
# sorted_actors_data_frame.to_csv(f"data/actors.csv", index=False, header=True)


async def get_movie_links(session, a: str, b: str):
    url = "https://oracleofbacon.org/movielinks.php"
    headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en,es;q=0.9,ko-KR;q=0.8,ko;q=0.7,vi-VN;q=0.6,vi;q=0.5",
        "Cache-Control": "max-age=0",
        "Connection": "keep-alive",
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://oracleofbacon.org",
        "Referer": "https://oracleofbacon.org/",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "sec-ch-ua": '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
    }
    payload = f"a={a}&b={b}&use_using=1&u0=on&use_role_types=1&rt0=on&company=&use_genres=1&g0=on&g4=on&g8=on&g12=on&g20=on&g24=on&g1=on&g5=on&g9=on&g13=on&g21=on&g25=on&g2=on&g10=on&g14=on&g18=on&g22=on&g26=on&g3=on&g7=on&g11=on&g15=on&g19=on&g27=on"
    try:
        async with session.post(url, headers=headers, data=payload, timeout=10) as response:
            text = await response.text()
            key = "number of "
            if key not in text:
                return {"actor_a": a, "actor_b": b, "links": "N/A"}
            substring_start_index = text.find(key)
            substring = text[substring_start_index : substring_start_index + 12]
            return {
                "actor_a": a,
                "actor_b": b,
                "links": substring.replace(key, "").replace(" ", ""),
            }
    except Exception:
        return {"actor_a": a, "actor_b": b, "links": "N/A"}


async def bound_get_movie_links(sem, session, actor_a, actor_b):
    # Getter function with semaphore.
    async with sem:
        return await get_movie_links(session, actor_a, actor_b)


actors_list = sorted_actors_data_frame.to_dict("records")
start = 800000
end = start + 100000
actors_list = actors_list[start:end]

limit = 1000

actor_a_name = "Kevin Bacon"


async def run():
    tasks = []
    semaphore = asyncio.Semaphore(limit)
    # Fetch all responses within one Client session,
    # keep connection alive for all requests.
    async with ClientSession() as session:
        for actor_b in tqdm_notebook(actors_list):
            actor_b_name = actor_b.get("name")
            task = asyncio.ensure_future(bound_get_movie_links(semaphore, session, actor_a_name, actor_b_name))
            tasks.append(task)
        for f in tqdm.asyncio.tqdm.as_completed(tasks):
            await f
        responses = await asyncio.gather(*tasks)
        links_data_frame = pandas.DataFrame(responses)
        links_data_frame.to_csv(f"data/links/{start}-{end}.csv", index=False, header=True)


nest_asyncio.apply()
loop = asyncio.get_event_loop()
loop.run_until_complete(run())
