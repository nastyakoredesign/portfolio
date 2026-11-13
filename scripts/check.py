#!/usr/bin/env python3
"""
Автоперевірка сайту. Запуск з кореня репо:  python3 scripts/check.py
Перед публікацією:                         python3 scripts/check.py --release
  (суворіше: href="#", href="#TBD-…" і файли, яких ще немає, — помилка навіть із check:ignore)

Без залежностей (лише Python 3), не змінює файли.
  ✗ помилка      — не можна казати «готово», доки не виправлено
  ⚠ попередження — подивись і виправ, або поясни, чому лишаєш
Свідомий виняток: додай у цей рядок CSS/HTML коментар  check:ignore
(і, якщо виняток системний, запис у лог рішень).
"""
import base64
import hashlib
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RELEASE = "--release" in sys.argv  # режим перед публікацією
UK_FROZEN = True  # рішення 19.10: перший реліз лише EN, uk/ заморожено. False — повернути перевірку EN ↔ UA
SKIP_DIRS = {".git", "docs", "node_modules", "scripts"}
# Заглушки, свідомо дозволені й у --release (рішення 10.11): посилання з тегом «Coming soon…»
RELEASE_OK = {"#TBD-skill"}  # скіл design review — публічна версія після запуску
SPACING_SCALE = {4, 8, 12, 16, 24, 32, 48, 64, 96, 128}  # як токени --space-N
VOID = {"meta", "link", "br", "img", "input", "hr", "source", "area", "base", "col", "embed", "track", "wbr"}

errors, warns = [], []


def rel(p):
    return p.relative_to(ROOT)


def err(p, n, msg):
    errors.append(f"✗ {rel(p)}:{n}  {msg}")


def warn(p, n, msg):
    warns.append(f"⚠ {rel(p)}:{n}  {msg}")


def files(pattern):
    return sorted(p for p in ROOT.rglob(pattern) if not SKIP_DIRS & set(rel(p).parts))


def blank_comments(s, pattern):
    """Заміняє коментарі пробілами, лишаючи переноси рядків (щоб номери рядків збігались)."""
    return re.sub(pattern, lambda m: re.sub(r"[^\n]", " ", m.group()), s, flags=re.S)


css_files, html_files, js_files = files("*.css"), files("*.html"), files("*.js")

# ---------------------------------------------------------------- CSS
defined, used = set(), []
for p in js_files:  # змінні, які JS ставить сам: setProperty('--x', …)
    defined |= set(re.findall(r"""['"]--([\w-]+)['"]""", p.read_text(encoding="utf-8")))

for p in css_files:
    raw = p.read_text(encoding="utf-8")
    defined |= set(re.findall(r"--([\w-]+)\s*:", raw))

for p in css_files:
    raw = p.read_text(encoding="utf-8")
    raw_lines = raw.splitlines()
    lines = blank_comments(raw, r"/\*.*?\*/").splitlines()
    code = "\n".join(lines)
    is_tokens = p.name.endswith("tokens.css")  # tokens.css і hero-flow-tokens.css (палітра демо-порталу)
    # Демо-портал у hero кейсу (1440 × 949) і демо CPD у Process (1440 × 1100) — сцени в px продукту,
    # масштабуються цілою (рішення 16.10 і 20.10): там не шукаємо відступи й шрифти з токенів сайту.
    # Кольори все одно лише з токенів.
    is_mock = p.name.startswith(("hero-flow", "cpd-demo"))

    if code.count("{") != code.count("}"):
        err(p, 1, f"не збігається кількість {{ ({code.count('{')}) і }} ({code.count('}')})")

    for i, line in enumerate(lines, 1):
        for m in re.finditer(r"var\(--([\w-]+)\s*([,)])", line):
            if m.group(2) == ")":  # без запасного значення
                used.append((p, i, m.group(1)))
        if "check:ignore" in raw_lines[i - 1]:
            continue

        if "prefers-color-scheme" in line:
            err(p, i, "темна тема — після запуску (рішення 02.10), не додавати prefers-color-scheme")
        if is_tokens:
            continue
        if "!important" in line and p.name != "base.css":
            err(p, i, "!important — зазвичай ознака хаосу в правилах; перепиши селектор")
        if re.search(r":\s*[^;{]*#[0-9a-fA-F]{3,8}\b", line):
            err(p, i, "колір числом (hex) — використай var(--color-…)")
        if re.search(r"\b(rgb|rgba|hsl|hsla)\(", line):
            warn(p, i, "колір через rgb()/hsl() — чи є для нього токен? Використай var(--color-…)")
        if is_mock:
            continue
        m = re.search(r"font-size\s*:\s*([^;]+)", line)
        if m and "var(" not in m.group(1) and m.group(1).strip() not in ("inherit", "initial", "unset"):
            warn(p, i, f"font-size '{m.group(1).strip()}' не з токена — var(--font-size-…)")
        for m in re.finditer(r"(?:^|[;{\s])(margin|padding|gap|row-gap|column-gap)(-[a-z]+)?\s*:\s*([^;}]+)", line):
            for num in re.findall(r"(?<![\w.])(\d*\.?\d+)px", m.group(3)):
                n = float(num)
                if n < 4:  # 0–3px: лінії, рамки, технічні дрібниці — токена немає
                    continue
                if n.is_integer() and int(n) in SPACING_SCALE:
                    warn(p, i, f"відступ {num}px числом — краще var(--space-{int(n)})")
                else:
                    warn(p, i, f"відступ {num}px немає в шкалі токенів (4, 8, 12, 16, 24, 32, 48, 64, 96, 128)")

for p, i, name in used:
    if name not in defined:
        err(p, i, f"var(--{name}) не визначена. дивись назви в assets/css/tokens.css")


# ---------------------------------------------------------------- HTML
class Scan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack, self.tags, self.ids = [], [], []
        self.h1 = self.main = 0
        self.lang = None
        self.links, self.inline, self.imgs, self.problems = [], [], [], []

    def handle_starttag(self, tag, attrs):
        a, ln = dict(attrs), self.getpos()[0]
        self.tags.append(tag)
        if tag not in VOID:
            self.stack.append((tag, ln))
        if tag == "html":
            self.lang = a.get("lang")
        if tag == "h1":
            self.h1 += 1
        if tag == "main":
            self.main += 1
        if "id" in a:
            self.ids.append((a["id"], ln))
        if "style" in a:
            self.inline.append(ln)
        if tag == "img":
            self.imgs.append((ln, a))
        for k in ("href", "src"):
            if k in a and a[k] is not None:
                self.links.append((a[k], ln))

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if self.stack and self.stack[-1][0] == tag:
            self.stack.pop()
        else:
            self.problems.append((self.getpos()[0], f"</{tag}> без відповідного відкриваючого тегу"))


scans = {}
for p in html_files:
    if UK_FROZEN and (ROOT / "uk") in p.parents:  # uk/ заморожено (19.10): не перевіряємо
        continue
    raw = p.read_text(encoding="utf-8")
    raw_lines = raw.splitlines()
    s = Scan()
    s.feed(raw)
    scans[p] = s
    skip = lambda n: "check:ignore" in raw_lines[n - 1]

    for ln, msg in s.problems:
        err(p, ln, msg)
    for tag, ln in s.stack:
        err(p, ln, f"тег <{tag}> не закрито")
    seen = {}
    for name, ln in s.ids:
        if name in seen:
            err(p, ln, f'id="{name}" повторюється (вперше в рядку {seen[name]})')
        seen[name] = ln
    for ln in s.inline:
        if not skip(ln):
            err(p, ln, 'style="…" в HTML — стилі лише в CSS-файлах')
    for ln, a in s.imgs:
        if "alt" not in a:
            err(p, ln, "<img> без alt (для декоративного — alt=\"\")")
        if "width" not in a or "height" not in a:
            warn(p, ln, "<img> без width/height — сторінка стрибатиме під час завантаження")
    for href, ln in s.links:
        if re.match(r"^(https?:|mailto:|tel:|data:|javascript:|//)", href):
            continue
        if href.startswith("#"):
            if href == "#" or href.startswith("#TBD"):  # заглушка: "#" або "#TBD-email" тощо
                if RELEASE and href not in RELEASE_OK:  # перед публікацією заглушка — помилка, check:ignore не рятує
                    err(p, ln, f'посилання-заглушка href="{href}" — перед публікацією потрібен справжній URL')
                elif not skip(ln):
                    warn(p, ln, f'посилання-заглушка href="{href}"')
            elif href[1:] not in seen:
                err(p, ln, f"посилання {href} веде на id, якого немає на цій сторінці")
            continue
        # 404.html — виняток (22.10): сервер віддає її за будь-якою адресою, тож шляхи від кореня (/assets/…)
        if href.startswith("/") and rel(p).as_posix() != "404.html":
            warn(p, ln, f"абсолютний шлях {href} — у нас відносні (../assets/…)")
        path = href.split("#")[0].split("?")[0]
        target = (ROOT / path.lstrip("/")) if path.startswith("/") else (p.parent / path)
        if path.endswith("/") or target.is_dir():
            target = target / "index.html"
        if not target.exists():
            if RELEASE or not skip(ln):  # check:ignore = «файл ще додамо» (як CV), але не на публікацію
                err(p, ln, f"файл не знайдено: {href}")
    parts = rel(p).parts
    if parts[0] in ("en", "uk"):
        if s.lang != parts[0]:
            err(p, 1, f'<html lang="{s.lang}"> у папці {parts[0]}/ — має бути "{parts[0]}"')
        if s.main != 1:
            err(p, 1, f"<main> має бути один, зараз {s.main}")
        if s.h1 != 1:
            warn(p, 1, f"<h1> має бути один на сторінку, зараз {s.h1} (поки каркас — ок)")
    if "Коренєв" in raw:  # прізвище: Кореневич (без «є»)
        err(p, 1, "прізвище кирилицею пишеться «Кореневич», не «Коренєвич»")
    left = len(re.findall(r"\[TBD\]|ДОПОВНИТИ", raw))
    if left:
        warn(p, 1, f"лишилось заглушок [TBD]/ДОПОВНИТИ: {left}")

# EN ↔ UA: однакова структура розмітки (поки uk/ заморожено — пропускаємо)
pages = {}
for p, s in ([] if UK_FROZEN else scans.items()):
    parts = rel(p).parts
    if parts[0] in ("en", "uk"):
        pages.setdefault("/".join(parts[1:]), {})[parts[0]] = (p, s)
for tail, langs in pages.items():
    if len(langs) == 1:
        lang, (p, _) = next(iter(langs.items()))
        err(p, 1, f"немає двомовної пари: {'uk' if lang == 'en' else 'en'}/{tail}")
        continue
    (pe, se), (pu, su) = langs["en"], langs["uk"]
    if se.tags != su.tags:
        n = next((k for k, (x, y) in enumerate(zip(se.tags, su.tags)) if x != y), min(len(se.tags), len(su.tags)))
        err(pu, 1, f"структура розмітки відрізняється від en/{tail} (перша різниця — тег №{n + 1}: "
                   f"en <{se.tags[n] if n < len(se.tags) else '—'}>, uk <{su.tags[n] if n < len(su.tags) else '—'}>)")
    if [i for i, _ in se.ids] != [i for i, _ in su.ids]:
        err(pu, 1, f'id відрізняються від en/{tail} — id у обох мовах мають бути однакові (на них ведуть посилання)')

# ---------------------------------------------------------------- CSP (vercel.json, рішення 11.11)
# Інлайн-скрипт виконується, лише якщо його хеш є в Content-Security-Policy.
# Змінили текст скрипту → новий хеш у vercel.json, інакше на сайті він мовчки не спрацює.
vercel = ROOT / "vercel.json"
csp = ""
if vercel.exists():
    csp = next((h["value"] for rule in json.loads(vercel.read_text(encoding="utf-8")).get("headers", [])
                for h in rule["headers"] if h["key"] == "Content-Security-Policy"), "")
    if not csp:
        err(vercel, 1, "немає заголовка Content-Security-Policy")
for p in html_files:
    if UK_FROZEN and rel(p).parts[0] == "uk":
        continue
    raw = p.read_text(encoding="utf-8")
    for m in re.finditer(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", raw, re.S):
        h = "sha256-" + base64.b64encode(hashlib.sha256(m.group(1).encode()).digest()).decode()
        if csp and f"'{h}'" not in csp:
            err(p, raw.count("\n", 0, m.start()) + 1, f"хешу інлайн-скрипту немає в CSP (vercel.json): '{h}'")
    for m in re.finditer(r"<[a-z][^>]*\son[a-z]+=", raw):
        err(p, raw.count("\n", 0, m.start()) + 1, "обробник on…= в HTML — CSP його заблокує, перенеси в assets/js/")

# ---------------------------------------------------------------- Шрифти лише з нашого сайту (рішення 13.11)
# Inter, JetBrains Mono і Commissioner лежать в assets/fonts/. Запит до Google Fonts — зайвий
# сторонній сервер, і CSP його однаково заблокує.
for p in html_files + css_files + js_files + [vercel]:
    if not p.exists() or (UK_FROZEN and rel(p).parts[0] == "uk"):
        continue
    for i, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
        if re.search(r"fonts\.(googleapis|gstatic)\.com", line) and "check:ignore" not in line:
            err(p, i, "Google Fonts — шрифти беремо з assets/fonts/ (@font-face у base.css)")

# ---------------------------------------------------------------- JS
for p in js_files:
    for i, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
        if "check:ignore" in line:
            continue
        if re.search(r"\b(alert|debugger)\b\s*\(?", line) and not line.strip().startswith("//"):
            err(p, i, "alert/debugger у коді")
        if "console.log(" in line:
            warn(p, i, "console.log лишився в коді")

# ---------------------------------------------------------------- Звіт
print(f"Перевірено: {len(html_files)} HTML, {len(css_files)} CSS, {len(js_files)} JS\n")
for m in errors + warns:
    print(m)
if not errors and not warns:
    print("✓ Все гаразд: помилок і попереджень немає.")
else:
    print(f"\n{len(errors)} помилок, {len(warns)} попереджень")
print("\nЦе лише автоматична частина. Збіг із Figma, клавіатуру й консоль браузера перевіряють окремо.")
sys.exit(1 if errors else 0)
