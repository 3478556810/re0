import json
from deep_translator import GoogleTranslator

with open('public/data/dlc/storyScript.json', 'r', encoding='utf-8') as f:
    story = json.load(f)

translator = GoogleTranslator(source='zh-CN', target='ja')
total = len(story)
current = 0

print(f"共 {total} 个节点，开始翻译...\n")

for node_id, node in story.items():
    current += 1
    text = node.get('text', '')
    if not text:
        print(f"[{current}/{total}] 跳过空节点: {node_id}")
        continue
    if node.get('text_ja'):
        print(f"[{current}/{total}] 已有翻译，跳过: {node_id}")
        continue

    try:
        ja_text = translator.translate(text)
        node['text_ja'] = ja_text
        print(f"[{current}/{total}] ✓ {text[:30]}... → {ja_text[:30]}...")
    except Exception as e:
        print(f"[{current}/{total}] ✗ 翻译失败: {text[:30]}... ({e})")
        node['text_ja'] = text

print("\n正在保存文件...")
with open('public/data/dlc/storyScript_ja.json', 'w', encoding='utf-8') as f:
    json.dump(story, f, ensure_ascii=False, indent=2)

print("翻译完成！保存至 storyScript_ja.json")