import requests, json, os, time

BASE = os.path.join("public", "sounds", "raid_gladiator")
os.makedirs(BASE, exist_ok=True)

lines = {
    "attack": "血祭りだ！その魂、切り裂いてやる！",
    "hit": "ははっ…まだまだ、こんなものじゃ倒せないぞ！",
    "defeat": "ありえん…この私が…敗れるとはな…",
    "blood_ritual": "赤き神に捧ぐ！この身が朽ちるまで戦え！"
}

speaker = 9  # 櫻歌ミコ，狂气女声

for action, text in lines.items():
    print(f"生成 raid_gladiator/{action}.wav ...")
    query = requests.post(
        "http://localhost:50021/audio_query",
        params={"text": text, "speaker": speaker}
    )
    syn = requests.post(
        "http://localhost:50021/synthesis",
        params={"speaker": speaker},
        data=json.dumps(query.json()),
        headers={"Content-Type": "application/json"}
    )
    with open(os.path.join(BASE, f"{action}.wav"), "wb") as f:
        f.write(syn.content)
    time.sleep(0.5)

print("角斗士·血斧 语音生成完毕！")